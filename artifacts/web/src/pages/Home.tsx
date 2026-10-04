import { motion, AnimatePresence } from "framer-motion";
import { 
  Github, 
  Terminal, 
  Copy, 
  MessageSquare, 
  Zap, 
  Box,
  ArrowRight,
  Brain,
  Search,
  Plug,
  Play,
  FileText,
  Shield,
  RefreshCw,
  Code2,
  Rocket,
  ChevronDown,
  ScrollText,
  ListChecks,
  History,
  Fingerprint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { TerminalAnimation } from "@/components/TerminalAnimation";
import { HistoryTimeline } from "@/components/HistoryTimeline";
import { CompilerComparison } from "@/components/CompilerComparison";
import { SafetySpectrum } from "@/components/SafetySpectrum";
import { CaseStudy } from "@/components/CaseStudy";
import { MacAppShowcase, MAC_TABS, type MacChat } from "@/components/MacAppShowcase";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

type WhatTab = "compiler" | "features" | "pipeline" | "swift";
type WhyTab = "compare" | "safety" | "case-study";
type DeepDiveTab = "history" | "architecture" | "code";
type HeroPlatform = "npm" | "swift";

const DOCS_BASE = "";
const GITHUB_URL = "https://github.com/johnnyclem/smallchat";
const SWIFT_URL = "https://github.com/johnnyclem/smallchat-swift";
const STENOGRAPHER_URL = "https://stenographer.smallchat.dev";

const FAMILY_LINKS = [
  { label: "stenographer", href: STENOGRAPHER_URL },
  { label: "polytician", href: "https://polytician.smallchat.dev" },
  { label: "short-hand", href: "https://short-hand.smallchat.dev" },
];

function TabBar<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string; icon?: React.ReactNode }[]; active: T; onChange: (id: T) => void }) {
  return (
    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide justify-center flex-wrap">
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

function AccordionItem({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-white text-sm sm:text-base">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [heroPlatform, setHeroPlatform] = useState<HeroPlatform>("npm");
  const [whatTab, setWhatTab] = useState<WhatTab>("compiler");
  const [whyTab, setWhyTab] = useState<WhyTab>("compare");
  const [macChat, setMacChat] = useState<MacChat>("direct");
  const [deepTab, setDeepTab] = useState<DeepDiveTab>("architecture");

  const installCommands: Record<HeroPlatform, { display: string; copy: string }> = {
    npm: { display: "npm install @smallchat/core@^1", copy: "npm install @smallchat/core@^1" },
    swift: { display: ".package(url: \"…/smallchat-swift\")", copy: `.package(url: "${SWIFT_URL}", from: "1.0.0")` },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommands[heroPlatform].copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-glow.png`}
          alt=""
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[100px]" />
      </div>

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="font-bold tracking-tight text-white">smallchat</span>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#what" className="hover:text-white transition-colors">What it does</a>
              <a href="#why" className="hover:text-white transition-colors">Why it matters</a>
              <a href="#mac-app" className="hover:text-white transition-colors">Mac app</a>
              <a href="#deep-dive" className="hover:text-white transition-colors">Deep dive</a>
              <a href={`${DOCS_BASE}/docs/intro`} className="hover:text-white transition-colors">Docs</a>
              <a href="#quickstart" className="hover:text-white transition-colors">Get Started</a>
            </div>
            <div className="flex items-center space-x-4">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════════════════
            SECTION 1: HERO
        ═══════════════════════════════════════════════════════ */}
        <section className="pt-32 pb-16 px-4 sm:px-6 min-h-screen flex flex-col items-center justify-center text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl mx-auto space-y-8"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              1.0 &middot; Open Source &middot; TypeScript &middot; Swift 6.1+ &middot; MIT License
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tighter text-gradient leading-tight">
              smallchat.
            </motion.h1>

            <motion.p variants={fadeUp} className="text-2xl md:text-3xl text-white/90 max-w-3xl mx-auto font-medium leading-snug tracking-tight">
              Tool calling that finally speaks your language.
            </motion.p>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Messages instead of schemas.<br />
              Streaming that feels alive.<br />
              One lightweight library that lets your LLM think, dispatch, and respond like it was built for it.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 pt-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href={`${DOCS_BASE}/docs/getting-started`}>
                  <Button size="lg" className="gap-2">
                    <Rocket className="w-5 h-5" />
                    Start building now
                  </Button>
                </a>
                <Button 
                  variant="glass" 
                  size="lg" 
                  className="gap-2 font-mono group relative overflow-hidden"
                  onClick={handleCopy}
                >
                  <Terminal className="w-4 h-4 text-muted-foreground" />
                  {installCommands[heroPlatform].display}
                  <Copy className={`w-4 h-4 ml-2 transition-colors ${copied ? 'text-green-400' : 'text-muted-foreground group-hover:text-white'}`} />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button
                  onClick={() => { setHeroPlatform("npm"); setCopied(false); }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${heroPlatform === "npm" ? "bg-white/10 text-white" : "hover:text-white/70"}`}
                >
                  npm
                </button>
                <span className="text-white/20">|</span>
                <button
                  onClick={() => { setHeroPlatform("swift"); setCopied(false); }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${heroPlatform === "swift" ? "bg-white/10 text-white" : "hover:text-white/70"}`}
                >
                  Swift Package Manager
                </button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="w-full mt-20"
          >
            <TerminalAnimation />
          </motion.div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            SECTION 2: WHAT IT DOES
            Tabs: The Compiler | Features | How it works (pipeline)
        ═══════════════════════════════════════════════════════ */}
        <section id="what" className="py-20 sm:py-24 px-4 sm:px-6 bg-black/40 border-y border-white/5 scroll-mt-20">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-5xl mx-auto space-y-10"
          >
            <motion.div variants={fadeUp} className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">What it does</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                A message-passing tool compiler for LLMs — inspired by Smalltalk, built in TypeScript and Swift.
              </p>
              <a href={`${DOCS_BASE}/docs/what-it-does`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                See the dispatch model <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </motion.div>

            <motion.div variants={fadeUp}>
              <TabBar
                tabs={[
                  { id: "compiler" as WhatTab, label: "The Compiler", icon: <Zap className="w-3.5 h-3.5" /> },
                  { id: "features" as WhatTab, label: "Features", icon: <Search className="w-3.5 h-3.5" /> },
                  { id: "pipeline" as WhatTab, label: "How it works", icon: <ArrowRight className="w-3.5 h-3.5" /> },
                  { id: "swift" as WhatTab, label: "Swift", icon: <Box className="w-3.5 h-3.5" /> },
                ]}
                active={whatTab}
                onChange={setWhatTab}
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {whatTab === "compiler" && (
                <motion.div
                  key="compiler"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-10"
                >
                  <div className="text-center space-y-6 max-w-3xl mx-auto">
                    <h3 className="text-2xl md:text-4xl font-bold tracking-tight">
                      The compiler is back, baby.
                    </h3>
                    <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                      <p>
                        You used to fight JSON schemas.<br />
                        You used to parse every delta by hand.<br />
                        You used to hope the model guessed right.
                      </p>
                      <p className="text-white font-medium">
                        Not anymore.
                      </p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                    {[
                      { text: "Tools are objects again.", icon: Box },
                      { text: "Intent resolves with real semantics.", icon: Search },
                      { text: "Every token streams the moment it arrives.", icon: Zap },
                    ].map((item, i) => (
                      <div key={i} className="glass-panel rounded-2xl p-5 sm:p-6 border-primary/20 bg-primary/5 flex flex-col items-center text-center gap-3">
                        <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                        <p className="text-white font-medium text-base sm:text-lg">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {whatTab === "features" && (
                <motion.div
                  key="features"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center max-w-3xl mx-auto">
                    <h3 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">
                      Built for the way you already think
                    </h3>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                      Dispatch is exact by construction, and each guarantee says where it stops:
                      the same artifact, embedder and runtime state give the same choice and the same proof digest.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[
                      { icon: Search, title: "Semantic dispatch", desc: "Resolves an intent to at most one tool, by meaning. When nothing matches cleanly, it asks instead of guessing." },
                      { icon: Shield, title: "Resolve, then execute", desc: "resolve() proposes a tool and runs nothing. dispatchById() runs exactly the tool you name, by its <providerId>/<toolName> id." },
                      { icon: ListChecks, title: "Checked arguments", desc: "Arguments are validated against each tool's JSON Schema before anything runs. A bad call returns invalid-arguments, one message per problem." },
                      { icon: History, title: "Explain and replay", desc: "smallchat explain shows the candidates, tiers and policy verdicts. An opt-in, hash-chained decision log records each decision, and smallchat replay checks it against your artifact." },
                      { icon: Fingerprint, title: "Pinned artifacts, call digests", desc: "Artifacts are content-hashed and pinned to the embedder that made their vectors. Every call gets a canonical call digest. smallchat-swift runs the same test vectors." },
                      { icon: Zap, title: "Async streaming", desc: "Async generators hand you chunks in real time. Watch answers arrive, not wait for them." },
                      { icon: RefreshCw, title: "Cache that stays fresh", desc: "Keyed by the intent's full text. Registering, swizzling or feedback flushes it, so a change applies on the next dispatch. Cache hits never embed." },
                      { icon: Code2, title: "TypeScript + Swift", desc: "@smallchat/core 1.0 on Node 22+. smallchat-swift 1.0 on Swift 6.1+ for macOS 14+ and Linux, libraries on iOS 17+. No framework lock-in." },
                      { icon: Plug, title: "Any source, one MCP server", desc: "MCP servers, OpenAPI specs and JSON schemas compile into one artifact. smallchat serve forwards each call by exact name; --provider keeps upstream names, so OpenAPPA batteries apply unchanged." },
                    ].map((feature, i, arr) => (
                      <div key={i} className={`glass-panel-hover glass-panel p-5 sm:p-6 rounded-2xl group ${i === arr.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
                        <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
                        <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{feature.title}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="glass-panel rounded-2xl p-6 sm:p-8 border-accent/20 bg-accent/5 relative">
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-accent/20 text-accent border border-accent/30 rounded-full text-xs font-bold tracking-wider">
                      NEW
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-start">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <ScrollText className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
                          <h4 className="text-lg sm:text-xl font-semibold text-white">Memory that knows what it knows</h4>
                        </div>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                          smallchat's compaction comes from @shorthand/core 1.0, which reads Stenographer's truth format v2:
                          a hash-chained JSONL ledger where status is a fold over TRANSITION lines and anything unknown fails closed.
                          Agents settle claims only together: a tombstone an agent signs counts as truth only with a quorum of two or more
                          agent sessions agreeing from different angles within 15 minutes, while a person may still sign alone.
                          smallchat-swift's SmallChatTruth reads the same format.
                        </p>
                        <a href={STENOGRAPHER_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors font-medium">
                          Stenographer <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="space-y-2 font-mono text-[11px] sm:text-xs">
                        {[
                          { marker: "[TB]", color: "text-green-400", text: "Active tombstone — ground truth" },
                          { marker: "[TB ⚠ CONTESTED]", color: "text-yellow-400", text: "Ground truth with an asterisk — the open UV is shown beside it" },
                          { marker: "[UV — UNVERIFIED]", color: "text-orange-400", text: "A heads-up, never a demand — never reads as proven" },
                          { marker: "agent TB, no quorum", color: "text-red-400/80", text: "Not truth — one agent alone settles nothing" },
                          { marker: "overridden / struck / refuted", color: "text-muted-foreground", text: "History — never cited as support" },
                        ].map((rule, i) => (
                          <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5">
                            <span className={`${rule.color} font-bold shrink-0`}>{rule.marker}</span>
                            <span className="text-muted-foreground font-sans">{rule.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {whatTab === "pipeline" && (
                <motion.div
                  key="pipeline"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center max-w-3xl mx-auto">
                    <h3 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">
                      Four steps from definition to dispatch
                    </h3>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                      The compiler turns raw tool definitions into one artifact, and the runtime loads it only with the embedder that produced it.
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
                    {[
                      { step: "PARSE", emoji: "📄", desc: "Read tool definitions from any format — MCP, OpenAPI, or JSON." },
                      { step: "EMBED", emoji: "🧠", desc: "Convert tool descriptions into semantic vectors, recording the embedder's fingerprint." },
                      { step: "LINK", emoji: "🔗", desc: "Refuse near-duplicate tools, flag collisions, and build the dispatch tables." },
                      { step: "OUTPUT", emoji: "📦", desc: "Write a format 1.0 artifact: every tool by its canonical id, content-hashed." },
                    ].map((phase, i) => (
                      <div key={i} className="flex flex-col md:flex-row items-center">
                        <div className="glass-panel rounded-2xl p-5 sm:p-6 w-52 sm:w-56 text-center group hover:border-primary/30 transition-all duration-300">
                          <div className="text-2xl sm:text-3xl mb-2">{phase.emoji}</div>
                          <div className="text-primary font-mono font-bold text-sm mb-2">{phase.step}</div>
                          <p className="text-muted-foreground text-xs leading-relaxed">{phase.desc}</p>
                        </div>
                        {i < 3 && (
                          <div className="text-muted-foreground text-2xl px-2 rotate-90 md:rotate-0 my-2 md:my-0">
                            →
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {whatTab === "swift" && (
                <motion.div
                  key="swift"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center max-w-3xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-sm font-medium text-orange-400">
                      <span className="flex h-2 w-2 rounded-full bg-orange-400"></span>
                      smallchat-swift 1.0
                    </div>
                    <h3 className="text-2xl md:text-4xl font-bold tracking-tight">
                      Native Swift. The same dispatch rules.
                    </h3>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                      smallchat-swift 1.0 follows @smallchat/core 1.0's dispatch rules and artifact format, and runs its conformance vectors.
                      Swift 6.1+, on macOS 14+ and Linux, with the libraries on iOS 17+.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[
                      { title: "Resolve, then run", desc: "resolve proposes at most one tool and runs nothing. dispatchById runs exactly the named tool. Intent dispatch runs a match only when the dispatch policy allows it.", color: "text-orange-400" },
                      { title: "Shared test vectors", desc: "swift test runs @smallchat/core's spec/ vectors: call digests, tool ids, ranking, resolve outcomes and artifacts.", color: "text-blue-400" },
                      { title: "Checked arguments", desc: "Every call is validated against the tool's JSON Schema first. A schema the validator can't evaluate makes the tool uncallable, not unchecked.", color: "text-green-400" },
                      { title: "An exact MCP server", desc: "smallchat serve speaks Streamable HTTP on /mcp, lists tools as <provider>__<tool>, and runs exactly the tool you call.", color: "text-purple-400" },
                      { title: "Truth format v2", desc: "SmallChatTruth reads Stenographer's hash-chained ledger, fails closed on anything unknown, and refuses a line whose agent quorum breaks the rules.", color: "text-yellow-400" },
                      { title: "Swift 6 language mode", desc: "ToolRuntime is an actor. The compiler checks actor isolation and Sendable; shared state outside actors sits behind locks.", color: "text-cyan-400" },
                    ].map((item, i) => (
                      <div key={i} className="glass-panel-hover glass-panel p-5 sm:p-6 rounded-2xl group">
                        <h4 className={`text-base sm:text-lg font-semibold ${item.color} mb-2`}>{item.title}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6 items-start">
                    <CodeBlock
                      filename="Package.swift"
                      code={
                        <>
<span className="token-comment">{"// Requires Swift 6.1+"}</span>{'\n'}
<span className="token-property">dependencies</span>: [{'\n'}
{"  "}.<span className="token-function">package</span>(url: <span className="token-string">"https://github.com/johnnyclem/smallchat-swift"</span>,{'\n'}
{"           "}from: <span className="token-string">"1.0.0"</span>),{'\n'}
],{'\n'}
<span className="token-property">targets</span>: [{'\n'}
{"  "}.<span className="token-function">target</span>(name: <span className="token-string">"YourTarget"</span>, dependencies: [{'\n'}
{"    "}.<span className="token-function">product</span>(name: <span className="token-string">"SmallChat"</span>, package: <span className="token-string">"smallchat-swift"</span>),{'\n'}
{"  "}]),{'\n'}
]
                        </>
                      }
                    />
                    <CodeBlock
                      filename="main.swift"
                      code={
                        <>
<span className="token-keyword">import</span> <span className="token-type">SmallChat</span>{'\n'}
{'\n'}
<span className="token-comment">{"// Load a compiled toolkit (its embedder must match)"}</span>{'\n'}
<span className="token-keyword">let</span> toolkit = <span className="token-keyword">try await</span> <span className="token-type">MCPToolkit</span>.<span className="token-function">load</span>(source: <span className="token-string">"tools.toolkit.json"</span>){'\n'}
<span className="token-keyword">let</span> runtime = toolkit.runtime{'\n'}
{'\n'}
<span className="token-comment">{"// Resolve: which tool would run? Nothing executes."}</span>{'\n'}
<span className="token-keyword">let</span> resolution = <span className="token-keyword">try await</span> runtime.<span className="token-function">resolve</span>(<span className="token-string">"find flights"</span>){'\n'}
<span className="token-function">print</span>(resolution.outcome, resolution.chosen ?? <span className="token-string">"-"</span>, resolution.tier){'\n'}
{'\n'}
<span className="token-comment">{"// Run exactly one tool by id; arguments are validated first"}</span>{'\n'}
<span className="token-keyword">let</span> result = <span className="token-keyword">try await</span> runtime.<span className="token-function">dispatchById</span>({'\n'}
{"  "}<span className="token-string">"flights/search_flights"</span>, args: [<span className="token-string">"to"</span>: <span className="token-string">"NYC"</span>])
                        </>
                      }
                    />
                  </div>

                  <div className="glass-panel rounded-2xl p-5 sm:p-6 max-w-3xl mx-auto text-center space-y-3">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Not in Swift 1.0: the decision log, replay and explain, the semantic map, observer feedback and argument coercion.
                      The built-in embedder is a hash embedder for development and tests; for semantic matching, bring an Embedder backed by a model.
                    </p>
                    <a href={SWIFT_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors">
                      smallchat-swift on GitHub <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            SECTION 3: WHY IT MATTERS
            Tabs: Compare | Safety | Case Study
        ═══════════════════════════════════════════════════════ */}
        <section id="why" className="py-20 sm:py-24 px-4 sm:px-6 scroll-mt-20">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-5xl mx-auto space-y-10"
          >
            <motion.div variants={fadeUp} className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Why it matters</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                See the numbers, understand the tradeoffs, and explore real-world results.
              </p>
              <a href={`${DOCS_BASE}/docs/why-it-matters`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                Read the motivation <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </motion.div>

            <motion.div variants={fadeUp}>
              <TabBar
                tabs={[
                  { id: "compare" as WhyTab, label: "Compare", icon: <Play className="w-3.5 h-3.5" /> },
                  { id: "safety" as WhyTab, label: "Safety", icon: <Shield className="w-3.5 h-3.5" /> },
                  { id: "case-study" as WhyTab, label: "AgentVault", icon: <Rocket className="w-3.5 h-3.5" /> },
                ]}
                active={whyTab}
                onChange={setWhyTab}
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {whyTab === "compare" && (
                <motion.div
                  key="compare"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <CompilerComparison embedded />
                </motion.div>
              )}

              {whyTab === "safety" && (
                <motion.div
                  key="safety"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <SafetySpectrum embedded />
                </motion.div>
              )}

              {whyTab === "case-study" && (
                <motion.div
                  key="case-study"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <CaseStudy embedded />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            SECTION 3½: THE MAC APP
            An interactive window of the agent messenger
        ═══════════════════════════════════════════════════════ */}
        <section id="mac-app" className="py-20 sm:py-24 px-4 sm:px-6 border-t border-white/5 scroll-mt-20">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-5xl mx-auto space-y-10"
          >
            <motion.div variants={fadeUp} className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Your agents, in one chat app</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                A native macOS messenger for your Claude Code sessions. Watch them work, talk to one or all, and approve what they want remembered.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <TabBar<MacChat> tabs={MAC_TABS} active={macChat} onChange={setMacChat} />
            </motion.div>

            <motion.div variants={fadeUp}>
              <MacAppShowcase chat={macChat} onSelect={setMacChat} />
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <code className="font-mono text-sm text-white/90 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5">
                swift run SmallChatApp
              </code>
              <a
                href={SWIFT_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                macOS 14+ · smallchat-swift <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          </motion.div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            SECTION 4: DEEP DIVE
            Accordion: History | Architecture | Code
        ═══════════════════════════════════════════════════════ */}
        <section id="deep-dive" className="py-20 sm:py-24 px-4 sm:px-6 bg-black/40 border-y border-white/5 scroll-mt-20">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-5xl mx-auto space-y-10"
          >
            <motion.div variants={fadeUp} className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Deep dive</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                History, architecture, and the code that makes it work.
              </p>
              <a href={`${DOCS_BASE}/docs/concepts`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                Explore the internals <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </motion.div>

            <motion.div variants={fadeUp}>
              <TabBar
                tabs={[
                  { id: "architecture" as DeepDiveTab, label: "Architecture", icon: <Brain className="w-3.5 h-3.5" /> },
                  { id: "code" as DeepDiveTab, label: "Under the hood", icon: <Code2 className="w-3.5 h-3.5" /> },
                  { id: "history" as DeepDiveTab, label: "History", icon: <RefreshCw className="w-3.5 h-3.5" /> },
                ]}
                active={deepTab}
                onChange={setDeepTab}
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {deepTab === "architecture" && (
                <motion.div
                  key="architecture"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-start">
                    <div className="space-y-6">
                      <div className="inline-flex items-center text-accent bg-accent/10 px-3 py-1 rounded-full text-sm font-medium">
                        <Brain className="w-4 h-4 mr-2" />
                        Architecture
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Messages, not function calls.
                      </h3>
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                        In the 1970s, Alan Kay invented a style of programming where objects communicate by sending messages to each other. 
                        The receiver decides what to do — not the sender.
                      </p>
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                        smallchat applies this same principle to AI. The model sends a message describing its intent,
                        and the runtime proposes the one tool that handles it, or asks when nothing matches cleanly.
                      </p>
                    </div>

                    <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-2xl relative">
                      <div className="absolute -top-3 -right-3 px-3 py-1 bg-accent/20 text-accent border border-accent/30 rounded-full text-xs font-bold tracking-wider">
                        CONCEPT MAP
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 items-center pb-3 border-b border-white/10 font-bold">
                          <div className="text-muted-foreground text-xs sm:text-sm">Classic OOP</div>
                          <div></div>
                          <div className="text-white text-xs sm:text-sm">smallchat</div>
                        </div>
                        {[
                          ["Object", "ToolProvider", "A service that offers tools"],
                          ["Class", "ToolClass", "A group of related tools"],
                          ["Message send", "dispatch()", "Ask for something to happen"],
                          ["Selector (SEL)", "ToolSelector", "The meaning of an intent"],
                          ["Implementation", "ToolIMP", "The code that runs"],
                          ["Method cache", "Resolution cache", "Remember past lookups"],
                          ["Protocol", "ToolProtocol", "A capability contract"],
                          ["Proxy", "ToolProxy", "Load details on demand"],
                        ].map(([classic, sc, hint], i) => (
                          <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-x-2 sm:gap-x-3 items-center py-2 border-b border-white/5 group hover:bg-white/[0.02] rounded transition-colors">
                            <div className="text-muted-foreground font-mono text-[11px] sm:text-xs">{classic}</div>
                            <ArrowRight className="w-3 h-3 text-white/20" />
                            <div>
                              <span className="text-primary font-mono text-[11px] sm:text-xs">{sc}</span>
                              <span className="text-muted-foreground/50 text-[10px] ml-1 hidden lg:inline">{hint}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto">
                    <blockquote className="relative">
                      <div className="absolute -top-2 -left-1 text-4xl text-primary/10 font-serif">"</div>
                      <p className="text-base sm:text-lg text-gray-300 leading-relaxed italic pl-6">
                        I think one of the things that really separates us from the high primates is that we're tool builders. 
                        We can fashion tools that amplify these inherent abilities that we have to spectacular magnitudes. 
                        And so for me, a computer has always been a bicycle of the mind.
                      </p>
                      <div className="flex items-center gap-3 mt-4 pl-6">
                        <div className="w-8 h-px bg-primary/40" />
                        <span className="text-sm font-semibold text-primary/80">Steve Jobs</span>
                      </div>
                    </blockquote>
                  </div>
                </motion.div>
              )}

              {deepTab === "code" && (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center max-w-3xl mx-auto">
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Under the hood</h3>
                    <p className="text-muted-foreground text-base sm:text-lg">
                      The dispatch hot path: resolve proposes, the policy decides, and exactly one tool runs with checked arguments.
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                    <CodeBlock 
                      filename="src/core/types.ts — ToolSelector"
                      code={
                        <>
<span className="token-keyword">export</span> <span className="token-keyword">interface</span> <span className="token-type">ToolSelector</span> {'{\n'}
{"  "}<span className="token-comment">{"/** Embedding vector — the semantic fingerprint */"}</span>{'\n'}
{"  "}<span className="token-property">vector</span>: <span className="token-type">Float32Array</span>;{'\n'}
{'\n'}
{"  "}<span className="token-comment">{"/** Human-readable canonical form */"}</span>{'\n'}
{"  "}<span className="token-property">canonical</span>: <span className="token-type">string</span>;{'\n'}
{'\n'}
{"  "}<span className="token-property">parts</span>: <span className="token-type">string</span>[];{'\n'}
{"  "}<span className="token-property">arity</span>: <span className="token-type">number</span>;{'\n'}
{'}'}
                        </>
                      }
                    />
                    <CodeBlock 
                      filename="src/runtime/dispatch.ts — Hot Path (simplified)"
                      code={
                        <>
<span className="token-keyword">async function</span> <span className="token-function">toolkit_dispatch</span>({'\n'}
{"  "}context: <span className="token-type">DispatchContext</span>,{'\n'}
{"  "}intent: <span className="token-type">string</span>,{'\n'}
{"  "}args?: <span className="token-type">Record</span>&lt;<span className="token-type">string</span>, <span className="token-type">unknown</span>&gt;{'\n'}
{")"}: <span className="token-type">Promise</span>&lt;<span className="token-type">ToolResult</span>&gt; {'{\n'}
{"  "}<span className="token-comment">{"// 1. Resolve: embed, rank, tier, apply the policy"}</span>{'\n'}
{"  "}<span className="token-keyword">const</span> {'{'} resolution, imp {'}'} = <span className="token-keyword">await</span> <span className="token-function">resolveInternal</span>(context, intent, {'{'} args {'}'});{'\n'}
{'\n'}
{"  "}<span className="token-comment">{"// 2. Not exactly one tool? Nothing runs."}</span>{'\n'}
{"  "}<span className="token-keyword">if</span> (resolution.outcome !== <span className="token-string">'resolved'</span>){'\n'}
{"    "}<span className="token-keyword">return</span> <span className="token-function">notExecutedResult</span>(resolution);{'\n'}
{'\n'}
{"  "}<span className="token-comment">{"// 3. JSON Schema check + canonical call digest"}</span>{'\n'}
{"  "}<span className="token-keyword">const</span> call = <span className="token-keyword">await</span> <span className="token-function">prepareCall</span>(context, imp, resolution.chosen, args);{'\n'}
{"  "}<span className="token-keyword">if</span> (!call.ok) <span className="token-keyword">return</span> <span className="token-function">invalidArgumentsResult</span>(call);{'\n'}
{'\n'}
{"  "}<span className="token-comment">{"// 4. Log the decision, then run exactly that tool"}</span>{'\n'}
{"  "}context.<span className="token-function">logDecision</span>(<span className="token-string">'dispatch'</span>, resolution.proof, <span className="token-string">'ran'</span>);{'\n'}
{"  "}<span className="token-keyword">return</span> <span className="token-function">execute</span>(imp, call.args);{'\n'}
{'}'}
                        </>
                      }
                    />
                  </div>

                  <AccordionItem
                    title="SCObject hierarchy"
                    icon={<Box className="w-5 h-5 text-accent" />}
                  >
                    <div className="grid md:grid-cols-2 gap-8 items-start pt-2">
                      <div className="glass-panel p-6 rounded-2xl">
                        <div className="space-y-4 font-mono text-sm leading-relaxed text-gray-300">
                          <div className="text-accent font-bold text-base">SCObject Hierarchy</div>
                          <p className="text-xs text-muted-foreground font-sans mb-4">Every value passed to a tool is wrapped in a type-safe object, inspired by Objective-C's NSObject.</p>
                          <div className="pl-6 border-l border-white/10 space-y-3">
                            {[
                              ["SCSelector", "Wraps an intent"],
                              ["SCData", "Structured data (JSON)"],
                              ["SCToolReference", "Pass tools as arguments"],
                              ["SCArray", "Ordered collections"],
                              ["SCDictionary", "Key-value pairs"],
                            ].map(([name, hint], i) => (
                              <div key={i} className="flex items-center text-sm">
                                <span className="w-4 h-px bg-white/10 mr-2 shrink-0" />
                                <span className="text-primary">{name}</span>
                                <span className="text-muted-foreground ml-2 text-xs font-sans">— {hint}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xl md:text-2xl font-bold">Type-safe parameter passing</h4>
                        <p className="text-muted-foreground text-base leading-relaxed">
                          Every value passed through the system is wrapped in a typed object. 
                          This enables function overloading and runtime introspection.
                        </p>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          The compiler also reports semantically similar tools as overload groups. In 1.0 those groups are
                          reported at compile time only: dispatch never merges distinct tools.
                        </p>
                      </div>
                    </div>
                  </AccordionItem>
                </motion.div>
              )}

              {deepTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <HistoryTimeline embedded />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            SECTION 5: GET STARTED + FOOTER
        ═══════════════════════════════════════════════════════ */}
        <section id="quickstart" className="py-20 sm:py-24 px-4 sm:px-6 scroll-mt-20">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-3xl mx-auto space-y-10 sm:space-y-12"
          >
            <motion.div variants={fadeUp} className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready when you are</h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Drop it in with one command.
                Watch it stream in your own UI.
                Or serve every tool through one MCP server.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-6">
              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="flex items-center px-4 py-3 border-b border-white/5 bg-black/40">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="mx-auto text-xs text-muted-foreground font-mono">TypeScript</div>
                </div>
                <div className="p-4 sm:p-6 bg-black/50 font-mono text-xs sm:text-sm space-y-4 sm:space-y-5">
                  <div>
                    <span className="text-muted-foreground select-none"># Install (Node 22+)</span>
                    <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npm install @smallchat/core@^1</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground select-none"># Compile the tools in your MCP config</span>
                    <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npx -y @smallchat/core@^1 compile --source ~/.mcp.json</div>
                    <div className="text-green-400/70 text-xs mt-1 select-none">Output: tools.toolkit.json (format 1.0, content-hashed)</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground select-none"># See which tool an intent resolves to (nothing runs)</span>
                    <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npx -y @smallchat/core@^1 resolve tools.toolkit.json "search for code"</div>
                    <div className="text-green-400/70 text-xs mt-1 select-none">Outcome: resolved (tier HIGH, decision ranked) · Chosen: github/search_code</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground select-none"># Pin the decisions that matter: exit 1 if one changes</span>
                    <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npx -y @smallchat/core@^1 replay tools.toolkit.json traces/</div>
                    <div className="text-green-400/70 text-xs mt-1 select-none">✓ "search for code" → resolved github/search_code (high)</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground select-none"># Serve every tool through one MCP server (stdio; --http for Streamable HTTP)</span>
                    <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npx -y @smallchat/core@^1 serve --source tools.toolkit.json</div>
                    <div className="text-green-400/70 text-xs mt-1 select-none">smallchat MCP server on stdio</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden border-orange-500/10">
                <div className="flex items-center px-4 py-3 border-b border-white/5 bg-black/40">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="mx-auto flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    Swift 6.1+
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium font-sans">macOS 14+ · Linux · iOS 17+ libraries</span>
                  </div>
                </div>
                <div className="p-4 sm:p-6 bg-black/50 font-mono text-xs sm:text-sm space-y-4 sm:space-y-5">
                  <div>
                    <span className="text-muted-foreground select-none"># Add to Package.swift</span>
                    <div className="text-gray-300 break-all">{`.package(url: "${SWIFT_URL}", from: "1.0.0")`}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground select-none"># Compile your tools</span>
                    <div className="text-gray-300"><span className="text-orange-400 select-none">❯ </span>swift run smallchat compile --source ~/.mcp.json</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground select-none"># Resolve, then run exactly one tool</span>
                    <div className="text-gray-300"><span className="text-orange-400 select-none">let </span>toolkit = try await MCPToolkit.load(source: "tools.toolkit.json")</div>
                    <div className="text-gray-300"><span className="text-orange-400 select-none">let </span>resolution = try await toolkit.runtime.resolve("find flights")</div>
                    <div className="text-gray-300">print(resolution.outcome, resolution.chosen ?? "-")</div>
                    <div className="text-gray-300"><span className="text-orange-400 select-none">let </span>result = try await toolkit.runtime.dispatchById("flights/search_flights", args: ["to": "NYC"])</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <footer className="border-t border-white/10 bg-[#050505] pt-12 sm:pt-16 pb-8 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                <span className="font-bold text-2xl text-white">smallchat</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href={`${DOCS_BASE}/docs/getting-started`}>
                  <Button size="lg" className="gap-2">
                    <Rocket className="w-5 h-5" />
                    Start building now
                  </Button>
                </a>
                <a href={`${DOCS_BASE}/docs/intro`}>
                  <Button variant="glass" size="lg" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Read docs
                  </Button>
                </a>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
              <p className="text-sm text-muted-foreground">
                Built by Johnny Clem. MIT License.
              </p>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <a href={GITHUB_URL} className="hover:text-white transition-colors flex items-center">
                  <Github className="w-4 h-4 mr-2" /> Source Code
                </a>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs">
                  v1.0.0
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="text-white/40">The smallchat suite</span>
              {FAMILY_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
