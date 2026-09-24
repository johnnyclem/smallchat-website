import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Gauge, Layers, ScrollText } from "lucide-react";
import { useState } from "react";
import {
  Band,
  GetStarted,
  Glow,
  Hero,
  PullQuote,
  SiteFooter,
  SiteNav,
  StickyNoteIcon,
  TabBar,
  TypewriterIcon,
  tabPanel,
  type SiteMeta,
} from "@workspace/site-kit";
import { BudgetDemo } from "@/components/BudgetDemo";
import { LevelStack } from "@/components/LevelStack";
import { LEVELS } from "@/components/levels";

const SITE: SiteMeta = {
  id: "short-hand",
  name: "short-hand",
  Icon: StickyNoteIcon,
  github: "https://github.com/johnnyclem/short-hand",
  version: "0.1.0",
};
const CLONE = `git clone ${SITE.github}.git`;
const STENOGRAPHER_URL = "https://stenographer.smallchat.dev";

type Tab = "levels" | "importance" | "truth";

function Levels() {
  return (
    <motion.div key="levels" {...tabPanel} className="max-w-3xl mx-auto space-y-1 font-mono text-xs sm:text-sm">
      {LEVELS.map((l) => (
        <div key={l.level} className="flex items-center gap-3 py-2.5 border-b border-white/5">
          <span className={`${l.text} font-bold w-8 shrink-0`}>L{l.level}</span>
          <span className="text-white w-28 shrink-0">{l.name}</span>
          <span className="text-muted-foreground font-sans">{l.fidelity}</span>
        </div>
      ))}
      <p className="pt-4 text-center font-sans text-sm text-muted-foreground">Context frames are built L4 → L0: invariants first, recent messages last.</p>
    </motion.div>
  );
}

function Importance() {
  const signals = [
    { name: "State delta", weight: 45, desc: "Does it change the graph or override something?" },
    { name: "Trajectory discontinuity", weight: 30, desc: "Does the conversation turn here?" },
    { name: "Reference frequency", weight: 25, desc: "Do later messages keep pointing back to it?" },
  ];
  return (
    <motion.div key="importance" {...tabPanel} className="max-w-3xl mx-auto space-y-5">
      {signals.map((s, i) => (
        <div key={s.name} className="space-y-2">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-white font-medium">{s.name}</span>
            <span className="font-mono text-primary">{s.weight}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${s.weight * 2}%` }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{s.desc}</p>
        </div>
      ))}
    </motion.div>
  );
}

function Truth() {
  return (
    <motion.div key="truth" {...tabPanel} className="max-w-3xl mx-auto grid sm:grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6">
      <div className="glass-panel rounded-2xl p-5 text-center">
        <StickyNoteIcon className="w-7 h-7 text-primary mx-auto mb-2" />
        <p className="font-semibold text-white">short-hand</p>
      </div>
      <div className="font-mono text-xs text-muted-foreground space-y-3 text-center">
        <p className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4 text-primary" /> syncTruthLedger</p>
        <p className="flex items-center justify-center gap-2">exportProposalDrafts <ArrowRight className="w-4 h-4 text-primary" /></p>
      </div>
      <a href={STENOGRAPHER_URL} className="glass-panel glass-panel-hover rounded-2xl p-5 text-center block">
        <span className="text-[#f8a828]">
          <TypewriterIcon className="w-7 h-7 mx-auto mb-2" />
        </span>
        <p className="font-semibold text-white">stenographer</p>
      </a>
      <p className="sm:col-span-3 text-center text-sm text-muted-foreground">
        Signed tombstones render as ground truth. Unverified claims stay flagged. A JSONL seam, no code dependency either way.
      </p>
    </motion.div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("levels");

  return (
    <div className="relative w-full">
      <Glow rgb="244,114,182" />
      <div className="relative z-10">
        <SiteNav
          site={SITE}
          links={[
            { href: "#what", label: "What it does" },
            { href: "#try", label: "Try it" },
            { href: "#start", label: "Get Started" },
          ]}
        />

        <Hero
          badge="Open Source · TypeScript · Zero dependencies · MIT License"
          title="short-hand."
          tagline="Old computer science for new constraints."
          lines={<>Recent messages stay verbatim.<br />Older ones condense into summaries, graphs and invariants.<br />Your context window keeps what mattered.</>}
          install={{ display: "git clone …/short-hand", copy: CLONE }}
        >
          <LevelStack />
        </Hero>

        <Band id="what" title="What it does" lede="Progressive context compaction for LLMs, shaped like an LSM tree.">
          <TabBar<Tab>
            tabs={[
              { id: "levels", label: "Five levels", icon: <Layers className="w-3.5 h-3.5" /> },
              { id: "importance", label: "Importance", icon: <Gauge className="w-3.5 h-3.5" /> },
              { id: "truth", label: "Truth ledger", icon: <ScrollText className="w-3.5 h-3.5" /> },
            ]}
            active={tab}
            onChange={setTab}
          />
          <AnimatePresence mode="wait">
            {tab === "levels" && <Levels />}
            {tab === "importance" && <Importance />}
            {tab === "truth" && <Truth />}
          </AnimatePresence>
        </Band>

        <PullQuote cite="Naive truncation loses the decisions.">Truncation forgets. Compaction remembers what mattered.</PullQuote>

        <Band id="try" title="Squeeze it" lede="A 24-message working session. Drag the budget and see what short-hand keeps.">
          <BudgetDemo />
        </Band>

        <PullQuote cite="Proposals only. Nothing becomes truth until an accountable author signs it.">Memory that knows what it knows.</PullQuote>

        <GetStarted
          lede="A library, not a service. Zero runtime dependencies, ESM, fully typed."
          title={`from source · v${SITE.version}`}
          commands={[CLONE, "cd short-hand && npm install && npm run build", "cd ../your-app && npm install ../short-hand"]}
        >
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 text-xs text-muted-foreground font-mono">agent.ts</div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-white/90">{`import { CompactionEngine } from "short-hand";

const engine = new CompactionEngine({ memtableSize: 10 });
await engine.addMessages(history);

const frame = engine.buildContextFrame(2000);
// invariants → graph → summaries → compacted → recent`}</pre>
          </div>
        </GetStarted>

        <SiteFooter site={SITE} />
      </div>
    </div>
  );
}
