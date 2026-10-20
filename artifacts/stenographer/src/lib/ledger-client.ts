/**
 * How the page talks to a ledger: the public one over /api/ledger, or a
 * sandbox in memory. Both run the same engine (src/lib/truth), so the demo
 * and the public ledger refuse the same things for the same reasons.
 */

import { act, applyResult, type Action, type LedgerState, type Outcome } from "./truth/engine";
import { readModel, type ReadModel } from "./truth/read";
import { Refusal, type Actor, type Line } from "./truth/types";

export type ActResponse =
  | { ok: true; outcome: Outcome; message: string; lines: Line[] }
  | { ok: false; refused: true; code: string; rule: string; message: string }
  | { ok: false; refused?: false; message: string };

export interface LedgerRunner {
  read(): Promise<ReadModel>;
  run(action: Action): Promise<ActResponse>;
}

/** The public ledger behind /api/ledger. */
export const publicLedger: LedgerRunner = {
  async read() {
    const res = await fetch("/api/ledger", { cache: "no-store" });
    if (!res.ok) throw new Error(`the ledger answered ${res.status}`);
    return (await res.json()) as ReadModel;
  },
  async run(action) {
    try {
      const res = await fetch("/api/ledger/act", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) });
      const body = (await res.json()) as Record<string, unknown>;
      if (body.ok) return { ok: true, outcome: body.outcome as Outcome, message: body.message as string, lines: body.lines as Line[] };
      if (body.refused) return { ok: false, refused: true, code: body.code as string, rule: body.rule as string, message: body.message as string };
      return { ok: false, message: (body.error as string) ?? `the ledger answered ${res.status}` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  },
};

/** A ledger in memory, for the demo. Same engine, no network, nothing kept. */
export class SandboxLedger implements LedgerRunner {
  state: LedgerState = { lines: [], approvals: [] };
  /** A pinned clock so the demo's lines are stable; each act moves it a minute. */
  clock = Date.parse("2026-10-20T09:00:00.000Z");

  async read() {
    return readModel(this.state, this.clock);
  }

  async run(action: Action): Promise<ActResponse> {
    try {
      this.clock += 60_000;
      const result = await act(this.state, action, this.clock);
      this.state = applyResult(this.state, result);
      return { ok: true, outcome: result.outcome, message: result.message, lines: result.lines };
    } catch (err) {
      if (err instanceof Refusal) return { ok: false, refused: true, code: err.code, rule: err.rule, message: err.message };
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  reset() {
    this.state = { lines: [], approvals: [] };
    this.clock = Date.parse("2026-10-20T09:00:00.000Z");
  }
}

const IDENTITY_KEY = "stenographer.ledger.identity";
const SESSION_KEY = "stenographer.ledger.session";

export interface StoredIdentity {
  by: string;
  role: "human" | "agent";
}

function randomSuffix(): string {
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** This browser's agent session: one per browser, so a session approves once. */
export function browserSession(): string {
  try {
    const held = localStorage.getItem(SESSION_KEY);
    if (held) return held;
    const made = `sess-${randomSuffix()}`;
    localStorage.setItem(SESSION_KEY, made);
    return made;
  } catch {
    return `sess-${randomSuffix()}`;
  }
}

export function loadIdentity(): StoredIdentity {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredIdentity;
      if (parsed && typeof parsed.by === "string" && (parsed.role === "human" || parsed.role === "agent")) return parsed;
    }
  } catch {
    /* no storage */
  }
  return { by: "", role: "human" };
}

export function saveIdentity(identity: StoredIdentity): void {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    /* no storage */
  }
}

export function actorOf(identity: StoredIdentity): Actor {
  return identity.role === "agent" ? { by: identity.by, role: "agent", agentSessionId: browserSession() } : { by: identity.by, role: "human" };
}
