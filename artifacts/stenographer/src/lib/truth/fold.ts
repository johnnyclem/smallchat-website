/**
 * Status is a fold (spec/truth-format, "Status is a fold"): an entry's
 * current status is the `status` of the highest-seq TRANSITION that targets
 * it, else its line's own. Nothing is read from an entry line's status once
 * a transition follows. The fold also reads what the stream says around an
 * entry: which open UVs contest a TB, whether a nomination corroborates a
 * UV, and which TB superseded it.
 */

import { DEFAULT_UV_HORIZON_SECONDS } from "./types.js";
import type { Line, Link } from "./types.js";

export interface Entry {
  id: string;
  type: "TB" | "UV";
  seq: number;
  line: Line;
  status: string;
  /** Current truth: an active or contested TB, an open UV. */
  current: boolean;
  /** UV: the TB it disputes. */
  contests: string | null;
  /** TB: the open UVs disputing it. */
  contestedBy: string[];
  /** UV: three or more agent sessions nominated it. */
  corroborated: boolean;
  /** UV: the TB a promotion wrote from it. TB: the TB that overrode and replaced it. */
  supersededBy: string | null;
  /** UV: the newest re-attestation (a nomination), for freshness. */
  reattestedAt: string | null;
}

export interface Fold {
  entries: Map<string, Entry>;
  /** Lines by id (TRANSITIONs included), for citations. */
  lines: Map<string, Line>;
  head: { seq: number; hash: string } | null;
}

export function linksOf(line: Record<string, unknown>): Link[] {
  const steno = line["x-steno"] as { links?: Link[] } | undefined;
  return Array.isArray(steno?.links) ? steno!.links : [];
}

export function fold(lines: Line[]): Fold {
  const entries = new Map<string, Entry>();
  const byId = new Map<string, Line>();
  const struckAddenda = new Set<string>();
  for (const line of lines) {
    byId.set(line.id, line);
    if (line.type === "TB" || line.type === "UV") {
      entries.set(line.id, {
        id: line.id,
        type: line.type,
        seq: line.seq,
        line,
        status: typeof line.status === "string" ? line.status : "unknown",
        current: false,
        contests: line.type === "UV" && typeof line.contests === "string" ? line.contests : null,
        contestedBy: [],
        corroborated: false,
        supersededBy: null,
        reattestedAt: null,
      });
      if (line.type === "TB") {
        for (const l of linksOf(line)) {
          if (l.type === "supersedes" && l.fromId === line.id) {
            const target = entries.get(l.toId);
            if (target) target.supersededBy = line.id;
          }
        }
      }
    } else if (line.type === "TRANSITION") {
      const target = entries.get(line.target as string);
      if (target && typeof line.status === "string") target.status = line.status;
      if (line.status === "struck" && line.cause && typeof (line.cause as { ref?: unknown }).ref === "string") {
        const ref = (line.cause as { ref: string }).ref;
        if (byId.get(ref)?.type === "ADDENDUM") struckAddenda.add(ref);
      }
    } else if (line.type === "ADDENDUM") {
      for (const l of linksOf(line)) {
        if (l.type === "corroborates" && l.fromId === line.id) {
          const target = entries.get(l.toId);
          if (target && !struckAddenda.has(line.id)) {
            target.corroborated = true;
            target.reattestedAt = line.ts;
          }
        }
      }
    }
  }
  for (const e of entries.values()) {
    e.current = e.type === "TB" ? e.status === "active" || e.status === "contested" : e.status === "open";
    if (e.type === "UV" && e.contests && e.status === "open") {
      const tb = entries.get(e.contests);
      if (tb) tb.contestedBy.push(e.id);
    }
  }
  const last = lines[lines.length - 1];
  return { entries, lines: byId, head: last ? { seq: last.seq, hash: last.hash } : null };
}

/** The horizon an open UV is fresh for: its own when shorter than the default, else the default. */
export function horizonOf(entry: Entry): number {
  const own = entry.line.horizon;
  return typeof own === "number" && own > 0 && own < DEFAULT_UV_HORIZON_SECONDS ? own : DEFAULT_UV_HORIZON_SECONDS;
}
