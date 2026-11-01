import React from 'react';

/*
 * The real output of `resolve`, copied from docs/cli/resolve.md (spacing included).
 * One candidate is chosen, and it carries the lit rail. Nothing here is invented:
 * the intent, the two candidates, their scores and tiers all come from that page.
 */
export default function ResolveCard(): React.JSX.Element {
  return (
    <figure className="resolve-card">
      <div className="resolve-card__window">
        <div className="resolve-card__bar">resolve</div>
        <pre className="resolve-card__body">
          <code>
            <span className="ln cmd">
              <span className="prompt">$ </span>npx -y @smallchat/core@^1 resolve tools.toolkit.json "search for code"
            </span>
            <span className="ln" />
            <span className="ln">
              <span className="key">Intent: </span>
              <span className="val">"search for code"</span>
            </span>
            <span className="ln">
              <span className="key">Outcome: </span>
              <span className="ok">resolved</span> (tier HIGH, decision ranked)
            </span>
            <span className="ln">
              <span className="key">Chosen: </span>
              <span className="val">github/search_code</span>
              {'  '}(serve name: github__search_code)
            </span>
            <span className="ln" />
            <span className="ln key">Candidates:</span>
            <span className="ln ln--cand ln--chosen">{'  '}github/search_code{'  '}score 0.912{'  '}HIGH{'  '}via vector</span>
            <span className="ln ln--cand">{'  '}gitlab/search_code{'  '}score 0.801{'  '}MEDIUM{'  '}via vector</span>
            <span className="ln" />
            <span className="ln">
              <span className="key">Proof digest: </span>4c1f…
            </span>
          </code>
        </pre>
      </div>
      <figcaption className="resolve-card__caption">
        resolve proposes one tool for an intent and runs nothing unless you pass <code>--execute</code>
      </figcaption>
    </figure>
  );
}
