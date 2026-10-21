/**
 * Every path through the explainer, run through the engine. A choice that
 * moves the story on must land every move; a choice that stays put is a
 * trap and its first move must be refused; a dead end runs nothing.
 */
import { describe, expect, it } from "vitest";
import { SCENES, START_SCENE, choicesFor, type Choice, type Refs } from "../adventure.js";
import { SandboxLedger, type ActResponse } from "../ledger-client.js";

const MAX_MOVES = 12;

function idOf(r: ActResponse): string | null {
  if (!r.ok) return null;
  if (r.outcome.kind === "promoted") return r.outcome.tb;
  return "id" in r.outcome ? r.outcome.id : null;
}

function snapshot(ledger: SandboxLedger) {
  return { state: structuredClone(ledger.state), clock: ledger.clock };
}

function restore(ledger: SandboxLedger, snap: ReturnType<typeof snapshot>) {
  ledger.state = structuredClone(snap.state);
  ledger.clock = snap.clock;
}

/** Play one choice; returns where the story goes, or null when it stays put. */
async function play(ledger: SandboxLedger, refs: Refs, choice: Choice, path: string): Promise<string | null> {
  if (!choice.run) {
    expect(choice.deadEnd, `${path}: a choice without moves is a dead end`).toBeDefined();
    return choice.next ?? null;
  }
  const results: ActResponse[] = [];
  for (const action of choice.run(refs)) {
    const r = await ledger.run(action);
    results.push(r);
    if (!r.ok) break;
  }
  const refused = results.find((r) => !r.ok);
  if (choice.next) {
    expect(refused, `${path}: ${refused && !refused.ok ? refused.message : ""}`).toBeUndefined();
    choice.remember?.(refs, results.map(idOf));
    for (const key of ["uv", "tb", "contest", "tb2"]) if (key in refs) expect(refs[key], `${path}: remembered ${key}`).not.toBe("");
    return choice.next;
  }
  expect(refused, `${path}: a trap must be refused`).toBeDefined();
  expect(refused && !refused.ok && "refused" in refused && refused.refused, `${path}: refused by a rule, not an error`).toBe(true);
  expect(results.length, `${path}: a trap stops at its first move`).toBe(1);
  return choice.nextIfRefused ?? null;
}

describe("the explainer's paths", () => {
  it("every scene is reachable and every target exists", () => {
    const seen = new Set<string>();
    const queue = [START_SCENE];
    while (queue.length) {
      const id = queue.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const c of SCENES[id].choices) {
        for (const target of [c.next, c.nextIfRefused]) {
          if (!target || target === "restart") continue;
          expect(SCENES[target], `${id} → ${target}`).toBeDefined();
          queue.push(target);
        }
      }
    }
    expect([...seen].sort()).toEqual(Object.keys(SCENES).sort());
  });

  it("moves land where the story says, and traps are refused", async () => {
    const ledger = new SandboxLedger();
    let paths = 0;
    const walk = async (sceneId: string, refs: Refs, path: string, moves: number): Promise<void> => {
      const scene = SCENES[sceneId];
      if (scene.terminal || moves >= MAX_MOVES) {
        paths++;
        return;
      }
      const choices = choicesFor(scene, refs);
      expect(choices.length, `${path}: a scene offers two to four moves`).toBeGreaterThanOrEqual(2);
      expect(choices.length).toBeLessThanOrEqual(4);
      for (const choice of choices) {
        const snap = snapshot(ledger);
        const nextRefs = { ...refs };
        const label = `${path} › ${choice.label}`;
        const next = await play(ledger, nextRefs, choice, label);
        if (next === "restart") paths++;
        else if (next && next !== sceneId) await walk(next, nextRefs, label, moves + 1);
        else paths++;
        restore(ledger, snap);
      }
    };
    await walk(START_SCENE, {}, "start", 0);
    expect(paths).toBeGreaterThan(20);
  });
});
