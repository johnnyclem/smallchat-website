import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { verifyChain } from "../chain.js";
import { act, applyResult, type Action, type LedgerState } from "../engine.js";
import { fold } from "../fold.js";
import { readModel } from "../read.js";
import { Refusal, type Actor, type Evidence } from "../types.js";

const schema = JSON.parse(readFileSync(new URL("./fixtures/wiki-line.v2.schema.json", import.meta.url), "utf8"));
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const sam: Actor = { by: "sam", role: "human" };
const kim: Actor = { by: "kim", role: "human" };
const a1: Actor = { by: "agent:claude-code", role: "agent", agentSessionId: "sess-1" };
const a2: Actor = { by: "agent:claude-code", role: "agent", agentSessionId: "sess-2" };
const a3: Actor = { by: "agent:codex", role: "agent", agentSessionId: "sess-3" };
const a4: Actor = { by: "agent:gemini", role: "agent", agentSessionId: "sess-4" };

const commit: Evidence[] = [{ kind: "commit", ref: "9f2c1ab" }];
const file: Evidence[] = [{ kind: "file", ref: "src/config.ts:12", detail: "LOG_BUDGET = 100" }];
const test: Evidence[] = [{ kind: "test", ref: "test/config.test.ts" }];

class Ledger {
  state: LedgerState = { lines: [], approvals: [] };
  clock = Date.parse("2026-10-01T10:00:00.000Z");
  async run(action: Action) {
    this.clock += 60_000;
    const result = await act(this.state, action, this.clock);
    this.state = applyResult(this.state, result);
    for (const line of result.lines) {
      if (!validate(line)) throw new Error(`schema: ${JSON.stringify(validate.errors)}\n${JSON.stringify(line)}`);
    }
    expect(await verifyChain(this.state.lines)).toEqual([]);
    return result;
  }
  async refused(action: Action, code: Refusal["code"], pattern?: RegExp) {
    let err: unknown;
    try {
      await act(this.state, action, this.clock + 1);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Refusal);
    expect((err as Refusal).code).toBe(code);
    if (pattern) expect((err as Refusal).message).toMatch(pattern);
    return err as Refusal;
  }
  entry(id: string) {
    return fold(this.state.lines).entries.get(id)!;
  }
}

async function claim(l: Ledger, actor: Actor, assertion = "LOG_BUDGET is 100.", contests: string | null = null) {
  const r = await l.run({ type: "assert-uv", actor, assertion, basis: "I read the config", verifyBy: { kind: "inspect", value: "src/config.ts" }, contests });
  return (r.outcome as { id: string }).id;
}

describe("asserting", () => {
  it("files an open UV, as a person or an agent session", async () => {
    const l = new Ledger();
    const id = await claim(l, a1);
    expect(l.entry(id).status).toBe("open");
    expect(l.entry(id).line["x-steno"]).toMatchObject({ agentSessionId: "sess-1", origin: "stenographer.smallchat.dev" });
    const id2 = await claim(l, sam, "Retries are idempotent.");
    expect(l.entry(id2).current).toBe(true);
    expect(l.state.lines.map((x) => x.seq)).toEqual([1, 2]);
  });

  it("refuses anonymous, reserved and mismatched identities", async () => {
    const l = new Ledger();
    await l.refused({ type: "assert-uv", actor: { by: "assistant", role: "human" }, assertion: "x", basis: "y", verifyBy: { kind: "ask", value: "ops" } }, "identity");
    await l.refused({ type: "assert-uv", actor: { by: "detector:wiki", role: "human" }, assertion: "x", basis: "y", verifyBy: { kind: "ask", value: "ops" } }, "identity");
    await l.refused({ type: "assert-uv", actor: { by: "agent:x", role: "human" }, assertion: "x", basis: "y", verifyBy: { kind: "ask", value: "ops" } }, "role");
    await l.refused({ type: "assert-uv", actor: { by: "sam", role: "agent", agentSessionId: "s" }, assertion: "x", basis: "y", verifyBy: { kind: "ask", value: "ops" } }, "role");
    await l.refused({ type: "assert-uv", actor: { by: "agent:x", role: "agent" }, assertion: "x", basis: "y", verifyBy: { kind: "ask", value: "ops" } }, "input");
  });

  it("refuses unknown evidence and verifyBy kinds", async () => {
    const l = new Ledger();
    await l.refused({ type: "assert-uv", actor: sam, assertion: "x", basis: "y", verifyBy: { kind: "vibes", value: "ops" } }, "input");
    const id = await claim(l, a1);
    await l.refused({ type: "approve", actor: sam, id, evidence: [{ kind: "hunch", ref: "x" }] }, "input");
  });
});

describe("approvals, promotion and nomination", () => {
  it("nobody approves what they drafted, by identity or by session", async () => {
    const l = new Ledger();
    const id = await claim(l, a1);
    await l.refused({ type: "approve", actor: a1, id, evidence: commit }, "contempt", /wrote UV/);
    await l.refused({ type: "approve", actor: { by: "Agent:Claude-Code", role: "agent", agentSessionId: "other" }, id, evidence: commit }, "contempt", /wrote UV/);
    await l.refused({ type: "approve", actor: { by: "agent:other", role: "agent", agentSessionId: " sess-1 " }, id, evidence: commit }, "contempt", /one session is one witness/);
    const mine = await claim(l, sam, "My own claim.");
    await l.refused({ type: "approve", actor: { by: " SAM ", role: "human" }, id: mine }, "contempt");
  });

  it("an agent approves only with settling evidence, and a session approves once", async () => {
    const l = new Ledger();
    const id = await claim(l, sam);
    await l.refused({ type: "approve", actor: a1, id, evidence: [{ kind: "doc", ref: "README" }] }, "evidence");
    await l.refused({ type: "approve", actor: a1, id }, "evidence");
    const r = await l.run({ type: "approve", actor: a1, id, evidence: commit });
    expect(r.outcome).toMatchObject({ kind: "approved", approvers: 1, missing: ["a person's approval", "a second approver"] });
    expect(r.lines).toEqual([]);
    await l.refused({ type: "approve", actor: a1, id, evidence: file }, "duplicate");
  });

  it("no number of agent sessions mints a TB; three nominate", async () => {
    const l = new Ledger();
    const id = await claim(l, sam);
    await l.run({ type: "approve", actor: a1, id, evidence: commit });
    const second = await l.run({ type: "approve", actor: a2, id, evidence: file });
    expect(second.outcome.kind).toBe("approved");
    const third = await l.run({ type: "approve", actor: a3, id, evidence: test });
    expect(third.outcome).toMatchObject({ kind: "nominated", members: 3 });
    expect(third.lines).toHaveLength(1);
    const nomination = third.lines[0];
    expect(nomination.type).toBe("ADDENDUM");
    expect(nomination.quorum).toHaveLength(3);
    expect(nomination.author).toBe("agent:codex");
    const e = l.entry(id);
    expect(e.status).toBe("open");
    expect(e.corroborated).toBe(true);
    expect(readModel(l.state, l.clock).entries.find((x) => x.id === id)!.marker).toBe("[UV · CORROBORATED]");
  });

  it("three sessions citing the same evidence, or one kind, nominate nothing", async () => {
    const l = new Ledger();
    const id = await claim(l, sam);
    await l.run({ type: "approve", actor: a1, id, evidence: commit });
    await l.run({ type: "approve", actor: a2, id, evidence: [{ kind: "commit", ref: "9F2C1AB" }] });
    const r = await l.run({ type: "approve", actor: a3, id, evidence: [{ kind: "commit", ref: "9f2c" }] });
    expect(r.outcome.kind).toBe("approved");
    expect(l.entry(id).corroborated).toBe(false);
  });

  it("a person's approval with one other approver promotes: the person signs and answers", async () => {
    const l = new Ledger();
    const id = await claim(l, a1);
    const alone = await l.run({ type: "approve", actor: sam, id });
    expect(alone.outcome).toMatchObject({ kind: "approved", missing: ["a second approver", "evidence"] });
    const r = await l.run({ type: "approve", actor: a3, id, evidence: file });
    expect(r.outcome.kind).toBe("promoted");
    const tb = r.lines[r.lines.length - 1];
    expect(tb.type).toBe("TB");
    expect(tb.signedBy).toBe("sam");
    expect(tb.answerableBy).toBe("sam");
    expect(tb.claim).toBe("LOG_BUDGET is 100.");
    expect(tb.evidence).toEqual(file);
    expect(tb.approvals).toMatchObject([{ by: "sam", role: "human" }, { by: "agent:codex", role: "agent", agentSessionId: "sess-3" }]);
    expect((tb["x-steno"] as { links: unknown[] }).links).toEqual([{ fromId: tb.id, toId: id, type: "supersedes" }]);
    expect(l.entry(id).status).toBe("verified");
    expect(l.entry(id).supersededBy).toBe(tb.id);
    expect(l.entry(tb.id as string).status).toBe("active");
    expect(l.state.approvals.every((a) => a.consumedBy === tb.id)).toBe(true);
    await l.refused({ type: "approve", actor: kim, id }, "status");
  });

  it("two people promote too, on judgment, once there is evidence among them", async () => {
    const l = new Ledger();
    const id = await claim(l, a1);
    await l.run({ type: "approve", actor: sam, id });
    const r = await l.run({ type: "approve", actor: kim, id, evidence: commit });
    expect(r.outcome.kind).toBe("promoted");
    expect(r.lines[r.lines.length - 1].signedBy).toBe("sam");
  });
});

describe("challenge, contest, resolve", () => {
  async function settled(l: Ledger) {
    const id = await claim(l, a1);
    await l.run({ type: "approve", actor: sam, id });
    const r = await l.run({ type: "approve", actor: a3, id, evidence: file });
    return (r.outcome as { tb: string }).tb;
  }

  it("a contest puts the TB under appeal, still truth", async () => {
    const l = new Ledger();
    const tb = await settled(l);
    const uv = await claim(l, a4, "LOG_BUDGET went back to 30 in the hotfix.", tb);
    const e = l.entry(tb);
    expect(e.status).toBe("contested");
    expect(e.current).toBe(true);
    expect(e.contestedBy).toEqual([uv]);
    const last = l.state.lines[l.state.lines.length - 1];
    expect(last).toMatchObject({ type: "TRANSITION", target: tb, status: "contested", cause: { kind: "contest", ref: uv }, author: "agent:gemini" });
  });

  it("history can't be contested", async () => {
    const l = new Ledger();
    const tb = await settled(l);
    await l.run({ type: "strike", actor: kim, id: tb, opinion: "the cited file is on an abandoned branch" });
    await l.refused({ type: "assert-uv", actor: a3, assertion: "x", basis: "y", verifyBy: { kind: "ask", value: "ops" }, contests: tb }, "status");
    await l.refused({ type: "assert-uv", actor: a3, assertion: "x", basis: "y", verifyBy: { kind: "ask", value: "ops" }, contests: "nope" }, "not-found");
  });

  it("refuting the contest returns the TB to active; the TB's own signer can't be the one", async () => {
    const l = new Ledger();
    const tb = await settled(l);
    const uv = await claim(l, a3, "LOG_BUDGET went back to 30.", tb);
    await l.refused({ type: "refute", actor: sam, id: uv, evidence: file }, "contempt", /stands behind TB/);
    await l.refused({ type: "refute", actor: a4, id: uv, evidence: file }, "role");
    await l.refused({ type: "refute", actor: kim, id: uv, evidence: [] }, "evidence");
    const r = await l.run({ type: "refute", actor: kim, id: uv, evidence: file, note: "config.ts still says 100" });
    expect(r.outcome).toEqual({ kind: "refuted", id: uv, upheld: tb });
    expect(r.lines.map((x) => [x.type, x.status])).toEqual([["ADDENDUM", undefined], ["TRANSITION", "refuted"], ["TRANSITION", "active"]]);
    expect(l.entry(tb).status).toBe("active");
    expect(l.entry(uv).status).toBe("refuted");
  });

  it("a second open contest keeps the TB under appeal after one is refuted", async () => {
    const l = new Ledger();
    const tb = await settled(l);
    const c1 = await claim(l, a3, "first doubt", tb);
    const c2 = await claim(l, kim, "second doubt", tb);
    const r = await l.run({ type: "refute", actor: { by: "lee", role: "human" }, id: c1, evidence: file });
    expect((r.outcome as { upheld: string | null }).upheld).toBeNull();
    expect(l.entry(tb).status).toBe("contested");
    expect(l.entry(tb).contestedBy).toEqual([c2]);
  });

  it("approving the contest overrides the TB and mints its successor", async () => {
    const l = new Ledger();
    const tb = await settled(l);
    const uv = await claim(l, a3, "LOG_BUDGET went back to 30 in the hotfix.", tb);
    await l.run({ type: "approve", actor: a1, id: uv, evidence: [{ kind: "file", ref: "config.ts:3", detail: "LOG_BUDGET = 30" }] });
    const r = await l.run({ type: "approve", actor: kim, id: uv });
    expect(r.outcome).toMatchObject({ kind: "promoted", overrode: tb });
    const addendum = r.lines[0];
    expect((addendum["x-steno"] as { links: Array<{ type: string; toId: string }> }).links.map((x) => x.type)).toEqual(["verifies", "overrides"]);
    expect(r.lines.map((x) => [x.type, x.status])).toEqual([["ADDENDUM", undefined], ["TRANSITION", "verified"], ["TRANSITION", "overridden"], ["TB", "active"]]);
    const successor = r.lines[3];
    expect(successor.claim).toMatch(/^Overridden: "LOG_BUDGET is 100\." — contradicted by verified assertion: LOG_BUDGET went back to 30/);
    expect(l.entry(tb).status).toBe("overridden");
    expect(l.entry(tb).current).toBe(false);
    expect(l.entry(successor.id as string).current).toBe(true);
  });

  it("a strike is a person's ruling with an opinion, sticky, and releases a contest", async () => {
    const l = new Ledger();
    const tb = await settled(l);
    const uv = await claim(l, a3, "nonsense", tb);
    await l.refused({ type: "strike", actor: a1, id: uv, opinion: "x" }, "role");
    await l.refused({ type: "strike", actor: kim, id: uv, opinion: "   " }, "input");
    const r = await l.run({ type: "strike", actor: kim, id: uv, opinion: "no evidence at all" });
    expect(r.outcome).toEqual({ kind: "struck", id: uv, released: tb, withdrawn: false });
    expect(r.lines[0]).toMatchObject({ type: "RULING", kind: "strike", answerableBy: "kim" });
    expect(l.entry(uv).status).toBe("struck");
    expect(l.entry(tb).status).toBe("active");
    await l.refused({ type: "strike", actor: kim, id: uv, opinion: "again" }, "status");
    await l.refused({ type: "approve", actor: kim, id: uv }, "status");
  });
});

describe("withdrawing your own claim", () => {
  it("the author can't refute or approve their own UV, and is pointed at withdrawing it", async () => {
    const l = new Ledger();
    const id = await claim(l, { by: "johnny", role: "human" }, "Donal Trump is the president");
    const r = await l.refused({ type: "refute", actor: { by: "Johnny", role: "human" }, id, evidence: file }, "contempt", /Withdraw it/);
    expect(r.suggest).toEqual({ kind: "withdraw", id });
    const a = await l.refused({ type: "approve", actor: { by: "johnny", role: "human" }, id }, "contempt", /withdraw it/);
    expect(a.suggest).toEqual({ kind: "withdraw", id });
  });

  it("striking your own UV withdraws it, with the reason on the record, and releases a contest", async () => {
    const l = new Ledger();
    const id = await claim(l, { by: "johnny", role: "human" }, "Donal Trump is the president");
    const r = await l.run({ type: "strike", actor: { by: "johnny", role: "human" }, id, opinion: "typo: I meant Donald" });
    expect(r.outcome).toEqual({ kind: "struck", id, released: null, withdrawn: true });
    expect(r.message).toMatch(/^Withdrawn by johnny/);
    expect(r.lines[0]).toMatchObject({ type: "RULING", kind: "strike", author: "johnny", opinion: "typo: I meant Donald", target: id });
    expect(l.entry(id).status).toBe("struck");
    const again = await claim(l, { by: "johnny", role: "human" }, "Donald Trump is the president");
    expect(l.entry(again).status).toBe("open");
  });
});

describe("the read model", () => {
  it("orders the docket: nominated, then stale, then the rest", async () => {
    const l = new Ledger();
    const stale = await claim(l, sam, "old flag");
    l.clock += 30 * 24 * 60 * 60 * 1000;
    const fresh = await claim(l, sam, "new flag");
    const nominated = await claim(l, sam, "nominated flag");
    await l.run({ type: "approve", actor: a1, id: nominated, evidence: commit });
    await l.run({ type: "approve", actor: a2, id: nominated, evidence: file });
    await l.run({ type: "approve", actor: a3, id: nominated, evidence: test });
    const m = readModel(l.state, l.clock);
    expect(m.docket.open).toEqual([nominated, stale, fresh]);
    expect(m.entries.find((e) => e.id === stale)!.marker).toBe("[UV — STALE]");
    expect(m.entries.find((e) => e.id === fresh)!.freshness!.state).toBe("fresh");
    expect(m.counts).toEqual({ lines: 4, tb: 0, uv: 3, current: 3 });
  });
});
