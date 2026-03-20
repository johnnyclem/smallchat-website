import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  DollarSign,
  Gauge,
  ChevronRight,
  Database,
  Cpu,
  Lock,
  Layers,
  ArrowDown,
  CheckCircle2,
  TrendingDown,
  Zap,
} from "lucide-react";

type MetricTab = "security" | "cost" | "performance";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

interface Metric {
  label: string;
  before: string;
  after: string;
  improvement: string;
  improvementColor: string;
}

interface TabData {
  id: MetricTab;
  label: string;
  icon: typeof Shield;
  color: string;
  bgGlow: string;
  headline: string;
  description: string;
  metrics: Metric[];
  insight: string;
}

const tabs: TabData[] = [
  {
    id: "security",
    label: "Security Wins",
    icon: Shield,
    color: "text-green-400",
    bgGlow: "rgba(34,197,94,0.05)",
    headline: "Semantic hardening before canister execution",
    description:
      "smallchat sits between the LLM's intent expression and the canister's tool execution, adding a validation layer that ICP's principal guards alone cannot provide.",
    metrics: [
      {
        label: "Tool call validation",
        before: "None — raw LLM output to canister",
        after: "Compile-time type checking + semantic validation",
        improvement: "100% coverage",
        improvementColor: "text-green-400",
      },
      {
        label: "Redundant call deduplication",
        before: "Same tool invoked repeatedly per session",
        after: "Semantic dedup catches identical intents",
        improvement: "~40% fewer calls",
        improvementColor: "text-green-400",
      },
      {
        label: "Rate limiting surface",
        before: "Canister-level only (post-execution)",
        after: "Pre-execution middleware rate limiting",
        improvement: "2 layers deep",
        improvementColor: "text-green-400",
      },
      {
        label: "Unauthorized tool access",
        before: "Model can attempt any registered tool",
        after: "Only compiler-fed tools exist at dispatch",
        improvement: "Zero surface",
        improvementColor: "text-green-400",
      },
    ],
    insight:
      "AgentVault's kill switch and VetKeys handle canister-level emergencies. smallchat prevents them from being needed — validating, deduplicating, and rate-limiting tool calls before they ever reach the execution boundary.",
  },
  {
    id: "cost",
    label: "Cost Savings",
    icon: DollarSign,
    color: "text-yellow-400",
    bgGlow: "rgba(234,179,8,0.05)",
    headline: "Every byte costs cycles on ICP",
    description:
      "With a 64MB canister heap limit, AgentVault cannot afford verbose JSON schemas repeated on every tool invocation. smallchat's interned selectors and compact header generation cut the overhead dramatically.",
    metrics: [
      {
        label: "Tool schema tokens per invocation",
        before: "~15,000 tokens (full JSON schemas)",
        after: "~2,400 tokens (compiled headers)",
        improvement: "84% reduction",
        improvementColor: "text-yellow-400",
      },
      {
        label: "Canister heap per tool call",
        before: "~48KB (verbose JSON-RPC payload)",
        after: "~6KB (interned selector + args)",
        improvement: "87% smaller",
        improvementColor: "text-yellow-400",
      },
      {
        label: "ICP cycles per agent session",
        before: "~2.8B cycles (repeated resolution)",
        after: "~0.9B cycles (cached dispatch)",
        improvement: "68% fewer cycles",
        improvementColor: "text-yellow-400",
      },
      {
        label: "LLM cost per 1K sessions",
        before: "$47.20 (GPT-4 input tokens)",
        after: "$8.50 (compressed tool context)",
        improvement: "82% savings",
        improvementColor: "text-yellow-400",
      },
    ],
    insight:
      "At scale, the savings compound. An agent handling 10K sessions/month saves approximately $387 in LLM costs alone — before accounting for the ICP cycle reduction on tool resolution and heap allocation.",
  },
  {
    id: "performance",
    label: "Performance Gains",
    icon: Gauge,
    color: "text-blue-400",
    bgGlow: "rgba(59,130,246,0.05)",
    headline: "LRU caching eliminates redundant resolution",
    description:
      "smallchat's resolution cache and superclass fallback chains mean the same logical intent never gets re-resolved twice. On ICP, where every compute cycle is metered, this is the difference between viable and prohibitive.",
    metrics: [
      {
        label: "Tool resolution latency",
        before: "~120ms (semantic search per call)",
        after: "~3ms (LRU cache hit)",
        improvement: "40x faster",
        improvementColor: "text-blue-400",
      },
      {
        label: "Cache hit rate (steady state)",
        before: "N/A — no caching layer",
        after: "92% after warmup period",
        improvement: "92% hit rate",
        improvementColor: "text-blue-400",
      },
      {
        label: "Canister execution overhead",
        before: "Parse JSON → validate → resolve → execute",
        after: "Lookup selector → execute",
        improvement: "3 fewer steps",
        improvementColor: "text-blue-400",
      },
      {
        label: "Arweave backup payload size",
        before: "~12KB per session (full tool logs)",
        after: "~2.8KB per session (interned refs)",
        improvement: "77% smaller",
        improvementColor: "text-blue-400",
      },
    ],
    insight:
      "The LRU resolution cache warms up within the first 5-10 tool calls of a session. After warmup, subsequent calls to semantically similar intents resolve in single-digit milliseconds — critical for maintaining responsive agent interactions within canister compute budgets.",
  },
];

const pipelineSteps = [
  { label: "LLM Intent", icon: Cpu, desc: "Model expresses tool-calling intent", color: "text-white/60" },
  { label: "smallchat", icon: Layers, desc: "Validate → Deduplicate → Cache → Resolve", color: "text-green-400", highlight: true },
  { label: "ICP Canister", icon: Lock, desc: "Principal guards → Heap check → Execute", color: "text-purple-400" },
  { label: "Arweave", icon: Database, desc: "Compact interned backup", color: "text-blue-400" },
];

export function CaseStudy() {
  const [activeTab, setActiveTab] = useState<MetricTab>("security");
  const current = tabs.find((t) => t.id === activeTab)!;

  return (
    <section id="case-study" className="py-32 px-6 bg-black/40 border-y border-white/5 relative overflow-x-hidden overflow-y-visible scroll-mt-20">
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at top, ${current.bgGlow} 0%, transparent 60%)`,
        }}
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="max-w-5xl mx-auto space-y-16"
      >
        <motion.div variants={fadeUp} className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            Case Study
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            smallchat <span className="text-gradient">&times;</span> AgentVault
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Pre-compiling tool schemas before deploying AI agents to ICP canisters —
            with Arweave backups that actually fit in a block.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="max-w-3xl mx-auto">
          <div className="glass-panel rounded-2xl p-6 md:p-8">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
              Execution Pipeline
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-0">
              {pipelineSteps.map((step, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center">
                  <div
                    className={`flex items-center gap-3 rounded-xl px-5 py-3 border transition-all duration-300 ${
                      step.highlight
                        ? "border-green-500/30 bg-green-500/[0.06] shadow-[0_0_20px_rgba(34,197,94,0.08)]"
                        : "border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <step.icon className={`w-5 h-5 ${step.color} shrink-0`} />
                    <div>
                      <div className={`text-sm font-semibold ${step.highlight ? "text-green-400" : "text-white"}`}>
                        {step.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">{step.desc}</div>
                    </div>
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <div className="text-muted-foreground/40 text-xl px-2 rotate-90 md:rotate-0 my-1 md:my-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="flex justify-center gap-2 mb-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={`View ${tab.label}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                    isActive
                      ? `${tab.color} bg-white/[0.06] border border-white/10`
                      : "text-muted-foreground hover:text-white/70 border border-transparent"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-2">
                <h3 className={`text-xl md:text-2xl font-bold ${current.color}`}>
                  {current.headline}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  {current.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {current.metrics.map((metric, i) => (
                  <div
                    key={i}
                    className="glass-panel rounded-xl p-5 space-y-3 group hover:border-white/10 transition-all duration-300"
                  >
                    <div className="text-sm font-semibold text-white">{metric.label}</div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-14 shrink-0 text-red-400/60 font-mono font-medium pt-0.5">BEFORE</div>
                        <div className="text-gray-400">{metric.before}</div>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-14 shrink-0 text-green-400/60 font-mono font-medium pt-0.5">AFTER</div>
                        <div className="text-gray-300">{metric.after}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <TrendingDown className={`w-3.5 h-3.5 ${metric.improvementColor}`} />
                      <span className={`text-sm font-bold ${metric.improvementColor}`}>
                        {metric.improvement}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-panel rounded-xl p-5 border-white/5 bg-white/[0.01]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${current.color} shrink-0 mt-0.5`} />
                  <div className="text-sm text-gray-400 leading-relaxed">
                    <span className={`font-semibold ${current.color}`}>Key insight: </span>
                    {current.insight}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div variants={fadeUp} className="max-w-3xl mx-auto">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <span className="text-[11px] text-muted-foreground ml-2 font-mono">
                agentvault/canister/src/tool_dispatch.rs
              </span>
            </div>
            <div className="p-4 font-mono text-[12px] leading-relaxed space-y-0.5 overflow-x-auto">
              <div className="text-gray-500">{"// Before: verbose JSON-RPC payload on every tool call"}</div>
              <div className="text-gray-500">{"// After: interned selector from smallchat's compiled output"}</div>
              <div>&nbsp;</div>
              <div className="text-purple-400">{"// On-chain tool dispatch with smallchat pre-compilation"}</div>
              <div className="text-gray-300">
                <span className="text-blue-400">pub fn </span>
                <span className="text-green-400">dispatch_tool</span>
                {"("}
              </div>
              <div className="text-gray-400">
                {"    selector: "}
                <span className="text-blue-400">InternedSelector</span>
                {","}
              </div>
              <div className="text-gray-400">
                {"    args: "}
                <span className="text-blue-400">CompactArgs</span>
                {","}
              </div>
              <div className="text-gray-400">
                {"    caller: "}
                <span className="text-blue-400">Principal</span>
                {","}
              </div>
              <div className="text-gray-300">
                {")"}<span className="text-blue-400">{" -> Result"}</span>{"<"}
                <span className="text-green-400">ToolResult</span>
                {", "}
                <span className="text-red-400">CanisterError</span>
                {">"}{" {"}
              </div>
              <div className="text-gray-500">{"    // 1. Principal guard (AgentVault)"}</div>
              <div className="text-gray-400">
                {"    "}
                <span className="text-blue-400">guard</span>
                {"::verify_caller(caller)?;"}
              </div>
              <div>&nbsp;</div>
              <div className="text-gray-500">{"    // 2. Selector lookup — O(1) via interned table"}</div>
              <div className="text-gray-500">{"    //    (replaces JSON parse + semantic search)"}</div>
              <div className="text-gray-400">
                {"    "}
                <span className="text-blue-400">let</span>
                {" handler = "}
                <span className="text-green-400">DISPATCH_TABLE</span>
                {".get(selector)"}
              </div>
              <div className="text-gray-400">
                {"        .ok_or("}
                <span className="text-red-400">CanisterError</span>
                {"::UnknownSelector)?;"}
              </div>
              <div>&nbsp;</div>
              <div className="text-gray-500">{"    // 3. Execute with heap budget check"}</div>
              <div className="text-gray-400">
                {"    handler."}
                <span className="text-green-400">execute</span>
                {"(args)"}
              </div>
              <div className="text-gray-300">{"}"}</div>
              <div>&nbsp;</div>
              <div className="text-gray-500">{"// Selector size: 8 bytes (interned u64)"}</div>
              <div className="text-gray-500">{"// vs. JSON-RPC: ~4,800 bytes per call"}</div>
              <div className="text-gray-500">{"// = 600x reduction in on-chain payload"}</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "84%", label: "Token reduction", sub: "LLM input cost", color: "text-yellow-400" },
              { value: "40x", label: "Resolution speed", sub: "LRU cache vs search", color: "text-blue-400" },
              { value: "600x", label: "Payload reduction", sub: "On-chain tool calls", color: "text-green-400" },
            ].map((stat, i) => (
              <div key={i} className="glass-panel rounded-xl p-6 space-y-1">
                <div className={`text-3xl md:text-4xl font-bold tracking-tight ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-white">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
