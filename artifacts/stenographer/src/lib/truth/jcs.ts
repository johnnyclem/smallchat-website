/**
 * JSON Canonicalization Scheme (RFC 8785) and SHA-256, the byte form a truth
 * line is hashed in. The rules follow stenographer's reference codec
 * (src/truth/jcs.ts there): keys sorted by UTF-16 code units, numbers in
 * ECMAScript's shortest form, JSON's minimal string escaping, no whitespace,
 * and anything JSON can't carry is an error rather than a silent coercion.
 *
 * Hashing goes through WebCrypto so the same module runs in the browser (the
 * demo and the verify button) and in a Vercel function (the public ledger).
 */

export class CanonicalizationError extends Error {}

/** RFC 8785 canonical JSON text of `value`. */
export function canonicalize(value: unknown): string {
  return serialize(value, "$");
}

const encoder = new TextEncoder();

/** Lowercase hex SHA-256 of the UTF-8 bytes of `text`. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoder.encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function serialize(value: unknown, path: string): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) throw new CanonicalizationError(`${path}: ${value} is not representable in JSON`);
      return String(value);
    case "string":
      return serializeString(value, path);
    case "object":
      return Array.isArray(value) ? serializeArray(value, path) : serializeObject(value as object, path);
    default:
      throw new CanonicalizationError(`${path}: ${typeof value} is not representable in JSON`);
  }
}

function serializeString(value: string, path: string): string {
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        i++;
        continue;
      }
      throw new CanonicalizationError(`${path}: lone surrogate U+${unit.toString(16).toUpperCase()}`);
    }
    if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new CanonicalizationError(`${path}: lone surrogate U+${unit.toString(16).toUpperCase()}`);
    }
  }
  return JSON.stringify(value);
}

function serializeArray(value: unknown[], path: string): string {
  const parts: string[] = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === undefined) throw new CanonicalizationError(`${path}[${i}]: undefined is not representable in JSON`);
    parts.push(serialize(value[i], `${path}[${i}]`));
  }
  return `[${parts.join(",")}]`;
}

function serializeObject(value: object, path: string): string {
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    throw new CanonicalizationError(`${path}: only plain objects are canonicalized`);
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((k) => record[k] !== undefined)
    .sort();
  const parts = keys.map((k) => `${serializeString(k, path)}:${serialize(record[k], `${path}.${k}`)}`);
  return `{${parts.join(",")}}`;
}
