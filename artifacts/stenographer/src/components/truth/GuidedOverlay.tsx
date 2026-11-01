import { AnimatePresence, motion } from "framer-motion";
import { Ban, Bot, LogOut, Pencil, RotateCcw, User } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { EASE } from "@workspace/site-kit";
import type { GuidedWalk } from "@/lib/use-guided-walk";
import type { Choice } from "@/lib/adventure";
import type { Actor } from "@/lib/truth/types";
import { StatusDot } from "./pieces";

/** The overlay is up between moves: waiting for a pick, not free play, nothing running. */
export const overlayOpen = (walk: GuidedWalk) => walk.phase === "ready" && !walk.freePlay && !walk.busy;

/**
 * Reports how tall the scene is, content and padding, so the graph panel can
 * grow to fit it instead of cutting a choice off at the bottom edge.
 */
function useReportHeight(onMeasure?: (height: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const content = el?.firstElementChild as HTMLElement | null | undefined;
    if (!el || !content || !onMeasure) return;
    const report = () => {
      const style = getComputedStyle(el);
      onMeasure(Math.ceil(content.offsetHeight + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)));
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(content);
    return () => ro.disconnect();
  }, [onMeasure]);
  return ref;
}

/**
 * Sits over the graph during the explainer. Between moves it covers the graph
 * with a solid surface and offers the scene's choices; a pick runs the move and
 * the overlay lifts so the graph can be watched. At the end it offers free play
 * or the live ledger. It shares the graph's grid cell, so a tall scene makes
 * the panel taller; it never scrolls inside a fixed box.
 */
export function GuidedOverlay({ walk, onExit, onMeasure }: { walk: GuidedWalk; onExit: () => void; onMeasure?: (height: number) => void }) {
  const show = overlayOpen(walk);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={walk.scene.id + ":" + walk.played.length}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="z-10 bg-card [grid-area:1/1]"
        >
          <OverlayScene walk={walk} onExit={onExit} onMeasure={onMeasure} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OverlayScene({ walk, onExit, onMeasure }: { walk: GuidedWalk; onExit: () => void; onMeasure?: (height: number) => void }) {
  const { scene, choices, last, done } = walk;
  const lastResult = last?.results[last.results.length - 1] ?? null;
  const lastDeadEnd = last && !last.choice.run && last.choice.deadEnd ? last.choice.deadEnd : null;
  const ref = useReportHeight(onMeasure);
  return (
    <div ref={ref} className="flex h-full items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl flow-root">
        {lastResult && (
          <p className="mb-3 flex items-center gap-2 font-mono text-xs leading-4 text-secondary-foreground">
            <StatusDot tone={lastResult.ok ? "positive" : "negative"} />
            {lastResult.ok ? "On the record" : "Refused"}
            {!lastResult.ok && lastResult.refused && <span>· {lastResult.rule.toLowerCase()}</span>}
          </p>
        )}
        {lastDeadEnd && (
          <p className="mb-3 flex items-center gap-2 font-mono text-xs leading-4 text-secondary-foreground">
            <Ban className="icon" /> No such move
          </p>
        )}
        <h2 className="text-xl font-medium leading-7 sm:text-2xl sm:leading-8">{scene.title}</h2>
        <p className="mt-3 text-base leading-6 text-secondary-foreground">{lastDeadEnd ?? scene.lead}</p>
        {done ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => void walk.reset()} className="btn btn-secondary h-10">
              <RotateCcw /> Try another path
            </button>
            <button type="button" onClick={() => walk.setFreePlay(true)} className="btn btn-secondary h-10">
              <Pencil /> Free play here
            </button>
            <button type="button" onClick={onExit} className="btn btn-solid h-10">
              <LogOut /> The live ledger
            </button>
          </div>
        ) : (
          <ChoiceList choices={choices} onPick={(c) => void walk.choose(c)} />
        )}
      </div>
    </div>
  );
}

/** The scene's choices as numbered lines, one number per line in the margin. */
export function ChoiceList({ choices, onPick, compact = false }: { choices: Choice[]; onPick: (c: Choice) => void; compact?: boolean }) {
  return (
    <ol className={`border-t border-border ${compact ? "mt-4" : "mt-6"}`}>
      {choices.map((c, i) => (
        <li key={c.label} className="border-b border-border">
          <ChoiceButton choice={c} index={i + 1} onPick={() => onPick(c)} compact={compact} />
        </li>
      ))}
    </ol>
  );
}

function ChoiceButton({ choice, index, onPick, compact }: { choice: Choice; index: number; onPick: () => void; compact: boolean }) {
  /** A quiet step on has no move behind it and nothing to learn; a trap has a move that isn't one. */
  const quiet = !choice.run && !choice.deadEnd;
  return (
    <button type="button" onClick={onPick} className="transition-quiet grid w-full grid-cols-[40px_1fr] text-left hover:bg-foreground/5">
      <span className="margin-no pt-4" aria-hidden>
        {index}
      </span>
      <span className="flex min-w-0 flex-col gap-1 px-4 py-3">
        <span className="text-base font-medium leading-6 text-foreground">{choice.label}</span>
        {!compact && choice.hint && <span className="hidden text-sm leading-5 text-secondary-foreground sm:block">{choice.hint}</span>}
        {choice.who && !quiet && <ActorChip actor={choice.who} />}
      </span>
    </button>
  );
}

function ActorChip({ actor }: { actor: Actor }) {
  const agent = actor.role === "agent";
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 font-mono text-xs leading-4 tabular-nums text-secondary-foreground">
      {agent ? <Bot className="icon" /> : <User className="icon" />}
      <span>{actor.by}</span>
      {agent && <span>{actor.agentSessionId}</span>}
    </span>
  );
}
