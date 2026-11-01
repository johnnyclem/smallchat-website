import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Fingerprint,
  Github,
  History,
  ListChecks,
  Menu,
  Plug,
  RefreshCw,
  Search,
  Shield,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { TerminalAnimation } from "@/components/TerminalAnimation";
import { HistoryTimeline } from "@/components/HistoryTimeline";
import { CompilerComparison } from "@/components/CompilerComparison";
import { SafetySpectrum } from "@/components/SafetySpectrum";
import { CaseStudy } from "@/components/CaseStudy";
import { MacAppShowcase, MAC_TABS, type MacChat } from "@/components/MacAppShowcase";
import {
  Cell,
  Cells,
  Container,
  Icon,
  Rich,
  Section,
  SectionHeader,
  TabBar,
  TextLink,
  enterGroup,
  enterItem,
  panelId,
  panelMotion,
  tabId,
} from "@/components/site";
import { cn } from "@/lib/utils";

type WhatTab = "compiler" | "features" | "pipeline" | "swift";
type WhyTab = "compare" | "safety" | "case-study";
type DeepDiveTab = "architecture" | "code" | "history";

const DOCS_BASE = "";
const GITHUB_URL = "https://github.com/johnnyclem/smallchat";
const SWIFT_URL = "https://github.com/johnnyclem/smallchat-swift";
const STENOGRAPHER_URL = "https://stenographer.smallchat.dev";

const FAMILY_LINKS = [
  { label: "stenographer", href: STENOGRAPHER_URL },
  { label: "polytician", href: "https://polytician.smallchat.dev" },
  { label: "short-hand", href: "https://short-hand.smallchat.dev" },
];

const NAV_LINKS = [
  { href: "#what", label: "What it does" },
  { href: "#why", label: "Why it matters" },
  { href: "#mac-app", label: "Mac app" },
  { href: "#deep-dive", label: "Deep dive" },
  { href: `${DOCS_BASE}/docs/intro`, label: "Docs" },
  { href: "#quickstart", label: "Get started" },
];

/** The brand mark is the favicon: a flat #FF3C00 square. */
function Logo({ className }: { className?: string }) {
  return (
    <a href="#top" className={cn("inline-flex items-center gap-2 py-2 text-base font-medium text-foreground", className)} aria-label="smallchat, back to top">
      <span aria-hidden className="h-5 w-5 rounded bg-accent" />
      smallchat
    </a>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background">
      <Container className="flex h-16 items-center justify-between">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center text-sm text-subtle lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="inline-flex h-10 items-center whitespace-nowrap px-4 transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="smallchat on GitHub"
            className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-subtle transition-colors hover:text-foreground"
          >
            <Icon as={Github} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-subtle transition-colors hover:text-foreground lg:hidden"
          >
            <Icon as={open ? X : Menu} />
          </button>
        </div>
      </Container>
      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t bg-background lg:hidden">
          <Container className="flex flex-col py-2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex h-12 items-center border-b text-base text-subtle last:border-b-0 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}

const INSTALL_COMMAND = "npm install @smallchat/core@^1";

/** The secondary hero action: the install command, copied on click. */
function CopyCommand() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(INSTALL_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      aria-label={`Copy install command: ${INSTALL_COMMAND}`}
      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "max-w-full font-mono text-[13px] font-normal")}
    >
      <span aria-hidden className="select-none text-muted-foreground">
        ❯
      </span>
      <span className="whitespace-nowrap">{INSTALL_COMMAND}</span>
      <Icon as={copied ? Check : Copy} className={copied ? "text-positive" : "text-muted-foreground"} />
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}

function Hero() {
  return (
    <section id="top" className="pt-16">
      <Container className="py-12 lg:py-16">
        <motion.div
          variants={enterGroup}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-12 lg:grid-cols-2 lg:gap-12 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:gap-16"
        >
          <div className="min-w-0 space-y-8">
            <motion.p variants={enterItem} className="text-balance font-mono text-xs text-muted-foreground">
              1.0 · Open source · TypeScript and Swift 6.1+ · MIT
            </motion.p>
            <motion.h1
              variants={enterItem}
              className="text-balance text-[40px] font-medium leading-[1.06] xl:text-[56px] xl:tracking-[-0.03em]"
            >
              Resolve the intent, then run exactly the tool you name
            </motion.h1>
            <motion.p variants={enterItem} className="max-w-xl text-pretty text-base leading-7 text-subtle">
              <Rich text="smallchat is semantic tool dispatch for LLM agents. `resolve()` proposes the tool for an intent and runs nothing. `dispatchById()` runs exactly the tool you name, after its arguments pass the tool's JSON Schema." />
            </motion.p>
            <motion.div variants={enterItem} className="flex flex-wrap items-center gap-3">
              <a href={`${DOCS_BASE}/docs/getting-started`} className={buttonVariants({ size: "lg" })}>
                Get started
              </a>
              <CopyCommand />
            </motion.div>
          </div>
          <motion.div variants={enterItem} className="min-w-0">
            <TerminalAnimation />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

/** A panel heading inside a tab: a title and one plain sentence. */
function PanelHeading({ title, lead }: { title: string; lead: ReactNode }) {
  return (
    <div className="max-w-3xl space-y-3">
      <h3 className="text-xl font-medium leading-tight md:text-[28px]">{title}</h3>
      <p className="text-pretty text-base leading-relaxed text-subtle">{lead}</p>
    </div>
  );
}

/* ───────────────────────── What it does ───────────────────────── */

function CompilerTab() {
  return (
    <div className="space-y-8">
      <PanelHeading
        title="A compiler for tool definitions"
        lead="Without one, every tool schema sits in the prompt and the model has to guess the exact tool name. With smallchat, the compiler turns tool definitions into one artifact, the model sends an intent, and the runtime holds the schemas."
      />
      <Cells className="md:grid-cols-[1fr_1.5fr_1fr]">
        <Cell title="Tools compile into one artifact">
          MCP servers, OpenAPI specs and JSON schemas compile into one content-hashed artifact
        </Cell>
        <Cell lead title="An intent resolves by meaning">
          <Rich text="`resolve()` proposes at most one tool, by meaning. When nothing matches cleanly, it asks instead of guessing." />
        </Cell>
        <Cell title="Output streams as it arrives">Async generators hand you chunks in real time</Cell>
      </Cells>
    </div>
  );
}

type Feature = { icon: LucideIcon; title: string; desc: string };

/** What smallchat promises, each with the place where it stops. */
const GUARANTEES: Feature[] = [
  { icon: Shield, title: "Resolve, then execute", desc: "`resolve()` proposes a tool and runs nothing. `dispatchById()` runs exactly the tool you name, by its `<providerId>/<toolName>` id." },
  { icon: Search, title: "Semantic dispatch", desc: "Resolves an intent to at most one tool, by meaning. When nothing matches cleanly, it asks instead of guessing." },
  { icon: ListChecks, title: "Checked arguments", desc: "Arguments are validated against each tool's JSON Schema before anything runs. A bad call returns `invalid-arguments`, one message per problem." },
  { icon: History, title: "Explain and replay", desc: "`smallchat explain` shows the candidates, tiers and policy verdicts. An opt-in, hash-chained decision log records each decision, and `smallchat replay` checks it against your artifact." },
  { icon: Fingerprint, title: "Pinned artifacts, call digests", desc: "Artifacts are content-hashed and pinned to the embedder that made their vectors. Every call gets a canonical call digest. smallchat-swift runs the same test vectors." },
];

/** How it connects to what you already run. */
const PLUMBING: Feature[] = [
  { icon: Zap, title: "Async streaming", desc: "Async generators hand you chunks in real time" },
  { icon: RefreshCw, title: "Cache that stays fresh", desc: "Keyed by the intent's full text. Registering, swizzling or feedback flushes it, so a change applies on the next dispatch. Cache hits never embed." },
  { icon: Code2, title: "TypeScript + Swift", desc: "@smallchat/core 1.0 on Node 22+. smallchat-swift 1.0 on Swift 6.1+ for macOS 14+ and Linux, libraries on iOS 17+." },
  { icon: Plug, title: "Any source, one MCP server", desc: "MCP servers, OpenAPI specs and JSON schemas compile into one artifact. `smallchat serve` forwards each call by exact name; `--provider` keeps upstream names, so OpenAPPA batteries apply unchanged." },
];

// The literal ledger markers from Stenographer's truth format. The warning glyph is drawn as a line icon.
const LEDGER_RULES: { marker: ReactNode; tone: string; text: string }[] = [
  { marker: "[TB]", tone: "text-positive", text: "Active tombstone, ground truth" },
  {
    marker: (
      <>
        [TB <AlertTriangle className="inline h-4 w-4 -translate-y-px" strokeWidth={1.5} role="img" aria-label="warning" /> CONTESTED]
      </>
    ),
    tone: "text-caution",
    text: "Ground truth with an asterisk: the open UV is shown beside it",
  },
  { marker: "[UV — UNVERIFIED]", tone: "text-subtle", text: "A heads-up, never a demand, and never reads as proven" },
  { marker: "agent TB, no quorum", tone: "text-negative", text: "Not truth: one agent alone settles nothing" },
  { marker: "overridden / struck / refuted", tone: "text-muted-foreground", text: "History, never cited as support" },
];

function FeaturesTab() {
  return (
    <div className="space-y-8">
      <PanelHeading
        title="Exact by construction, with the limits stated"
        lead="Each guarantee says where it stops: the same artifact, embedder and runtime state give the same choice and the same proof digest"
      />

      <div role="group" aria-labelledby="features-guarantees" className="space-y-3">
        <p id="features-guarantees" className="text-sm font-medium text-subtle">
          Guarantees
        </p>
        <Cells className="sm:grid-cols-2 lg:grid-cols-3">
          {GUARANTEES.map((f, i) => (
            <Cell key={f.title} icon={f.icon} title={f.title} lead={i === 0} className={i === 0 ? "sm:col-span-2" : undefined}>
              <Rich text={f.desc} />
            </Cell>
          ))}
        </Cells>
      </div>

      <div role="group" aria-labelledby="features-plumbing" className="space-y-3">
        <p id="features-plumbing" className="text-sm font-medium text-subtle">
          Plumbing
        </p>
        <dl className="divide-y overflow-hidden rounded-xl border bg-card">
          {PLUMBING.map((f) => (
            <div key={f.title} className="grid gap-1 px-6 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] md:gap-8">
              <dt className="flex items-center gap-3 text-sm font-medium text-foreground">
                <Icon as={f.icon} className="text-muted-foreground" />
                {f.title}
              </dt>
              <dd className="text-pretty text-sm leading-relaxed text-subtle">
                <Rich text={f.desc} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-8 rounded-xl border bg-deep p-6 md:grid-cols-2 md:p-8">
        <div className="space-y-4">
          <h4 className="text-xl font-medium">Memory that knows what it knows</h4>
          <p className="text-base leading-relaxed text-subtle">
            smallchat's compaction comes from @shorthand/core 1.0, which reads Stenographer's truth format v2: a hash-chained JSONL ledger where status is a
            fold over TRANSITION lines and anything unknown fails closed. Agents settle claims only together: a tombstone an agent signs counts as truth only
            with a quorum of two or more agent sessions agreeing from different angles within 15 minutes, while a person may still sign alone.
            smallchat-swift's SmallChatTruth reads the same format.
          </p>
          <TextLink href={STENOGRAPHER_URL} external>
            Stenographer
          </TextLink>
        </div>
        <dl className="grid content-start gap-x-4 gap-y-3 font-mono text-xs leading-5 sm:grid-cols-[max-content_1fr]">
          {LEDGER_RULES.map((rule, i) => (
            <div key={i} className="contents">
              <dt className={cn("whitespace-nowrap font-medium", rule.tone)}>{rule.marker}</dt>
              <dd className="border-b pb-3 font-sans text-sm text-muted-foreground sm:border-b-0 sm:pb-0">{rule.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

const PIPELINE = [
  { step: "Parse", desc: "Read tool definitions from any format: MCP, OpenAPI, or JSON" },
  { step: "Embed", desc: "Convert tool descriptions into semantic vectors, recording the embedder's fingerprint" },
  { step: "Link", desc: "Refuse near-duplicate tools, flag collisions, and build the dispatch tables" },
  { step: "Output", desc: "Write a format 1.0 artifact: every tool by its canonical id, content-hashed" },
];

function PipelineTab() {
  return (
    <div className="space-y-8">
      <PanelHeading
        title="Four steps from definition to dispatch"
        lead="The compiler turns raw tool definitions into one artifact, and the runtime loads it only with the embedder that produced it"
      />
      <ol className="divide-y overflow-hidden rounded-xl border bg-card">
        {PIPELINE.map((p, i) => (
          <li
            key={p.step}
            className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-4 gap-y-1 px-6 py-5 md:grid-cols-[24px_144px_minmax(0,1fr)] md:items-baseline md:gap-x-8"
          >
            <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
            <h4 className="text-base font-medium">{p.step}</h4>
            <p className="col-start-2 text-pretty text-sm leading-relaxed text-subtle md:col-start-3">{p.desc}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

const SWIFT_CELLS = [
  { title: "Resolve, then run", desc: "`resolve` proposes at most one tool and runs nothing. `dispatchById` runs exactly the named tool. Intent dispatch runs a match only when the dispatch policy allows it.", span: "sm:col-span-2 lg:col-span-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-x-8 lg:space-y-0" },
  { title: "Shared test vectors", desc: "`swift test` runs @smallchat/core's spec/ vectors: call digests, tool ids, ranking, resolve outcomes and artifacts", span: "lg:col-span-2" },
  { title: "Checked arguments", desc: "Every call is validated against the tool's JSON Schema first. A schema the validator can't evaluate makes the tool uncallable, not unchecked.", span: "lg:col-span-2" },
  { title: "An exact MCP server", desc: "`smallchat serve` speaks Streamable HTTP on /mcp, lists tools as `<provider>__<tool>`, and runs exactly the tool you call", span: "lg:col-span-2" },
  { title: "Truth format v2", desc: "`SmallChatTruth` reads Stenographer's hash-chained ledger, fails closed on anything unknown, and refuses a line whose agent quorum breaks the rules", span: "lg:col-span-3" },
  { title: "Swift 6 language mode", desc: "`ToolRuntime` is an actor. The compiler checks actor isolation and Sendable; shared state outside actors sits behind locks.", span: "sm:col-span-2 lg:col-span-3" },
];

function SwiftTab() {
  return (
    <div className="space-y-8">
      <PanelHeading
        title="Native Swift, the same dispatch rules"
        lead="smallchat-swift 1.0 follows @smallchat/core 1.0's dispatch rules and artifact format, and runs its conformance vectors. Swift 6.1+, on macOS 14+ and Linux, with the libraries on iOS 17+."
      />
      <Cells className="sm:grid-cols-2 lg:grid-cols-6">
        {SWIFT_CELLS.map((c, i) => (
          <Cell key={c.title} title={c.title} lead={i === 0} className={c.span}>
            <Rich text={c.desc} />
          </Cell>
        ))}
      </Cells>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <CodeBlock
          filename="Package.swift"
          code={
            <>
              <span className="token-comment">{"// Requires Swift 6.1+"}</span>
              {"\n"}
              <span className="token-property">dependencies</span>: [{"\n"}
              {"  "}.<span className="token-function">package</span>({"\n"}
              {"    "}url: <span className="token-string">"https://github.com/johnnyclem/smallchat-swift"</span>,{"\n"}
              {"    "}from: <span className="token-string">"1.0.0"</span>),{"\n"}
              ],{"\n"}
              <span className="token-property">targets</span>: [{"\n"}
              {"  "}.<span className="token-function">target</span>(name: <span className="token-string">"YourTarget"</span>, dependencies: [{"\n"}
              {"    "}.<span className="token-function">product</span>(name: <span className="token-string">"SmallChat"</span>,{"\n"}
              {"              "}package: <span className="token-string">"smallchat-swift"</span>),{"\n"}
              {"  "}]),{"\n"}]
            </>
          }
        />
        <CodeBlock
          filename="main.swift"
          code={
            <>
              <span className="token-keyword">import</span> <span className="token-type">SmallChat</span>
              {"\n\n"}
              <span className="token-comment">{"// Load a compiled toolkit (its embedder must match)"}</span>
              {"\n"}
              <span className="token-keyword">let</span> toolkit = <span className="token-keyword">try await</span> <span className="token-type">MCPToolkit</span>.
              <span className="token-function">load</span>({"\n"}
              {"  "}source: <span className="token-string">"tools.toolkit.json"</span>){"\n"}
              <span className="token-keyword">let</span> runtime = toolkit.runtime{"\n\n"}
              <span className="token-comment">{"// Resolve: which tool would run? Nothing executes."}</span>
              {"\n"}
              <span className="token-keyword">let</span> resolution = <span className="token-keyword">try await</span> runtime.<span className="token-function">resolve</span>(
              <span className="token-string">"find flights"</span>){"\n"}
              <span className="token-function">print</span>(resolution.outcome, resolution.chosen ?? <span className="token-string">"-"</span>,{"\n"}
              {"      "}resolution.tier){"\n\n"}
              <span className="token-comment">{"// Run exactly one tool by id; arguments are validated first"}</span>
              {"\n"}
              <span className="token-keyword">let</span> result = <span className="token-keyword">try await</span> runtime.<span className="token-function">dispatchById</span>({"\n"}
              {"  "}
              <span className="token-string">"flights/search_flights"</span>, args: [<span className="token-string">"to"</span>: <span className="token-string">"NYC"</span>])
            </>
          }
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-deep p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-relaxed text-subtle">
          Not in Swift 1.0: the decision log, replay and explain, the semantic map, observer feedback and argument coercion. The built-in embedder is a hash
          embedder for development and tests; for semantic matching, bring an Embedder backed by a model.
        </p>
        <TextLink href={SWIFT_URL} external className="shrink-0">
          smallchat-swift on GitHub
        </TextLink>
      </div>
    </div>
  );
}

/* ───────────────────────── Deep dive ───────────────────────── */

const CONCEPT_MAP = [
  ["Object", "ToolProvider", "A service that offers tools"],
  ["Class", "ToolClass", "A group of related tools"],
  ["Message send", "dispatch()", "Ask for something to happen"],
  ["Selector (SEL)", "ToolSelector", "The meaning of an intent"],
  ["Implementation", "ToolIMP", "The code that runs"],
  ["Method cache", "Resolution cache", "Remember past lookups"],
  ["Protocol", "ToolProtocol", "A capability contract"],
  ["Proxy", "ToolProxy", "Load details on demand"],
];

function ArchitectureTab() {
  return (
    <div className="space-y-12">
      <div className="grid items-start gap-8 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="space-y-6">
          <h3 className="text-xl font-medium leading-tight md:text-[28px]">Messages, not function calls</h3>
          <p className="text-pretty text-base leading-relaxed text-subtle">
            In the 1970s, Alan Kay invented a style of programming where objects communicate by sending messages to each other. The receiver decides what to
            do, not the sender.
          </p>
          <p className="text-pretty text-base leading-relaxed text-subtle">
            smallchat applies this same principle to AI. The model sends a message describing its intent, and the runtime proposes the one tool that handles
            it, or asks when nothing matches cleanly.
          </p>
        </div>

        <div className="min-w-0 overflow-x-auto rounded-xl border bg-card" tabIndex={0}>
          <table className="w-full min-w-[320px] border-collapse text-left">
            <caption className="border-b px-4 py-3 text-left text-sm font-medium text-subtle">Concept map</caption>
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-normal">
                  Classic OOP
                </th>
                <th scope="col" className="px-4 py-3 font-normal">
                  smallchat
                </th>
                <th scope="col" className="hidden px-4 py-3 font-normal md:table-cell">
                  What it is
                </th>
              </tr>
            </thead>
            <tbody>
              {CONCEPT_MAP.map(([classic, sc, hint]) => (
                <tr key={classic} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{classic}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-foreground">{sc}</td>
                  <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">{hint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <figure className="max-w-3xl space-y-4 rounded-xl border bg-card p-6 md:p-8">
        <blockquote>
          <p className="text-pretty text-xl leading-relaxed text-foreground">
            “I think one of the things that really separates us from the high primates is that we're tool builders. We can fashion tools that amplify these
            inherent abilities that we have to spectacular magnitudes. And so for me, a computer has always been a bicycle of the mind.”
          </p>
        </blockquote>
        <figcaption className="text-sm text-muted-foreground">Steve Jobs</figcaption>
      </figure>
    </div>
  );
}

const SCOBJECTS = [
  ["SCSelector", "Wraps an intent"],
  ["SCData", "Structured data (JSON)"],
  ["SCToolReference", "Pass tools as arguments"],
  ["SCArray", "Ordered collections"],
  ["SCDictionary", "Key-value pairs"],
];

function HoodTab() {
  return (
    <div className="space-y-8">
      <PanelHeading title="Under the hood" lead="The dispatch hot path: resolve proposes, the policy decides, and exactly one tool runs with checked arguments" />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <CodeBlock
          filename="src/core/types.ts · ToolSelector"
          code={
            <>
              <span className="token-keyword">export</span> <span className="token-keyword">interface</span> <span className="token-type">ToolSelector</span> {"{\n"}
              {"  "}
              <span className="token-comment">{"/** Embedding vector: the semantic fingerprint */"}</span>
              {"\n"}
              {"  "}
              <span className="token-property">vector</span>: <span className="token-type">Float32Array</span>;{"\n\n"}
              {"  "}
              <span className="token-comment">{"/** Human-readable canonical form */"}</span>
              {"\n"}
              {"  "}
              <span className="token-property">canonical</span>: <span className="token-type">string</span>;{"\n\n"}
              {"  "}
              <span className="token-property">parts</span>: <span className="token-type">string</span>[];{"\n"}
              {"  "}
              <span className="token-property">arity</span>: <span className="token-type">number</span>;{"\n"}
              {"}"}
            </>
          }
        />
        <CodeBlock
          filename="src/runtime/dispatch.ts · hot path (simplified)"
          code={
            <>
              <span className="token-keyword">async function</span> <span className="token-function">toolkit_dispatch</span>({"\n"}
              {"  "}context: <span className="token-type">DispatchContext</span>,{"\n"}
              {"  "}intent: <span className="token-type">string</span>,{"\n"}
              {"  "}args?: <span className="token-type">Record</span>&lt;<span className="token-type">string</span>, <span className="token-type">unknown</span>&gt;{"\n"}
              {")"}: <span className="token-type">Promise</span>&lt;<span className="token-type">ToolResult</span>&gt; {"{\n"}
              {"  "}
              <span className="token-comment">{"// 1. Resolve: embed, rank, tier, apply the policy"}</span>
              {"\n"}
              {"  "}
              <span className="token-keyword">const</span> {"{"} resolution, imp {"}"} = <span className="token-keyword">await</span>{"\n"}
              {"    "}
              <span className="token-function">resolveInternal</span>(context, intent, {"{"} args {"}"});{"\n\n"}
              {"  "}
              <span className="token-comment">{"// 2. Not exactly one tool? Nothing runs."}</span>
              {"\n"}
              {"  "}
              <span className="token-keyword">if</span> (resolution.outcome !== <span className="token-string">'resolved'</span>){"\n"}
              {"    "}
              <span className="token-keyword">return</span> <span className="token-function">notExecutedResult</span>(resolution);{"\n\n"}
              {"  "}
              <span className="token-comment">{"// 3. JSON Schema check + canonical call digest"}</span>
              {"\n"}
              {"  "}
              <span className="token-keyword">const</span> call = <span className="token-keyword">await</span> <span className="token-function">prepareCall</span>({"\n"}
              {"    "}context, imp, resolution.chosen, args);{"\n"}
              {"  "}
              <span className="token-keyword">if</span> (!call.ok) <span className="token-keyword">return</span> <span className="token-function">invalidArgumentsResult</span>(call);
              {"\n\n"}
              {"  "}
              <span className="token-comment">{"// 4. Log the decision, then run exactly that tool"}</span>
              {"\n"}
              {"  "}context.<span className="token-function">logDecision</span>(<span className="token-string">'dispatch'</span>, resolution.proof,{" "}
              <span className="token-string">'ran'</span>);{"\n"}
              {"  "}
              <span className="token-keyword">return</span> <span className="token-function">execute</span>(imp, call.args);{"\n"}
              {"}"}
            </>
          }
        />
      </div>

      <details className="group rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-base font-medium text-foreground sm:px-6 [&::-webkit-details-marker]:hidden">
          SCObject hierarchy
          <Icon as={ChevronDown} className="text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid items-start gap-8 border-t p-4 sm:p-6 md:grid-cols-2">
          <div className="space-y-4 rounded-xl border bg-deep p-6">
            <div className="font-mono text-sm text-foreground">SCObject</div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A base class for typed parameter passing, inspired by Objective-C's NSObject.
            </p>
            <ul className="list-none space-y-2 border-l p-0 pl-4">
              {SCOBJECTS.map(([name, hint]) => (
                <li key={name} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span className="font-mono text-[13px] text-foreground">{name}</span>
                  <span className="text-sm text-muted-foreground">{hint}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xl font-medium">Type-safe parameter passing</h4>
            <p className="text-base leading-relaxed text-subtle">
              <Rich text="SCObject enables runtime type checking (`isKindOfClass`, `isMemberOfClass`) and auto-wraps plain values into `SCData`, `SCArray` and the other types." />
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The compiler also reports semantically similar tools as overload groups. In 1.0 those groups are reported at compile time only: dispatch never
              merges distinct tools.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}

/* ───────────────────────── Get started ───────────────────────── */

type Step = { note: string; lines: { text: string; kind: "cmd" | "cont" | "out" | "code" }[] };

const TS_STEPS: Step[] = [
  { note: "Install (Node 22+)", lines: [{ kind: "cmd", text: "npm install @smallchat/core@^1" }] },
  {
    note: "Compile the tools in your MCP config",
    lines: [
      { kind: "cmd", text: "npx -y @smallchat/core@^1 compile --source ~/.mcp.json" },
      { kind: "out", text: "Output: tools.toolkit.json (format 1.0, content-hashed)" },
    ],
  },
  {
    note: "See which tool an intent resolves to (nothing runs)",
    lines: [
      { kind: "cmd", text: "npx -y @smallchat/core@^1 resolve \\" },
      { kind: "cont", text: '  tools.toolkit.json "search for code"' },
      { kind: "out", text: "Outcome: resolved (tier HIGH, decision ranked)" },
      { kind: "out", text: "Chosen: github/search_code" },
    ],
  },
  {
    note: "Pin the decisions that matter: exit 1 if one changes",
    lines: [
      { kind: "cmd", text: "npx -y @smallchat/core@^1 replay tools.toolkit.json traces/" },
      { kind: "out", text: '✓ "search for code" → resolved github/search_code (high)' },
    ],
  },
  {
    note: "Serve every tool through one MCP server\n(stdio; --http for Streamable HTTP)",
    lines: [
      { kind: "cmd", text: "npx -y @smallchat/core@^1 serve --source tools.toolkit.json" },
      { kind: "out", text: "smallchat MCP server on stdio" },
    ],
  },
];

const SWIFT_STEPS: Step[] = [
  {
    note: "Add to Package.swift",
    lines: [
      { kind: "code", text: ".package(" },
      { kind: "code", text: `  url: "${SWIFT_URL}",` },
      { kind: "code", text: '  from: "1.0.0")' },
    ],
  },
  { note: "Compile your tools", lines: [{ kind: "cmd", text: "swift run smallchat compile --source ~/.mcp.json" }] },
  {
    note: "Resolve, then run exactly one tool",
    lines: [
      { kind: "code", text: "let toolkit = try await MCPToolkit.load(" },
      { kind: "code", text: '  source: "tools.toolkit.json")' },
      { kind: "code", text: "let resolution = try await toolkit.runtime.resolve(" },
      { kind: "code", text: '  "find flights")' },
      { kind: "code", text: 'print(resolution.outcome, resolution.chosen ?? "-")' },
      { kind: "code", text: "let result = try await toolkit.runtime.dispatchById(" },
      { kind: "code", text: '  "flights/search_flights", args: ["to": "NYC"])' },
    ],
  },
];

/** Colours a shell or Swift line with the same few tokens the other listings use. */
function Highlight({ text }: { text: string }) {
  const parts = text.split(/("[^"]*"|'[^']*'|\b(?:let|try|await)\b)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^["']/.test(part)) return <span key={i} className="token-string">{part}</span>;
        if (/^(let|try|await)$/.test(part)) return <span key={i} className="token-keyword">{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function ShellBlock({ title, tag, steps }: { title: string; tag: string; steps: Step[] }) {
  return (
    <figure className="min-w-0 overflow-hidden rounded-xl border bg-deep">
      <figcaption className="flex h-10 items-center justify-between gap-4 border-b bg-card px-4 text-xs text-muted-foreground">
        <span className="shrink-0 font-mono">{title}</span>
        <span className="truncate font-mono">{tag}</span>
      </figcaption>
      <div className="overflow-x-auto p-5" tabIndex={0}>
        <div className="w-max min-w-full space-y-5 font-mono text-[13px] leading-6">
          {steps.map((s) => (
            <div key={s.note}>
              {s.note.split("\n").map((n) => (
                <div key={n} className="whitespace-pre token-comment">{`# ${n}`}</div>
              ))}
              {s.lines.map((l) => (
                <div key={l.text} className={cn("whitespace-pre", l.kind === "out" ? "text-subtle" : "text-foreground")}>
                  {l.kind === "cmd" && <span className="select-none text-muted-foreground">❯ </span>}
                  {l.kind === "cont" && <span className="select-none">{"  "}</span>}
                  {l.kind === "out" ? l.text : <Highlight text={l.text} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function Home() {
  const [whatTab, setWhatTab] = useState<WhatTab>("compiler");
  const [whyTab, setWhyTab] = useState<WhyTab>("compare");
  const [macChat, setMacChat] = useState<MacChat>("direct");
  const [deepTab, setDeepTab] = useState<DeepDiveTab>("architecture");

  return (
    <div className="w-full">
      <Nav />
      <main>
        <Hero />

        <Section id="what">
          <SectionHeader
            title="What it does"
            lead="A message-passing tool compiler for LLMs, inspired by Smalltalk, built in TypeScript and Swift"
            href={`${DOCS_BASE}/docs/what-it-does`}
            linkLabel="See the dispatch model"
          />
          <TabBar<WhatTab>
            prefix="what"
            label="What it does"
            active={whatTab}
            onChange={setWhatTab}
            tabs={[
              { id: "compiler", label: "The compiler" },
              { id: "features", label: "Features" },
              { id: "pipeline", label: "How it works" },
              { id: "swift", label: "Swift" },
            ]}
          />
          <AnimatePresence mode="wait">
            <motion.div key={whatTab} role="tabpanel" id={panelId("what")} aria-labelledby={tabId("what", whatTab)} {...panelMotion}>
              {whatTab === "compiler" && <CompilerTab />}
              {whatTab === "features" && <FeaturesTab />}
              {whatTab === "pipeline" && <PipelineTab />}
              {whatTab === "swift" && <SwiftTab />}
            </motion.div>
          </AnimatePresence>
        </Section>

        <Section id="why" tone="deep">
          <SectionHeader
            title="Why it matters"
            lead="How much context tool schemas use, where each approach to tool calling sits between rigid and dangerous, and how AgentVault put a smallchat-style layer in front of a canister"
            href={`${DOCS_BASE}/docs/why-it-matters`}
            linkLabel="Read the motivation"
          />
          <TabBar<WhyTab>
            prefix="why"
            label="Why it matters"
            active={whyTab}
            onChange={setWhyTab}
            tabs={[
              { id: "compare", label: "Compare" },
              { id: "safety", label: "Safety" },
              { id: "case-study", label: "AgentVault" },
            ]}
          />
          <AnimatePresence mode="wait">
            <motion.div key={whyTab} role="tabpanel" id={panelId("why")} aria-labelledby={tabId("why", whyTab)} {...panelMotion}>
              {whyTab === "compare" && <CompilerComparison />}
              {whyTab === "safety" && <SafetySpectrum />}
              {whyTab === "case-study" && <CaseStudy />}
            </motion.div>
          </AnimatePresence>
        </Section>

        <Section id="mac-app">
          <SectionHeader
            title="Your agents, in one chat app"
            lead="A native macOS messenger for your Claude Code sessions. Watch them work, talk to one or all, and approve what they want remembered."
          />
          <TabBar<MacChat> prefix="mac" label="Mac app views" tabs={MAC_TABS} active={macChat} onChange={setMacChat} />
          <div role="tabpanel" id={panelId("mac")} aria-labelledby={tabId("mac", macChat)}>
            <MacAppShowcase chat={macChat} onSelect={setMacChat} />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <code className="w-fit rounded-lg border bg-deep px-4 py-2 font-mono text-[13px] text-foreground">swift run SmallChatApp</code>
            <TextLink href={SWIFT_URL} external>
              macOS 14+ · smallchat-swift
            </TextLink>
          </div>
        </Section>

        <Section id="deep-dive" tone="deep">
          <SectionHeader
            title="Deep dive"
            lead="History, architecture, and the code that makes it work"
            href={`${DOCS_BASE}/docs/concepts`}
            linkLabel="Explore the internals"
          />
          <TabBar<DeepDiveTab>
            prefix="deep"
            label="Deep dive"
            active={deepTab}
            onChange={setDeepTab}
            tabs={[
              { id: "architecture", label: "Architecture" },
              { id: "code", label: "Under the hood" },
              { id: "history", label: "History" },
            ]}
          />
          <AnimatePresence mode="wait">
            <motion.div key={deepTab} role="tabpanel" id={panelId("deep")} aria-labelledby={tabId("deep", deepTab)} {...panelMotion}>
              {deepTab === "architecture" && <ArchitectureTab />}
              {deepTab === "code" && <HoodTab />}
              {deepTab === "history" && <HistoryTimeline />}
            </motion.div>
          </AnimatePresence>
        </Section>

        <Section id="quickstart">
          <SectionHeader
            title="Get started"
            lead="Install the package, compile your MCP config into an artifact, resolve an intent, pin the decisions that matter, and serve every tool through one MCP server"
            href={`${DOCS_BASE}/docs/getting-started`}
            linkLabel="Read the getting started guide"
          />
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <ShellBlock title="TypeScript" tag="Node 22+" steps={TS_STEPS} />
            <ShellBlock title="Swift 6.1+" tag="macOS 14+ · Linux · iOS 17+ libraries" steps={SWIFT_STEPS} />
          </div>
        </Section>
      </main>

      <footer className="border-t bg-deep">
        <Container className="space-y-10 py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <Logo className="text-xl" />
              <p className="max-w-md text-sm text-muted-foreground">Semantic tool dispatch for LLM agents, in TypeScript and Swift</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={`${DOCS_BASE}/docs/getting-started`} className={buttonVariants({ size: "lg" })}>
                Get started
              </a>
              <a href={`${DOCS_BASE}/docs/intro`} className={buttonVariants({ variant: "outline", size: "lg" })}>
                Read the docs
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t pt-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>Built by Johnny Clem · MIT License</p>
            <div className="flex items-center gap-6">
              <a href={GITHUB_URL} className="inline-flex h-9 items-center gap-2 transition-colors hover:text-foreground">
                <Icon as={Github} /> Source code
              </a>
              <span className="font-mono text-xs">v1.0.0</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="text-muted-foreground">The smallchat suite</span>
            {FAMILY_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center text-subtle transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </Container>
      </footer>
    </div>
  );
}
