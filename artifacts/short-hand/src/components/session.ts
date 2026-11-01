import demo from "@/data/demo.json";

/** Real CompactionEngine output for one 24-message session (see scripts/bake-demo.mjs). */
export { demo };

export type FrameData = (typeof demo.frames)[number];
export type SectionData = FrameData["sections"][number];

export const RAW_TOKENS = demo.rawTokens;
export const BUDGETS = demo.frames.map((f) => f.tokenBudget);

/** Message i of the session is m{i}; its token count is the engine's ceil(length / 4). */
export const MESSAGES = demo.messages.map((m, i) => ({
  id: `m${i + 1}`,
  role: m.role,
  content: m.content,
  tokens: Math.ceil(m.content.length / 4),
}));

/** Messages whose compacted entries a correction archived as superseded. */
export const ARCHIVED: ReadonlySet<string> = new Set(demo.archivedMessageIds);

const isMessageId = (s: string) => /^m\d+$/.test(s);

/** The ids of the messages this frame cites (the engine's item sources). */
export function citedIds(frame: FrameData): Set<string> {
  const ids = new Set<string>();
  for (const section of frame.sections) {
    for (const item of section.items) for (const s of item.sources) if (isMessageId(s)) ids.add(s);
  }
  return ids;
}

export const messageSources = (sources: string[]) => sources.filter(isMessageId);

export const omittedOf = (frame: FrameData) => Object.entries(frame.omitted as Record<string, number>);

export const shareOfRaw = (frame: FrameData) => Math.round((frame.tokenUsage / RAW_TOKENS) * 100);
