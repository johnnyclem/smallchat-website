// Bakes the demo data for this site from a real polytician build, so every
// score and vector on the page is actual output.
//
//   git clone https://github.com/johnnyclem/polytician && (cd polytician && npm i && npm run build)
//   node scripts/bake-demo.mjs /path/to/polytician > src/data/demo.json
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(process.argv[2] ?? "../../../polytician");
const load = (p) => import(pathToFileURL(path.join(root, "dist", p)).href);
const { embeddingService } = await load("services/embedding.service.js");
const { RuleBasedNLPPipeline } = await load("providers/rule-based-nlp.pipeline.js");
const concepts = [
  { id: "c1", tags: ["architecture"], markdown: "The ingest service writes events to Postgres and publishes counts to the dashboard." },
  { id: "c2", tags: ["decision"], markdown: "We chose SQLite with sqlite-vec for local development so no server is needed." },
  { id: "c3", tags: ["people"], markdown: "Maria Lopez owns the billing pipeline and reviews every schema migration." },
  { id: "c4", tags: ["ops"], markdown: "Deploys go out through Fly.io every weekday afternoon after tests pass." },
  { id: "c5", tags: ["security"], markdown: "API keys are rotated every ninety days and never written to logs." },
  { id: "c6", tags: ["product"], markdown: "Customers asked for a weekly email digest of their usage." },
  { id: "c7", tags: ["research"], markdown: "Albert Einstein developed the theory of relativity at the Swiss Patent Office." },
  { id: "c8", tags: ["ops"], markdown: "The worker retries failed jobs with exponential backoff and a dead-letter queue." },
];
const queries = ["who handles payments?", "how do we deploy", "credential rotation policy", "what database do we use locally", "physics history", "what happens when a job fails"];
const cos = (a, b) => { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; } return d / Math.sqrt(na * nb); };
const vecs = {};
for (const c of concepts) vecs[c.id] = Array.from(await embeddingService.embed(c.markdown));
const search = {};
for (const q of queries) {
  const qv = Array.from(await embeddingService.embed(q));
  search[q] = concepts.map((c) => ({ id: c.id, score: +cos(qv, vecs[c.id]).toFixed(3) })).sort((a, b) => b.score - a.score);
}
const nlp = new RuleBasedNLPPipeline();
const hero = concepts[6];
const thoughtform = await nlp.extractEntities(hero.markdown, { minConfidence: 0.7 });
console.log(JSON.stringify({
  model: "Xenova/all-MiniLM-L6-v2",
  dims: vecs[hero.id].length,
  hero: { ...hero, thoughtform, vector: vecs[hero.id].map((x) => +x.toFixed(4)) },
  concepts,
  search,
}));
