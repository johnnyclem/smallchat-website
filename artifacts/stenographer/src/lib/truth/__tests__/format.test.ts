/**
 * Conformance against the truth format's golden fixtures (vendored from
 * stenographer's spec/truth-format/fixtures): every hash recomputes, every
 * valid file chains, the fold matches the expected file, and the two
 * invalid chains are refused.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lineHash, verifyChain } from "../chain.js";
import { fold } from "../fold.js";
import type { Line } from "../types.js";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const parse = (name: string): Line[] =>
  fixture(name)
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as Line);

describe("truth format fixtures", () => {
  for (const file of ["ledger.jsonl", "review.jsonl", "derivation.jsonl"]) {
    it(`${file}: every hash recomputes and the chain holds`, async () => {
      const lines = parse(file);
      for (const line of lines) expect(await lineHash(line)).toBe(line.hash);
      expect(await verifyChain(lines)).toEqual([]);
    });
  }

  for (const file of ["ledger", "review"]) {
    it(`${file}.jsonl folds to ${file}.expected.json`, () => {
      const expected = JSON.parse(fixture(`${file}.expected.json`)) as Record<string, { type: string; status: string; current: boolean; corroborated?: boolean }>;
      const f = fold(parse(`${file}.jsonl`));
      for (const [id, want] of Object.entries(expected)) {
        const got = f.entries.get(id);
        expect(got, id).toBeDefined();
        expect(got!.type).toBe(want.type);
        expect(got!.status).toBe(want.status);
        expect(got!.current).toBe(want.current);
        if (want.corroborated !== undefined) expect(got!.corroborated).toBe(want.corroborated);
      }
      expect(f.entries.size).toBe(Object.keys(expected).length);
    });
  }

  it("refuses a gap in the chain", async () => {
    const problems = await verifyChain(parse("chain-gap.jsonl"));
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0].error).toMatch(/seq|prevHash/);
  });

  it("refuses a fork from another writer", async () => {
    const problems = await verifyChain(parse("chain-fork.jsonl"));
    expect(problems.length).toBeGreaterThan(0);
  });

  it("refuses an edited line", async () => {
    const lines = parse("ledger.jsonl");
    lines[0] = { ...lines[0], claim: "edited" } as Line;
    const problems = await verifyChain(lines);
    expect(problems[0].error).toMatch(/hash does not match/);
  });
});
