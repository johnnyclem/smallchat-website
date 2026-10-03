---
title: SCObject System
sidebar_label: SCObject System
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# SCObject System

The `SCObject` hierarchy is an NSObject-inspired base class for typed parameter passing. It enables runtime type checking, typed overload matching, and a consistent object model across dispatch boundaries.

## Type hierarchy

```
SCObject
├── SCSelector    — intent fingerprints (canonical selectors)
├── SCData        — a JSON object
├── SCToolReference — reference to another tool (for chaining)
├── SCArray       — ordered collection (wraps Array)
└── SCDictionary  — key-value collection (wraps object / Map)
```

All types inherit from `SCObject`, which provides:

- `isa` — string class identifier
- `isKindOfClass(cls)` — true if this instance is `cls` or a subclass
- `isMemberOfClass(cls)` — true if this instance is exactly `cls`
- `description()` (Swift: `description`) — human-readable string representation

## `wrapValue` / `unwrapValue`

Overload matching reads plain values as their wrapped form (`wrapValue()`), and SCObject arguments are unwrapped (`unwrapValue()`) before validation and execution, so a tool always receives plain JSON:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { wrapValue, unwrapValue, SCData } from '@smallchat/core';

// Wrapping: primitives stay as they are; objects and arrays are wrapped
wrapValue('hello')                 // → 'hello'
wrapValue(42)                      // → 42
wrapValue({ a: 1 })                // → SCData { value: { a: 1 } }
wrapValue([1, 2])                  // → SCArray [SCData { value: { value: 1 } }, SCData { value: { value: 2 } }]

// Unwrapping
unwrapValue(new SCData({ a: 1 }))  // → { a: 1 }
unwrapValue(wrapValue([1, 2]))     // → [{ value: 1 }, { value: 2 }]
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

// Wrapping: primitives stay as they are; dictionaries and arrays are wrapped
wrapValue("hello")                        // → "hello"
wrapValue(42)                             // → 42
wrapValue(["a": 1])                       // → SCData { value: ["a": 1] }
wrapValue([1, 2])                         // → SCArray [SCData { value: ["value": 1] }, SCData { value: ["value": 2] }]

// Unwrapping
unwrapValue(SCData(value: ["a": 1]))      // → ["a": 1]
unwrapValue(wrapValue([1, 2]))            // → [["value": 1], ["value": 2]]
```

</TabItem>
</Tabs>

You can pass SCObject instances directly as argument values. They are unwrapped before the arguments are validated, so the tool receives plain JSON:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { SCData } from '@smallchat/core';

await runtime.dispatch('search for code', {
  query: 'typescript generics',
  filters: new SCData({ language: 'typescript' }), // the tool receives { language: 'typescript' }
});
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
let args: [String: any Sendable] = [
    "query": "typescript generics",
    "filters": SCData(value: ["language": "typescript"]), // the tool receives ["language": "typescript"]
]

try await runtime.dispatch("search for code", args: args)
```

</TabItem>
</Tabs>

## Runtime type checking

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { SCArray, SCData, isSubclass } from '@smallchat/core';

const val = new SCArray([new SCData({ n: 1 })]);

console.log(val.isKindOfClass('SCArray'));    // true
console.log(val.isKindOfClass('SCObject'));   // true (superclass)
console.log(val.isMemberOfClass('SCArray'));  // true
console.log(val.isMemberOfClass('SCObject')); // false (not exact)

// isSubclass helper
console.log(isSubclass('SCArray', 'SCObject'));  // true
console.log(isSubclass('SCData', 'SCArray'));    // false
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

let val = SCArray(items: [SCData(value: ["n": 1])])

print(val.isKindOfClass("SCArray"))     // true
print(val.isKindOfClass("SCObject"))    // true (superclass)
print(val.isMemberOfClass("SCArray"))   // true
print(val.isMemberOfClass("SCObject"))  // false (not exact)

// isSubclass helper
print(SCObjectRegistry.shared.isSubclass("SCArray", of: "SCObject"))  // true
print(SCObjectRegistry.shared.isSubclass("SCData", of: "SCArray"))    // false
```

</TabItem>
</Tabs>

## `SCSelector`

`SCSelector` wraps a compiled `ToolSelector` so it can travel as a typed value, for example as an argument an overload declares as `SCType.object('SCSelector')`. Resolution does not return selectors (it returns tool ids); a tool receives the unwrapped `ToolSelector`:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { SCSelector } from '@smallchat/core';

const sel = runtime.selectorTable.get('github.search_code')!;
// sel is a compiled ToolSelector (intents are never interned)

const scSel = new SCSelector(sel);
// Can be passed as an argument to tools that accept selectors
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

let sel = await runtime.selectorTable.get("github.search_code")!
// sel is a compiled ToolSelector (intents are never interned)

let scSel = SCSelector(selector: sel)
// Can be passed as an argument to tools that accept selectors
```

</TabItem>
</Tabs>

## `SCToolReference`

`SCToolReference` holds a reference to another tool's implementation (its `ToolIMP`). Useful for tool chaining — passing one tool as part of the input specification for another:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { SCToolReference } from '@smallchat/core';

// A reference wraps a registered tool's implementation (its ToolIMP)
const search = runtime.getTool('github/search_code');
const send = runtime.getTool('slack/send_message');
if (search && send) {
  const ref = new SCToolReference(search.imp);
  console.log(ref.description()); // <SCToolReference id=… tool="search_code" provider="github">
  // e.g. as a typed parameter of a "compose" tool's overload: SCType.object('SCToolReference')
  const chain = [ref, new SCToolReference(send.imp)];
  void chain;
}
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

// A reference wraps a registered tool's implementation (its ToolIMP)
if let search = await runtime.context.getTool("github/search_code"),
   let send = await runtime.context.getTool("slack/send_message") {
    let ref = SCToolReference(imp: search.imp)
    print(ref) // <SCToolReference id=… tool="search_code" provider="github">
    // e.g. as a typed parameter of a "compose" tool's overload
    let chain = [ref, SCToolReference(imp: send.imp)]
    _ = chain
}
```

</TabItem>
</Tabs>

## `registerClass` and `getClassHierarchy`

Register custom SCObject subclasses for domain-specific typed parameters:

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { SCObject, registerClass, getClassHierarchy } from '@smallchat/core';

registerClass('SCFileReference', 'SCObject');

class SCFileReference extends SCObject {
  override readonly isa = 'SCFileReference';
  constructor(readonly path: string) {
    super();
  }
  override unwrap(): string {
    return this.path; // what a tool receives
  }
}

new SCFileReference('/tmp/report.csv').isKindOfClass('SCObject'); // true

// Inspect hierarchy
console.log(getClassHierarchy('SCFileReference'));
// ['SCFileReference', 'SCObject']
```

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChat

SCObjectRegistry.shared.register("SCFileReference", superclass: "SCObject")

final class SCFileReference: SCObject, @unchecked Sendable {
    override var isa: String { "SCFileReference" }
    let path: String
    init(path: String) {
        self.path = path
        super.init()
    }
    override func unwrap() -> any Sendable {
        path // what a tool receives
    }
}

SCFileReference(path: "/tmp/report.csv").isKindOfClass("SCObject") // true

// Inspect hierarchy
print(SCObjectRegistry.shared.hierarchy("SCFileReference"))
// ["SCFileReference", "SCObject"]
```

</TabItem>
</Tabs>

Custom classes participate in `isKindOfClass` and the OverloadTable's type matching.
