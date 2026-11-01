import type { ReactNode } from "react";
import { Glyph } from "./Glyph";

/** One edge sample: a line in a 16 by 16 box with the 1.5 stroke of every icon. The graph itself varies width a little; the key does not. */
function Edge({ stroke, dash }: { stroke: string; dash?: string }) {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden className="shrink-0">
      <line x1="1.5" y1="8" x2="14.5" y2="8" style={{ stroke, strokeWidth: 1.5 }} strokeDasharray={dash} strokeLinecap="round" />
    </svg>
  );
}

const ITEMS: Array<{ glyph: ReactNode; label: string }> = [
  { glyph: <Glyph kind="tb" />, label: "TB · signed truth" },
  { glyph: <Glyph kind="uv" />, label: "UV · unverified" },
  { glyph: <Glyph kind="uv-corroborated" />, label: "UV · corroborated" },
  {
    glyph: (
      <span className="inline-flex">
        <Glyph kind="person" />
        <Glyph kind="agent" />
      </span>
    ),
    label: "Person · agent",
  },
  { glyph: <Edge stroke="var(--accent)" />, label: "Signs · supersedes" },
  {
    glyph: (
      <span className="inline-flex">
        <Edge stroke="color-mix(in srgb, var(--foreground) 55%, transparent)" dash="3 3" />
        <Edge stroke="var(--negative)" dash="4 3" />
      </span>
    ),
    label: "Approves · contests",
  },
];

/**
 * What each shape and line means: six items, set under the graph in the
 * shapes the graph itself draws.
 */
export function GraphKey() {
  return (
    <ul aria-label="Key to the graph" className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs leading-4 text-secondary-foreground sm:grid-cols-3">
      {ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          {item.glyph}
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
