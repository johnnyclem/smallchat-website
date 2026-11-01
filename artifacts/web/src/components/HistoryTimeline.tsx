import { CodeBlock } from "@/components/ui/CodeBlock";
import { cn } from "@/lib/utils";

interface Era {
  year: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  codeSnippet: { label: string; code: string };
  highlights: { label: string; detail: string }[];
  current?: boolean;
}

const eras: Era[] = [
  {
    year: "1972",
    title: "Smalltalk",
    subtitle: "The birth of message passing",
    paragraphs: [
      "At Xerox PARC, Alan Kay and his team created Smalltalk, a language where everything is an object, and objects communicate by sending messages to each other.",
      "The receiver decides how to handle the message, not the sender. This simple idea made software flexible: you could change how things worked without breaking everything else.",
    ],
    codeSnippet: {
      label: "Smalltalk message send",
      code: `myObject doSomethingWith: arg1 and: arg2.

"The sender doesn't know HOW it gets done.
 It just sends a message and trusts
 the receiver to handle it."`,
    },
    highlights: [
      { label: "Everything is an object", detail: "Numbers, strings, even code blocks are objects that can receive messages." },
      { label: "Late binding", detail: "The method isn't decided at compile time. The runtime figures it out." },
      { label: "Live environment", detail: "You could change code while the program was running." },
    ],
  },
  {
    year: "1984",
    title: "Objective-C",
    subtitle: "Smalltalk's messaging on top of C",
    paragraphs: [
      "Brad Cox and Tom Love brought Smalltalk's messaging model to C, creating Objective-C. NeXT, the company Steve Jobs founded, chose it as the foundation of its software.",
      "Apple later built macOS and iOS on this runtime. A message send in Objective-C compiles to a call to objc_msgSend, which looks up the method and runs it.",
    ],
    codeSnippet: {
      label: "Objective-C message dispatch",
      code: `// The runtime resolves this at execution time
[object performAction:argument];

// Under the hood:
//   SEL sel = sel_registerName("performAction:");
//   IMP imp = class_getMethodImplementation(cls, sel);
//   imp(object, sel, argument);`,
    },
    highlights: [
      { label: "Selectors (SEL)", detail: "Interned strings that uniquely identify a message, fast to compare." },
      { label: "Inline caching", detail: "objc_msgSend remembers recent lookups so repeat calls skip the search." },
      { label: "Categories and protocols", detail: "Add methods to existing classes. Define capability contracts." },
    ],
  },
  {
    year: "2026",
    title: "smallchat",
    subtitle: "Message passing for AI",
    current: true,
    paragraphs: [
      "Today, AI models need to use tools: search engines, APIs, databases, code runners. But every integration is hardwired. The model has to know the exact function name, the exact arguments.",
      "smallchat applies the same message-passing architecture to AI tool use. The model describes its intent in natural language. The runtime, using vector embeddings as semantic selectors, proposes the one tool that handles it, and asks when nothing matches cleanly. 1.0 ships in TypeScript (@smallchat/core) and Swift (smallchat-swift), which share the same conformance vectors.",
    ],
    codeSnippet: {
      label: "smallchat dispatch",
      code: `// TypeScript: the AI says what it wants
const r = await runtime.resolve("search for recent code changes");
if (r.outcome === "resolved")
  await runtime.dispatchById(r.chosen!, args);

// Swift: the same rules, on an actor
// let resolution = try await runtime.resolve(
//   "search for recent code changes")
// let result = try await runtime.dispatchById(toolId, args: args)`,
    },
    highlights: [
      { label: "Semantic selectors", detail: "Vector embeddings replace interned strings: meaning replaces naming." },
      { label: "Resolution cache", detail: "Same LRU caching strategy, keyed by the intent's full text." },
      { label: "Swift 6 language mode", detail: "ToolRuntime is an actor; the compiler checks actor isolation and Sendable." },
    ],
  },
];

function EraRow({ era }: { era: Era }) {
  return (
    <article className="grid gap-8 border-t py-12 first:border-t-0 first:pt-0 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:gap-16">
      <div className={cn("min-w-0 space-y-6", era.current && "lit-gutter")}>
        <div className="space-y-2">
          <p className="font-mono text-sm text-muted-foreground">{era.year}</p>
          <h3 className="text-xl font-medium leading-tight md:text-[28px]">{era.title}</h3>
          <p className="text-xl text-subtle">{era.subtitle}</p>
        </div>
        <div className="space-y-4">
          {era.paragraphs.map((p) => (
            <p key={p} className="text-pretty text-base leading-relaxed text-subtle">
              {p}
            </p>
          ))}
        </div>
      </div>
      <div className="min-w-0 space-y-6">
        <CodeBlock filename={era.codeSnippet.label} code={era.codeSnippet.code} />
        <dl className="divide-y rounded-xl border bg-card">
          {era.highlights.map((h) => (
            <div key={h.label} className="space-y-1 px-4 py-3">
              <dt className="text-sm font-medium text-foreground">{h.label}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{h.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

export function HistoryTimeline() {
  return (
    <div>
      {eras.map((era) => (
        <EraRow key={era.year} era={era} />
      ))}
      <div className="space-y-3 border-t pt-12">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xl font-medium md:text-[28px]">
          <span>Smalltalk</span>
          <span aria-hidden className="text-muted-foreground">→</span>
          <span>Objective-C</span>
          <span aria-hidden className="text-muted-foreground">→</span>
          <span>smallchat</span>
        </p>
        <p className="max-w-xl text-base text-subtle">The sender says what it wants. The receiver decides how to handle it.</p>
      </div>
    </div>
  );
}
