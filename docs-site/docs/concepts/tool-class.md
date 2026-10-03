---
title: ToolClass & ToolProxy
sidebar_label: ToolClass & ToolProxy
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# ToolClass & ToolProxy

`ToolClass` is the provider abstraction — analogous to a class in Objective-C. It groups related tools under a single dispatch table, can name a superclass whose selectors it inherits, and declares protocol conformance. `loadRuntime()` builds one class per provider from a compiled artifact; you build them yourself only to register tools in code.

## Provider grouping

Each compiled provider manifest becomes one `ToolClass`. The class holds:

- A **dispatch table** mapping `ToolSelector → ToolIMP`
- An optional **superclass** reference for hierarchical dispatch
- A list of **protocols** the provider conforms to
- A list of **categories** that extend the provider's capabilities

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { ToolClass, ToolProxy, registerLocalHandler } from '@smallchat/core';

// A tool's implementation is a ToolIMP; ToolProxy is the one smallchat uses.
// A 'local' proxy runs the handler registered under its tool name.
registerLocalHandler('search_code', async (args) => ({ content: `results for ${String(args.query)}` }));
const searchCode = new ToolProxy('github', 'search_code', 'local', async () => ({
  name: 'search_code',
  description: 'Search for code across GitHub repositories',
  inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  arguments: [],
}));

const githubClass = new ToolClass('github');
githubClass.superclass = baseApiClass;          // optional
githubClass.addMethod(searchSelector, searchCode); // searchSelector: a ToolSelector in runtime.selectorTable
runtime.registerClass(githubClass);
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

// A tool's implementation is a ToolIMP; ToolProxy is the one smallchat uses.
// A proxy built in code runs its executor.
let searchCode = ToolProxy(
    providerId: "github",
    toolName: "search_code",
    transportType: .local,
    schemaLoader: {
        ToolSchema(
            name: "search_code",
            description: "Search for code across GitHub repositories",
            inputSchema: JSONSchemaType(
                type: "object",
                properties: ["query": JSONSchemaType(type: "string")],
                required: ["query"]
            )
        )
    },
    executor: { args in ToolResult(content: "results for \(String(describing: args["query"] ?? ""))") }
)

let githubClass = ToolClass(name: "github")
githubClass.superclass = baseApiClass                  // optional
githubClass.addMethod(searchSelector, imp: searchCode) // searchSelector: a ToolSelector in runtime.selectorTable
try await runtime.registerClass(githubClass)
```

</TabItem>
</Tabs>

## Dispatch tables

The dispatch table is a plain `Map<ToolSelector, ToolIMP>`. Lookup is O(1) after the selector is resolved. The table is populated at compile time and loaded from the compiled artifact at runtime.

You can extend a class's dispatch table at runtime:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { loadRuntime } from '@smallchat/core';

// Add a new method to an existing class
const { runtime } = await loadRuntime('./tools.toolkit.json');

const cls = runtime.context.getClasses().find(c => c.name === 'github')!;
cls.addMethod(runtime.selectorTable.register(newVector, 'github.audit_log'), newImpl);
// Re-registering a class under its name re-indexes it (and flushes the cache)
runtime.registerClass(cls);
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

// Add a new method to an existing class
let runtime = try await MCPToolkit.load(source: "./tools.toolkit.json").runtime

let cls = await runtime.context.getClasses().first { $0.name == "github" }!
let auditLog = try await runtime.selectorTable.register(embedding: newVector, canonical: "github.audit_log")
cls.addMethod(auditLog, imp: newImpl)
// Re-registering a class under its name re-indexes it (and flushes the cache)
try await runtime.registerClass(cls)
```

</TabItem>
</Tabs>

## Superclass chains

A class answers for its superclass's selectors too: `resolveSelector` walks up the chain, as `objc_msgSend` does. Dispatch ranks an inherited selector like any other candidate; there is no fallback step that runs some other tool when nothing matches. This enables provider hierarchies:

```
BaseAPIClass (generic HTTP tools)
  └── GitHubClass (GitHub-specific tools)
        └── GitHubEnterpriseClass (enterprise overrides)
```

When `GitHubEnterpriseClass` has no implementation of a selector, the one in `GitHubClass`, then `BaseAPIClass`, answers for it.

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { ToolClass } from '@smallchat/core';

const baseClass = new ToolClass('base-api');
const githubClass = new ToolClass('github');
githubClass.superclass = baseClass;
const enterpriseClass = new ToolClass('github-enterprise');
enterpriseClass.superclass = githubClass;
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
let baseClass = ToolClass(name: "base-api")
let githubClass = ToolClass(name: "github")
githubClass.superclass = baseClass
let enterpriseClass = ToolClass(name: "github-enterprise")
enterpriseClass.superclass = githubClass
```

</TabItem>
</Tabs>

## `ToolProxy` — lazy schema loading

`ToolProxy` is the lazy implementation of one tool — analogous to `NSProxy`. It is a `ToolIMP` whose full schema is loaded on first use (`schemaLoader`) and whose calls go through a transport (`mcp`, `rest`, `local` or `grpc`). `loadRuntime()` creates one per tool in the artifact, with the schema the artifact recorded. Built by hand, a proxy can fetch its schema only when the tool is first used:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { ToolProxy } from '@smallchat/core';

// The schema is not loaded yet
const listIssues = new ToolProxy('github', 'list_issues', 'mcp', async () => {
  const res = await fetch('https://example.com/schemas/github/list_issues.json');
  return res.json(); // { name, description, inputSchema, arguments }
});
githubClass.addMethod(listIssuesSelector, listIssues);

// The first call loads it, to validate the arguments before anything runs
const result = await runtime.dispatchById('github/list_issues', { repo: 'octo/demo' });
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

// The schema is not loaded yet
let listIssues = ToolProxy(
    providerId: "github",
    toolName: "list_issues",
    transportType: .mcp,
    schemaLoader: {
        let url = URL(string: "https://example.com/schemas/github/list_issues.json")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(ToolSchema.self, from: data) // { name, description, inputSchema, arguments }
    },
    executor: { args in try await callGitHub("list_issues", args) } // your transport call
)
githubClass.addMethod(listIssuesSelector, imp: listIssues)

// The first call loads it, to validate the arguments before anything runs
let result = try await runtime.dispatchById("github/list_issues", args: ["repo": "octo/demo"])
```

</TabItem>
</Tabs>

## Protocol conformance

Protocols declare capability interfaces — analogous to Objective-C protocols. A `ToolClass` can declare conformance to a protocol, allowing runtime checks:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import type { ToolProtocol } from '@smallchat/core';

const searchable: ToolProtocol = {
  name: 'searchable',
  embedding: await embedder.embed('search and find things'), // what the capability means
  requiredSelectors: [searchSelector],
  optionalSelectors: [],
};

githubClass.addProtocol(searchable);
runtime.registerProtocol(searchable);
runtime.registerClass(githubClass);

// Check at runtime
const cls = runtime.context.getClasses().find(c => c.name === 'github')!;
console.log(cls.conformsTo(searchable)); // true
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

let searchable = ToolProtocolDef(
    name: "searchable",
    embedding: try await embedder.embed("search and find things"), // what the capability means
    requiredSelectors: [searchSelector],
    optionalSelectors: []
)

githubClass.addProtocol(searchable)
await runtime.registerProtocol(searchable)
try await runtime.registerClass(githubClass)

// Check at runtime
let cls = await runtime.context.getClasses().first { $0.name == "github" }!
print(cls.conformsTo(searchable)) // true
```

</TabItem>
</Tabs>

## Categories

Categories add methods without subclassing — analogous to Objective-C categories. `runtime.loadCategory()` adds them to every registered class that conforms to the category's protocol, refuses one that would shadow a protected core selector, and flushes the resolution cache:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import type { ToolCategory } from '@smallchat/core';

const loggingCategory: ToolCategory = {
  name: 'logging',
  extendsProtocol: 'searchable',
  methods: [{ selector: logApiCallSelector, imp: logApiCall }], // a ToolSelector and its ToolIMP
};

runtime.loadCategory(loggingCategory);
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

let loggingCategory = ToolCategory(
    name: "logging",
    extendsProtocol: "searchable",
    methods: [ToolMethod(selector: logApiCallSelector, imp: logApiCall)] // a ToolSelector and its ToolIMP
)

try await runtime.loadCategory(loggingCategory)
```

</TabItem>
</Tabs>

## `canHandle(selector)`

Check whether a `ToolClass` responds to a given selector, including the superclass chain:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
const cls = runtime.context.getClasses().find(c => c.name === 'github')!;
const sel = runtime.selectorTable.get('github.search_code')!;
console.log(cls.canHandle(sel)); // true
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
let cls = await runtime.context.getClasses().first { $0.name == "github" }!
let sel = await runtime.selectorTable.get("github.search_code")!
print(cls.canHandle(sel)) // true
```

</TabItem>
</Tabs>

This mirrors `respondsToSelector:` in Objective-C.
