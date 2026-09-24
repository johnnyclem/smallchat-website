// Bakes the budget-slider demo from a real short-hand build, so every frame
// on the page is actual CompactionEngine output (Tier 0 regex compactor).
//
//   git clone https://github.com/johnnyclem/short-hand && (cd short-hand && npm i && npm run build)
//   node scripts/bake-demo.mjs /path/to/short-hand > src/data/demo.json
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(process.argv[2] ?? "../../../short-hand");
const { CompactionEngine, estimateTokens } = await import(pathToFileURL(path.join(root, "dist", "index.js")).href);
const script = [
  ["user", "Let's build the ingest service. We decided to use MySQL for the main database."],
  ["assistant", "Sounds good. I'll set up the MySQL schema for events and sources."],
  ["user", "Thanks! Also the worker should batch writes."],
  ["assistant", "Okay, I'll batch writes in groups of 500 in the ingest worker."],
  ["user", "cool"],
  ["assistant", "The ingest worker now reads from the Kafka topic raw-events."],
  ["user", "We decided the log budget is 30 lines per request."],
  ["assistant", "Got it, LOG_BUDGET = 30."],
  ["user", "great"],
  ["assistant", "Added retries with exponential backoff to the ingest worker."],
  ["user", "Switch MySQL to Postgres. Local dev matches prod that way."],
  ["assistant", "Switching the schema to Postgres. MySQL is out."],
  ["user", "Must never drop events on retry. That's a hard constraint."],
  ["assistant", "Understood: the worker must never drop events; failures go to a dead-letter queue."],
  ["user", "nice"],
  ["assistant", "The dashboard service depends on the ingest service for event counts."],
  ["user", "Change the log budget to 100."],
  ["assistant", "Updated LOG_BUDGET to 100."],
  ["user", "thanks"],
  ["assistant", "Wrote integration tests for Postgres writes and the dead-letter queue."],
  ["user", "We decided to deploy with Fly.io for now."],
  ["assistant", "Added a fly.toml and a deploy workflow."],
  ["user", "ok"],
  ["assistant", "Everything's green. Ready for review."],
];
const messages = script.map(([role, content], i) => ({ id: `m${i + 1}`, role, content, timestamp: 1_790_000_000_000 + i * 60_000 }));
const engine = new CompactionEngine({ memtableSize: 6, contextBudget: 4096 });
await engine.addMessages(messages);
await engine.flush();
for (const lvl of [2, 3, 4]) { try { await engine.recompact(lvl); } catch (e) { console.error("recompact", lvl, e.message); } }
const rawTokens = messages.reduce((n, m) => n + estimateTokens(m.content), 0);
const budgets = Array.from({ length: 12 }, (_, i) => 40 + i * 20);
const frames = budgets.map((b) => engine.buildContextFrame(b));
const state = engine.getState();
console.log(JSON.stringify({ rawTokens, messages: messages.map(({ role, content }) => ({ role, content })), tombstones: state.tombstones.length, frames }));
