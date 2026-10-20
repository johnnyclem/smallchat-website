import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Gavel, ShieldCheck, Undo2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ActResponse } from "@/lib/ledger-client";
import { verifyChain, type ChainProblem } from "@/lib/truth/chain";
import type { EntryView } from "@/lib/truth/read";
import type { Evidence, Line, Suggestion } from "@/lib/truth/types";

export const short = (id: string) => (id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id);

/** How a status reads, and the colour it wears. */
export function statusLook(e: Pick<EntryView, "type" | "status" | "corroborated" | "freshness">): { label: string; cls: string; dead: boolean } {
  if (e.type === "TB") {
    switch (e.status) {
      case "active":
        return { label: "TB · ground truth", cls: "bg-primary/15 text-primary border-primary/30", dead: false };
      case "contested":
        return { label: "TB · under appeal", cls: "bg-orange-500/15 text-orange-300 border-orange-500/30", dead: false };
      case "overridden":
        return { label: "TB · overridden", cls: "bg-white/5 text-white/40 border-white/10", dead: true };
      default:
        return { label: `TB · ${e.status}`, cls: "bg-white/5 text-white/40 border-white/10", dead: true };
    }
  }
  switch (e.status) {
    case "open":
      if (e.corroborated) return { label: "UV · corroborated", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", dead: false };
      if (e.freshness?.state === "stale") return { label: "UV · stale", cls: "bg-sky-500/10 text-sky-300/60 border-sky-500/20", dead: false };
      return { label: "UV · unverified", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30", dead: false };
    case "verified":
      return { label: "UV · verified", cls: "bg-white/5 text-white/50 border-white/10", dead: true };
    case "refuted":
      return { label: "UV · refuted", cls: "bg-red-500/10 text-red-300/70 border-red-500/20", dead: true };
    default:
      return { label: `UV · ${e.status}`, cls: "bg-white/5 text-white/40 border-white/10", dead: true };
  }
}

export function Badge({ children, cls = "bg-white/5 text-muted-foreground border-white/10" }: { children: ReactNode; cls?: string }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[11px] font-semibold tracking-wide ${cls}`}>{children}</span>;
}

export function EvidenceChips({ evidence }: { evidence: Evidence[] }) {
  if (!evidence?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {evidence.map((e, i) => (
        <span key={i} title={e.detail} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 border border-white/10 font-mono text-[11px] text-white/70 max-w-full">
          <span className="text-muted-foreground">{e.kind}</span>
          <span className="truncate">{e.ref}</span>
        </span>
      ))}
    </div>
  );
}

export function Who({ name, role }: { name: string; role?: "human" | "agent" | "reporter" | string }) {
  const agent = role === "agent" || name.toLowerCase().startsWith("agent:");
  return <span className={`font-mono text-xs ${agent ? "text-sky-300" : "text-white/90"}`}>{name}</span>;
}

/** The engine's answer to an action: what happened, or why it was refused. */
export function ResultBanner({ result, onSuggest }: { result: ActResponse | null; onSuggest?: (s: Suggestion) => void }) {
  const suggestion: Suggestion | null = !result
    ? null
    : result.ok
      ? result.outcome.kind === "struck" && result.outcome.withdrawn
        ? { kind: "claim-again", id: result.outcome.id }
        : null
      : result.refused && result.suggest
        ? result.suggest
        : null;
  return (
    <AnimatePresence mode="wait">
      {result && (
        <motion.div
          key={result.message}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={`rounded-xl border p-4 ${result.ok ? "border-green-500/30 bg-green-500/5" : result.refused ? "border-red-500/40 bg-red-500/10" : "border-white/10 bg-white/[0.03]"}`}
        >
          <div className={`flex items-center gap-2 font-semibold text-sm ${result.ok ? "text-green-400" : result.refused ? "text-red-400" : "text-white/80"}`}>
            {result.ok ? <Check className="w-4 h-4" /> : result.refused ? <Gavel className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {result.ok ? outcomeTitle(result.outcome.kind) : result.refused ? "Refused" : "Not written"}
            {result.ok === false && result.refused && <span className="ml-auto font-mono text-[11px] text-red-300/80 font-normal">rule · {result.rule}</span>}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{result.message}</p>
          {result.ok && result.lines.length > 0 && (
            <p className="mt-2 font-mono text-[11px] text-white/50">
              appended {result.lines.map((l) => `#${l.seq} ${l.type}${typeof l.status === "string" && l.type === "TRANSITION" ? `→${l.status}` : ""}`).join(" · ")}
            </p>
          )}
          {result.ok && result.lines.length === 0 && <p className="mt-2 font-mono text-[11px] text-white/50">no line written: an approval waits beside the ledger until a promotion writes it into a TB</p>}
          {suggestion && onSuggest && (
            <button onClick={() => onSuggest(suggestion)} className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.06] text-white hover:bg-white/10 cursor-pointer">
              <Undo2 className="w-3.5 h-3.5" /> {suggestion.kind === "withdraw" ? "Withdraw it instead" : "File a corrected claim"}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function outcomeTitle(kind: string): string {
  switch (kind) {
    case "asserted":
      return "On the record";
    case "approved":
      return "Approval recorded";
    case "nominated":
      return "Nominated";
    case "promoted":
      return "Promoted to TB";
    case "refuted":
      return "Refuted";
    case "struck":
      return "Struck";
    default:
      return kind;
  }
}

const TYPE_COLOR: Record<string, string> = {
  TB: "bg-primary/70",
  UV: "bg-sky-400/70",
  ADDENDUM: "bg-green-400/70",
  RULING: "bg-red-400/70",
  TRANSITION: "bg-white/40",
};

/** The stream as a strip of blocks, hash-chained, with a verify button that re-hashes every line in the browser. */
export function ChainStrip({ lines, highlight, onPick }: { lines: Line[]; highlight?: Set<string>; onPick?: (line: Line) => void }) {
  const [verdict, setVerdict] = useState<{ problems: ChainProblem[]; at: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const verify = async () => {
    setBusy(true);
    try {
      setVerdict({ problems: await verifyChain(lines), at: Date.now() });
    } finally {
      setBusy(false);
    }
  };
  const head = lines[lines.length - 1];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          The chain · {lines.length} line{lines.length === 1 ? "" : "s"}
          {head && <span className="ml-2 normal-case tracking-normal font-mono text-white/50">head {head.hash.slice(0, 12)}…</span>}
        </p>
        <button onClick={verify} disabled={busy || lines.length === 0} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/25 text-white/80 disabled:opacity-40 cursor-pointer transition-colors">
          <ShieldCheck className="w-3.5 h-3.5" /> {busy ? "verifying…" : "Verify in your browser"}
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {lines.length === 0 && <span className="text-xs text-muted-foreground">nothing written yet</span>}
        {lines.map((l) => (
          <button
            key={l.seq}
            title={`#${l.seq} ${l.type} ${l.id}\nhash ${l.hash}\nprev ${l.prevHash ?? "null"}`}
            onClick={() => onPick?.(l)}
            className={`group relative h-6 min-w-6 px-1 rounded-sm flex items-center justify-center font-mono text-[10px] text-black/80 cursor-pointer transition-transform hover:scale-110 ${TYPE_COLOR[l.type] ?? "bg-white/30"} ${highlight?.has(l.id) ? "ring-2 ring-white ring-offset-1 ring-offset-black" : ""}`}
          >
            {l.seq}
          </button>
        ))}
      </div>
      {verdict && (
        <p className={`text-xs flex items-center gap-1.5 ${verdict.problems.length === 0 ? "text-green-400" : "text-red-400"}`}>
          {verdict.problems.length === 0 ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {verdict.problems.length === 0
            ? `Every hash recomputes and every line names the one before it. SHA-256 over RFC 8785 JSON, ${lines.length} lines.`
            : `Line #${verdict.problems[0].seq ?? "?"}: ${verdict.problems[0].error}`}
        </p>
      )}
    </div>
  );
}
