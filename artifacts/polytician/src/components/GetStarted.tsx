import { CodeBlock, Rich, Section, SpecList } from "./ui";

const REQUIREMENTS = [
  { term: "Node", desc: "22 or newer" },
  { term: "stdio", desc: "Your MCP client starts it. No port opens.", literal: true },
  { term: "--http", desc: "Serves 127.0.0.1:8788 instead, with a bearer token written to `~/.polytician/http-token`", literal: true },
  { term: "Model", desc: "About 25 MB, downloaded on first use, then it runs offline" },
];

const CHECKOUT = [
  "git clone https://github.com/johnnyclem/polytician.git",
  "cd polytician && npm install && npm run build",
  "npm start",
];

const CONFIG = [
  "{",
  '  "mcpServers": {',
  '    "polytician": {',
  '      "command": "node",',
  '      "args": [',
  '        "/absolute/path/to/polytician/dist/index.js"',
  "      ]",
  "    }",
  "  }",
  "}",
];

/** Requirements as ruled cells; the checkout steps and the Claude Desktop config side by side from 1024. */
export function GetStarted({ version }: { version: string }) {
  return (
    <Section id="start" title="Get started">
      <div className="flex flex-col gap-8">
        <SpecList items={REQUIREMENTS} />
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="flex flex-col gap-3">
            <CodeBlock title={`From a checkout, v${version}`} lines={CHECKOUT} prompt wrap />
            <p className="text-sm text-secondary-foreground">
              <Rich text="`npm start` runs the stdio server, which waits for a client on stdin." />
            </p>
            <div className="mt-3">
              <CodeBlock title="Or serve over HTTP" lines={["node dist/index.js --http"]} prompt />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <CodeBlock title="claude_desktop_config.json, stdio" lines={CONFIG} />
            <p className="text-sm text-secondary-foreground">
              <Rich text="Set the path to `dist/index.js` in your checkout. Your client starts the process over stdio." />
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
