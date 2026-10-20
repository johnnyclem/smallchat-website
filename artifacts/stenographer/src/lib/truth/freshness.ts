/**
 * Freshness (spec/truth-format, "Freshness"): an open UV goes stale once the
 * clock has moved past its horizon since it was asserted or last
 * re-attested. A rendering state, never a status: a stale UV is still open,
 * still a flag, still promotable. A TB never goes stale.
 */

import type { Entry } from "./fold.js";
import { horizonOf } from "./fold.js";

export { DEFAULT_UV_HORIZON_SECONDS } from "./types.js";

export interface Freshness {
  state: "fresh" | "stale";
  anchor: string;
  at: string;
  horizonSeconds: number;
  expiresAt: string;
  elapsedSeconds: number;
}

export function freshnessOf(entry: Entry, now: number): Freshness | null {
  if (entry.type !== "UV" || entry.status !== "open") return null;
  const anchor = entry.reattestedAt && Date.parse(entry.reattestedAt) > Date.parse(entry.line.ts) ? entry.reattestedAt : entry.line.ts;
  const anchorMs = Date.parse(anchor);
  const horizonSeconds = horizonOf(entry);
  const elapsedSeconds = Math.max(0, Math.floor((now - anchorMs) / 1000));
  return {
    state: Number.isFinite(anchorMs) && elapsedSeconds <= horizonSeconds ? "fresh" : "stale",
    anchor,
    at: new Date(now).toISOString(),
    horizonSeconds,
    expiresAt: new Date(anchorMs + horizonSeconds * 1000).toISOString(),
    elapsedSeconds,
  };
}
