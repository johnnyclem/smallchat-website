import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { EASE, Icon, Rich, StatusDot } from "@/components/site";
import { cn } from "@/lib/utils";

interface ToolGroup {
  id: string;
  name: string;
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
  { id: "atlassian", name: "Atlassian", toolCount: 47, avgSchemaTokens: 320, description: "Jira issues, Confluence pages, Bitbucket repos, project management" },
  { id: "github", name: "GitHub", toolCount: 34, avgSchemaTokens: 280, description: "Repos, issues, PRs, actions, code search, gists" },
  { id: "slack", name: "Slack", toolCount: 22, avgSchemaTokens: 240, description: "Messages, channels, reactions, threads, user lookup" },
  { id: "google", name: "Google Drive", toolCount: 32, avgSchemaTokens: 310, description: "Drive files, Sheets, Docs, shared drives, permissions" },
  { id: "icloud", name: "iCloud", toolCount: 24, avgSchemaTokens: 270, description: "iCloud Drive files, photos, notes, reminders, sharing" },
  { id: "notion", name: "Notion", toolCount: 28, avgSchemaTokens: 290, description: "Pages, databases, blocks, search, comments" },
  { id: "linear", name: "Linear", toolCount: 19, avgSchemaTokens: 260, description: "Issues, projects, cycles, teams, labels" },
  { id: "discord", name: "Discord", toolCount: 26, avgSchemaTokens: 250, description: "Messages, channels, roles, reactions, voice" },
  { id: "stripe", name: "Stripe", toolCount: 42, avgSchemaTokens: 380, description: "Payments, subscriptions, customers, invoices, products" },
  { id: "aws", name: "AWS", toolCount: 85, avgSchemaTokens: 420, description: "S3, Lambda, DynamoDB, EC2, CloudWatch, IAM" },
  { id: "vercel", name: "Vercel", toolCount: 18, avgSchemaTokens: 230, description: "Deployments, domains, env vars, logs, projects" },
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

function getOverlapPartners(id: string): string[] {
  const partners: string[] = [];
  for (const pair of overlapPairs) {
    if (pair.a === id) partners.push(pair.b);
    else if (pair.b === id) partners.push(pair.a);
  }
  return partners;
}

// The illustrative model behind the numbers. The footnote prints these assumptions.
const CONTEXT_WINDOW = 128_000;
const COST_PER_1K_INPUT = 0.003;
const BASELINE_TOKENS = 800;
const COMPILED_TOKENS_PER_TOOL = 180 * 0.35;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

function percentTone(p: number) {
  if (p > 80) return "text-negative";
  if (p > 50) return "text-caution";
  return "text-foreground";
}

const AXIS = [0, 32, 64, 96, 128];

/**
 * One bar of the context chart. The fill scales on the x axis, nothing animates its width.
 * Quarter marks cut the bar like a ruler, so the share reads against the 128k window.
 */
function ContextBar({ label, percent, active, lit }: { label: string; percent: number; active: boolean; lit: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className={cn("text-sm", active ? "text-foreground" : "text-subtle")}>{label}</span>
        <span className={cn("font-mono text-[28px] leading-9 tabular-nums", active ? percentTone(percent) : "text-subtle")}>{percent.toFixed(1)}%</span>
      </div>
      <div className="relative h-8 overflow-hidden rounded-sm bg-raised" role="presentation">
        <div
          className={cn(
            "h-full w-full origin-left transition-[transform,opacity] duration-300",
            active ? "opacity-100" : "opacity-50",
            percent > 100 ? "bg-negative" : lit ? "bg-accent" : "bg-subtle",
          )}
          style={{ transform: `scaleX(${Math.min(percent, 100) / 100})` }}
        />
        {[25, 50, 75].map((at) => (
          <span key={at} aria-hidden className="absolute inset-y-0 w-px bg-deep/60" style={{ left: `${at}%` }} />
        ))}
      </div>
    </div>
  );
}

function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-xl font-medium tabular-nums text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{note}</div>
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
    const rawTokens = selectedGroups.reduce((sum, g) => sum + g.toolCount * g.avgSchemaTokens, 0) + BASELINE_TOKENS;

    // Cross-provider overlaps are flagged as collisions. 1.0 never merges
    // distinct tools: each keeps its own <providerId>/<toolName> id.
    let overlapCount = 0;
    for (const pair of overlapPairs) {
      if (selectedIds.has(pair.a) && selectedIds.has(pair.b)) overlapCount += pair.count;
    }

    const compiledTokens = Math.round(rawToolCount * COMPILED_TOKENS_PER_TOOL) + BASELINE_TOKENS;

    return {
      rawToolCount,
      rawTokens,
      rawContextPercent: (rawTokens / CONTEXT_WINDOW) * 100,
      rawCost: (rawTokens / 1000) * COST_PER_1K_INPUT,
      compiledTokens,
      compiledContextPercent: (compiledTokens / CONTEXT_WINDOW) * 100,
      compiledCost: (compiledTokens / 1000) * COST_PER_1K_INPUT,
      overlapCount,
      tokenSavings: Math.round(((rawTokens - compiledTokens) / rawTokens) * 100),
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

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
      <div className="min-w-0">
        <div className="space-y-4 lg:sticky lg:top-24">
        <h3 className="flex h-10 items-center text-sm font-medium text-subtle">Select tool groups</h3>
        <ul className="list-none divide-y overflow-hidden rounded-xl border bg-card p-0">
          {visibleGroups.map((group) => {
            const isSelected = selected.has(group.id);
            const hasOverlap = isSelected && getOverlapPartners(group.id).some((id) => selected.has(id));
            return (
              <li key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "grid w-full cursor-pointer grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3 text-left transition-colors",
                    isSelected ? "bg-raised" : "hover:bg-raised/50",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border",
                      isSelected ? "border-foreground bg-foreground text-background" : "border-border-strong",
                    )}
                  >
                    {isSelected && <Icon as={Check} />}
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="flex items-center gap-3">
                      <span className={cn("text-sm font-medium", isSelected ? "text-foreground" : "text-subtle")}>{group.name}</span>
                      {hasOverlap && (
                        <span className="flex items-center gap-1 font-mono text-xs text-caution">
                          <StatusDot className="bg-caution" /> overlaps
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">{group.description}</span>
                  </span>
                  <span className="pt-0.5 font-mono text-xs tabular-nums text-muted-foreground">{group.toolCount} tools</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          onClick={() => setShowAll(!showAll)}
          aria-expanded={showAll}
          className="inline-flex h-10 cursor-pointer items-center gap-2 text-sm text-subtle transition-colors hover:text-foreground"
        >
          <Icon as={showAll ? ChevronUp : ChevronDown} />
          {showAll ? "Show fewer" : `Show ${toolGroups.length - 6} more`}
          {!showAll && hiddenSelectedCount > 0 && (
            <span className="ml-1 border-l pl-3 text-xs text-muted-foreground">{hiddenSelectedCount} selected</span>
          )}
        </button>
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-medium text-subtle">Context impact</h3>
          <div role="group" aria-label="Compare with and without smallchat" className="flex h-10 w-full overflow-hidden rounded-lg border bg-deep sm:w-auto">
            {[
              { v: false, label: "Without smallchat" },
              { v: true, label: "With smallchat" },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => setCompiled(opt.v)}
                aria-pressed={compiled === opt.v}
                className={cn(
                  "h-full flex-1 cursor-pointer px-4 text-sm font-medium transition-colors sm:flex-none",
                  compiled === opt.v ? "bg-raised text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 rounded-xl border bg-card p-6">
          <div className="space-y-5">
            <div className="text-xs text-muted-foreground">Context window usage, 128k tokens</div>
            <ContextBar label="Without smallchat" percent={stats.rawContextPercent} active={!compiled} lit={false} />
            <ContextBar label="With smallchat" percent={stats.compiledContextPercent} active={compiled} lit />
            <div className="relative h-4 font-mono text-xs text-muted-foreground" aria-hidden>
              {AXIS.map((k, i) => (
                <span
                  key={k}
                  className={cn("absolute top-0", i === 0 ? "" : i === AXIS.length - 1 ? "-translate-x-full" : "-translate-x-1/2")}
                  style={{ left: `${(i / (AXIS.length - 1)) * 100}%` }}
                >
                  {k === 0 ? "0" : `${k}k`}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-6">
            <Figure label="Tools loaded" value={String(stats.rawToolCount)} note={compiled ? "none merged" : "baseline"} />
            <Figure
              label="Tokens"
              value={formatNumber(activeTokens)}
              note={compiled ? `${stats.tokenSavings}% fewer vs without` : "baseline"}
            />
            <Figure
              label="Cost per request"
              value={`$${activeCost.toFixed(4)}`}
              note={compiled ? `$${(stats.rawCost - stats.compiledCost).toFixed(4)} less` : "baseline"}
            />
          </div>

          {!compiled && activeContext > 30 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="flex items-start gap-3 rounded-lg border bg-deep p-4 text-sm leading-relaxed text-subtle"
            >
              <StatusDot className="mt-2 bg-caution" />
              <span>
                <span className="font-medium text-foreground">High context usage. </span>
                Raw tool schemas use {activeContext.toFixed(0)}% of the context window before the first user message. That leaves less room for
                conversation history and reasoning.
              </span>
            </motion.p>
          )}

          {compiled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="space-y-4 border-t pt-6"
            >
              <h4 className="text-sm font-medium text-foreground">What the compiler did</h4>
              <ul className="list-none space-y-3 p-0 text-sm leading-relaxed">
                {stats.overlapCount > 0 && (
                  <li className="flex gap-3">
                    <StatusDot className="mt-2 bg-caution" />
                    <span>
                      <span className="font-medium text-foreground">{stats.overlapCount} cross-provider overlaps</span>
                      <span className="text-subtle"> flagged (for example "search issues" in both Jira and GitHub). Both tools are kept.</span>
                    </span>
                  </li>
                )}
                <li className="flex gap-3">
                  <StatusDot className="mt-2 bg-muted-foreground" />
                  <span>
                    <span className="font-medium text-foreground">Near-duplicates refused</span>
                    <span className="text-subtle"> at 0.95 cosine or above is a compile error, unless you pass <Rich text="`--allow-duplicates`" />.</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <StatusDot className="mt-2 bg-muted-foreground" />
                  <span>
                    <span className="font-medium text-foreground">Schemas out of the context window</span>
                    <span className="text-subtle">
                      {" "}
                      with intent dispatch. The model sends an intent and the runtime holds the schemas (<Rich text="`smallchat serve`" /> lists every tool with its schema).
                    </span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <StatusDot className="mt-2 bg-muted-foreground" />
                  <span>
                    <span className="font-medium text-foreground">Dispatch table</span>
                    <span className="text-subtle"> is a pre-built lookup that replaces runtime discovery.</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <StatusDot className="mt-2 bg-muted-foreground" />
                  <span>
                    <span className="font-medium text-foreground">Provider-qualified ids</span>
                    <span className="text-subtle">
                      {" "}
                      keep tools with similar semantics apart, even across providers. Each keeps its canonical id,{" "}
                      <code className="font-mono text-foreground">&lt;providerId&gt;/&lt;toolName&gt;</code>, and a caller can always run one exactly.
                    </span>
                  </span>
                </li>
              </ul>
              {selected.has("google") && selected.has("icloud") ? (
                <div className="space-y-2 overflow-x-auto rounded-lg border bg-deep p-4 font-mono text-[13px] leading-6 text-subtle" tabIndex={0}>
                  <div className="font-sans text-xs text-muted-foreground">
                    Example: iCloud MCP and Google Drive MCP both expose <span className="font-mono text-foreground">findFiles()</span>
                  </div>
                  <div className="token-comment">// Two providers, one tool name: both stay</div>
                  <div>
                    <span className="token-function">icloud</span>/findFiles(fileName: <span className="token-type">string</span>)
                  </div>
                  <div>
                    <span className="token-function">gdrive</span>/findFiles(fileName: <span className="token-type">string</span>)
                  </div>
                  <div className="token-comment pt-2">// The caller can always name one exactly</div>
                  <div className="whitespace-nowrap">
                    runtime.<span className="token-function">dispatchById</span>(<span className="token-string">"gdrive/findFiles"</span>, {"{ fileName }"})
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Select both iCloud and Google Drive to see two providers with the same tool name stay apart
                </p>
              )}
            </motion.div>
          )}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Illustrative model, not a benchmark. Without smallchat sends every schema at typical MCP sizes plus {BASELINE_TOKENS} tokens of base prompt. With
          smallchat assumes a compact header of about {Math.round(COMPILED_TOKENS_PER_TOOL)} tokens per tool. Input is priced at $3 per million tokens.
          Actual results vary by tool complexity and provider.
        </p>
      </div>
    </div>
  );
}
