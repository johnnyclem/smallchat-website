import { StickyNoteIcon, TabBar, TypewriterIcon, tabPanelProps } from "@workspace/site-kit";
import { ArrowDown, ArrowUp, Gauge, Layers, ScrollText } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { LEVELS } from "./levels";

const STENOGRAPHER_URL = "https://stenographer.smallchat.dev";

type Tab = "levels" | "importance" | "truth";

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "levels", label: "Five levels", icon: <Layers aria-hidden /> },
  { id: "importance", label: "Importance", icon: <Gauge aria-hidden /> },
  { id: "truth", label: "Truth ledger", icon: <ScrollText aria-hidden /> },
];

/** A small heading over a list: 8 to its list, 24 above. */
function ListLabel({ children }: { children: ReactNode }) {
  return <h3 className="stat-label mb-2">{children}</h3>;
}

function Levels() {
  const rules = [
    "Ledger truth, corrections and invariants first",
    "Up to a quarter of the budget is held for the newest messages",
    "Then memories, code, graph, summaries and history fill the rest",
    "Recent messages render last",
  ];
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <ListLabel>Levels, deepest first</ListLabel>
        <ul className="border-t border-border">
          {LEVELS.map((l) => (
            <li
              key={l.level}
              className="grid min-h-9 grid-cols-[32px_minmax(0,1fr)] items-baseline gap-y-0.5 border-b border-border py-2 text-sm sm:grid-cols-[32px_104px_minmax(0,1fr)]"
            >
              <span className="font-mono text-xs text-muted-foreground">L{l.level}</span>
              <span className="font-medium">{l.name}</span>
              <span className="col-start-2 text-secondary-foreground sm:col-start-3">{l.fidelity}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-md text-sm text-secondary-foreground">
          A correction reaches L1 through L4, invariants included. What it supersedes is archived, never deleted.
        </p>
      </div>
      <div>
        <ListLabel>How a context frame fills, in priority order</ListLabel>
        <ol className="border-t border-border">
          {rules.map((r, i) => (
            <li
              key={r}
              className="grid min-h-9 grid-cols-[32px_minmax(0,1fr)] items-baseline border-b border-border py-2 text-sm text-foreground"
            >
              <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-md text-sm text-secondary-foreground">
          Each section has a kind and a fixed marker. The rendered frame stays within its token budget, by a ~4
          characters per token estimate.
        </p>
      </div>
    </div>
  );
}

const SIGNALS = [
  { name: "State delta", weight: 40, desc: "Does it change the entity graph or override something?", lead: true },
  { name: "Trajectory discontinuity", weight: 35, desc: "Does the conversation turn here? Needs message embeddings." },
  { name: "Reference frequency", weight: 25, desc: "Do later messages keep pointing back to it?" },
];

function Importance() {
  return (
    <div className="max-w-2xl">
      <ListLabel>Default weights, out of 100</ListLabel>
      <ul className="border-t border-border">
        {SIGNALS.map((s) => (
          <li key={s.name} className="border-b border-border py-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-medium">{s.name}</span>
              <span className="font-mono text-sm tabular-nums text-secondary-foreground">{s.weight}</span>
            </div>
            <div className="bar-track mt-2" aria-hidden>
              <div
                className={`bar-fill ${s.lead ? "bar-fill-accent" : ""}`}
                style={{ "--v": s.weight / 100 } as CSSProperties}
              />
            </div>
            <p className="mt-2 text-sm text-secondary-foreground">{s.desc}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-secondary-foreground">
        A standalone scorer: CompactionEngine does not call it. Your host supplies the embeddings; no model ships with
        the package.
      </p>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="code-inline">{children}</code>;
}

function Truth() {
  const rules: ReactNode[] = [
    "Reads stenographer's truth format v2: hash-chained JSONL. A bad hash or a broken chain refuses the whole stream.",
    "Status is a fold over TRANSITION lines. A missing or unknown status, or an unsigned TB, fails closed: never current truth.",
    "An agent's TB is truth only with a quorum: two or more agent sessions, agreeing, each citing its own settling evidence (two kinds or more between them), within 15 minutes. An evidence kind short-hand doesn't know fails closed too.",
    <>
      The ledger section marks truth <Code>[TB]</Code>, a disputed TB <Code>[TB ⚠ CONTESTED]</Code> and an open question{" "}
      <Code>[UV — UNVERIFIED]</Code>. A <Code>[TB]</Code> inside a message, tool output or ledger field renders as{" "}
      <Code>\[TB]</Code> instead of reading as a ledger line.
    </>,
    "Candidates go back as a hash-chained PROPOSAL stream. A JSONL seam, no code dependency either way.",
  ];
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-5">
        <ListLabel>The seam</ListLabel>
        <div className="flex flex-col">
          <div className="surface flex items-center gap-3 rounded-card p-5">
            <StickyNoteIcon className="size-6 shrink-0 text-secondary-foreground" />
            <span className="font-medium">short-hand</span>
          </div>
          <ul className="my-1 ml-6 flex flex-col gap-3 border-l border-border-strong py-4 pl-6 font-mono text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <ArrowUp className="icon" aria-hidden />
              <span className="sr-only">Reads from stenographer: </span>
              syncTruthLedger · truth format v2
            </li>
            <li className="flex items-center gap-2">
              <ArrowDown className="icon" aria-hidden />
              <span className="sr-only">Writes to stenographer: </span>
              exportProposalDrafts · PROPOSAL
            </li>
          </ul>
          <a href={STENOGRAPHER_URL} className="surface panel-hover flex items-center gap-3 rounded-card p-5">
            <TypewriterIcon className="size-6 shrink-0 text-secondary-foreground" />
            <span className="font-medium">stenographer</span>
          </a>
        </div>
      </div>
      <div className="lg:col-span-7">
        <ListLabel>What the reader guarantees</ListLabel>
        <ol className="border-t border-border">
          {rules.map((r, i) => (
            <li
              key={i}
              className="grid grid-cols-[32px_minmax(0,1fr)] items-baseline border-b border-border py-3 text-sm text-secondary-foreground"
            >
              <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function WhatItDoes() {
  const [tab, setTab] = useState<Tab>("levels");
  return (
    <>
      <TabBar<Tab>
        tabs={TABS}
        active={tab}
        onChange={setTab}
        label="What short-hand does"
        idPrefix="what"
        className="max-sm:[&>button]:px-2 max-sm:[&_svg]:hidden"
      />
      <div key={tab} className="fade-in" {...tabPanelProps("what", tab)}>
        {tab === "levels" && <Levels />}
        {tab === "importance" && <Importance />}
        {tab === "truth" && <Truth />}
      </div>
    </>
  );
}
