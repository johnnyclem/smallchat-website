import { ARCHIVED, MESSAGES } from "./session";

type Variant = "hero" | "full";

/**
 * The session as a numbered transcript. A line is struck when a correction
 * archived it, lit when the current frame cites it (cited wins). `hero` keeps
 * one line per message and, on a phone, only the lines that carry a mark.
 */
export function Tape({ cited, variant }: { cited: ReadonlySet<string>; variant: Variant }) {
  const stateOf = (id: string) => (cited.has(id) ? "cited" : ARCHIVED.has(id) ? "struck" : "plain");
  const hidden = MESSAGES.filter((m) => variant === "hero" && stateOf(m.id) === "plain").length;

  return (
    <ol className={`tape tape--${variant}`}>
      {MESSAGES.map((m) => {
        const state = stateOf(m.id);
        const dim = variant === "hero" && state === "plain";
        return (
          <li key={m.id} data-state={state} className={`tape-row ${dim ? "max-md:hidden" : ""}`}>
            <span className="tape-id">{m.id}</span>
            {variant === "full" && <span className="tape-role">{m.role}</span>}
            <span className="tape-text">
              {variant === "hero" && <span className="sr-only">{m.role}: </span>}
              <span className="tape-mark">{m.content}</span>
              {state === "cited" && <span className="sr-only"> (cited by the frame)</span>}
              {state === "struck" && <span className="sr-only"> (archived, superseded)</span>}
            </span>
            <span className="tape-tok">{m.tokens}</span>
          </li>
        );
      })}
      {hidden > 0 && <li className="tape-more md:hidden">{hidden} more messages</li>}
    </ol>
  );
}

/** What the marks on the tape mean. */
export function TapeKey() {
  return (
    <p className="tape-key">
      <span>
        <s>m1</s> archived
      </span>
      <span>
        <mark>m3</mark> cited by the frame
      </span>
    </p>
  );
}
