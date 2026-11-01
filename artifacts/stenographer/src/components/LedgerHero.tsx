import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Download, List, Loader2, RefreshCw, Waypoints } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CopyButton, fadeUp, stagger, tabPanel } from "@workspace/site-kit";
import { hash12, clip } from "@/lib/format";
import { browserSession, loadIdentity, publicLedger, saveIdentity, type ActResponse } from "@/lib/ledger-client";
import type { EntryView, ReadModel } from "@/lib/truth/read";
import { ActionComposer, type ComposerIdentity, type ComposerPreset } from "./truth/ActionComposer";
import { EntryCard, type EntryAct } from "./truth/EntryCard";
import { GraphKey } from "./truth/GraphKey";
import { GuidedOverlay, overlayOpen } from "./truth/GuidedOverlay";
import { GuidedPanel } from "./truth/GuidedPanel";
import { useGuidedWalk } from "@/lib/use-guided-walk";
import { LedgerBoard } from "./truth/LedgerBoard";
import { ChainTape, Who } from "./truth/pieces";
import { TruthGraph } from "./truth/TruthGraph";

const POLL_MS = 20_000;
const INSTALL = "npm install @stenographer/core@^1";

/** Scroll smoothly, unless the reader asked for less motion. */
const scrollOpts = (block: ScrollLogicalPosition): ScrollIntoViewOptions => ({
  behavior: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  block,
});

/**
 * The page opens on the public truth ledger itself: a live web of claims
 * and the people and agents behind them. Pick a node to read it and act on
 * it; make a claim and watch it appear.
 */
export function LedgerHero() {
  const [model, setModel] = useState<ReadModel | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"graph" | "list">("graph");
  const [selected, setSelected] = useState<string | null>(null);
  const [identity, setIdentity] = useState<ComposerIdentity>(() => ({ ...loadIdentity(), session: browserSession() }));
  const [preset, setPreset] = useState<ComposerPreset | null>(null);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const [guided, setGuided] = useState(false);
  /** The tallest scene the walk has shown so far: the graph panel is never shorter, so no choice is cut off and the page stops jumping. */
  const [sceneH, setSceneH] = useState(0);
  const growScene = useCallback((h: number) => setSceneH((m) => Math.max(m, h)), []);
  const walk = useGuidedWalk({ onHighlight: setHighlight, onSelect: setSelected });
  const sandboxModel = walk.model;
  const panelRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setModel(await publicLedger.read());
      setFailed(false);
    } catch {
      // Never show the raw error: the page says in plain words that the ledger is not answering.
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  /** What the graph shows: the live ledger, or the sandbox while the guided walk runs. */
  const shown = guided ? sandboxModel : model;
  const byId = useMemo(() => new Map((shown?.entries ?? []).map((e) => [e.id, e])), [shown]);
  const selectedEntry = selected ? byId.get(selected) ?? null : null;
  const selectedWho = selected && !selectedEntry && selected.startsWith("who:") ? selected.slice(4) : null;

  const onIdentity = (next: ComposerIdentity) => {
    setIdentity(next);
    saveIdentity({ by: next.by, role: next.role });
  };

  const openComposer = (p: ComposerPreset | null) => {
    setPreset(p);
    setSelected(null);
    panelRef.current?.scrollIntoView(scrollOpts("nearest"));
  };

  const startGuided = () => {
    setGuided(true);
    setSelected(null);
    setHighlight(new Set());
    setView("graph");
    graphRef.current?.scrollIntoView(scrollOpts("start"));
  };
  const exitGuided = () => {
    setGuided(false);
    setSceneH(0);
    setSelected(null);
    setHighlight(new Set());
    void walk.reset();
    void refresh();
  };

  const onAct = (act: EntryAct, entry: EntryView) =>
    openComposer(act === "challenge" ? { kind: "claim", contests: entry.id } : act === "withdraw" ? { kind: "strike", targetId: entry.id } : { kind: act, targetId: entry.id });

  const onDone = async (r: ActResponse) => {
    if (!r.ok) return;
    const ids = new Set(r.lines.map((l) => l.id));
    if (r.outcome.kind === "promoted") ids.add(r.outcome.tb);
    setHighlight(ids);
    await refresh();
    const focus = r.outcome.kind === "promoted" ? r.outcome.tb : r.outcome.kind === "asserted" ? r.outcome.id : r.outcome.id;
    setSelected(focus);
    setView("graph");
    setTimeout(() => setHighlight(new Set()), 4000);
  };

  const whoEntries = useMemo(() => {
    if (!selectedWho || !shown) return [];
    return shown.entries.filter((e) => {
      const names = [e.line.author, e.line.signedBy, ...((e.line.approvals as Array<{ by: string }> | undefined) ?? []).map((a) => a.by), ...(e.approvals?.records ?? []).map((a) => a.by)];
      return names.some((n) => typeof n === "string" && n.normalize("NFKC").trim().toLowerCase() === selectedWho);
    });
  }, [selectedWho, shown]);

  const counts = shown?.counts;
  const head = shown?.head ? hash12(shown.head.hash) : null;
  /** "Live" is claimed only after a successful read. */
  const live = !guided && !!model && !failed;
  /** The scene is on the graph only while the graph is showing and the walk is waiting for a pick. */
  const overlayShown = guided && view === "graph" && !!shown && overlayOpen(walk);

  return (
    <section id="top" className="pb-16 pt-[calc(var(--nav-h)+48px)] lg:pb-16 lg:pt-[calc(var(--nav-h)+56px)]">
      <motion.div initial="hidden" animate="visible" variants={stagger} className="page-container">
        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-12 lg:items-end">
          <motion.h1 variants={fadeUp} className="text-display lg:col-span-7 lg:text-[56px]">
            <span className="block">Agents find the facts.</span>
            <span className="block">People sign them.</span>
            <span className="block text-muted-foreground">Everyone can see the work</span>
          </motion.h1>
          <div className="flex flex-col gap-6 lg:col-span-5">
            <motion.p variants={fadeUp} className="text-lead text-secondary-foreground">
              <span className="text-foreground">An MCP court reporter for the agents you run.</span> A claim lands here as a UV, unverified, and becomes a TB, signed truth, only when a person approves it and one other approver agrees.
            </motion.p>
            <motion.div variants={fadeUp} className="grid w-fit max-w-full gap-3 sm:flex sm:w-auto sm:flex-wrap lg:grid lg:w-fit">
              <button type="button" onClick={startGuided} className="btn btn-primary btn-lg">
                Walk through a claim
              </button>
              <CopyButton text={INSTALL} ariaLabel={`Copy ${INSTALL}`} className="btn btn-secondary btn-lg min-w-0 max-w-full font-mono text-sm" label={<span className="truncate">{INSTALL}</span>} />
            </motion.div>
          </div>
        </div>

        <motion.div variants={fadeUp} className="mt-8 grid items-start gap-4 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-4">
          <div ref={graphRef} className="panel overflow-hidden" role="region" aria-label="The public truth ledger">
            <div className="panel-header flex-wrap">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono tabular-nums">
                {guided ? (
                  <span className="text-foreground">Sandbox · nothing is saved</span>
                ) : live ? (
                  <span>
                    <span className="text-foreground">Live</span>
                    {head && <span className="hidden sm:inline lg:hidden xl:inline"> · head {head}</span>}
                  </span>
                ) : (
                  <span className="text-foreground">{failed ? (model ? "Out of date" : "Not answering") : "Reading the ledger"}</span>
                )}
                {counts && (
                  <>
                    <span>{counts.tb} TB</span>
                    <span>{counts.uv} UV</span>
                    <span className="hidden sm:inline">{counts.lines} lines</span>
                  </>
                )}
              </p>
              <div className="ml-auto flex items-center gap-1">
                {!guided && (
                  <button type="button" onClick={() => void refresh()} className="btn btn-ghost btn-sm w-8 px-0" aria-label="Refresh the ledger" disabled={loading}>
                    <RefreshCw className={loading ? "animate-spin" : ""} />
                  </button>
                )}
                <div className="flex gap-1" role="group" aria-label="View">
                  {(["graph", "list"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} aria-label={v === "graph" ? "Graph view" : "List view"} className="tab-item h-8 px-2 sm:px-3">
                      {v === "graph" ? <Waypoints /> : <List />}
                      <span className="hidden sm:inline">{v === "graph" ? "Graph" : "List"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {failed && model && !guided && (
              <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 text-sm leading-5 text-secondary-foreground">
                <span>The ledger is not answering. Showing the last read.</span>
                <button type="button" onClick={() => void refresh()} className="btn btn-ghost btn-sm" disabled={loading}>
                  Retry
                </button>
              </div>
            )}

            {shown && view === "graph" && (
              <div className="grid" style={guided && sceneH ? { minHeight: sceneH } : undefined}>
                <div inert={overlayShown} className="[grid-area:1/1]">
                  <TruthGraph
                    key={guided ? "sandbox" : "live"}
                    model={shown}
                    selected={selected}
                    onSelect={setSelected}
                    highlight={highlight}
                    minHeight={Math.max(520, guided ? sceneH : 0)}
                    mobileHeight={guided ? Math.max(440, sceneH) : 320}
                    emptyMessage={guided ? null : undefined}
                  />
                </div>
                {guided && <GuidedOverlay walk={walk} onExit={exitGuided} onMeasure={growScene} />}
              </div>
            )}
            {shown && view === "list" && (
              <div className="p-4">
                <LedgerBoard model={shown} highlight={highlight} onAct={guided ? undefined : onAct} actorName={identity.by} emptyText={guided ? "Empty. Press Start" : "The ledger is empty. Make the first claim"} />
              </div>
            )}
            {!shown && (
              <div className="flex min-h-[320px] flex-col items-start justify-center gap-6 p-6 sm:p-8 lg:min-h-[520px]">
                {failed && !guided ? (
                  <>
                    <p className="max-w-md text-lg leading-7">
                      <span className="text-foreground">The public ledger is not answering.</span> <span className="text-secondary-foreground">The walk runs in your browser either way.</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <button type="button" onClick={() => void refresh()} className="btn btn-secondary h-10" disabled={loading}>
                        <RefreshCw className={loading ? "animate-spin" : ""} /> Retry
                      </button>
                      <button type="button" onClick={startGuided} className="inline-flex min-h-8 items-center text-sm text-secondary-foreground underline decoration-border-strong underline-offset-4 transition-quiet hover:text-foreground">
                        or walk through a claim
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-secondary-foreground">
                    <Loader2 className="icon animate-spin" /> {guided ? "Setting up the sandbox" : "Reading the ledger"}
                  </p>
                )}
              </div>
            )}

            {shown && view === "graph" && (
              <>
                <div className="border-t border-border p-4">
                  <GraphKey />
                </div>
                <div className="border-t border-border p-4">
                  <ChainTape lines={shown.lines} highlight={highlight} />
                </div>
              </>
            )}

            <p className="border-t border-border p-4 text-sm leading-5 text-muted-foreground">
              <a href="/api/ledger/export" className="inline-flex items-center gap-2 text-secondary-foreground underline decoration-border-strong underline-offset-4 transition-quiet hover:text-foreground">
                <Download className="icon" /> /api/ledger/export
              </a>{" "}
              is the whole stream as truth-format JSONL, for <code className="font-mono text-xs">import_wiki_entries</code>.{" "}
              <a href="#rules" className="text-secondary-foreground underline decoration-border-strong underline-offset-4 transition-quiet hover:text-foreground">
                The rules
              </a>
            </p>
          </div>
          </div>

          <div ref={panelRef} className="flex flex-col gap-4">
            {guided ? (
              <>
                <GuidedPanel walk={walk} onExit={exitGuided} sceneOnGraph={overlayShown} />
                {selectedEntry && <EntryCard entry={selectedEntry} byId={byId} highlight={highlight.has(selectedEntry.id)} />}
              </>
            ) : (
              <AnimatePresence mode="wait">
                {selectedEntry ? (
                  <motion.div key={selectedEntry.id} {...tabPanel} className="flex flex-col gap-4">
                    <button type="button" onClick={() => setSelected(null)} className="btn btn-ghost btn-sm -ml-3 self-start">
                      <ArrowLeft /> Back to the composer
                    </button>
                    <EntryCard entry={selectedEntry} byId={byId} highlight={highlight.has(selectedEntry.id)} onAct={onAct} actorName={identity.by} />
                    <p className="text-sm leading-5 text-muted-foreground">Select another node to read it. Approve, refute, challenge or strike opens the composer with this entry filled in.</p>
                  </motion.div>
                ) : selectedWho ? (
                  <motion.div key={selectedWho} {...tabPanel} className="panel flex flex-col gap-3 p-4">
                    <button type="button" onClick={() => setSelected(null)} className="btn btn-ghost btn-sm -ml-3 self-start">
                      <ArrowLeft /> Back to the composer
                    </button>
                    <p className="text-sm leading-5 text-foreground">
                      <Who name={selectedWho} /> <span className="text-secondary-foreground">· {selectedWho.startsWith("agent:") ? "an agent identity" : "a person"} · on {whoEntries.length} {whoEntries.length === 1 ? "entry" : "entries"}</span>
                    </p>
                    <ul className="flex max-h-72 flex-col overflow-y-auto text-sm leading-5 text-secondary-foreground">
                      {whoEntries.map((e) => (
                        <li key={e.id}>
                          <button type="button" onClick={() => setSelected(e.id)} className="transition-quiet grid w-full grid-cols-[40px_1fr] text-left hover:bg-foreground/5">
                            <span className="margin-no py-2" aria-hidden>
                              {e.seq}
                            </span>
                            <span className="px-3 py-2">
                              <span className="font-mono text-xs text-muted-foreground">{e.marker}</span> {clip(String(e.type === "TB" ? e.line.claim : e.line.assertion), 80)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : (
                  <motion.div key="composer" {...tabPanel}>
                    <ActionComposer entries={model?.entries ?? []} identity={identity} onIdentity={onIdentity} run={publicLedger.run} preset={preset} onDone={onDone} />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
