import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { clip } from "@/lib/format";
import { identityKey, isAgentIdentity } from "@/lib/truth/identity";
import { linksOf } from "@/lib/truth/fold";
import type { EntryView, ReadModel } from "@/lib/truth/read";
import type { ApprovalRecord, QuorumMember } from "@/lib/truth/types";

/**
 * The ledger as a web: claims (TBs and UVs) and the people and agent
 * sessions that asserted, approved, signed, contested, refuted or struck
 * them. Positions come from a force layout and persist across updates, so
 * a new claim fades in next to whoever made it and the rest barely moves.
 *
 * State is told by shape, not hue: a TB is an amber square, a UV a hollow
 * circle (a dot in it once corroborated), a dead entry is dashed, a person
 * is a solid dot and an agent a ring. Amber appears on signed TBs and the
 * edges that sign or supersede them, and nowhere else.
 */

export type GraphNode = SimulationNodeDatum & {
  id: string;
  kind: "TB" | "UV" | "human" | "agent";
  label: string;
  /** The whole text, for hover and the accessible name. */
  full: string;
  /** Entries: the full view. */
  entry?: EntryView;
  /** Identities: how many lines carry the name. */
  weight?: number;
};

export type EdgeKind = "asserted" | "signed" | "approved" | "contests" | "supersedes" | "refuted" | "struck";
export type GraphLink = SimulationLinkDatum<GraphNode> & { id: string; kind: EdgeKind };

/** Edges: a hairline for asserted, amber for signed and supersedes, dashed neutral for approved, dashed red for contests and refuted. */
const EDGE_STYLE: Record<EdgeKind, { stroke: string; dash?: string; width: number }> = {
  asserted: { stroke: "color-mix(in srgb, var(--foreground) 24%, transparent)", width: 1 },
  signed: { stroke: "var(--accent)", width: 1.5 },
  approved: { stroke: "color-mix(in srgb, var(--foreground) 48%, transparent)", dash: "3 3", width: 1 },
  contests: { stroke: "var(--negative)", dash: "6 4", width: 1.5 },
  supersedes: { stroke: "var(--accent)", width: 2 },
  refuted: { stroke: "var(--negative)", dash: "2 3", width: 1.25 },
  struck: { stroke: "var(--negative)", dash: "2 3", width: 1.25 },
};

const whoId = (name: string) => `who:${identityKey(name)}`;

function buildGraph(model: ReadModel, entryLabel: number, whoLabel: number): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const who = (name: string): string => {
    const id = whoId(name);
    const node = nodes.get(id);
    if (node) node.weight = (node.weight ?? 0) + 1;
    else nodes.set(id, { id, kind: isAgentIdentity(name) ? "agent" : "human", label: clip(name, whoLabel), full: name, weight: 1 });
    return id;
  };
  const edge = (source: string, target: string, kind: EdgeKind) => {
    const id = `${source}|${kind}|${target}`;
    if (!links.some((l) => l.id === id)) links.push({ id, kind, source, target });
  };
  for (const e of model.entries) {
    const text = String(e.type === "TB" ? e.line.claim : e.line.assertion);
    nodes.set(e.id, { id: e.id, kind: e.type, label: clip(text, entryLabel), full: text, entry: e });
  }
  for (const e of model.entries) {
    if (e.type === "UV") {
      edge(who(e.line.author), e.id, "asserted");
      if (e.contests && nodes.has(e.contests)) edge(e.id, e.contests, "contests");
      for (const a of e.approvals?.records ?? []) edge(who(a.by), e.id, "approved");
    } else {
      const signer = typeof e.line.signedBy === "string" ? e.line.signedBy : e.line.author;
      edge(who(signer), e.id, "signed");
      for (const a of (e.line.approvals as ApprovalRecord[] | undefined) ?? []) if (identityKey(a.by) !== identityKey(signer)) edge(who(a.by), e.id, "approved");
      for (const l of linksOf(e.line)) if (l.type === "supersedes" && nodes.has(l.toId)) edge(e.id, l.toId, "supersedes");
    }
  }
  for (const line of model.lines) {
    if (line.type !== "ADDENDUM" && line.type !== "RULING") continue;
    for (const l of linksOf(line)) {
      if (!nodes.has(l.toId)) continue;
      if (l.type === "refutes") edge(who(line.author), l.toId, "refuted");
      else if (l.type === "strikes") edge(who(line.author), l.toId, "struck");
      else if (l.type === "corroborates") for (const m of (line.quorum as QuorumMember[] | undefined) ?? []) edge(who(m.author), l.toId, "approved");
    }
  }
  return { nodes: [...nodes.values()], links };
}

const RADIUS: Record<GraphNode["kind"], number> = { TB: 14, UV: 10, human: 7, agent: 6 };

/** How many approvals stand behind an entry: pending ones on a UV, the ones written into a TB. */
function approvalsOf(e: EntryView): number {
  if (e.type === "UV") return e.approvals?.approvers ?? 0;
  return ((e.line.approvals as unknown[] | undefined)?.length ?? 0) + e.contestedBy.length;
}

/** A node's radius: its kind's base, grown by what backs it, so a well-approved claim reads as the heavier one. */
function nodeRadius(n: GraphNode): number {
  const base = RADIUS[n.kind];
  if (n.entry) return base + Math.min(12, approvalsOf(n.entry) * 3);
  return base + Math.min(5, ((n.weight ?? 1) - 1) * 0.8);
}

/** Label widths, in px at 12px type: Plex Sans for claims, Plex Mono for names. */
const labelWidth = (n: GraphNode, text = n.label) => text.length * (n.entry ? 6.2 : 7.2);

/**
 * Keeps labels from stacking: each node is a box of its shape plus the line
 * of text under it, and two boxes that overlap are pushed apart along the
 * axis they overlap least.
 */
function forceLabelCollide(gap = 8) {
  let nodes: GraphNode[] = [];
  const force = () => {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = (b.x ?? 0) - (a.x ?? 0);
        const dy = (b.y ?? 0) - (a.y ?? 0);
        const hwA = Math.max(nodeRadius(a), labelWidth(a) / 2) + gap / 2;
        const hwB = Math.max(nodeRadius(b), labelWidth(b) / 2) + gap / 2;
        const hhA = nodeRadius(a) + 8 + gap / 2;
        const hhB = nodeRadius(b) + 8 + gap / 2;
        const ox = hwA + hwB - Math.abs(dx);
        const oy = hhA + hhB - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        if (ox < oy) {
          const s = (ox / 2) * 0.35 * (dx === 0 ? (i % 2 ? 1 : -1) : Math.sign(dx));
          a.vx = (a.vx ?? 0) - s;
          b.vx = (b.vx ?? 0) + s;
        } else {
          const s = (oy / 2) * 0.35 * (dy === 0 ? (i % 2 ? 1 : -1) : Math.sign(dy));
          a.vy = (a.vy ?? 0) - s;
          b.vy = (b.vy ?? 0) + s;
        }
      }
    }
  };
  force.initialize = (n: GraphNode[]) => {
    nodes = n;
  };
  return force;
}

type Look = { shape: "tb" | "uv"; dead: boolean; appeal: boolean; corroborated: boolean };

function entryLook(e: EntryView): Look {
  if (e.type === "TB") return { shape: "tb", dead: e.status !== "active" && e.status !== "contested", appeal: e.status === "contested", corroborated: false };
  return { shape: "uv", dead: e.status !== "open", appeal: false, corroborated: e.status === "open" && !!e.corroborated };
}

const HALO: CSSProperties = { fill: "var(--foreground)", stroke: "var(--card)", strokeWidth: 4, paintOrder: "stroke", strokeLinejoin: "round", pointerEvents: "none" };

export function TruthGraph({
  model,
  selected,
  onSelect,
  highlight,
  className = "",
  minHeight = 520,
  mobileHeight = 320,
  emptyMessage = "Nothing on the record yet. Make the first claim, or walk through one.",
}: {
  model: ReadModel;
  selected: string | null;
  onSelect: (id: string | null) => void;
  highlight?: Set<string>;
  className?: string;
  /** Canvas height from 560px wide up. */
  minHeight?: number;
  /** Canvas height below 560px wide. */
  mobileHeight?: number;
  /** Shown over an empty graph; null for none. */
  emptyMessage?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: minHeight });
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const simRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const [hover, setHover] = useState<string | null>(null);
  /** The node showing a keyboard focus ring (focus-visible only). */
  const [focused, setFocused] = useState<string | null>(null);
  /** The graph is one tab stop: the node last focused, else the selected one, else the first. Arrow keys move inside it. */
  const [tabStop, setTabStop] = useState<string | null>(null);
  const nodeEls = useRef(new Map<string, SVGGElement>());
  const dragRef = useRef<{ node: GraphNode; moved: boolean } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.max(280, entry.contentRect.width);
      setSize({ w, h: w < 560 ? mobileHeight : Math.max(minHeight, Math.min(720, w * 0.62)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [minHeight, mobileHeight]);

  const narrow = size.w < 560;
  const built = useMemo(() => buildGraph(model, narrow ? 22 : 32, narrow ? 22 : 28), [model, narrow]);

  useEffect(() => {
    const prev = new Map(nodesRef.current.map((n) => [n.id, n]));
    const cx = size.w / 2;
    const cy = size.h / 2;
    const nodes = built.nodes.map((n) => {
      const kept = prev.get(n.id);
      if (kept) return Object.assign(kept, { label: n.label, full: n.full, entry: n.entry, weight: n.weight, kind: n.kind });
      // A new node starts next to something it's linked to, else near the middle
      const neighbour = built.links.find((l) => l.source === n.id || l.target === n.id);
      const other = neighbour ? prev.get(neighbour.source === n.id ? (neighbour.target as string) : (neighbour.source as string)) : undefined;
      const jitter = () => (Math.random() - 0.5) * 60;
      return { ...n, x: (other?.x ?? cx) + jitter(), y: (other?.y ?? cy) + jitter() };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links = built.links.map((l) => ({ ...l, source: byId.get(l.source as string)!, target: byId.get(l.target as string)! })).filter((l) => l.source && l.target);
    nodesRef.current = nodes;
    linksRef.current = links;
    /** Forces shrink with the canvas, so a phone-sized graph is not pushed to its edges. */
    const fit = () => Math.max(0.5, Math.min(1, Math.sqrt((sizeRef.current.w * sizeRef.current.h) / (756 * 520))));
    let sim = simRef.current;
    if (!sim) {
      sim = forceSimulation<GraphNode, GraphLink>()
        .force("charge", forceManyBody<GraphNode>().strength((d) => (d.kind === "TB" ? -1000 : d.kind === "UV" ? -720 : -280) * fit()))
        .force("collide", forceCollide<GraphNode>().radius((d) => nodeRadius(d) + 10).strength(0.9))
        .force("labels", forceLabelCollide())
        .velocityDecay(0.4)
        .on("tick", () => {
          // Keep every node, label included, inside the canvas
          const { w, h } = sizeRef.current;
          for (const n of nodesRef.current) {
            const r = nodeRadius(n);
            const padX = Math.min(w / 2 - 8, Math.max(r, labelWidth(n) / 2) + 12);
            if (n.x !== undefined) n.x = Math.max(padX, Math.min(w - padX, n.x));
            if (n.y !== undefined) n.y = Math.max(r + 12, Math.min(h - r - 28, n.y));
          }
          tick();
        });
      simRef.current = sim;
    }
    sim
      .nodes(nodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((l) => (l.kind === "contests" ? 190 : l.kind === "supersedes" ? 150 : l.kind === "approved" ? 120 : 100) * fit())
          .strength((l) => (l.kind === "asserted" || l.kind === "signed" ? 0.5 : 0.25))
      )
      .force("center", forceCenter(cx, cy).strength(0.04))
      .force("x", forceX(cx).strength(0.02))
      .force("y", forceY(cy).strength(0.035))
      .alpha(prev.size === 0 ? 1 : 0.6)
      .restart();
  }, [built, size.w, size.h]);

  useEffect(
    () => () => {
      simRef.current?.stop();
    },
    []
  );

  const onPointerDown = (node: GraphNode, e: ReactPointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { node, moved: false };
    simRef.current?.alphaTarget(0.3).restart();
  };
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const rect = e.currentTarget.getBoundingClientRect();
    d.node.fx = ((e.clientX - rect.left) / rect.width) * size.w;
    d.node.fy = ((e.clientY - rect.top) / rect.height) * size.h;
    d.moved = true;
  };
  const endDrag = (select: boolean) => {
    const d = dragRef.current;
    if (!d) return;
    d.node.fx = null;
    d.node.fy = null;
    simRef.current?.alphaTarget(0);
    if (select && !d.moved) onSelect(selected === d.node.id ? null : d.node.id);
    dragRef.current = null;
  };
  /** Move focus to the nearest node in the direction of the arrow, by position on the canvas; nothing happens at the edge. */
  const focusToward = (from: GraphNode, dx: number, dy: number) => {
    let best: GraphNode | null = null;
    let bestScore = Infinity;
    for (const n of nodesRef.current) {
      if (n === from) continue;
      const vx = (n.x ?? 0) - (from.x ?? 0);
      const vy = (n.y ?? 0) - (from.y ?? 0);
      const along = vx * dx + vy * dy;
      if (along <= 0) continue;
      const across = Math.abs(vx * dy - vy * dx);
      const score = along + 2 * across;
      if (score < bestScore) {
        best = n;
        bestScore = score;
      }
    }
    if (best) nodeEls.current.get(best.id)?.focus();
  };
  const onNodeKey = (node: GraphNode, e: KeyboardEvent<SVGGElement>) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        onSelect(selected === node.id ? null : node.id);
        break;
      case "Escape":
        if (selected) onSelect(null);
        break;
      case "ArrowRight":
        e.preventDefault();
        focusToward(node, 1, 0);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusToward(node, -1, 0);
        break;
      case "ArrowDown":
        e.preventDefault();
        focusToward(node, 0, 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusToward(node, 0, -1);
        break;
      case "Home":
      case "End": {
        e.preventDefault();
        const list = nodesRef.current;
        const to = e.key === "Home" ? list[0] : list[list.length - 1];
        if (to) nodeEls.current.get(to.id)?.focus();
        break;
      }
    }
  };

  const neighbours = useMemo(() => {
    const focus = hover ?? selected;
    if (!focus) return null;
    const set = new Set<string>([focus]);
    for (const l of linksRef.current) {
      const s = (l.source as GraphNode).id;
      const t = (l.target as GraphNode).id;
      if (s === focus) set.add(t);
      if (t === focus) set.add(s);
    }
    return set;
  }, [hover, selected, built]);

  const nodes = nodesRef.current;
  const links = linksRef.current;
  const empty = nodes.length === 0;
  // The nodes keep one DOM order, so focus and reading order never change. The full label of the node under the
  // pointer or selected is drawn in its own layer after them, so it sits on top without moving anything.
  const stopId = [tabStop, selected].find((id) => id && nodes.some((n) => n.id === id)) ?? nodes[0]?.id;
  /** Where a node's label sits: centred under it, nudged to stay inside the canvas. */
  const labelAt = (n: GraphNode, text: string) => {
    const half = labelWidth(n, text) / 2;
    const x = n.x ?? 0;
    return { dx: Math.max(-(x - 8 - half), Math.min(size.w - 8 - half - x, 0)), y: nodeRadius(n) + 16 };
  };
  const expandedIds = [...new Set([selected, hover].filter((id): id is string => !!id))];

  return (
    <div ref={containerRef} className={`relative w-full select-none ${className}`} style={{ height: size.h }}>
      <svg
        viewBox={`0 0 ${size.w} ${size.h}`}
        role="group"
        aria-label="Truth graph. Claims, and the people and agents behind them. Arrow keys move between nodes, Enter selects one. The list view reads the same ledger as text."
        className="absolute inset-0 h-full w-full"
        style={{ touchAction: "pan-y" }}
        onPointerMove={onPointerMove}
        onPointerUp={() => endDrag(true)}
        onPointerCancel={() => endDrag(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) onSelect(null);
        }}
      >
        <g aria-hidden>
          {links.map((l) => {
            const s = l.source as GraphNode;
            const t = l.target as GraphNode;
            const st = EDGE_STYLE[l.kind];
            const dim = neighbours ? !(neighbours.has(s.id) && neighbours.has(t.id)) : false;
            return <line key={l.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={st.stroke} strokeWidth={st.width} strokeDasharray={st.dash} opacity={dim ? 0.2 : 1} style={{ transition: "opacity 200ms var(--ease-standard)" }} />;
          })}
        </g>
        <g>
          {nodes.map((n) => {
            const r = nodeRadius(n);
            const dim = neighbours ? !neighbours.has(n.id) : false;
            const isSel = selected === n.id;
            const isFocus = focused === n.id;
            const fresh = highlight?.has(n.id);
            const expanded = expandedIds.includes(n.id);
            const x = n.x ?? 0;
            const y = n.y ?? 0;
            const label = labelAt(n, n.label);
            let shape: React.ReactNode;
            let ring: React.ReactNode = null;
            if (n.entry) {
              const look = entryLook(n.entry);
              const dash = look.dead ? "3 2" : undefined;
              const o = look.dead ? 0.6 : 1;
              if (look.shape === "tb") {
                shape = look.dead ? (
                  <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={4} style={{ fill: "var(--card)", stroke: "var(--secondary-foreground)", strokeWidth: 1.5 }} strokeDasharray={dash} opacity={o} />
                ) : (
                  <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={4} style={{ fill: "var(--accent)", stroke: "var(--card)", strokeWidth: 2 }} />
                );
                if (look.appeal) ring = <rect x={-r - 6} y={-r - 6} width={(r + 6) * 2} height={(r + 6) * 2} rx={8} style={{ fill: "none", stroke: "var(--secondary-foreground)", strokeWidth: 1.5 }} strokeDasharray="4 3" />;
              } else {
                shape = (
                  <g opacity={o}>
                    <circle r={r} style={{ fill: "var(--card)", stroke: "var(--secondary-foreground)", strokeWidth: 1.5 }} strokeDasharray={dash} />
                    {look.corroborated && <circle r={Math.max(3, r / 3)} style={{ fill: "var(--secondary-foreground)" }} />}
                  </g>
                );
              }
            } else if (n.kind === "agent") {
              shape = <circle r={r} style={{ fill: "var(--card)", stroke: "var(--foreground)", strokeWidth: 2 }} />;
            } else {
              shape = <circle r={r} style={{ fill: "var(--foreground)", stroke: "var(--card)", strokeWidth: 2 }} />;
            }
            const selRing = isSel ? (
              n.kind === "TB" ? (
                <rect x={-r - 4} y={-r - 4} width={(r + 4) * 2} height={(r + 4) * 2} rx={7} style={{ fill: "none", stroke: "var(--foreground)", strokeWidth: 1.5 }} />
              ) : (
                <circle r={r + 4} style={{ fill: "none", stroke: "var(--foreground)", strokeWidth: 1.5 }} />
              )
            ) : null;
            const focusRing =
              isFocus && !isSel ? (
                n.kind === "TB" ? (
                  <rect x={-r - 5} y={-r - 5} width={(r + 5) * 2} height={(r + 5) * 2} rx={8} style={{ fill: "none", stroke: "var(--accent)", strokeWidth: 2 }} />
                ) : (
                  <circle r={r + 5} style={{ fill: "none", stroke: "var(--accent)", strokeWidth: 2 }} />
                )
              ) : null;
            const name = n.entry ? `${n.entry.marker} ${n.full}` : `${n.kind === "agent" ? "Agent" : "Person"} ${n.full}`;
            return (
              <g
                key={n.id}
                ref={(el) => {
                  if (el) nodeEls.current.set(n.id, el);
                  else nodeEls.current.delete(n.id);
                }}
                role="button"
                tabIndex={n.id === stopId ? 0 : -1}
                aria-label={name}
                aria-pressed={isSel}
                transform={`translate(${x},${y})`}
                opacity={dim ? 0.35 : 1}
                style={{ transition: "opacity 200ms var(--ease-standard)", cursor: "pointer", outline: "none" }}
                className={fresh ? "truth-in" : undefined}
                onPointerDown={(e) => onPointerDown(n, e)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                onKeyDown={(e) => onNodeKey(n, e)}
                onFocus={(e) => {
                  setTabStop(n.id);
                  setFocused(e.currentTarget.matches(":focus-visible") ? n.id : null);
                }}
                onBlur={() => setFocused((f) => (f === n.id ? null : f))}
              >
                <title>{n.entry ? `${n.entry.marker} ${n.full}` : n.full}</title>
                {/* A touch target well over 24px, however small the node */}
                <circle r={r + 10} fill="transparent" />
                {ring}
                {focusRing}
                {selRing}
                {shape}
                {!expanded && (
                  <text
                    x={label.dx}
                    y={label.y}
                    textAnchor="middle"
                    fontSize={12}
                    fontFamily={n.entry ? "var(--font-sans)" : "var(--font-mono)"}
                    style={{ ...HALO, fill: n.entry ? "var(--foreground)" : "var(--secondary-foreground)" }}
                  >
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        <g aria-hidden style={{ pointerEvents: "none" }}>
          {expandedIds.map((id) => {
            const n = nodes.find((m) => m.id === id);
            if (!n) return null;
            const text = clip(n.full, 64);
            const at = labelAt(n, text);
            return (
              <text
                key={id}
                x={(n.x ?? 0) + at.dx}
                y={(n.y ?? 0) + at.y}
                textAnchor="middle"
                fontSize={12}
                fontFamily={n.entry ? "var(--font-sans)" : "var(--font-mono)"}
                style={{ ...HALO, fill: n.entry ? "var(--foreground)" : "var(--secondary-foreground)" }}
              >
                {text}
              </text>
            );
          })}
        </g>
      </svg>
      {empty && emptyMessage && <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>}
    </div>
  );
}
