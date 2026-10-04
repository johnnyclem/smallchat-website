---
title: Getting Started
sidebar_label: Getting Started
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Getting Started

Get from zero to a running dispatch in under five minutes.

## 1. Install

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```bash
npm install @smallchat/core@^1
```

Node.js 22 or later is required.

</TabItem>
<TabItem value="swift" label="Swift">

Add to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/johnnyclem/smallchat-swift", from: "1.0.0"),
]
```

Then add the dependency to your target:

```swift
.target(
    name: "YourApp",
    dependencies: [
        .product(name: "SmallChat", package: "smallchat-swift"),
    ]
),
```

Requires Swift 6.1+. Builds on macOS 14+ (Sonoma), iOS 17+ (libraries) and Linux.

</TabItem>
</Tabs>

## 2. Create a tool manifest

A manifest is a JSON file that describes a provider and its tools. Create a `tools/` directory and add a manifest file:

```json title="tools/github-manifest.json"
{
  "id": "github",
  "name": "GitHub",
  "transportType": "mcp",
  "tools": [
    {
      "name": "search_code",
      "description": "Search for code across GitHub repositories",
      "providerId": "github",
      "transportType": "mcp",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "Search query" },
          "language": { "type": "string", "description": "Language filter" },
          "repo": { "type": "string", "description": "Repository to search in" }
        },
        "required": ["query"]
      }
    },
    {
      "name": "create_issue",
      "description": "Create a new issue in a GitHub repository",
      "providerId": "github",
      "transportType": "mcp",
      "inputSchema": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "body": { "type": "string" },
          "repo": { "type": "string" }
        },
        "required": ["title", "repo"]
      }
    }
  ]
}
```

The manifest format is documented in full at [Manifest Format](./manifests/format.md).

## 3. Compile

The `compile` command reads your manifests, generates semantic embeddings for each tool description, groups tools into dispatch classes, and emits a compiled artifact:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```bash
npx -y @smallchat/core@^1 compile --source ./tools --output tools.json
```

</TabItem>
<TabItem value="swift" label="Swift">

```bash
swift run smallchat compile --source ./tools
```

</TabItem>
</Tabs>

The TypeScript CLI's output ends like this:

```
Embedding 2 tools...
  Embedder: onnx all-MiniLM-L6-v2 (…)
  Tools: 2 (2 selectors, none shared)

Linking...
  Dispatch tables: 1

Output: /path/to/tools.json
  - format 1.0, content hash …
  - 2 selectors
  - 2 tools
  - 1 providers
Header file: /path/to/tools.header.txt (… tokens approx)
```

The compiled artifact (`tools.json`, format 1.0) holds each tool's schema, its selector vectors and the fingerprint of the embedder that produced them, under a SHA-256 content hash. Loaders refuse an artifact whose hash does not match, or a different embedder. Commit it alongside your code — it does not need to be rebuilt unless your tool definitions change.

## 4. Test dispatch resolution

Before integrating into your application, verify that intents resolve to the tools you expect:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```bash
npx -y @smallchat/core@^1 resolve tools.json "search for code"
```

</TabItem>
<TabItem value="swift" label="Swift">

```bash
swift run smallchat resolve tools.toolkit.json "search for code"
```

</TabItem>
</Tabs>

Both CLIs print the outcome, the chosen tool id when there is one (`github/search_code`), the candidate table and the proof digest. Nothing runs. See [`resolve`](./cli/resolve.md) for the full output.

Try variations, and check that each one chooses the tool you expect:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```bash
npx -y @smallchat/core@^1 resolve tools.json "find code in a repo"

npx -y @smallchat/core@^1 resolve tools.json "open a bug report"
```

</TabItem>
<TabItem value="swift" label="Swift">

```bash
swift run smallchat resolve tools.toolkit.json "find code in a repo"

swift run smallchat resolve tools.toolkit.json "open a bug report"
```

</TabItem>
</Tabs>

## 5. Start the MCP server

smallchat serves a compiled toolkit as one MCP server (built on the official MCP SDK). Every tool is listed as `<provider>__<tool>`, and each call is forwarded by exact name to the upstream server that owns it. Point any MCP client at it:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```bash
# stdio, what MCP hosts launch
npx -y @smallchat/core@^1 serve --source tools.json

# or Streamable HTTP at http://127.0.0.1:3001/mcp (bearer token in ~/.smallchat/serve-token)
npx -y @smallchat/core@^1 serve --source tools.json --http
```

</TabItem>
<TabItem value="swift" label="Swift">

```bash
swift run smallchat serve --source ./tools --port 3001
```

</TabItem>
</Tabs>

With `--http` the output ends with:

```
smallchat MCP server (Streamable HTTP) at http://127.0.0.1:3001/mcp
  generated bearer token in /home/you/.smallchat/serve-token; send "Authorization: Bearer <token>"
```

## 6. Use the API

For programmatic use in your application:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { loadRuntime } from '@smallchat/core';

// Load a compiled artifact. It records the embedder its vectors came from;
// loadRuntime builds that embedder (or refuses a different one).
const { runtime, upstreams } = await loadRuntime('./tools.toolkit.json');

// Propose one tool for an intent; nothing runs.
const resolution = await runtime.resolve('search for code');
console.log(resolution.outcome, resolution.chosen, resolution.tier);

// Run exactly that tool. Arguments are validated against its inputSchema.
if (resolution.outcome === 'resolved') {
  const result = await runtime.dispatchById(resolution.chosen!, {
    query: 'typescript generics',
    language: 'typescript',
  });
  console.log(result.content);
}

// Or resolve and run in one call. A match the dispatch policy does not
// allow (below HIGH without an LLM verifier, a destructive tool below
// EXACT, ...) runs nothing and returns isError with metadata.outcome.
const result = await runtime.dispatch('search for code', { query: 'typescript generics' });
if (result.isError) console.log(result.metadata?.outcome, result.content);

// Streaming dispatch
for await (const event of runtime.dispatchStream('file that new issue', {
  title: 'Add dark mode',
  repo: 'myorg/myapp',
})) {
  switch (event.type) {
    case 'resolving':
      console.log(`Resolving: ${event.intent}`);
      break;
    case 'tool-start':
      console.log(`Calling: ${event.toolId}`);
      break;
    case 'chunk':
      console.log(event.content);
      break;
    case 'done':
      console.log(event.result.isError ? `Nothing ran: ${event.result.metadata?.outcome}` : 'Complete.');
      break;
  }
}

await upstreams.close(); // stops stdio upstream MCP servers
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

// Load a toolkit (a compiled artifact or a manifest directory)
let toolkit = try await MCPToolkit.load(source: "./tools.toolkit.json")
let runtime = toolkit.runtime

// Single-shot dispatch
let result = try await runtime.dispatch("search for code", args: [
    "query": "typescript generics",
    "language": "typescript",
])
print(result.content)

// Streaming dispatch — tokens arrive as they are generated
for try await event in runtime.dispatchStream("file that new issue", args: [
    "title": "Add dark mode",
    "repo": "myorg/myapp",
]) {
    switch event {
    case .resolving(let intent):
        print("Resolving: \(intent)")
    case .toolStart(let toolName, _, _, _):
        print("Calling: \(toolName)")
    case .chunk(let content, _):
        print(content, terminator: "")
    case .done:
        print("\nComplete.")
    default:
        break
    }
}
```

</TabItem>
</Tabs>

## Next steps

- [What it does](./what-it-does.md) — understand the full dispatch pipeline
- [CLI Reference](./cli/index.md) — all command options
- [Manifest Format](./manifests/format.md) — provider manifest schema
- [API Reference](./api/runtime.md) — full API docs
