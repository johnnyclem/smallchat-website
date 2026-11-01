import { ChevronDown } from "lucide-react";
import { useId, useMemo, useState, type CSSProperties } from "react";
import { Frame, LeftOut } from "./Frame";
import { LEVELS, levelInfo } from "./levels";
import { BUDGETS, MESSAGES, RAW_TOKENS, citedIds, demo, shareOfRaw } from "./session";
import { Tape, TapeKey } from "./Tape";

/** Opens at 180 tokens, where the frame holds all five levels. The hero shows 100. */
const START = BUDGETS.indexOf(180);

const wide = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

/** The frame by level against the whole conversation: the largest object on the screen. */
function LevelBar({ index }: { index: number }) {
  const frame = demo.frames[index];
  const budgetAt = (frame.tokenBudget / RAW_TOKENS) * 100;
  const edge = budgetAt > 80 ? "right-full pr-2" : "left-full pl-2";

  return (
    <div>
      <div
        role="img"
        aria-label={`The frame is ${frame.tokenUsage} of ${RAW_TOKENS} tokens against a budget of ${frame.tokenBudget}: ${frame.sections
          .map((s) => `${s.kind} ${s.tokenEstimate}`)
          .join(", ")}.`}
        className="mt-8 rounded-control border border-border bg-background p-1"
      >
        <div className="relative flex h-16 gap-0.5">
          {frame.sections.map((s) => {
            const w = (s.tokenEstimate / RAW_TOKENS) * 100;
            return (
              <div
                key={s.kind}
                className="flex min-w-0 shrink-0 items-center rounded-tag px-2 font-mono text-xs text-accent-foreground"
                style={{ width: `${w}%`, backgroundColor: levelInfo(s.level).hue }}
                title={`${s.kind}, ${s.tokenEstimate} tok`}
              >
                {w >= 12 && <span className="hidden truncate md:block">{s.kind}</span>}
              </div>
            );
          })}
          <div aria-hidden className="pointer-events-none absolute -top-3 -bottom-3 w-px bg-foreground" style={{ left: `${budgetAt}%` }}>
            <span className={`text-meta absolute -top-5 whitespace-nowrap ${edge}`}>budget {frame.tokenBudget}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-meta" aria-label="Level colours">
          {LEVELS.map((l) => (
            <li key={l.level} className="flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-[2px]" style={{ backgroundColor: l.hue }} />
              L{l.level} {l.name.toLowerCase()}
            </li>
          ))}
        </ul>
        <p className="text-meta">{RAW_TOKENS} tokens in the conversation</p>
      </div>
    </div>
  );
}

/** Drag the token budget; see the typed context frame short-hand builds for it and the lines it cites. */
export function BudgetDemo() {
  const [index, setIndex] = useState(START);
  const [showTape, setShowTape] = useState(wide);
  const tapeId = useId();
  const frame = demo.frames[index];
  const cited = useMemo(() => citedIds(frame), [frame]);
  const v = index / (BUDGETS.length - 1);
  const frameSpan = showTape ? "lg:col-span-5 lg:sticky lg:top-[calc(var(--nav-h)+16px)]" : "lg:col-span-12";

  return (
    <div className="flex flex-col gap-6">
      <div className="panel p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <label htmlFor="budget" className="stat-label">
              Token budget
            </label>
            <p className="text-figure mt-2">
              <output htmlFor="budget">{frame.tokenBudget}</output>
            </p>
          </div>
          <div className="sm:text-right">
            <p className="stat-label">In the frame</p>
            <p className="mt-2">
              <span className="text-figure text-accent">{frame.tokenUsage}</span>
              <span className="stat-label ml-2">of {RAW_TOKENS} tokens</span>
            </p>
            <p className="stat-label mt-1">{shareOfRaw(frame)}% of the raw conversation</p>
          </div>
        </div>

        <div className="range mt-6" style={{ "--v": v } as CSSProperties}>
          <div className="range-rail">
            <div className="range-fill" />
          </div>
          <input
            id="budget"
            type="range"
            className="range-input"
            min={0}
            max={BUDGETS.length - 1}
            step={1}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            aria-valuetext={`${frame.tokenBudget} tokens`}
          />
        </div>
        <div className="text-meta flex justify-between" aria-hidden>
          <span>{BUDGETS[0]}</span>
          <span>{BUDGETS[BUDGETS.length - 1]}</span>
        </div>

        <LevelBar index={index} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className={`flex flex-col gap-4 ${frameSpan}`}>
          <section aria-label="Context frame" className="panel overflow-hidden">
            <div className="panel-header">
              <span>Context frame</span>
              <span>{frame.sections.length} sections</span>
            </div>
            <Frame frame={frame} />
            <div className="border-t border-border px-4 py-3">
              <LeftOut frame={frame} />
            </div>
          </section>
          <div>
            <button
              type="button"
              className="btn btn-secondary"
              aria-expanded={showTape}
              aria-controls={tapeId}
              onClick={() => setShowTape((s) => !s)}
            >
              {showTape ? "Hide" : "Show"} the {MESSAGES.length} messages it came from
              <ChevronDown className={`transition-transform duration-150 ease-standard ${showTape ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        <div id={tapeId} className={showTape ? "lg:col-span-7" : "hidden"}>
          {showTape && (
            <section aria-label="The session" className="panel overflow-hidden">
              <div className="panel-header">
                <span>{MESSAGES.length} messages</span>
                <span>tok</span>
              </div>
              <Tape cited={cited} variant="full" />
              <TapeKey />
            </section>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-meta">
          {demo.tombstones} corrections · {demo.archived} superseded entries archived, not deleted
        </p>
        <p className="text-meta">
          Real @shorthand/core 1.0.0 CompactionEngine output · Tier 0 regex compactor · tokens by its ~4 characters per
          token estimate
        </p>
      </div>
    </div>
  );
}
