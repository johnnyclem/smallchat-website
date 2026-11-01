import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Layers, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Cells, Icon, TabBar, panelId, tabId, panelMotion } from "@/components/site";

type MetricTab = "security" | "cost" | "performance";

interface Metric {
  label: string;
  before: string;
  after: string;
  improvement: string;
}

interface TabData {
  id: MetricTab;
  label: string;
  headline: string;
  description: string;
  metrics: Metric[];
  insight: string;
}

const tabs: TabData[] = [
  {
    id: "security",
    label: "Security wins",
    headline: "Validation and policy before canister execution",
    description:
      "AgentVault's smallchat layer sits between the model's tool call and the canister's Candid method. It resolves the selector, checks the parameters and applies policy before anything executes, a layer ICP's principal guards alone do not provide.",
    metrics: [
      {
        label: "Tool call validation",
        before: "None: raw LLM output to canister",
        after: "Type, required and enum checks against Candid-derived schemas",
        improvement: "Every bridged call",
      },
      {
        label: "Redundant call deduplication",
        before: "Same tool invoked repeatedly per session",
        after: "Same selector + parameter hash within 5 s is refused",
        improvement: "5 s window",
      },
      {
        label: "Rate limiting",
        before: "None: the canister has no per-call rate limit",
        after: "Per-selector and global limits before the call (default 60/min)",
        improvement: "Pre-execution",
      },
      {
        label: "Unauthorized tool access",
        before: "Model can attempt any canister method",
        after: "Only selectors registered from the Candid interface resolve",
        improvement: "Unknown selectors refused",
      },
    ],
    insight:
      "The canister's principal guards, heap check and kill switch act inside the canister. The smallchat layer works earlier, in the orchestrator: it validates, deduplicates, rate-limits and MFA-gates tool calls before they reach the canister.",
  },
  {
    id: "cost",
    label: "Cost savings",
    headline: "Fewer prompt tokens, smaller call records",
    description:
      "The layer runs in AgentVault's TypeScript orchestrator, off-chain, so it does not change canister heap use or cycle cost. It gives the model a compact tool header in place of full JSON schemas, and encodes each call as a 38-byte record instead of ~500+ bytes of JSON. Token and cost figures are estimates from typical MCP schema sizes, not AgentVault measurements.",
    metrics: [
      {
        label: "Tool schema tokens per invocation",
        before: "~15,000 tokens (full JSON schemas)",
        after: "~2,400 tokens (compact tool header)",
        improvement: "~84% (est.)",
      },
      {
        label: "Tool-call record size",
        before: "~500+ B of JSON per call",
        after: "38 B fixed-width binary record",
        improvement: "Fixed 38 bytes",
      },
      {
        label: "Repeated multi-step sequences",
        before: "No pattern tracking",
        after: "A 2–5 step sequence seen 3+ times gets one composite selector",
        improvement: "Pattern detection",
      },
      {
        label: "LLM cost per 1K sessions (est.)",
        before: "$47.20 (full schemas in the prompt)",
        after: "$8.50 (compact tool header)",
        improvement: "~82% (est.)",
      },
    ],
    insight:
      "At those estimates, an agent handling 10K sessions a month saves roughly $387 in LLM input cost. The canister side is unchanged: the layer runs before a call reaches it.",
  },
  {
    id: "performance",
    label: "Performance gains",
    headline: "An LRU cache skips repeat resolution",
    description:
      "The bridge's LRU resolution cache serves a repeated selector with the same parameters without resolving or validating it again, and a ToolClass hierarchy finds a tool by selector or Candid method name. Lookup is exact, with no embeddings, and it all runs in the orchestrator before a call reaches the canister.",
    metrics: [
      {
        label: "Repeat tool calls",
        before: "Resolved and validated on every call",
        after: "Same selector + parameter hash served from the LRU cache",
        improvement: "Skips resolve + validate",
      },
      {
        label: "Cache hit rate",
        before: "N/A: no caching layer",
        after: "Depends on how often a session repeats a call",
        improvement: "Workload-dependent",
      },
      {
        label: "Selector resolution",
        before: "Flat Candid service interface",
        after: "Exact selector lookup, then the ToolClass chain by selector or Candid method name",
        improvement: "Exact, no embeddings",
      },
      {
        label: "Cache size",
        before: "No cache",
        after: "256 entries by default; least recently used evicted first",
        improvement: "Bounded",
      },
    ],
    insight:
      "The LRU resolution cache fills as a session repeats calls. Repeat calls with the same selector and parameters skip resolution and validation. Policy checks (rate limit, dedup, MFA) still run on every call.",
  },
];

const TAB_LIST = tabs.map((t) => ({ id: t.id, label: t.label }));

/** A data cell. On narrow screens each row stacks and the column name sits above its value. */
const CELL =
  "block text-sm leading-relaxed text-muted-foreground before:mb-0.5 before:block before:font-mono before:text-xs before:text-muted-foreground before:content-[attr(data-label)] md:table-cell md:px-6 md:py-4 md:align-top md:before:hidden";

function Step({ n, icon: StepIcon, label, desc }: { n: number; icon: typeof Cpu; label: string; desc: string }) {
  return (
    <li className="flex list-none flex-col gap-2 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <Icon as={StepIcon} />
        <span className="font-mono text-xs">{n}</span>
      </div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="text-xs leading-relaxed text-muted-foreground">{desc}</div>
    </li>
  );
}

export function CaseStudy() {
  const [activeTab, setActiveTab] = useState<MetricTab>("security");
  const current = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-12">
      <div className="space-y-4 rounded-xl border bg-deep p-6">
        <h3 className="text-sm font-medium text-subtle">Execution pipeline</h3>
        <ol className="grid list-none gap-3 p-0 md:grid-cols-[1fr_2.2fr_1fr] md:items-center">
          <Step n={1} icon={Cpu} label="LLM intent" desc="Model names a tool selector" />
          <li className="list-none space-y-3 rounded-xl border border-border-strong p-3">
            <p className="px-1 font-mono text-xs text-muted-foreground">smallchat layer, off-chain</p>
            <ol className="grid list-none gap-3 p-0 sm:grid-cols-2">
              <Step n={2} icon={Layers} label="smallchat bridge" desc="Cache → Resolve → Validate" />
              <Step n={3} icon={Shield} label="Policy" desc="Rate limit → Dedup → MFA gate" />
            </ol>
          </li>
          <Step n={4} icon={Lock} label="ICP canister" desc="Principal guards → Heap check → Execute" />
        </ol>
        <p className="text-xs leading-relaxed text-muted-foreground">
          AgentVault ships its own TypeScript layer modeled on smallchat's runtime (<span className="font-mono">src/orchestration/smallchat-*.ts</span>).
          It runs in the orchestrator, off-chain, and is opt-in through the library API. It does not import @smallchat/core.
        </p>
      </div>

      <div className="space-y-8">
        <TabBar<MetricTab> tabs={TAB_LIST} active={activeTab} onChange={setActiveTab} prefix="case" label="AgentVault results" />
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            role="tabpanel"
            id={panelId("case")}
            aria-labelledby={tabId("case", current.id)}
            {...panelMotion}
            className="space-y-6"
          >
            <div className="max-w-3xl space-y-3">
              <h3 className="text-xl font-medium leading-tight md:text-[28px]">{current.headline}</h3>
              <p className="text-pretty text-base leading-relaxed text-subtle">{current.description}</p>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
              <table className="block w-full border-collapse text-left md:table">
                <caption className="sr-only">{current.label}: before and after</caption>
                <thead className="hidden md:table-header-group">
                  <tr className="border-b text-xs text-muted-foreground">
                    <th scope="col" className="w-[22%] px-6 py-3 font-normal">Metric</th>
                    <th scope="col" className="w-[28%] px-6 py-3 font-normal">Before</th>
                    <th scope="col" className="w-[30%] px-6 py-3 font-normal">After</th>
                    <th scope="col" className="px-6 py-3 font-normal">Result</th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group">
                  {current.metrics.map((metric) => (
                    <tr key={metric.label} className="block space-y-2 border-b px-6 py-4 last:border-b-0 md:table-row md:space-y-0 md:px-0 md:py-0">
                      <th scope="row" className="block text-left text-sm font-medium text-foreground md:table-cell md:px-6 md:py-4 md:align-top">
                        {metric.label}
                      </th>
                      <td data-label="Before" className={CELL}>
                        {metric.before}
                      </td>
                      <td data-label="After" className={cn(CELL, "text-foreground")}>
                        {metric.after}
                      </td>
                      <td data-label="Result" className={cn(CELL, "font-medium text-foreground")}>
                        {metric.improvement}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border bg-deep p-6 text-sm leading-relaxed text-subtle">
              <span className="font-medium text-foreground">Key insight. </span>
              {current.insight}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <figure className="overflow-hidden rounded-xl border bg-deep">
        <figcaption className="flex h-10 items-center border-b bg-card px-4 font-mono text-xs text-muted-foreground">
          agentvault/src/orchestration/claude.ts · dispatchToolCall (abridged)
        </figcaption>
        <div className="overflow-x-auto p-4" tabIndex={0}>
          <pre className="font-mono text-[13px] leading-6 text-subtle">
            <code>
              <span className="token-comment">{"// One tool call through AgentVault's smallchat layer"}</span>
              {"\n"}
              <span className="token-function">dispatchToolCall</span>
              {"(selector, parameters, callerId) {\n"}
              <span className="token-comment">{"  // 1. Resolve through the ToolClass hierarchy; check params\n"}</span>
              {"  "}
              <span className="token-keyword">const</span>
              {" dispatch = "}
              <span className="token-keyword">this</span>
              {".smallChatBridge."}
              <span className="token-function">dispatch</span>
              {"(selector, parameters);\n  "}
              <span className="token-keyword">if</span>
              {" (!dispatch.success) "}
              <span className="token-keyword">return</span>
              {" { allowed: "}
              <span className="token-keyword">false</span>
              {", error: dispatch.error };\n\n"}
              <span className="token-comment">{"  // 2. Policy: blocked categories, size, rate limit, dedup, rules, MFA\n"}</span>
              {"  "}
              <span className="token-keyword">const</span>
              {" policy = "}
              <span className="token-keyword">this</span>
              {".smallChatPolicy."}
              <span className="token-function">evaluate</span>
              {"(dispatch.toolCall, callerId);\n  "}
              <span className="token-keyword">if</span>
              {" (policy.decision !== "}
              <span className="token-string">'allow'</span>
              {") "}
              <span className="token-keyword">return</span>
              {" { allowed: "}
              <span className="token-keyword">false</span>
              {", policyResult: policy };\n\n"}
              <span className="token-comment">{"  // 3. Encode for storage as a fixed-width binary record\n"}</span>
              {"  "}
              <span className="token-keyword">const</span>
              {" compressed = "}
              <span className="token-keyword">this</span>
              {".smallChatCompressor."}
              <span className="token-function">encode</span>
              {"(dispatch.toolCall);\n  "}
              <span className="token-keyword">return</span>
              {" { allowed: "}
              <span className="token-keyword">true</span>
              {", toolCall: dispatch.toolCall, policyResult: policy, compressed };\n}\n\n"}
              <span className="token-comment">
                {"// Record: 2-byte selector id + 32-byte parameter hash\n//         + 4-byte time delta = 38 bytes\n// vs. ~500+ bytes of JSON per call (smallchat-compression.ts)"}
              </span>
            </code>
          </pre>
        </div>
      </figure>

      <Cells className="grid-cols-3">
        {[
          { value: "~84%", label: "Token reduction", sub: "est. vs full JSON schemas" },
          { value: "5\u2009s", label: "Dedup window", sub: "same selector and params refused" },
          { value: "38\u2009B", label: "Per tool-call record", sub: "vs ~500+ B of JSON" },
        ].map((stat) => (
          <dl key={stat.label} className="flex flex-col gap-1 bg-card p-4 sm:p-6">
            <dt className="text-sm font-medium text-foreground">{stat.label}</dt>
            <dd className="order-first font-mono text-xl font-medium tabular-nums text-foreground md:text-[28px] md:leading-9">{stat.value}</dd>
            <dd className="text-xs leading-relaxed text-muted-foreground">{stat.sub}</dd>
          </dl>
        ))}
      </Cells>
    </div>
  );
}
