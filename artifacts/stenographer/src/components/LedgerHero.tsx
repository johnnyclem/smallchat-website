import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Download, List, PlayCircle, RefreshCw, Share2, Waypoints } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CopyButton, fadeUp, stagger } from "@workspace/site-kit";
import { browserSession, loadIdentity, publicLedger, saveIdentity, type ActResponse } from "@/lib/ledger-client";
import type { EntryView, ReadModel } from "@/lib/truth/read";
import { ActionComposer, type ComposerIdentity, type ComposerPreset } from "./truth/ActionComposer";
import { EntryCard, type EntryAct } from "./truth/EntryCard";
import { GuidedOverlay } from "./truth/GuidedOverlay";
import { GuidedPanel } from "./truth/GuidedPanel";
import { useGuidedWalk } from "@/lib/use-guided-walk";
import { LedgerBoard } from "./truth/LedgerBoard";
import { ChainStrip, Who } from "./truth/pieces";
import { TruthGraph } from "./truth/TruthGraph";

const POLL_MS = 20_000;
const INSTALL = "npm install @stenographer/core@^1";

/**
 * The page opens on the public truth ledger itself: a live web of claims
 * and the people and agents behind them. Pick a node to read it and act on
 * it; make a claim and watch it appear.
 */
export function LedgerHero() {
  const [model, setModel] = useState<ReadModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"graph" | "list">("graph");
  const [selected, setSelected] = useState<string | null>(null);
  const [identity, setIdentity] = useState<ComposerIdentity>(() => ({ ...loadIdentity(), session: browserSession() }));
  const [preset, setPreset] = useState<ComposerPreset | null>(null);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const [guided, setGuided] = useState(false);
  const walk = useGuidedWalk({ onHighlight: setHighlight, onSelect: setSelected });
  const sandboxModel = walk.model;
  const panelRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setModel(await publicLedger.read());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const startGuided = () => {
    setGuided(true);
    setSelected(null);
    setHighlight(new Set());
    setView("graph");
    graphRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const exitGuided = () => {
    setGuided(false);
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

  return (
    <section id="top" className="pt-24 sm:pt-28 pb-10 px-4 sm:px-6">
      <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
          <div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground mb-4">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              The public truth ledger · live · hash-chained
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold tracking-tighter text-gradient leading-none">
              stenographer.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-3 text-lg md:text-xl text-white/90 font-medium tracking-tight max-w-2xl">
              Agents find the facts. People sign them. Everyone can see the work.
            </motion.p>
            <motion.p variants={fadeUp} className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Make a claim and it lands here as a UV. It becomes a TB only when a person approves it and one other approver agrees.
              Challenge any TB and it goes under appeal, still truth, until someone resolves it. Nothing is ever edited.
            </motion.p>
          </div>
          <motion.div variants={fadeUp} className="flex items-center gap-2 flex-wrap">
            <button onClick={startGuided} className="btn btn-primary h-10 px-4 text-sm">
              <PlayCircle className="w-4 h-4" /> Watch it happen
            </button>
            <CopyButton text={INSTALL} className="btn btn-glass h-10 px-4 font-mono text-xs" label={<span className="truncate">{INSTALL}</span>} />
          </motion.div>
        </div>

        <motion.div variants={fadeUp} className="grid lg:grid-cols-[1fr_380px] gap-4 items-start">
          <div ref={graphRef} className="glass-panel rounded-2xl overflow-hidden scroll-mt-20">
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-white/5 text-xs">
              <div className="flex items-center gap-3 text-muted-foreground font-mono">
                {guided && <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">SANDBOX</span>}
                <span>
                  <span className="text-primary font-semibold">{counts ? counts.tb : "–"}</span> TB
                </span>
                <span>
                  <span className="text-sky-300 font-semibold">{counts ? counts.uv : "–"}</span> UV
                </span>
                <span className="hidden sm:inline">
                  <span className="text-white/80 font-semibold">{counts ? counts.lines : "–"}</span> lines
                </span>
                {shown?.head && <span className="hidden md:inline text-white/40">head {shown.head.hash.slice(0, 10)}…</span>}
              </div>
              <div className="flex items-center gap-1">
                {!guided && (
                  <button onClick={() => void refresh()} className="p-1.5 rounded-md text-muted-foreground hover:text-white cursor-pointer" title="refresh" disabled={loading}>
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  </button>
                )}
                <div className="flex rounded-md border border-white/10 overflow-hidden">
                  {(["graph", "list"] as const).map((v) => (
                    <button key={v} onClick={() => setView(v)} className={`inline-flex items-center gap-1 px-2 py-1 cursor-pointer ${view === v ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white/80"}`}>
                      {v === "graph" ? <Waypoints className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />} {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && !guided && <p className="px-4 py-3 text-sm text-red-400">Couldn't reach the ledger: {error}</p>}
            {shown && view === "graph" && (
              <div className="relative">
                <TruthGraph key={guided ? "sandbox" : "live"} model={shown} selected={selected} onSelect={setSelected} highlight={highlight} minHeight={440} />
                {guided && <GuidedOverlay walk={walk} onExit={exitGuided} />}
              </div>
            )}
            {shown && view === "list" && (
              <div className="p-3 sm:p-4">
                <LedgerBoard model={shown} highlight={highlight} onAct={guided ? undefined : onAct} actorName={identity.by} emptyText={guided ? "Empty. Press Start." : "The ledger is empty. Make the first claim."} />
              </div>
            )}
            {!shown && !error && <div className="h-[440px] flex items-center justify-center text-sm text-muted-foreground">{guided ? "setting up the sandbox…" : "loading the stream…"}</div>}
            {shown && view === "graph" && (
              <div className="px-3 sm:px-4 py-2 border-t border-white/5">
                <ChainStrip lines={shown.lines} highlight={highlight} />
              </div>
            )}
          </div>

          <div ref={panelRef} className="scroll-mt-24 space-y-3">
            {guided && (
              <>
                <GuidedPanel walk={walk} onExit={exitGuided} />
                {selectedEntry && <EntryCard entry={selectedEntry} byId={byId} highlight={highlight.has(selectedEntry.id)} />}
              </>
            )}
            {!guided && (
            <AnimatePresence mode="wait">
              {selectedEntry ? (
                <motion.div key={selectedEntry.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }} className="space-y-2">
                  <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> back to the composer
                  </button>
                  <EntryCard entry={selectedEntry} byId={byId} highlight={highlight.has(selectedEntry.id)} onAct={onAct} actorName={identity.by} />
                  <p className="text-[11px] text-muted-foreground">Click another node to read it. Approve, refute, challenge or strike opens the composer with this entry filled in.</p>
                </motion.div>
              ) : selectedWho ? (
                <motion.div key={selectedWho} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }} className="glass-panel rounded-2xl p-4 space-y-2">
                  <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
                    <ArrowLeft className="w-3.5 h-3.5" /> back to the composer
                  </button>
                  <p className="text-sm text-white">
                    <Who name={selectedWho} /> <span className="text-muted-foreground">· {selectedWho.startsWith("agent:") ? "an agent identity" : "a person"} · on {whoEntries.length} entr{whoEntries.length === 1 ? "y" : "ies"}</span>
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground max-h-72 overflow-y-auto">
                    {whoEntries.map((e) => (
                      <li key={e.id}>
                        <button onClick={() => setSelected(e.id)} className="text-left hover:text-white cursor-pointer">
                          <span className="font-mono text-white/60">{e.marker}</span> {String(e.type === "TB" ? e.line.claim : e.line.assertion).slice(0, 80)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.div key="composer" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                  {model && <ActionComposer entries={model.entries} identity={identity} onIdentity={onIdentity} run={publicLedger.run} preset={preset} onDone={onDone} />}
                </motion.div>
              )}
            </AnimatePresence>
            )}
            <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
              <a href="/api/ledger/export" className="inline-flex items-center gap-1 text-white/80 hover:text-white">
                <Download className="w-3.5 h-3.5" /> /api/ledger/export
              </a>{" "}
              is the whole stream as truth-format JSONL, for <code className="font-mono">import_wiki_entries</code>.{" "}
              <a href="#rules" className="inline-flex items-center gap-1 text-white/80 hover:text-white">
                <Share2 className="w-3.5 h-3.5" /> the rules
              </a>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
