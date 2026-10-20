/**
 * The shapes this ledger writes and reads: a subset of stenographer's truth
 * format, version 2 (spec/truth-format/README.md in the stenographer repo).
 */

export type LineType = "TB" | "UV" | "ADDENDUM" | "RULING" | "TRANSITION";

export interface Evidence {
  kind: string;
  ref: string;
  detail?: string;
}

export interface VerifyBy {
  kind: string;
  value: string;
  detail?: string;
}

export interface Literal {
  dead: string;
  subject?: string;
  current?: string;
}

export interface Link {
  fromId: string;
  toId: string;
  type: string;
  contentHash?: string;
}

export interface XSteno {
  origin: string;
  provenance: { kind: string; ref?: string };
  agentSessionId: string | null;
  targetRef: string | null;
  links: Link[];
}

export interface ApprovalRecord {
  by: string;
  role: "human" | "agent" | "reporter";
  ts: string;
  agentSessionId?: string;
  cites?: string[];
}

export interface QuorumMember {
  author: string;
  agentSessionId: string;
  ts: string;
  evidence: Evidence[];
  verdict?: "verified" | "refuted";
}

/** A line as written: the envelope plus its type's body. */
export type Line = Record<string, unknown> & {
  schemaVersion: 2;
  seq: number;
  id: string;
  type: LineType;
  ts: string;
  author: string;
  prevHash: string | null;
  hash: string;
};

/** A line's body before it is chained (no seq, prevHash or hash). */
export type LineBody = Record<string, unknown> & { id: string; type: LineType; ts: string; author: string };

export const TB_STATUSES = ["active", "contested", "overridden", "struck"] as const;
export const UV_STATUSES = ["open", "verified", "refuted", "struck"] as const;
export const CAUSE_KINDS = ["contest", "override", "strike", "verify", "refute"] as const;

export const EVIDENCE_KINDS = ["commit", "file", "test", "claimed-command", "wiki", "message", "chat", "ticket", "doc"] as const;
/** Settling evidence points at something a reader can check (spec, "Evidence classes"). */
export const SETTLING_EVIDENCE_KINDS = ["commit", "file", "test", "claimed-command", "wiki"] as const;
export const VERIFY_BY_KINDS = ["command", "inspect", "ask", "observe"] as const;

export type EvidenceClass = "settling" | "question";
export function evidenceClass(kind: string): EvidenceClass {
  return (SETTLING_EVIDENCE_KINDS as readonly string[]).includes(kind) ? "settling" : "question";
}

/** Who acts. A person by handle; an agent by identity and session. */
export interface Actor {
  by: string;
  role: "human" | "agent";
  agentSessionId?: string | null;
}

/** Operational state beside the ledger: an approval of an open UV, never a line until a promotion writes it into the TB. */
export interface PendingApproval {
  id: string;
  uvId: string;
  by: string;
  role: "human" | "agent";
  agentSessionId: string | null;
  /** A person by identity, an agent by session: one approver, one approval. */
  approverKey: string;
  evidence: Evidence[];
  note: string | null;
  ts: string;
  /** The TB the promotion wrote it into; null while the UV is open. */
  consumedBy: string | null;
}

export type RefusalCode =
  | "identity"
  | "input"
  | "not-found"
  | "status"
  | "contempt"
  | "role"
  | "evidence"
  | "duplicate"
  | "conflict";

/** The ledger declined a write. `rule` names the section of the truth format or the README the rule comes from. */
export class Refusal extends Error {
  constructor(
    public readonly code: RefusalCode,
    message: string,
    public readonly rule: string
  ) {
    super(message);
    this.name = "Refusal";
  }
}

const RFC3339 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-]\d{2}):(\d{2}))$/;

export function isRfc3339DateTime(s: string): boolean {
  const m = RFC3339.exec(s);
  if (!m) return false;
  const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1]) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;
  if (m[7] !== undefined && (Math.abs(Number(m[7])) > 23 || Number(m[8]) > 59)) return false;
  return Number.isFinite(Date.parse(s));
}

export const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
export const HEX64 = /^[0-9a-f]{64}$/;

/** 21 days: a sprint, the default horizon stenographer reads open UVs with. */
export const DEFAULT_UV_HORIZON_SECONDS = 21 * 24 * 60 * 60;
