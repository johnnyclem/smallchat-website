import { motion } from "framer-motion";
import {
  ArrowRight,
  BookMarked,
  Check,
  Copy,
  Ear,
  FileSearch,
  Gavel,
  GitBranch,
  Github,
  HardDrive,
  Network,
  PenLine,
  Radio,
  Scale,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { useState } from "react";
import { Transcript } from "@/components/Transcript";

const GITHUB_URL = "https://github.com/johnnyclem/stenographer";
const SMALLCHAT_URL = "https://www.smallchat.dev";
const VERSION = "0.1.0-alpha.2";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: "easeOut" },
} as const;

function Section({ id, eyebrow, title, lede, children }: {
  id?: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 px-4 sm:px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div {...reveal} className="max-w-3xl mb-12">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-gold mb-4">{eyebrow}</p>
          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] text-paper">{title}</h2>
          {lede && <p className="mt-5 text-dim text-lg leading-relaxed">{lede}</p>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function CopyBlock({ lines }: { lines: string[] }) {
  const [copied, setCopied] = useState(false);
  const text = lines.filter((l) => !l.startsWith("#")).join("\n");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; the text is still selectable */
    }
  };
  return (
    <div className="panel relative group">
      <button
        onClick={copy}
        aria-label="Copy commands"
        className="absolute top-3 right-3 p-2 rounded-lg text-dim hover:text-paper hover:bg-white/5 transition cursor-pointer"
      >
        {copied ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />}
      </button>
      <pre className="overflow-x-auto p-5 pr-12 font-mono text-[13px] leading-7">
        {lines.map((l, i) => (
          <div key={i} className={l.startsWith("#") ? "text-dim" : "text-paper"}>
            {l.startsWith("#") ? l : <><span className="text-gold select-none">$ </span>{l}</>}
          </div>
        ))}
      </pre>
    </div>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-line/60 bg-ink/75 backdrop-blur-xl">
      <nav className="mx-auto max-w-6xl flex items-center gap-6 px-4 sm:px-6 h-16">
        <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <img src="/favicon.svg" alt="" className="size-7" />
          Stenographer
        </a>
        <div className="hidden md:flex items-center gap-6 text-sm text-dim">
          <a href="#how" className="hover:text-paper transition">How it works</a>
          <a href="#ledger" className="hover:text-paper transition">Truth ledger</a>
          <a href="#objections" className="hover:text-paper transition">Objections</a>
          <a href="#install" className="hover:text-paper transition">Install</a>
        </div>
        <a
          href={GITHUB_URL}
          className="ml-auto flex items-center gap-2 text-sm rounded-lg border border-line px-3 py-1.5 hover:border-gold/60 hover:text-gold transition"
        >
          <Github className="size-4" /> GitHub
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative pt-32 sm:pt-40 pb-20 px-4 sm:px-6 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #e8b04b, transparent)" }}
      />
      <div className="relative mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="min-w-0">
          <a
            href={SMALLCHAT_URL}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-3 py-1 text-xs text-dim hover:text-paper transition"
          >
            <span className="font-mono text-gold">v{VERSION}</span>
            <span className="h-3 w-px bg-line" />
            Part of the smallchat agent stack <ArrowRight className="size-3" />
          </a>
          <h1 className="mt-6 font-serif text-5xl sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight">
            The court reporter
            <br />
            <span className="italic text-gold">for your agents.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-dim leading-relaxed max-w-xl">
            Stenographer is a passive MCP server. It sits in on every agent conversation, indexes who
            decided what and when they changed their mind, and{" "}
            <span className="text-paper">objects when an agent repeats a value you've already declared dead.</span>
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#install"
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 font-semibold text-ink hover:brightness-110 transition"
            >
              Get started <ArrowRight className="size-4" />
            </a>
            <a
              href={GITHUB_URL}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 font-medium hover:border-paper/40 transition"
            >
              <Github className="size-4" /> Read the source
            </a>
          </div>
          <p className="mt-6 font-mono text-xs text-dim">MIT · Node ≥ 20 · SQLite on disk · no API keys</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="min-w-0">
          <Transcript />
        </motion.div>
      </div>
    </section>
  );
}

function Problem() {
  const items = [
    ["“Actually, let's use SQLite.”", "The correction arrives on turn 40. By turn 400 it has been compacted away, and Postgres is back."],
    ["Three agents, one repo.", "One learned the rate limiter was replaced. The other two never heard about it."],
    ["Confident and unchecked.", "An agent says “the API is idempotent” with nothing to back it up, and it quietly becomes load-bearing."],
  ];
  return (
    <Section
      eyebrow="The problem"
      title={<>Agents don't forget facts.<br /><span className="italic text-dim">They forget which facts died.</span></>}
      lede="Long-running and multi-agent work fails in a particular way: a decision is made, reversed, then silently re-made from stale context. Nobody in the room is keeping the record."
    >
      <div className="grid md:grid-cols-3 gap-4">
        {items.map(([h, b], i) => (
          <motion.div key={h} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }} className="panel p-6">
            <p className="font-serif text-2xl text-paper">{h}</p>
            <p className="mt-3 text-dim leading-relaxed">{b}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function How() {
  const steps = [
    {
      icon: Ear,
      title: "Listen",
      body: "Tails JSONL transcripts as they're written: live, catch-up, a watched directory, or as a daemon. Adapters for Claude Code, Anthropic, OpenAI, and generic JSONL are auto-detected.",
      code: "--mode watch --adapter claude-code",
    },
    {
      icon: FileSearch,
      title: "Index",
      body: "Extracts entities, relations, and decisions, and scores every message for importance. Embeds locally with all-MiniLM-L6-v2 into a sqlite-vec index stored in the same SQLite file.",
      code: "stenographer.db",
    },
    {
      icon: Network,
      title: "Answer",
      body: "Agents query it over MCP, and everything else uses REST. GraphRAG search merges vector similarity with entity-graph traversal, then re-ranks. Token-budgeted context frames keep agents on track after compaction.",
      code: "search_conversation · get_context_frame",
    },
  ];
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title={<>It never speaks out of turn.</>}
      lede="Stenographer is passive by design. It never writes back into a conversation or takes actions, so it's safe to attach to any agent loop. It only observes, indexes, and answers when asked."
    >
      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <motion.div key={s.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }} className="panel p-6 flex flex-col">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center size-10 rounded-xl bg-gold/10 text-gold">
                <s.icon className="size-5" />
              </span>
              <span className="font-mono text-xs text-dim">0{i + 1}</span>
            </div>
            <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-dim leading-relaxed flex-1">{s.body}</p>
            <code className="mt-5 block font-mono text-xs text-gold/90 border-t border-line pt-4">{s.code}</code>
          </motion.div>
        ))}
      </div>
      <motion.div {...reveal} className="mt-4 panel p-6 grid md:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="flex items-center gap-3">
          <GitBranch className="size-5 text-gold" />
          <h3 className="text-lg font-semibold">Decisions are closed, never deleted</h3>
        </div>
        <div className="font-mono text-[13px] leading-7 overflow-x-auto">
          <div><span className="text-dim">m1</span> <span className="line-through text-dim">we decided to use postgres for the main database</span></div>
          <div><span className="text-dim">m3</span> actually, we decided to use <span className="text-ok">sqlite</span>, local-first</div>
          <div className="text-gold">→ decision A superseded by B · tombstone keeps what, why, and the triggering message</div>
        </div>
      </motion.div>
    </Section>
  );
}

function Ledger() {
  const records = [
    { tag: "TB", color: "text-tb border-tb/40 bg-tb/10", name: "Tombstone", body: "A prior statement is provably stale or wrong. It requires evidence and an accountable signer." },
    { tag: "UV", color: "text-uv border-uv/40 bg-uv/10", name: "Unverified", body: "“There be dragons.” Believed true but not yet verified, with a machine-actionable verifyBy hint. Flag it, don't block on it." },
    { tag: "PROPOSAL", color: "text-dim border-line bg-white/5", name: "Proposal", body: "What the detectors emit. Signing one mints a TB or UV. Dismissing costs nothing, so detectors can be tuned for recall." },
    { tag: "ADDENDUM", color: "text-ok border-ok/40 bg-ok/10", name: "Addendum", body: "Evidence attached after the fact: resolving a UV, or overriding a TB with proof." },
    { tag: "RULING", color: "text-objection border-objection/40 bg-objection/10", name: "Ruling", body: "A signed judgment with a written opinion: strike, promotion, contempt, or a ruling on an objection." },
  ];
  const rules = [
    [ShieldCheck, "No anonymous truth", "Generic identities like system and assistant are rejected at the schema level."],
    [Scale, "Contempt of corpus", "Three subagents affirming their parent's claim count as one opinion. Corroboration from the same author or session is rejected."],
    [BookMarked, "Wiki interop", "The ledger round-trips losslessly to team llm-wiki JSONL, so it lives in your repo next to the code."],
  ] as const;
  return (
    <Section
      id="ledger"
      eyebrow="The truth ledger · TB/UV v2"
      title={<>Machines detect.<br /><span className="italic text-gold">Authors assert.</span></>}
      lede="Detection is automatic and can only produce proposals. Nothing an agent infers becomes truth until someone accountable signs it. Five record types share one append-only ledger."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {records.map((r, i) => (
          <motion.div key={r.tag} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className="panel p-5">
            <span className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${r.color}`}>{r.tag}</span>
            <h3 className="mt-4 font-semibold">{r.name}</h3>
            <p className="mt-2 text-sm text-dim leading-relaxed">{r.body}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        {rules.map(([Icon, h, b]) => (
          <motion.div key={h} {...reveal} className="flex gap-4 p-5 rounded-2xl border border-line/70">
            <Icon className="size-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{h}</p>
              <p className="mt-1 text-sm text-dim leading-relaxed">{b}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function Objections() {
  const delivery = [
    [Radio, "Claude Code", "A built-in MCP channel pushes notifications to the attached session as objections are found."],
    [Gavel, "smallchat", "--objection-channel posts to the smallchat channel bridge, which relays each objection into the right agent's session."],
    [Webhook, "Anything else", "--objection-webhook sends HMAC-signed batches of three to harnesses that can't be interrupted."],
  ] as const;
  return (
    <Section
      id="objections"
      eyebrow="Real-time objections"
      title={<>Catch it in the transcript,<br /><span className="italic text-objection">not in code review.</span></>}
      lede="When a tombstone declares its literals, Stenographer watches assistant output (prose and the new side of every edit) for those dead values. It raises an objection with the exhibit attached while the agent is still working."
    >
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div {...reveal} className="panel p-5 overflow-x-auto">
          <p className="font-mono text-xs text-dim mb-3">wiki/truth.jsonl</p>
          <pre className="font-mono text-[13px] leading-6 text-paper/90">{`{ "claim": "LOG_BUDGET 30 is dead; the budget is 100",
  "evidence": [{ "kind": "commit", "ref": "a1b2c3" }],
  "signedBy": "johnnyclem",
  "literals": [
    { "subject": "LOG_BUDGET", "dead": "30", "current": "100" },
    { "dead": "legacyRateLimiter", "current": "TokenBucket" }
  ] }`}</pre>
        </motion.div>
        <motion.div {...reveal} className="panel p-6">
          <h3 className="font-semibold text-lg">Precision over recall</h3>
          <ul className="mt-4 space-y-3 text-dim leading-relaxed">
            <li><span className="text-paper">Exact tokens.</span> <code className="font-mono text-sm">30</code> never matches <code className="font-mono text-sm">300</code>.</li>
            <li><span className="text-paper">Subjects tolerate drift.</span> LOG_BUDGET, logBudget, and “log budget” all match, but only next to the value.</li>
            <li><span className="text-paper">Discussion isn't assertion.</span> “Bumped from 30 to 100” mentions the current value, so it doesn't count.</li>
            <li><span className="text-paper">A judge rules.</span> Sustained or overruled via <code className="font-mono text-sm">rule_on_objection</code>. The sustain rate is your tuning dial.</li>
          </ul>
          <p className="mt-5 text-sm text-dim border-t border-line pt-4">
            Starts in <code className="font-mono text-gold">shadow</code> mode, which records without interrupting.
            Switch to <code className="font-mono text-gold">deliver</code> once you trust it.
          </p>
        </motion.div>
      </div>
      <div className="mt-4 grid md:grid-cols-3 gap-4">
        {delivery.map(([Icon, h, b]) => (
          <motion.div key={h} {...reveal} className="panel p-5">
            <Icon className="size-5 text-objection" />
            <p className="mt-3 font-semibold">{h}</p>
            <p className="mt-1 text-sm text-dim leading-relaxed">{b}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function Messenger() {
  return (
    <Section
      eyebrow="With smallchat for macOS"
      title={<>A stenographer in every chat.</>}
      lede="The smallchat macOS messenger for Claude Code sessions loads your wiki's tombstones and unverified claims and watches every direct and group chat. It receives objections over its channel bridge and lets you sign new tombstones, literals included, right from a message."
    >
      <motion.div {...reveal} className="panel p-6 sm:p-8 grid md:grid-cols-3 gap-6">
        {[
          [PenLine, "Tombstone a value…", "Right-click any message to draft a signed TB with evidence and literals. It's validated with the same rules Stenographer uses."],
          [Gavel, "Objections, routed", "Each objection lands in the chat with the agent it's about, and can optionally be relayed into that session as an interrupt."],
          [Radio, "One command", "Copy a ready-made stenographer start line, with the channel URL and secret already filled in."],
        ].map(([Icon, h, b]) => {
          const I = Icon as typeof PenLine;
          return (
            <div key={h as string}>
              <I className="size-5 text-gold" />
              <p className="mt-3 font-semibold">{h as string}</p>
              <p className="mt-1 text-sm text-dim leading-relaxed">{b as string}</p>
            </div>
          );
        })}
      </motion.div>
    </Section>
  );
}

function Install() {
  return (
    <Section
      id="install"
      eyebrow="Install"
      title={<>Runs on your machine. <span className="italic text-dim">Stays there.</span></>}
      lede={<>Everything is local: a ~25 MB embedding model downloaded once, plus one SQLite file. Pass <code className="font-mono text-gold text-base">--embeddings hashed</code> to skip even that download. Stenographer is in alpha and installs from source for now.</>}
    >
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div {...reveal}>
          <p className="mb-3 text-sm font-semibold flex items-center gap-2"><HardDrive className="size-4 text-gold" /> Build it</p>
          <CopyBlock lines={[
            `git clone ${GITHUB_URL}.git`,
            "cd stenographer && npm install && npm run build",
            "npm link   # puts `stenographer` on your PATH",
          ]} />
        </motion.div>
        <motion.div {...reveal}>
          <p className="mb-3 text-sm font-semibold flex items-center gap-2"><Ear className="size-4 text-gold" /> Point it at a transcript</p>
          <CopyBlock lines={[
            "# tail one log and serve MCP over stdio",
            "stenographer start ./conversation.jsonl",
            "# watch every Claude Code session in a project",
            "stenographer start ~/.claude/projects/myproj --mode watch",
            "# daemon: live + REST on 127.0.0.1:8787",
            "stenographer start ./conversation.jsonl ./state.db --mode daemon",
          ]} />
        </motion.div>
      </div>
      <motion.div {...reveal} className="mt-4 panel p-5 font-mono text-[13px] text-dim overflow-x-auto">
        <span className="text-paper">REST</span>{"  "}GET /status · /decisions · /decisions/:id/chain · /tombstones · /search?q= · /graphrag?q= · /context-frame?budget= · /flags
        <br />
        <span className="text-paper">MCP</span>{"   "}search_conversation · get_decision_chain · get_context_frame · assert_tombstone · assert_uv · list_objections · rule_on_objection · +20 more
      </motion.div>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line px-4 sm:px-6 py-12">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row gap-6 sm:items-center justify-between text-sm text-dim">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" className="size-6" />
          <span className="text-paper font-semibold">Stenographer</span>
          <span>· MIT · v{VERSION}</span>
        </div>
        <div className="flex flex-wrap gap-6">
          <a href={GITHUB_URL} className="hover:text-paper transition">GitHub</a>
          <a href={`${GITHUB_URL}/tree/master/docs`} className="hover:text-paper transition">Docs</a>
          <a href={SMALLCHAT_URL} className="hover:text-paper transition">smallchat</a>
        </div>
      </div>
      <p className="mx-auto max-w-6xl mt-6 text-xs text-dim/70">
        Roadmap, not shipped: GraphQL, a Neo4j backend, and Tier 1.5 local-model extraction.
      </p>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <How />
        <Ledger />
        <Objections />
        <Messenger />
        <Install />
      </main>
      <Footer />
    </>
  );
}
