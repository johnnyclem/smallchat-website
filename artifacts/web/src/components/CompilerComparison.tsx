import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface ToolGroup {
  id: string;
  name: string;
  icon: string;
  toolCount: number;
  avgSchemaTokens: number;
  description: string;
}

interface OverlapPair {
  a: string;
  b: string;
  count: number;
}

const toolGroups: ToolGroup[] = [
  { id: "atlassian", name: "Atlassian", icon: "\u{1F537}", toolCount: 47, avgSchemaTokens: 320, description: "Jira issues, Confluence pages, Bitbucket repos, project management" },
  { id: "github", name: "GitHub", icon: "\u{1F419}", toolCount: 34, avgSchemaTokens: 280, description: "Repos, issues, PRs, actions, code search, gists" },
  { id: "slack", name: "Slack", icon: "\u{1F4AC}", toolCount: 22, avgSchemaTokens: 240, description: "Messages, channels, reactions, threads, user lookup" },
  { id: "google", name: "Google Drive", icon: "\u{1F4CA}", toolCount: 32, avgSchemaTokens: 310, description: "Drive files, Sheets, Docs, shared drives, permissions" },
  { id: "icloud", name: "iCloud", icon: "\u{2601}\u{FE0F}", toolCount: 24, avgSchemaTokens: 270, description: "iCloud Drive files, photos, notes, reminders, sharing" },
  { id: "notion", name: "Notion", icon: "\u{1F4DD}", toolCount: 28, avgSchemaTokens: 290, description: "Pages, databases, blocks, search, comments" },
  { id: "linear", name: "Linear", icon: "\u{1F53A}", toolCount: 19, avgSchemaTokens: 260, description: "Issues, projects, cycles, teams, labels" },
  { id: "discord", name: "Discord", icon: "\u{1F3AE}", toolCount: 26, avgSchemaTokens: 250, description: "Messages, channels, roles, reactions, voice" },
  { id: "stripe", name: "Stripe", icon: "\u{1F4B3}", toolCount: 42, avgSchemaTokens: 380, description: "Payments, subscriptions, customers, invoices, products" },
  { id: "aws", name: "AWS", icon: "\u{2601}\u{FE0F}", toolCount: 85, avgSchemaTokens: 420, description: "S3, Lambda, DynamoDB, EC2, CloudWatch, IAM" },
  { id: "vercel", name: "Vercel", icon: "\u{25B2}", toolCount: 18, avgSchemaTokens: 230, description: "Deployments, domains, env vars, logs, projects" },
];

const overlapPairs: OverlapPair[] = [
  { a: "atlassian", b: "github", count: 6 },
  { a: "atlassian", b: "linear", count: 8 },
  { a: "atlassian", b: "notion", count: 3 },
  { a: "github", b: "linear", count: 5 },
  { a: "slack", b: "discord", count: 4 },
  { a: "google", b: "icloud", count: 7 },
  { a: "google", b: "notion", count: 4 },
  { a: "icloud", b: "notion", count: 2 },
  { a: "aws", b: "vercel", count: 2 },
];

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

const overlapMap = new Map<string, number>();
for (const pair of overlapPairs) {
  overlapMap.set(pairKey(pair.a, pair.b), pair.count);
}

function getOverlapPartners(id: string): string[] {
  const partners: string[] = [];
  for (const pair of overlapPairs) {
    if (pair.a === id) partners.push(pair.b);
    else if (pair.b === id) partners.push(pair.a);
  }
  return partners;
}

const CONTEXT_WINDOW = 128_000;
const COST_PER_1K_INPUT = 0.003;
const BASELINE_TOKENS = 800;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

function BarFill({ percent, color, animate }: { percent: number; color: string; animate: boolean }) {
  return (
    <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden relative">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={false}
        animate={{ width: `${Math.min(percent, 100)}%` }}
        transition={{ duration: animate ? 0.6 : 0, ease: "easeOut" }}
      />
      {percent > 100 && (
        <div className="absolute inset-0 rounded-full border-2 border-red-500/60 animate-pulse" />
      )}
    </div>
  );
}

export function CompilerComparison() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["atlassian", "github", "linear"]));
  const [showAll, setShowAll] = useState(false);
  const [compiled, setCompiled] = useState(false);

  const visibleGroups = showAll ? toolGroups : toolGroups.slice(0, 6);

  const hiddenSelectedCount = useMemo(() => {
    if (showAll) return 0;
    const hiddenIds = toolGroups.slice(6).map((g) => g.id);
    return hiddenIds.filter((id) => selected.has(id)).length;
  }, [selected, showAll]);

  const stats = useMemo(() => {
    const selectedGroups = toolGroups.filter((g) => selected.has(g.id));
    const selectedIds = new Set(selectedGroups.map((g) => g.id));

    const rawToolCount = selectedGroups.reduce((sum, g) => sum + g.toolCount, 0);
    const rawSchemaTokens = selectedGroups.reduce((sum, g) => sum + g.toolCount * g.avgSchemaTokens, 0);
    const rawTokens = rawSchemaTokens + BASELINE_TOKENS;

    let overlapReduction = 0;
    for (const pair of overlapPairs) {
      if (selectedIds.has(pair.a) && selectedIds.has(pair.b)) {
        overlapReduction += pair.count;
      }
    }

    const semanticDedup = Math.round(rawToolCount * 0.12);
    const totalReduction = overlapReduction + semanticDedup;

    const compiledToolCount = Math.max(rawToolCount - totalReduction, 1);
    const compressionRatio = 0.35;
    const compiledSchemaTokens = Math.round(compiledToolCount * 180 * compressionRatio);
    const compiledTokens = compiledSchemaTokens + BASELINE_TOKENS;

    const rawContextPercent = (rawTokens / CONTEXT_WINDOW) * 100;
    const compiledContextPercent = (compiledTokens / CONTEXT_WINDOW) * 100;

    const rawCost = (rawTokens / 1000) * COST_PER_1K_INPUT;
    const compiledCost = (compiledTokens / 1000) * COST_PER_1K_INPUT;

    return {
      rawToolCount,
      rawTokens,
      rawContextPercent,
      rawCost,
      compiledToolCount,
      compiledTokens,
      compiledContextPercent,
      compiledCost,
      overlapReduction,
      semanticDedup,
      tokenSavings: Math.round(((rawTokens - compiledTokens) / rawTokens) * 100),
      toolsRemoved: totalReduction,
    };
  }, [selected]);

  const toggleGroup = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const activeTokens = compiled ? stats.compiledTokens : stats.rawTokens;
  const activeContext = compiled ? stats.compiledContextPercent : stats.rawContextPercent;
  const activeCost = compiled ? stats.compiledCost : stats.rawCost;
  const activeTools = compiled ? stats.compiledToolCount : stats.rawToolCount;

  return (
    <section id="comparison" className="py-24 px-6 bg-black/40 border-y border-white/5 scroll-mt-20 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            See the difference
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pick some MCP tool groups. Toggle the compiler. Watch the numbers drop.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Select tool groups
            </div>
            <div className="space-y-2">
              {visibleGroups.map((group) => {
                const isSelected = selected.has(group.id);
                const partners = getOverlapPartners(group.id);
                const hasOverlap = isSelected && partners.some((id) => selected.has(id));

                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full text-left rounded-xl p-3 border transition-all duration-200 flex items-start gap-3 group ${
                      isSelected
                        ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                    }`}
                  >
                    <span className="text-xl mt-0.5 shrink-0">{group.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${isSelected ? "text-white" : "text-gray-400"}`}>
                          {group.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {group.toolCount} tools
                        </span>
                        {hasOverlap && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">
                            overlaps
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? "bg-primary border-primary text-white"
                        : "border-white/20"
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {toolGroups.length > 6 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors mx-auto"
              >
                {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAll
                  ? "Show fewer"
                  : `Show ${toolGroups.length - 6} more`}
                {!showAll && hiddenSelectedCount > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
                    {hiddenSelectedCount} selected
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Context impact
              </div>
              <button
                onClick={() => setCompiled(!compiled)}
                className={`relative inline-flex h-9 items-center rounded-full px-1 transition-colors duration-300 w-[260px] border ${
                  compiled
                    ? "bg-primary/20 border-primary/40"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <motion.div
                  className="absolute h-7 rounded-full bg-white/10"
                  initial={false}
                  animate={{
                    x: compiled ? 128 : 2,
                    width: compiled ? 124 : 128,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <span className={`relative z-10 flex-1 text-center text-xs font-medium transition-colors ${!compiled ? "text-white" : "text-muted-foreground"}`}>
                  Without smallchat
                </span>
                <span className={`relative z-10 flex-1 text-center text-xs font-medium transition-colors ${compiled ? "text-white" : "text-muted-foreground"}`}>
                  With smallchat
                </span>
              </button>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Tools loaded</div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`tools-${compiled}-${activeTools}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className={`text-2xl font-bold font-mono ${compiled ? "text-primary" : "text-white"}`}
                    >
                      {activeTools}
                    </motion.div>
                  </AnimatePresence>
                  {compiled && stats.toolsRemoved > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-green-400 mt-0.5"
                    >
                      {stats.toolsRemoved} deduplicated
                    </motion.div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Tokens</div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`tokens-${compiled}-${activeTokens}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className={`text-2xl font-bold font-mono ${compiled ? "text-primary" : "text-white"}`}
                    >
                      {formatNumber(activeTokens)}
                    </motion.div>
                  </AnimatePresence>
                  {compiled && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-green-400 mt-0.5"
                    >
                      {stats.tokenSavings}% smaller
                    </motion.div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Cost / request</div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`cost-${compiled}-${activeCost}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className={`text-2xl font-bold font-mono ${compiled ? "text-primary" : "text-white"}`}
                    >
                      ${activeCost.toFixed(4)}
                    </motion.div>
                  </AnimatePresence>
                  {compiled && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-green-400 mt-0.5"
                    >
                      ${(stats.rawCost - stats.compiledCost).toFixed(4)} saved
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Context window usage (128k)</span>
                  <span className={`font-mono font-medium ${
                    activeContext > 50
                      ? activeContext > 80
                        ? "text-red-400"
                        : "text-yellow-400"
                      : compiled
                      ? "text-green-400"
                      : "text-white"
                  }`}>
                    {activeContext.toFixed(1)}%
                  </span>
                </div>
                <BarFill
                  percent={activeContext}
                  color={
                    activeContext > 80
                      ? "linear-gradient(90deg, #ef4444, #dc2626)"
                      : activeContext > 50
                      ? "linear-gradient(90deg, #eab308, #f59e0b)"
                      : compiled
                      ? "linear-gradient(90deg, hsl(210 100% 60%), hsl(270 100% 60%))"
                      : "linear-gradient(90deg, #6b7280, #9ca3af)"
                  }
                  animate={true}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/50 font-mono">
                  <span>0</span>
                  <span>32k</span>
                  <span>64k</span>
                  <span>96k</span>
                  <span>128k</span>
                </div>
              </div>

              {!compiled && activeContext > 30 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-start gap-2 text-xs text-yellow-400/80 bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">High context usage.</span>{" "}
                    Raw tool schemas consume {activeContext.toFixed(0)}% of your context window before a single user message.
                    That leaves less room for conversation history and reasoning.
                  </div>
                </motion.div>
              )}

              {compiled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3 pt-2 border-t border-white/5"
                >
                  <div className="text-xs font-medium text-muted-foreground">What the compiler did</div>
                  <div className="grid grid-cols-2 gap-3">
                    {stats.overlapReduction > 0 && (
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                        <div>
                          <span className="text-yellow-400 font-medium">{stats.overlapReduction} cross-provider overlaps</span>
                          <span className="text-muted-foreground"> merged (e.g., "search issues" in both Jira and GitHub)</span>
                        </div>
                      </div>
                    )}
                    {stats.semanticDedup > 0 && (
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                        <div>
                          <span className="text-purple-400 font-medium">{stats.semanticDedup} semantic duplicates</span>
                          <span className="text-muted-foreground"> removed via embedding similarity</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-blue-400 font-medium">Schema compression</span>
                        <span className="text-muted-foreground"> — verbose JSON schemas replaced with semantic vectors</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-green-400 font-medium">Dispatch table</span>
                        <span className="text-muted-foreground"> — pre-built lookup replaces runtime discovery</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-orange-400 font-medium">Auth-aware merging</span>
                        <span className="text-muted-foreground">
                          {" "}— tools with similar semantics are <em>not</em> blindly merged when they require different auth tokens.
                          Instead, the compiler generates an overloaded method signature with a provider parameter.
                        </span>
                      </div>
                    </div>
                    {selected.has("google") && selected.has("icloud") ? (
                      <div className="rounded-lg bg-black/40 border border-white/5 p-3 font-mono text-[11px] leading-relaxed text-gray-400">
                        <div className="text-muted-foreground text-[10px] font-sans mb-2 font-medium">Example: iCloud MCP + Google Drive MCP both expose <span className="text-orange-400">findFiles()</span></div>
                        <div><span className="text-purple-400">// Before — two identical-looking tools, different accounts</span></div>
                        <div><span className="text-blue-400">icloud</span>.findFiles(fileName: <span className="text-green-400">string</span>) {"->"} [<span className="text-green-400">URL</span>]?</div>
                        <div><span className="text-blue-400">gdrive</span>.findFiles(fileName: <span className="text-green-400">string</span>) {"->"} [<span className="text-green-400">URL</span>]?</div>
                        <div className="mt-2"><span className="text-purple-400">// After — compiler creates a unified overloaded signature</span></div>
                        <div><span className="text-orange-400">findFiles</span>(fileName: <span className="text-green-400">string</span>, withProvider: <span className="text-blue-400">CloudStorageProvider</span>?) {"->"} [<span className="text-green-400">URL</span>]?</div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground/60 italic">
                        Try selecting both iCloud and Google Drive to see an example of auth-aware method signature generation.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground/50">
                Estimates based on typical MCP schema sizes. Actual results vary by tool complexity and provider.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
