import { ArrowDown, ArrowUpRight, Gavel, Hand, ShieldCheck, Swords, Undo2 } from "lucide-react";
import { sameIdentity } from "@/lib/truth/identity";
import type { ReactNode } from "react";
import type { EntryView } from "@/lib/truth/read";
import type { ApprovalRecord, Evidence } from "@/lib/truth/types";
import { Badge, EvidenceChips, Who, short, statusLook } from "./pieces";

export type EntryAct = "approve" | "refute" | "strike" | "challenge" | "withdraw";

export function EntryCard({
  entry,
  byId,
  highlight,
  onAct,
  canAct,
  actorName,
}: {
  entry: EntryView;
  byId: Map<string, EntryView>;
  highlight?: boolean;
  /** Who is reading: their own open claim offers Withdraw instead of Approve and Refute. */
  actorName?: string;
  /** Offer actions on this entry; the composer decides who may do them. */
  onAct?: (act: EntryAct, entry: EntryView) => void;
  canAct?: (act: EntryAct, entry: EntryView) => boolean;
}) {
  const look = statusLook(entry);
  const line = entry.line;
  const isTb = entry.type === "TB";
  const text = isTb ? (line.claim as string) : (line.assertion as string);
  const evidence = (line.evidence as Evidence[] | undefined) ?? [];
  const approvals = (line.approvals as ApprovalRecord[] | undefined) ?? [];
  const contestsTarget = entry.contests ? byId.get(entry.contests) : null;
  const literals = line.literals as Array<{ dead: string; subject?: string; current?: string }> | undefined;
  const acts: Array<{ act: EntryAct; label: string; icon: ReactNode }> = [];
  const own = !!actorName && sameIdentity(actorName, line.author);
  if (onAct) {
    if (entry.type === "UV" && entry.status === "open") {
      if (own) acts.push({ act: "withdraw", label: "Withdraw", icon: <Undo2 className="w-3.5 h-3.5" /> });
      else {
        acts.push({ act: "approve", label: "Approve", icon: <ShieldCheck className="w-3.5 h-3.5" /> });
        acts.push({ act: "refute", label: "Refute", icon: <Hand className="w-3.5 h-3.5" /> });
      }
    }
    if (isTb && (entry.status === "active" || entry.status === "contested")) acts.push({ act: "challenge", label: "Challenge", icon: <Swords className="w-3.5 h-3.5" /> });
    if (entry.status !== "struck" && !(own && entry.type === "UV" && entry.status === "open")) acts.push({ act: "strike", label: "Strike", icon: <Gavel className="w-3.5 h-3.5" /> });
  }

  return (
    <div className={`rounded-2xl border p-4 transition-all ${highlight ? "border-white/40 bg-white/[0.06]" : look.dead ? "border-white/5 bg-black/20 opacity-70" : isTb ? "border-primary/20 bg-primary/[0.03]" : "border-white/10 bg-card/40"}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge cls={look.cls}>{look.label}</Badge>
          <span className="font-mono text-[11px] text-muted-foreground">#{entry.seq} · {short(entry.id)}</span>
          {entry.freshness?.state === "stale" && <span className="font-mono text-[11px] text-sky-300/60">stale since {entry.freshness.expiresAt.slice(0, 10)}</span>}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">{line.ts.replace("T", " ").slice(0, 16)}Z</span>
      </div>

      <p className={`mt-2.5 text-sm sm:text-[15px] leading-relaxed ${look.dead ? "text-white/50 line-through decoration-white/20" : "text-white"}`}>{text}</p>

      {literals && literals.length > 0 && (
        <p className="mt-1.5 font-mono text-xs text-muted-foreground">
          {literals.map((l, i) => (
            <span key={i} className="mr-3">
              {l.subject ? `${l.subject} = ` : ""}
              <span className="text-red-400 line-through">{l.dead}</span>
              {l.current && <> → <span className="text-green-400">{l.current}</span></>}
            </span>
          ))}
        </p>
      )}

      {!isTb && typeof line.basis === "string" && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          <span className="text-white/60">basis</span> {line.basis as string}
          {!!line.verifyBy && typeof line.verifyBy === "object" && (
            <>
              {" · "}
              <span className="text-white/60">verify by</span> <span className="font-mono">{(line.verifyBy as { kind: string }).kind}: {(line.verifyBy as { value: string }).value}</span>
            </>
          )}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          {isTb ? "signed by" : "asserted by"} <Who name={(isTb ? (line.signedBy as string) : line.author) ?? line.author} />
        </span>
        {isTb && typeof line.answerableBy === "string" && (
          <span>
            answers for it <Who name={line.answerableBy} />
          </span>
        )}
        {!isTb && (line["x-steno"] as { agentSessionId?: string | null })?.agentSessionId && <span className="font-mono">session {(line["x-steno"] as { agentSessionId: string }).agentSessionId}</span>}
      </div>

      {evidence.length > 0 && (
        <div className="mt-2.5">
          <EvidenceChips evidence={evidence} />
        </div>
      )}

      {contestsTarget && (
        <p className="mt-2.5 text-xs text-orange-300/90 flex items-center gap-1.5">
          <Swords className="w-3.5 h-3.5" /> contests TB {short(contestsTarget.id)}: “{String(contestsTarget.line.claim).slice(0, 80)}{String(contestsTarget.line.claim).length > 80 ? "…" : ""}”
        </p>
      )}
      {isTb && entry.contestedBy.length > 0 && (
        <div className="mt-2.5 space-y-1">
          {entry.contestedBy.map((id) => {
            const uv = byId.get(id);
            return (
              <p key={id} className="text-xs text-orange-300/90 flex items-center gap-1.5">
                <ArrowDown className="w-3.5 h-3.5" /> appealed by {short(id)}: “{uv ? String(uv.line.assertion).slice(0, 80) : "?"}”
              </p>
            );
          })}
        </div>
      )}
      {entry.supersededBy && (
        <p className="mt-2.5 text-xs text-muted-foreground flex items-center gap-1.5">
          <ArrowUpRight className="w-3.5 h-3.5" /> {isTb ? "superseded by" : "promoted to"} TB {short(entry.supersededBy)}
        </p>
      )}

      {isTb && approvals.length > 0 && (
        <p className="mt-2.5 text-xs text-muted-foreground">
          promoted on {approvals.length} approvals:{" "}
          {approvals.map((a, i) => (
            <span key={i}>
              <Who name={a.by} role={a.role} />
              {a.agentSessionId ? <span className="font-mono text-white/40"> ({a.agentSessionId})</span> : ""}
              {i < approvals.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}

      {!isTb && entry.status === "open" && entry.approvals && (
        <div className="mt-3 rounded-lg border border-white/5 bg-black/30 p-2.5 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-white/80 font-medium">
              {entry.approvals.approvers === 0 ? "No approvals yet" : `${entry.approvals.approvers} approver${entry.approvals.approvers === 1 ? "" : "s"}`}
              {entry.approvals.human && <span className="text-muted-foreground"> · a person: {entry.approvals.human}</span>}
              {entry.approvals.agentSessions > 0 && <span className="text-muted-foreground"> · {entry.approvals.agentSessions} agent session{entry.approvals.agentSessions === 1 ? "" : "s"}</span>}
            </span>
            <span className="text-muted-foreground">to promote: {entry.approvals.missing.length === 0 ? "ready" : entry.approvals.missing.join(", ")}</span>
          </div>
          {entry.approvals.records.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {entry.approvals.records.map((r, i) => (
                <li key={i} className="flex items-center gap-2 flex-wrap text-muted-foreground">
                  <Who name={r.by} role={r.role} />
                  {r.agentSessionId && <span className="font-mono text-white/40">{r.agentSessionId}</span>}
                  <EvidenceChips evidence={r.evidence} />
                  {r.note && <span className="italic">“{r.note}”</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {acts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {acts.map((a) => {
            const allowed = canAct ? canAct(a.act, entry) : true;
            return (
              <button
                key={a.act}
                onClick={() => onAct?.(a.act, entry)}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${allowed ? "border-white/10 hover:border-white/30 text-white/80" : "border-white/5 text-white/30"}`}
                title={allowed ? undefined : "the engine will say why not"}
              >
                {a.icon} {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
