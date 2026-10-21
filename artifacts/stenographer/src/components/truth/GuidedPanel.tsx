import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronRight, LogOut, Play, RotateCcw, User, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SandboxLedger, type ActResponse } from "@/lib/ledger-client";
import type { ReadModel } from "@/lib/truth/read";
import type { Actor } from "@/lib/truth/types";
import { STEPS, YOU, type Refs } from "@/lib/walkthrough";
import { ActionComposer, type ComposerIdentity } from "./ActionComposer";
import { ResultBanner } from "./pieces";

interface Played {
  step: number;
  actor: Actor;
  result: ActResponse;
}

/**
 * The guided walk, driving the hero's graph: a sandbox ledger in the
 * browser, one move per Next. The panel narrates; the graph shows what
 * each move created, connected, challenged or struck.
 */
export function GuidedPanel({
  onModel,
  onHighlight,
  onSelect,
  onExit,
}: {
  onModel: (model: ReadModel) => void;
  onHighlight: (ids: Set<string>) => void;
  onSelect: (id: string | null) => void;
  onExit: () => void;
}) {
  const ledger = useRef(new SandboxLedger());
  const refs = useRef<Refs>({});
  const [played, setPlayed] = useState<Played[]>([]);
  const [busy, setBusy] = useState(false);
  const [freePlay, setFreePlay] = useState(false);
  const [entries, setEntries] = useState<ReadModel["entries"]>([]);
  const [identity, setIdentity] = useState<ComposerIdentity>({ by: YOU, role: "human", session: "sess-you" });
  const you: Actor = useMemo(() => ({ by: YOU, role: "human" }), []);
  const next = played.length;
  const step = STEPS[next];
  const last = played[played.length - 1] ?? null;
  const done = next >= STEPS.length;

  const publish = async () => {
    const model = await ledger.current.read();
    setEntries(model.entries);
    onModel(model);
  };

  useEffect(() => {
    void publish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusOf = (r: ActResponse): string | null => {
    if (!r.ok) return null;
    if (r.outcome.kind === "promoted") return r.outcome.tb;
    return "id" in r.outcome ? r.outcome.id : null;
  };

  const play = async () => {
    if (!step || busy) return;
    setBusy(true);
    try {
      const result = await ledger.current.run(step.action(refs.current, you));
      step.remember?.(result, refs.current);
      setPlayed((p) => [...p, { step: next, actor: step.who(you), result }]);
      await publish();
      const ids = new Set(result.ok ? result.lines.map((l) => l.id) : []);
      if (result.ok && result.outcome.kind === "promoted") ids.add(result.outcome.tb);
      onHighlight(ids);
      onSelect(focusOf(result) ?? (result.ok ? null : ("id" in step.action(refs.current, you) ? (step.action(refs.current, you) as { id: string }).id : null)));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    ledger.current.reset();
    refs.current = {};
    setPlayed([]);
    setFreePlay(false);
    onHighlight(new Set());
    onSelect(null);
    await publish();
  };

  return (
    <div className="space-y-3">
      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">{done ? "The walk" : `Move ${next + 1} of ${STEPS.length}`}</p>
          <div className="flex items-center gap-3">
            <button onClick={() => void reset()} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> restart
            </button>
            <button onClick={onExit} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> back to the live ledger
            </button>
          </div>
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
                <button onClick={() => void play()} disabled={busy} className="btn btn-primary h-10 px-5 text-sm">
                  {next === 0 ? <Play className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {busy ? "…" : next === 0 ? "Start" : step.expect === "refused" ? "Next · try it anyway" : "Next"}
                </button>
                <span className="text-xs text-muted-foreground">watch the graph</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
              <h4 className="text-lg font-semibold text-white">That's the whole loop</h4>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Agents found every fact and settled none of them. Two TBs were signed, one was overridden, one appeal was refuted, one claim was struck, and every change is a line you can re-hash. Try your own moves on this sandbox, or go back to the live ledger and make a real claim.
              </p>
              <div className="mt-4 flex gap-2 flex-wrap">
                {!freePlay && (
                  <button onClick={() => setFreePlay(true)} className="btn btn-glass h-10 px-4 text-sm">
                    <Wand2 className="w-4 h-4" /> Free play here
                  </button>
                )}
                <button onClick={onExit} className="btn btn-primary h-10 px-4 text-sm">
                  <LogOut className="w-4 h-4" /> The live ledger
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ResultBanner result={last?.result ?? null} />
      {freePlay && (
        <ActionComposer
          entries={entries}
          identity={identity}
          onIdentity={setIdentity}
          run={(a) => ledger.current.run(a)}
          onDone={async (r) => {
            await publish();
            if (r.ok) {
              onHighlight(new Set(r.lines.map((l) => l.id)));
              onSelect(focusOf(r));
            }
          }}
        />
      )}
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
