import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  DollarSign,
  Gauge,
  ChevronRight,
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
    headline: "Validation and policy before canister execution",
    description:
      "AgentVault's smallchat layer sits between the model's tool call and the canister's Candid method. It resolves the selector, checks the parameters and applies policy before anything executes, a layer ICP's principal guards alone do not provide.",
    metrics: [
      {
        label: "Tool call validation",
        before: "None — raw LLM output to canister",
        after: "Type, required and enum checks against Candid-derived schemas",
        improvement: "Every bridged call",
        improvementColor: "text-green-400",
      },
      {
        label: "Redundant call deduplication",
        before: "Same tool invoked repeatedly per session",
        after: "Same selector + parameter hash within 5 s is refused",
        improvement: "~40% fewer calls",
        improvementColor: "text-green-400",
      },
      {
        label: "Rate limiting",
        before: "None — the canister has no per-call rate limit",
        after: "Per-selector and global limits before the call (default 60/min)",
        improvement: "Pre-execution",
        improvementColor: "text-green-400",
      },
      {
        label: "Unauthorized tool access",
        before: "Model can attempt any canister method",
        after: "Only selectors registered from the Candid interface resolve",
        improvement: "Unknown selectors refused",
        improvementColor: "text-green-400",
      },
    ],
    insight:
      "The canister's principal guards, heap check and kill switch act inside the canister. The smallchat layer works earlier, in the orchestrator: it validates, deduplicates, rate-limits and MFA-gates tool calls before they reach the canister.",
  },
  {
    id: "cost",
    label: "Cost Savings",
    icon: DollarSign,
    color: "text-yellow-400",
    bgGlow: "rgba(234,179,8,0.05)",
    headline: "Fewer prompt tokens, smaller call records",
    description:
      "The layer runs in AgentVault's TypeScript orchestrator, off-chain, so it does not change canister heap use or cycle cost. It gives the model a compact tool header in place of full JSON schemas, and encodes each call as a 38-byte record instead of ~500+ bytes of JSON. Token and cost figures are estimates from typical MCP schema sizes, not AgentVault measurements.",
    metrics: [
      {
        label: "Tool schema tokens per invocation",
        before: "~15,000 tokens (full JSON schemas)",
        after: "~2,400 tokens (compact tool header)",
        improvement: "~84% (est.)",
        improvementColor: "text-yellow-400",
      },
      {
        label: "Tool-call record size",
        before: "~500+ B of JSON per call",
        after: "38 B fixed-width binary record",
        improvement: "Fixed 38 bytes",
        improvementColor: "text-yellow-400",
      },
      {
        label: "Repeated multi-step sequences",
        before: "No pattern tracking",
        after: "A 2–5 step sequence seen 3+ times gets one composite selector",
        improvement: "Pattern detection",
        improvementColor: "text-yellow-400",
      },
      {
        label: "LLM cost per 1K sessions (est.)",
        before: "$47.20 (full schemas in the prompt)",
        after: "$8.50 (compact tool header)",
        improvement: "~82% (est.)",
        improvementColor: "text-yellow-400",
      },
    ],
    insight:
      "At those estimates, an agent handling 10K sessions a month saves roughly $387 in LLM input cost. The canister side is unchanged: the layer runs before a call reaches it.",
  },
  {
    id: "performance",
    label: "Performance Gains",
    icon: Gauge,
    color: "text-blue-400",
    bgGlow: "rgba(59,130,246,0.05)",
    headline: "An LRU cache skips repeat resolution",
    description:
      "The bridge's LRU resolution cache serves a repeated selector with the same parameters without resolving or validating it again, and a ToolClass hierarchy finds a tool by selector or Candid method name. Lookup is exact, with no embeddings, and it all runs in the orchestrator before a call reaches the canister.",
    metrics: [
      {
        label: "Repeat tool calls",
        before: "Resolved and validated on every call",
        after: "Same selector + parameter hash served from the LRU cache",
        improvement: "Skips resolve + validate",
        improvementColor: "text-blue-400",
      },
      {
        label: "Cache hit rate",
        before: "N/A — no caching layer",
        after: "Depends on how often a session repeats a call",
        improvement: "Workload-dependent",
        improvementColor: "text-blue-400",
      },
      {
        label: "Selector resolution",
        before: "Flat Candid service interface",
        after: "Exact selector lookup, then the ToolClass chain by selector or Candid method name",
        improvement: "Exact, no embeddings",
        improvementColor: "text-blue-400",
      },
      {
        label: "Cache size",
        before: "No cache",
        after: "256 entries by default; least recently used evicted first",
        improvement: "Bounded",
        improvementColor: "text-blue-400",
      },
    ],
    insight:
      "The LRU resolution cache fills as a session repeats calls. Repeat calls with the same selector and parameters skip resolution and validation. Policy checks (rate limit, dedup, MFA) still run on every call.",
  },
];

const pipelineSteps = [
  { label: "LLM Intent", icon: Cpu, desc: "Model names a tool selector", color: "text-white/60" },
  { label: "smallchat bridge", icon: Layers, desc: "Cache → Resolve → Validate", color: "text-green-400", highlight: true },
  { label: "Policy", icon: Shield, desc: "Rate limit → Dedup → MFA gate", color: "text-green-400", highlight: true },
  { label: "ICP Canister", icon: Lock, desc: "Principal guards → Heap check → Execute", color: "text-purple-400" },
];

export function CaseStudy({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<MetricTab>("security");
  const current = tabs.find((t) => t.id === activeTab)!;

  const Wrapper = embedded ? "div" : motion.div;
  const wrapperProps = embedded ? {} : { variants: fadeUp };

  const innerContent = (
    <div className={embedded ? "space-y-12 relative" : "max-w-5xl mx-auto space-y-16"}>
      {!embedded && (
        <motion.div variants={fadeUp} className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            Case Study
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            smallchat <span className="text-gradient">&times;</span> AgentVault
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A smallchat-style dispatch layer in front of AgentVault's ICP canister —
            selectors, validation and policy before anything executes.
          </p>
        </motion.div>
      )}

        <Wrapper {...wrapperProps} className="max-w-3xl mx-auto">
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
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-5 text-center">
              AgentVault ships its own TypeScript layer modeled on smallchat's runtime
              (<span className="font-mono">src/orchestration/smallchat-*.ts</span>). It runs in the orchestrator,
              off-chain, and is opt-in through the library API. It does not import @smallchat/core.
            </p>
          </div>
        </Wrapper>

        <Wrapper {...wrapperProps}>
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
        </Wrapper>

        <Wrapper {...wrapperProps} className="max-w-3xl mx-auto">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <span className="text-[11px] text-muted-foreground ml-2 font-mono">
                agentvault/src/orchestration/claude.ts — dispatchToolCall (abridged)
              </span>
            </div>
            <div className="p-4 font-mono text-[12px] leading-relaxed space-y-0.5 overflow-x-auto">
              <div className="text-purple-400">{"// One tool call through AgentVault's smallchat layer"}</div>
              <div className="text-gray-300">
                <span className="text-green-400">dispatchToolCall</span>
                {"(selector, parameters, callerId) {"}
              </div>
              <div className="text-gray-500">{"  // 1. Resolve through the ToolClass hierarchy; check params"}</div>
              <div className="text-gray-400">
                {"  "}
                <span className="text-blue-400">const</span>
                {" dispatch = "}
                <span className="text-blue-400">this</span>
                {".smallChatBridge."}
                <span className="text-green-400">dispatch</span>
                {"(selector, parameters);"}
              </div>
              <div className="text-gray-400">
                {"  "}
                <span className="text-blue-400">if</span>
                {" (!dispatch.success) "}
                <span className="text-blue-400">return</span>
                {" { allowed: "}
                <span className="text-red-400">false</span>
                {", error: dispatch.error };"}
              </div>
              <div>&nbsp;</div>
              <div className="text-gray-500">{"  // 2. Policy: blocked categories, size, rate limit, dedup, rules, MFA"}</div>
              <div className="text-gray-400">
                {"  "}
                <span className="text-blue-400">const</span>
                {" policy = "}
                <span className="text-blue-400">this</span>
                {".smallChatPolicy."}
                <span className="text-green-400">evaluate</span>
                {"(dispatch.toolCall, callerId);"}
              </div>
              <div className="text-gray-400">
                {"  "}
                <span className="text-blue-400">if</span>
                {" (policy.decision !== "}
                <span className="text-green-400">'allow'</span>
                {") "}
                <span className="text-blue-400">return</span>
                {" { allowed: "}
                <span className="text-red-400">false</span>
                {", policyResult: policy };"}
              </div>
              <div>&nbsp;</div>
              <div className="text-gray-500">{"  // 3. Encode for storage as a fixed-width binary record"}</div>
              <div className="text-gray-400">
                {"  "}
                <span className="text-blue-400">const</span>
                {" compressed = "}
                <span className="text-blue-400">this</span>
                {".smallChatCompressor."}
                <span className="text-green-400">encode</span>
                {"(dispatch.toolCall);"}
              </div>
              <div className="text-gray-400">
                {"  "}
                <span className="text-blue-400">return</span>
                {" { allowed: "}
                <span className="text-green-400">true</span>
                {", toolCall: dispatch.toolCall, policyResult: policy, compressed };"}
              </div>
              <div className="text-gray-300">{"}"}</div>
              <div>&nbsp;</div>
              <div className="text-gray-500">{"// Record: 2-byte selector id + 32-byte parameter hash"}</div>
              <div className="text-gray-500">{"//         + 4-byte time delta = 38 bytes"}</div>
              <div className="text-gray-500">{"// vs. ~500+ bytes of JSON per call (smallchat-compression.ts)"}</div>
            </div>
          </div>
        </Wrapper>

        <Wrapper {...wrapperProps} className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "~84%", label: "Token reduction", sub: "Est. LLM input tokens", color: "text-yellow-400" },
              { value: "5 s", label: "Dedup window", sub: "Same selector + params refused", color: "text-blue-400" },
              { value: "38 B", label: "Per tool-call record", sub: "vs ~500+ B of JSON", color: "text-green-400" },
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
        </Wrapper>
    </div>
  );

  if (embedded) return innerContent;

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
      >
        {innerContent}
      </motion.div>
    </section>
  );
}
