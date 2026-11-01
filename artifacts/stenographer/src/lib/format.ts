/** One hash length and one timestamp format, everywhere on the page. */
export const HASH_LEN = 12;

export const hash12 = (hash: string): string => hash.slice(0, HASH_LEN);

/** 2026-10-20T09:03:00.000Z becomes 2026-10-20 09:03Z. */
export const fmtTs = (ts: string): string => `${ts.replace("T", " ").slice(0, 16)}Z`;

/** Cut a string at `max` characters, with an ellipsis when it was cut. Trailing punctuation goes first, so a sentence end never sits before the ellipsis. */
export const clip = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1).replace(/[\s.,;:!?\u2014-]+$/, "")}…` : text);

/** The id of a ledger entry, shortened for a reader. */
export const shortId = (id: string): string => (id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id);
