import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Copy,
  Ear,
  FileSearch,
  Github,
  Layers,
  MessageSquare,
  Network,
  Radio,
  Rocket,
  ScrollText,
  Terminal,
  Webhook,
} from "lucide-react";
import { useState } from "react";
import { TypewriterIcon } from "@/components/Logo";
import { ObjectionPlayground } from "@/components/ObjectionPlayground";
import { RolloutSpectrum } from "@/components/RolloutSpectrum";
import { Transcript } from "@/components/Transcript";

const GITHUB_URL = "https://github.com/johnnyclem/stenographer";
const SMALLCHAT_URL = "https://www.smallchat.dev";
const VERSION = "0.1.0-alpha.2";
const CLONE = `git clone ${GITHUB_URL}.git`;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} as const;
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };
const inView = { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" }, variants: stagger } as const;

type Tab = "how" | "ledger" | "delivery";

function TabBar<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: string; icon: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
            active === tab.id
              ? "text-white bg-white/[0.08] border border-white/15"
              : "text-muted-foreground hover:text-white/70 border border-transparent"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function PullQuote({ children, cite }: { children: React.ReactNode; cite?: string }) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6">
      <motion.figure {...inView} className="max-w-4xl mx-auto text-center">
        <motion.blockquote variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-gradient leading-tight">
          “{children}”
        </motion.blockquote>
        {cite && (
          <motion.figcaption variants={fadeUp} className="mt-5 text-sm text-muted-foreground font-mono">
            {cite}
          </motion.figcaption>
        )}
      </motion.figure>
    </section>
  );
}

function SectionHeader({ title, lede }: { title: string; lede: string }) {
  return (
    <motion.div variants={fadeUp} className="text-center space-y-4">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{lede}</p>
    </motion.div>
  );
}

const panel = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.3 } };

function HowItWorks() {
  const steps = [
    { step: "LISTEN", icon: Ear, desc: "Tails Claude Code, Anthropic, OpenAI or plain JSONL transcripts." },
    { step: "INDEX", icon: FileSearch, desc: "Decisions, entities and local embeddings, all in one SQLite file." },
    { step: "ANSWER", icon: Network, desc: "GraphRAG over MCP or REST. No API keys." },
  ];
  return (
    <motion.div key="how" {...panel} className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
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
    <motion.div key="ledger" {...panel} className="grid md:grid-cols-[1.2fr_1fr] gap-6 sm:gap-10 items-center">
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
    <motion.div key="delivery" {...panel} className="grid md:grid-cols-3 gap-4 sm:gap-6">
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

function CopyButton({ text, label, className = "" }: { text: string; label: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the text is still selectable */
    }
  };
  return (
    <button onClick={copy} className={`group ${className}`}>
      {label}
      <Copy className={`w-4 h-4 ml-2 shrink-0 transition-colors ${copied ? "text-green-400" : "text-muted-foreground group-hover:text-white"}`} />
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("how");

  return (
    <div className="relative w-full">
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none opacity-60"
        style={{ background: "radial-gradient(60% 45% at 50% 0%, rgba(248,168,40,0.16), transparent 70%)" }}
      />

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="#top" className="flex items-center space-x-2">
              <TypewriterIcon className="w-5 h-5 text-primary" />
              <span className="font-bold tracking-tight text-white">stenographer</span>
            </a>
            <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#what" className="hover:text-white transition-colors">What it does</a>
              <a href="#try" className="hover:text-white transition-colors">Try it</a>
              <a href="#rollout" className="hover:text-white transition-colors">Rollout</a>
              <a href="#start" className="hover:text-white transition-colors">Get Started</a>
            </div>
            <div className="flex items-center space-x-4">
              <a href={SMALLCHAT_URL} className="text-muted-foreground hover:text-white transition-colors" aria-label="smallchat">
                <MessageSquare className="w-5 h-5" />
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section id="top" className="pt-32 pb-16 px-4 sm:px-6 min-h-screen flex flex-col items-center justify-center text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto space-y-8">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Open Source &middot; MCP &middot; Local-first &middot; MIT License
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tighter text-gradient leading-tight">
              stenographer.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-2xl md:text-3xl text-white/90 max-w-3xl mx-auto font-medium leading-snug tracking-tight">
              The court reporter for your agents.
            </motion.p>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              It never speaks out of turn.<br />
              It keeps the record.<br />
              And it objects when an agent repeats something you've declared dead.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="#start" className="btn btn-primary">
                <Rocket className="w-5 h-5" /> Get started
              </a>
              <CopyButton
                text={CLONE}
                className="btn btn-glass font-mono text-sm sm:text-base max-w-full"
                label={<><Terminal className="w-4 h-4 text-muted-foreground shrink-0" /><span className="truncate">git clone …/stenographer</span></>}
              />
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="w-full max-w-3xl mt-20"
          >
            <Transcript />
          </motion.div>
        </section>

        {/* WHAT IT DOES */}
        <section id="what" className="py-20 sm:py-24 px-4 sm:px-6 bg-black/40 border-y border-white/5 scroll-mt-20">
          <motion.div {...inView} className="max-w-5xl mx-auto space-y-10">
            <SectionHeader title="What it does" lede="A passive MCP server that turns agent transcripts into a record you can query, and a ledger you can trust." />
            <motion.div variants={fadeUp}>
              <TabBar<Tab>
                tabs={[
                  { id: "how" as Tab, label: "How it works", icon: <ArrowRight className="w-3.5 h-3.5" /> },
                  { id: "ledger" as Tab, label: "Truth ledger", icon: <ScrollText className="w-3.5 h-3.5" /> },
                  { id: "delivery" as Tab, label: "Delivery", icon: <Layers className="w-3.5 h-3.5" /> },
                ]}
                active={tab}
                onChange={setTab}
              />
            </motion.div>
            <AnimatePresence mode="wait">
              {tab === "how" && <HowItWorks />}
              {tab === "ledger" && <Ledger />}
              {tab === "delivery" && <Delivery />}
            </AnimatePresence>
          </motion.div>
        </section>

        <PullQuote cite="No inferred write ever lands as truth.">Machines detect. Authors assert.</PullQuote>

        {/* TRY IT */}
        <section id="try" className="py-20 sm:py-24 px-4 sm:px-6 bg-black/40 border-y border-white/5 scroll-mt-20">
          <motion.div {...inView} className="max-w-5xl mx-auto space-y-10">
            <SectionHeader title="Try to get past it" lede="Pick a tombstone. Put words in the agent's mouth." />
            <motion.div variants={fadeUp}>
              <ObjectionPlayground />
            </motion.div>
          </motion.div>
        </section>

        <PullQuote>Catch it in the transcript, not in code review.</PullQuote>

        {/* ROLLOUT */}
        <section id="rollout" className="py-20 sm:py-24 px-4 sm:px-6 bg-black/40 border-y border-white/5 scroll-mt-20">
          <motion.div {...inView} className="max-w-5xl mx-auto space-y-12">
            <SectionHeader title="Earn the interrupt" lede="Start in shadow. Move to deliver when the sustain rate says it's ready." />
            <motion.div variants={fadeUp}>
              <RolloutSpectrum />
            </motion.div>
          </motion.div>
        </section>

        {/* GET STARTED */}
        <section id="start" className="py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20">
          <motion.div {...inView} className="max-w-3xl mx-auto space-y-10">
            <SectionHeader title="Get started" lede="Node 20+. Everything stays on your machine." />
            <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5" /> from source · v{VERSION}</span>
                <CopyButton
                  text={`${CLONE}\ncd stenographer && npm install && npm run build && npm link\nstenographer start ~/.claude/projects/myproj --mode watch`}
                  className="flex items-center hover:text-white transition-colors cursor-pointer"
                  label="Copy"
                />
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-white/90">
                <span className="text-primary select-none">$ </span>{CLONE}{"\n"}
                <span className="text-primary select-none">$ </span>cd stenographer && npm install && npm run build && npm link{"\n"}
                <span className="text-primary select-none">$ </span>stenographer start ~/.claude/projects/myproj --mode watch
              </pre>
            </motion.div>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 bg-[#050505] pt-12 sm:pt-16 pb-8 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <TypewriterIcon className="w-6 h-6 text-primary" />
                <span className="font-bold text-2xl text-white">stenographer</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#start" className="btn btn-primary">
                  <Rocket className="w-5 h-5" /> Get started
                </a>
                <a href={SMALLCHAT_URL} className="btn btn-glass">
                  <MessageSquare className="w-4 h-4 text-[#3b9bff]" /> Meet smallchat
                </a>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
              <p className="text-sm text-muted-foreground">Built by Johnny Clem. MIT License.</p>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <a href={GITHUB_URL} className="hover:text-white transition-colors flex items-center">
                  <Github className="w-4 h-4 mr-2" /> Source Code
                </a>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs">v{VERSION}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
