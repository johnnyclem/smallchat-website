import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

interface Era {
  year: string;
  title: string;
  subtitle: string;
  color: string;
  glowColor: string;
  paragraphs: string[];
  codeSnippet?: { label: string; code: string };
  highlights: { label: string; detail: string }[];
}

const eras: Era[] = [
  {
    year: "1972",
    title: "Smalltalk",
    subtitle: "The birth of message passing",
    color: "#22c55e",
    glowColor: "rgba(34,197,94,0.15)",
    paragraphs: [
      "At Xerox PARC, Alan Kay and his team created Smalltalk — a language where everything is an object, and objects communicate by sending messages to each other.",
      "The receiver decides how to handle the message, not the sender. This simple idea made software radically flexible: you could change how things worked without breaking everything else.",
    ],
    codeSnippet: {
      label: "Smalltalk message send",
      code: `myObject doSomethingWith: arg1 and: arg2.

"The sender doesn't know HOW it gets done.
 It just sends a message and trusts
 the receiver to handle it."`,
    },
    highlights: [
      { label: "Everything is an object", detail: "Numbers, strings, even code blocks — all objects that can receive messages." },
      { label: "Late binding", detail: "The method isn't decided at compile time. The runtime figures it out." },
      { label: "Live environment", detail: "You could change code while the program was running." },
    ],
  },
  {
    year: "1984",
    title: "Objective-C",
    subtitle: "Message passing meets the real world",
    color: "#3b82f6",
    glowColor: "rgba(59,130,246,0.15)",
    paragraphs: [
      "Brad Cox and Tom Love brought Smalltalk's messaging model to C, creating Objective-C. When Steve Jobs founded NeXT, he chose it as the foundation for everything.",
      "Apple later built macOS and iOS on this runtime. Every tap on an iPhone, every swipe, every animation — all powered by objc_msgSend, the fastest message dispatcher ever built.",
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
      { label: "Selectors (SEL)", detail: "Interned strings that uniquely identify a message — fast to compare." },
      { label: "Inline caching", detail: "objc_msgSend remembers recent lookups so repeat calls skip the search." },
      { label: "Categories & protocols", detail: "Add methods to existing classes. Define capability contracts." },
    ],
  },
  {
    year: "2026",
    title: "smallchat",
    subtitle: "Message passing for AI",
    color: "#a855f7",
    glowColor: "rgba(168,85,247,0.15)",
    paragraphs: [
      "Today, AI models need to use tools — search engines, APIs, databases, code runners. But every integration is hardwired. The model has to know the exact function name, the exact arguments.",
      "smallchat applies the same message-passing architecture to AI tool use. The model describes its intent in natural language. The runtime — using vector embeddings as semantic selectors — resolves it to the right tool automatically. Built first in TypeScript, now coming to Swift 6 with actors, structured concurrency, and Sendable safety throughout.",
    ],
    codeSnippet: {
      label: "smallchat dispatch",
      code: `// TypeScript — the AI says what it wants:
await runtime.dispatch("search for recent code changes");

// Swift 6 — actor-isolated, fully concurrent:
// let client = ChatClient(transport: ws, api: api, configuration: config)
// await client.login(user: currentUser)
// for await message in client.messageStream { ... }`,
    },
    highlights: [
      { label: "Semantic selectors", detail: "Vector embeddings replace interned strings — meaning replaces naming." },
      { label: "Resolution cache", detail: "Same LRU caching strategy, adapted for AI's repeated intents." },
      { label: "Swift 6 actors", detail: "Thread-safe by default. The compiler proves your concurrent code is correct." },
    ],
  },
];

function EraCard({ era, index }: { era: Era; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const cardOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], prefersReducedMotion ? [1, 1, 1, 1] : [0, 1, 1, 0]);
  const cardY = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], prefersReducedMotion ? [0, 0, 0, 0] : [80, 0, 0, -40]);
  const lineScale = useTransform(scrollYProgress, [0.05, 0.5], prefersReducedMotion ? [1, 1] : [0, 1]);

  return (
    <div ref={ref} className="relative">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px hidden lg:block">
        <div className="w-full h-full bg-white/5" />
        <motion.div
          style={{ scaleY: lineScale }}
          className="absolute top-0 left-0 w-full h-full origin-top"
        >
          <div className="w-full h-full" style={{ background: `linear-gradient(to bottom, ${era.color}, transparent)` }} />
        </motion.div>
      </div>

      <motion.div
        style={{ opacity: cardOpacity, y: cardY }}
        className="max-w-6xl mx-auto px-6 py-16 md:py-24"
      >
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-start`}>
          <div className={`space-y-8 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
            <div className="space-y-4">
              <motion.div
                className="inline-flex items-center gap-3"
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.5 } })}
              >
                <span
                  className="text-6xl md:text-8xl font-black tracking-tighter"
                  style={{ color: era.color, opacity: 0.2 }}
                >
                  {era.year}
                </span>
              </motion.div>

              <motion.h3
                className="text-3xl md:text-4xl font-bold tracking-tight"
                style={{ color: era.color }}
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.1 } })}
              >
                {era.title}
              </motion.h3>
              <motion.p
                className="text-lg text-muted-foreground font-medium"
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.15 } })}
              >
                {era.subtitle}
              </motion.p>
            </div>

            {era.paragraphs.map((p, i) => (
              <motion.p
                key={i}
                className="text-muted-foreground leading-relaxed text-base md:text-lg"
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.2 + i * 0.1 } })}
              >
                {p}
              </motion.p>
            ))}

            <motion.div
              className="grid sm:grid-cols-3 gap-4 pt-2"
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.4 } })}
            >
              {era.highlights.map((h, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="text-sm font-semibold text-white mb-1">{h.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{h.detail}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            className={`${index % 2 === 1 ? "lg:order-1" : ""}`}
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.2 } })}
          >
            {era.codeSnippet && (
              <div
                className="rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl"
                style={{ boxShadow: `0 20px 60px -15px ${era.glowColor}` }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/60">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: era.color, opacity: 0.6 }} />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{era.codeSnippet.label}</div>
                </div>
                <div className="p-5 bg-[#0a0a0a]">
                  <pre className="font-mono text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                    <code>{era.codeSnippet.code}</code>
                  </pre>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function ConnectorDot({ color }: { color: string }) {
  return (
    <div className="hidden lg:flex justify-center py-2">
      <motion.div
        className="w-4 h-4 rounded-full border-2 relative z-10"
        style={{ borderColor: color, boxShadow: `0 0 20px ${color}40` }}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="absolute inset-1 rounded-full" style={{ backgroundColor: color }} />
      </motion.div>
    </div>
  );
}

export function HistoryTimeline({ embedded = false }: { embedded?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const bgOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const prefersReducedMotion = useReducedMotion();

  const timelineContent = (
    <>
      <ConnectorDot color={eras[0].color} />
      {eras.map((era, i) => (
        <div key={i}>
          <EraCard era={era} index={i} />
          {i < eras.length - 1 && <ConnectorDot color={eras[i + 1].color} />}
        </div>
      ))}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12 text-center">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-4 text-lg sm:text-2xl md:text-3xl font-bold flex-wrap">
            <span style={{ color: eras[0].color }}>Smalltalk</span>
            <span className="text-white/20">→</span>
            <span style={{ color: eras[1].color }}>Objective-C</span>
            <span className="text-white/20">→</span>
            <span style={{ color: eras[2].color }}>smallchat</span>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Same architecture. Same elegance. New frontier.
          </p>
        </motion.div>
      </div>
    </>
  );

  if (embedded) return <div className="space-y-0">{timelineContent}</div>;

  return (
    <section id="history" className="relative scroll-mt-20 overflow-hidden" ref={containerRef} style={{ position: "relative" }}>
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.04)_0%,transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04)_0%,transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.04)_0%,transparent_40%)]" />
      </motion.div>

      <div className="relative z-10 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center text-white/60 bg-white/5 px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
              50 years in the making
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              A lineage of{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-400">
                big ideas
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The most powerful pattern in computing history — objects talking to each other through messages — 
              now applied to how AI uses tools.
            </p>
          </motion.div>
        </div>

        {timelineContent}
      </div>
    </section>
  );
}
