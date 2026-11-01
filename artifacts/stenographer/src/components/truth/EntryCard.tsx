import { ArrowDown, ArrowUpRight, Gavel, Hand, Scale, ShieldCheck, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import { clip, fmtTs } from "@/lib/format";
import { sameIdentity } from "@/lib/truth/identity";
import type { EntryView } from "@/lib/truth/read";
import type { ApprovalRecord, Evidence } from "@/lib/truth/types";
import { EvidenceTags, Status, Who, short, statusLook } from "./pieces";

export type EntryAct = "approve" | "refute" | "strike" | "challenge" | "withdraw";

/**
 * One ledger line as it reads in a transcript: the line number in the margin,
 * then the claim, who stands behind it, its evidence and what can be done.
 */
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
      if (own) acts.push({ act: "withdraw", label: "Withdraw", icon: <Undo2 /> });
      else {
        acts.push({ act: "approve", label: "Approve", icon: <ShieldCheck /> });
        acts.push({ act: "refute", label: "Refute", icon: <Hand /> });
      }
    }
    if (isTb && (entry.status === "active" || entry.status === "contested")) acts.push({ act: "challenge", label: "Challenge", icon: <Scale /> });
    if (entry.status !== "struck" && !(own && entry.type === "UV" && entry.status === "open")) acts.push({ act: "strike", label: "Strike", icon: <Gavel /> });
  }

  return (
    <article
      className={`grid shrink-0 grid-cols-[40px_1fr] overflow-hidden rounded-card border bg-card transition-colors ${highlight ? "border-secondary-foreground" : "border-border"} ${look.dead ? "border-dashed" : ""}`}
    >
      <div className="margin-no pt-4" aria-hidden>
        {entry.seq}
      </div>
      <div className="flex min-w-0 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="sr-only">Line {entry.seq}</span>
            <Status entry={entry} />
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{short(entry.id)}</span>
            {entry.freshness?.state === "stale" && <span className="font-mono text-xs tabular-nums text-muted-foreground">stale since {entry.freshness.expiresAt.slice(0, 10)}</span>}
          </div>
          <time dateTime={line.ts} className="font-mono text-xs tabular-nums text-muted-foreground">
            {fmtTs(line.ts)}
          </time>
        </div>

        <p className={`text-base leading-6 ${look.dead ? "text-muted-foreground line-through decoration-border-strong" : "text-foreground"}`}>{text}</p>

        {literals && literals.length > 0 && (
          <p className="font-mono text-xs leading-5 tabular-nums text-secondary-foreground">
            {literals.map((l, i) => (
              <span key={i} className="mr-4">
                {l.subject ? `${l.subject} = ` : ""}
                <span className="text-muted-foreground line-through">{l.dead}</span>
                {l.current && <> → <span className="text-foreground">{l.current}</span></>}
              </span>
            ))}
          </p>
        )}

        {!isTb && typeof line.basis === "string" && (
          <p className="text-sm leading-5 text-secondary-foreground">
            <span className="text-muted-foreground">Basis</span> {line.basis as string}
            {!!line.verifyBy && typeof line.verifyBy === "object" && (
              <>
                {" · "}
                <span className="text-muted-foreground">Verify by</span> <span className="font-mono text-xs">{(line.verifyBy as { kind: string }).kind}: {(line.verifyBy as { value: string }).value}</span>
              </>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm leading-5 text-secondary-foreground">
          <span>
            {isTb ? "Signed by" : "Asserted by"} <Who name={(isTb ? (line.signedBy as string) : line.author) ?? line.author} />
          </span>
          {isTb && typeof line.answerableBy === "string" && (
            <span>
              Answers for it <Who name={line.answerableBy} />
            </span>
          )}
          {!isTb && (line["x-steno"] as { agentSessionId?: string | null })?.agentSessionId && <span className="font-mono text-xs tabular-nums">session {(line["x-steno"] as { agentSessionId: string }).agentSessionId}</span>}
        </div>

        {evidence.length > 0 && <EvidenceTags evidence={evidence} />}

        {contestsTarget && (
          <p className="flex items-start gap-2 text-sm leading-5 text-secondary-foreground">
            <Scale className="icon mt-0.5" /> Contests TB {short(contestsTarget.id)}: “{clip(String(contestsTarget.line.claim), 80)}”
          </p>
        )}
        {isTb &&
          entry.contestedBy.map((id) => {
            const uv = byId.get(id);
            return (
              <p key={id} className="flex items-start gap-2 text-sm leading-5 text-secondary-foreground">
                <ArrowDown className="icon mt-0.5" /> Appealed by {short(id)}: “{uv ? clip(String(uv.line.assertion), 80) : "?"}”
              </p>
            );
          })}
        {entry.supersededBy && (
          <p className="flex items-start gap-2 text-sm leading-5 text-secondary-foreground">
            <ArrowUpRight className="icon mt-0.5" /> {isTb ? "Superseded by" : "Promoted to"} TB {short(entry.supersededBy)}
          </p>
        )}

        {isTb && approvals.length > 0 && (
          <p className="text-sm leading-5 text-secondary-foreground">
            Promoted on {approvals.length} approvals:{" "}
            {approvals.map((a, i) => (
              <span key={i}>
                <Who name={a.by} />
                {a.agentSessionId ? <span className="font-mono text-xs text-muted-foreground"> ({a.agentSessionId})</span> : ""}
                {i < approvals.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}

        {!isTb && entry.status === "open" && entry.approvals && (
          <div className="rounded-tag border border-border p-3 text-sm leading-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="font-medium text-foreground">
                {entry.approvals.approvers === 0 ? "No approvals yet" : `${entry.approvals.approvers} approver${entry.approvals.approvers === 1 ? "" : "s"}`}
                {entry.approvals.human && <span className="font-normal text-secondary-foreground"> · a person: {entry.approvals.human}</span>}
                {entry.approvals.agentSessions > 0 && <span className="font-normal text-secondary-foreground"> · {entry.approvals.agentSessions} agent session{entry.approvals.agentSessions === 1 ? "" : "s"}</span>}
              </span>
              <span className="text-secondary-foreground">To promote: {entry.approvals.missing.length === 0 ? "ready" : entry.approvals.missing.join(", ")}</span>
            </div>
            {entry.approvals.records.length > 0 && (
              <ul className="mt-2 flex flex-col gap-2 text-secondary-foreground">
                {entry.approvals.records.map((r, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <Who name={r.by} />
                    {r.agentSessionId && <span className="font-mono text-xs tabular-nums text-muted-foreground">{r.agentSessionId}</span>}
                    <EvidenceTags evidence={r.evidence} />
                    {r.note && <span>“{r.note}”</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {acts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {acts.map((a) => {
              const allowed = canAct ? canAct(a.act, entry) : true;
              return (
                <button key={a.act} type="button" onClick={() => onAct?.(a.act, entry)} className={`btn btn-secondary btn-sm ${allowed ? "" : "opacity-60"}`} title={allowed ? undefined : "The engine will say why not"}>
                  {a.icon} {a.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
