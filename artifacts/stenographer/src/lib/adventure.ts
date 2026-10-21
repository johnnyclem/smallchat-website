/**
 * The choose-your-own explainer: a handful of scenes on a sandbox ledger,
 * each offering real moves. Every move runs through the engine, so a trap
 * is refused for the same reason the public ledger would refuse it, and
 * the story goes where the rules let it. Who files the first claim decides
 * who can't approve it later; a refuted or struck claim ends one path and
 * opens another.
 *
 * The subject is a shared kitchen over one week: what's in the fridge and
 * what's on the grocery list, which several people and a few gadgets keep
 * changing. The same rules that settle a value in a codebase settle whether
 * the house is out of eggs.
 */
import type { Action } from "./truth/engine";
import type { Actor, Evidence } from "./truth/types";

export const YOU: Actor = { by: "ada", role: "human" };
const KIM: Actor = { by: "kim", role: "human" };
/** The kitchen assistant in the house chat. Two sessions of it, one identity. */
const ASSISTANT: Actor = { by: "agent:kitchen-assistant", role: "agent", agentSessionId: "sess-7f3a" };
const ASSISTANT_B: Actor = { ...ASSISTANT, agentSessionId: "sess-b2c4" };
/** The camera on the fridge door, the meal planner, and the scale under the pantry shelf. */
const FRIDGE_CAM: Actor = { by: "agent:fridge-cam", role: "agent", agentSessionId: "sess-2b8e" };
const PLANNER: Actor = { by: "agent:meal-planner", role: "agent", agentSessionId: "sess-9c1d" };
const PLANNER_B: Actor = { ...PLANNER, agentSessionId: "sess-e1f0" };
const SCALE: Actor = { by: "agent:pantry-scale", role: "agent", agentSessionId: "sess-4d2a" };

const PHOTO: Evidence[] = [{ kind: "file", ref: "fridge-cam/tue-07.12.jpg", detail: "door shelf: the carton is empty" }];
const PHOTO_2: Evidence[] = [{ kind: "file", ref: "fridge-cam/tue-07.13.jpg", detail: "same shelf, one minute later" }];
const LOG: Evidence[] = [{ kind: "wiki", ref: "house-wiki/breakfast-log", detail: "12 eggs used Sat to Mon" }];
const WEIGH: Evidence[] = [{ kind: "claimed-command", ref: "weigh door-shelf carton", detail: "0 g above tare: empty" }];
const CRISPER_COUNT: Evidence[] = [{ kind: "claimed-command", ref: "open crisper; count eggs", detail: "six in the crisper, not the door" }];
const EVENING_PHOTO: Evidence[] = [{ kind: "file", ref: "fridge-cam/tue-18.40.jpg", detail: "crisper: no carton either" }];
const CRISPER_WEIGH: Evidence[] = [{ kind: "claimed-command", ref: "weigh crisper carton", detail: "720 g: a full dozen" }];
const LIST_DONE: Evidence[] = [{ kind: "commit", ref: "grocery-list@c0ffee1", detail: "eggs checked off Thu; receipt attached" }];
const NEW_CARTON: Evidence[] = [{ kind: "claimed-command", ref: "weigh door-shelf carton", detail: "720 g: twelve eggs" }];

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
  assertion: "We're out of eggs. Saturday's dozen is gone; eggs go on the grocery list.",
  basis: "the carton on the door shelf is empty",
  verifyBy: { kind: "observe", value: "the door shelf of the kitchen fridge" },
  literals: [{ subject: "eggs", dead: "12", current: "0" }],
});

/** The person who did not file the claim: the one allowed to approve it. */
const otherPerson = (refs: Refs): Actor => (refs.author === "ada" ? KIM : YOU);
/** The person who signed the TB, and the one who didn't. */
const signer = (refs: Refs): Actor => (refs.signer === "kim" ? KIM : YOU);
const notSigner = (refs: Refs): Actor => (refs.signer === "kim" ? YOU : KIM);

export const SCENES: Record<string, Scene> = {
  start: {
    id: "start",
    title: "Tuesday morning. Something changed in the fridge.",
    lead: "Saturday's dozen eggs are gone. \"12 eggs\" is dead, and the house ledger doesn't know yet. Who says so first?",
    choices: [
      {
        label: "The kitchen assistant files it from the house chat",
        hint: "An agent's claim is a UV: believed, unverified, flagged.",
        who: ASSISTANT,
        run: () => [claimAction(ASSISTANT)],
        remember: (refs, ids) => {
          refs.uv = ids[0] ?? "";
          refs.author = "agent";
        },
        next: "claimed",
        lesson: "An agent can notice and assert. It can't declare truth.",
      },
      {
        label: "You file it yourself, as ada",
        hint: "You looked. A person's claim is a UV too. Nobody skips the queue.",
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
        label: "Write \"out of eggs\" on the list in pen",
        hint: "Skip the UV. Make it official.",
        deadEnd: "There is no such move. Nothing becomes truth here by being written down firmly: this ledger has no path that writes a TB directly. A TB comes only from promotion, a person's approval plus one other approver, with evidence among them. Pick who files the claim.",
      },
    ],
  },
  claimed: {
    id: "claimed",
    title: "A UV is on the record. Who weighs in?",
    lead: "It's a flag, not truth: plan around it with an asterisk, don't send anyone to the store on it. To become a TB it needs a person's approval and one other approver who brings evidence.",
    choices: [
      {
        label: "The same assistant approves it from a fresh session",
        hint: "New session, same identity. Surely that counts?",
        who: ASSISTANT_B,
        when: (refs) => refs.author === "agent",
        run: (refs) => [{ type: "approve", actor: ASSISTANT_B, id: refs.uv, evidence: PHOTO }],
        lesson: "Contempt of corpus: nobody approves what they drafted, by identity or by session.",
      },
      {
        label: "You approve your own claim",
        hint: "You filed it. You looked. Approve it.",
        who: YOU,
        when: (refs) => refs.author === "ada",
        run: (refs) => [{ type: "approve", actor: YOU, id: refs.uv }],
        lesson: "A claim is corroborated by someone else. Your own approval is one opinion wearing two hats.",
      },
      {
        label: "The fridge cam approves, citing this morning's photo",
        hint: "A different agent, settling evidence of its own.",
        who: FRIDGE_CAM,
        run: (refs) => [{ type: "approve", actor: FRIDGE_CAM, id: refs.uv, evidence: PHOTO }],
        next: "one-agent",
        lesson: "An agent approves only with settling evidence: a file, a log page, a command it ran. Something a reader can check.",
      },
      {
        label: "Kim refutes it: there are six in the crisper",
        hint: "Kim opened the drawer and counted.",
        who: KIM,
        run: (refs) => [{ type: "refute", actor: KIM, id: refs.uv, evidence: CRISPER_COUNT, note: "Wrong shelf. Six eggs in the crisper." }],
        next: "refuted",
        lesson: "A person refutes with evidence. The UV is history: never cited as support.",
      },
    ],
  },
  "one-agent": {
    id: "one-agent",
    title: "One camera agrees. Not truth yet.",
    lead: "The fridge cam's approval waits beside the ledger. It promotes nothing alone. Who else?",
    choices: [
      {
        label: "Two more gadgets pile on: the planner's log, the scale's reading",
        hint: "Three sessions, disjoint evidence, two kinds between them.",
        who: SCALE,
        run: (refs) => [
          { type: "approve", actor: PLANNER, id: refs.uv, evidence: LOG },
          { type: "approve", actor: SCALE, id: refs.uv, evidence: WEIGH },
        ],
        next: "nominated",
        lesson: "Three agents from different angles nominate the UV. It's corroborated, first on the docket, and still a UV.",
      },
      {
        label: "A person approves it now",
        hint: "A person plus the fridge cam: that's a promotion.",
        who: YOU,
        run: (refs) => [{ type: "approve", actor: otherPerson(refs), id: refs.uv, note: "Empty carton, no spares. Eggs are on the list." }],
        remember: (refs, ids) => {
          refs.tb = ids[0] ?? "";
          refs.signer = otherPerson(refs).by;
        },
        next: "truth",
        lesson: "A person's approval with one other approver promotes. The person signs the TB and answers for it.",
      },
      {
        label: "The fridge cam approves again, same session",
        hint: "Double down. Two approvals from one witness.",
        who: FRIDGE_CAM,
        run: (refs) => [{ type: "approve", actor: FRIDGE_CAM, id: refs.uv, evidence: PHOTO_2 }],
        lesson: "A session approves once. N copies of one attestation corroborate exactly as much as one.",
      },
    ],
  },
  nominated: {
    id: "nominated",
    title: "Nominated: corroborated, still a UV.",
    lead: "One ADDENDUM with a corroborates link carries the three sessions as its quorum. It goes first on the docket. No number of gadgets mints a TB.",
    choices: [
      {
        label: "A person approves it",
        hint: "The receipts are there. A person signs.",
        who: YOU,
        run: (refs) => [{ type: "approve", actor: otherPerson(refs), id: refs.uv, note: "Photo, log and scale agree. Eggs are on the list." }],
        remember: (refs, ids) => {
          refs.tb = ids[0] ?? "";
          refs.signer = otherPerson(refs).by;
        },
        next: "truth",
        lesson: "Promotion: the TB carries every approval and the union of their evidence, signed by the person who answers for it.",
      },
      {
        label: "Wait for a fourth gadget instead",
        hint: "The meal planner again, from another session, counting every shelf.",
        who: PLANNER_B,
        run: (refs) => [{ type: "approve", actor: PLANNER_B, id: refs.uv, evidence: [{ kind: "claimed-command", ref: "count eggs, every shelf", detail: "0" }] }],
        next: "nominated",
        lesson: "Approved, and still a UV. Agents nominate; a person promotes.",
      },
      {
        label: "Kim strikes it as noise",
        hint: "A person's ruling, with a written opinion.",
        who: KIM,
        run: (refs) => [{ type: "strike", actor: KIM, id: refs.uv, opinion: "Eggs went on the list Monday night. Duplicate; keeping the docket clean." }],
        next: "struck",
        lesson: "Struck is sticky: inadmissible, never deleted, the opinion on the record.",
      },
    ],
  },
  truth: {
    id: "truth",
    title: "A TB stands.",
    lead: "Ground truth, signed and answerable: eggs are at zero and on the grocery list. Stenographer would now object when the meal planner schedules an omelette. Nothing is edited from here: a TB is challenged or struck, never changed.",
    choices: [
      {
        label: "The meal planner contests it: there's a carton in the crisper",
        hint: "A UV that disputes the TB.",
        who: PLANNER,
        run: (refs) => [
          { type: "assert-uv", actor: PLANNER, assertion: "There are eggs after all: a carton in the crisper drawer.", basis: "Tuesday's photo shows a carton in the crisper", verifyBy: { kind: "observe", value: "the crisper drawer" }, contests: refs.tb },
        ],
        remember: (refs, ids) => {
          refs.contest = ids[0] ?? "";
          refs.contestBy = "planner";
        },
        next: "appeal",
        lesson: "The TB goes under appeal: still truth, cited with the doubt, never grounds for a denial while the appeal is open.",
      },
      {
        label: "The signer contests their own TB",
        hint: "Second thoughts. Was that a carton in the crisper?",
        who: YOU,
        run: (refs) => [
          { type: "assert-uv", actor: signer(refs), assertion: "There are eggs after all: a carton in the crisper drawer.", basis: "I think I saw a carton in the crisper", verifyBy: { kind: "observe", value: "the crisper drawer" }, contests: refs.tb },
        ],
        remember: (refs, ids) => {
          refs.contest = ids[0] ?? "";
          refs.contestBy = "signer";
        },
        next: "appeal",
        lesson: "Conceding is allowed: anyone may contest a TB, its signer included. Someone else must resolve it.",
      },
      {
        label: "Cross eggs off the list",
        hint: "Just tidy it up.",
        deadEnd: "Nothing on this ledger is ever edited. Every change is an appended line: a contest, an override, a strike. When the eggs come home, contest the TB with the receipt and get that approved.",
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
        run: (refs) => [{ type: "refute", actor: signer(refs), id: refs.contest, evidence: EVENING_PHOTO }],
        lesson: "Whoever stands behind the TB can't be the one to refute the appeal against it. Someone else refutes, approves, or strikes.",
      },
      {
        label: "Another person refutes it with the evening photo",
        hint: "The crisper carton is empty too.",
        who: KIM,
        run: (refs) => [{ type: "refute", actor: notSigner(refs), id: refs.contest, evidence: EVENING_PHOTO, note: "That carton's been empty since Sunday." }],
        next: "upheld",
        lesson: "The appeal is closed and the TB returns to active. Two appended TRANSITIONs, no edit.",
      },
      {
        label: "The pantry scale backs the appeal, then a person approves it",
        hint: "The challenge holds up.",
        who: KIM,
        run: (refs) => [
          { type: "approve", actor: SCALE, id: refs.contest, evidence: CRISPER_WEIGH },
          { type: "approve", actor: notSigner(refs), id: refs.contest },
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
        run: (refs) => [{ type: "strike", actor: notSigner(refs), id: refs.contest, opinion: "Nobody opened the crisper. The photo shows an empty box." }],
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
        label: "Thursday: challenge it again, with a real change this time",
        hint: "Kim came home with eggs. The fridge cam contests; the assistant and a person back it.",
        who: FRIDGE_CAM,
        run: (refs) => [
          { type: "assert-uv", actor: FRIDGE_CAM, assertion: "A full dozen is back on the door shelf; \"out of eggs\" is dead.", basis: "Thursday evening's photo shows a new carton", verifyBy: { kind: "observe", value: "the door shelf of the kitchen fridge" }, contests: refs.tb, literals: [{ subject: "eggs", dead: "0", current: "12" }] },
        ],
        remember: (refs, ids) => {
          refs.contest = ids[0] ?? "";
          refs.contestBy = "fridge-cam";
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
    lead: "This time the change is real: Kim shopped on Thursday, and the carton is on the shelf.",
    choices: [
      {
        label: "The assistant cites the checked-off list, then a person approves",
        hint: "Override the old TB with its successor.",
        who: KIM,
        run: (refs) => [
          { type: "approve", actor: ASSISTANT, id: refs.contest, evidence: LIST_DONE },
          { type: "approve", actor: notSigner(refs), id: refs.contest, note: "Receipt's on the counter and the carton's in the door." },
        ],
        remember: (refs, ids) => {
          refs.tb2 = ids[1] ?? "";
        },
        next: "overridden",
        lesson: "Overridden for good. The successor supersedes the old TB; both stay in the chain.",
      },
      {
        label: "The pantry scale weighs the new carton, then a person approves",
        hint: "A measurement instead of a receipt.",
        who: KIM,
        run: (refs) => [
          { type: "approve", actor: SCALE, id: refs.contest, evidence: NEW_CARTON },
          { type: "approve", actor: notSigner(refs), id: refs.contest, note: "Twelve eggs, I counted." },
        ],
        remember: (refs, ids) => {
          refs.tb2 = ids[1] ?? "";
        },
        next: "overridden",
        lesson: "Any settling evidence will do: a file, a log, a measurement someone ran. The person's signature is what promotes.",
      },
      {
        label: "The old signer refutes it anyway",
        hint: "Protect the TB you signed.",
        who: YOU,
        run: (refs) => [{ type: "refute", actor: signer(refs), id: refs.contest, evidence: EVENING_PHOTO }],
        lesson: "Still refused: corroboration is provenance-independent, and so is resolution.",
      },
    ],
  },
  overridden: {
    id: "overridden",
    title: "Overridden. A successor TB.",
    lead: "The old TB is history and the new one is ground truth: a dozen eggs, signed by the person who approved the challenge. The chain holds both, and the objection now fires on \"out of eggs\".",
    choices: [
      {
        label: "Tidy up: strike Tuesday's claim",
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
    lead: "Kim's count closed it. A refuted UV is never cited as support. If the claim was right after all, file it again with better grounds.",
    choices: [
      {
        label: "File it again: the crisper six went into Monday's frittata",
        who: ASSISTANT,
        run: () => [{ type: "assert-uv", actor: ASSISTANT, assertion: "Eggs: zero on every shelf. The crisper six went into Monday's frittata.", basis: "this morning's photo shows the door shelf and the crisper both empty", verifyBy: { kind: "observe", value: "every shelf of the kitchen fridge" }, literals: [{ subject: "eggs", dead: "12", current: "0" }] }],
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
    lead: "The UV is inadmissible, with Kim's opinion beside it. The three gadget approvals that nominated it are history too. Nothing was deleted.",
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
    lead: "Every move you made is a line in the chain below, hashed over the one before. Gadgets and assistants noticed things and settled nothing; people signed, refuted and struck; and nothing was ever edited. Try other paths, play freely, or take a real claim to the live ledger.",
    choices: [],
    terminal: true,
  },
};

export const START_SCENE = "start";

/** The choices a scene offers given the story so far. */
export function choicesFor(scene: Scene, refs: Refs): Choice[] {
  return scene.choices.filter((c) => !c.when || c.when(refs));
}
