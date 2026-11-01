import { CommandBlock, Section } from "@workspace/site-kit";

const SAMPLE = `import { CompactionEngine, renderContextFrame } from "@shorthand/core";

const engine = new CompactionEngine({ memtableSize: 10 });
await engine.addMessages(history);

const frame = engine.buildContextFrame(2000);
// render order: truth → corrections → invariants
//   → memories → code → graph → summaries → history → recent
// frame.tokenUsage <= 2000 (a ~4 chars/token estimate)
const prompt = renderContextFrame(frame); // untrusted text escaped`;

/** Comments in the muted role, everything else plain. */
function CodeSample() {
  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <span className="font-mono">agent.ts</span>
      </div>
      <pre className="panel-body overflow-x-auto text-code text-foreground">
        {SAMPLE.split("\n").map((line, i) => {
          const at = line.indexOf("//");
          return (
            <div key={i} className="min-h-6 whitespace-pre">
              {at < 0 ? line : line.slice(0, at)}
              {at >= 0 && <span className="text-muted-foreground">{line.slice(at)}</span>}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

export function GetStartedSection({ install, clone, version }: { install: string; clone: string; version: string }) {
  return (
    <Section id="start">
      <div className="flex flex-col gap-3">
        <h2 className="text-title">Get started</h2>
        <p className="text-lead text-secondary-foreground">
          A library, not a service. The package is @shorthand/core (0.1 was called{" "}
          <span className="whitespace-nowrap">short-hand</span> and was never published). Zero runtime dependencies,
          ESM-only, fully typed, Node 22 or later.
        </p>
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,30.5rem)_minmax(0,1fr)] xl:items-start">
        <div className="flex flex-col gap-6">
          <CommandBlock title={`install · v${version}`} commands={[install]} wrap />
          <CommandBlock
            title="or from source"
            commands={[clone, "cd short-hand && npm install && npm run build", "cd ../your-app && npm install ../short-hand"]}
            wrap
          />
        </div>
        <CodeSample />
      </div>
    </Section>
  );
}
