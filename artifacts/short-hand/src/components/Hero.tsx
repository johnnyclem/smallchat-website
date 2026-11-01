import { CopyButton } from "@workspace/site-kit";
import { useMemo, type CSSProperties } from "react";
import { Frame, LeftOut } from "./Frame";
import { Tape, TapeKey } from "./Tape";
import { MESSAGES, RAW_TOKENS, citedIds, demo, shareOfRaw } from "./session";

/** The demo frame the hero shows: a 100-token budget, index 3 of the slider. */
const HERO_FRAME = demo.frames[3];

const step = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * The moment: the real 24-message session as a numbered tape beside the frame
 * short-hand compacts it to at 100 tokens. Struck lines were archived by a
 * correction; lit lines are the ones the frame cites, and each frame line
 * ends with its message id.
 */
function HeroView() {
  const frame = HERO_FRAME;
  const cited = useMemo(() => citedIds(frame), [frame]);

  return (
    <figure
      className="panel animate-enter overflow-hidden md:grid md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]"
      style={step(3)}
    >
      <figcaption className="sr-only">
        A {MESSAGES.length}-message session of {RAW_TOKENS} tokens and the context frame short-hand builds from it at a{" "}
        {frame.tokenBudget}-token budget, {frame.tokenUsage} tokens.
      </figcaption>

      <div className="flex flex-col">
        <div className="panel-header">
          <span>{MESSAGES.length} messages</span>
          <span>tok</span>
        </div>
        <Tape cited={cited} variant="hero" />
        <div className="mt-auto">
          <TapeKey />
        </div>
      </div>

      <div className="flex flex-col border-t border-border bg-background md:border-t-0 md:border-l">
        <div className="panel-header">
          <span>Context frame</span>
          <span>budget {frame.tokenBudget} tokens</span>
        </div>
        <div className="px-4 pt-4 pb-3">
          <p className="text-figure text-accent">{frame.tokenUsage}</p>
          <p className="mt-2 text-sm text-secondary-foreground">of {RAW_TOKENS} tokens</p>
          <p className="text-sm text-secondary-foreground">{shareOfRaw(frame)}% of the raw conversation</p>
        </div>
        <div className="border-t border-border">
          <Frame frame={frame} />
        </div>
        <div className="mt-auto border-t border-border px-4 py-3">
          <LeftOut frame={frame} />
        </div>
      </div>
    </figure>
  );
}

/** Text about 40% left, the product view about 60% right, both centred on the first screen. */
export function Hero({ install }: { install: string }) {
  return (
    <section id="top" className="hero">
      <div className="page-container hero-inner grid items-center gap-12 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <h1 className="hero-title animate-enter" style={step(0)}>
            Fit a long conversation into a token budget
          </h1>
          <p className="text-lead mt-6 text-secondary-foreground animate-enter" style={step(1)}>
            A TypeScript library. Recent messages stay verbatim; older ones condense into summaries, a graph and
            invariants, so the context frame stays within your token budget.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 animate-enter" style={step(2)}>
            <a href="#start" className="btn btn-primary btn-lg">
              Get started
            </a>
            <CopyButton
              text={install}
              className="btn btn-secondary btn-lg min-w-0 max-w-full font-mono text-sm"
              label={<span className="truncate">{install}</span>}
            />
          </div>
        </div>
        <HeroView />
      </div>
    </section>
  );
}
