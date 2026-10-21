/**
 * The explainer's state, shared between the graph overlay (pick a move) and
 * the side panel (the narration and the engine's answer). A sandbox ledger
 * in the browser; nothing is saved.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SCENES, START_SCENE, choicesFor, type Choice, type Refs, type Scene } from "./adventure";
import { SandboxLedger, type ActResponse } from "./ledger-client";
import type { Action } from "./truth/engine";
import type { ReadModel } from "./truth/read";

export interface Played {
  scene: string;
  choice: Choice;
  /** The engine's answers, one per move the choice ran; empty on a dead end. */
  results: ActResponse[];
}

/** How long the overlay stays out of the way after a move, so the graph's animation is seen. */
const SETTLE_MS = 1900;

export function useGuidedWalk(opts: { onHighlight: (ids: Set<string>) => void; onSelect: (id: string | null) => void }) {
  const ledger = useRef(new SandboxLedger());
  const refs = useRef<Refs>({});
  const [model, setModel] = useState<ReadModel | null>(null);
  const [sceneId, setSceneId] = useState(START_SCENE);
  const [played, setPlayed] = useState<Played[]>([]);
  const [busy, setBusy] = useState(false);
  /** `ready`: waiting for a pick. `settling`: moves just ran; let the graph move before asking again. */
  const [phase, setPhase] = useState<"ready" | "settling">("ready");
  const [freePlay, setFreePlay] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const scene: Scene = SCENES[sceneId];
  const choices = useMemo(() => choicesFor(scene, refs.current), [scene, played.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = played[played.length - 1] ?? null;
  const done = !!scene.terminal;

  const idOf = (r: ActResponse): string | null => {
    if (!r.ok) return null;
    if (r.outcome.kind === "promoted") return r.outcome.tb;
    return "id" in r.outcome ? r.outcome.id : null;
  };

  const settle = () => {
    setPhase("settling");
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setPhase("ready"), SETTLE_MS);
  };

  const choose = useCallback(
    async (choice: Choice) => {
      if (busy) return;
      setBusy(true);
      try {
        const results: ActResponse[] = [];
        let refused = false;
        const ids = new Set<string>();
        let focus: string | null = null;
        if (choice.run) {
          const actions: Action[] = choice.run(refs.current);
          for (const action of actions) {
            const r = await ledger.current.run(action);
            results.push(r);
            if (!r.ok) {
              refused = true;
              focus = "id" in action ? action.id : null;
              break;
            }
            for (const l of r.lines) ids.add(l.id);
            if (r.outcome.kind === "promoted") ids.add(r.outcome.tb);
            focus = idOf(r);
          }
          if (!refused) choice.remember?.(refs.current, results.map(idOf));
        }
        setPlayed((p) => [...p, { scene: sceneId, choice, results }]);
        await publish();
        onHighlight(ids);
        onSelect(focus);
        const target = refused ? choice.nextIfRefused : choice.next;
        if (target === "restart") {
          ledger.current.reset();
          refs.current = {};
          setPlayed([]);
          onHighlight(new Set());
          onSelect(null);
          await publish();
          setSceneId(START_SCENE);
        } else if (target) {
          setSceneId(target);
        }
        if (choice.run) settle();
      } finally {
        setBusy(false);
      }
    },
    [busy, sceneId, publish, onHighlight, onSelect]
  );

  const runFree = useCallback(
    async (action: Action) => {
      const r = await ledger.current.run(action);
      await publish();
      if (r.ok) {
        onHighlight(new Set(r.lines.map((l) => l.id)));
        onSelect(idOf(r));
      }
      return r;
    },
    [publish, onHighlight, onSelect]
  );

  const reset = useCallback(async () => {
    ledger.current.reset();
    refs.current = {};
    setPlayed([]);
    setSceneId(START_SCENE);
    setFreePlay(false);
    setPhase("ready");
    onHighlight(new Set());
    onSelect(null);
    await publish();
  }, [publish, onHighlight, onSelect]);

  const moves = played.reduce((n, p) => n + p.results.length, 0);
  return { model, scene, choices, played, last, done, busy, phase, freePlay, setFreePlay, choose, runFree, reset, moves };
}

export type GuidedWalk = ReturnType<typeof useGuidedWalk>;
