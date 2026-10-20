import { Bot, Plus, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ActResponse } from "@/lib/ledger-client";
import type { Action } from "@/lib/truth/engine";
import type { EntryView } from "@/lib/truth/read";
import { sameIdentity } from "@/lib/truth/identity";
import { EVIDENCE_KINDS, SETTLING_EVIDENCE_KINDS, VERIFY_BY_KINDS, type Actor, type Evidence, type Suggestion } from "@/lib/truth/types";
import { Badge, ResultBanner, short } from "./pieces";

export type ComposerKind = "claim" | "approve" | "refute" | "strike";

export interface ComposerPreset {
  kind: ComposerKind;
  targetId?: string;
  contests?: string;
}

export interface ComposerIdentity {
  by: string;
  role: "human" | "agent";
  session: string;
}

const field = "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary/50 transition-colors placeholder:text-white/25";
const label = "block text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-1";

function EvidenceEditor({ value, onChange, hint }: { value: Evidence[]; onChange: (v: Evidence[]) => void; hint: string }) {
  const update = (i: number, patch: Partial<Evidence>) => onChange(value.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  return (
    <div>
      <span className={label}>Evidence</span>
      <div className="space-y-1.5">
        {value.map((e, i) => (
          <div key={i} className="grid grid-cols-[7rem_1fr_auto] gap-1.5">
            <select value={e.kind} onChange={(ev) => update(i, { kind: ev.target.value })} className={`${field} font-mono text-xs`}>
              {EVIDENCE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                  {(SETTLING_EVIDENCE_KINDS as readonly string[]).includes(k) ? " · settling" : " · question"}
                </option>
              ))}
            </select>
            <input value={e.ref} onChange={(ev) => update(i, { ref: ev.target.value })} placeholder={e.kind === "commit" ? "9f2c1ab" : e.kind === "file" ? "src/config.ts:12" : "what it names"} className={`${field} font-mono text-xs`} />
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-2 rounded-lg border border-white/10 text-muted-foreground hover:text-white cursor-pointer" aria-label="remove">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...value, { kind: "file", ref: "" }])} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> add evidence
        </button>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * Compose one action as the identity shown at the top, and send it to a
 * ledger. The same composer drives the demo's free play and the public
 * ledger; the engine on the other side decides whether it's allowed.
 */
export function ActionComposer({
  entries,
  identity,
  onIdentity,
  run,
  preset,
  onDone,
}: {
  entries: EntryView[];
  identity: ComposerIdentity;
  onIdentity: (next: ComposerIdentity) => void;
  run: (action: Action) => Promise<ActResponse>;
  preset?: ComposerPreset | null;
  onDone?: (result: ActResponse) => void;
}) {
  const [kind, setKind] = useState<ComposerKind>("claim");
  const [assertion, setAssertion] = useState("");
  const [basis, setBasis] = useState("");
  const [verifyKind, setVerifyKind] = useState<string>("inspect");
  const [verifyValue, setVerifyValue] = useState("");
  const [contests, setContests] = useState("");
  const [targetId, setTargetId] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [note, setNote] = useState("");
  const [opinion, setOpinion] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActResponse | null>(null);

  useEffect(() => {
    if (!preset) return;
    setKind(preset.kind);
    setTargetId(preset.targetId ?? "");
    setContests(preset.contests ?? "");
    setResult(null);
  }, [preset]);

  const openUvs = entries.filter((e) => e.type === "UV" && e.status === "open");
  const target = entries.find((e) => e.id === targetId) ?? null;
  /** Striking your own entry is a withdrawal: the same ruling, named for what it is. */
  const withdrawing = kind === "strike" && !!target && sameIdentity(target.line.author, identity.by);
  const onSuggest = (s: Suggestion) => {
    const entry = entries.find((e) => e.id === s.id);
    setResult(null);
    if (s.kind === "withdraw") {
      setKind("strike");
      setTargetId(s.id);
      setOpinion(note.trim() ? note.trim() : "I was wrong about this.");
    } else {
      setKind("claim");
      setAssertion(entry ? String(entry.line.assertion ?? entry.line.claim ?? "") : "");
      setBasis(entry && typeof entry.line.basis === "string" ? entry.line.basis : "");
      const vb = entry?.line.verifyBy as { kind?: string; value?: string } | undefined;
      if (vb?.kind) setVerifyKind(vb.kind);
      if (vb?.value) setVerifyValue(vb.value);
    }
  };
  const liveTbs = entries.filter((e) => e.type === "TB" && (e.status === "active" || e.status === "contested"));
  const strikable = entries.filter((e) => e.status !== "struck");
  const actor: Actor = identity.role === "agent" ? { by: identity.by, role: "agent", agentSessionId: identity.session } : { by: identity.by, role: "human" };

  const build = (): Action => {
    const cleanEvidence = evidence.filter((e) => e.ref.trim()).map((e) => ({ kind: e.kind, ref: e.ref.trim(), ...(e.detail ? { detail: e.detail } : {}) }));
    switch (kind) {
      case "claim":
        return { type: "assert-uv", actor, assertion, basis, verifyBy: { kind: verifyKind, value: verifyValue }, contests: contests || null };
      case "approve":
        return { type: "approve", actor, id: targetId, evidence: cleanEvidence, note: note || null };
      case "refute":
        return { type: "refute", actor, id: targetId, evidence: cleanEvidence, note: note || null };
      case "strike":
        return { type: "strike", actor, id: targetId, opinion };
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      const r = await run(build());
      setResult(r);
      if (r.ok) {
        setAssertion("");
        setBasis("");
        setVerifyValue("");
        setContests("");
        setEvidence([]);
        setNote("");
        setOpinion("");
      }
      onDone?.(r);
    } finally {
      setBusy(false);
    }
  };

  const kinds: Array<{ id: ComposerKind; label: string }> = [
    { id: "claim", label: "Make a claim" },
    { id: "approve", label: "Approve" },
    { id: "refute", label: "Refute" },
    { id: "strike", label: "Strike · Withdraw" },
  ];
  const Option = ({ e }: { e: EntryView }) => (
    <option value={e.id}>
      {e.type} {short(e.id)} · {String(e.type === "TB" ? e.line.claim : e.line.assertion).slice(0, 70)}
    </option>
  );

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="grid sm:grid-cols-[auto_1fr_auto] gap-2 items-end">
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          {(["human", "agent"] as const).map((r) => (
            <button
              key={r}
              onClick={() => onIdentity({ ...identity, role: r, by: r === "agent" && !identity.by.startsWith("agent:") ? `agent:${identity.by.replace(/^agent:/, "") || "claude-code"}` : r === "human" ? identity.by.replace(/^agent:/, "") : identity.by })}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${identity.role === r ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white/80"}`}
            >
              {r === "human" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />} {r === "human" ? "a person" : "an agent"}
            </button>
          ))}
        </div>
        <div>
          <span className={label}>{identity.role === "human" ? "Your handle · you answer for what you sign" : "Agent identity · agent:<name>"}</span>
          <input value={identity.by} onChange={(e) => onIdentity({ ...identity, by: e.target.value })} placeholder={identity.role === "human" ? "ada" : "agent:claude-code"} className={`${field} font-mono`} spellCheck={false} />
        </div>
        {identity.role === "agent" && (
          <div>
            <span className={label}>session</span>
            <Badge>{identity.session}</Badge>
          </div>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {kinds.map((k) => (
          <button
            key={k.id}
            onClick={() => {
              setKind(k.id);
              setResult(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${kind === k.id ? "text-white bg-white/[0.08] border-white/15" : "text-muted-foreground border-transparent hover:text-white/70"}`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {kind === "claim" && (
        <div className="space-y-3">
          <div>
            <span className={label}>Assertion · what you believe is true</span>
            <textarea value={assertion} onChange={(e) => setAssertion(e.target.value)} rows={2} placeholder="The retry cap is read once, at start-up." className={field} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <span className={label}>Basis · why you believe it</span>
              <input value={basis} onChange={(e) => setBasis(e.target.value)} placeholder="config.ts loads it before the loop" className={field} />
            </div>
            <div>
              <span className={label}>Verify by · how someone could check</span>
              <div className="grid grid-cols-[6.5rem_1fr] gap-1.5">
                <select value={verifyKind} onChange={(e) => setVerifyKind(e.target.value)} className={`${field} font-mono text-xs`}>
                  {VERIFY_BY_KINDS.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
                <input value={verifyValue} onChange={(e) => setVerifyValue(e.target.value)} placeholder="src/config.ts" className={`${field} font-mono text-xs`} />
              </div>
            </div>
          </div>
          <div>
            <span className={label}>Challenge a TB · optional</span>
            <select value={contests} onChange={(e) => setContests(e.target.value)} className={`${field} font-mono text-xs`}>
              <option value="">no, this is a new claim</option>
              {liveTbs.map((e) => (
                <Option key={e.id} e={e} />
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">A contest puts the TB under appeal. It stays truth, cited with your doubt, until a person resolves it.</p>
          </div>
        </div>
      )}

      {(kind === "approve" || kind === "refute") && (
        <div className="space-y-3">
          <div>
            <span className={label}>Open UV</span>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className={`${field} font-mono text-xs`}>
              <option value="">pick one</option>
              {openUvs.map((e) => (
                <Option key={e.id} e={e} />
              ))}
            </select>
          </div>
          <EvidenceEditor
            value={evidence}
            onChange={setEvidence}
            hint={
              kind === "approve"
                ? identity.role === "agent"
                  ? "An agent approves only with settling evidence of its own: commit, file, test, claimed-command or wiki."
                  : "A person may approve on judgment; promotion still needs evidence among the approvals."
                : "A refutation cites at least one piece of evidence."
            }
          />
          <div>
            <span className={label}>Note · optional</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={field} placeholder={kind === "approve" ? "the test pins it" : "config.ts still says 100"} />
          </div>
        </div>
      )}

      {kind === "strike" && (
        <div className="space-y-3">
          <div>
            <span className={label}>Entry</span>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className={`${field} font-mono text-xs`}>
              <option value="">pick one</option>
              {strikable.map((e) => (
                <Option key={e.id} e={e} />
              ))}
            </select>
          </div>
          <div>
            <span className={label}>{withdrawing ? "Why you're withdrawing it · on the record for good" : "Opinion · the written reasoning, on the record for good"}</span>
            <textarea value={opinion} onChange={(e) => setOpinion(e.target.value)} rows={2} placeholder={withdrawing ? "typo: I meant Donald, and I'll file it again" : "the cited commit is on an abandoned branch"} className={field} />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {withdrawing
                ? "Your own claim: this withdraws it. It stays in the chain, marked struck, with your reason beside it."
                : "A person's ruling. Struck is sticky: inadmissible, never deleted. Striking your own entry withdraws it."}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-muted-foreground">No login. Your name is your word; the chain shows that a line changed, not who wrote it. Key signing lands in 1.x.</p>
        <button onClick={submit} disabled={busy || !identity.by.trim()} className="btn btn-primary h-10 px-5 text-sm disabled:opacity-40 disabled:hover:translate-y-0">
          {busy ? "writing…" : kind === "claim" ? (contests ? "File the challenge" : "File the claim") : kind === "approve" ? "Approve" : kind === "refute" ? "Refute" : withdrawing ? "Withdraw" : "Strike"}
        </button>
      </div>
      <ResultBanner result={result} onSuggest={onSuggest} />
    </div>
  );
}
