import { Download, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CommandBlock } from "@workspace/site-kit";
import { browserSession, loadIdentity, publicLedger, saveIdentity, type ActResponse } from "@/lib/ledger-client";
import type { ReadModel, EntryView } from "@/lib/truth/read";
import { ActionComposer, type ComposerIdentity, type ComposerPreset } from "./truth/ActionComposer";
import type { EntryAct } from "./truth/EntryCard";
import { LedgerBoard } from "./truth/LedgerBoard";

const POLL_MS = 30_000;

/** The permanent, public truth ledger: anyone can claim or challenge; a TB takes the same promotion as everywhere else. */
export function PublicLedger() {
  const [model, setModel] = useState<ReadModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [identity, setIdentity] = useState<ComposerIdentity>(() => ({ ...loadIdentity(), session: browserSession() }));
  const [preset, setPreset] = useState<ComposerPreset | null>(null);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const composerRef = useRef<HTMLDivElement>(null);

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

  const onIdentity = (next: ComposerIdentity) => {
    setIdentity(next);
    saveIdentity({ by: next.by, role: next.role });
  };

  const onAct = (act: EntryAct, entry: EntryView) => {
    setPreset(act === "challenge" ? { kind: "claim", contests: entry.id } : { kind: act, targetId: entry.id });
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onDone = (r: ActResponse) => {
    if (r.ok) setHighlight(new Set(r.lines.map((l) => l.id)));
    void refresh();
  };

  const stats = useMemo(() => {
    if (!model) return null;
    const tbs = model.entries.filter((e) => e.type === "TB" && e.current).length;
    const open = model.docket.open.length;
    const appeals = model.docket.appeals.length;
    return { tbs, open, appeals, lines: model.counts.lines };
  }, [model]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "ground truth", value: stats?.tbs ?? "–", sub: "active or under appeal" },
          { label: "open flags", value: stats?.open ?? "–", sub: "UVs waiting on a person" },
          { label: "appeals", value: stats?.appeals ?? "–", sub: "TBs contested" },
          { label: "lines", value: stats?.lines ?? "–", sub: model?.head ? `head ${model.head.hash.slice(0, 8)}…` : "empty" },
        ].map((s) => (
          <div key={s.label} className="glass-panel rounded-xl px-4 py-3">
            <div className="text-2xl font-bold text-white tabular-nums">{s.value}</div>
            <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">{s.label}</div>
            <div className="text-[11px] text-muted-foreground/70 font-mono truncate">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-5 sm:gap-6 items-start">
        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">On the record · live</p>
            <button onClick={() => void refresh()} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer" disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> refresh
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mb-3">Couldn't reach the ledger: {error}</p>}
          {model ? (
            <LedgerBoard model={model} highlight={highlight} onAct={onAct} emptyText="The ledger is empty. Make the first claim." defaultFilter="all" />
          ) : (
            !error && <p className="text-sm text-muted-foreground py-6 text-center">loading the stream…</p>
          )}
        </div>
        <div ref={composerRef} className="scroll-mt-24 space-y-4">
          {model && <ActionComposer entries={model.entries} identity={identity} onIdentity={onIdentity} run={publicLedger.run} preset={preset} onDone={onDone} />}
          <CommandBlock
            title="take it with you · the stream is truth format v2"
            commands={["curl -sS https://stenographer.smallchat.dev/api/ledger/export > wiki/public.jsonl", "stenographer verify ./stenographer.db   # after import_wiki_entries"]}
          />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <a href="/api/ledger/export" className="inline-flex items-center gap-1 text-white/80 hover:text-white">
              <Download className="w-3.5 h-3.5" /> /api/ledger/export
            </a>{" "}
            is the whole stream, hash-chained, one JSON line per entry, as <code className="font-mono">export_wiki_entries</code> would write it. A stenographer that imports it takes a TB only where a person signed it, which here is every one.
          </p>
        </div>
      </div>
    </div>
  );
}
