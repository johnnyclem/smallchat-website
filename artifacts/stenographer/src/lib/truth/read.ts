/**
 * The read model: what a page or an API answer shows of a ledger. Built from
 * the fold and the approvals waiting beside it, never stored.
 */

import { type Entry, fold } from "./fold";
import { type Freshness, freshnessOf } from "./freshness";
import type { ApprovalSummary, LedgerState } from "./engine";
import { summarizeApprovals } from "./engine";
import type { Line, PendingApproval } from "./types";

export interface EntryView extends Omit<Entry, "line"> {
  line: Line;
  /** A reader's marker for the entry (spec, "Status is a fold"). */
  marker: string;
  /** UV: where it stands on its way to a TB, and who approved. */
  approvals?: ApprovalSummary & { records: Array<Pick<PendingApproval, "by" | "role" | "agentSessionId" | "evidence" | "note" | "ts">> };
  freshness?: Freshness | null;
}

export interface Docket {
  /** Open UVs: nominated first, then stale, then the rest, oldest first. */
  open: string[];
  /** TBs under appeal, with the UVs contesting them. */
  appeals: Array<{ tb: string; contests: string[] }>;
  asOf: string;
}

export interface ReadModel {
  head: { seq: number; hash: string } | null;
  counts: { lines: number; tb: number; uv: number; current: number };
  entries: EntryView[];
  docket: Docket;
  lines: Line[];
  asOf: string;
}

export function markerFor(e: Entry, freshness: Freshness | null): string {
  if (e.type === "TB") {
    if (e.status === "active") return "[TB]";
    if (e.status === "contested") return "[TB ⚠ UNDER APPEAL]";
    return `[TB ${e.status.toUpperCase()}]`;
  }
  if (e.status === "open") {
    if (e.corroborated) return "[UV · CORROBORATED]";
    if (freshness?.state === "stale") return "[UV — STALE]";
    return "[UV — UNVERIFIED]";
  }
  return `[UV ${e.status.toUpperCase()}]`;
}

export function readModel(state: LedgerState, now: number = Date.now()): ReadModel {
  const f = fold(state.lines);
  const entries: EntryView[] = [];
  for (const e of f.entries.values()) {
    const freshness = freshnessOf(e, now);
    const view: EntryView = { ...e, marker: markerFor(e, freshness), freshness };
    if (e.type === "UV") {
      const summary = summarizeApprovals(e, state.approvals);
      const records = state.approvals
        .filter((a) => a.uvId === e.id && a.consumedBy === null)
        .map(({ by, role, agentSessionId, evidence, note, ts }) => ({ by, role, agentSessionId, evidence, note, ts }));
      view.approvals = { ...summary, records };
    }
    entries.push(view);
  }
  entries.sort((a, b) => b.seq - a.seq);
  const openUvs = entries.filter((e) => e.type === "UV" && e.status === "open");
  const rank = (e: EntryView) => (e.corroborated ? 0 : e.freshness?.state === "stale" ? 1 : 2);
  const open = [...openUvs].sort((a, b) => rank(a) - rank(b) || a.seq - b.seq).map((e) => e.id);
  const appeals = entries.filter((e) => e.type === "TB" && e.status === "contested").map((e) => ({ tb: e.id, contests: e.contestedBy }));
  return {
    head: f.head,
    counts: {
      lines: state.lines.length,
      tb: entries.filter((e) => e.type === "TB").length,
      uv: entries.filter((e) => e.type === "UV").length,
      current: entries.filter((e) => e.current).length,
    },
    entries,
    docket: { open, appeals, asOf: new Date(now).toISOString() },
    lines: state.lines,
    asOf: new Date(now).toISOString(),
  };
}
