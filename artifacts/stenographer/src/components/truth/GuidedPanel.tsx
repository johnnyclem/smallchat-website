import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronRight, LogOut, Play, RotateCcw, User, Wand2 } from "lucide-react";
import { useState } from "react";
import type { GuidedWalk } from "@/lib/use-guided-walk";
import type { Actor } from "@/lib/truth/types";
import { ActionComposer, type ComposerIdentity } from "./ActionComposer";
import { ResultBanner } from "./pieces";

/**
 * The guided walk's side panel: the full narration of the move the graph
 * is waiting on, the engine's answer to the last one, and the same Next the
 * graph's overlay offers, for anyone who would rather click here.
 */
export function GuidedPanel({ walk, onExit }: { walk: GuidedWalk; onExit: () => void }) {
  const [identity, setIdentity] = useState<ComposerIdentity>({ by: walk.you.by, role: "human", session: "sess-you" });
  const { step, next, last, done, busy, total } = walk;
  return (
    <div className="space-y-3">
      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">{done ? "The walk" : `Move ${next + 1} of ${total}`}</p>
          <div className="flex items-center gap-3">
            <button onClick={() => void walk.reset()} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> restart
            </button>
            <button onClick={onExit} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> live ledger
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: total }, (_, i) => {
            const p = walk.played[i];
            const cls = !p ? (i === next ? "bg-white/60" : "bg-white/10") : p.result.ok ? "bg-green-400/80" : "bg-red-400/80";
            return <span key={i} className={`h-1 flex-1 rounded-full ${cls}`} />;
          })}
        </div>
        <AnimatePresence mode="wait">
          {step ? (
            <motion.div key={next} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-4">
              <h4 className="text-lg font-semibold text-white">{step.title}</h4>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.lead}</p>
              <ActorChip actor={step.who(walk.you)} />
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button onClick={() => void walk.play()} disabled={busy} className="btn btn-glass h-9 px-4 text-sm">
                  {next === 0 ? <Play className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {busy ? "…" : next === 0 ? "Start" : "Next"}
                </button>
                <span className="text-xs text-muted-foreground">or tap the graph</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
              <h4 className="text-lg font-semibold text-white">That's the whole loop</h4>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Try your own moves on this sandbox, or go back to the live ledger and make a real claim.
              </p>
              <div className="mt-4 flex gap-2 flex-wrap">
                {!walk.freePlay && (
                  <button onClick={() => walk.setFreePlay(true)} className="btn btn-glass h-10 px-4 text-sm">
                    <Wand2 className="w-4 h-4" /> Free play here
                  </button>
                )}
                <button onClick={onExit} className="btn btn-primary h-10 px-4 text-sm">
                  <LogOut className="w-4 h-4" /> The live ledger
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ResultBanner result={last?.result ?? null} />
      {walk.freePlay && walk.model && <ActionComposer entries={walk.model.entries} identity={identity} onIdentity={setIdentity} run={walk.runFree} />}
    </div>
  );
}

function ActorChip({ actor }: { actor: Actor }) {
  const agent = actor.role === "agent";
  return (
    <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/30 text-xs">
      {agent ? <Bot className="w-3.5 h-3.5 text-sky-300" /> : <User className="w-3.5 h-3.5 text-primary" />}
      <span className={`font-mono ${agent ? "text-sky-300" : "text-white"}`}>{actor.by}</span>
      {agent && <span className="font-mono text-white/40">{actor.agentSessionId}</span>}
      {!agent && <span className="text-muted-foreground">a person</span>}
    </div>
  );
}
