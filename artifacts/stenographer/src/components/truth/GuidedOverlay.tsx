import { AnimatePresence, motion } from "framer-motion";
import { Ban, Bot, Check, Gavel, LogOut, User, Wand2 } from "lucide-react";
import type { GuidedWalk } from "@/lib/use-guided-walk";
import type { Choice } from "@/lib/adventure";
import type { Actor } from "@/lib/truth/types";

/**
 * Sits over the graph during the explainer. Between moves it dims the graph
 * and offers the scene's choices; a pick runs the move and the overlay
 * lifts so the graph can be watched. At the end it offers free play or the
 * live ledger.
 */
export function GuidedOverlay({ walk, onExit }: { walk: GuidedWalk; onExit: () => void }) {
  const show = walk.phase === "ready" && !walk.freePlay && !walk.busy;
  const { scene, choices, last, done } = walk;
  const lastResult = last?.results[last.results.length - 1] ?? null;
  const lastDeadEnd = last && !last.choice.run && last.choice.deadEnd ? last.choice.deadEnd : null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={scene.id + ":" + walk.played.length}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-10 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-[2px] overflow-y-auto"
        >
          <div className="w-full max-w-lg text-center select-none my-auto">
            {lastResult && (
              <p className={`mb-2 inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border ${lastResult.ok ? "border-green-500/30 text-green-300 bg-green-500/10" : "border-red-500/30 text-red-300 bg-red-500/10"}`}>
                {lastResult.ok ? <Check className="w-3.5 h-3.5" /> : <Gavel className="w-3.5 h-3.5" />}
                {lastResult.ok ? "on the record" : "refused"}
                {!lastResult.ok && lastResult.refused && <span className="text-red-300/70">· {lastResult.rule.toLowerCase()}</span>}
              </p>
            )}
            {lastDeadEnd && (
              <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border border-white/15 text-white/70 bg-white/5">
                <Ban className="w-3.5 h-3.5" /> no such move
              </p>
            )}
            <h4 className="text-lg sm:text-2xl font-semibold text-white leading-snug">{scene.title}</h4>
            <p className={`mt-1.5 text-sm text-white/70 leading-relaxed ${lastDeadEnd ? "line-clamp-4" : "line-clamp-2 sm:line-clamp-3"}`}>{lastDeadEnd ?? scene.lead}</p>
            {done ? (
              <div className="mt-4 flex justify-center gap-2 flex-wrap">
                <button onClick={() => void walk.reset()} className="btn btn-glass h-10 px-4 text-sm">
                  Try another path
                </button>
                <button onClick={() => walk.setFreePlay(true)} className="btn btn-glass h-10 px-4 text-sm">
                  <Wand2 className="w-4 h-4" /> Free play here
                </button>
                <button onClick={onExit} className="btn btn-primary h-10 px-4 text-sm">
                  <LogOut className="w-4 h-4" /> The live ledger
                </button>
              </div>
            ) : (
              <div className="mt-3 sm:mt-4 grid gap-1.5 sm:gap-2 text-left">
                {choices.map((c) => (
                  <ChoiceButton key={c.label} choice={c} onPick={() => void walk.choose(c)} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ChoiceButton({ choice, onPick, compact = false }: { choice: Choice; onPick: () => void; compact?: boolean }) {
  /** A trap with no move behind it, or a quiet step on (no move either, but nothing to learn). */
  const dead = !choice.run && !!choice.deadEnd;
  const quiet = !choice.run && !choice.deadEnd;
  return (
    <button
      onClick={onPick}
      className={`group w-full text-left rounded-xl border px-3 py-2 sm:px-3.5 sm:py-2.5 cursor-pointer transition-colors ${dead || quiet ? "border-white/10 bg-white/[0.03] hover:border-white/25" : "border-primary/30 bg-primary/[0.08] hover:bg-primary/[0.14] hover:border-primary/50"}`}
    >
      <span className="flex items-start gap-2.5">
        <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${dead || quiet ? "bg-white/10 text-white/60" : "bg-primary text-primary-foreground"}`}>
          {dead ? "?" : quiet ? "→" : "›"}
        </span>
        <span className="min-w-0">
          <span className={`block text-sm font-semibold ${dead || quiet ? "text-white/80" : "text-white"}`}>{choice.label}</span>
          {!compact && choice.hint && <span className="hidden sm:block text-[11px] text-white/55 leading-snug">{choice.hint}</span>}
          {choice.who && !quiet && <ActorChip actor={choice.who} />}
        </span>
      </span>
    </button>
  );
}

function ActorChip({ actor }: { actor: Actor }) {
  const agent = actor.role === "agent";
  return (
    <span className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-mono">
      {agent ? <Bot className="w-3 h-3 text-sky-300" /> : <User className="w-3 h-3 text-primary" />}
      <span className={agent ? "text-sky-300" : "text-white/80"}>{actor.by}</span>
      {agent && <span className="text-white/35">{actor.agentSessionId}</span>}
    </span>
  );
}
