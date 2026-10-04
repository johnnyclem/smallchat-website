import { AnimatePresence, motion } from "framer-motion";
import { Archive, BadgeCheck, Braces, Database, FileCheck, Fingerprint, Pin, Search, Server, Shapes, ShieldCheck, Sparkles, TriangleAlert, Users } from "lucide-react";
import { useState } from "react";
import {
  Band,
  CommandBlock,
  GetStarted,
  Glow,
  Hero,
  PodiumIcon,
  PullQuote,
  SiteFooter,
  SiteNav,
  TabBar,
  tabPanel,
  type SiteMeta,
} from "@workspace/site-kit";
import { ConversionMatrix } from "@/components/ConversionMatrix";
import { SearchDemo } from "@/components/SearchDemo";
import { ShapeSwitcher } from "@/components/ShapeSwitcher";

const SITE: SiteMeta = {
  id: "polytician",
  name: "polytician",
  Icon: PodiumIcon,
  github: "https://github.com/johnnyclem/polytician",
  version: "3.0.0",
};
const INSTALL = "npm install polytician@^3";
const NPX = "npx -y polytician@^3";
const CLONE = `git clone ${SITE.github}.git`;

type Tab = "shapes" | "memory" | "contract" | "deploy";

type Card = { icon: typeof Search; title: string; desc: string };

function Cards({ id, cards }: { id: Tab; cards: Card[] }) {
  return (
    <motion.div key={id} {...tabPanel} className="grid md:grid-cols-3 gap-4 sm:gap-6">
      {cards.map((c) => (
        <div key={c.title} className="glass-panel glass-panel-hover p-5 sm:p-6 rounded-2xl group">
          <c.icon className="w-7 h-7 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
          <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{c.title}</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">{c.desc}</p>
        </div>
      ))}
    </motion.div>
  );
}

const MEMORY: Card[] = [
  { icon: Search, title: "Search by meaning", desc: "Cosine ranking over sqlite-vec or pgvector. Namespace and tag filters run inside the vector query. Saved text is embedded for you." },
  { icon: Users, title: "Namespaces + versions", desc: "Every call is scoped to a namespace. Callers pick it and are not authenticated. expectedVersion is checked in the write itself: of two writers on one version, exactly one wins." },
  { icon: Archive, title: "Portable backups", desc: "Every namespace in one versioned JSONL file, vectors, tags and provenance included, with a checksum. Optionally AES-256-GCM." },
];

/** New in 3.0, from polytician's README and CHANGELOG. */
const CONTRACT: Card[] = [
  { icon: Braces, title: "Typed results", desc: "Every tool declares an outputSchema. Results come back as structuredContent, checked against it before they are sent." },
  { icon: TriangleAlert, title: "Error codes", desc: "Errors are { error, code }. Branch on VERSION_CONFLICT, OVERWRITE_REFUSED, NAMESPACE_DENIED and seven more, not on message text." },
  { icon: Pin, title: "Pinned embeddings", desc: "Each vector records the model that made it. Search refuses to mix models (EMBEDDING_MODEL_MISMATCH); reembed_concepts re-derives them." },
  { icon: Fingerprint, title: "Provenance", desc: "Each representation records its origin: user, import, derived or llm. A conversion replaces authored content only with overwrite: true." },
  { icon: BadgeCheck, title: "Truth status", desc: "A concept can carry an assertion status (asserted, verified, contested, retracted) and a ledgerRef to the ledger entry it mirrors, such as a stenographer entry. Polytician stores the status. It does not check it." },
  { icon: ShieldCheck, title: "OpenAPPA battery", desc: "In the repo, pinned to OpenAPPA 0.30.0: contracts for all 20 tools under mcp/polytician/<tool>, with namespaces as label compartments." },
];

function Deploy() {
  const steps = [
    { step: "ONE PROCESS", icon: Database, desc: "SQLite + sqlite-vec over stdio. Your MCP client starts one process. No port opens by default." },
    { step: "MANY NODES", icon: Server, desc: "MCP over Streamable HTTP on port 8788 (127.0.0.1 unless you bind another host), behind a bearer token. On Postgres + pgvector, replicas share one store." },
    { step: "RESTORED", icon: Archive, desc: "export_backup writes one versioned JSONL file. import_backup verifies it, then restores it in one transaction. On a Postgres cluster, the agentvault-sync CLI does the same against the database." },
  ];
  return (
    <motion.div key="deploy" {...tabPanel} className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
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

export default function App() {
  const [tab, setTab] = useState<Tab>("shapes");

  return (
    <div className="relative w-full">
      <Glow rgb="169,139,250" />
      <div className="relative z-10">
        <SiteNav
          site={SITE}
          links={[
            { href: "#what", label: "What it does" },
            { href: "#try", label: "Try it" },
            { href: "#start", label: "Get Started" },
          ]}
        />

        <Hero
          badge="Open Source · MCP · Local-first · MIT License"
          title="polytician."
          tagline="One memory. Every shape."
          lines={<>Save a concept once.<br />Read it back as markdown, a graph, or a vector.<br />Search it by meaning, on your own machine.</>}
          install={{ display: INSTALL, copy: INSTALL }}
        >
          <ShapeSwitcher />
        </Hero>

        <Band id="what" title="What it does" lede="A local-first MCP server that gives Claude, or any MCP client, a memory it can search.">
          <TabBar<Tab>
            tabs={[
              { id: "shapes", label: "Three shapes", icon: <Shapes className="w-3.5 h-3.5" /> },
              { id: "memory", label: "Memory", icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: "contract", label: "Contract", icon: <FileCheck className="w-3.5 h-3.5" /> },
              { id: "deploy", label: "Deploy", icon: <Server className="w-3.5 h-3.5" /> },
            ]}
            active={tab}
            onChange={setTab}
          />
          <AnimatePresence mode="wait">
            {tab === "shapes" && (
              <motion.div key="shapes" {...tabPanel}>
                <ConversionMatrix />
              </motion.div>
            )}
            {tab === "memory" && <Cards id="memory" cards={MEMORY} />}
            {tab === "contract" && <Cards id="contract" cards={CONTRACT} />}
            {tab === "deploy" && <Deploy />}
          </AnimatePresence>
        </Band>

        <PullQuote cite="Save once. Convert on demand.">One concept. Three shapes.</PullQuote>

        <Band id="try" title="Ask it anything" lede="Eight saved concepts. Pick a question and watch the memory rank itself.">
          <SearchDemo />
        </Band>

        <PullQuote cite="Embeddings run in-process. No API key on the hot path.">Everything runs on your machine.</PullQuote>

        <GetStarted
          lede="Node 22 or newer. Your MCP client starts it over stdio. --http serves it on 127.0.0.1:8788 instead, with a bearer token written to ~/.polytician/http-token. The embedding model (~25 MB) downloads on first use, then it runs offline."
          title={`npm · v${SITE.version}`}
          commands={[INSTALL, `${NPX} --http`]}
        >
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 text-xs text-muted-foreground font-mono">claude_desktop_config.json · stdio</div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-white/90">{`{
  "mcpServers": {
    "polytician": {
      "command": "npx",
      "args": ["-y", "polytician@^3"]
    }
  }
}`}</pre>
          </div>
          <CommandBlock title="or from source" commands={[CLONE, "cd polytician && npm install && npm run build", "npm start"]} />
          <p className="text-sm text-muted-foreground leading-relaxed">
            npm start runs the stdio server, which waits for a client on stdin. To use a checkout, set your client's command to{" "}
            <span className="font-mono text-white/80 break-all">node /absolute/path/to/polytician/dist/index.js</span> (stdio), or serve HTTP with{" "}
            <span className="font-mono text-white/80 whitespace-nowrap">node dist/index.js --http</span>.
          </p>
        </GetStarted>

        <SiteFooter site={SITE} />
      </div>
    </div>
  );
}
