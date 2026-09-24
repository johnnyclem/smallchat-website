import { AnimatePresence, motion } from "framer-motion";
import { Archive, Database, Search, Server, Shapes, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import {
  Band,
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
  version: "2.0.0",
};
const CLONE = `git clone ${SITE.github}.git`;

type Tab = "shapes" | "memory" | "deploy";

function Memory() {
  const cards = [
    { icon: Search, title: "Search by meaning", desc: "Cosine similarity over sqlite-vec or pgvector, scoped to a namespace." },
    { icon: Users, title: "Namespaces", desc: "One per agent or tenant. expectedVersion guards concurrent writes." },
    { icon: Archive, title: "Portable backups", desc: "The whole memory as one signed bundle, optionally AES-256-GCM." },
  ];
  return (
    <motion.div key="memory" {...tabPanel} className="grid md:grid-cols-3 gap-4 sm:gap-6">
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

function Deploy() {
  const steps = [
    { step: "ONE PROCESS", icon: Database, desc: "SQLite + sqlite-vec. npm start and you're done." },
    { step: "MANY NODES", icon: Server, desc: "Postgres + pgvector behind Docker Compose or Kubernetes." },
    { step: "RESTORED", icon: Archive, desc: "Snapshot to a signed bundle. Restore it on any node." },
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
          install={{ display: "git clone …/polytician", copy: CLONE }}
        >
          <ShapeSwitcher />
        </Hero>

        <Band id="what" title="What it does" lede="A local-first MCP server that gives Claude, or any MCP client, a memory it can search.">
          <TabBar<Tab>
            tabs={[
              { id: "shapes", label: "Three shapes", icon: <Shapes className="w-3.5 h-3.5" /> },
              { id: "memory", label: "Memory", icon: <Sparkles className="w-3.5 h-3.5" /> },
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
            {tab === "memory" && <Memory />}
            {tab === "deploy" && <Deploy />}
          </AnimatePresence>
        </Band>

        <PullQuote cite="Save once. Convert on demand.">One concept. Three shapes.</PullQuote>

        <Band id="try" title="Ask it anything" lede="Eight saved concepts. Pick a question and watch the memory rank itself.">
          <SearchDemo />
        </Band>

        <PullQuote cite="Embeddings run in-process. No API key on the hot path.">Everything runs on your machine.</PullQuote>

        <GetStarted
          lede="Node 20+. The embedding model downloads once, then it's fully offline."
          title={`from source · v${SITE.version}`}
          commands={[CLONE, "cd polytician && npm install && npm run build", "npm start"]}
        >
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 text-xs text-muted-foreground font-mono">claude_desktop_config.json</div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-white/90">{`{
  "mcpServers": {
    "polytician": {
      "command": "node",
      "args": ["/absolute/path/to/polytician/dist/index.js"]
    }
  }
}`}</pre>
          </div>
        </GetStarted>

        <SiteFooter site={SITE} />
      </div>
    </div>
  );
}
