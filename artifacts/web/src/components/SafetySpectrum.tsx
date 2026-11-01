import { useRef, useState, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldX, Lock, Unlock } from "lucide-react";
import { EASE, Icon, StatusDot } from "@/components/site";
import { cn } from "@/lib/utils";

type Approach = "mcp" | "smallchat" | "open-agent";
type Kind = "comment" | "plain" | "name" | "string" | "danger" | "keyword" | "blank";

interface ApproachData {
  id: Approach;
  label: string;
  tagline: string;
  icon: typeof ShieldCheck;
  position: "Too rigid" | "Just right" | "Too dangerous";
  traits: { label: string; value: string; good: boolean }[];
  codeTitle: string;
  codeLines: { text: string; kind: Kind }[];
  risks: string[];
  benefits: string[];
  callout: { title: string; body: string; icon: typeof ShieldCheck };
}

const approaches: ApproachData[] = [
  {
    id: "mcp",
    label: "MCP + Structured Output",
    tagline: "Every tool ships its full JSON schema",
    icon: Lock,
    position: "Too rigid",
    traits: [
      { label: "Context cost", value: "Extremely high", good: false },
      { label: "Type safety", value: "Schema-level only", good: false },
      { label: "Flexibility", value: "None: exact match required", good: false },
      { label: "Security", value: "Sandboxed per-tool", good: true },
    ],
    codeTitle: "Typical MCP tool registration",
    codeLines: [
      { text: "// 47 tools × ~320 tokens each = 15,040 tokens", kind: "comment" },
      { text: "// just for tool schemas, before any conversation", kind: "comment" },
      { text: "{", kind: "plain" },
      { text: '  "name": "jira_search_issues",', kind: "name" },
      { text: '  "description": "Search for Jira issues...",', kind: "plain" },
      { text: '  "parameters": {', kind: "plain" },
      { text: '    "type": "object",', kind: "plain" },
      { text: '    "properties": {', kind: "plain" },
      { text: '      "jql": { "type": "string", ... },', kind: "plain" },
      { text: '      "maxResults": { "type": "integer", ... },', kind: "plain" },
      { text: '      "fields": { "type": "array", ... }', kind: "plain" },
      { text: "    },", kind: "plain" },
      { text: '    "required": ["jql"]', kind: "plain" },
      { text: "  }", kind: "plain" },
      { text: "}", kind: "plain" },
      { text: "// ... repeat 46 more times", kind: "comment" },
    ],
    risks: [
      "Context window fills up before conversation starts",
      "No semantic understanding: the model must guess exact tool names",
      "Adding providers multiplies token cost linearly",
      "Duplicate tools across providers waste tokens",
    ],
    benefits: ["Tools are sandboxed, so the blast radius is limited"],
    callout: {
      title: "Safe, with a context cost",
      body: "MCP's structured output approach is sandboxed and predictable, but it pays for safety with rigidity. Every tool puts its full JSON schema into the context window, using tokens before the conversation even starts. Adding more providers means linearly more cost, and nothing helps the model choose between overlapping tools.",
      icon: Lock,
    },
  },
  {
    id: "smallchat",
    label: "smallchat",
    tagline: "Schema-checked, semantically resolved, exact by id",
    icon: ShieldCheck,
    position: "Just right",
    traits: [
      { label: "Context cost", value: "Minimal with intent dispatch", good: true },
      { label: "Type safety", value: "JSON Schema, checked before a tool runs", good: true },
      { label: "Flexibility", value: "Semantic dispatch", good: true },
      { label: "Security", value: "Only your tools, one policy", good: true },
    ],
    codeTitle: "smallchat compiled output",
    codeLines: [
      { text: "// The compiler turns every registered tool", kind: "comment" },
      { text: "// into one content-hashed artifact", kind: "comment" },
      { text: "", kind: "blank" },
      { text: "import { loadRuntime } from '@smallchat/core';", kind: "keyword" },
      { text: "", kind: "blank" },
      { text: "const { runtime } = await loadRuntime('./tools.toolkit.json');", kind: "plain" },
      { text: "", kind: "blank" },
      { text: "// Semantic resolution: proposes one tool, runs nothing", kind: "comment" },
      { text: "const r = await runtime.resolve(", kind: "plain" },
      { text: '  "find my recent cloud files about quarterly reports"', kind: "string" },
      { text: ");", kind: "plain" },
      { text: "", kind: "blank" },
      { text: "// Run exactly that tool; args are schema-checked first", kind: "comment" },
      { text: "if (r.outcome === 'resolved')", kind: "plain" },
      { text: "  await runtime.dispatchById(r.chosen!, { query: 'quarterly' });", kind: "plain" },
      { text: "// else needs-disambiguation: the caller picks a tool id", kind: "comment" },
    ],
    risks: [],
    benefits: [
      "Arguments are validated against each tool's JSON Schema before anything runs",
      "With intent dispatch, the model sends an intent and the schemas stay with the runtime",
      "By default, below HIGH confidence a tool runs only with an LLM verifier's approval",
      "Tools annotated destructive run only by exact id, a pinned phrase or EXACT similarity",
      "Every decision carries a replayable proof and a canonical call digest",
    ],
    callout: {
      title: "The compiler is your security boundary",
      body: "smallchat can only run the tools you compile or register, and MCP calls name them exactly. It adds no shell or filesystem access; its only tool of its own is the read-only smallchat_resolve (off with --no-resolve-tool). A tool you did not compile or register does not exist at runtime. Each tool still has whatever access its own server gives it.",
      icon: ShieldCheck,
    },
  },
  {
    id: "open-agent",
    label: "Open agents",
    tagline: "Full autonomy and full access to the host",
    icon: Unlock,
    position: "Too dangerous",
    traits: [
      { label: "Context cost", value: "Low: tools load on demand", good: true },
      { label: "Type safety", value: "None", good: false },
      { label: "Flexibility", value: "Unlimited, including shell access", good: false },
      { label: "Security", value: "Full access to the host machine", good: false },
    ],
    codeTitle: "Typical open agent setup",
    codeLines: [
      { text: "// The agent has full access to everything", kind: "comment" },
      { text: "// including your filesystem, network, and secrets", kind: "comment" },
      { text: "", kind: "blank" },
      { text: "const agent = new OpenAgent({", kind: "plain" },
      { text: '  model: "gpt-4",', kind: "plain" },
      { text: "  tools: ['*'],", kind: "danger" },
      { text: "  permissions: {", kind: "plain" },
      { text: "    filesystem: true,", kind: "danger" },
      { text: "    network: true,", kind: "danger" },
      { text: "    shell: true,", kind: "danger" },
      { text: "    env_vars: true,", kind: "danger" },
      { text: "  }", kind: "plain" },
      { text: "});", kind: "plain" },
      { text: "", kind: "blank" },
      { text: '// "Hey agent, clean up my project files"', kind: "comment" },
      { text: "// the agent runs rm -rf /", kind: "comment" },
    ],
    risks: [
      "Full access to the host machine",
      "Can read environment variables, API keys, secrets",
      "Unrestricted shell execution: one hallucinated command can delete files",
      "No compile-time checks: errors surface at runtime, or never",
      "Network access enables data exfiltration",
    ],
    benefits: ["Low context overhead, because tools load on demand"],
    callout: {
      title: "Full access means total access",
      body: "An open agent set up this way has full access to your host machine. One hallucinated shell command can delete files, exfiltrate secrets, or modify system state. There is no compile step, no type checking, and no boundary between what the model can do and everything.",
      icon: ShieldX,
    },
  },
];

const KIND_CLASS: Record<Kind, string> = {
  comment: "token-comment",
  plain: "text-subtle",
  name: "token-function",
  string: "token-string",
  keyword: "token-keyword",
  danger: "text-negative",
  blank: "",
};

function Spectrum({ active, onSelect }: { active: Approach; onSelect: (a: Approach) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  // A radio group is one tab stop. Arrow keys, Home and End move the choice and the focus together.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = approaches.length - 1;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next < 0) return;
    e.preventDefault();
    onSelect(approaches[next].id);
    refs.current[approaches[next].id]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Approach to tool calling" className="relative grid grid-cols-[3fr_4fr_3fr]">
      <div aria-hidden className="absolute left-0 right-0 top-1.5 h-px bg-border-strong" />
      {approaches.map((a, i) => {
        const isActive = active === a.id;
        return (
          <button
            key={a.id}
            ref={(el) => {
              refs.current[a.id] = el;
            }}
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(a.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative flex cursor-pointer flex-col gap-1 text-left transition-colors",
              a.id === "mcp" && "items-start",
              a.id === "smallchat" && "items-center text-center",
              a.id === "open-agent" && "items-end text-right",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "mb-3 h-3 w-3 rounded-full border transition-colors",
                isActive ? "border-accent bg-accent" : "border-border-strong bg-card",
              )}
            />
            <span className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>{a.position}</span>
            <span className={cn("text-xs sm:text-sm", isActive ? "text-subtle" : "text-muted-foreground")}>{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SafetySpectrum() {
  const [active, setActive] = useState<Approach>("smallchat");
  const current = approaches.find((a) => a.id === active)!;

  return (
    <div className="space-y-10">
      <Spectrum active={active} onSelect={setActive} />

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="grid gap-6 xl:grid-cols-2"
        >
          <div className="min-w-0 space-y-6">
            <div className="space-y-4 rounded-xl border bg-card p-6">
              <div className="flex items-start gap-3">
                <Icon as={current.icon} className="mt-1.5 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="text-xl font-medium">{current.label}</h3>
                  <p className="text-sm text-subtle">{current.tagline}</p>
                </div>
              </div>
              <dl className="divide-y">
                {current.traits.map((trait) => (
                  <div key={trait.label} className="flex items-start justify-between gap-6 py-3 text-sm first:pt-0 last:pb-0">
                    <dt className="text-muted-foreground">{trait.label}</dt>
                    <dd className="flex items-center gap-2 text-right text-foreground">
                      <StatusDot className={trait.good ? "bg-positive" : "bg-negative"} />
                      {trait.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {current.risks.length > 0 && (
              <div className="space-y-3 rounded-xl border bg-card p-6">
                <h4 className="text-sm font-medium text-foreground">Risks</h4>
                <ul className="list-none space-y-2 p-0">
                  {current.risks.map((risk) => (
                    <li key={risk} className="flex gap-3 text-sm leading-relaxed text-subtle">
                      <StatusDot className="mt-2 bg-negative" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {current.benefits.length > 0 && (
              <div className="space-y-3 rounded-xl border bg-card p-6">
                <h4 className="text-sm font-medium text-foreground">Benefits</h4>
                <ul className="list-none space-y-2 p-0">
                  {current.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-3 text-sm leading-relaxed text-subtle">
                      <StatusDot className="mt-2 bg-positive" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-6">
            <figure className="overflow-hidden rounded-xl border bg-deep">
              <figcaption className="flex h-10 items-center border-b bg-card px-4 font-mono text-xs text-muted-foreground">
                {current.codeTitle}
              </figcaption>
              <div className="overflow-x-auto p-4" tabIndex={0}>
                <pre className="font-mono text-[13px] leading-6">
                  <code>
                    {current.codeLines.map((line, i) => (
                      <span key={i} className={cn("block whitespace-pre", KIND_CLASS[line.kind])}>
                        {line.text || " "}
                      </span>
                    ))}
                  </code>
                </pre>
              </div>
            </figure>

            <div className="flex items-start gap-3 rounded-xl border bg-card p-6">
              <Icon as={current.callout.icon} className="mt-0.5 text-muted-foreground" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">{current.callout.title}</h4>
                <p className="text-sm leading-relaxed text-subtle">{current.callout.body}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
