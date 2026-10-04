/**
 * A browser-sized sketch of the literal matcher Stenographer 1.0 runs for
 * live objections and the PreToolUse gate (src/truth/literal-matcher.ts in
 * the stenographer repo), enough to demo its rules: whole tokens, a subject
 * that tolerates naming drift but sits near the value in the same clause,
 * the replacement named in that clause = discussion, and no negation or
 * past-tense cue. It reads one line of prose. The real one also reads what
 * tool calls write, and compiles every literal into one automaton.
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

interface Span {
  start: number;
  end: number;
}

type Outcome = { kind: "asserts" | "split" | "current" | "far" } | { kind: "negated"; cue: string };

/** How far after a subject the value may sit (`LOG_BUDGET = 30`), and how far before it (`30 as the log budget`). */
const AFTER_SUBJECT = 40;
const BEFORE_SUBJECT = 20;
/** How far before the pair a negation cue still governs it ("do not set …"). */
const NEGATION_WINDOW = 24;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isWord = (c: string | undefined) => c !== undefined && /[A-Za-z0-9_]/.test(c);
const isDigit = (c: string | undefined) => c !== undefined && /[0-9]/.test(c);

/** Whole tokens: `30` is not in `300`, `1.30` or `30.5`; an identifier may follow a `.`. */
function isToken(text: string, start: number, end: number): boolean {
  if (start > 0 && isWord(text[start])) {
    const before = text[start - 1];
    if (isWord(before) || (isDigit(text[start]) && before === ".")) return false;
  }
  if (end < text.length && isWord(text[end - 1])) {
    const after = text[end];
    if (isWord(after) || (after === "." && isDigit(text[end + 1]))) return false;
  }
  return true;
}

/** Whole-token occurrences of `value` in text[from, to). Values match case-sensitively. */
function tokenSpans(text: string, value: string, from = 0, to = text.length): Span[] {
  const spans: Span[] = [];
  for (let at = text.indexOf(value, Math.max(0, from)); at !== -1 && at + value.length <= to; at = text.indexOf(value, at + 1)) {
    if (isToken(text, at, at + value.length)) spans.push({ start: at, end: at + value.length });
  }
  return spans;
}

/** `LOG_BUDGET`, `logBudget` and `log budget` all match; so do `maxHTTPRetries` and `MAX_HTTP_RETRIES`. */
function subjectRegex(subject: string): RegExp {
  const words = subject
    .split(/[\s_\-.]+|(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/)
    .filter(Boolean)
    .map(escape);
  return new RegExp(`(?<![A-Za-z0-9_])${words.join("(?:\\s|[_\\-.])*")}(?![A-Za-z0-9_])`, "gi");
}

/** A clause ends at `;`, `&&`, `||`, a line comment, or where another assignment starts. */
const SEPARATOR = /;|&&|\|\||\/\/|(?<=^|\s)#(?=\s|$)/g;
const ASSIGNMENT_TARGET = /(?<![\w$.\-])[A-Za-z_$][\w$.\-]*["'\]]?\s*(?::=|=(?![=>~])|:(?![:/]))/g;
/** Conjunctions and sentence ends limit how far back a negation reaches. */
const SOFT_SEPARATOR = /;|&&|\|\||\/\/|,|\.(?=\s)|\b(?:and|then|but|so)\b/gi;
const NEGATION =
  /\b(?:not|never|no longer|(?:do|does|did|is|are|was|were|should|would|could|wo|ca)n['’]?t|cannot|avoid(?:s|ed|ing)?|instead of|rather than|stop(?:ped)? using|remov(?:e|es|ed|ing)|drop(?:s|ped|ping)?|delet(?:e|es|ed|ing)|deprecat(?:e|es|ed|ing)|replac(?:e|es|ed|ing)|was|were|used to|formerly|previously|old)\b/i;

function clauseBreaks(text: string, from: number, to: number): Span[] {
  const region = text.slice(from, to);
  const breaks: Span[] = [];
  for (const m of region.matchAll(SEPARATOR)) breaks.push({ start: from + m.index!, end: from + m.index! + m[0].length });
  for (const m of region.matchAll(ASSIGNMENT_TARGET)) {
    const at = from + m.index!;
    // `x: number = 30` is a type annotation, not a new target
    let k = at - 1;
    while (k >= 0 && (text[k] === " " || text[k] === "\t")) k--;
    if (k < 0 || text[k] !== ":") breaks.push({ start: at, end: at });
  }
  return breaks;
}

/** Whether a subject (or, without one, the value itself) and the value make one asserting clause. */
function pairOutcome(lit: Literal, text: string, subject: Span, dead: Span): Outcome {
  const a = Math.min(subject.start, dead.start);
  const b = Math.max(subject.end, dead.end);
  const regionStart = Math.max(0, a - Math.max(NEGATION_WINDOW, BEFORE_SUBJECT) - 2);
  const regionEnd = Math.min(text.length, b + AFTER_SUBJECT + 2);
  const breaks = clauseBreaks(text, regionStart, regionEnd);
  if (breaks.some((br) => br.start > a && br.start < b)) return { kind: "split" };

  let clauseStart = regionStart;
  let clauseEnd = regionEnd;
  for (const br of breaks) {
    if (br.end <= a && br.end > clauseStart) clauseStart = br.end;
    if (br.start >= b && br.start < clauseEnd) clauseEnd = br.start;
  }
  const from = Math.max(clauseStart, a - BEFORE_SUBJECT);
  const to = Math.min(clauseEnd, b + AFTER_SUBJECT);
  if (lit.current && tokenSpans(text, lit.current, from, to).length > 0) return { kind: "current" };

  let scopeStart = Math.max(0, a - NEGATION_WINDOW);
  while (scopeStart > 0 && isWord(text[scopeStart - 1])) scopeStart--;
  let negationStart = scopeStart;
  for (const m of text.slice(scopeStart, dead.start).matchAll(SOFT_SEPARATOR)) {
    const end = scopeStart + m.index! + m[0].length;
    if (end <= a) negationStart = Math.max(negationStart, end);
  }
  const cue = text.slice(negationStart, dead.start).match(NEGATION);
  return cue ? { kind: "negated", cue: cue[0] } : { kind: "asserts" };
}

/** The first subject near this occurrence that asserts it, else why none does. */
function occurrenceOutcome(lit: Literal, text: string, dead: Span): Outcome {
  if (!lit.subject) return pairOutcome(lit, text, dead, dead);
  const span = lit.subject.length * 3 + 8;
  const from = Math.max(0, dead.start - AFTER_SUBJECT - span - 1);
  const to = Math.min(text.length, dead.end + BEFORE_SUBJECT + span + 1);
  let first: Outcome | null = null;
  for (const m of text.slice(from, to).matchAll(subjectRegex(lit.subject))) {
    const start = from + m.index!;
    const end = start + m[0].length;
    // A match at the slice's edge may be cut short
    if ((m.index === 0 && from > 0) || (end === to && to < text.length)) continue;
    const near =
      (dead.start >= end && dead.start - end <= AFTER_SUBJECT) || (dead.end <= start && start - dead.end <= BEFORE_SUBJECT);
    if (!near) continue;
    const outcome = pairOutcome(lit, text, { start, end }, dead);
    if (outcome.kind === "asserts") return outcome;
    first ??= outcome;
  }
  return first ?? { kind: "far" };
}

export function judge(line: string, tb: Tombstone): Verdict {
  const { subject, dead, current } = tb.literal;
  if (!line.trim()) return { kind: "silent", reason: "Waiting for the agent to say something." };

  const hits = tokenSpans(line, dead);
  if (hits.length === 0) {
    if (line.toLowerCase().includes(dead.toLowerCase())) {
      return { kind: "silent", reason: `Exact tokens only: “${dead}” appears, but in another case or inside a longer token.` };
    }
    return { kind: "silent", reason: "Nothing on the record matches." };
  }

  const outcomes = hits.map((hit) => occurrenceOutcome(tb.literal, line, hit));
  if (outcomes.some((o) => o.kind === "asserts")) {
    return {
      kind: "objection",
      reason: subject ? `${subject} = ${dead} is tombstoned by ${tb.id}.` : `“${dead}” is tombstoned by ${tb.id}.`,
    };
  }

  const why = outcomes[0];
  switch (why.kind) {
    case "current":
      return { kind: "silent", reason: `It names the current value (${current}) in the same clause: discussion, not assertion.` };
    case "negated":
      return { kind: "silent", reason: `A negated or past-tense mention (“${why.cue}”) doesn't object.` };
    case "split":
      return { kind: "silent", reason: `“${dead}” and ${subject} sit in different clauses.` };
    default:
      return { kind: "silent", reason: `“${dead}” appears, but not next to ${subject}.` };
  }
}
