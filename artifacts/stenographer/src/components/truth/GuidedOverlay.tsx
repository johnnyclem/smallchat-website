import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Gavel, LogOut, Pointer, User, Wand2 } from "lucide-react";
import type { GuidedWalk } from "@/lib/use-guided-walk";
import type { Actor } from "@/lib/truth/types";

/**
 * Sits over the graph during the guided walk. Between moves it dims the
 * graph and asks for a tap; the tap runs the move and the overlay lifts so
 * the graph can be watched. At the end it offers free play or the live
 * ledger.
 */
export function GuidedOverlay({ walk, onExit }: { walk: GuidedWalk; onExit: () => void }) {
  const show = walk.phase === "ready" && !walk.freePlay && !walk.busy;
  const { step, last, next, total, done } = walk;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={done ? "done" : next}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px]"
          role={done ? undefined : "button"}
          onClick={done ? undefined : () => void walk.play()}
          style={{ cursor: done ? "default" : "pointer" }}
        >
          <div className="w-full max-w-md text-center select-none">
            {last && (
              <p className={`mb-3 inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${last.result.ok ? "border-green-500/30 text-green-300 bg-green-500/10" : "border-red-500/30 text-red-300 bg-red-500/10"}`}>
                {last.result.ok ? <Check className="w-3.5 h-3.5" /> : <Gavel className="w-3.5 h-3.5" />}
                {last.result.ok ? `move ${next} · on the record` : `move ${next} · refused`}
              </p>
            )}
            {step ? (
              <>
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">Move {next + 1} of {total}</p>
                <h4 className="mt-1 text-lg sm:text-2xl font-semibold text-white leading-snug">{step.title}</h4>
                <p className="mt-2 text-sm text-white/70 leading-relaxed line-clamp-2 sm:line-clamp-3">{step.lead}</p>
                <div className="mt-3 flex justify-center">
                  <ActorChip actor={step.who(walk.you)} />
                </div>
                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-[0_0_25px_var(--primary-glow)] animate-pulse">
                  <Pointer className="w-4 h-4" /> {next === 0 ? "Tap to start" : step.expect === "refused" ? "Tap to try it anyway" : "Tap to run this move"}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground hidden sm:block">then watch the graph · full story and the engine's answer below</p>
              </>
            ) : (
              <>
                <h4 className="text-xl sm:text-2xl font-semibold text-white">That's the whole loop</h4>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">
                  Agents found every fact and settled none of them. Two TBs signed, one overridden, one appeal refuted, one claim struck, and every change a line you can re-hash.
                </p>
                <div className="mt-4 flex justify-center gap-2 flex-wrap">
                  <button onClick={() => walk.setFreePlay(true)} className="btn btn-glass h-10 px-4 text-sm">
                    <Wand2 className="w-4 h-4" /> Free play here
                  </button>
                  <button onClick={onExit} className="btn btn-primary h-10 px-4 text-sm">
                    <LogOut className="w-4 h-4" /> The live ledger
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActorChip({ actor }: { actor: Actor }) {
  const agent = actor.role === "agent";
  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/10 bg-black/40 text-xs">
      {agent ? <Bot className="w-3.5 h-3.5 text-sky-300" /> : <User className="w-3.5 h-3.5 text-primary" />}
      <span className={`font-mono ${agent ? "text-sky-300" : "text-white"}`}>{actor.by}</span>
      {agent ? <span className="font-mono text-white/40">{actor.agentSessionId}</span> : <span className="text-muted-foreground">a person</span>}
    </span>
  );
}
