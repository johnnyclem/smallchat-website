/**
 * The public ledger's HTTP surface, as Web-standard Request → Response
 * handlers. Vercel serves them from api/ledger/*; vite.config.ts mounts the
 * same functions in `pnpm dev`.
 *
 *   GET  /api/ledger          the read model: entries, docket, the stream, the head
 *   POST /api/ledger/act      one action: assert-uv, approve, refute or strike
 *   GET  /api/ledger/export   the stream as truth-format JSONL, for `stenographer import`
 */

import { act, type Action } from "../lib/truth/engine.js";
import { readModel } from "../lib/truth/read.js";
import { Refusal } from "../lib/truth/types.js";
import { appendResult, configFromEnv, loadState, StoreError, type StoreConfig } from "./store.js";

const MAX_BODY_BYTES = 32 * 1024;

/** jsonb storage reorders keys; the hash is over the JCS form so nothing changes, but a line reads better in the spec's order. */
const ENVELOPE_FIRST = ["schemaVersion", "seq", "id", "type", "ts", "author"];
const ENVELOPE_LAST = ["x-steno", "prevHash", "hash"];
export function presentLine(line: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of ENVELOPE_FIRST) if (k in line) out[k] = line[k];
  for (const k of Object.keys(line)) if (!ENVELOPE_FIRST.includes(k) && !ENVELOPE_LAST.includes(k)) out[k] = line[k];
  for (const k of ENVELOPE_LAST) if (k in line) out[k] = line[k];
  return out;
}
const RETRIES = 3;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...CORS, ...headers } });
}

function failure(err: unknown): Response {
  if (err instanceof Refusal) return json({ refused: true, code: err.code, rule: err.rule, message: err.message, ...(err.suggest ? { suggest: err.suggest } : {}) }, 422);
  if (err instanceof StoreError) {
    if (err.code === "P0009") return json({ error: err.message }, 429);
    if (err.code === "P0007") return json({ error: "The ledger moved while this was written. Try again." }, 409);
    return json({ error: err.status === 503 ? err.message : "The ledger's storage refused the request.", detail: err.message }, err.status >= 400 && err.status < 600 ? err.status : 502);
  }
  console.error(err);
  return json({ error: "Something failed on the ledger's side." }, 500);
}

export async function readLedger(_request: Request, config: StoreConfig = configFromEnv()): Promise<Response> {
  try {
    const state = await loadState(config);
    state.lines = state.lines.map((l) => presentLine(l) as typeof l);
    return json(readModel(state), 200, { "Cache-Control": "no-store" });
  } catch (err) {
    return failure(err);
  }
}

export async function exportLedger(request: Request, config: StoreConfig = configFromEnv()): Promise<Response> {
  try {
    const since = Number(new URL(request.url).searchParams.get("sinceSeq") ?? "0");
    const state = await loadState(config);
    const lines = state.lines.filter((l) => l.seq > (Number.isFinite(since) ? since : 0));
    const body = lines.map((l) => JSON.stringify(presentLine(l)) + "\n").join("");
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Content-Disposition": 'inline; filename="stenographer-public-ledger.jsonl"', "Cache-Control": "no-store", ...CORS },
    });
  } catch (err) {
    return failure(err);
  }
}

export async function actOnLedger(request: Request, config: StoreConfig = configFromEnv()): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "POST an action" }, 405);
  let action: Action;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: `An action is at most ${MAX_BODY_BYTES} bytes.` }, 413);
    action = JSON.parse(text) as Action;
    if (!action || typeof action !== "object") throw new Error("not an object");
  } catch {
    return json({ error: "The body is a JSON action: {type, actor, ...}." }, 400);
  }
  try {
    for (let attempt = 1; ; attempt++) {
      const state = await loadState(config);
      const result = await act(state, action);
      try {
        const head = await appendResult(config, state, result);
        const after = { lines: [...state.lines, ...result.lines], approvals: state.approvals };
        const touched = new Set<string>();
        for (const line of result.lines) {
          touched.add(line.id);
          if (typeof line.target === "string") touched.add(line.target);
        }
        if ("id" in action) touched.add(action.id);
        const model = readModel(after);
        return json({ ok: true, outcome: result.outcome, message: result.message, lines: result.lines, head, entries: model.entries.filter((e) => touched.has(e.id)) }, 200);
      } catch (err) {
        if (err instanceof StoreError && err.code === "P0007" && attempt < RETRIES) continue;
        throw err;
      }
    }
  } catch (err) {
    return failure(err);
  }
}
