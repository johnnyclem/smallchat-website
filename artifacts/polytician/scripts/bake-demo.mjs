// Bakes the demo data for this site from a real polytician 3.x build, so every
// score, vector and graph on the page is actual output.
//
//   git clone https://github.com/johnnyclem/polytician && (cd polytician && npm ci && npm run build)
//   node scripts/bake-demo.mjs /path/to/polytician > src/data/demo.json
//
// The concepts go into a throwaway SQLite store, never ~/.polytician/concepts.db.
// The embedding model is cached in POLYTICIAN_DATA_DIR/models as usual.
// The ThoughtForm comes from convert_concept with POLYTICIAN_NLP_PIPELINE=rule-based
// and otherwise default config, so bake with no ~/.polytician/config.json.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.POLYTICIAN_NLP_PIPELINE = "rule-based";
const root = path.resolve(process.argv[2] ?? "../../../polytician");
const load = (p) => import(pathToFileURL(path.join(root, "dist", p)).href);
const { getConfig } = await load("config.js");
const { initializeDatabase, closeDatabase } = await load("db/client.js");
const { configureProviders } = await load("providers/configure.js");
const { conceptService } = await load("services/concept.service.js");
const { conversionService } = await load("services/conversion.service.js");
const { embeddingService } = await load("services/embedding.service.js");
// Fixed UUIDs: 3.0's tools take only UUID concept ids.
const concepts = [
  { id: "024f070e-625b-47dc-9c0a-8f44d520a946", tags: ["architecture"], markdown: "The ingest service writes events to Postgres and publishes counts to the dashboard." },
  { id: "4f666903-18f9-4a24-b4ed-555457c126ab", tags: ["decision"], markdown: "We chose SQLite with sqlite-vec for local development so no server is needed." },
  { id: "73e640a6-5e08-4541-b62d-6c636bf04fd3", tags: ["people"], markdown: "Maria Lopez owns the billing pipeline and reviews every schema migration." },
  { id: "0ff17920-aea4-4c36-9f22-4de534e4f9b1", tags: ["ops"], markdown: "Deploys go out through Fly.io every weekday afternoon after tests pass." },
  { id: "c721c5de-63de-4bb8-a97c-c3f187de4d47", tags: ["security"], markdown: "API keys are rotated every ninety days and never written to logs." },
  { id: "58d26330-543d-4ae0-8ae0-700e5609039d", tags: ["product"], markdown: "Customers asked for a weekly email digest of their usage." },
  { id: "b0c26af6-2d15-466d-af71-a95154f5e130", tags: ["research"], markdown: "Albert Einstein developed the theory of relativity at the Swiss Patent Office." },
  { id: "b7d3a708-155e-4c19-abb6-f6ac0dda2360", tags: ["ops"], markdown: "The worker retries failed jobs with exponential backoff and a dead-letter queue." },
];
const queries = ["who handles payments?", "how do we deploy", "credential rotation policy", "what database do we use locally", "physics history", "what happens when a job fails"];
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "polytician-bake-"));
initializeDatabase(path.join(scratch, "concepts.db"));
await configureProviders(getConfig());
// save_concept auto-embeds the markdown (3.0 default).
for (const c of concepts) await conceptService.save({ ...c, autoEmbed: true });
// search_concepts { query, k }: embed the query, rank by score = (1 + cosine) / 2.
const search = {};
for (const q of queries) {
  const results = await conceptService.search(await embeddingService.embed(q), concepts.length);
  search[q] = results.map((r) => ({ id: r.id, score: +r.score.toFixed(3) }));
}
const hero = concepts[6];
// convert_concept { id, from: "markdown", to: "thoughtform" }, then read_concept.
await conversionService.convert(hero.id, "markdown", "thoughtform");
const { embedding, thoughtform, provenance } = await conceptService.read(hero.id, ["vector", "thoughtform"]);
await closeDatabase();
fs.rmSync(scratch, { recursive: true, force: true });
const { entities, relationships, contextGraph } = thoughtform;
console.log(JSON.stringify({
  model: embeddingService.getModel(),
  dims: embedding.length,
  hero: {
    ...hero,
    thoughtform: { entities, relationships, contextGraph },
    thoughtformProvenance: provenance.thoughtform,
    vector: embedding.map((x) => +x.toFixed(4)),
  },
  concepts,
  search,
}));
