import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { identityKey, isAgentIdentity } from "@/lib/truth/identity";
import { linksOf } from "@/lib/truth/fold";
import type { EntryView, ReadModel } from "@/lib/truth/read";
import type { ApprovalRecord, QuorumMember } from "@/lib/truth/types";

/**
 * The ledger as a web: claims (TBs and UVs) and the people and agent
 * sessions that asserted, approved, signed, contested, refuted or struck
 * them. Positions come from a force layout and persist across updates, so
 * a new claim pops in next to whoever made it and the rest barely moves.
 */

export type GraphNode = SimulationNodeDatum & {
  id: string;
  kind: "TB" | "UV" | "human" | "agent";
  label: string;
  /** Entries: the full view. */
  entry?: EntryView;
  /** Identities: how many lines carry the name. */
  weight?: number;
};

export type EdgeKind = "asserted" | "signed" | "approved" | "contests" | "supersedes" | "refuted" | "struck";
export type GraphLink = SimulationLinkDatum<GraphNode> & { id: string; kind: EdgeKind };

const EDGE_STYLE: Record<EdgeKind, { stroke: string; dash?: string; width: number }> = {
  asserted: { stroke: "rgba(255,255,255,0.22)", width: 1 },
  signed: { stroke: "rgba(248,168,40,0.7)", width: 1.5 },
  approved: { stroke: "rgba(74,222,128,0.55)", dash: "3 3", width: 1 },
  contests: { stroke: "rgba(251,146,60,0.85)", dash: "6 4", width: 1.5 },
  supersedes: { stroke: "rgba(248,168,40,0.8)", width: 2 },
  refuted: { stroke: "rgba(248,113,113,0.7)", dash: "2 3", width: 1.2 },
  struck: { stroke: "rgba(248,113,113,0.7)", dash: "2 3", width: 1.2 },
};

const whoId = (name: string) => `who:${identityKey(name)}`;

function buildGraph(model: ReadModel, labelLength: number): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const who = (name: string): string => {
    const id = whoId(name);
    const node = nodes.get(id);
    if (node) node.weight = (node.weight ?? 0) + 1;
    else nodes.set(id, { id, kind: isAgentIdentity(name) ? "agent" : "human", label: name, weight: 1 });
    return id;
  };
  const edge = (source: string, target: string, kind: EdgeKind) => {
    const id = `${source}|${kind}|${target}`;
    if (!links.some((l) => l.id === id)) links.push({ id, kind, source, target });
  };
  for (const e of model.entries) {
    const text = String(e.type === "TB" ? e.line.claim : e.line.assertion);
    nodes.set(e.id, { id: e.id, kind: e.type, label: text.length > labelLength ? `${text.slice(0, labelLength - 2)}…` : text, entry: e });
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

const RADIUS: Record<GraphNode["kind"], number> = { TB: 15, UV: 11, human: 7, agent: 6 };

function entryLook(e: EntryView): { fill: string; stroke: string; dead: boolean; ring?: string } {
  if (e.type === "TB") {
    if (e.status === "active") return { fill: "#f8a828", stroke: "#ffd48a", dead: false };
    if (e.status === "contested") return { fill: "#f8a828", stroke: "#fb923c", dead: false, ring: "#fb923c" };
    return { fill: "#2a2a2a", stroke: "#555", dead: true };
  }
  if (e.status === "open") return e.corroborated ? { fill: "#34d399", stroke: "#a7f3d0", dead: false } : { fill: "#38bdf8", stroke: "#bae6fd", dead: false };
  if (e.status === "verified") return { fill: "#1f2937", stroke: "#6b7280", dead: true };
  return { fill: "#2a2a2a", stroke: "#7f1d1d", dead: true };
}

export function TruthGraph({
  model,
  selected,
  onSelect,
  highlight,
  className = "",
  minHeight = 420,
}: {
  model: ReadModel;
  selected: string | null;
  onSelect: (id: string | null) => void;
  highlight?: Set<string>;
  className?: string;
  minHeight?: number;
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
  const dragRef = useRef<{ node: GraphNode; moved: boolean } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.max(320, entry.contentRect.width);
      setSize({ w, h: Math.max(minHeight, Math.min(720, w * 0.62)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [minHeight]);

  const narrow = size.w < 560;
  const built = useMemo(() => buildGraph(model, narrow ? 26 : 42), [model, narrow]);

  useEffect(() => {
    const prev = new Map(nodesRef.current.map((n) => [n.id, n]));
    const cx = size.w / 2;
    const cy = size.h / 2;
    const nodes = built.nodes.map((n) => {
      const kept = prev.get(n.id);
      if (kept) return Object.assign(kept, { label: n.label, entry: n.entry, weight: n.weight, kind: n.kind });
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
    let sim = simRef.current;
    if (!sim) {
      sim = forceSimulation<GraphNode, GraphLink>()
        .force("charge", forceManyBody<GraphNode>().strength((d) => (d.kind === "TB" ? -520 : d.kind === "UV" ? -380 : -140)))
        .force("collide", forceCollide<GraphNode>().radius((d) => RADIUS[d.kind] + (d.entry ? 26 : 14)).strength(0.9))
        .velocityDecay(0.4)
        .on("tick", () => {
          // Keep every node, label included, inside the canvas
          const padX = sizeRef.current.w < 560 ? 78 : 118;
          const padTop = 24;
          const padBottom = 44;
          for (const n of nodesRef.current) {
            if (n.x !== undefined) n.x = Math.max(padX, Math.min(sizeRef.current.w - padX, n.x));
            if (n.y !== undefined) n.y = Math.max(padTop, Math.min(sizeRef.current.h - padBottom, n.y));
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
          .distance((l) => (l.kind === "contests" ? 110 : l.kind === "supersedes" ? 90 : 62))
          .strength((l) => (l.kind === "asserted" || l.kind === "signed" ? 0.5 : 0.25))
      )
      .force("center", forceCenter(cx, cy).strength(0.06))
      .force("x", forceX(cx).strength(0.03))
      .force("y", forceY(cy).strength(0.05))
      .alpha(prev.size === 0 ? 1 : 0.6)
      .restart();
  }, [built, size.w, size.h]);

  useEffect(
    () => () => {
      simRef.current?.stop();
    },
    []
  );

  const onPointerDown = (node: GraphNode, e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { node, moved: false };
    simRef.current?.alphaTarget(0.3).restart();
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const rect = e.currentTarget.getBoundingClientRect();
    d.node.fx = ((e.clientX - rect.left) / rect.width) * size.w;
    d.node.fy = ((e.clientY - rect.top) / rect.height) * size.h;
    d.moved = true;
  };
  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d) return;
    d.node.fx = null;
    d.node.fy = null;
    simRef.current?.alphaTarget(0);
    if (!d.moved) onSelect(selected === d.node.id ? null : d.node.id);
    dragRef.current = null;
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

  return (
    <div ref={containerRef} className={`relative w-full select-none ${className}`} style={{ height: size.h }}>
      <svg
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="absolute inset-0 w-full h-full touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) onSelect(null);
        }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g>
          {links.map((l) => {
            const s = l.source as GraphNode;
            const t = l.target as GraphNode;
            const st = EDGE_STYLE[l.kind];
            const dim = neighbours ? !(neighbours.has(s.id) && neighbours.has(t.id)) : false;
            return (
              <line
                key={l.id}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={st.stroke}
                strokeWidth={st.width}
                strokeDasharray={st.dash}
                opacity={dim ? 0.12 : 1}
                style={{ transition: "opacity 200ms" }}
              />
            );
          })}
        </g>
        <g>
          {nodes.map((n) => {
            const r = RADIUS[n.kind];
            const dim = neighbours ? !neighbours.has(n.id) : false;
            const isSel = selected === n.id;
            const fresh = highlight?.has(n.id);
            const x = n.x ?? 0;
            const y = n.y ?? 0;
            let shape: React.ReactNode;
            if (n.entry) {
              const look = entryLook(n.entry);
              const common = { fill: look.fill, stroke: isSel ? "#fff" : look.stroke, strokeWidth: isSel ? 3 : 1.5, strokeDasharray: look.dead ? "3 2" : undefined, opacity: look.dead ? 0.55 : 1 };
              shape =
                n.kind === "TB" ? (
                  <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={5} {...common} />
                ) : (
                  <circle r={r} {...common} />
                );
              if (look.ring) shape = (
                <>
                  <circle r={r + 7} fill="none" stroke={look.ring} strokeWidth={1.5} strokeDasharray="4 3" className="truth-spin" />
                  {shape}
                </>
              );
            } else {
              shape = <circle r={r + Math.min(4, (n.weight ?? 1) - 1)} fill={n.kind === "agent" ? "#0b1220" : "#f5f5f5"} stroke={n.kind === "agent" ? "#7dd3fc" : "#fff"} strokeWidth={isSel ? 3 : 1.5} />;
            }
            return (
              <g
                key={n.id}
                transform={`translate(${x},${y})`}
                opacity={dim ? 0.2 : 1}
                style={{ transition: "opacity 200ms", cursor: "pointer" }}
                filter={fresh || isSel ? "url(#glow)" : undefined}
                className={fresh ? "truth-pop" : undefined}
                onPointerDown={(e) => onPointerDown(n, e)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
              >
                <title>{n.entry ? `${n.entry.marker} ${String(n.entry.type === "TB" ? n.entry.line.claim : n.entry.line.assertion)}` : n.label}</title>
                {shape}
                <text
                  y={r + 13}
                  textAnchor="middle"
                  fontSize={n.entry ? 10.5 : 10}
                  fontFamily={n.entry ? "Inter, sans-serif" : "JetBrains Mono, monospace"}
                  fill={n.entry ? "rgba(255,255,255,0.85)" : n.kind === "agent" ? "#7dd3fc" : "rgba(255,255,255,0.7)"}
                  style={{ pointerEvents: "none", paintOrder: "stroke", stroke: "rgba(10,10,10,0.9)", strokeWidth: 3 }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {empty && <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Nothing on the record yet.</p>}
      <div className="absolute left-3 bottom-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-muted-foreground pointer-events-none">
        <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary align-middle mr-1" />TB · truth</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400 align-middle mr-1" />UV · unverified</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 align-middle mr-1" />UV · corroborated</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-white align-middle mr-1" />person</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full border border-sky-300 align-middle mr-1" />agent</span>
        <span><span className="inline-block w-5 border-t border-dashed border-orange-400 align-middle mr-1" />contests</span>
        <span><span className="inline-block w-5 border-t-2 border-primary align-middle mr-1" />supersedes</span>
        <span><span className="inline-block w-5 border-t border-dashed border-green-400 align-middle mr-1" />approved</span>
      </div>
    </div>
  );
}
