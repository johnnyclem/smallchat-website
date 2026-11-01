import { levelInfo } from "./levels";
import { messageSources, omittedOf, type FrameData, type SectionData } from "./session";

const MARKER = /^(\[[^\]]+\])(.*)$/;
const ROLE = /^(user|assistant): (.*)$/;

/** Picks out the engine's literal `[marker]` or `role:` prefix; the rest stays plain. */
function Line({ text, hue }: { text: string; hue: string }) {
  const marker = MARKER.exec(text);
  if (marker) {
    return (
      <>
        <span style={{ color: hue }}>{marker[1]}</span>
        {marker[2]}
      </>
    );
  }
  const role = ROLE.exec(text);
  if (role) {
    return (
      <>
        <span className="frame-role">{role[1]}:</span> {role[2]}
      </>
    );
  }
  return <>{text}</>;
}

function FrameSection({ section }: { section: SectionData }) {
  const info = levelInfo(section.level);
  return (
    <section aria-label={`${section.kind}, level ${section.level}`} className="frame-section fade-in">
      <div className="frame-head">
        <span className="level-tag" style={{ color: info.hue }}>
          L{section.level}
        </span>
        <span className="frame-kind">{section.kind}</span>
        <span className="frame-tok">{section.tokenEstimate} tok</span>
      </div>
      <ul className="frame-items">
        {section.items.map((item, i) => {
          const ids = messageSources(item.sources);
          return (
            <li key={i} className="frame-item">
              <span>
                <Line text={item.text} hue={info.hue} />
              </span>
              <span className="frame-cite" title={ids.length ? `from ${ids.join(", ")}` : undefined}>
                {ids.join(" ")}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The typed context frame, one hairline-divided listing. Every line ends with the message it came from. */
export function Frame({ frame }: { frame: FrameData }) {
  return (
    <div>
      {frame.sections.map((s) => (
        <FrameSection key={s.kind} section={s} />
      ))}
    </div>
  );
}

/** What the budget left out, by kind. */
export function LeftOut({ frame }: { frame: FrameData }) {
  const omitted = omittedOf(frame);
  return (
    <p className="text-meta">
      {omitted.length > 0
        ? `Left out at this budget: ${omitted.map(([kind, n]) => `${kind} ${n}`).join(" · ")}`
        : "Nothing left out at this budget"}
    </p>
  );
}
