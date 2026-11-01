import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Undo2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { tabPanel } from "@workspace/site-kit";
import type { ActResponse } from "@/lib/ledger-client";
import { hash12, shortId } from "@/lib/format";
import { verifyChain, type ChainProblem } from "@/lib/truth/chain";
import type { EntryView } from "@/lib/truth/read";
import type { Evidence, Line, Suggestion } from "@/lib/truth/types";
import { Glyph, type GlyphKind } from "./Glyph";

export const short = shortId;

/** Every id on the page reads the same way: a long ULID inside engine prose is cut to its short form. */
export const shortenIds = (text: string): string => text.replace(/\b[0-9A-HJKMNP-TV-Z]{26}\b/g, shortId);

/**
 * Where color says something, it is a small dot beside the words, not a
 * colored icon: good news, a refusal, or neither. 16px box, so labels align.
 */
export function StatusDot({ tone }: { tone: "positive" | "negative" | "neutral" }) {
  return (
    <span aria-hidden className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
      <span className={`h-2 w-2 rounded-full ${tone === "positive" ? "bg-positive" : tone === "negative" ? "bg-negative" : "bg-muted-foreground"}`} />
    </span>
  );
}

/** How a status reads: the shape it wears and the words after the type. */
export function statusLook(e: Pick<EntryView, "type" | "status" | "corroborated" | "freshness">): { type: "TB" | "UV"; rest: string; glyph: GlyphKind; dead: boolean } {
  if (e.type === "TB") {
    switch (e.status) {
      case "active":
        return { type: "TB", rest: "ground truth", glyph: "tb", dead: false };
      case "contested":
        return { type: "TB", rest: "under appeal", glyph: "tb-appeal", dead: false };
      default:
        return { type: "TB", rest: e.status, glyph: "tb-dead", dead: true };
    }
  }
  switch (e.status) {
    case "open":
      if (e.corroborated) return { type: "UV", rest: "corroborated", glyph: "uv-corroborated", dead: false };
      if (e.freshness?.state === "stale") return { type: "UV", rest: "stale", glyph: "uv", dead: false };
      return { type: "UV", rest: "unverified", glyph: "uv", dead: false };
    default:
      return { type: "UV", rest: e.status, glyph: "uv-dead", dead: true };
  }
}

/** A status as quiet text with its shape: "TB · ground truth". */
export function Status({ entry }: { entry: Pick<EntryView, "type" | "status" | "corroborated" | "freshness"> }) {
  const look = statusLook(entry);
  return (
    <span className="inline-flex items-center gap-2 text-sm leading-5 text-secondary-foreground">
      <Glyph kind={look.glyph} />
      <span>
        <span className={`text-foreground ${look.type === "TB" ? "font-semibold" : "font-medium"}`}>{look.type}</span> · {look.rest}
      </span>
    </span>
  );
}

/** A hairline tag in mono: evidence, a session, a count. 24 tall, radius 4. */
export function Tag({ children, title, className = "" }: { children: ReactNode; title?: string; className?: string }) {
  return (
    <span title={title} className={`inline-flex h-6 max-w-full items-center gap-2 rounded-tag border border-border px-2 font-mono text-xs tabular-nums text-secondary-foreground ${className}`}>
      {children}
    </span>
  );
}

export function EvidenceTags({ evidence }: { evidence: Evidence[] }) {
  if (!evidence?.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Evidence">
      {evidence.map((e, i) => (
        <li key={i} className="max-w-full">
          <Tag title={e.detail}>
            <span className="text-muted-foreground">{e.kind}</span>
            <span className="truncate">{e.ref}</span>
          </Tag>
        </li>
      ))}
    </ul>
  );
}

export function Who({ name }: { name: string }) {
  return <span className="font-mono text-xs text-foreground">{name}</span>;
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
    <div role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        {result && (
          <motion.div key={result.message} {...tabPanel} className="surface rounded-card p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <StatusDot tone={result.ok ? "positive" : result.refused ? "negative" : "neutral"} />
              {result.ok ? outcomeTitle(result.outcome.kind) : result.refused ? "Refused" : "Not written"}
              {result.ok === false && result.refused && <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">rule · {result.rule}</span>}
            </p>
            <p className="mt-2 text-sm leading-5 text-secondary-foreground">{shortenIds(result.message)}</p>
            {result.ok && result.lines.length > 0 && (
              <p className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">
                appended {result.lines.map((l) => `#${l.seq} ${l.type}${typeof l.status === "string" && l.type === "TRANSITION" ? `→${l.status}` : ""}`).join(" · ")}
              </p>
            )}
            {result.ok && result.lines.length === 0 && <p className="mt-2 font-mono text-xs text-muted-foreground">no line written: an approval waits beside the ledger until a promotion writes it into a TB</p>}
            {suggestion && onSuggest && (
              <button type="button" onClick={() => onSuggest(suggestion)} className="btn btn-secondary btn-sm mt-4">
                <Undo2 /> {suggestion.kind === "withdraw" ? "Withdraw it instead" : "File a corrected claim"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

/**
 * The stream as a numbered tape, one tick per line: a TB is amber, a ruling
 * has a red underline, everything else is a neutral step. The verify button
 * re-hashes every line in the browser.
 */
export function ChainTape({ lines, highlight }: { lines: Line[]; highlight?: Set<string> }) {
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-meta">
          The chain · {lines.length} {lines.length === 1 ? "line" : "lines"}
          {head && <> · head {hash12(head.hash)}</>}
        </p>
        <button type="button" onClick={verify} disabled={busy || lines.length === 0} className="btn btn-secondary btn-sm">
          <ShieldCheck /> {busy ? "Verifying" : "Verify in your browser"}
        </button>
      </div>
      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing written yet</p>
      ) : (
        <ol className="tape" aria-label="Ledger lines, oldest first" tabIndex={0}>
          {lines.map((l) => (
            <li key={l.seq} className="tick" data-type={l.type} data-new={highlight?.has(l.id) ? "true" : undefined} title={`#${l.seq} ${l.type} ${l.id}\nhash ${l.hash}\nprev ${l.prevHash ?? "null"}`} aria-label={`Line ${l.seq}, ${l.type}, hash ${hash12(l.hash)}`}>
              {l.seq}
            </li>
          ))}
        </ol>
      )}
      {verdict && (
        <p role="status" className="flex items-start gap-2 text-sm leading-5 text-secondary-foreground">
          <span className="mt-0.5">
            <StatusDot tone={verdict.problems.length === 0 ? "positive" : "negative"} />
          </span>
          {verdict.problems.length === 0
            ? `Every hash recomputes and every line names the one before it. SHA-256 over RFC 8785 JSON, ${lines.length} lines.`
            : `Line #${verdict.problems[0].seq ?? "?"}: ${verdict.problems[0].error}`}
        </p>
      )}
    </div>
  );
}
