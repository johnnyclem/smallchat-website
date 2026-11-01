import { useEffect, useState } from "react";
import { buildExcerpt, type Excerpt } from "@/lib/excerpt";

/**
 * A page of transcript on warm paper: the walk's own ledger lines, with the TB
 * in amber ink. It is built in the browser from the same sandbox engine the
 * walk runs, so it is labelled as the walk and never passes for live data.
 */
export function TranscriptExcerpt({ className = "" }: { className?: string }) {
  const [excerpt, setExcerpt] = useState<Excerpt | null>(null);
  useEffect(() => {
    let live = true;
    buildExcerpt()
      .then((x) => live && setExcerpt(x))
      .catch(() => {
        /* the rules stand without it */
      });
    return () => {
      live = false;
    };
  }, []);
  if (!excerpt) return <div className={className} aria-hidden />;
  return (
    <figure className={`paper ${className}`} aria-label={`Transcript excerpt from the guided walk, ${excerpt.rows.length} ledger lines. A sandbox, not live data.`}>
      <figcaption className="paper-head">
        <strong>Transcript</strong>
        <span>From the walk. Sandbox, not live data</span>
      </figcaption>
      <table className="paper-table">
        <thead className="sr-only">
          <tr>
            <th scope="col">Line</th>
            <th scope="col">Type</th>
            <th scope="col">Hash</th>
            <th scope="col">Entry</th>
          </tr>
        </thead>
        <tbody>
          {excerpt.rows.map((r) => (
            <tr key={r.seq} data-tb={r.tb ? "true" : undefined}>
              <td className="p-seq">{r.seq}</td>
              <td className="p-type">{r.type}</td>
              <td className="p-hash">{r.hash}</td>
              <td className="p-text">
                {r.text}
                <span className="p-who">{r.who}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="paper-foot">head {excerpt.head}</p>
    </figure>
  );
}
