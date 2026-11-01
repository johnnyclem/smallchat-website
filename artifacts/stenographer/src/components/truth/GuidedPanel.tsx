import { AnimatePresence, motion } from "framer-motion";
import { LogOut, RotateCcw } from "lucide-react";
import { useState } from "react";
import { tabPanel } from "@workspace/site-kit";
import type { GuidedWalk } from "@/lib/use-guided-walk";
import { YOU } from "@/lib/adventure";
import { ActionComposer, type ComposerIdentity } from "./ActionComposer";
import { ChoiceList } from "./GuidedOverlay";
import { ResultBanner } from "./pieces";

/**
 * The explainer's side panel. The scene itself is told once, on the graph:
 * while the graph's overlay is up the panel shows only the move count, the
 * two exits, the lesson of the last move and the engine's answer to it. When
 * the overlay lifts so the graph can be watched, the panel offers the same
 * numbered choices for anyone who would rather click here.
 */
export function GuidedPanel({ walk, onExit, sceneOnGraph }: { walk: GuidedWalk; onExit: () => void; sceneOnGraph: boolean }) {
  const [identity, setIdentity] = useState<ComposerIdentity>({ by: YOU.by, role: "human", session: "sess-you" });
  const { scene, choices, last, done, moves } = walk;
  const lastResult = last?.results[last.results.length - 1] ?? null;
  return (
    <div className="flex flex-col gap-4">
      <div className="panel">
        <div className={`panel-header flex-wrap ${sceneOnGraph ? "border-b-0" : ""}`}>
          <p className="font-mono tabular-nums">
            Walk · {moves} {moves === 1 ? "move" : "moves"}
          </p>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => void walk.reset()} className="btn btn-ghost btn-sm px-2">
              <RotateCcw /> Restart
            </button>
            <button type="button" onClick={onExit} className="btn btn-ghost btn-sm px-2">
              <LogOut /> Live ledger
            </button>
          </div>
        </div>
        {!sceneOnGraph && (
          <div className="p-4">
            <AnimatePresence mode="wait">
              <motion.div key={scene.id} {...tabPanel}>
                <h2 className="text-lg font-medium leading-6">{scene.title}</h2>
                {walk.freePlay && <p className="mt-2 text-sm leading-5 text-secondary-foreground">{scene.lead}</p>}
                {!done && <ChoiceList choices={choices} onPick={(c) => void walk.choose(c)} compact />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
      {last && (last.choice.lesson || (!sceneOnGraph && !last.choice.run && last.choice.deadEnd)) && (
        <div className="surface rounded-card p-4">
          <p className="text-sm font-medium leading-5 text-foreground">{last.choice.run ? "What that showed" : "No such move"}</p>
          <p className="mt-1 text-sm leading-5 text-secondary-foreground">{last.choice.run ? last.choice.lesson : last.choice.deadEnd}</p>
        </div>
      )}
      <ResultBanner result={lastResult} />
      {walk.freePlay && walk.model && <ActionComposer entries={walk.model.entries} identity={identity} onIdentity={setIdentity} run={walk.runFree} />}
    </div>
  );
}
