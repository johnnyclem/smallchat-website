/**
 * The guided walk as state the hero shares between the graph overlay (tap
 * to run the next move) and the side panel (the narration and the engine's
 * answer). A sandbox ledger in the browser; nothing is saved.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SandboxLedger, type ActResponse } from "./ledger-client";
import type { Action } from "./truth/engine";
import type { ReadModel } from "./truth/read";
import type { Actor } from "./truth/types";
import { STEPS, YOU, type Refs, type Step } from "./walkthrough";

export interface Played {
  step: number;
  actor: Actor;
  result: ActResponse;
}

/** How long the overlay stays out of the way after a move, so the graph's animation is seen. */
const SETTLE_MS = 1700;

export function useGuidedWalk(opts: { onHighlight: (ids: Set<string>) => void; onSelect: (id: string | null) => void }) {
  const ledger = useRef(new SandboxLedger());
  const refs = useRef<Refs>({});
  const [model, setModel] = useState<ReadModel | null>(null);
  const [played, setPlayed] = useState<Played[]>([]);
  const [busy, setBusy] = useState(false);
  /** `ready`: waiting for the next tap. `settling`: a move just ran; let the graph move before asking again. */
  const [phase, setPhase] = useState<"ready" | "settling">("ready");
  const [freePlay, setFreePlay] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const you: Actor = useMemo(() => ({ by: YOU, role: "human" }), []);
  const { onHighlight, onSelect } = opts;

  const publish = useCallback(async () => {
    const m = await ledger.current.read();
    setModel(m);
    return m;
  }, []);

  useEffect(() => {
    void publish();
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [publish]);

  const next = played.length;
  const step: Step | undefined = STEPS[next];
  const last = played[played.length - 1] ?? null;
  const done = next >= STEPS.length;

  const focusOf = (r: ActResponse, action: Action): string | null => {
    if (r.ok) {
      if (r.outcome.kind === "promoted") return r.outcome.tb;
      return "id" in r.outcome ? r.outcome.id : null;
    }
    return "id" in action ? action.id : null;
  };

  const play = useCallback(async () => {
    const current = STEPS[played.length];
    if (!current || busy) return;
    setBusy(true);
    try {
      const action = current.action(refs.current, you);
      const result = await ledger.current.run(action);
      current.remember?.(result, refs.current);
      setPlayed((p) => [...p, { step: p.length, actor: current.who(you), result }]);
      await publish();
      const ids = new Set(result.ok ? result.lines.map((l) => l.id) : []);
      if (result.ok && result.outcome.kind === "promoted") ids.add(result.outcome.tb);
      onHighlight(ids);
      onSelect(focusOf(result, action));
      setPhase("settling");
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => setPhase("ready"), SETTLE_MS);
    } finally {
      setBusy(false);
    }
  }, [played.length, busy, you, publish, onHighlight, onSelect]);

  const runFree = useCallback(
    async (action: Action) => {
      const r = await ledger.current.run(action);
      await publish();
      if (r.ok) {
        onHighlight(new Set(r.lines.map((l) => l.id)));
        onSelect(focusOf(r, action));
      }
      return r;
    },
    [publish, onHighlight, onSelect]
  );

  const reset = useCallback(async () => {
    ledger.current.reset();
    refs.current = {};
    setPlayed([]);
    setFreePlay(false);
    setPhase("ready");
    onHighlight(new Set());
    onSelect(null);
    await publish();
  }, [publish, onHighlight, onSelect]);

  return { model, played, step, next, last, done, busy, phase, freePlay, setFreePlay, play, runFree, reset, you, total: STEPS.length };
}

export type GuidedWalk = ReturnType<typeof useGuidedWalk>;
