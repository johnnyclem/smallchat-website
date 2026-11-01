import type { CSSProperties } from "react";
import { CopyButton } from "@workspace/site-kit";
import { ConceptSheet } from "./ConceptSheet";

const CLONE = "git clone https://github.com/johnnyclem/polytician.git";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * A drawing sheet: the headline is its title, the concept sheet is the drawing.
 * The headline runs the full width in two sentences, the lede and the actions
 * share one row from 1024px, and the sheet spans the container below them, so
 * it starts on the first screen and runs past the fold.
 */
export function Hero() {
  return (
    <section id="top" className="section-hero">
      <div className="page-container">
        <h1 className="hero-title animate-enter" style={step(0)}>
          <span className="block">Save a concept once.</span> <span className="block">Read it back as markdown, a&nbsp;graph or a&nbsp;vector</span>
        </h1>

        <div className="mt-6 grid gap-x-12 gap-y-8 lg:mt-8 lg:grid-cols-12 lg:items-start">
          <p className="text-lead animate-enter text-secondary-foreground lg:col-span-5" style={step(1)}>
            A local-first MCP server that gives Claude, or any MCP client, a memory it can search by meaning, on your own machine
          </p>
          <div className="animate-enter lg:col-span-7" style={step(2)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#start" className="btn btn-primary btn-lg">
                Get started
              </a>
              <div className="cmd-field">
                <div role="group" aria-label="Clone command" tabIndex={0} className="cmd-text">
                  {CLONE}
                </div>
                <CopyButton text={CLONE} label="" ariaLabel={`Copy ${CLONE}`} className="btn btn-ghost btn-sm -mr-2 w-9 px-0" />
              </div>
            </div>
            <p className="text-meta mt-4">MIT · Node 22+ · stdio or Streamable HTTP</p>
          </div>
        </div>

        <div className="animate-enter mt-12 lg:mt-16" style={step(3)}>
          <ConceptSheet />
        </div>
      </div>
    </section>
  );
}
