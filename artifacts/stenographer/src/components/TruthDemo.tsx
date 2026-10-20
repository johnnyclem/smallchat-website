import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronRight, Play, RotateCcw, User, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SandboxLedger, type ActResponse } from "@/lib/ledger-client";
import type { Action } from "@/lib/truth/engine";
import type { ReadModel } from "@/lib/truth/read";
import type { Actor } from "@/lib/truth/types";
import { ActionComposer, type ComposerIdentity } from "./truth/ActionComposer";
import { ChainStrip, ResultBanner } from "./truth/pieces";
import { EntryCard } from "./truth/EntryCard";
import { TruthGraph } from "./truth/TruthGraph";

/** The cast. One person at the keyboard, and agent sessions that found things. */
const YOU = "ada";
const CLAUDE_A: Actor = { by: "agent:claude-code", role: "agent", agentSessionId: "sess-7f3a" };
const CODEX: Actor = { by: "agent:codex", role: "agent", agentSessionId: "sess-2b8e" };
const GEMINI: Actor = { by: "agent:gemini", role: "agent", agentSessionId: "sess-9c1d" };
const CURSOR: Actor = { by: "agent:cursor", role: "agent", agentSessionId: "sess-4d2a" };
const KIM: Actor = { by: "kim", role: "human" };

interface Step {
  title: string;
  /** What is about to happen, and why it matters. */
  lead: string;
  /** The action, given what the ledger holds so far. */
  action: (refs: Refs, you: Actor) => Action;
  /** Who acts, for the chip. */
  who: (you: Actor) => Actor;
  /** What the engine should answer; the demo keeps going either way. */
  expect: "ok" | "refused";
  /** Remember an id from the result under this name. */
  remember?: (r: ActResponse, refs: Refs) => void;
}

type Refs = Record<string, string>;

const idOf = (r: ActResponse) => (r.ok ? (r.outcome as { id: string }).id : "");

const STEPS: Step[] = [
  {
    title: "An agent notices something",
    lead: "Working in the repo, a Claude Code session sees that LOG_BUDGET changed. It can't declare that truth. It files an unverified assertion: a UV, with a basis and a way to check it.",
    who: () => CLAUDE_A,
    action: () => ({ type: "assert-uv", actor: CLAUDE_A, assertion: "LOG_BUDGET is 100; the old value 30 is dead.", basis: "config.ts was changed in the last commit", verifyBy: { kind: "inspect", value: "src/config.ts" }, literals: [{ subject: "LOG_BUDGET", dead: "30", current: "100" }] }),
    expect: "ok",
    remember: (r, refs) => (refs.uv = idOf(r)),
  },
  {
    title: "It tries to settle its own claim",
    lead: "The same agent, in a fresh session, approves what it drafted. Contempt of corpus: nobody approves what they wrote, by identity or by session. Three subagents affirming their parent is one opinion wearing three hats.",
    who: () => ({ ...CLAUDE_A, agentSessionId: "sess-b2c4" }),
    action: (refs) => ({ type: "approve", actor: { ...CLAUDE_A, agentSessionId: "sess-b2c4" }, id: refs.uv, evidence: [{ kind: "commit", ref: "9f2c1ab" }] }),
    expect: "refused",
  },
  {
    title: "Another agent agrees, with receipts",
    lead: "A Codex session checked it from a different angle and approves, citing the commit. An approval needs settling evidence: a commit, file, test, claimed command or ledger entry. A chat message would only raise a question.",
    who: () => CODEX,
    action: (refs) => ({ type: "approve", actor: CODEX, id: refs.uv, evidence: [{ kind: "commit", ref: "9f2c1ab", detail: "LOG_BUDGET = 100" }] }),
    expect: "ok",
  },
  {
    title: "Two more pile on",
    lead: "Gemini cites the file, Cursor will cite the test. Three sessions, disjoint evidence, two kinds between them: that nominates the UV. It is corroborated and goes first on the docket, and it is still not a TB. No number of agents mints one.",
    who: () => GEMINI,
    action: (refs) => ({ type: "approve", actor: GEMINI, id: refs.uv, evidence: [{ kind: "file", ref: "src/config.ts:12", detail: "LOG_BUDGET = 100" }] }),
    expect: "ok",
  },
  {
    title: "…and the third makes it a nomination",
    lead: "Cursor's approval completes the nomination: one ADDENDUM with a corroborates link, carrying the three sessions as its quorum, each with the evidence it brought.",
    who: () => CURSOR,
    action: (refs) => ({ type: "approve", actor: CURSOR, id: refs.uv, evidence: [{ kind: "test", ref: "test/config.test.ts", detail: "pins the budget at 100" }] }),
    expect: "ok",
  },
  {
    title: "A person approves",
    lead: "You read the receipts and approve. A person's approval with one other approver promotes the UV: the TB is signed by you, carries every approval and the union of their evidence, and names you as the one who answers for it.",
    who: (you) => you,
    action: (refs, you) => ({ type: "approve", actor: you, id: refs.uv, note: "The commit is in and the test pins it." }),
    expect: "ok",
    remember: (r, refs) => (refs.tb = r.ok ? (r.outcome as { tb: string }).tb : ""),
  },
  {
    title: "Someone challenges the TB",
    lead: "A Codex session finds a hotfix that put the old value back. It contests the TB with a UV. The TB goes under appeal: still truth, cited with the doubt, never grounds for a denial while the appeal is open.",
    who: () => CODEX,
    action: (refs) => ({ type: "assert-uv", actor: CODEX, assertion: "LOG_BUDGET went back to 30 in the hotfix.", basis: "the hotfix notes", verifyBy: { kind: "command", value: "grep LOG_BUDGET src/config.ts" }, contests: refs.tb }),
    expect: "ok",
    remember: (r, refs) => (refs.contest = idOf(r)),
  },
  {
    title: "The signer can't wave it away",
    lead: "You signed that TB, so you can't be the one to refute the appeal against it: refuting it would put your TB back to active on your own word. Someone else refutes it, approves it, or strikes it.",
    who: (you) => you,
    action: (refs, you) => ({ type: "refute", actor: you, id: refs.contest, evidence: [{ kind: "file", ref: "src/config.ts:12", detail: "still 100" }] }),
    expect: "refused",
  },
  {
    title: "Another person refutes it with evidence",
    lead: "Kim checks the file and refutes the contest, citing it. The UV is refuted, history now, and the TB returns to active. Every status change is an appended TRANSITION line. Nothing is edited.",
    who: () => KIM,
    action: (refs) => ({ type: "refute", actor: KIM, id: refs.contest, evidence: [{ kind: "file", ref: "src/config.ts:12", detail: "LOG_BUDGET = 100" }], note: "The hotfix never touched config.ts." }),
    expect: "ok",
  },
  {
    title: "A challenge that holds up",
    lead: "Later, Gemini contests again: the budget moved to 120. This time Cursor approves the contest with a commit, and Kim approves it. Approving a contest overrides the TB and mints its successor.",
    who: () => GEMINI,
    action: (refs) => ({ type: "assert-uv", actor: GEMINI, assertion: "LOG_BUDGET is 120 now; 100 is dead.", basis: "commit c0ffee1 raised it", verifyBy: { kind: "inspect", value: "src/config.ts" }, contests: refs.tb, literals: [{ subject: "LOG_BUDGET", dead: "100", current: "120" }] }),
    expect: "ok",
    remember: (r, refs) => (refs.contest2 = idOf(r)),
  },
  {
    title: "…an agent brings the commit",
    lead: "Cursor approves the new contest, citing the commit that raised it.",
    who: () => CURSOR,
    action: (refs) => ({ type: "approve", actor: CURSOR, id: refs.contest2, evidence: [{ kind: "commit", ref: "c0ffee1", detail: "LOG_BUDGET = 120" }] }),
    expect: "ok",
  },
  {
    title: "…and a person overrides the old TB",
    lead: "Kim's approval promotes the contest. The old TB is overridden, for good, and the successor supersedes it. The ledger keeps both: an overridden TB is history, never cited as support.",
    who: () => KIM,
    action: (refs) => ({ type: "approve", actor: KIM, id: refs.contest2 }),
    expect: "ok",
  },
  {
    title: "A strike",
    lead: "A stray claim with nothing behind it? A person strikes it with a written opinion. Struck is sticky: inadmissible, never deleted, the opinion on the record.",
    who: (you) => you,
    action: (refs, you) => ({ type: "strike", actor: you, id: refs.uv, opinion: "Superseded twice over; keeping the chain honest." }),
    expect: "ok",
  },
];

interface Played {
  step: number;
  actor: Actor;
  result: ActResponse;
}

/** The guided walk through settling a claim, on a ledger in your browser. */
export function TruthDemo() {
  const ledger = useRef(new SandboxLedger());
  const [model, setModel] = useState<ReadModel | null>(null);
  const [played, setPlayed] = useState<Played[]>([]);
  const [busy, setBusy] = useState(false);
  const [freePlay, setFreePlay] = useState(false);
  const [identity, setIdentity] = useState<ComposerIdentity>({ by: YOU, role: "human", session: "sess-you" });
  const [selected, setSelected] = useState<string | null>(null);
  const refs = useRef<Refs>({});
  const you: Actor = useMemo(() => ({ by: YOU, role: "human" }), []);
  const next = played.length;
  const step = STEPS[next];
  const last = played[played.length - 1] ?? null;
  const highlight = useMemo(() => {
    if (!last?.result.ok) return new Set<string>();
    const ids = new Set(last.result.lines.map((l) => l.id));
    if (last.result.outcome.kind === "promoted") ids.add(last.result.outcome.tb);
    return ids;
  }, [last]);
  const byId = useMemo(() => new Map((model?.entries ?? []).map((e) => [e.id, e])), [model]);
  const selectedEntry = selected ? byId.get(selected) ?? null : null;

  const refresh = async () => setModel(await ledger.current.read());
  useEffect(() => {
    void refresh();
  }, []);

  const play = async () => {
    if (!step || busy) return;
    setBusy(true);
    try {
      const result = await ledger.current.run(step.action(refs.current, you));
      step.remember?.(result, refs.current);
      setPlayed((p) => [...p, { step: next, actor: step.who(you), result }]);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    ledger.current.reset();
    refs.current = {};
    setPlayed([]);
    setFreePlay(false);
    setSelected(null);
    await refresh();
  };

  const done = next >= STEPS.length;

  return (
    <div className="grid lg:grid-cols-[1fr_1.15fr] gap-5 sm:gap-6 items-start">
      <div className="space-y-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
              {done ? "The walkthrough" : `Step ${next + 1} of ${STEPS.length}`}
            </p>
            <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> start over
            </button>
          </div>
          <div className="mt-3 flex gap-1">
            {STEPS.map((s, i) => {
              const p = played[i];
              const cls = !p ? (i === next ? "bg-white/60" : "bg-white/10") : p.result.ok ? "bg-green-400/80" : "bg-red-400/80";
              return <span key={s.title} title={s.title} className={`h-1 flex-1 rounded-full ${cls}`} />;
            })}
          </div>
          <AnimatePresence mode="wait">
            {step ? (
              <motion.div key={next} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-4">
                <h4 className="text-lg font-semibold text-white">{step.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.lead}</p>
                <ActorChip actor={step.who(you)} />
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <button onClick={play} disabled={busy} className="btn btn-primary h-10 px-5 text-sm">
                    <Play className="w-4 h-4" /> {busy ? "…" : step.expect === "refused" ? "Try it anyway" : "Run it"}
                  </button>
                  {next > 0 && last && <span className="text-xs text-muted-foreground">the engine answers below</span>}
                </div>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <h4 className="text-lg font-semibold text-white">That's the whole loop</h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Agents found every fact here and settled none of them. Two TBs were signed, one was overridden, one appeal was refuted, one claim was struck, and every change is a line you can re-hash. Now try your own moves on this sandbox, or take a claim to the{" "}
                  <a href="#ledger" className="text-primary hover:underline">public ledger</a>, which runs the same rules.
                </p>
                <button onClick={() => setFreePlay(true)} className="mt-4 btn btn-glass h-10 px-5 text-sm">
                  <Wand2 className="w-4 h-4" /> Free play on this sandbox
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <ResultBanner result={last?.result ?? null} />
        {freePlay && model && (
          <ActionComposer entries={model.entries} identity={identity} onIdentity={setIdentity} run={(a) => ledger.current.run(a)} onDone={() => void refresh()} />
        )}
        {!freePlay && !done && next > 0 && (
          <button onClick={() => setFreePlay(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
            <ChevronRight className="w-3.5 h-3.5" /> or skip ahead and play freely on this sandbox
          </button>
        )}
      </div>
      <div className="glass-panel rounded-2xl overflow-hidden">
        <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase px-4 sm:px-5 py-3 border-b border-white/5">The sandbox ledger · in your browser, nothing saved</p>
        {model && <TruthGraph model={model} selected={selected} onSelect={setSelected} highlight={highlight} minHeight={380} />}
        {model && (
          <div className="px-4 sm:px-5 py-3 border-t border-white/5 space-y-3">
            {selectedEntry && <EntryCard entry={selectedEntry} byId={byId} highlight={highlight.has(selectedEntry.id)} />}
            <ChainStrip lines={model.lines} highlight={highlight} />
          </div>
        )}
      </div>
    </div>
  );
}

function ActorChip({ actor }: { actor: Actor }) {
  const agent = actor.role === "agent";
  return (
    <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/30 text-xs">
      {agent ? <Bot className="w-3.5 h-3.5 text-sky-300" /> : <User className="w-3.5 h-3.5 text-primary" />}
      <span className={`font-mono ${agent ? "text-sky-300" : "text-white"}`}>{actor.by}</span>
      {agent && <span className="font-mono text-white/40">{actor.agentSessionId}</span>}
      {!agent && <span className="text-muted-foreground">a person</span>}
    </div>
  );
}
