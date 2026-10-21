import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, LogOut, RotateCcw, Wand2 } from "lucide-react";
import { useState } from "react";
import type { GuidedWalk } from "@/lib/use-guided-walk";
import { YOU } from "@/lib/adventure";
import { ActionComposer, type ComposerIdentity } from "./ActionComposer";
import { ChoiceButton } from "./GuidedOverlay";
import { ResultBanner } from "./pieces";

/**
 * The explainer's side panel: the scene in full, the lesson of the last
 * move and the engine's answer to it, and the same choices the graph's
 * overlay offers, for anyone who would rather click here.
 */
export function GuidedPanel({ walk, onExit }: { walk: GuidedWalk; onExit: () => void }) {
  const [identity, setIdentity] = useState<ComposerIdentity>({ by: YOU.by, role: "human", session: "sess-you" });
  const { scene, choices, last, done, moves } = walk;
  const lastResult = last?.results[last.results.length - 1] ?? null;
  return (
    <div className="space-y-3">
      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
            Choose your path · {moves} move{moves === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={() => void walk.reset()} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> restart
            </button>
            <button onClick={onExit} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> live ledger
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={scene.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-4">
            <h4 className="text-lg font-semibold text-white">{scene.title}</h4>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{scene.lead}</p>
            {!done && (
              <div className="mt-4 grid gap-2">
                {choices.map((c) => (
                  <ChoiceButton key={c.label} choice={c} onPick={() => void walk.choose(c)} compact />
                ))}
                <p className="text-[11px] text-muted-foreground">or pick on the graph</p>
              </div>
            )}
            {done && (
              <div className="mt-4 flex gap-2 flex-wrap">
                <button onClick={() => void walk.reset()} className="btn btn-glass h-10 px-4 text-sm">
                  <RotateCcw className="w-4 h-4" /> Another path
                </button>
                {!walk.freePlay && (
                  <button onClick={() => walk.setFreePlay(true)} className="btn btn-glass h-10 px-4 text-sm">
                    <Wand2 className="w-4 h-4" /> Free play
                  </button>
                )}
                <button onClick={onExit} className="btn btn-primary h-10 px-4 text-sm">
                  <LogOut className="w-4 h-4" /> The live ledger
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {last && (last.choice.lesson || (!last.choice.run && last.choice.deadEnd)) && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-primary" /> {last.choice.run ? "What that showed" : "No such move"}
          </p>
          <p className="text-muted-foreground leading-relaxed">{last.choice.run ? last.choice.lesson : last.choice.deadEnd}</p>
        </div>
      )}
      <ResultBanner result={lastResult} />
      {walk.freePlay && walk.model && <ActionComposer entries={walk.model.entries} identity={identity} onIdentity={setIdentity} run={walk.runFree} />}
    </div>
  );
}
