/**
 * The graph's shapes, at text size: 16 by 16 with a 1.5 stroke, like every
 * other icon on the page. A TB is an amber square, a UV is a hollow circle, a
 * corroborated UV has a dot in it, a dead entry is dashed, a person is a solid
 * dot and an agent is a ring. The key, the status line and the graph draw the
 * same shapes.
 */
export type GlyphKind = "tb" | "tb-appeal" | "tb-dead" | "uv" | "uv-corroborated" | "uv-dead" | "person" | "agent";

export function Glyph({ kind, className = "" }: { kind: GlyphKind; className?: string }) {
  const stroke = { stroke: "currentColor", strokeWidth: 1.5, fill: "none" } as const;
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden className={`shrink-0 ${className}`}>
      {kind === "tb" && <rect x="2.5" y="2.5" width="11" height="11" rx="2" style={{ fill: "var(--accent)" }} />}
      {kind === "tb-appeal" && (
        <>
          <rect x="4" y="4" width="8" height="8" rx="1.5" style={{ fill: "var(--accent)" }} />
          <rect x="1.25" y="1.25" width="13.5" height="13.5" rx="3" {...stroke} strokeDasharray="2 2" />
        </>
      )}
      {kind === "tb-dead" && <rect x="3" y="3" width="10" height="10" rx="2" {...stroke} strokeDasharray="2.5 2" opacity={0.6} />}
      {kind === "uv" && <circle cx="8" cy="8" r="5" {...stroke} />}
      {kind === "uv-corroborated" && (
        <>
          <circle cx="8" cy="8" r="5.25" {...stroke} />
          <circle cx="8" cy="8" r="1.75" fill="currentColor" />
        </>
      )}
      {kind === "uv-dead" && <circle cx="8" cy="8" r="5" {...stroke} strokeDasharray="2.5 2" opacity={0.6} />}
      {kind === "person" && <circle cx="8" cy="8" r="4" fill="currentColor" />}
      {kind === "agent" && <circle cx="8" cy="8" r="3.25" {...stroke} />}
    </svg>
  );
}
