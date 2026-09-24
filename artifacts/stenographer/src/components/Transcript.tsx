import { AnimatePresence, motion } from "framer-motion";
import { Gavel } from "lucide-react";
import { useEffect, useState } from "react";

type Line =
  | { kind: "user" | "agent"; who: string; text: React.ReactNode }
  | { kind: "objection" };

const SCRIPT: Line[] = [
  { kind: "user", who: "you", text: "The ingest worker is dropping logs. Can you raise the budget?" },
  {
    kind: "agent",
    who: "@ingest",
    text: (
      <>
        Setting <code className="text-white">LOG_BUDGET = 30</code> in{" "}
        <code className="text-muted-foreground">ingest/config.ts</code> so we stop truncating…
      </>
    ),
  },
  { kind: "objection" },
  {
    kind: "agent",
    who: "@ingest",
    text: (
      <>
        Understood. TB-0007 is authoritative, so I'm using{" "}
        <code className="text-green-400">LOG_BUDGET = 100</code> instead.
      </>
    ),
  },
];

const STEP_MS = 1900;
const HOLD_MS = 4200;

/** A looping transcript in which the stenographer catches a dead value. */
export function Transcript() {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const done = shown >= SCRIPT.length;
    const id = setTimeout(() => setShown(done ? 0 : shown + 1), done ? HOLD_MS : shown === 0 ? 500 : STEP_MS);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl p-5 sm:p-6 min-h-[360px] font-mono text-[13px] leading-relaxed text-left">
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-white/5 text-muted-foreground text-xs">
        <span className="size-2.5 rounded-full bg-red-500/80" />
        <span className="size-2.5 rounded-full bg-yellow-400/80" />
        <span className="size-2.5 rounded-full bg-green-500/80" />
        <span className="ml-2 truncate min-w-0">~/.claude/projects/ingest/5f2c….jsonl</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-red-500 animate-pulse" /> recording
        </span>
      </div>
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {SCRIPT.slice(0, shown).map((line, i) =>
            line.kind === "objection" ? (
              <motion.div
                key={`o${i}`}
                initial={{ opacity: 0, x: -12, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="rounded-xl border border-red-500/40 bg-red-500/10 p-4"
              >
                <div className="flex items-center gap-2 text-red-400 text-xs font-semibold tracking-wide">
                  <Gavel className="size-3.5" /> OBJECTION · OBJ-0012
                  <span className="text-muted-foreground font-normal">↳ TB-0007</span>
                </div>
                <p className="mt-2 text-white font-sans text-sm">
                  <span className="text-red-400">LOG_BUDGET 30</span> is dead; the budget is{" "}
                  <span className="text-green-400">100</span>.
                </p>
                <p className="mt-1.5 text-muted-foreground text-xs">
                  signed johnnyclem · evidence commit a1b2c3 · delivered over the smallchat channel
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`l${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <span className={line.kind === "user" ? "text-primary" : "text-sky-400"}>{line.who}</span>
                <span className="text-muted-foreground"> › </span>
                <span className="text-white/90 font-sans text-sm">{line.text}</span>
              </motion.div>
            ),
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
