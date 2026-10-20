/**
 * Identities (spec/truth-format, "Identities"). Who stands behind a line is
 * compared by key: NFKC, default-ignorable code points removed, trimmed,
 * lowercased. Anonymous and generic names are refused, and so are the
 * reserved ones (`migration`, `detector:*`). An agent is an identity whose
 * key starts with `agent:` (this ledger keeps no signer registry, so the
 * prefix is the rule, as it is for a stenographer without one).
 */

import { Refusal } from "./types";

const ANONYMOUS = new Set(["", "system", "assistant", "agent", "ai", "bot", "anonymous", "unknown", "user", "human", "admin", "null", "none", "me"]);
export const MIGRATION_AUTHOR = "migration";
export const DETECTOR_PREFIX = "detector:";
export const AGENT_PREFIX = "agent:";

export function identityKey(identity: string): string {
  return identity
    .normalize("NFKC")
    .replace(/\p{Default_Ignorable_Code_Point}/gu, "")
    .trim()
    .toLowerCase();
}

export function canonicalIdentity(identity: string): string {
  return identity.normalize("NFC").trim();
}

export function isAnonymousIdentity(identity: string): boolean {
  return ANONYMOUS.has(identityKey(identity));
}

export function isReservedIdentity(identity: string): boolean {
  const key = identityKey(identity);
  return key === MIGRATION_AUTHOR || key.startsWith(DETECTOR_PREFIX);
}

export function hasControlCharacters(identity: string): boolean {
  return /\p{Cc}/u.test(identity);
}

export function isAgentIdentity(identity: string): boolean {
  return identityKey(identity).startsWith(AGENT_PREFIX);
}

export function sameIdentity(a: string | null | undefined, b: string | null | undefined): boolean {
  return typeof a === "string" && typeof b === "string" && identityKey(a) === identityKey(b);
}

/** Why a name can't stand behind a line, or null when it can. */
export function identityIssue(raw: unknown): string | null {
  if (typeof raw !== "string") return "an identity is a string";
  if (isAnonymousIdentity(raw)) return `'${raw}' is anonymous or generic: use a handle someone answers to`;
  if (hasControlCharacters(raw)) return "an identity cannot contain control characters";
  if (isReservedIdentity(raw)) return `'${raw}' is reserved: 'migration' and 'detector:*' belong to the backfill and detector paths`;
  if (canonicalIdentity(raw).length > 80) return "an identity is at most 80 characters";
  return null;
}

/** The canonical form of an identity that may act, or a refusal. */
export function requireIdentity(raw: unknown, what: string): string {
  const issue = identityIssue(raw);
  if (issue) throw new Refusal("identity", `${what}: ${issue}`, "Identities");
  return canonicalIdentity(raw as string);
}
