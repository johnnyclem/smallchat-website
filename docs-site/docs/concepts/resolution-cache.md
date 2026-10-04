---
title: Resolution Cache
sidebar_label: Resolution Cache
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Resolution Cache

The `ResolutionCache` is an LRU cache that stores resolved dispatches — analogous to the inline method cache in `objc_msgSend`. On a cache hit, dispatch skips the embedding and vector search entirely. On a cache miss, the full resolution runs and the result is stored for future calls.

## LRU cache mechanics

The cache maps an intent's `intentKey` (its full text, normalized) to a `ResolvedTool`, tagged with the version context it was resolved under:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
interface ResolvedTool {
  selector: ToolSelector;
  imp: ToolIMP;
  confidence: number;
  resolvedAt: number;          // timestamp
  hitCount: number;
  providerVersion?: string;    // tags checked on every lookup
  modelVersion?: string;
  schemaFingerprint?: string;
}
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
public struct ResolvedTool: Sendable {
    public let selector: ToolSelector
    public let imp: any ToolIMP
    public var confidence: Double
    public let resolvedAt: Date
    public var hitCount: Int
    public var providerVersion: String?     // tags checked on every lookup
    public var modelVersion: String?
    public var schemaFingerprint: String?
    public var registryGeneration: UInt64?  // entries from an older registry are not used
}
```

</TabItem>
</Tabs>

The default cache size is 1024 entries. When the cache is full, the least-recently-used entry is evicted. Configure the size in `RuntimeOptions`:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
// larger cache for high-traffic deployments
const { runtime } = await loadRuntime('./tools.toolkit.json', { runtimeOptions: { cacheSize: 2048 } });
// or: new ToolRuntime(vectorIndex, embedder, { cacheSize: 2048 })
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
// larger cache for high-traffic deployments
let toolkit = try await MCPToolkit.load(
    source: "./tools.toolkit.json",
    options: RuntimeOptions(cacheSize: 2048)
)
// or: ToolRuntime(vectorIndex: vectorIndex, embedder: embedder, options: RuntimeOptions(cacheSize: 2048))
```

</TabItem>
</Tabs>

## Version tagging

Cache entries are tagged with a `CacheVersionContext` to prevent stale hits after updates:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
interface CacheVersionContext {
  providerVersions: Map<string, string>;    // provider id → version, e.g. "1.2.0"
  modelVersion: string;                     // embedder, e.g. "onnx:all-MiniLM-L6-v2"
  schemaFingerprints: Map<string, string>;  // provider id → hash of its tool schemas
}
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
public struct CacheVersionContext: Sendable {
    public var providerVersions: [String: String]    // provider id → version, e.g. "1.2.0"
    public var modelVersion: String                  // the embedder's version
    public var schemaFingerprints: [String: String]  // provider id → hash of its tool schemas
}
```

</TabItem>
</Tabs>

A cache entry is only valid if its version context matches the current runtime context. If any component changes, the entry is treated as a miss.

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
// Update version context — future dispatches will bypass stale entries
runtime.setProviderVersion('github', '1.2.0');
runtime.setModelVersion('onnx:all-MiniLM-L6-v2');
runtime.updateSchemaFingerprint(githubClass); // recomputed from the class's loaded schemas
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
// Update version context — future dispatches will bypass stale entries
await runtime.setProviderVersion("github", "1.2.0")
await runtime.setModelVersion("my-embedder-v2")
await runtime.updateSchemaFingerprint(githubClass) // recomputed from the class's loaded schemas
```

</TabItem>
</Tabs>

## Schema fingerprint

`computeSchemaFingerprint(schemas)` hashes a list of `{ name, inputSchema }` (sorted by name). `runtime.updateSchemaFingerprint(toolClass)` computes it from a class's loaded schemas; to record one yourself, set it on the cache:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { computeSchemaFingerprint, readArtifact } from '@smallchat/core';

const artifact = await readArtifact('./tools.toolkit.json');
const githubSchemas = Object.values(artifact.tools)
  .filter((tool) => tool.providerId === 'github')
  .map((tool) => ({ name: tool.name, inputSchema: tool.inputSchema }));

runtime.cache.setSchemaFingerprint('github', computeSchemaFingerprint(githubSchemas));
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

var githubSchemas: [(name: String, inputSchema: JSONSchemaType)] = []
for (_, imp) in githubClass.dispatchTable {
    if let schema = imp.schema {
        githubSchemas.append((name: schema.name, inputSchema: schema.inputSchema))
    }
}

await runtime.cache.setSchemaFingerprint("github", computeSchemaFingerprint(githubSchemas))
```

</TabItem>
</Tabs>

Loading a recompiled artifact gives you a new runtime with an empty cache. When a provider's schemas change in a running runtime, update its fingerprint so entries cached against the old schemas expire on their next lookup.

## Cache invalidation hooks

Register a hook to hear about every invalidation (for example to refresh a UI or an LLM's context). In TypeScript `invalidateOn` returns a function that removes the hook; in Swift it returns an id:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import type { InvalidationHook } from '@smallchat/core';

// event: { type: 'flush' } | { type: 'provider', providerId } | { type: 'selector', selector }
//      | { type: 'stale', reason, key } | { type: 'ui-resource', uri }
const hook: InvalidationHook = (event) => {
  if (event.type === 'provider') console.log(`cache entries for ${event.providerId} dropped`);
};

const stop = runtime.invalidateOn(hook);
// later: stop();
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
// InvalidationHook = @Sendable (InvalidationEvent) -> Void
// event: .flush | .provider(providerId:) | .selector(_) | .stale(reason:key:)
await runtime.invalidateOn { event in
    if case .provider(let providerId) = event {
        print("cache entries for \(providerId) dropped")
    }
}
```

</TabItem>
</Tabs>

Trigger invalidation explicitly:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
// Flush all entries for the 'github' provider
runtime.cache.flushProvider('github');

// Flush everything
runtime.cache.flush();
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
// Flush all entries for the 'github' provider
await runtime.cache.flushProvider("github")

// Flush everything
await runtime.cache.flush()
```

</TabItem>
</Tabs>

## Hot-reload workflow

The cache makes hot-reload safe. When you recompile your tool definitions:

1. Write the new artifact to disk
2. Load it again with `loadRuntime()` and swap the runtime in, or replace
   individual providers with `runtime.registerClass(cls)` (same name: the
   old class is replaced and every cached resolution is flushed)
3. After changing a provider's tool schemas in place, call
   `runtime.updateSchemaFingerprint(cls)`; entries cached against the old
   fingerprint expire on their next lookup

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
// In development — watch for changes and load the new artifact
import { watch } from 'node:fs';
import { loadRuntime } from '@smallchat/core';

let { runtime, upstreams } = await loadRuntime('./tools.json');
watch('./tools.json', async () => {
  const next = await loadRuntime('./tools.json');
  await upstreams.close();
  ({ runtime, upstreams } = next);
  console.log('Runtime reloaded.');
});
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

// In development — when ./tools.json changes, load it again and swap the
// new runtime in (call this from your file watcher, e.g. a DispatchSource
// on .write). There is no in-place reload.
func reloadRuntime() async throws -> ToolRuntime {
    let toolkit = try await MCPToolkit.load(source: "./tools.json")
    print("Runtime reloaded.")
    return toolkit.runtime
}
```

</TabItem>
</Tabs>

## Direct cache access

The runtime exposes its cache as `runtime.cache`. Look an entry up by its intent key (no embedding needed), flush entries, or read the entry count. The cache keeps no hit or miss statistics, and dispatch is what stores entries.

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { intentKey } from '@smallchat/core';

// Inspect a cached entry
const entry = runtime.cache.lookup(intentKey('search for code'));
if (entry) {
  console.log('Cache hit:', entry.imp.providerId, entry.imp.toolName, entry.confidence, entry.hitCount);
}

// Drop one provider's entries
runtime.cache.flushProvider('github');

// Number of cached entries
console.log('Entries:', runtime.cache.size);
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
// Inspect a cached entry
if let entry = await runtime.cache.lookup(key: intentKey("search for code")) {
    print("Cache hit:", entry.imp.providerId, entry.imp.toolName, entry.confidence, entry.hitCount)
}

// Drop one provider's entries
await runtime.cache.flushProvider("github")

// Number of cached entries
print("Entries:", await runtime.cache.size)
```

</TabItem>
</Tabs>
