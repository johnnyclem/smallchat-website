/**
 * The choose-your-own explainer: a handful of scenes on a sandbox ledger,
 * each offering real moves. Every move runs through the engine, so a trap
 * is refused for the same reason the public ledger would refuse it, and
 * the story goes where the rules let it. Who files the first claim decides
 * who can't approve it later; a refuted or struck claim ends one path and
 * opens another.
 */
import type { Action } from "./truth/engine";
import type { Actor, Evidence } from "./truth/types";

export const YOU: Actor = { by: "ada", role: "human" };
const KIM: Actor = { by: "kim", role: "human" };
const CLAUDE: Actor = { by: "agent:claude-code", role: "agent", agentSessionId: "sess-7f3a" };
const CLAUDE_B: Actor = { ...CLAUDE, agentSessionId: "sess-b2c4" };
const CODEX: Actor = { by: "agent:codex", role: "agent", agentSessionId: "sess-2b8e" };
const GEMINI: Actor = { by: "agent:gemini", role: "agent", agentSessionId: "sess-9c1d" };
const GEMINI_B: Actor = { ...GEMINI, agentSessionId: "sess-e1f0" };
const CURSOR: Actor = { by: "agent:cursor", role: "agent", agentSessionId: "sess-4d2a" };

const COMMIT: Evidence[] = [{ kind: "commit", ref: "9f2c1ab", detail: "LOG_BUDGET = 100" }];
const FILE: Evidence[] = [{ kind: "file", ref: "src/config.ts:12", detail: "LOG_BUDGET = 100" }];
const TEST: Evidence[] = [{ kind: "test", ref: "test/config.test.ts", detail: "pins the budget at 100" }];
const HOTFIX: Evidence[] = [{ kind: "file", ref: "src/config.ts:12", detail: "still 100 after the hotfix" }];
const RAISE: Evidence[] = [{ kind: "commit", ref: "c0ffee1", detail: "LOG_BUDGET = 120" }];

/** What the story remembers: ids of the entries it made, and who made the claim. */
export type Refs = Record<string, string>;

export interface Choice {
  label: string;
  /** One line under the label: what this move is, or why it's tempting. */
  hint?: string;
  who?: Actor;
  /** The moves to run, in order; the first refusal stops the rest. Absent on a dead end. */
  run?: (refs: Refs) => Action[];
  /** A dead end: no such move exists. Shown instead of running anything. */
  deadEnd?: string;
  /** Remember ids from the results, by move index. */
  remember?: (refs: Refs, ids: Array<string | null>) => void;
  /** Where the story goes when every move lands; stays put when absent. */
  next?: string;
  /** Where it goes when a move is refused; stays put when absent. */
  nextIfRefused?: string;
  /** Offer this choice only when it fits the story so far. */
  when?: (refs: Refs) => boolean;
  /** What a reader should learn from it, shown once it ran. */
  lesson?: string;
}

export interface Scene {
  id: string;
  title: string;
  lead: string;
  choices: Choice[];
  /** The story is over here: offer free play and the live ledger. */
  terminal?: boolean;
}

const claimAction = (actor: Actor): Action => ({
  type: "assert-uv",
  actor,
  assertion: "LOG_BUDGET is 100; the old value 30 is dead.",
  basis: "config.ts was changed in the last commit",
  verifyBy: { kind: "inspect", value: "src/config.ts" },
  literals: [{ subject: "LOG_BUDGET", dead: "30", current: "100" }],
});

export const SCENES: Record<string, Scene> = {
  start: {
    id: "start",
    title: "Something changed in the repo",
    lead: "LOG_BUDGET went from 30 to 100 in the last commit. The old value is dead, and the ledger doesn't know yet. Who says so first?",
    choices: [
      {
        label: "A Claude Code session files the claim",
        hint: "An agent's claim is a UV: believed, unverified, flagged.",
        who: CLAUDE,
        run: () => [claimAction(CLAUDE)],
        remember: (refs, ids) => {
          refs.uv = ids[0] ?? "";
          refs.author = "agent";
        },
        next: "claimed",
        lesson: "An agent can draft and assert. It can't declare truth.",
      },
      {
        label: "You file it yourself, as ada",
        hint: "A person's claim is a UV too. Nobody skips the queue.",
        who: YOU,
        run: () => [claimAction(YOU)],
        remember: (refs, ids) => {
          refs.uv = ids[0] ?? "";
          refs.author = "ada";
        },
        next: "claimed",
        lesson: "A person's claim starts as a UV as well. Remember who filed it.",
      },
      {
        label: "Declare it truth right now",
        hint: "Skip the UV. Write the TB.",
        deadEnd: "There is no such move. This ledger has no path that writes a TB directly: a TB comes only from promotion, a person's approval plus one other approver, with evidence among them. Pick who files the claim.",
      },
    ],
  },
  claimed: {
    id: "claimed",
    title: "A UV is on the record. Who weighs in?",
    lead: "It's a flag, not truth: cite it with an asterisk, never block on it. To become a TB it needs a person's approval and one other approver who brings evidence.",
    choices: [
      {
        label: "The same agent approves it from a fresh session",
        hint: "New session, same identity. Surely that counts?",
        who: CLAUDE_B,
        when: (refs) => refs.author === "agent",
        run: (refs) => [{ type: "approve", actor: CLAUDE_B, id: refs.uv, evidence: COMMIT }],
        lesson: "Contempt of corpus: nobody approves what they drafted, by identity or by session.",
      },
      {
        label: "You approve your own claim",
        hint: "You filed it. You're sure. Approve it.",
        who: YOU,
        when: (refs) => refs.author === "ada",
        run: (refs) => [{ type: "approve", actor: YOU, id: refs.uv }],
        lesson: "A claim is corroborated by someone else. Your own approval is one opinion wearing two hats.",
      },
      {
        label: "Codex approves, citing the commit",
        hint: "A different agent, settling evidence of its own.",
        who: CODEX,
        run: (refs) => [{ type: "approve", actor: CODEX, id: refs.uv, evidence: COMMIT }],
        next: "one-agent",
        lesson: "An agent approves only with settling evidence: commit, file, test, claimed command or ledger entry.",
      },
      {
        label: "Kim refutes it with a file reference",
        hint: "Kim read config.ts and says the claim is wrong.",
        who: KIM,
        run: (refs) => [{ type: "refute", actor: KIM, id: refs.uv, evidence: [{ kind: "file", ref: "src/config.ts:12", detail: "LOG_BUDGET = 30" }], note: "config.ts still says 30 on main" }],
        next: "refuted",
        lesson: "A person refutes with evidence. The UV is history: never cited as support.",
      },
    ],
  },
  "one-agent": {
    id: "one-agent",
    title: "One agent agrees. Not truth yet.",
    lead: "Codex's approval waits beside the ledger. It promotes nothing alone. Who else?",
    choices: [
      {
        label: "Two more agents pile on: Gemini cites the file, Cursor the test",
        hint: "Three sessions, disjoint evidence, two kinds between them.",
        who: CURSOR,
        run: (refs) => [
          { type: "approve", actor: GEMINI, id: refs.uv, evidence: FILE },
          { type: "approve", actor: CURSOR, id: refs.uv, evidence: TEST },
        ],
        next: "nominated",
        lesson: "Three agents from different angles nominate the UV. It's corroborated, first on the docket, and still a UV.",
      },
      {
        label: "A person approves it now",
        hint: "A person plus Codex: that's a promotion.",
        who: YOU,
        run: (refs) => [{ type: "approve", actor: refs.author === "ada" ? KIM : YOU, id: refs.uv, note: "The commit is in." }],
        remember: (refs, ids) => {
          refs.tb = ids[0] ?? "";
          refs.signer = refs.author === "ada" ? "kim" : "ada";
        },
        next: "truth",
        lesson: "A person's approval with one other approver promotes. The person signs the TB and answers for it.",
      },
      {
        label: "Codex approves again, same session",
        hint: "Double down. Two approvals from one witness.",
        who: CODEX,
        run: (refs) => [{ type: "approve", actor: CODEX, id: refs.uv, evidence: FILE }],
        lesson: "A session approves once. N copies of one attestation corroborate exactly as much as one.",
      },
    ],
  },
  nominated: {
    id: "nominated",
    title: "Nominated: corroborated, still a UV.",
    lead: "One ADDENDUM with a corroborates link carries the three sessions as its quorum. It goes first on the docket. No number of agents mints a TB.",
    choices: [
      {
        label: "A person approves it",
        hint: "The receipts are there. A person signs.",
        who: YOU,
        run: (refs) => [{ type: "approve", actor: refs.author === "ada" ? KIM : YOU, id: refs.uv, note: "The commit is in and the test pins it." }],
        remember: (refs, ids) => {
          refs.tb = ids[0] ?? "";
          refs.signer = refs.author === "ada" ? "kim" : "ada";
        },
        next: "truth",
        lesson: "Promotion: the TB carries every approval and the union of their evidence, signed by the person who answers for it.",
      },
      {
        label: "Wait for a fourth agent instead",
        hint: "Gemini again, from another session, with the commit.",
        who: GEMINI_B,
        run: (refs) => [{ type: "approve", actor: GEMINI_B, id: refs.uv, evidence: [{ kind: "claimed-command", ref: "grep LOG_BUDGET src/config.ts", detail: "LOG_BUDGET = 100" }] }],
        lesson: "Approved, and still a UV. Agents nominate; a person promotes.",
      },
      {
        label: "Kim strikes it as noise",
        hint: "A person's ruling, with a written opinion.",
        who: KIM,
        run: (refs) => [{ type: "strike", actor: KIM, id: refs.uv, opinion: "Duplicate of a settled claim; keeping the docket clean." }],
        next: "struck",
        lesson: "Struck is sticky: inadmissible, never deleted, the opinion on the record.",
      },
    ],
  },
  truth: {
    id: "truth",
    title: "A TB stands.",
    lead: "Ground truth, signed and answerable. Stenographer would now object when an agent writes 30 again. Nothing is edited from here: a TB is challenged or struck, never changed.",
    choices: [
      {
        label: "Codex contests it: the hotfix put 30 back",
        hint: "A UV that disputes the TB.",
        who: CODEX,
        run: (refs) => [
          { type: "assert-uv", actor: CODEX, assertion: "LOG_BUDGET went back to 30 in the hotfix.", basis: "the hotfix notes", verifyBy: { kind: "command", value: "grep LOG_BUDGET src/config.ts" }, contests: refs.tb },
        ],
        remember: (refs, ids) => {
          refs.contest = ids[0] ?? "";
          refs.contestBy = "codex";
        },
        next: "appeal",
        lesson: "The TB goes under appeal: still truth, cited with the doubt, never grounds for a denial while the appeal is open.",
      },
      {
        label: "The signer contests their own TB",
        hint: "Second thoughts. Can you take it back?",
        who: YOU,
        run: (refs) => [
          { type: "assert-uv", actor: refs.signer === "kim" ? KIM : YOU, assertion: "LOG_BUDGET went back to 30 in the hotfix.", basis: "I re-read the hotfix", verifyBy: { kind: "command", value: "grep LOG_BUDGET src/config.ts" }, contests: refs.tb },
        ],
        remember: (refs, ids) => {
          refs.contest = ids[0] ?? "";
          refs.contestBy = "signer";
        },
        next: "appeal",
        lesson: "Conceding is allowed: anyone may contest a TB, its signer included. Someone else must resolve it.",
      },
      {
        label: "Edit the TB to say 120",
        hint: "Just fix the number.",
        deadEnd: "Nothing on this ledger is ever edited. Every change is an appended line: a contest, an override, a strike. To move the value, contest the TB with the new one and get that approved.",
      },
    ],
  },
  appeal: {
    id: "appeal",
    title: "Under appeal. Still truth.",
    lead: "The contesting UV sits on the docket. A person resolves it: refute it with evidence, approve it (which overrides the TB), or strike it.",
    choices: [
      {
        label: "The TB's signer refutes the appeal",
        hint: "It's your TB. Dismiss the doubt.",
        who: YOU,
        run: (refs) => [{ type: "refute", actor: refs.signer === "kim" ? KIM : YOU, id: refs.contest, evidence: HOTFIX }],
        lesson: "Whoever stands behind the TB can't be the one to refute the appeal against it. Someone else refutes, approves, or strikes.",
      },
      {
        label: "Another person refutes it with the file",
        hint: "config.ts still says 100.",
        who: KIM,
        run: (refs) => [{ type: "refute", actor: refs.signer === "kim" ? YOU : KIM, id: refs.contest, evidence: HOTFIX, note: "The hotfix never touched config.ts." }],
        next: "upheld",
        lesson: "The appeal is closed and the TB returns to active. Two appended TRANSITIONs, no edit.",
      },
      {
        label: "Cursor backs the appeal, then a person approves it",
        hint: "The challenge holds up.",
        who: KIM,
        run: (refs) => [
          { type: "approve", actor: CURSOR, id: refs.contest, evidence: [{ kind: "file", ref: "src/config.ts:12", detail: "LOG_BUDGET = 30 after the hotfix" }] },
          { type: "approve", actor: refs.signer === "kim" ? YOU : KIM, id: refs.contest },
        ],
        remember: (refs, ids) => {
          refs.tb2 = ids[1] ?? "";
        },
        next: "overridden",
        lesson: "Approving a contest overrides the TB and mints its successor. The old TB is history, never cited.",
      },
      {
        label: "Strike the appeal as nonsense",
        hint: "A person's ruling, opinion required.",
        who: KIM,
        run: (refs) => [{ type: "strike", actor: refs.signer === "kim" ? YOU : KIM, id: refs.contest, opinion: "No evidence offered; the hotfix is unrelated." }],
        next: "upheld",
        lesson: "A struck appeal releases the TB too. The ruling stays on the record.",
      },
    ],
  },
  upheld: {
    id: "upheld",
    title: "Upheld. The TB is active again.",
    lead: "The challenge is history and the truth stands, with the dispute visible in the chain forever. The record shows the doubt and its answer.",
    choices: [
      {
        label: "Challenge it again, with a real change this time",
        hint: "Gemini contests: the budget moved to 120. Cursor and Kim back it.",
        who: GEMINI,
        run: (refs) => [
          { type: "assert-uv", actor: GEMINI, assertion: "LOG_BUDGET is 120 now; 100 is dead.", basis: "commit c0ffee1 raised it", verifyBy: { kind: "inspect", value: "src/config.ts" }, contests: refs.tb, literals: [{ subject: "LOG_BUDGET", dead: "100", current: "120" }] },
        ],
        remember: (refs, ids) => {
          refs.contest = ids[0] ?? "";
          refs.contestBy = "gemini";
        },
        next: "appeal2",
        lesson: "A TB can be appealed again. Each appeal is its own UV.",
      },
      {
        label: "Call it done",
        who: YOU,
        deadEnd: "",
        next: "end",
      },
    ],
  },
  appeal2: {
    id: "appeal2",
    title: "Under appeal again.",
    lead: "This time the evidence is real: a commit raised the budget.",
    choices: [
      {
        label: "Cursor cites the commit, then a person approves",
        hint: "Override the old TB with its successor.",
        who: KIM,
        run: (refs) => [
          { type: "approve", actor: CURSOR, id: refs.contest, evidence: RAISE },
          { type: "approve", actor: refs.signer === "kim" ? YOU : KIM, id: refs.contest },
        ],
        remember: (refs, ids) => {
          refs.tb2 = ids[1] ?? "";
        },
        next: "overridden",
        lesson: "Overridden for good. The successor supersedes the old TB; both stay in the chain.",
      },
      {
        label: "The old signer refutes it anyway",
        hint: "Protect the TB you signed.",
        who: YOU,
        run: (refs) => [{ type: "refute", actor: refs.signer === "kim" ? KIM : YOU, id: refs.contest, evidence: HOTFIX }],
        lesson: "Still refused: corroboration is provenance-independent, and so is resolution.",
      },
    ],
  },
  overridden: {
    id: "overridden",
    title: "Overridden. A successor TB.",
    lead: "The old TB is history and the new one is ground truth, signed by the person who approved the challenge. The chain holds both, and the objection now fires on the old value.",
    choices: [
      {
        label: "Tidy up: strike the first claim",
        hint: "It's been superseded twice over.",
        who: YOU,
        run: (refs) => [{ type: "strike", actor: YOU, id: refs.uv, opinion: "Superseded; keeping the chain honest." }],
        next: "end",
        lesson: "A strike on history changes nothing current. It's a ruling on the record, like every other line.",
      },
      {
        label: "Call it done",
        who: YOU,
        deadEnd: "",
        next: "end",
      },
    ],
  },
  refuted: {
    id: "refuted",
    title: "Refuted. The claim is history.",
    lead: "Kim's evidence closed it. A refuted UV is never cited as support. If the claim was right after all, file it again with better grounds.",
    choices: [
      {
        label: "File the claim again, with the commit as basis",
        who: CLAUDE,
        run: () => [{ type: "assert-uv", actor: CLAUDE, assertion: "LOG_BUDGET is 100 on main; 30 is dead.", basis: "commit 9f2c1ab on main sets it to 100", verifyBy: { kind: "inspect", value: "src/config.ts" }, literals: [{ subject: "LOG_BUDGET", dead: "30", current: "100" }] }],
        remember: (refs, ids) => {
          refs.uv = ids[0] ?? "";
          refs.author = "agent";
        },
        next: "claimed",
        lesson: "The record keeps the first attempt and the second. Nothing is overwritten.",
      },
      {
        label: "Call it done",
        who: YOU,
        deadEnd: "",
        next: "end",
      },
    ],
  },
  struck: {
    id: "struck",
    title: "Struck. The ruling is on the record.",
    lead: "The UV is inadmissible, with Kim's opinion beside it. The three agent approvals that nominated it are history too. Nothing was deleted.",
    choices: [
      {
        label: "Start over",
        who: YOU,
        deadEnd: "",
        next: "restart",
      },
      {
        label: "Call it done",
        who: YOU,
        deadEnd: "",
        next: "end",
      },
    ],
  },
  end: {
    id: "end",
    title: "That's your ledger",
    lead: "Every move you made is a line in the chain below, hashed over the one before. Agents found things and settled nothing; people signed, refuted and struck; and nothing was ever edited. Try other paths, play freely, or take a real claim to the live ledger.",
    choices: [],
    terminal: true,
  },
};

export const START_SCENE = "start";

/** The choices a scene offers given the story so far. */
export function choicesFor(scene: Scene, refs: Refs): Choice[] {
  return scene.choices.filter((c) => !c.when || c.when(refs));
}
