/** The five LSM levels, deepest (most compacted) first, as short-hand renders them. */
export const LEVELS = [
  { level: 4, name: "Invariants", fidelity: "Core facts that survive indefinitely", color: "hsl(var(--primary))", text: "text-primary" },
  { level: 3, name: "Graph", fidelity: "Entities and relationships", color: "#38bdf8", text: "text-sky-400" },
  { level: 2, name: "Summaries", fidelity: "Topic-clustered", color: "#4ade80", text: "text-green-400" },
  { level: 1, name: "Compacted", fidelity: "Noise stripped, deduplicated", color: "rgba(255,255,255,0.75)", text: "text-white/80" },
  { level: 0, name: "Memtable", fidelity: "Recent messages, verbatim", color: "rgba(255,255,255,0.35)", text: "text-white/50" },
] as const;

export const levelInfo = (level: number) => LEVELS.find((l) => l.level === level)!;
