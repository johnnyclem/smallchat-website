/**
 * A transcript excerpt for the Rules section, built at runtime from the walk
 * itself: the same sandbox ledger and the same scenes, played down one path,
 * so every line shown is a line the walk really writes. Nothing here is live
 * data, and the page says so.
 */
import { SCENES, choicesFor, type Refs } from "./adventure";
import { hash12 } from "./format";
import { SandboxLedger } from "./ledger-client";
import type { Line, Link } from "./truth/types";

export interface ExcerptRow {
  seq: number;
  type: string;
  /** The first 12 characters of the line's hash. */
  hash: string;
  /** Who wrote the line, or who signed it. */
  who: string;
  text: string;
  tb: boolean;
}

export interface Excerpt {
  rows: ExcerptRow[];
  /** The first 12 characters of the head hash. */
  head: string;
}

/**
 * The path: a claim, an approval, a TB, an appeal, a refutation, the TB
 * active again. Each pair is a scene and the start of the label of the
 * choice the walk offers there.
 */
const PATH: Array<[scene: string, label: string]> = [
  ["start", "The kitchen assistant"],
  ["claimed", "The fridge cam"],
  ["one-agent", "A person approves"],
  ["truth", "The meal planner contests"],
  ["appeal", "Another person refutes"],
];

const quoted = (note: unknown) => (typeof note === "string" && note ? `: “${note}”` : "");

function describe(line: Line, seqOf: Map<string, number>): { who: string; text: string } {
  const links = ((line["x-steno"] as { links?: Link[] } | undefined)?.links ?? []) as Link[];
  const target = (id: unknown) => `#${seqOf.get(String(id)) ?? "?"}`;
  switch (line.type) {
    case "UV": {
      const contests = line.contests ? ` · contests ${target(line.contests)}` : "";
      return { who: `${line.author}${contests}`, text: String(line.assertion) };
    }
    case "TB":
      return { who: `signed by ${String(line.signedBy ?? line.author)}`, text: String(line.claim) };
    case "ADDENDUM": {
      const link = links[0];
      const ref = (line.evidence as Array<{ ref: string }> | undefined)?.[0]?.ref;
      return { who: line.author, text: `${link?.type ?? "annotates"} ${link ? target(link.toId) : ""}${ref ? ` on ${ref}` : ""}${quoted(line.note)}`.replace(/\s+/g, " ").trim() };
    }
    case "TRANSITION":
      return { who: line.author, text: `${target(line.target)} becomes ${String(line.status)}` };
    case "RULING":
      return { who: line.author, text: `strikes ${target(line.target)}${quoted(line.opinion)}` };
    default:
      return { who: line.author, text: String(line.type) };
  }
}

export async function buildExcerpt(): Promise<Excerpt> {
  const ledger = new SandboxLedger();
  const refs: Refs = {};
  for (const [sceneId, label] of PATH) {
    const choice = choicesFor(SCENES[sceneId], refs).find((c) => c.label.startsWith(label));
    if (!choice?.run) throw new Error(`The walk has no "${label}" in scene ${sceneId}`);
    const ids: Array<string | null> = [];
    for (const action of choice.run(refs)) {
      const r = await ledger.run(action);
      if (!r.ok) throw new Error(`${sceneId}: ${r.message}`);
      ids.push(r.outcome.kind === "promoted" ? r.outcome.tb : "id" in r.outcome ? r.outcome.id : null);
    }
    choice.remember?.(refs, ids);
  }
  const model = await ledger.read();
  const seqOf = new Map(model.lines.map((l) => [l.id, l.seq]));
  return {
    rows: model.lines.map((l) => ({ seq: l.seq, type: l.type, hash: hash12(l.hash), tb: l.type === "TB", ...describe(l, seqOf) })),
    head: model.head ? hash12(model.head.hash) : "",
  };
}
