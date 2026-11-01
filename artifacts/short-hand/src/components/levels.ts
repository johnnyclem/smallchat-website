/** The five LSM levels, deepest (most compacted) first, as short-hand renders them. */
export const LEVELS = [
  { level: 4, name: "Invariants", fidelity: "Core facts that survive indefinitely", hue: "var(--level-4)" },
  { level: 3, name: "Graph", fidelity: "Entities and relationships", hue: "var(--level-3)" },
  { level: 2, name: "Summaries", fidelity: "Topic-clustered", hue: "var(--level-2)" },
  { level: 1, name: "Compacted", fidelity: "Verbatim; pure acks dropped", hue: "var(--level-1)" },
  { level: 0, name: "Memtable", fidelity: "Recent messages, verbatim", hue: "var(--level-0)" },
] as const;

export const levelInfo = (level: number) => LEVELS.find((l) => l.level === level)!;
