import { AnimatePresence, motion } from "framer-motion";
import { Database, FileCheck, Server, Shapes } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { PodiumIcon, tabPanel, type SiteMeta } from "@workspace/site-kit";
import { ConversionMatrix } from "@/components/ConversionMatrix";
import { Footer } from "@/components/Footer";
import { GetStarted } from "@/components/GetStarted";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { SearchDemo } from "@/components/SearchDemo";
import { Rich, Section, SpecList, Statement } from "@/components/ui";

const SITE: SiteMeta = {
  id: "polytician",
  name: "polytician",
  Icon: PodiumIcon,
  github: "https://github.com/johnnyclem/polytician",
  version: "3.0.0",
};

type Tab = "shapes" | "memory" | "contract" | "deploy";

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "shapes", label: "Three shapes", icon: <Shapes /> },
  { id: "memory", label: "Memory", icon: <Database /> },
  { id: "contract", label: "Contract", icon: <FileCheck /> },
  { id: "deploy", label: "Deploy", icon: <Server /> },
];

const MEMORY = [
  {
    term: "Cosine search",
    desc: "Cosine ranking over sqlite-vec or pgvector. Namespace and tag filters run inside the vector query. Saved text is embedded for you.",
  },
  {
    term: "Namespaces + versions",
    desc: "Every call is scoped to a namespace. Callers pick it and are not authenticated. `expectedVersion` is checked in the write itself: of two writers on one version, exactly one wins.",
  },
  {
    term: "Portable backups",
    desc: "Every namespace in one versioned JSONL file, vectors, tags and provenance included, with a checksum. Optionally AES-256-GCM.",
  },
];

/** New in 3.0, from polytician's README and CHANGELOG. */
const CONTRACT = [
  {
    term: "Typed results",
    desc: "Every tool declares an `outputSchema`. Results come back as `structuredContent`, checked against it before they are sent.",
  },
  {
    term: "Error codes",
    desc: "Errors are `{ error, code }`. Branch on `VERSION_CONFLICT`, `OVERWRITE_REFUSED`, `NAMESPACE_DENIED` and seven more, not on message text.",
  },
  {
    term: "Pinned embeddings",
    desc: "Each vector records the model that made it. Search refuses to mix models (`EMBEDDING_MODEL_MISMATCH`); `reembed_concepts` re-derives them.",
  },
  {
    term: "Provenance",
    desc: "Each representation records its origin: user, import, derived or llm. A conversion replaces authored content only with `overwrite: true`.",
  },
  {
    term: "Truth status",
    desc: "A concept can carry an assertion status (asserted, verified, contested, retracted) and a `ledgerRef` to the ledger entry it mirrors, such as a stenographer entry. Polytician stores the status. It does not check it.",
  },
  {
    term: "OpenAPPA battery",
    desc: "In the repo, pinned to OpenAPPA 0.30.0: contracts for all 20 tools under `mcp/polytician/<tool>`, with namespaces as label compartments.",
  },
];

const DEPLOY = [
  {
    title: "One process",
    desc: "SQLite + sqlite-vec over stdio. Your MCP client starts one process. No port opens by default.",
  },
  {
    title: "Many nodes",
    desc: "MCP over Streamable HTTP on port 8788 (127.0.0.1 unless you bind another host), behind a bearer token. On Postgres + pgvector, replicas share one store.",
  },
  {
    title: "Restored",
    desc: "`export_backup` writes one versioned JSONL file. `import_backup` verifies it, then restores it in one transaction. On a Postgres cluster, the `agentvault-sync` CLI does the same against the database.",
  },
];

function Deploy() {
  return (
    <ol className="panel grid overflow-hidden md:grid-cols-3">
      {DEPLOY.map((s, i) => (
        <li key={s.title} className="flex flex-col gap-3 border-t border-border p-4 first:border-t-0 md:border-l md:border-t-0 md:p-5 md:first:border-l-0">
          <span className="mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="text-base font-medium text-foreground">{s.title}</h3>
          <p className="text-secondary-foreground">
            <Rich text={s.desc} />
          </p>
        </li>
      ))}
    </ol>
  );
}

/** A real tablist: roving tabindex, arrow keys, Home and End. */
function Tabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(TABS[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label="What it does" onKeyDown={onKeyDown} className="tabs">
      {TABS.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="tab"
          id={`what-tab-${t.id}`}
          aria-selected={active === t.id}
          aria-controls={`what-panel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          className="tab-item"
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("shapes");
  const panel = { id: `what-panel-${tab}`, role: "tabpanel", "aria-labelledby": `what-tab-${tab}`, tabIndex: 0 } as const;

  return (
    <>
      <Nav site={SITE} />
      <main>
        <Hero />

        <Section
          id="what"
          title="What it does"
          lede="Three shapes of one concept, what the server keeps, what its tools promise and how it runs"
        >
          <div className="flex flex-col gap-6">
            <Tabs active={tab} onChange={setTab} />
            <AnimatePresence mode="wait">
              <motion.div key={tab} {...tabPanel} {...panel}>
                {tab === "shapes" && <ConversionMatrix />}
                {tab === "memory" && <SpecList items={MEMORY} />}
                {tab === "contract" && <SpecList items={CONTRACT} />}
                {tab === "deploy" && <Deploy />}
              </motion.div>
            </AnimatePresence>
          </div>
        </Section>

        <Statement cite="Save once. Convert on demand">One concept. Three shapes</Statement>

        <Section id="try" title="Search by meaning" lede="8 saved concepts, 6 questions, the scores polytician returned">
          <SearchDemo />
        </Section>

        <Statement cite="Embeddings run in-process. No API key, no external call on the hot path">Everything runs on your machine</Statement>

        <GetStarted version={SITE.version} />
      </main>
      <Footer site={SITE} />
    </>
  );
}
