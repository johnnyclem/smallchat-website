import { AnimatePresence, motion } from "framer-motion";
import { Check, Gavel, Hand } from "lucide-react";
import { useState } from "react";
import { judge, type Tombstone } from "@/lib/matcher";

const TOMBSTONES: (Tombstone & { examples: string[] })[] = [
  {
    id: "TB-0007",
    claim: "LOG_BUDGET 30 is dead; the budget is 100.",
    literal: { subject: "LOG_BUDGET", dead: "30", current: "100" },
    examples: [
      "Setting LOG_BUDGET = 30 in ingest/config.ts",
      "the log budget is 30 now",
      "logBudget: 300 should be plenty",
      "Bumped the budget from 30 to 100",
    ],
  },
  {
    id: "TB-0012",
    claim: "legacyRateLimiter is gone; use TokenBucket.",
    literal: { dead: "legacyRateLimiter", current: "TokenBucket" },
    examples: [
      "Wrapping the call in legacyRateLimiter",
      "legacyRateLimiterV2 is a different class",
      "Replaced legacyRateLimiter with TokenBucket",
    ],
  },
  {
    id: "TB-0019",
    claim: "We left postgres; the database is sqlite.",
    literal: { subject: "database", dead: "postgres", current: "sqlite" },
    examples: [
      "database: postgres",
      "we moved the database from postgres to sqlite",
      "postgres docs say the database needs a vacuum",
    ],
  },
];

/** Type what an agent might say; see whether Stenographer objects. */
export function ObjectionPlayground() {
  const [selected, setSelected] = useState(0);
  const tb = TOMBSTONES[selected];
  const [line, setLine] = useState(tb.examples[0]);
  const verdict = judge(line, tb);
  const objecting = verdict.kind === "objection";

  const pick = (i: number) => {
    setSelected(i);
    setLine(TOMBSTONES[i].examples[0]);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.3fr] gap-4 sm:gap-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">On the record</p>
        {TOMBSTONES.map((t, i) => {
          const active = i === selected;
          return (
            <button
              key={t.id}
              onClick={() => pick(i)}
              className={`w-full text-left rounded-2xl border p-3 sm:p-4 transition-all cursor-pointer ${
                active ? "border-primary/40 bg-primary/5" : "border-white/5 bg-card/40 hover:border-white/15"
              }`}
            >
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">TB</span>
                <span className="text-muted-foreground">{t.id}</span>
              </div>
              <p className={`hidden sm:block mt-2 text-sm sm:text-base ${active ? "text-white" : "text-white/70"}`}>{t.claim}</p>
              <p className="mt-1.5 font-mono text-xs text-muted-foreground truncate">
                {t.literal.subject ? `${t.literal.subject} = ` : ""}
                <span className="text-red-400 line-through">{t.literal.dead}</span>
                {t.literal.current && <> → <span className="text-green-400">{t.literal.current}</span></>}
              </p>
            </button>
          );
        })}
      </div>

      <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
        <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">The agent says</p>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 focus-within:border-primary/50 transition-colors">
          <span className="font-mono text-sm text-sky-400 shrink-0">@agent ›</span>
          <input
            value={line}
            onChange={(e) => setLine(e.target.value)}
            spellCheck={false}
            aria-label="Agent output"
            className="w-full bg-transparent py-3 font-mono text-sm text-white outline-none placeholder:text-white/30"
            placeholder="type anything an agent might write…"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {tb.examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setLine(ex)}
              className={`text-left px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                ex === line ? "border-white/20 bg-white/10 text-white" : "border-white/5 text-muted-foreground hover:text-white/80"
              }`}
            >
              {ex}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${verdict.kind}:${verdict.reason}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`mt-auto rounded-xl border p-4 ${
              objecting ? "border-red-500/40 bg-red-500/10" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className={`flex items-center gap-2 font-semibold ${objecting ? "text-red-400" : "text-green-400"}`}>
              {objecting ? <Gavel className="w-4 h-4" /> : line.trim() ? <Check className="w-4 h-4" /> : <Hand className="w-4 h-4" />}
              {objecting ? "Objection!" : "No objection"}
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{verdict.reason}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
