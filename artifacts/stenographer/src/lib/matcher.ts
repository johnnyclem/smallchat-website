/**
 * A browser-sized sketch of Stenographer's assertion-contradicts-TB detector,
 * enough to demo its v1 rules: exact tokens, subjects that tolerate naming
 * drift but must sit next to the value, and "mentions current" = discussion.
 */

export interface Literal {
  subject?: string;
  dead: string;
  current?: string;
}

export interface Tombstone {
  id: string;
  claim: string;
  literal: Literal;
}

export type Verdict =
  | { kind: "objection"; reason: string }
  | { kind: "silent"; reason: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** `LOG_BUDGET`, `logBudget` and `log budget` all become log[\s_-]*budget. */
function subjectPattern(subject: string): string {
  const words = subject
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_\-]+/)
    .filter(Boolean)
    .map((w) => escape(w.toLowerCase()));
  return words.join("[\\s_\\-]*");
}

/** Whole-token occurrences: `30` never matches inside `300` or `v30a`. */
function tokenRegex(value: string): RegExp {
  return new RegExp(`(?<![A-Za-z0-9_])${escape(value)}(?![A-Za-z0-9_]|\\.\\d)`, "gi");
}

/** What may sit between a subject and its value: `=`, `:`, `is`, `to`, quotes. */
const ADJACENT = /^[\s=:'"`]*(?:(?:is|to|at|of|now)\s+|:=\s*)?[\s'"`]*$/i;

export function judge(line: string, tb: Tombstone): Verdict {
  const { subject, dead, current } = tb.literal;
  const text = line.trim();
  if (!text) return { kind: "silent", reason: "Waiting for the agent to say something." };

  const deadHits = [...text.matchAll(tokenRegex(dead))];
  if (deadHits.length === 0) {
    if (text.toLowerCase().includes(dead.toLowerCase())) {
      return { kind: "silent", reason: `Exact tokens only: “${dead}” appears, but inside a longer token.` };
    }
    return { kind: "silent", reason: "Nothing on the record matches." };
  }

  if (current && tokenRegex(current).test(text)) {
    return { kind: "silent", reason: `It mentions the current value (${current}), so this is discussion, not assertion.` };
  }

  if (!subject) {
    return { kind: "objection", reason: `“${dead}” is tombstoned by ${tb.id}.` };
  }

  const subj = new RegExp(subjectPattern(subject), "gi");
  for (const s of text.matchAll(subj)) {
    const end = s.index! + s[0].length;
    for (const d of deadHits) {
      if (d.index! >= end && ADJACENT.test(text.slice(end, d.index))) {
        return { kind: "objection", reason: `${subject} = ${dead} is tombstoned by ${tb.id}.` };
      }
    }
  }
  return { kind: "silent", reason: `“${dead}” appears, but not as the value of ${subject}.` };
}
