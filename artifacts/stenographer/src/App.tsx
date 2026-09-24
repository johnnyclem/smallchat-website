import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Ear, FileSearch, Layers, MessageSquare, Network, Radio, ScrollText, Webhook } from "lucide-react";
import { useState } from "react";
import {
  Band,
  GetStarted,
  Glow,
  Hero,
  PullQuote,
  SiteFooter,
  SiteNav,
  TabBar,
  TypewriterIcon,
  tabPanel,
  type SiteMeta,
} from "@workspace/site-kit";
import { ObjectionPlayground } from "@/components/ObjectionPlayground";
import { RolloutSpectrum } from "@/components/RolloutSpectrum";
import { Transcript } from "@/components/Transcript";

const SITE: SiteMeta = {
  id: "stenographer",
  name: "stenographer",
  Icon: TypewriterIcon,
  github: "https://github.com/johnnyclem/stenographer",
  version: "0.1.0-alpha.2",
};
const CLONE = `git clone ${SITE.github}.git`;

type Tab = "how" | "ledger" | "delivery";

function HowItWorks() {
  const steps = [
    { step: "LISTEN", icon: Ear, desc: "Tails Claude Code, Anthropic, OpenAI or plain JSONL transcripts." },
    { step: "INDEX", icon: FileSearch, desc: "Decisions, entities and local embeddings, all in one SQLite file." },
    { step: "ANSWER", icon: Network, desc: "GraphRAG over MCP or REST. No API keys." },
  ];
  return (
    <motion.div key="how" {...tabPanel} className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
      {steps.map((s, i) => (
        <div key={s.step} className="flex flex-col md:flex-row items-center">
          <div className="glass-panel rounded-2xl p-5 sm:p-6 w-64 text-center hover:border-primary/30 transition-all duration-300">
            <s.icon className="w-7 h-7 text-primary mx-auto mb-3" />
            <div className="text-primary font-mono font-bold text-sm mb-2">{s.step}</div>
            <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
          </div>
          {i < steps.length - 1 && <div className="text-muted-foreground text-2xl px-3 rotate-90 md:rotate-0 my-2 md:my-0">→</div>}
        </div>
      ))}
    </motion.div>
  );
}

function Ledger() {
  const records = [
    { marker: "TB", color: "text-primary", text: "Tombstone. Provably dead, with evidence and a signer." },
    { marker: "UV", color: "text-sky-400", text: "Unverified. Flag it, don't block on it." },
    { marker: "PROPOSAL", color: "text-muted-foreground", text: "What detectors draft. Only a signature makes it truth." },
    { marker: "ADDENDUM", color: "text-green-400", text: "Evidence attached after the fact." },
    { marker: "RULING", color: "text-red-400", text: "A signed judgment with a written opinion." },
  ];
  return (
    <motion.div key="ledger" {...tabPanel} className="grid md:grid-cols-[1.2fr_1fr] gap-6 sm:gap-10 items-center">
      <div className="space-y-1 font-mono text-xs sm:text-sm">
        {records.map((r) => (
          <div key={r.marker} className="flex items-start gap-3 py-2.5 border-b border-white/5">
            <span className={`${r.color} font-bold w-24 shrink-0`}>{r.marker}</span>
            <span className="text-muted-foreground font-sans">{r.text}</span>
          </div>
        ))}
      </div>
      <blockquote className="text-xl sm:text-2xl font-semibold tracking-tight text-white/90 leading-snug border-l-2 border-primary/60 pl-5">
        “Three subagents affirming their parent's claim is one opinion wearing three hats.”
        <footer className="mt-3 text-sm font-normal text-muted-foreground">Contempt of corpus, rejected at write time.</footer>
      </blockquote>
    </motion.div>
  );
}

function Delivery() {
  const receivers = [
    { icon: Radio, title: "Claude Code", desc: "Pushed to the attached session over its MCP channel." },
    { icon: MessageSquare, title: "smallchat", desc: "Relayed into the right agent's chat by the macOS messenger." },
    { icon: Webhook, title: "Webhooks", desc: "HMAC-signed batches for harnesses that can't be interrupted." },
  ];
  return (
    <motion.div key="delivery" {...tabPanel} className="grid md:grid-cols-3 gap-4 sm:gap-6">
      {receivers.map((r) => (
        <div key={r.title} className="glass-panel glass-panel-hover p-5 sm:p-6 rounded-2xl group">
          <r.icon className="w-7 h-7 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
          <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{r.title}</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">{r.desc}</p>
        </div>
      ))}
    </motion.div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("how");

  return (
    <div className="relative w-full">
      <Glow rgb="248,168,40" />
      <div className="relative z-10">
        <SiteNav
          site={SITE}
          links={[
            { href: "#what", label: "What it does" },
            { href: "#try", label: "Try it" },
            { href: "#rollout", label: "Rollout" },
            { href: "#start", label: "Get Started" },
          ]}
        />

        <Hero
          badge="Open Source · MCP · Local-first · MIT License"
          title="stenographer."
          tagline="The court reporter for your agents."
          lines={<>It never speaks out of turn.<br />It keeps the record.<br />And it objects when an agent repeats something you've declared dead.</>}
          install={{ display: "git clone …/stenographer", copy: CLONE }}
        >
          <Transcript />
        </Hero>

        <Band id="what" title="What it does" lede="A passive MCP server that turns agent transcripts into a record you can query, and a ledger you can trust.">
          <TabBar<Tab>
            tabs={[
              { id: "how", label: "How it works", icon: <ArrowRight className="w-3.5 h-3.5" /> },
              { id: "ledger", label: "Truth ledger", icon: <ScrollText className="w-3.5 h-3.5" /> },
              { id: "delivery", label: "Delivery", icon: <Layers className="w-3.5 h-3.5" /> },
            ]}
            active={tab}
            onChange={setTab}
          />
          <AnimatePresence mode="wait">
            {tab === "how" && <HowItWorks />}
            {tab === "ledger" && <Ledger />}
            {tab === "delivery" && <Delivery />}
          </AnimatePresence>
        </Band>

        <PullQuote cite="No inferred write ever lands as truth.">Machines detect. Authors assert.</PullQuote>

        <Band id="try" title="Try to get past it" lede="Pick a tombstone. Put words in the agent's mouth.">
          <ObjectionPlayground />
        </Band>

        <PullQuote>Catch it in the transcript, not in code review.</PullQuote>

        <Band id="rollout" title="Earn the interrupt" lede="Start in shadow. Move to deliver when the sustain rate says it's ready.">
          <RolloutSpectrum />
        </Band>

        <GetStarted
          lede="Node 20+. Everything stays on your machine."
          title={`from source · v${SITE.version}`}
          commands={[
            CLONE,
            "cd stenographer && npm install && npm run build && npm link",
            "stenographer start ~/.claude/projects/myproj --mode watch",
          ]}
        />

        <SiteFooter site={SITE} />
      </div>
    </div>
  );
}
