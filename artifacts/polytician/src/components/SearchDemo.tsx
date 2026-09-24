import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState } from "react";
import demo from "@/data/demo.json";

const QUERIES = Object.keys(demo.search);
const byId = new Map(demo.concepts.map((c) => [c.id, c]));
const top = Math.max(...Object.values(demo.search).flatMap((r) => r.map((x) => x.score)));

/** search_concepts over eight saved concepts, with real cosine scores. */
export function SearchDemo() {
  const [query, setQuery] = useState(QUERIES[0]);
  const results = demo.search[query as keyof typeof demo.search];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-center gap-2">
        {QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => setQuery(q)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all cursor-pointer ${
              q === query ? "border-primary/50 bg-primary/10 text-white" : "border-white/10 text-muted-foreground hover:text-white/80"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            {q}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-2xl p-3 sm:p-4">
        {results.map((r, rank) => {
          const c = byId.get(r.id)!;
          const best = rank === 0;
          return (
            <motion.div
              key={r.id}
              layout
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className={`relative flex items-center gap-3 sm:gap-4 rounded-xl px-3 py-2.5 ${best ? "bg-primary/10" : ""}`}
            >
              <span className={`font-mono text-xs w-5 shrink-0 ${best ? "text-primary" : "text-muted-foreground"}`}>{rank + 1}</span>
              <p className={`flex-1 text-sm leading-snug ${best ? "text-white" : rank < 3 ? "text-white/75" : "text-white/40"}`}>{c.markdown}</p>
              <div className="hidden sm:block w-28 h-1.5 rounded-full bg-white/5 overflow-hidden shrink-0">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: `${Math.max(0, r.score / top) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="font-mono text-xs text-muted-foreground w-10 text-right shrink-0">{r.score.toFixed(2)}</span>
            </motion.div>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground font-mono">
        cosine similarity · {demo.model} · computed by polytician, not by this page
      </p>
    </div>
  );
}
