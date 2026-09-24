import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import demo from "@/data/demo.json";
import { levelInfo } from "./levels";

const BUDGETS = demo.frames.map((f) => f.tokenBudget);

/** Drag the token budget; see the context frame short-hand builds for it. */
export function BudgetDemo() {
  const [index, setIndex] = useState(3);
  const [showSource, setShowSource] = useState(false);
  const frame = demo.frames[index];
  const pct = Math.round((frame.tokenUsage / demo.rawTokens) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground">Token budget</p>
            <p className="text-4xl font-bold tracking-tight text-white tabular-nums">{frame.tokenBudget}</p>
          </div>
          <p className="text-sm text-muted-foreground text-right">
            <span className="text-white font-semibold tabular-nums">{frame.tokenUsage}</span> of {demo.rawTokens} tokens
            <span className="text-primary font-semibold"> · {pct}%</span> of the raw conversation
          </p>
        </div>
        <input
          type="range"
          min={0}
          max={BUDGETS.length - 1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label="Token budget"
          className="w-full accent-primary cursor-pointer"
        />
        <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
          {frame.sections.map((s, i) => (
            <motion.div
              key={`${s.level}-${i}`}
              layout
              className="h-full"
              style={{ background: levelInfo(s.level).color }}
              animate={{ width: `${(s.tokenEstimate / demo.rawTokens) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {frame.sections.map((s, i) => {
            const info = levelInfo(s.level);
            return (
              <motion.div
                key={`${s.level}-${i}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-panel rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="size-2 rounded-full" style={{ background: info.color }} />
                  <span className={`font-mono text-xs font-bold ${info.text}`}>L{s.level} · {info.name}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{s.tokenEstimate} tok</span>
                </div>
                <pre className="font-mono text-xs sm:text-[13px] leading-6 text-white/80 whitespace-pre-wrap break-words">{s.content}</pre>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="text-center space-y-4">
        <button
          onClick={() => setShowSource((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 cursor-pointer"
        >
          {showSource ? "Hide" : "Show"} the {demo.messages.length} messages it came from
          <ChevronDown className={`w-4 h-4 transition-transform ${showSource ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {showSource && (
            <motion.ol
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden glass-panel rounded-2xl p-4 sm:p-5 text-left space-y-1.5 font-mono text-xs"
            >
              {demo.messages.map((m, i) => (
                <li key={i} className="flex gap-3">
                  <span className={m.role === "user" ? "text-primary w-16 shrink-0" : "text-sky-400 w-16 shrink-0"}>{m.role}</span>
                  <span className="text-white/75">{m.content}</span>
                </li>
              ))}
            </motion.ol>
          )}
        </AnimatePresence>
        <p className="text-xs text-muted-foreground font-mono">real CompactionEngine output · Tier 0 regex compactor · zero dependencies</p>
      </div>
    </div>
  );
}
