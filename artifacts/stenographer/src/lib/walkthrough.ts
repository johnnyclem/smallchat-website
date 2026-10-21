/**
 * The guided walk: thirteen moves on a sandbox ledger, each one an action
 * the engine either takes or refuses. The hero runs them on its own graph.
 */
import type { ActResponse } from "./ledger-client";
import type { Action } from "./truth/engine";
import type { Actor } from "./truth/types";

/** The cast. One person at the keyboard, and agent sessions that found things. */
export const YOU = "ada";
const CLAUDE_A: Actor = { by: "agent:claude-code", role: "agent", agentSessionId: "sess-7f3a" };
const CODEX: Actor = { by: "agent:codex", role: "agent", agentSessionId: "sess-2b8e" };
const GEMINI: Actor = { by: "agent:gemini", role: "agent", agentSessionId: "sess-9c1d" };
const CURSOR: Actor = { by: "agent:cursor", role: "agent", agentSessionId: "sess-4d2a" };
const KIM: Actor = { by: "kim", role: "human" };

export interface Step {
  title: string;
  /** What is about to happen, and why it matters. */
  lead: string;
  /** The action, given what the ledger holds so far. */
  action: (refs: Refs, you: Actor) => Action;
  /** Who acts, for the chip. */
  who: (you: Actor) => Actor;
  /** What the engine should answer; the demo keeps going either way. */
  expect: "ok" | "refused";
  /** Remember an id from the result under this name. */
  remember?: (r: ActResponse, refs: Refs) => void;
}

export type Refs = Record<string, string>;

const idOf = (r: ActResponse) => (r.ok ? (r.outcome as { id: string }).id : "");

export const STEPS: Step[] = [
  {
    title: "An agent notices something",
    lead: "Working in the repo, a Claude Code session sees that LOG_BUDGET changed. It can't declare that truth. It files an unverified assertion: a UV, with a basis and a way to check it.",
    who: () => CLAUDE_A,
    action: () => ({ type: "assert-uv", actor: CLAUDE_A, assertion: "LOG_BUDGET is 100; the old value 30 is dead.", basis: "config.ts was changed in the last commit", verifyBy: { kind: "inspect", value: "src/config.ts" }, literals: [{ subject: "LOG_BUDGET", dead: "30", current: "100" }] }),
    expect: "ok",
    remember: (r, refs) => (refs.uv = idOf(r)),
  },
  {
    title: "It tries to settle its own claim",
    lead: "The same agent, in a fresh session, approves what it drafted. Contempt of corpus: nobody approves what they wrote, by identity or by session. Three subagents affirming their parent is one opinion wearing three hats.",
    who: () => ({ ...CLAUDE_A, agentSessionId: "sess-b2c4" }),
    action: (refs) => ({ type: "approve", actor: { ...CLAUDE_A, agentSessionId: "sess-b2c4" }, id: refs.uv, evidence: [{ kind: "commit", ref: "9f2c1ab" }] }),
    expect: "refused",
  },
  {
    title: "Another agent agrees, with receipts",
    lead: "A Codex session checked it from a different angle and approves, citing the commit. An approval needs settling evidence: a commit, file, test, claimed command or ledger entry. A chat message would only raise a question.",
    who: () => CODEX,
    action: (refs) => ({ type: "approve", actor: CODEX, id: refs.uv, evidence: [{ kind: "commit", ref: "9f2c1ab", detail: "LOG_BUDGET = 100" }] }),
    expect: "ok",
  },
  {
    title: "Two more pile on",
    lead: "Gemini cites the file, Cursor will cite the test. Three sessions, disjoint evidence, two kinds between them: that nominates the UV. It is corroborated and goes first on the docket, and it is still not a TB. No number of agents mints one.",
    who: () => GEMINI,
    action: (refs) => ({ type: "approve", actor: GEMINI, id: refs.uv, evidence: [{ kind: "file", ref: "src/config.ts:12", detail: "LOG_BUDGET = 100" }] }),
    expect: "ok",
  },
  {
    title: "…and the third makes it a nomination",
    lead: "Cursor's approval completes the nomination: one ADDENDUM with a corroborates link, carrying the three sessions as its quorum, each with the evidence it brought.",
    who: () => CURSOR,
    action: (refs) => ({ type: "approve", actor: CURSOR, id: refs.uv, evidence: [{ kind: "test", ref: "test/config.test.ts", detail: "pins the budget at 100" }] }),
    expect: "ok",
  },
  {
    title: "A person approves",
    lead: "You read the receipts and approve. A person's approval with one other approver promotes the UV: the TB is signed by you, carries every approval and the union of their evidence, and names you as the one who answers for it.",
    who: (you) => you,
    action: (refs, you) => ({ type: "approve", actor: you, id: refs.uv, note: "The commit is in and the test pins it." }),
    expect: "ok",
    remember: (r, refs) => (refs.tb = r.ok ? (r.outcome as { tb: string }).tb : ""),
  },
  {
    title: "Someone challenges the TB",
    lead: "A Codex session finds a hotfix that put the old value back. It contests the TB with a UV. The TB goes under appeal: still truth, cited with the doubt, never grounds for a denial while the appeal is open.",
    who: () => CODEX,
    action: (refs) => ({ type: "assert-uv", actor: CODEX, assertion: "LOG_BUDGET went back to 30 in the hotfix.", basis: "the hotfix notes", verifyBy: { kind: "command", value: "grep LOG_BUDGET src/config.ts" }, contests: refs.tb }),
    expect: "ok",
    remember: (r, refs) => (refs.contest = idOf(r)),
  },
  {
    title: "The signer can't wave it away",
    lead: "You signed that TB, so you can't be the one to refute the appeal against it: refuting it would put your TB back to active on your own word. Someone else refutes it, approves it, or strikes it.",
    who: (you) => you,
    action: (refs, you) => ({ type: "refute", actor: you, id: refs.contest, evidence: [{ kind: "file", ref: "src/config.ts:12", detail: "still 100" }] }),
    expect: "refused",
  },
  {
    title: "Another person refutes it with evidence",
    lead: "Kim checks the file and refutes the contest, citing it. The UV is refuted, history now, and the TB returns to active. Every status change is an appended TRANSITION line. Nothing is edited.",
    who: () => KIM,
    action: (refs) => ({ type: "refute", actor: KIM, id: refs.contest, evidence: [{ kind: "file", ref: "src/config.ts:12", detail: "LOG_BUDGET = 100" }], note: "The hotfix never touched config.ts." }),
    expect: "ok",
  },
  {
    title: "A challenge that holds up",
    lead: "Later, Gemini contests again: the budget moved to 120. This time Cursor approves the contest with a commit, and Kim approves it. Approving a contest overrides the TB and mints its successor.",
    who: () => GEMINI,
    action: (refs) => ({ type: "assert-uv", actor: GEMINI, assertion: "LOG_BUDGET is 120 now; 100 is dead.", basis: "commit c0ffee1 raised it", verifyBy: { kind: "inspect", value: "src/config.ts" }, contests: refs.tb, literals: [{ subject: "LOG_BUDGET", dead: "100", current: "120" }] }),
    expect: "ok",
    remember: (r, refs) => (refs.contest2 = idOf(r)),
  },
  {
    title: "…an agent brings the commit",
    lead: "Cursor approves the new contest, citing the commit that raised it.",
    who: () => CURSOR,
    action: (refs) => ({ type: "approve", actor: CURSOR, id: refs.contest2, evidence: [{ kind: "commit", ref: "c0ffee1", detail: "LOG_BUDGET = 120" }] }),
    expect: "ok",
  },
  {
    title: "…and a person overrides the old TB",
    lead: "Kim's approval promotes the contest. The old TB is overridden, for good, and the successor supersedes it. The ledger keeps both: an overridden TB is history, never cited as support.",
    who: () => KIM,
    action: (refs) => ({ type: "approve", actor: KIM, id: refs.contest2 }),
    expect: "ok",
  },
  {
    title: "A strike",
    lead: "A stray claim with nothing behind it? A person strikes it with a written opinion. Struck is sticky: inadmissible, never deleted, the opinion on the record.",
    who: (you) => you,
    action: (refs, you) => ({ type: "strike", actor: you, id: refs.uv, opinion: "Superseded twice over; keeping the chain honest." }),
    expect: "ok",
  },
];

