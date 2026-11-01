import { Bot, Plus, User, X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import type { ActResponse } from "@/lib/ledger-client";
import { clip } from "@/lib/format";
import type { Action } from "@/lib/truth/engine";
import type { EntryView } from "@/lib/truth/read";
import { sameIdentity } from "@/lib/truth/identity";
import { EVIDENCE_KINDS, SETTLING_EVIDENCE_KINDS, VERIFY_BY_KINDS, type Actor, type Evidence, type Suggestion } from "@/lib/truth/types";
import { ResultBanner, Tag, short } from "./pieces";

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

/** A plain label with a muted hint under it, tied to its field. */
function Field({ label, hint, children }: { label: string; hint?: string; children: (props: { id: string; "aria-describedby"?: string }) => ReactNode }) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label htmlFor={id} className="block text-sm font-medium leading-5 text-foreground">
          {label}
        </label>
        {hint && (
          <p id={hintId} className="text-sm leading-5 text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      {children({ id, "aria-describedby": hint ? hintId : undefined })}
    </div>
  );
}

function EvidenceEditor({ value, onChange, hint }: { value: Evidence[]; onChange: (v: Evidence[]) => void; hint: string }) {
  const update = (i: number, patch: Partial<Evidence>) => onChange(value.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium leading-5 text-foreground">Evidence</p>
        <p className="text-sm leading-5 text-muted-foreground">{hint}</p>
      </div>
      {value.map((e, i) => (
        <div key={i} className="grid grid-cols-[7rem_1fr_40px] gap-2">
          <select value={e.kind} onChange={(ev) => update(i, { kind: ev.target.value })} className="field font-mono text-xs" aria-label={`Evidence ${i + 1} kind`}>
            {EVIDENCE_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
                {(SETTLING_EVIDENCE_KINDS as readonly string[]).includes(k) ? " · settling" : " · question"}
              </option>
            ))}
          </select>
          <input
            value={e.ref}
            onChange={(ev) => update(i, { ref: ev.target.value })}
            placeholder={e.kind === "commit" ? "grocery-list@c0ffee1" : e.kind === "file" ? "fridge-cam/tue-07.12.jpg" : "What it names"}
            className="field font-mono text-xs"
            aria-label={`Evidence ${i + 1} reference`}
          />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="btn btn-ghost h-10 px-0" aria-label={`Remove evidence ${i + 1}`}>
            <X />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { kind: "file", ref: "" }])} className="btn btn-ghost btn-sm -ml-3 self-start">
        <Plus /> Add evidence
      </button>
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
    { id: "claim", label: "Claim" },
    { id: "approve", label: "Approve" },
    { id: "refute", label: "Refute" },
    { id: "strike", label: "Strike" },
  ];
  const title = kind === "claim" ? "Make a claim" : kind === "approve" ? "Approve a claim" : kind === "refute" ? "Refute a claim" : "Strike or withdraw an entry";
  const Option = ({ e }: { e: EntryView }) => (
    <option value={e.id}>
      {e.type} {short(e.id)} · {clip(String(e.type === "TB" ? e.line.claim : e.line.assertion), 70)}
    </option>
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2" role="group" aria-label="Who is acting">
            {(["human", "agent"] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={identity.role === r}
                onClick={() => onIdentity({ ...identity, role: r, by: r === "agent" && !identity.by.startsWith("agent:") ? `agent:${identity.by.replace(/^agent:/, "") || "claude-code"}` : r === "human" ? identity.by.replace(/^agent:/, "") : identity.by })}
                className="tab-item h-8 flex-1 justify-center"
              >
                {r === "human" ? <User /> : <Bot />} {r === "human" ? "A person" : "An agent"}
              </button>
            ))}
          </div>
          <Field label={identity.role === "human" ? "Your handle" : "Agent identity"} hint={identity.role === "human" ? "You answer for what you sign" : "Written as agent:name"}>
            {(p) => <input {...p} value={identity.by} onChange={(e) => onIdentity({ ...identity, by: e.target.value })} placeholder={identity.role === "human" ? "ada" : "agent:claude-code"} className="field font-mono" spellCheck={false} autoComplete="off" />}
          </Field>
          {identity.role === "agent" && (
            <p className="flex items-center gap-2 text-sm leading-5 text-muted-foreground">
              Session <Tag>{identity.session}</Tag>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="What to do">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              aria-pressed={kind === k.id}
              onClick={() => {
                setKind(k.id);
                setResult(null);
              }}
              className="tab-item h-8"
            >
              {k.label}
            </button>
          ))}
        </div>

        {kind === "claim" && (
          <div className="flex flex-col gap-4">
            <Field label="Assertion" hint="What you believe is true">
              {(p) => <textarea {...p} value={assertion} onChange={(e) => setAssertion(e.target.value)} rows={3} placeholder="We're out of eggs. Saturday's dozen is gone." className="field" />}
            </Field>
            <Field label="Basis" hint="Why you believe it">
              {(p) => <input {...p} value={basis} onChange={(e) => setBasis(e.target.value)} placeholder="The carton on the door shelf is empty" className="field" />}
            </Field>
            <Field label="Verify by" hint="How someone could check">
              {(p) => (
                <div className="grid grid-cols-[7rem_1fr] gap-2">
                  <select value={verifyKind} onChange={(e) => setVerifyKind(e.target.value)} className="field font-mono text-xs" aria-label="Verify by kind">
                    {VERIFY_BY_KINDS.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                  <input {...p} value={verifyValue} onChange={(e) => setVerifyValue(e.target.value)} placeholder="Door shelf of the fridge" className="field font-mono text-xs" />
                </div>
              )}
            </Field>
            <Field label="Challenge a TB" hint="Optional. A contest puts the TB under appeal. It stays truth, cited with your doubt, until a person resolves it.">
              {(p) => (
                <select {...p} value={contests} onChange={(e) => setContests(e.target.value)} className="field font-mono text-xs">
                  <option value="">No, this is a new claim</option>
                  {liveTbs.map((e) => (
                    <Option key={e.id} e={e} />
                  ))}
                </select>
              )}
            </Field>
          </div>
        )}

        {(kind === "approve" || kind === "refute") && (
          <div className="flex flex-col gap-4">
            <Field label="Open UV">
              {(p) => (
                <select {...p} value={targetId} onChange={(e) => setTargetId(e.target.value)} className="field font-mono text-xs">
                  <option value="">Pick one</option>
                  {openUvs.map((e) => (
                    <Option key={e.id} e={e} />
                  ))}
                </select>
              )}
            </Field>
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
            <Field label="Note" hint="Optional">
              {(p) => <input {...p} value={note} onChange={(e) => setNote(e.target.value)} className="field" placeholder={kind === "approve" ? "The scale agrees: carton's empty" : "Six eggs in the crisper"} />}
            </Field>
          </div>
        )}

        {kind === "strike" && (
          <div className="flex flex-col gap-4">
            <Field label="Entry">
              {(p) => (
                <select {...p} value={targetId} onChange={(e) => setTargetId(e.target.value)} className="field font-mono text-xs">
                  <option value="">Pick one</option>
                  {strikable.map((e) => (
                    <Option key={e.id} e={e} />
                  ))}
                </select>
              )}
            </Field>
            <Field
              label={withdrawing ? "Why you're withdrawing it" : "Opinion"}
              hint={
                withdrawing
                  ? "Your own claim: this withdraws it. It stays in the chain, marked struck, with your reason beside it."
                  : "The written reasoning, on the record for good. A person's ruling. Struck is sticky: inadmissible, never deleted. Striking your own entry withdraws it."
              }
            >
              {(p) => <textarea {...p} value={opinion} onChange={(e) => setOpinion(e.target.value)} rows={3} placeholder={withdrawing ? "I was wrong: the eggs were in the crisper. Filing it again." : "Duplicate: eggs went on the list Monday night"} className="field" />}
            </Field>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm leading-5 text-muted-foreground">No login. Your name is your word; the chain shows that a line changed, not who wrote it. Key signing is planned for 1.x.</p>
          <button type="button" onClick={submit} disabled={busy || !identity.by.trim()} className="btn btn-solid h-10 w-full">
            {busy ? "Writing" : kind === "claim" ? (contests ? "File the challenge" : "File the claim") : kind === "approve" ? "Approve" : kind === "refute" ? "Refute" : withdrawing ? "Withdraw" : "Strike"}
          </button>
        </div>
        <ResultBanner result={result} onSuggest={onSuggest} />
      </div>
    </div>
  );
}
