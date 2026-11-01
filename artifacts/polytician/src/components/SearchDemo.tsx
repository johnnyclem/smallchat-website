import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useState } from "react";
import { EASE } from "@workspace/site-kit";
import demo from "@/data/demo.json";
import { TitleBlock } from "./ui";

const QUERIES = Object.keys(demo.search);
const byId = new Map(demo.concepts.map((c) => [c.id, c]));
const top = Math.max(...Object.values(demo.search).flatMap((r) => r.map((x) => x.score)));
/** score 0.5 is cosine 0 (orthogonal): bars start there, so unrelated concepts show none. */
const ORTHOGONAL = 0.5;

/** search_concepts over eight saved concepts, with the scores polytician 3.x returns. */
export function SearchDemo() {
  const [query, setQuery] = useState(QUERIES[0]);
  const results = demo.search[query as keyof typeof demo.search];

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Question" className="flex flex-wrap gap-2">
        {QUERIES.map((q) => (
          <button key={q} type="button" aria-pressed={q === query} onClick={() => setQuery(q)} className="tab-item chip">
            {q}
          </button>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="panel-header">
          <span className="font-mono">search_concepts</span>
          <span className="mono">{results.length} concepts ranked by score</span>
        </div>
        <ol aria-label={`Results for ${query}`} className="flex flex-col gap-0.5 p-2">
          {results.map((r, rank) => {
            const c = byId.get(r.id)!;
            const step = rank === 0 ? "top" : rank < 3 ? "mid" : "low";
            const v = Math.max(0, (r.score - ORTHOGONAL) / (top - ORTHOGONAL));
            return (
              <motion.li
                key={r.id}
                layout="position"
                transition={{ duration: 0.3, ease: EASE }}
                data-step={step}
                className={`hit grid min-h-10 grid-cols-[24px_minmax(0,1fr)_48px] items-center gap-x-4 rounded-control px-3 py-2 sm:grid-cols-[24px_minmax(0,1fr)_160px_48px] ${
                  rank === 0 ? "selected" : ""
                }`}
              >
                <span className={`mono col-start-1 row-start-1 text-xs ${rank === 0 ? "text-accent" : "text-muted-foreground"}`}>{rank + 1}</span>
                <span className={`col-start-2 row-start-1 text-sm leading-5 ${rank === 0 ? "text-foreground" : "text-secondary-foreground"}`}>
                  {c.markdown}
                </span>
                <div className="bar-track col-span-2 col-start-2 row-start-2 mt-2 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:mt-0">
                  <div className="bar-fill" style={{ "--v": v } as CSSProperties} />
                </div>
                <span
                  className={`mono col-start-3 row-start-1 text-right text-xs sm:col-start-4 ${rank === 0 ? "text-foreground" : "text-secondary-foreground"}`}
                >
                  {r.score.toFixed(3)}
                </span>
              </motion.li>
            );
          })}
        </ol>
        <TitleBlock
          label="Search title block"
          cells={[
            { k: "score", v: "(1 + cosine) / 2" },
            { k: "bars", v: `${ORTHOGONAL} empty, ${top.toFixed(3)} full, highest of ${QUERIES.length}` },
            { k: "model", v: demo.model },
            { k: "computed by", v: "polytician, not this page" },
          ]}
        />
      </div>
    </div>
  );
}
