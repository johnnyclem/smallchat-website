import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, ShieldX, Lock, Unlock, ChevronRight, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

type Approach = "mcp" | "smallchat" | "open-agent";

interface ApproachData {
  id: Approach;
  label: string;
  tagline: string;
  color: string;
  bgGlow: string;
  icon: typeof ShieldCheck;
  position: "Too Rigid" | "Just Right" | "Too Dangerous";
  positionColor: string;
  traits: { label: string; value: string; good: boolean }[];
  codeTitle: string;
  codeLines: { text: string; className: string }[];
  risks: string[];
  benefits: string[];
}

const approaches: ApproachData[] = [
  {
    id: "mcp",
    label: "MCP + Structured Output",
    tagline: "Every tool is a JSON schema. Every call is a prayer.",
    color: "text-blue-400",
    bgGlow: "rgba(59,130,246,0.06)",
    icon: Lock,
    position: "Too Rigid",
    positionColor: "text-blue-400",
    traits: [
      { label: "Context cost", value: "Extremely high", good: false },
      { label: "Type safety", value: "Schema-level only", good: false },
      { label: "Flexibility", value: "None — exact match required", good: false },
      { label: "Security", value: "Sandboxed per-tool", good: true },
    ],
    codeTitle: "Typical MCP tool registration",
    codeLines: [
      { text: "// 47 tools × ~320 tokens each = 15,040 tokens", className: "text-gray-500" },
      { text: "// just for tool schemas, before any conversation", className: "text-gray-500" },
      { text: '{', className: "text-gray-400" },
      { text: '  "name": "jira_search_issues",', className: "text-blue-400" },
      { text: '  "description": "Search for Jira issues...",', className: "text-gray-400" },
      { text: '  "parameters": {', className: "text-gray-400" },
      { text: '    "type": "object",', className: "text-gray-400" },
      { text: '    "properties": {', className: "text-gray-400" },
      { text: '      "jql": { "type": "string", ... },', className: "text-gray-400" },
      { text: '      "maxResults": { "type": "integer", ... },', className: "text-gray-400" },
      { text: '      "fields": { "type": "array", ... }', className: "text-gray-400" },
      { text: '    },', className: "text-gray-400" },
      { text: '    "required": ["jql"]', className: "text-gray-400" },
      { text: "  }", className: "text-gray-400" },
      { text: "}", className: "text-gray-400" },
      { text: "// ... repeat 46 more times", className: "text-red-400/60" },
    ],
    risks: [
      "Context window fills up before conversation starts",
      "No semantic understanding — model must guess exact tool names",
      "Adding providers multiplies token cost linearly",
      "Duplicate tools across providers waste tokens",
    ],
    benefits: [
      "Tools are sandboxed — limited blast radius",
    ],
  },
  {
    id: "smallchat",
    label: "smallchat",
    tagline: "Type-checked. Semantically mapped. Sandboxed by design.",
    color: "text-green-400",
    bgGlow: "rgba(34,197,94,0.06)",
    icon: ShieldCheck,
    position: "Just Right",
    positionColor: "text-green-400",
    traits: [
      { label: "Context cost", value: "Minimal — compiled", good: true },
      { label: "Type safety", value: "Full compile-time checks", good: true },
      { label: "Flexibility", value: "Semantic dispatch", good: true },
      { label: "Security", value: "Only compiler-fed tools", good: true },
    ],
    codeTitle: "smallchat compiled output",
    codeLines: [
      { text: "// Compiler ingests 150+ tools from 10 providers", className: "text-gray-500" },
      { text: "// outputs a single, type-safe dispatch table", className: "text-gray-500" },
      { text: "", className: "" },
      { text: "import { CompiledToolkit } from 'smallchat';", className: "text-green-400" },
      { text: "", className: "" },
      { text: "const toolkit = CompiledToolkit.load('./compiled.json');", className: "text-gray-300" },
      { text: "", className: "" },
      { text: "// Semantic dispatch — no exact name matching", className: "text-gray-500" },
      { text: 'const result = await toolkit.dispatch(', className: "text-gray-300" },
      { text: '  "find my recent cloud files about quarterly reports"', className: "text-orange-300" },
      { text: ");", className: "text-gray-300" },
      { text: "", className: "" },
      { text: "// Compiler already resolved:", className: "text-gray-500" },
      { text: "//   - which providers have file-search capabilities", className: "text-gray-500" },
      { text: "//   - auth-aware routing (iCloud vs Google Drive)", className: "text-gray-500" },
      { text: "//   - deduplicated overlapping schemas", className: "text-gray-500" },
    ],
    risks: [],
    benefits: [
      "Compile-time type checking catches errors before runtime",
      "Semantic vectors replace verbose schemas — tiny context footprint",
      "Auth-aware merging creates safe overloaded signatures",
      "Only tools fed into the compiler are accessible — no escape hatch",
      "Cross-provider deduplication eliminates redundancy",
    ],
  },
  {
    id: "open-agent",
    label: "Open Agents (openclaw / nanoclaw)",
    tagline: "Full autonomy. Full root access. What could go wrong?",
    color: "text-red-400",
    bgGlow: "rgba(239,68,68,0.06)",
    icon: Unlock,
    position: "Too Dangerous",
    positionColor: "text-red-400",
    traits: [
      { label: "Context cost", value: "Low — dynamic loading", good: true },
      { label: "Type safety", value: "None", good: false },
      { label: "Flexibility", value: "Unlimited — including shell access", good: false },
      { label: "Security", value: "Full root on host machine", good: false },
    ],
    codeTitle: "Typical open agent setup",
    codeLines: [
      { text: "// The agent has full access to everything", className: "text-gray-500" },
      { text: "// including your filesystem, network, and secrets", className: "text-gray-500" },
      { text: "", className: "" },
      { text: "const agent = new OpenAgent({", className: "text-gray-300" },
      { text: '  model: "gpt-4",', className: "text-gray-400" },
      { text: "  tools: ['*'],", className: "text-red-400" },
      { text: "  permissions: {", className: "text-gray-400" },
      { text: "    filesystem: true,", className: "text-red-400" },
      { text: "    network: true,", className: "text-red-400" },
      { text: "    shell: true,", className: "text-red-400" },
      { text: "    env_vars: true,", className: "text-red-400" },
      { text: "  }", className: "text-gray-400" },
      { text: "});", className: "text-gray-300" },
      { text: "", className: "" },
      { text: '// "Hey agent, clean up my project files"', className: "text-gray-500" },
      { text: "// > rm -rf / ... oops", className: "text-red-400/60" },
    ],
    risks: [
      "Full root access to the host machine",
      "Can read environment variables, API keys, secrets",
      "Unrestricted shell execution — rm -rf is one hallucination away",
      "No compile-time checks — errors surface at runtime (or never)",
      "Network access enables data exfiltration",
    ],
    benefits: [
      "Low context overhead — tools loaded on demand",
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export function SafetySpectrum() {
  const [active, setActive] = useState<Approach>("smallchat");
  const current = approaches.find((a) => a.id === active)!;

  return (
    <section id="safety" className="py-32 px-6 relative overflow-hidden scroll-mt-20">
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at center, ${current.bgGlow} 0%, transparent 70%)`,
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
          <div className="inline-flex items-center text-primary bg-primary/10 px-3 py-1 rounded-full text-sm font-medium">
            <ShieldAlert className="w-4 h-4 mr-2" />
            The Safety Spectrum
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Not too rigid. Not too dangerous.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every approach to tool calling makes a tradeoff between control and capability.
            Most get it wrong.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="relative max-w-3xl mx-auto">
            <div className="h-2 rounded-full bg-white/5 relative overflow-hidden">
              <div
                className="absolute inset-y-0 rounded-full transition-all duration-500"
                style={{
                  background:
                    "linear-gradient(to right, rgba(59,130,246,0.6), rgba(34,197,94,0.6), rgba(239,68,68,0.6))",
                  left: 0,
                  right: 0,
                }}
              />
            </div>

            <div className="flex justify-between mt-0 relative">
              {approaches.map((approach) => {
                const isActive = active === approach.id;
                return (
                  <button
                    key={approach.id}
                    onClick={() => setActive(approach.id)}
                    className={`flex flex-col items-center pt-4 group cursor-pointer transition-all duration-300 ${
                      approach.id === "mcp"
                        ? "items-start"
                        : approach.id === "open-agent"
                          ? "items-end"
                          : "items-center"
                    }`}
                    style={{
                      width: approach.id === "smallchat" ? "40%" : "30%",
                    }}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-300 -mt-[13px] mb-3 ${
                        isActive
                          ? `${approach.color} border-current scale-125 shadow-lg`
                          : "border-white/20 bg-white/5"
                      }`}
                      style={
                        isActive
                          ? {
                              boxShadow: `0 0 12px ${approach.bgGlow.replace("0.06", "0.4")}`,
                            }
                          : {}
                      }
                    />
                    <div
                      className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
                        isActive ? approach.positionColor : "text-white/30"
                      }`}
                    >
                      {approach.position}
                    </div>
                    <div
                      className={`text-sm font-medium mt-1 transition-colors duration-300 ${
                        isActive ? "text-white" : "text-white/40"
                      }`}
                    >
                      {approach.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="grid lg:grid-cols-2 gap-8"
          >
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <current.icon
                    className={`w-8 h-8 ${current.color} shrink-0 mt-0.5`}
                  />
                  <div>
                    <h3 className={`text-xl font-bold ${current.color}`}>
                      {current.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      {current.tagline}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {current.traits.map((trait, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0"
                    >
                      <span className="text-muted-foreground">{trait.label}</span>
                      <span
                        className={`font-medium ${
                          trait.good ? "text-green-400" : "text-red-400/80"
                        }`}
                      >
                        {trait.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {current.risks.length > 0 && (
                  <div className="glass-panel rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Risks
                    </div>
                    {current.risks.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <XCircle className="w-3.5 h-3.5 text-red-400/60 shrink-0 mt-0.5" />
                        {risk}
                      </div>
                    ))}
                  </div>
                )}
                {current.benefits.length > 0 && (
                  <div className="glass-panel rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-400 uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Benefits
                    </div>
                    {current.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400/60 shrink-0 mt-0.5" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                  </div>
                  <span className="text-[11px] text-muted-foreground ml-2 font-mono">
                    {current.codeTitle}
                  </span>
                </div>
                <div className="p-4 font-mono text-[12px] leading-relaxed space-y-0.5 overflow-x-auto">
                  {current.codeLines.map((line, i) => (
                    <div key={i} className={`whitespace-pre ${line.className}`}>
                      {line.text || "\u00A0"}
                    </div>
                  ))}
                </div>
              </div>

              {active === "smallchat" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel rounded-xl p-4 border-green-500/20 bg-green-500/[0.03]"
                >
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="text-green-400 font-semibold text-sm">
                        The compiler is your security boundary.
                      </div>
                      <p>
                        smallchat can only access the tools you explicitly feed into the compiler.
                        There is no shell access, no filesystem escape hatch, no ambient authority.
                        If a tool was not in the compilation input, it does not exist at runtime.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {active === "open-agent" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel rounded-xl p-4 border-red-500/20 bg-red-500/[0.03]"
                >
                  <div className="flex items-start gap-3">
                    <ShieldX className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="text-red-400 font-semibold text-sm">
                        Root access means total access.
                      </div>
                      <p>
                        Open agents like openclaw and nanoclaw grant the model full access to your host machine.
                        One hallucinated shell command can delete files, exfiltrate secrets, or modify system state.
                        There is no compile step, no type checking, and no boundary between "what the model can do" and "everything."
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {active === "mcp" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel rounded-xl p-4 border-blue-500/20 bg-blue-500/[0.03]"
                >
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="text-blue-400 font-semibold text-sm">
                        Safe, but at what cost?
                      </div>
                      <p>
                        MCP's structured output approach is sandboxed and predictable — but it pays for safety with rigidity.
                        Every tool dumps its full JSON schema into the context window, burning tokens before the conversation even starts.
                        Adding more providers means linearly more cost, with no deduplication, no semantic understanding, and no way to
                        merge overlapping capabilities.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.div variants={fadeUp} className="flex justify-center pt-4">
          <div className="inline-flex items-center gap-6 text-sm text-muted-foreground">
            {approaches.map((a) => (
              <button
                key={a.id}
                onClick={() => setActive(a.id)}
                className={`flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                  active === a.id ? `${a.color} font-medium` : "hover:text-white/60"
                }`}
              >
                <a.icon className="w-4 h-4" />
                {a.label}
                {active === a.id && <ChevronRight className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
