type Run = { cmd: string; out: string };

// Real CLI runs from the docs: compile, inspect, resolve.
const RUNS: Run[] = [
  {
    cmd: "npx -y @smallchat/core@^1 compile --source ~/.mcp.json",
    out: "Embedding 3 tools...\nOutput: tools.toolkit.json\n  - format 1.0, content hash 9c41e07a2b6d13f0…",
  },
  {
    cmd: "npx -y @smallchat/core@^1 inspect tools.toolkit.json --selectors",
    out: "Selectors:\n  github.search_code → github/search_code\n  github.create_issue → github/create_issue",
  },
  {
    cmd: 'npx -y @smallchat/core@^1 resolve tools.toolkit.json "search for code"',
    out: "Outcome: resolved (tier HIGH, decision ranked)\nChosen: github/search_code  (serve name: github__search_code)\nProof digest: 5e0c9a…",
  },
];

const LINE = "whitespace-pre-wrap break-words";

/**
 * One output line. Labels are muted. The chosen tool is the one lit thing in the window: its row
 * steps up a surface, carries a 3px accent rail on the window edge, and its id is the accent.
 */
function OutLine({ line }: { line: string }) {
  const chosen = line.match(/^Chosen: (.*)$/);
  if (chosen) {
    const [id, ...rest] = chosen[1].split(/\s{2,}/);
    return (
      <div className={`lit -mx-5 my-1 bg-raised py-1 pl-9 pr-5 [--lit-inset:0px] [--lit-w:3px] ${LINE}`}>
        <span className="text-muted-foreground">Chosen: </span>
        <span className="font-medium text-accent">{id}</span>
        {rest.length > 0 && <span className="text-muted-foreground">{"  " + rest.join("  ")}</span>}
      </div>
    );
  }
  const labelled = line.match(/^(Outcome|Proof digest|Output): (.*)$/);
  if (labelled) {
    return (
      <div className={`pl-4 ${LINE}`}>
        <span className="text-muted-foreground">{labelled[1]}: </span>
        <span className={labelled[1] === "Outcome" ? "text-foreground" : "text-subtle"}>{labelled[2]}</span>
      </div>
    );
  }
  return <div className={`pl-4 text-subtle ${LINE}`}>{line}</div>;
}

function Prompt({ children, cursor = false }: { children?: React.ReactNode; cursor?: boolean }) {
  return (
    <div className="flex gap-2">
      <span aria-hidden className="select-none text-muted-foreground">
        ❯
      </span>
      <span className={`min-w-0 text-foreground ${LINE}`}>
        {children}
        {cursor && <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-subtle" aria-hidden />}
      </span>
    </div>
  );
}

/**
 * The hero's product view: a real resolve trace, complete from the first paint, so the chosen
 * tool is lit before anything moves and in any capture. The cursor is a still block.
 */
export function TerminalAnimation() {
  return (
    <figure className="overflow-hidden rounded-2xl border bg-deep">
      <figcaption className="flex h-10 items-center justify-between border-b bg-card px-4 font-mono text-xs text-muted-foreground">
        <span>bash</span>
        <span>@smallchat/core@^1</span>
      </figcaption>
      <div className="space-y-4 p-5 font-mono text-[13px] leading-6">
        {RUNS.map((r) => (
          <div key={r.cmd}>
            <Prompt>{r.cmd}</Prompt>
            <div className="mt-1">
              {r.out.split("\n").map((l, i) => (
                <OutLine key={i} line={l} />
              ))}
            </div>
          </div>
        ))}
        <Prompt cursor />
      </div>
    </figure>
  );
}
