/**
 * The hash chain (spec/truth-format, "Streams"): every line carries `seq`,
 * `prevHash` and `hash` (SHA-256 over its JCS form without `hash`). This
 * module chains bodies after a tail, checks a stream, and validates the
 * shape of a line this ledger writes. The structural check is the writer's
 * own conscience: a line it would refuse is a bug in the engine, never a
 * line in the ledger. `verifyChain` is what the browser's verify button and
 * the API's self-check run.
 */

import { identityIssue } from "./identity.js";
import { canonicalize, sha256Hex } from "./jcs.js";
import { CAUSE_KINDS, HEX64, ID_PATTERN, TB_STATUSES, UV_STATUSES, isRfc3339DateTime, type Line, type LineBody } from "./types.js";

export interface ChainProblem {
  seq: number | null;
  id: string | null;
  error: string;
}

/** sha256hex(JCS(line without `hash`)). */
export async function lineHash(line: Record<string, unknown>): Promise<string> {
  const { hash: _hash, ...rest } = line;
  return sha256Hex(canonicalize(rest));
}

/** Chain bodies after `from` (seq 0 and a null hash before the first line). */
export async function chainBodies(bodies: LineBody[], from: { seq: number; hash: string | null }): Promise<Line[]> {
  let seq = from.seq;
  let prevHash = from.hash;
  const out: Line[] = [];
  for (const body of bodies) {
    const { id, type, ts, author, ...rest } = body;
    const unhashed = { schemaVersion: 2 as const, seq: ++seq, id, type, ts, author, ...rest, prevHash };
    const hash = await lineHash(unhashed);
    const line = { ...unhashed, hash } as Line;
    const issue = lineIssue(line);
    if (issue) throw new Error(`the ${type} line would not conform to the truth format: ${issue}`);
    out.push(line);
    prevHash = hash;
  }
  return out;
}

const OUTBOUND: Record<string, string[]> = { TB: ["supersedes", "signs", "derives"], UV: ["contests", "signs", "derives"] };
const INBOUND: Record<string, string[]> = {
  TB: ["overrides", "contests", "supersedes", "strikes"],
  UV: ["verifies", "refutes", "supersedes", "strikes", "corroborates"],
};

function isEvidence(v: unknown): boolean {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as { kind?: unknown }).kind === "string" &&
    (v as { kind: string }).kind.length > 0 &&
    typeof (v as { ref?: unknown }).ref === "string" &&
    (v as { ref: string }).ref.length > 0
  );
}

/** Why a line's envelope breaks the format, or null: what every reader checks of any writer's line. */
export function envelopeIssue(raw: unknown): string | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "a line is a JSON object";
  const line = raw as Record<string, unknown>;
  if (line.schemaVersion !== 2) return "schemaVersion must be 2";
  if (!Number.isInteger(line.seq) || (line.seq as number) < 1) return "seq is a positive integer";
  if (typeof line.id !== "string" || !ID_PATTERN.test(line.id)) return "an id is 1–256 characters: letters, digits, . _ : -";
  if (typeof line.ts !== "string" || !isRfc3339DateTime(line.ts)) return "ts must be an RFC 3339 date-time naming a real time";
  if (typeof line.hash !== "string" || !HEX64.test(line.hash)) return "a hash is 64 lowercase hex digits";
  if (line.prevHash !== null && (typeof line.prevHash !== "string" || !HEX64.test(line.prevHash))) return "prevHash is a hash or null";
  if ((line.seq === 1) !== (line.prevHash === null)) return "prevHash is null on the first line of a stream (seq 1), and only there";
  if (typeof line.author !== "string") return "author is a string";
  if (!["TB", "UV", "ADDENDUM", "RULING", "PROPOSAL", "TRANSITION"].includes(line.type as string)) return `unknown line type ${String(line.type)}`;
  return null;
}

/** Why a line this ledger is about to write breaks the format, or null: the writer's own conscience, stricter than a reader. */
export function lineIssue(raw: unknown): string | null {
  const envelope = envelopeIssue(raw);
  if (envelope) return envelope;
  const line = raw as Record<string, unknown>;
  const authorIssue = identityIssue(line.author);
  if (authorIssue) return `author: ${authorIssue}`;
  const steno = line["x-steno"] as { links?: unknown } | undefined;
  const links = (steno?.links ?? []) as Array<{ fromId: string; toId: string; type: string }>;
  if (!Array.isArray(links)) return "x-steno.links is a list";
  const keys = links.map((l) => `${l.fromId}|${l.toId}|${l.type}`);
  if (new Set(keys).size !== keys.length) return "a line lists each link once";
  switch (line.type) {
    case "TB": {
      if (typeof line.claim !== "string" || !line.claim) return "a TB states its claim";
      if (!Array.isArray(line.evidence) || line.evidence.length === 0 || !line.evidence.every(isEvidence)) return "a TB requires at least one piece of evidence";
      if (typeof line.signedBy !== "string" || identityIssue(line.signedBy)) return "a TB this ledger writes is signed by a person";
      if (typeof line.answerableBy !== "string") return "a TB a person signed names who answers for it";
      if (!(TB_STATUSES as readonly string[]).includes(line.status as string)) return "a TB's status is active, contested, overridden or struck";
      if (line.literals !== undefined && (!Array.isArray(line.literals) || line.literals.length === 0)) return "omit literals rather than send none";
      break;
    }
    case "UV": {
      if (typeof line.assertion !== "string" || !line.assertion) return "a UV states its assertion";
      if (typeof line.basis !== "string" || !line.basis) return "a UV states its basis";
      const vb = line.verifyBy as { kind?: unknown; value?: unknown } | undefined;
      if (!vb || typeof vb.kind !== "string" || typeof vb.value !== "string" || !vb.value) return "a UV carries a verifyBy hint";
      if (line.contests !== null && (typeof line.contests !== "string" || !ID_PATTERN.test(line.contests))) return "contests is a TB id or null";
      if (!(UV_STATUSES as readonly string[]).includes(line.status as string)) return "a UV's status is open, verified, refuted or struck";
      const contestLinks = links.filter((l) => l.type === "contests" && l.fromId === line.id);
      if (line.contests && !contestLinks.some((l) => l.toId === line.contests)) return "a UV that contests a TB lists its contests link";
      if (contestLinks.some((l) => l.toId !== line.contests)) return "a contests link points at the TB the contests field names";
      break;
    }
    case "ADDENDUM": {
      if (!Array.isArray(line.evidence) || line.evidence.length === 0 || !line.evidence.every(isEvidence)) return "an addendum requires at least one piece of evidence";
      if (line.note !== null && typeof line.note !== "string") return "note is a string or null";
      break;
    }
    case "RULING": {
      if (typeof line.kind !== "string" || !line.kind) return "a ruling names its kind";
      if (typeof line.opinion !== "string" || !line.opinion.trim()) return "a ruling carries a written opinion";
      if (typeof line.target !== "string" || !ID_PATTERN.test(line.target)) return "a ruling names its target";
      break;
    }
    case "TRANSITION": {
      if (typeof line.target !== "string" || !ID_PATTERN.test(line.target)) return "a transition names its target";
      if (typeof line.status !== "string") return "a transition names the new status";
      const cause = line.cause as { kind?: unknown; ref?: unknown } | undefined;
      if (!cause || !(CAUSE_KINDS as readonly string[]).includes(cause.kind as string)) return "a transition's cause is contest, override, strike, verify or refute";
      if (cause.ref !== null && typeof cause.ref !== "string") return "a transition's cause names the entry that caused it";
      break;
    }
    default:
      return `unknown line type ${String(line.type)}`;
  }
  if (line.type === "TB" || line.type === "UV") {
    for (const l of links) {
      const own = (l.fromId === line.id && OUTBOUND[line.type].includes(l.type)) || (l.toId === line.id && l.fromId !== line.id && INBOUND[line.type].includes(l.type));
      if (!own) return `a ${line.type} line cannot carry the link ${l.fromId} -${l.type}-> ${l.toId}`;
    }
  } else if (line.type === "ADDENDUM" || line.type === "RULING") {
    if (links.some((l) => l.fromId !== line.id)) return `a ${line.type} lists only the links it writes`;
  }
  return null;
}

/** Re-checks every hash and the chain of a stream, in order. Empty when the stream holds. */
export async function verifyChain(lines: Array<Record<string, unknown>>): Promise<ChainProblem[]> {
  const problems: ChainProblem[] = [];
  let prev: { seq: number; hash: string } | null = null;
  for (const line of lines) {
    const seq = typeof line.seq === "number" ? line.seq : null;
    const id = typeof line.id === "string" ? line.id : null;
    const issue = envelopeIssue(line);
    if (issue) {
      problems.push({ seq, id, error: issue });
      return problems;
    }
    const hash = await lineHash(line);
    if (hash !== line.hash) {
      problems.push({ seq, id, error: `hash does not match its line (expected ${hash.slice(0, 12)}…)` });
      return problems;
    }
    if (prev) {
      if (line.seq !== prev.seq + 1) problems.push({ seq, id, error: `seq ${line.seq} does not follow ${prev.seq}` });
      if (line.prevHash !== prev.hash) problems.push({ seq, id, error: "prevHash is not the previous line's hash" });
      if (problems.length > 0) return problems;
    }
    prev = { seq: line.seq as number, hash: line.hash as string };
  }
  return problems;
}
