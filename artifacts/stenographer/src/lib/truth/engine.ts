/**
 * The rules. One pure engine, run in the browser for the demo and in a
 * Vercel function for the public ledger, so a claim meets the same rigor in
 * both places:
 *
 * - Anyone makes an unverified claim (a UV), as a person or as an agent
 *   session. A UV may contest a TB; the TB goes under appeal and stays truth.
 * - Nobody writes a TB directly here. A UV becomes a TB by promotion: two
 *   approvals, one of them a person's, with evidence among them. The person
 *   signs the TB and answers for it. Three agent sessions approving from
 *   different angles nominate the UV; it stays open.
 * - Contempt of corpus: nobody approves or resolves what they drafted, by
 *   identity or by agent session; one session approves once.
 * - A person refutes a UV with evidence, and a person strikes an entry with
 *   a written opinion. An agent does neither: its verdict settles nothing.
 * - Every status change is an appended TRANSITION, never an edit.
 *
 * The sections cited in refusals are spec/truth-format/README.md and the
 * README of the stenographer repo.
 */

import { chainBodies } from "./chain.js";
import { fold, type Entry, type Fold } from "./fold.js";
import { identityKey, isAgentIdentity, requireIdentity, sameIdentity } from "./identity.js";
import { sha256Hex } from "./jcs.js";
import {
  EVIDENCE_KINDS,
  Refusal,
  SETTLING_EVIDENCE_KINDS,
  VERIFY_BY_KINDS,
  evidenceClass,
  type Actor,
  type ApprovalRecord,
  type Evidence,
  type Line,
  type LineBody,
  type Literal,
  type PendingApproval,
  type QuorumMember,
  type VerifyBy,
} from "./types.js";
import { ulid } from "./ulid.js";

export const ORIGIN = "stenographer.smallchat.dev";
export const NOMINATION_MIN_MEMBERS = 3;
const MAX_ID_LENGTH = 256;

/** Everything the engine reads: the stream, and the approvals waiting beside it. */
export interface LedgerState {
  lines: Line[];
  approvals: PendingApproval[];
}

export type Action =
  | { type: "assert-uv"; actor: Actor; assertion: string; basis: string; verifyBy: VerifyBy; contests?: string | null; literals?: Literal[] }
  | { type: "approve"; actor: Actor; id: string; evidence?: Evidence[]; note?: string | null }
  | { type: "refute"; actor: Actor; id: string; evidence: Evidence[]; note?: string | null }
  | { type: "strike"; actor: Actor; id: string; opinion: string };

export type Outcome =
  | { kind: "asserted"; id: string; contested: string | null }
  | { kind: "approved"; id: string; approvers: number; missing: Missing[] }
  | { kind: "nominated"; id: string; members: number }
  | { kind: "promoted"; id: string; tb: string; overrode: string | null }
  | { kind: "refuted"; id: string; upheld: string | null }
  | { kind: "struck"; id: string; released: string | null; withdrawn: boolean };

export type Missing = "a person's approval" | "a second approver" | "evidence";

export interface ActResult {
  outcome: Outcome;
  /** What the engine says happened, for a person. */
  message: string;
  /** The lines to append, chained after the state's head. */
  lines: Line[];
  /** Approvals to record beside the ledger. */
  newApprovals: PendingApproval[];
  /** Approvals a promotion wrote into a TB, and that TB. */
  consumed: { ids: string[]; by: string } | null;
}

// ── input ───────────────────────────────────────────────────────────────────

function text(value: unknown, field: string, max: number, min = 1): string {
  if (typeof value !== "string") throw new Refusal("input", `${field} is a string`, "Lines");
  const s = value.trim();
  if (s.length < min) throw new Refusal("input", `${field} cannot be blank`, "Lines");
  if (s.length > max) throw new Refusal("input", `${field} is at most ${max} characters`, "Lines");
  if (/\p{Cc}/u.test(s.replace(/[\n\t]/g, ""))) throw new Refusal("input", `${field} cannot contain control characters`, "Lines");
  return s;
}

export function parseEvidence(value: unknown, field = "evidence"): Evidence[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Refusal("input", `${field} is a list of {kind, ref, detail?}`, "Evidence classes");
  if (value.length > 8) throw new Refusal("input", `${field}: at most 8 items`, "Evidence classes");
  return value.map((item, i) => {
    if (!item || typeof item !== "object") throw new Refusal("input", `${field}[${i}] is {kind, ref, detail?}`, "Evidence classes");
    const { kind, ref, detail } = item as Record<string, unknown>;
    if (typeof kind !== "string" || !(EVIDENCE_KINDS as readonly string[]).includes(kind)) {
      throw new Refusal("input", `${field}[${i}].kind must be one of ${EVIDENCE_KINDS.join(", ")}`, "Evidence classes");
    }
    const out: Evidence = { kind, ref: text(ref, `${field}[${i}].ref`, 300) };
    if (detail !== undefined && detail !== null && detail !== "") out.detail = text(detail, `${field}[${i}].detail`, 1000);
    return out;
  });
}

export function parseVerifyBy(value: unknown): VerifyBy {
  if (!value || typeof value !== "object") throw new Refusal("input", "verifyBy is {kind, value, detail?}", "UV: an unverified assertion");
  const { kind, value: v, detail } = value as Record<string, unknown>;
  if (typeof kind !== "string" || !(VERIFY_BY_KINDS as readonly string[]).includes(kind)) {
    throw new Refusal("input", `verifyBy.kind must be one of ${VERIFY_BY_KINDS.join(", ")}`, "UV: an unverified assertion");
  }
  const out: VerifyBy = { kind, value: text(v, "verifyBy.value", 300) };
  if (detail !== undefined && detail !== null && detail !== "") out.detail = text(detail, "verifyBy.detail", 1000);
  return out;
}

export function parseLiterals(value: unknown): Literal[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new Refusal("input", "literals is a list of {dead, subject?, current?}", "TB: an asserted tombstone");
  if (value.length === 0) return undefined;
  if (value.length > 8) throw new Refusal("input", "literals: at most 8", "TB: an asserted tombstone");
  return value.map((item, i) => {
    if (!item || typeof item !== "object") throw new Refusal("input", `literals[${i}] is {dead, subject?, current?}`, "TB: an asserted tombstone");
    const { dead, subject, current } = item as Record<string, unknown>;
    const out: Literal = { dead: text(dead, `literals[${i}].dead`, 200) };
    if (out.dead !== (dead as string)) throw new Refusal("input", `literals[${i}].dead cannot have surrounding whitespace`, "TB: an asserted tombstone");
    if (subject !== undefined && subject !== null && subject !== "") out.subject = text(subject, `literals[${i}].subject`, 200);
    if (current !== undefined && current !== null && current !== "") out.current = text(current, `literals[${i}].current`, 200);
    if (!out.subject && (out.dead.length < 4 || !/[A-Za-z]/.test(out.dead))) {
      throw new Refusal("input", `literals[${i}]: without a subject, a dead literal is a distinctive identifier (4+ characters, a letter among them)`, "TB: an asserted tombstone");
    }
    return out;
  });
}

/** The actor as the ledger names them: a person by handle, an agent by `agent:` identity and session. */
export function resolveActor(raw: unknown): Actor {
  if (!raw || typeof raw !== "object") throw new Refusal("input", "actor is {by, role, agentSessionId?}", "Identities");
  const { by, role, agentSessionId } = raw as Record<string, unknown>;
  const identity = requireIdentity(by, "actor");
  if (role === "human") {
    if (isAgentIdentity(identity)) throw new Refusal("role", `'${identity}' is an agent identity and cannot act as a person`, "Identities");
    return { by: identity, role: "human", agentSessionId: null };
  }
  if (role === "agent") {
    if (!isAgentIdentity(identity)) throw new Refusal("role", `an agent's identity starts with 'agent:' (got '${identity}')`, "Identities");
    if (typeof agentSessionId !== "string" || !agentSessionId.trim()) throw new Refusal("input", "an agent names its session (agentSessionId)", "Agent quorum");
    const session = agentSessionId.trim();
    if (session.length > 100 || /\p{Cc}/u.test(session)) throw new Refusal("input", "agentSessionId is at most 100 characters, no control characters", "Agent quorum");
    return { by: identity, role: "agent", agentSessionId: session };
  }
  throw new Refusal("input", "role is 'human' or 'agent'", "Identities");
}

// ── helpers ─────────────────────────────────────────────────────────────────

function steno(links: Array<{ fromId: string; toId: string; type: string }>, agentSessionId: string | null = null) {
  return { origin: ORIGIN, provenance: { kind: "manual" }, agentSessionId, targetRef: null, links };
}

async function transitionId(causeId: string, target: string): Promise<string> {
  const id = `${causeId}:${target}`;
  return id.length > MAX_ID_LENGTH ? `transition:${await sha256Hex(id)}` : id;
}

async function transition(input: { ts: string; author: string; target: string; status: string; cause: { kind: string; ref: string } }): Promise<LineBody> {
  return { id: await transitionId(input.cause.ref, input.target), type: "TRANSITION", ts: input.ts, author: input.author, target: input.target, status: input.status, cause: input.cause };
}

function entrySession(entry: Entry): string | null {
  const s = (entry.line["x-steno"] as { agentSessionId?: string | null } | undefined)?.agentSessionId;
  return typeof s === "string" && s.trim() ? s.trim() : null;
}

/** The contempt rule: nobody resolves or approves what they drafted, by identity or by agent session. */
function assertIndependent(actor: Actor, entry: Entry, act: string): void {
  if (sameIdentity(actor.by, entry.line.author)) {
    throw new Refusal("contempt", `'${actor.by}' wrote ${entry.type} ${entry.id} and cannot ${act} it: nobody ${act}s what they drafted`, "Contempt of corpus");
  }
  const session = entrySession(entry);
  if (actor.agentSessionId && session && actor.agentSessionId === session) {
    throw new Refusal("contempt", `session ${session} drafted ${entry.type} ${entry.id} and cannot ${act} it: one session is one witness`, "Contempt of corpus");
  }
}

function requireEntry(f: Fold, id: unknown): Entry {
  if (typeof id !== "string") throw new Refusal("input", "id is a string", "Lines");
  const entry = f.entries.get(id);
  if (!entry) throw new Refusal("not-found", `no entry ${id} in this ledger`, "Lines");
  return entry;
}

function requireOpenUv(f: Fold, id: unknown): Entry {
  const entry = requireEntry(f, id);
  if (entry.type !== "UV") throw new Refusal("status", `${entry.id} is a TB, not a UV`, "Status is a fold");
  if (entry.status !== "open") throw new Refusal("status", `UV ${entry.id} is already ${entry.status}`, "Status is a fold");
  return entry;
}

/** The evidence key the quorum rules compare by (spec, Agent quorum, rule 3). */
export function evidenceKey(e: Evidence): string {
  let ref = e.ref.trim();
  if (e.kind === "commit") ref = ref.toLowerCase();
  else if (e.kind === "file") ref = ref.replace(/\\/g, "/").split("/").filter((seg, i) => (i === 0 ? true : seg !== "" && seg !== ".")).join("/");
  else if (e.kind === "test" || e.kind === "claimed-command") ref = ref.replace(/\s+/g, " ");
  return `${e.kind}|${ref}`;
}

function sameEvidence(a: Evidence, b: Evidence): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "commit") {
    const x = a.ref.trim().toLowerCase();
    const y = b.ref.trim().toLowerCase();
    return x.startsWith(y) || y.startsWith(x);
  }
  return evidenceKey(a) === evidenceKey(b);
}

function unionEvidence(lists: Evidence[][]): Evidence[] {
  const out: Evidence[] = [];
  for (const list of lists) for (const e of list) if (!out.some((o) => o.kind === e.kind && o.ref.trim() === e.ref.trim())) out.push(e);
  return out;
}

function approverKey(actor: Actor): string {
  return actor.role === "human" ? `human:${identityKey(actor.by)}` : `agent-session:${actor.agentSessionId}`;
}

/** A TB that was contested and has no other open contest goes back to active. */
async function releaseContest(f: Fold, uv: Entry, cause: { kind: "refute" | "strike"; ref: string }, ts: string, author: string): Promise<LineBody | null> {
  if (!uv.contests) return null;
  const tb = f.entries.get(uv.contests);
  if (!tb || tb.status !== "contested") return null;
  if (tb.contestedBy.some((id) => id !== uv.id)) return null;
  return transition({ ts, author, target: tb.id, status: "active", cause });
}

// ── the acts ────────────────────────────────────────────────────────────────

/** Run one action against the state. Throws a Refusal; never writes. */
export async function act(state: LedgerState, action: Action, now: number = Date.now()): Promise<ActResult> {
  const actor = resolveActor(action.actor);
  const f = fold(state.lines);
  const ts = new Date(now).toISOString();
  let result: { outcome: Outcome; message: string; bodies: LineBody[]; newApprovals: PendingApproval[]; consumed: ActResult["consumed"] };
  switch (action.type) {
    case "assert-uv":
      result = await assertUv(f, actor, action, ts, now);
      break;
    case "approve":
      result = await approve(state, f, actor, action, ts, now);
      break;
    case "refute":
      result = await refute(f, actor, action, ts, now);
      break;
    case "strike":
      result = await strike(f, actor, action, ts, now);
      break;
    default:
      throw new Refusal("input", "action is assert-uv, approve, refute or strike", "Lines");
  }
  const from = f.head ?? { seq: 0, hash: null };
  const lines = await chainBodies(result.bodies, from);
  return { outcome: result.outcome, message: result.message, lines, newApprovals: result.newApprovals, consumed: result.consumed };
}

async function assertUv(f: Fold, actor: Actor, input: Extract<Action, { type: "assert-uv" }>, ts: string, now: number) {
  const assertion = text(input.assertion, "assertion", 1000);
  const basis = text(input.basis, "basis", 1000);
  const verifyBy = parseVerifyBy(input.verifyBy);
  const literals = parseLiterals(input.literals);
  let contests: Entry | null = null;
  if (input.contests !== undefined && input.contests !== null && input.contests !== "") {
    const target = requireEntry(f, input.contests);
    if (target.type !== "TB") throw new Refusal("status", `${target.id} is a UV: a contest disputes a TB. Refute or approve a UV instead`, "UV: an unverified assertion");
    if (target.status !== "active" && target.status !== "contested") {
      throw new Refusal("status", `TB ${target.id} is ${target.status}: history, not truth. There is nothing to contest`, "Status is a fold");
    }
    contests = target;
  }
  const id = ulid(now);
  const links = contests ? [{ fromId: id, toId: contests.id, type: "contests" }] : [];
  const bodies: LineBody[] = [
    {
      id,
      type: "UV",
      ts,
      author: actor.by,
      assertion,
      basis,
      verifyBy,
      contests: contests ? contests.id : null,
      ...(literals ? { literals } : {}),
      status: "open",
      "x-steno": steno(links, actor.agentSessionId ?? null),
    },
  ];
  if (contests && contests.status === "active") {
    bodies.push(await transition({ ts, author: actor.by, target: contests.id, status: "contested", cause: { kind: "contest", ref: id } }));
  }
  const message = contests
    ? `UV ${id} filed. TB ${contests.id} is under appeal: still truth, cited with this contest, until a person resolves it.`
    : `UV ${id} filed as an open flag. It becomes a TB only when a person approves it and one other approver agrees.`;
  return { outcome: { kind: "asserted" as const, id, contested: contests?.id ?? null }, message, bodies, newApprovals: [], consumed: null };
}

/** Where a UV stands on its way to a TB. */
export interface ApprovalSummary {
  approvers: number;
  human: string | null;
  agentSessions: number;
  nominated: boolean;
  missing: Missing[];
}

export function summarizeApprovals(uv: Entry, approvals: PendingApproval[]): ApprovalSummary {
  const open = approvals.filter((a) => a.uvId === uv.id && a.consumedBy === null);
  const keys = new Set(open.map((a) => a.approverKey));
  const human = open.find((a) => a.role === "human");
  const agentSessions = new Set(open.filter((a) => a.role === "agent").map((a) => a.agentSessionId)).size;
  const missing: Missing[] = [];
  if (!human) missing.push("a person's approval");
  if (keys.size < 2) missing.push("a second approver");
  if (!open.some((a) => a.evidence.length > 0)) missing.push("evidence");
  return { approvers: keys.size, human: human?.by ?? null, agentSessions, nominated: uv.corroborated, missing };
}

async function approve(state: LedgerState, f: Fold, actor: Actor, input: Extract<Action, { type: "approve" }>, ts: string, now: number) {
  const uv = requireOpenUv(f, input.id);
  if (sameIdentity(actor.by, uv.line.author)) {
    throw new Refusal(
      "contempt",
      `'${actor.by}' wrote UV ${uv.id}. A claim is corroborated by someone else: approving your own would be one opinion wearing two hats. If you've changed your mind about it, withdraw it instead`,
      "Contempt of corpus",
      { kind: "withdraw", id: uv.id }
    );
  }
  assertIndependent(actor, uv, "approve");
  const evidence = parseEvidence(input.evidence);
  const note = input.note === undefined || input.note === null || input.note === "" ? null : text(input.note, "note", 1000);
  if (actor.role === "agent" && !evidence.some((e) => evidenceClass(e.kind) === "settling")) {
    throw new Refusal(
      "evidence",
      `an agent approves only with settling evidence of its own (${SETTLING_EVIDENCE_KINDS.join(", ")}). Message, chat, ticket and doc evidence can raise a question, never settle one`,
      "Evidence classes"
    );
  }
  const key = approverKey(actor);
  const open = state.approvals.filter((a) => a.uvId === uv.id && a.consumedBy === null);
  if (open.some((a) => a.approverKey === key)) {
    throw new Refusal("duplicate", actor.role === "human" ? `'${actor.by}' already approved UV ${uv.id}` : `session ${actor.agentSessionId} already approved UV ${uv.id}: a session approves once`, "Approvals and promotion");
  }
  const approval: PendingApproval = {
    id: ulid(now),
    uvId: uv.id,
    by: actor.by,
    role: actor.role,
    agentSessionId: actor.agentSessionId ?? null,
    approverKey: key,
    evidence,
    note,
    ts,
    consumedBy: null,
  };
  const all = [...open, approval].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  const summary = summarizeApprovals(uv, all);

  // Promotion: a person's approval and one other approver, with evidence among them.
  if (summary.missing.length === 0) {
    const human = all.find((a) => a.role === "human")!;
    const tbId = ulid(now + 1);
    const contested = uv.contests ? f.entries.get(uv.contests) ?? null : null;
    const overrides = contested && (contested.status === "active" || contested.status === "contested") ? contested.id : null;
    const union = unionEvidence(all.map((a) => a.evidence));
    const addendumId = ulid(now);
    const links: Array<{ fromId: string; toId: string; type: string }> = [{ fromId: addendumId, toId: uv.id, type: "verifies" }];
    if (overrides) links.push({ fromId: addendumId, toId: overrides, type: "overrides" });
    const others = summary.approvers - 1;
    const approvals: ApprovalRecord[] = all.map((a) => ({
      by: a.by,
      role: a.role,
      ts: a.ts,
      ...(a.agentSessionId ? { agentSessionId: a.agentSessionId } : {}),
    }));
    const bodies: LineBody[] = [
      {
        id: addendumId,
        type: "ADDENDUM",
        ts,
        author: human.by,
        evidence: union,
        note: human.note ?? `Approved by ${human.by} with ${others} other approval${others === 1 ? "" : "s"}.`,
        "x-steno": steno(links),
      },
      await transition({ ts, author: human.by, target: uv.id, status: "verified", cause: { kind: "verify", ref: addendumId } }),
    ];
    if (overrides) bodies.push(await transition({ ts, author: human.by, target: overrides, status: "overridden", cause: { kind: "override", ref: addendumId } }));
    const claim = overrides ? `Overridden: "${contested!.line.claim as string}" — contradicted by verified assertion: ${uv.line.assertion as string}` : (uv.line.assertion as string);
    const literals = Array.isArray(uv.line.literals) && uv.line.literals.length > 0 ? uv.line.literals : undefined;
    bodies.push({
      id: tbId,
      type: "TB",
      ts,
      author: human.by,
      claim,
      evidence: union,
      signedBy: human.by,
      answerableBy: human.by,
      ...(literals ? { literals } : {}),
      approvals,
      status: "active",
      "x-steno": steno([{ fromId: tbId, toId: uv.id, type: "supersedes" }]),
    });
    const message = overrides
      ? `Promoted. ${human.by} signed TB ${tbId} and answers for it; TB ${overrides} is overridden and this one supersedes it.`
      : `Promoted. ${human.by} signed TB ${tbId} and answers for it. ${summary.approvers} approvers, ${union.length} evidence item${union.length === 1 ? "" : "s"}.`;
    return {
      outcome: { kind: "promoted" as const, id: uv.id, tb: tbId, overrode: overrides },
      message,
      bodies,
      newApprovals: [approval],
      consumed: { ids: all.map((a) => a.id), by: tbId },
    };
  }

  // Nomination: three agent sessions from different angles. The UV stays open.
  if (actor.role === "agent" && !uv.corroborated) {
    const members = chooseNomination(all.filter((a) => a.role === "agent"), approval);
    if (members) {
      const quorum: QuorumMember[] = members.map((m) => ({ author: m.by, agentSessionId: m.agentSessionId!, ts: m.ts, evidence: m.evidence, verdict: "verified" }));
      const addendumId = ulid(now);
      const bodies: LineBody[] = [
        {
          id: addendumId,
          type: "ADDENDUM",
          ts,
          author: actor.by,
          evidence: unionEvidence(members.map((m) => m.evidence)),
          note: `Nominated by ${members.length} agent sessions for a person's review.`,
          quorum,
          "x-steno": steno([{ fromId: addendumId, toId: uv.id, type: "corroborates" }], actor.agentSessionId ?? null),
        },
      ];
      return {
        outcome: { kind: "nominated" as const, id: uv.id, members: members.length },
        message: `Nominated. ${members.length} agent sessions agree from different angles, so UV ${uv.id} is corroborated and goes first on the docket. It is still a UV: flag, don't block. A person's approval promotes it.`,
        bodies,
        newApprovals: [approval],
        consumed: null,
      };
    }
  }

  const needs = summary.missing.join(", ");
  const message =
    actor.role === "human"
      ? `Approved by ${actor.by}. A person alone promotes nothing: promotion still needs ${needs}.`
      : `Approved by session ${actor.agentSessionId}. An agent's approval promotes nothing: it still needs ${needs}.`;
  return { outcome: { kind: "approved" as const, id: uv.id, approvers: summary.approvers, missing: summary.missing }, message, bodies: [], newApprovals: [approval], consumed: null };
}

/**
 * The members of a nomination, or null (spec, Nomination): three or more
 * agent sessions, the writer among them, each with settling evidence no
 * other member cites in any spelling, spanning two settling kinds between
 * them. Greedy, oldest first, the writer placed first so rule 2 holds.
 */
function chooseNomination(agentApprovals: PendingApproval[], writer: PendingApproval): PendingApproval[] | null {
  const ordered = [writer, ...agentApprovals.filter((a) => a.id !== writer.id)];
  const chosen: PendingApproval[] = [];
  for (const candidate of ordered) {
    const settling = candidate.evidence.filter((e) => evidenceClass(e.kind) === "settling");
    if (settling.length === 0) continue;
    if (chosen.some((m) => m.agentSessionId === candidate.agentSessionId)) continue;
    const shares = chosen.some((m) => m.evidence.some((a) => candidate.evidence.some((b) => sameEvidence(a, b))));
    if (shares) continue;
    chosen.push(candidate);
  }
  if (chosen.length < NOMINATION_MIN_MEMBERS) return null;
  const kinds = new Set(chosen.flatMap((m) => m.evidence.filter((e) => evidenceClass(e.kind) === "settling").map((e) => e.kind)));
  if (kinds.size < 2) return null;
  return chosen.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
}

async function refute(f: Fold, actor: Actor, input: Extract<Action, { type: "refute" }>, ts: string, now: number) {
  if (actor.role !== "human") {
    throw new Refusal("role", "an agent's refuted verdict settles nothing: on this ledger a person refutes, with evidence. Approve it instead if you have settling evidence for it", "Approvals and promotion");
  }
  const uv = requireOpenUv(f, input.id);
  if (sameIdentity(actor.by, uv.line.author)) {
    throw new Refusal(
      "contempt",
      `'${actor.by}' wrote UV ${uv.id}. A refutation is someone else's evidence against a claim, so it can't come from its author. Realised you were wrong? Withdraw it: strike it with a note saying why. The claim stays on the record, marked struck, and you can file a corrected one`,
      "Contempt of corpus",
      { kind: "withdraw", id: uv.id }
    );
  }
  assertIndependent(actor, uv, "refute");
  const evidence = parseEvidence(input.evidence);
  if (evidence.length === 0) throw new Refusal("evidence", "a refutation cites at least one piece of evidence", "ADDENDUM and RULING");
  const note = input.note === undefined || input.note === null || input.note === "" ? null : text(input.note, "note", 1000);
  if (uv.contests) {
    const tb = f.entries.get(uv.contests);
    if (tb && (sameIdentity(tb.line.author, actor.by) || sameIdentity(tb.line.signedBy as string, actor.by))) {
      throw new Refusal(
        "contempt",
        `'${actor.by}' stands behind TB ${tb.id} and cannot refute the appeal against it. Someone else refutes it, approves it (which overrides the TB), or strikes it with an opinion`,
        "Contempt of corpus"
      );
    }
  }
  const addendumId = ulid(now);
  const bodies: LineBody[] = [
    { id: addendumId, type: "ADDENDUM", ts, author: actor.by, evidence, note, "x-steno": steno([{ fromId: addendumId, toId: uv.id, type: "refutes" }]) },
    await transition({ ts, author: actor.by, target: uv.id, status: "refuted", cause: { kind: "refute", ref: addendumId } }),
  ];
  const release = await releaseContest(f, uv, { kind: "refute", ref: addendumId }, ts, actor.by);
  if (release) bodies.push(release);
  const upheld = release ? (release.target as string) : null;
  const message = upheld
    ? `Refuted by ${actor.by}. The appeal is closed and TB ${upheld} is active again.`
    : `Refuted by ${actor.by}. UV ${uv.id} is history now: never cited as support.`;
  return { outcome: { kind: "refuted" as const, id: uv.id, upheld }, message, bodies, newApprovals: [], consumed: null };
}

async function strike(f: Fold, actor: Actor, input: Extract<Action, { type: "strike" }>, ts: string, now: number) {
  if (actor.role !== "human") throw new Refusal("role", "striking is a person's ruling. Agents never strike, together or alone", "ADDENDUM and RULING");
  const entry = requireEntry(f, input.id);
  if (entry.status === "struck") throw new Refusal("status", `${entry.type} ${entry.id} is already struck`, "Status is a fold");
  const opinion = text(input.opinion, "opinion", 2000);
  const rulingId = ulid(now);
  const bodies: LineBody[] = [
    { id: rulingId, type: "RULING", ts, author: actor.by, kind: "strike", opinion, target: entry.id, answerableBy: actor.by, "x-steno": steno([{ fromId: rulingId, toId: entry.id, type: "strikes" }]) },
    await transition({ ts, author: actor.by, target: entry.id, status: "struck", cause: { kind: "strike", ref: rulingId } }),
  ];
  let released: string | null = null;
  if (entry.type === "UV" && entry.status === "open") {
    const release = await releaseContest(f, entry, { kind: "strike", ref: rulingId }, ts, actor.by);
    if (release) {
      bodies.push(release);
      released = release.target as string;
    }
  }
  const withdrawn = sameIdentity(actor.by, entry.line.author);
  const message = withdrawn
    ? `Withdrawn by ${actor.by}, with the reason on the record. ${entry.type} ${entry.id} stays in the chain, marked struck${released ? `, and TB ${released} is active again` : ""}. File a corrected claim if there is one.`
    : released
      ? `Struck by ${actor.by}, with an opinion on the record. TB ${released} is active again.`
      : `Struck by ${actor.by}, with an opinion on the record. ${entry.type} ${entry.id} is inadmissible, never deleted.`;
  return { outcome: { kind: "struck" as const, id: entry.id, released, withdrawn }, message, bodies, newApprovals: [], consumed: null };
}

/** Apply a result to a state: the next state, as the server stores it. */
export function applyResult(state: LedgerState, result: ActResult): LedgerState {
  const consumed = new Set(result.consumed?.ids ?? []);
  const approvals = state.approvals.map((a) => (consumed.has(a.id) ? { ...a, consumedBy: result.consumed!.by } : a));
  for (const a of result.newApprovals) approvals.push(consumed.has(a.id) ? { ...a, consumedBy: result.consumed!.by } : a);
  return { lines: [...state.lines, ...result.lines], approvals };
}
