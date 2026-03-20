import { motion } from "framer-motion";
import { 
  Github, 
  Terminal, 
  Copy, 
  MessageSquare, 
  Zap, 
  Box,
  ArrowRight,
  Brain,
  Search,
  Plug,
  Play,
  FileText,
  Shield,
  RefreshCw,
  Code2,
  Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { TerminalAnimation } from "@/components/TerminalAnimation";
import { HistoryTimeline } from "@/components/HistoryTimeline";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npm install smallchat");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-glow.png`}
          alt=""
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[100px]" />
      </div>

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="font-bold tracking-tight text-white">smallchat</span>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#compiler" className="hover:text-white transition-colors">The Compiler</a>
              <a href="#history" className="hover:text-white transition-colors">History</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#crazy-ones" className="hover:text-white transition-colors">Philosophy</a>
              <a href="#developers" className="hover:text-white transition-colors">For Developers</a>
              <a href="#quickstart" className="hover:text-white transition-colors">Get Started</a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="https://github.com/johnnyclem/smallchat" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-16 px-6 min-h-screen flex flex-col items-center justify-center text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl mx-auto space-y-8"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
              Open Source &middot; TypeScript &middot; MIT License
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tighter text-gradient leading-tight">
              Smallchat.
            </motion.h1>

            <motion.p variants={fadeUp} className="text-2xl md:text-3xl text-white/90 max-w-3xl mx-auto font-medium leading-snug tracking-tight">
              Tool calling that finally speaks your language.
            </motion.p>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Messages instead of schemas.<br />
              Streaming that feels alive.<br />
              One lightweight library that lets your LLM think, dispatch, and respond like it was built for it.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="https://github.com/johnnyclem/smallchat" target="_blank" rel="noreferrer">
                <Button size="lg" className="gap-2">
                  <Rocket className="w-5 h-5" />
                  Start building now
                </Button>
              </a>
              <Button 
                variant="glass" 
                size="lg" 
                className="gap-2 font-mono group relative overflow-hidden"
                onClick={handleCopy}
              >
                <Terminal className="w-4 h-4 text-muted-foreground" />
                npm install smallchat
                <Copy className={`w-4 h-4 ml-2 transition-colors ${copied ? 'text-green-400' : 'text-muted-foreground group-hover:text-white'}`} />
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="w-full mt-20"
          >
            <TerminalAnimation />
          </motion.div>
        </section>

        {/* The compiler is back, baby */}
        <section id="compiler" className="py-24 px-6 bg-black/40 border-y border-white/5 relative overflow-hidden scroll-mt-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,112,243,0.05)_0%,transparent_70%)] pointer-events-none" />
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-4xl mx-auto text-center space-y-12"
          >
            <motion.div variants={fadeUp} className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                The compiler is back, baby.
              </h2>
              <div className="space-y-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                <p>
                  You used to fight JSON schemas.<br />
                  You used to parse every delta by hand.<br />
                  You used to hope the model guessed right.
                </p>
                <p className="text-white font-medium">
                  Not anymore.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-6 pt-4">
              {[
                { text: "Tools are objects again.", icon: Box },
                { text: "Intent resolves with real semantics.", icon: Search },
                { text: "Every token streams the moment it arrives.", icon: Zap },
              ].map((item, i) => (
                <div key={i} className="glass-panel rounded-2xl p-6 border-primary/20 bg-primary/5 flex flex-col items-center text-center gap-4">
                  <item.icon className="w-8 h-8 text-primary" />
                  <p className="text-white font-medium text-lg">{item.text}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* History Timeline */}
        <HistoryTimeline />

        {/* Built for the way you already think */}
        <section id="features" className="py-32 px-6 scroll-mt-20">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-5xl mx-auto space-y-20"
          >
            <motion.div variants={fadeUp} className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Built for the way you already think
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                It is the difference between waiting for an answer and watching the answer arrive.
              </p>
            </motion.div>

            <motion.div variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Search, title: "Semantic dispatch", desc: "Finds the right tool before the first token leaves the model. No guessing, no rigid function names." },
                { icon: Zap, title: "Async streaming", desc: "Async generators hand you chunks in real time. Watch answers arrive, not wait for them." },
                { icon: Shield, title: "Fallbacks that never throw", desc: "Graceful degradation built in. When tools fail, the system recovers instead of crashing." },
                { icon: RefreshCw, title: "Cache that stays fresh", desc: "Resolution cache works across providers. Repeat intents resolve instantly." },
                { icon: Code2, title: "Plain TypeScript", desc: "All of it in plain TypeScript. Zero bloat. No framework lock-in, no magic decorators." },
                { icon: Plug, title: "Any source, one runtime", desc: "MCP servers, OpenAPI specs, or JSON schemas. They all compile into a single, unified dispatch table." },
              ].map((feature, i) => (
                <motion.div key={i} variants={fadeUp} className="glass-panel-hover glass-panel p-6 rounded-2xl group">
                  <feature.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="flex justify-center pt-4">
              <a href="https://github.com/johnnyclem/smallchat" target="_blank" rel="noreferrer">
                <Button variant="glass" size="lg" className="gap-2">
                  <Play className="w-4 h-4" />
                  See it stream
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* Pipeline */}
        <section className="py-24 px-6 bg-black/40 border-y border-white/5">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-5xl mx-auto space-y-16"
          >
            <motion.div variants={fadeUp} className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Four steps from definition to dispatch</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                The compiler transforms raw tool definitions into an optimized artifact the runtime can use instantly.
              </p>
            </motion.div>
            <motion.div variants={stagger} className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
              {[
                { step: "PARSE", emoji: "📄", desc: "Read tool definitions from any format — MCP, OpenAPI, or JSON." },
                { step: "EMBED", emoji: "🧠", desc: "Convert tool descriptions into semantic vectors for meaning-based lookup." },
                { step: "LINK", emoji: "🔗", desc: "Detect similar tools, resolve overloads, and build the dispatch tables." },
                { step: "OUTPUT", emoji: "📦", desc: "Produce a compiled artifact ready for the runtime to use." },
              ].map((phase, i) => (
                <motion.div key={i} variants={fadeUp} className="flex flex-col md:flex-row items-center">
                  <div className="glass-panel rounded-2xl p-6 w-56 text-center group hover:border-primary/30 transition-all duration-300">
                    <div className="text-3xl mb-2">{phase.emoji}</div>
                    <div className="text-primary font-mono font-bold text-sm mb-2">{phase.step}</div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{phase.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="text-muted-foreground text-2xl px-2 rotate-90 md:rotate-0 my-2 md:my-0">
                      →
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Here's to the crazy ones */}
        <section id="crazy-ones" className="py-32 px-6 relative overflow-hidden scroll-mt-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,80,255,0.06)_0%,transparent_60%)] pointer-events-none" />
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-4xl mx-auto space-y-16"
          >
            <motion.div variants={fadeUp} className="text-center space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Here's to the crazy ones.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Here's to the minds who never accepted the heavy way.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <blockquote className="relative max-w-3xl mx-auto">
                <div className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">"</div>
                <div className="glass-panel rounded-2xl p-8 md:p-12 space-y-6">
                  <p className="text-lg md:text-xl text-gray-300 leading-relaxed italic">
                    I think one of the things that really separates us from the high primates is that we're tool builders. 
                    We can fashion tools that amplify these inherent abilities that we have to spectacular magnitudes. 
                    And so for me, a computer has always been a bicycle of the mind. 
                    Something that takes us far beyond our inherent abilities.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-px bg-primary/40" />
                    <span className="text-sm font-semibold text-primary/80">Steve Jobs</span>
                  </div>
                </div>
              </blockquote>
            </motion.div>

            <motion.div variants={fadeUp} className="max-w-3xl mx-auto space-y-6 text-center">
              <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed">
                Smallchat is that same leap for your tools.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                It is for the ones who wanted messages instead of schemas. 
                The ones who built in the quiet hours and left the bowl half-full on purpose.
              </p>
              <blockquote className="border-l-2 border-primary/40 pl-6 py-2 text-left mx-auto max-w-xl">
                <p className="text-base text-gray-400 italic leading-relaxed">
                  Technology is nothing. What's important is that you have faith in people, that they're basically good and smart, 
                  and if you give them tools, they'll do wonderful things with them.
                </p>
                <span className="text-sm font-semibold text-primary/80 mt-2 block">— Steve Jobs</span>
              </blockquote>
              <p className="text-lg text-muted-foreground leading-relaxed pt-4">
                Smallchat is the library that finally gets it.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* Concept Map */}
        <section className="py-24 px-6 bg-black/40 border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,80,255,0.05)_0%,transparent_60%)] pointer-events-none" />
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center"
          >
            <motion.div variants={fadeUp} className="space-y-6">
              <div className="inline-flex items-center text-accent bg-accent/10 px-3 py-1 rounded-full text-sm font-medium">
                <Brain className="w-4 h-4 mr-2" />
                Architecture
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Messages, not function calls.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                In the 1970s, Alan Kay invented a style of programming where objects communicate by sending messages to each other. 
                The receiver decides what to do — not the sender.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                smallchat applies this same principle to AI. The model sends a message describing its intent, 
                and the runtime figures out the right tool to handle it. This decoupling is what makes the system flexible, 
                extensible, and surprisingly elegant.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-6 shadow-2xl relative">
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-accent/20 text-accent border border-accent/30 rounded-full text-xs font-bold tracking-wider">
                CONCEPT MAP
              </div>
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 items-center pb-3 border-b border-white/10 font-bold">
                  <div className="text-muted-foreground">Classic OOP</div>
                  <div></div>
                  <div className="text-white">smallchat</div>
                </div>
                {[
                  ["Object", "ToolProvider", "A service that offers tools"],
                  ["Class", "ToolClass", "A group of related tools"],
                  ["Message send", "dispatch()", "Ask for something to happen"],
                  ["Selector (SEL)", "ToolSelector", "The meaning of an intent"],
                  ["Implementation", "ToolIMP", "The code that runs"],
                  ["Method cache", "Resolution cache", "Remember past lookups"],
                  ["Protocol", "ToolProtocol", "A capability contract"],
                  ["Proxy", "ToolProxy", "Load details on demand"],
                ].map(([classic, sc, hint], i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-x-3 items-center py-2 border-b border-white/5 group hover:bg-white/[0.02] rounded transition-colors">
                    <div className="text-muted-foreground font-mono text-xs">{classic}</div>
                    <ArrowRight className="w-3 h-3 text-white/20" />
                    <div>
                      <span className="text-primary font-mono text-xs">{sc}</span>
                      <span className="text-muted-foreground/50 text-[11px] ml-2 hidden lg:inline">{hint}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* For Developers */}
        <section id="developers" className="py-32 px-6 scroll-mt-20">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-6xl mx-auto space-y-16"
          >
            <motion.div variants={fadeUp} className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center text-accent bg-accent/10 px-3 py-1 rounded-full text-sm font-medium mx-auto">
                <Box className="w-4 h-4 mr-2" />
                For Developers
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Under the hood</h2>
              <p className="text-muted-foreground text-lg">
                The dispatch hot path: embed the intent, check the cache, resolve the tool, execute. 
                Vectors act as semantic selectors — the AI equivalent of Objective-C's <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm">sel_registerName</code>.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid lg:grid-cols-2 gap-8 items-start">
              <CodeBlock 
                filename="src/core/types.ts — ToolSelector"
                code={
                  <>
<span className="token-keyword">export</span> <span className="token-keyword">interface</span> <span className="token-type">ToolSelector</span> {'{\n'}
{"  "}<span className="token-comment">{"/** Embedding vector — the semantic fingerprint */"}</span>{'\n'}
{"  "}<span className="token-property">vector</span>: <span className="token-type">Float32Array</span>;{'\n'}
{'\n'}
{"  "}<span className="token-comment">{"/** Human-readable canonical form */"}</span>{'\n'}
{"  "}<span className="token-property">canonical</span>: <span className="token-type">string</span>;{'\n'}
{'\n'}
{"  "}<span className="token-property">parts</span>: <span className="token-type">string</span>[];{'\n'}
{"  "}<span className="token-property">arity</span>: <span className="token-type">number</span>;{'\n'}
{'}'}
                  </>
                }
              />
              <CodeBlock 
                filename="src/runtime/dispatch.ts — Hot Path"
                code={
                  <>
<span className="token-keyword">async function</span> <span className="token-function">toolkit_dispatch</span>({'\n'}
{"  "}context: <span className="token-type">DispatchContext</span>,{'\n'}
{"  "}intent: <span className="token-type">string</span>,{'\n'}
{"  "}args?: <span className="token-type">Record</span>&lt;<span className="token-type">string</span>, <span className="token-type">unknown</span>&gt;{'\n'}
{")"}: <span className="token-type">Promise</span>&lt;<span className="token-type">ToolResult</span>&gt; {'{\n'}
{"  "}<span className="token-comment">{"// 1. Embed intent → Selector"}</span>{'\n'}
{"  "}<span className="token-keyword">const</span> vector = <span className="token-keyword">await</span> embedder.<span className="token-function">embed</span>(intent);{'\n'}
{"  "}<span className="token-keyword">const</span> sel = selectorTable.<span className="token-function">lookup</span>(vector);{'\n'}
{'\n'}
{"  "}<span className="token-comment">{"// 2. Cache hit? Return immediately"}</span>{'\n'}
{"  "}<span className="token-keyword">const</span> cached = cache.<span className="token-function">lookup</span>(sel);{'\n'}
{"  "}<span className="token-keyword">if</span> (cached) <span className="token-keyword">return</span> cached.imp.<span className="token-function">execute</span>(args);{'\n'}
{'\n'}
{"  "}<span className="token-comment">{"// 3. Resolve, cache, execute"}</span>{'\n'}
{"  "}<span className="token-keyword">const</span> imp = <span className="token-function">resolve</span>(sel);{'\n'}
{"  "}cache.<span className="token-function">store</span>(sel, imp);{'\n'}
{"  "}<span className="token-keyword">return</span> imp.<span className="token-function">execute</span>(args);{'\n'}
{'}'}
                  </>
                }
              />
            </motion.div>

            <motion.div variants={fadeUp} className="pt-8 border-t border-white/5">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="glass-panel p-8 rounded-2xl">
                  <div className="space-y-4 font-mono text-sm leading-relaxed text-gray-300">
                    <div className="text-accent font-bold text-base">SCObject Hierarchy</div>
                    <p className="text-xs text-muted-foreground font-sans mb-4">Every value passed to a tool is wrapped in a type-safe object, inspired by Objective-C's NSObject.</p>
                    <div className="pl-6 border-l border-white/10 space-y-3">
                      {[
                        ["SCSelector", "Wraps an intent"],
                        ["SCData", "Structured data (JSON)"],
                        ["SCToolReference", "Pass tools as arguments"],
                        ["SCArray", "Ordered collections"],
                        ["SCDictionary", "Key-value pairs"],
                      ].map(([name, hint], i) => (
                        <div key={i} className="flex items-center text-sm">
                          <span className="w-4 h-px bg-white/10 mr-2 shrink-0" />
                          <span className="text-primary">{name}</span>
                          <span className="text-muted-foreground ml-2 text-xs font-sans">— {hint}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-2xl md:text-3xl font-bold">Type-safe parameter passing</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Every value passed through the system is wrapped in a typed object. 
                    This enables function overloading (multiple tools can share a name but accept different argument types) 
                    and runtime introspection (the system can inspect what it's working with).
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The compiler can also detect semantically similar tools and automatically generate overloaded 
                    versions — so the right tool is chosen based on context, not just naming conventions.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Ready when you are */}
        <section id="quickstart" className="py-24 px-6 bg-black/40 border-y border-white/5 scroll-mt-20">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
            className="max-w-3xl mx-auto space-y-12"
          >
            <motion.div variants={fadeUp} className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready when you are</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Drop it in with one command.
                Watch it stream in your own UI.
                Or spin up the built-in server in seconds.
              </p>
              <p className="text-muted-foreground">
                From prototype to production in the time it takes to make coffee.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="glass-panel rounded-2xl overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b border-white/5 bg-black/40">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="mx-auto text-xs text-muted-foreground font-mono">terminal</div>
              </div>
              <div className="p-6 bg-black/50 font-mono text-sm space-y-5">
                <div>
                  <span className="text-muted-foreground select-none"># Install</span>
                  <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npm install smallchat</div>
                </div>
                <div>
                  <span className="text-muted-foreground select-none"># Compile tool definitions</span>
                  <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npx smallchat compile --source ./tools --output tools.json</div>
                  <div className="text-green-400/70 text-xs mt-1 select-none">Compiling tools... ✓ 3 tools from 2 providers embedded.</div>
                </div>
                <div>
                  <span className="text-muted-foreground select-none"># Test a natural-language dispatch</span>
                  <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npx smallchat resolve tools.json "search for code"</div>
                  <div className="text-green-400/70 text-xs mt-1 select-none">Matched: github.search_code (confidence: 0.98)</div>
                </div>
                <div>
                  <span className="text-muted-foreground select-none"># Spin up the built-in server</span>
                  <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npx smallchat serve tools.json --port 3000</div>
                  <div className="text-green-400/70 text-xs mt-1 select-none">smallchat server running on http://localhost:3000 ✓</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-[#050505] pt-16 pb-8 px-6">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                <span className="font-bold text-2xl text-white">smallchat</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="https://github.com/johnnyclem/smallchat" target="_blank" rel="noreferrer">
                  <Button size="lg" className="gap-2">
                    <Rocket className="w-5 h-5" />
                    Start building now
                  </Button>
                </a>
                <a href="https://github.com/johnnyclem/smallchat" target="_blank" rel="noreferrer">
                  <Button variant="glass" size="lg" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Leave the bowl half-full
                  </Button>
                </a>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
              <p className="text-sm text-muted-foreground">
                Built by Johnny Clem. MIT License.
              </p>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <a href="https://github.com/johnnyclem/smallchat" className="hover:text-white transition-colors flex items-center">
                  <Github className="w-4 h-4 mr-2" /> Source Code
                </a>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs">
                  v0.0.1
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
