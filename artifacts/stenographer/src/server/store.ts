/**
 * The public ledger's storage: Supabase Postgres through PostgREST, with
 * plain fetch (no client library in a Vercel function). Reads use the
 * publishable key, which the row policies let read everything; the one
 * write is the steno_ledger_append RPC, which checks a secret only the
 * server holds and continues the stream after the tail the server read
 * (supabase/steno_public_ledger.sql).
 */

import type { ActResult, LedgerState } from "../lib/truth/engine.js";
import type { Line, PendingApproval } from "../lib/truth/types.js";

export interface StoreConfig {
  url: string;
  anonKey: string;
  secret: string;
}

export class StoreError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | null = null
  ) {
    super(message);
    this.name = "StoreError";
  }
}

export function configFromEnv(env: Record<string, string | undefined> = process.env): StoreConfig {
  const url = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;
  const secret = env.STENO_LEDGER_SECRET;
  if (!url || !anonKey || !secret) {
    throw new StoreError("The ledger is not configured: SUPABASE_URL, SUPABASE_ANON_KEY and STENO_LEDGER_SECRET are required.", 503, "unconfigured");
  }
  return { url: url.replace(/\/+$/, ""), anonKey, secret };
}

const PAGE = 1000;

async function rest<T>(config: StoreConfig, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let body: { code?: string; message?: string; hint?: string } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      /* not JSON */
    }
    throw new StoreError(body.message ?? `${res.status} from the database`, res.status, body.code ?? null);
  }
  return (await res.json()) as T;
}

/** The whole stream, in seq order, and the approvals still waiting beside it. */
export async function loadState(config: StoreConfig): Promise<LedgerState> {
  const lines: Line[] = [];
  let after = 0;
  for (;;) {
    const rows = await rest<Array<{ seq: number; line: Line }>>(config, `steno_ledger_lines?select=seq,line&seq=gt.${after}&order=seq.asc&limit=${PAGE}`);
    for (const r of rows) lines.push(r.line);
    if (rows.length < PAGE) break;
    after = rows[rows.length - 1].seq;
  }
  const approvalRows = await rest<
    Array<{
      id: string;
      uv_id: string;
      by: string;
      role: "human" | "agent";
      agent_session_id: string | null;
      approver_key: string;
      evidence: PendingApproval["evidence"];
      note: string | null;
      ts: string;
      consumed_by: string | null;
    }>
  >(config, `steno_ledger_approvals?select=*&consumed_by=is.null&order=ts.asc&limit=${PAGE}`);
  const approvals: PendingApproval[] = approvalRows.map((r) => ({
    id: r.id,
    uvId: r.uv_id,
    by: r.by,
    role: r.role,
    agentSessionId: r.agent_session_id,
    approverKey: r.approver_key,
    evidence: Array.isArray(r.evidence) ? r.evidence : [],
    note: r.note,
    ts: new Date(r.ts).toISOString(),
    consumedBy: r.consumed_by,
  }));
  return { lines, approvals };
}

/** Append an action's result after the tail the state was read at. Throws StoreError 409 (code P0007) when the tail moved. */
export async function appendResult(config: StoreConfig, state: LedgerState, result: ActResult): Promise<{ seq: number; hash: string | null }> {
  const fromSeq = state.lines.length > 0 ? state.lines[state.lines.length - 1].seq : 0;
  const consumed = new Set(result.consumed?.ids ?? []);
  const out = await rest<{ lines: number; approvals: number; seq: number; hash: string | null }>(config, "rpc/steno_ledger_append", {
    method: "POST",
    body: JSON.stringify({
      p_secret: config.secret,
      p_from_seq: fromSeq,
      p_lines: result.lines,
      p_approvals: result.newApprovals.map((a) => ({ ...a, consumedBy: consumed.has(a.id) ? result.consumed!.by : null })),
      p_consume: result.consumed?.ids ?? [],
      p_consumed_by: result.consumed?.by ?? null,
    }),
  });
  return { seq: out.seq, hash: out.hash };
}
