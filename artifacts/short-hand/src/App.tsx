import { Band, PullQuote, SiteFooter, SiteNav, StickyNoteIcon, type SiteMeta } from "@workspace/site-kit";
import { BudgetDemo } from "@/components/BudgetDemo";
import { GetStartedSection } from "@/components/GetStartedSection";
import { Hero } from "@/components/Hero";
import { WhatItDoes } from "@/components/WhatItDoes";

const SITE: SiteMeta = {
  id: "short-hand",
  name: "short-hand",
  Icon: StickyNoteIcon,
  github: "https://github.com/johnnyclem/short-hand",
  version: "1.0.0",
};
const INSTALL = "npm install @shorthand/core@^1";
const CLONE = `git clone ${SITE.github}.git`;

export default function App() {
  return (
    <>
      <SiteNav
        site={SITE}
        links={[
          { href: "#what", label: "What it does" },
          { href: "#try", label: "Try it" },
          { href: "#start", label: "Get started" },
        ]}
      />
      <main>
        <Hero install={INSTALL} />

        <Band
          id="what"
          title="What it does"
          lede="Progressive context compaction for LLMs, shaped like an LSM tree: old computer science for new constraints"
        >
          <WhatItDoes />
        </Band>

        <PullQuote cite="Ledger truth, corrections and invariants first; an item that does not fit is skipped and counted in section.omitted">
          Naive truncation loses important information, so <span className="whitespace-nowrap">short-hand</span> fills
          the frame in priority order
        </PullQuote>

        <Band
          id="try"
          title="Squeeze it"
          lede="Drag the budget over a 24-message working session to see what the frame keeps; it stays at or under the budget, by a ~4 characters per token estimate"
          wide
        >
          <BudgetDemo />
        </Band>

        <PullQuote cite="Nothing short-hand writes becomes truth until an accountable person signs it in stenographer">
          It reads the truth ledger, fails closed, and writes proposals only
        </PullQuote>

        <GetStartedSection install={INSTALL} clone={CLONE} version={SITE.version} />
      </main>
      <SiteFooter site={SITE} tagline="Old computer science for new constraints" />
    </>
  );
}
