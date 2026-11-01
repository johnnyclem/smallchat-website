import { useState } from "react";
import demo from "@/data/demo.json";
import { Marker, TitleBlock } from "./ui";

type Shape = "markdown" | "thoughtform" | "vector";

const SHAPES: { id: Shape; label: string }[] = [
  { id: "markdown", label: "markdown" },
  { id: "thoughtform", label: "ThoughtForm" },
  { id: "vector", label: "vector" },
];

const { hero } = demo;
const entities = hero.thoughtform.entities;
const rels = hero.thoughtform.relationships;
const rel = rels[0];
const entityText = new Map(entities.map((e) => [e.id, e.text]));
const linked = new Set([rel.subjectId, rel.objectId]);
const maxAbs = Math.max(...hero.vector.map(Math.abs));
const f4 = (v: number) => v.toFixed(4);

/** Monospace 12px is 7.2 wide; a node is its label plus 12 each side. */
const nodeW = (text: string) => Math.round(text.length * 7.2 + 24);

/** Two nodes and one labelled edge, drawn from the real relationship in demo.json. */
function ThoughtFormFigure() {
  const subj = entityText.get(rel.subjectId) ?? "";
  const obj = entityText.get(rel.objectId) ?? "";
  const wA = nodeW(subj);
  const wB = nodeW(obj);
  const W = 272;
  const xB = W - wB;
  const cx = xB + wB / 2;
  return (
    <svg
      className="fig"
      viewBox={`0 0 ${W} 112`}
      role="img"
      aria-label={`${subj}, ${rel.predicate}, ${obj}. Confidence ${rel.confidence}.`}
    >
      <text x="0" y="16" className="fig-id">{rel.subjectId}</text>
      <rect x="0.5" y="24.5" width={wA - 1} height="31" rx="8" className="fig-node" />
      <text x="12" y="44" className="fig-text">{subj}</text>

      <text x={xB} y="70" className="fig-id">{rel.objectId}</text>
      <rect x={xB + 0.5} y="76.5" width={wB - 1} height="31" rx="8" className="fig-node" />
      <text x={xB + 12} y="96" className="fig-text">{obj}</text>

      <path d={`M${wA} 40H${cx}V76`} className="fig-edge" />
      <path d={`M${cx - 4} 70.5 ${cx} 76l4-5.5`} className="fig-edge" />
      <text x={wA + 12} y="34" className="fig-label">
        {rel.predicate}
        <tspan dx="8" className="fig-conf">{rel.confidence.toFixed(2)}</tspan>
      </text>
    </svg>
  );
}

/** 384 floats as a field of square cells: positive in the accent, negative neutral, opacity by magnitude. */
function VectorField() {
  return (
    <div
      className="vec"
      role="img"
      aria-label={`${hero.vector.length} floats as a grid of cells. Positive values in teal, negative in grey, brighter is larger.`}
    >
      {hero.vector.map((v, i) => (
        <span
          key={i}
          title={`${i}: ${f4(v)}`}
          style={{
            backgroundColor: v >= 0 ? "var(--accent)" : "var(--secondary-foreground)",
            opacity: 0.14 + 0.86 * (Math.abs(v) / maxAbs),
          }}
        />
      ))}
    </div>
  );
}

/**
 * One stored concept, drawn in all three shapes on the same sheet. From 576px
 * wide the three views sit together; below that a segmented control names them.
 */
export function ConceptSheet() {
  const [view, setView] = useState<Shape>("markdown");
  const on = (s: Shape) => (view === s ? "true" : "false");
  const prov = hero.thoughtformProvenance;

  return (
    <div className="panel sheet">
      <div className="panel-header">
        <span className="font-mono">read_concept</span>
        <span className="mono">tags {hero.tags.join(", ")}</span>
      </div>

      <div className="sheet-switch">
        <div role="group" aria-label="Shape shown" className="seg">
          {SHAPES.map((s) => (
            <button key={s.id} type="button" aria-pressed={view === s.id} onClick={() => setView(s.id)} className="tab-item">
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-body sheet-body">
        <div className="sheet-view sheet-md" data-on={on("markdown")}>
          <div className="view-head">
            <span className="view-no">01</span>
            <span className="view-name">markdown</span>
          </div>
          <p className="view-prov">origin user</p>
          <p className="sentence mt-4">{hero.markdown}</p>
        </div>

        <div className="sheet-view" data-on={on("thoughtform")}>
          <div className="view-head">
            <span className="view-no">02</span>
            <span className="view-name">ThoughtForm</span>
          </div>
          <p className="view-prov">
            <Marker kind="derived" />
            <span>
              {prov.origin} from {prov.derivedFrom}, {prov.model}, no LLM, heuristic types
            </span>
          </p>
          <div className="mt-4">
            <ThoughtFormFigure />
          </div>
          <table className="ent mt-4">
            <caption className="sr-only">Entities in the ThoughtForm</caption>
            <thead>
              <tr>
                <th scope="col">id</th>
                <th scope="col">text</th>
                <th scope="col">type</th>
                <th scope="col" className="num">conf</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td className={`ent-text ${linked.has(e.id) ? "ent-linked" : ""}`}>{e.text}</td>
                  <td className="ent-type">{e.type}</td>
                  <td className="num">{e.confidence.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="sheet-extra-note">
            {entities.length} entities, {rels.length} {rels.length === 1 ? "relationship" : "relationships"}
          </p>
        </div>

        <div className="sheet-view sheet-vec" data-on={on("vector")}>
          <div className="view-head">
            <span className="view-no">03</span>
            <span className="view-name">vector</span>
          </div>
          <p className="view-prov">
            <Marker kind="derived" />
            <span>derived from markdown, {demo.model}</span>
          </p>
          <div className="mt-4">
            <VectorField />
          </div>
          <div className="sheet-vec-foot">
            <ul className="legend">
              <li>
                <span className="swatch" style={{ backgroundColor: "var(--accent)" }} />
                positive
              </li>
              <li>
                <span className="swatch" style={{ backgroundColor: "var(--secondary-foreground)" }} />
                negative
              </li>
              <li>brighter is larger</li>
            </ul>
            <p className="mono mt-3 text-xs leading-4 text-muted-foreground">
              float[{demo.dims}] [{hero.vector.slice(0, 5).map(f4).join(", ")}, …]
            </p>
          </div>
        </div>
      </div>

      <TitleBlock
        label="Sheet title block"
        cells={[
          { k: "concept", v: hero.id.slice(0, 8), title: hero.id },
          { k: "namespace", v: "default" },
          { k: "model", v: demo.model },
          { k: "dims", v: String(demo.dims) },
        ]}
      />
    </div>
  );
}
