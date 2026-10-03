import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Gauge, Layers, ScrollText } from "lucide-react";
import { useState } from "react";
import {
  Band,
  CommandBlock,
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
  version: "1.0.0",
};
const INSTALL = "npm install @shorthand/core@^1";
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
      <p className="pt-4 text-center font-sans text-sm text-muted-foreground">
        A context frame fills in priority order: ledger truth, corrections and invariants first. Up to a quarter of the budget
        is held for the newest messages, then memories, code, graph, summaries and history fill the rest. Recent messages
        render last. Each section has a kind and a fixed marker. The rendered frame stays within its token budget, by a ~4 characters per token estimate.
      </p>
      <p className="text-center font-sans text-sm text-muted-foreground">
        A correction reaches L1 through L4, invariants included. What it supersedes is archived, never deleted.
      </p>
    </motion.div>
  );
}

function Importance() {
  const signals = [
    { name: "State delta", weight: 40, desc: "Does it change the entity graph or override something?" },
    { name: "Trajectory discontinuity", weight: 35, desc: "Does the conversation turn here? Needs message embeddings." },
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
      <p className="pt-2 text-center text-sm text-muted-foreground">
        A standalone scorer: CompactionEngine does not call it. Your host supplies the embeddings; no model ships with the package.
      </p>
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
        <p className="flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4 text-primary" /> syncTruthLedger · truth format v2</p>
        <p className="flex items-center justify-center gap-2">exportProposalDrafts · PROPOSAL <ArrowRight className="w-4 h-4 text-primary" /></p>
      </div>
      <a href={STENOGRAPHER_URL} className="glass-panel glass-panel-hover rounded-2xl p-5 text-center block">
        <span className="text-[#f8a828]">
          <TypewriterIcon className="w-7 h-7 mx-auto mb-2" />
        </span>
        <p className="font-semibold text-white">stenographer</p>
      </a>
      <ul className="sm:col-span-3 max-w-2xl mx-auto list-disc pl-5 space-y-2 text-sm text-muted-foreground">
        <li>Reads stenographer's truth format v2: hash-chained JSONL. A bad hash or a broken chain refuses the whole stream.</li>
        <li>Status is a fold over TRANSITION lines. A missing or unknown status, or an unsigned TB, fails closed: never current truth.</li>
        <li>An agent's TB is truth only with a quorum: two or more agent sessions, agreeing, each citing its own settling evidence (two kinds or more between them), within 15 minutes. An evidence kind short-hand doesn't know fails closed too.</li>
        <li>The ledger section marks truth [TB], a disputed TB [TB ⚠ CONTESTED] and an open question [UV — UNVERIFIED]. A [TB] inside a message, tool output or ledger field renders as \[TB] instead of reading as a ledger line.</li>
        <li>Candidates go back as a hash-chained PROPOSAL stream. A JSONL seam, no code dependency either way.</li>
      </ul>
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
          badge="Open Source · TypeScript · Zero runtime dependencies · MIT License"
          title="short-hand."
          tagline="Old computer science for new constraints."
          lines={<>Recent messages stay verbatim.<br />Older ones condense into summaries, graphs and invariants.<br />Your context window keeps what mattered.</>}
          install={{ display: INSTALL, copy: INSTALL }}
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

        <Band id="try" title="Squeeze it" lede="A 24-message working session. Drag the budget and see what short-hand keeps. By its token estimate, the rendered frame never goes over budget.">
          <BudgetDemo />
        </Band>

        <PullQuote cite="Proposals only. Nothing short-hand writes becomes truth until a person signs it in stenographer.">Memory that knows what it knows.</PullQuote>

        <GetStarted
          lede="A library, not a service. The npm package is @shorthand/core (0.1 was called short-hand and was never published). Zero runtime dependencies, ESM-only, fully typed. Node 22 or later."
          title={`npm · v${SITE.version}`}
          commands={[INSTALL]}
        >
          <CommandBlock
            title="or from source"
            commands={[CLONE, "cd short-hand && npm install && npm run build", "cd ../your-app && npm install ../short-hand"]}
          />
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 text-xs text-muted-foreground font-mono">agent.ts</div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-white/90">{`import { CompactionEngine, renderContextFrame } from "@shorthand/core";

const engine = new CompactionEngine({ memtableSize: 10 });
await engine.addMessages(history);

const frame = engine.buildContextFrame(2000);
// render order: truth → corrections → invariants
//   → memories → code → graph → summaries → history → recent
// frame.tokenUsage <= 2000 (a ~4 chars/token estimate)
const prompt = renderContextFrame(frame); // untrusted text escaped`}</pre>
          </div>
        </GetStarted>

        <SiteFooter site={SITE} />
      </div>
    </div>
  );
}
