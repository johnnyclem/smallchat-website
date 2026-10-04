import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Ear, FileSearch, Layers, MessageSquare, Network, Radio, ScrollText, ShieldCheck, Users, Webhook } from "lucide-react";
import { useState } from "react";
import {
  Band,
  CommandBlock,
  GetStarted,
  Glow,
  Hero,
  PullQuote,
  SiteFooter,
  SiteNav,
  TabBar,
  TypewriterIcon,
  tabPanel,
  type SiteMeta,
} from "@workspace/site-kit";
import { ObjectionPlayground } from "@/components/ObjectionPlayground";
import { RolloutSpectrum } from "@/components/RolloutSpectrum";
import { Transcript } from "@/components/Transcript";

const SITE: SiteMeta = {
  id: "stenographer",
  name: "stenographer",
  Icon: TypewriterIcon,
  github: "https://github.com/johnnyclem/stenographer",
  version: "1.0.0",
};
const INSTALL = "npm install @stenographer/core@^1";
const NPX = "npx -y @stenographer/core@^1";
const CLONE = `git clone ${SITE.github}.git`;

type Tab = "how" | "ledger" | "quorum" | "delivery";

function HowItWorks() {
  const steps = [
    { step: "LISTEN", icon: Ear, desc: "Tails Claude Code, Anthropic, OpenAI or plain JSONL transcripts. Resumes where it stopped." },
    { step: "INDEX", icon: FileSearch, desc: "Decisions, entities, local embeddings and the truth ledger, all in one SQLite file." },
    { step: "ANSWER", icon: Network, desc: "GraphRAG over MCP or REST. Embeddings run locally: no API keys." },
  ];
  return (
    <motion.div key="how" {...tabPanel} className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
      {steps.map((s, i) => (
        <div key={s.step} className="flex flex-col md:flex-row items-center">
          <div className="glass-panel rounded-2xl p-5 sm:p-6 w-64 text-center hover:border-primary/30 transition-all duration-300">
            <s.icon className="w-7 h-7 text-primary mx-auto mb-3" />
            <div className="text-primary font-mono font-bold text-sm mb-2">{s.step}</div>
            <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
          </div>
          {i < steps.length - 1 && <div className="text-muted-foreground text-2xl px-3 rotate-90 md:rotate-0 my-2 md:my-0">→</div>}
        </div>
      ))}
    </motion.div>
  );
}

function Ledger() {
  const records = [
    { marker: "TB", color: "text-primary", text: "Tombstone: this value is dead. Evidence and a signer: a person, or an agent quorum." },
    { marker: "UV", color: "text-sky-400", text: "Unverified. Flag it, don't block on it. A UV that contests a TB marks it contested, still truth." },
    { marker: "PROPOSAL", color: "text-muted-foreground", text: "A draft from a detector, an agent or another tool. A person notarizes it, or matching agent drafts settle as a quorum." },
    { marker: "ADDENDUM", color: "text-green-400", text: "Evidence after the fact. Verifies or refutes a UV (a person, or an agent quorum), or overrides a TB (a person)." },
    { marker: "RULING", color: "text-red-400", text: "A person's judgment with a written opinion: a strike, promotion, contempt, dismissal or objection ruling." },
    { marker: "TRANSITION", color: "text-white/80", text: "A status change, appended right after the line that caused it. Never an edit." },
  ];
  const rules = [
    {
      title: "Hash-chained.",
      text: (
        <>
          Every v2 wiki line carries <code className="font-mono text-white/80">seq</code>,{" "}
          <code className="font-mono text-white/80">prevHash</code> and <code className="font-mono text-white/80">hash</code> (SHA-256
          over its RFC 8785 JCS form). The ledger behind it is chained the same way, and{" "}
          <code className="font-mono text-white/80">stenographer verify</code> re-checks it and every status. A chain shows that lines
          changed, not who wrote them.
        </>
      ),
    },
    { title: "Status is a fold:", text: <>the latest TRANSITION for an entry, else the entry line's own.</> },
    { title: "Unknown fails closed.", text: <>An unknown status is not current truth; the line stays as history.</> },
    {
      title: "One writer per file.",
      text: (
        <>
          Other tools submit a PROPOSAL to <code className="font-mono text-white/80">POST /proposals</code> (REST, port 8787 in daemon
          mode, with the REST token and <code className="font-mono text-white/80">STENOGRAPHER_NOTARY_SECRET</code>), and a person
          notarizes it.
        </>
      ),
    },
  ];
  return (
    <motion.div key="ledger" {...tabPanel} className="grid md:grid-cols-[1.2fr_1fr] gap-6 sm:gap-10 items-center">
      <div className="space-y-1 font-mono text-xs sm:text-sm">
        {records.map((r) => (
          <div key={r.marker} className="flex items-start gap-3 py-2.5 border-b border-white/5">
            <span className={`${r.color} font-bold w-24 shrink-0`}>{r.marker}</span>
            <span className="text-muted-foreground font-sans">{r.text}</span>
          </div>
        ))}
      </div>
      <div>
        <blockquote className="text-xl sm:text-2xl font-semibold tracking-tight text-white/90 leading-snug border-l-2 border-primary/60 pl-5">
          “Three subagents affirming their parent's claim is one opinion wearing three hats.”
          <footer className="mt-3 text-sm font-normal text-muted-foreground">Contempt of corpus, rejected at write time.</footer>
        </blockquote>
        <ul className="mt-6 space-y-2 text-sm text-muted-foreground leading-relaxed">
          {rules.map((r) => (
            <li key={r.title}>
              <span className="text-white font-semibold">{r.title}</span> {r.text}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function Quorum() {
  const rules = [
    {
      title: "Two or more",
      text: "distinct agent sessions. One session twice is one witness, and so are subagents sharing a connection.",
    },
    { title: "Agreeing", text: "on one verdict for a UV, or on drafts of the same set of literals." },
    {
      title: "From different angles.",
      text: "Each cites settling evidence (commit, file, test, claimed-command, wiki). No two cite the same item, in any spelling, and together they span at least two settling kinds.",
    },
    { title: "At the same time:", text: "every member within 15 minutes." },
  ];
  const person = [
    "Overriding, striking, dismissing and ruling. Agents never do these, together or alone.",
    "A dispute. An opposite verdict within the window stops the quorum, and a person is told.",
    "A contest. A quorum that would verify a UV contesting a TB is raised to a person: it would override the TB.",
    "Signing alone. A person may sign on evidence of any class. For agents, message, chat, ticket and doc evidence can raise a question, never settle one.",
  ];
  return (
    <motion.div key="quorum" {...tabPanel} className="grid md:grid-cols-[1.2fr_1fr] gap-6 sm:gap-10 items-start">
      <div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          One agent's confidence is not evidence. On its own an agent can only draft and attest. Agents settle a claim only
          as a quorum:
        </p>
        <ol className="mt-3 space-y-1">
          {rules.map((r, i) => (
            <li key={r.title} className="flex items-start gap-3 py-2.5 border-b border-white/5 text-sm">
              <span className="font-mono font-bold text-primary w-5 shrink-0">{i + 1}</span>
              <span className="text-muted-foreground">
                <span className="text-white font-semibold">{r.title}</span> {r.text}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          The line that settles it carries the quorum: each member's author, session, time and evidence, so every reader can
          check it. Sessions are witnesses, not independent minds: two sessions reading the same misleading input can agree.
        </p>
      </div>
      <div className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Users className="w-5 h-5 text-primary" /> What stays with a person
        </div>
        <ul className="mt-4 space-y-3">
          {person.map((p) => (
            <li key={p} className="text-sm text-muted-foreground leading-relaxed border-l-2 border-white/10 pl-3">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function Delivery() {
  const cards = [
    {
      icon: ShieldCheck,
      title: "The gate",
      desc: (
        <>
          Before the write. <code className="font-mono text-white/80">stenographer gate --mode enforce</code>, a Claude Code
          PreToolUse hook, denies a Write, Edit, MultiEdit, NotebookEdit or Bash call that writes a tombstoned literal, and names
          the TB. A guardrail against accidents, not a security boundary. The other three get objections after the write, with{" "}
          <code className="font-mono text-white/80 whitespace-nowrap">--objections deliver</code>.
        </>
      ),
    },
    {
      icon: Radio,
      title: "Claude Code",
      desc: (
        <>
          A <code className="font-mono text-white/80">claude/channel</code> event to the attached session, for its own transcript.
          Not in watch mode: use smallchat or a webhook there.
        </>
      ),
    },
    { icon: MessageSquare, title: "smallchat", desc: "Posted to smallchat's channel bridge and relayed into the agent's session. The macOS messenger runs one." },
    { icon: Webhook, title: "Webhooks", desc: "Batches signed per Standard Webhooks, for harnesses that can't be interrupted." },
  ];
  return (
    <motion.div key="delivery" {...tabPanel} className="grid md:grid-cols-2 gap-4 sm:gap-6">
      {cards.map((r) => (
        <div key={r.title} className="glass-panel glass-panel-hover p-5 sm:p-6 rounded-2xl group">
          <r.icon className="w-7 h-7 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
          <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{r.title}</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">{r.desc}</p>
        </div>
      ))}
    </motion.div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("how");

  return (
    <div className="relative w-full">
      <Glow rgb="248,168,40" />
      <div className="relative z-10">
        <SiteNav
          site={SITE}
          links={[
            { href: "#what", label: "What it does" },
            { href: "#try", label: "Try it" },
            { href: "#rollout", label: "Rollout" },
            { href: "#start", label: "Get Started" },
          ]}
        />

        <Hero
          badge="Open Source · MCP · Local-first · MIT License"
          title="stenographer."
          tagline="The court reporter for your agents."
          lines={<>It never speaks out of turn.<br />It keeps the record.<br />And it objects when an agent repeats something declared dead. Its gate can stop the write before it runs.</>}
          install={{ display: INSTALL, copy: INSTALL }}
        >
          <Transcript />
        </Hero>

        <Band id="what" title="What it does" lede="An MCP server that observes by default. It turns agent transcripts into a record you can query, and keeps a hash-chained ledger of what's dead.">
          <TabBar<Tab>
            tabs={[
              { id: "how", label: "How it works", icon: <ArrowRight className="w-3.5 h-3.5" /> },
              { id: "ledger", label: "Truth ledger", icon: <ScrollText className="w-3.5 h-3.5" /> },
              { id: "quorum", label: "Agent quorum", icon: <Users className="w-3.5 h-3.5" /> },
              { id: "delivery", label: "Gate & delivery", icon: <Layers className="w-3.5 h-3.5" /> },
            ]}
            active={tab}
            onChange={setTab}
          />
          <AnimatePresence mode="wait">
            {tab === "how" && <HowItWorks />}
            {tab === "ledger" && <Ledger />}
            {tab === "quorum" && <Quorum />}
            {tab === "delivery" && <Delivery />}
          </AnimatePresence>
        </Band>

        <PullQuote cite="Detectors only draft. A person signs, or an agent quorum settles.">Machines detect. Authors assert.</PullQuote>

        <Band id="try" title="Try to get past it" lede="Pick a tombstone. Put words in the agent's mouth.">
          <ObjectionPlayground />
        </Band>

        <PullQuote>Catch it in the transcript, not in code review.</PullQuote>

        <Band id="rollout" title="Earn the interrupt" lede="Start in shadow. Move to deliver when the sustain rate says it's ready.">
          <RolloutSpectrum />
        </Band>

        <GetStarted
          lede={`Node 22 or newer. Runs locally, with no API keys. It downloads the embedding model once; --embeddings hashed skips even that. Check the ledger with ${NPX} verify ./stenographer.db.`}
          title={`npm · v${SITE.version}`}
          commands={[INSTALL, `${NPX} start ~/.claude/projects/myproj --mode watch`]}
        >
          <CommandBlock
            title="from source · a lockfile install needs Python 3 and make"
            commands={[
              CLONE,
              "cd stenographer && npm install && npm run build && npm link",
              "stenographer start ~/.claude/projects/myproj --mode watch",
            ]}
          />
        </GetStarted>

        <SiteFooter site={SITE} />
      </div>
    </div>
  );
}
