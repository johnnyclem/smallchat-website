import { motion, useScroll, useTransform } from "framer-motion";
import { 
  Github, 
  Terminal, 
  Copy, 
  MessageSquare, 
  Zap, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Repeat, 
  PackageSearch,
  Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { TerminalAnimation } from "@/components/TerminalAnimation";
import { useState } from "react";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npm install smallchat");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full">
      {/* Background with Generated Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-glow.png`}
          alt="Abstract dark background"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[100px] mask-image-gradient" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="font-bold tracking-tight text-white">smallchat</span>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#quickstart" className="hover:text-white transition-colors">Quick Start</a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="https://github.com/johnnyclem/smallchat" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6 min-h-screen flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-4">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              v0.0.1 — Draft Implementation
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-gradient leading-tight">
              Object-Oriented <br/> Inference
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light">
              A message-passing tool compiler inspired by the Smalltalk and Objective-C runtime.
            </p>

            <blockquote className="border-l-2 border-primary/50 pl-4 py-2 mx-auto max-w-md text-left italic text-gray-400 bg-white/[0.02] rounded-r-lg">
              "The big idea is messaging." <br/>
              <span className="text-sm font-semibold text-primary/80 mt-1 block">— Alan Kay</span>
            </blockquote>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <a href="https://github.com/johnnyclem/smallchat" target="_blank" rel="noreferrer">
                <Button size="lg" className="gap-2">
                  <Github className="w-5 h-5" />
                  View on GitHub
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
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="w-full mt-24 perspective-[1000px]"
          >
            <TerminalAnimation />
          </motion.div>
        </section>

        {/* Core Concept */}
        <section className="py-24 px-6 bg-black/40 border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,112,243,0.05)_0%,transparent_70%)] pointer-events-none" />
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Message Passing for AI Tools</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Smallchat models LLM tool use as <strong className="text-white font-medium">message dispatch</strong>. 
                Instead of hardcoding function calls, the LLM expresses an <em>intent</em>, and the smallchat runtime dynamically resolves it to the most appropriate concrete implementation.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  "Semantic interning of tool intents",
                  "LRU cache for instant resolved dispatches",
                  "Provider grouping with superclass chains",
                  "Lazy schema loading for fast boots"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-300">
                    <div className="mr-3 p-1 rounded bg-primary/10 text-primary">
                      <Zap className="w-4 h-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Concept Mapping Table */}
            <div className="glass-panel rounded-2xl p-6 shadow-2xl relative">
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-accent/20 text-accent border border-accent/30 rounded-full text-xs font-mono font-bold tracking-wider">
                CONCEPT MAPPING
              </div>
              <div className="grid grid-cols-2 gap-y-3 font-mono text-sm">
                <div className="text-muted-foreground pb-2 border-b border-white/10 font-bold">Smalltalk / Obj-C</div>
                <div className="text-white pb-2 border-b border-white/10 font-bold">smallchat</div>
                
                <div className="text-muted-foreground py-1">Object</div><div className="text-primary py-1">ToolProvider</div>
                <div className="text-muted-foreground py-1">Class</div><div className="text-primary py-1">ToolClass</div>
                <div className="text-muted-foreground py-1">SEL</div><div className="text-primary py-1">ToolSelector</div>
                <div className="text-muted-foreground py-1">IMP</div><div className="text-primary py-1">ToolIMP</div>
                <div className="text-muted-foreground py-1">Method</div><div className="text-primary py-1">ToolMethod</div>
                <div className="text-muted-foreground py-1">Message send</div><div className="text-accent py-1">toolkit_dispatch()</div>
                <div className="text-muted-foreground py-1">Method cache</div><div className="text-primary py-1">Resolution cache</div>
                <div className="text-muted-foreground py-1">Protocol</div><div className="text-primary py-1">ToolProtocol</div>
                <div className="text-muted-foreground py-1">Category</div><div className="text-primary py-1">ToolCategory</div>
                <div className="text-muted-foreground py-1">NSProxy</div><div className="text-primary py-1">ToolProxy</div>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture & Code Examples */}
        <section id="architecture" className="py-32 px-6 scroll-mt-20">
          <div className="max-w-6xl mx-auto space-y-24">
            
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">The Runtime Hot Path</h2>
              <p className="text-muted-foreground text-lg">
                Vectors act as semantic fingerprints (like <code className="bg-white/10 px-1 rounded text-sm">sel_registerName</code>). 
                The runtime checks the cache, resolves the method, and executes the IMP.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <CodeBlock 
                filename="src/core/types.ts"
                code={
                  <>
<span className="token-keyword">export</span> <span className="token-keyword">interface</span> <span className="token-type">ToolSelector</span> {'{\n'}
  <span className="token-comment">/** Embedding vector — the "interned string" equivalent */</span>
  <span className="token-property">vector</span>: <span className="token-type">Float32Array</span>;
  
  <span className="token-comment">/** Human-readable canonical form */</span>
  <span className="token-property">canonical</span>: <span className="token-type">string</span>;
  
  <span className="token-property">parts</span>: <span className="token-type">string</span>[];
  <span className="token-property">arity</span>: <span className="token-type">number</span>;
{'}'}
                  </>
                }
              />
              <CodeBlock 
                filename="src/runtime/dispatch.ts"
                code={
                  <>
<span className="token-keyword">async</span> <span className="token-keyword">function</span> <span className="token-function">toolkit_dispatch</span>(
  context: <span className="token-type">DispatchContext</span>,
  intent: <span className="token-type">string</span>,
  args?: <span className="token-type">Record</span>&lt;<span className="token-type">string</span>, <span className="token-type">unknown</span>&gt;
): <span className="token-type">Promise</span>&lt;<span className="token-type">ToolResult</span>&gt; {'{\n'}
  <span className="token-comment">// 1. Intern intent to Selector</span>
  <span className="token-keyword">const</span> vector = <span className="token-keyword">await</span> context.embedder.<span className="token-function">embed</span>(intent);
  <span className="token-keyword">const</span> selector = context.selectorTable.<span className="token-function">lookup</span>(vector);

  <span className="token-comment">// 2. Inline cache hit?</span>
  <span className="token-keyword">const</span> cached = context.cache.<span className="token-function">lookup</span>(selector);
  <span className="token-keyword">if</span> (cached) <span className="token-keyword">return</span> cached.imp.<span className="token-function">execute</span>(args);

  <span className="token-comment">// 3. Resolve & Cache</span>
  <span className="token-keyword">const</span> imp = context.<span className="token-function">resolveMethod</span>(selector);
  context.cache.<span className="token-function">store</span>(selector, imp);
  
  <span className="token-keyword">return</span> imp.<span className="token-function">execute</span>(args);
{'}'}
                  </>
                }
              />
            </div>

            {/* SCObject Hierarchy Section */}
            <div className="pt-16 border-t border-white/5">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1 glass-panel p-8 rounded-2xl">
                  <div className="space-y-4 font-mono text-sm leading-relaxed text-gray-300">
                    <div className="text-accent font-bold">SCObject</div>
                    <div className="pl-6 border-l border-white/10 space-y-3 relative before:absolute before:top-0 before:bottom-0 before:-left-px before:w-px before:bg-gradient-to-b before:from-accent before:to-transparent">
                      <div className="flex items-center before:content-[''] before:w-4 before:h-px before:bg-white/10 before:mr-2">
                        SCSelector <span className="text-muted-foreground ml-2 text-xs">// Wraps intent</span>
                      </div>
                      <div className="flex items-center before:content-[''] before:w-4 before:h-px before:bg-white/10 before:mr-2">
                        SCData <span className="text-muted-foreground ml-2 text-xs">// Structured JSON</span>
                      </div>
                      <div className="flex items-center before:content-[''] before:w-4 before:h-px before:bg-white/10 before:mr-2">
                        SCToolReference <span className="text-muted-foreground ml-2 text-xs">// Pass tools as args</span>
                      </div>
                      <div className="flex items-center before:content-[''] before:w-4 before:h-px before:bg-white/10 before:mr-2">
                        SCArray
                      </div>
                      <div className="flex items-center before:content-[''] before:w-4 before:h-px before:bg-white/10 before:mr-2">
                        SCDictionary
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2 space-y-6">
                  <div className="inline-flex items-center text-accent bg-accent/10 px-3 py-1 rounded-full text-sm font-medium">
                    <Box className="w-4 h-4 mr-2" /> 
                    SCObject System
                  </div>
                  <h3 className="text-3xl font-bold">Typed Position-Based Passing</h3>
                  <p className="text-muted-foreground text-lg">
                    Every non-primitive passed to a function is an <code className="text-white font-mono bg-white/10 px-1 rounded">SCObject</code>. 
                    This NSObject-inspired root object enables type-safe function overloading and runtime introspection using <code className="text-white font-mono bg-white/10 px-1 rounded">isa</code> swizzling.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6 bg-black/40 border-y border-white/5 relative scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-16 text-center">Runtime Capabilities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: PackageSearch, title: "Semantic Intent", desc: "Vector embeddings match natural language directly to tool implementations." },
                { icon: Zap, title: "Resolution Cache", desc: "LRU inline cache makes repeated dispatches virtually instantaneous." },
                { icon: ShieldCheck, title: "Protocols", desc: "Type-safe capability interfaces guarantee provider conformance." },
                { icon: Repeat, title: "Method Swizzling", desc: "Replace tool implementations at runtime for testing, mocking, or context shifts." },
                { icon: Layers, title: "Overload System", desc: "Compiler generates semantic overloads. Multiple signatures per selector." },
                { icon: Cpu, title: "Lazy Loading", desc: "NSProxy-style deferred initialization keeps the runtime lightweight." },
              ].map((feature, i) => (
                <div key={i} className="glass-panel-hover glass-panel p-6 rounded-2xl group">
                  <feature.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline Section */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Compiler Pipeline</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                From raw tool manifests to a fully resolved dispatch table — four compilation phases produce an optimized runtime artifact.
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
              {[
                { step: "PARSE", desc: "Ingest MCP manifests, OpenAPI specs, and raw schemas into a unified tool representation." },
                { step: "EMBED", desc: "Generate vector embeddings and intern selectors via the selector table." },
                { step: "LINK", desc: "Resolve overloads, detect collisions, build dispatch tables and superclass chains." },
                { step: "OUTPUT", desc: "Emit compiled artifact with embedded selectors, caches, and overload tables." },
              ].map((phase, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center">
                  <div className="glass-panel rounded-2xl p-6 w-56 text-center group hover:border-primary/30 transition-all duration-300">
                    <div className="text-primary font-mono font-bold text-lg mb-2">{phase.step}</div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{phase.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="text-muted-foreground text-2xl px-2 rotate-90 md:rotate-0 my-2 md:my-0">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Start Section */}
        <section id="quickstart" className="py-24 px-6 bg-black/40 border-y border-white/5 scroll-mt-20">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Get Started</h2>
              <p className="text-muted-foreground text-lg">Up and running in under a minute.</p>
            </div>
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b border-white/5 bg-black/40">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="mx-auto text-xs text-muted-foreground font-mono">terminal</div>
              </div>
              <div className="p-6 bg-black/50 font-mono text-sm space-y-4">
                <div>
                  <span className="text-muted-foreground select-none"># Install</span>
                  <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npm install</div>
                  <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npm run build</div>
                </div>
                <div>
                  <span className="text-muted-foreground select-none"># Compile tool definitions</span>
                  <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npx smallchat compile --source ./examples --output tools.smallchat.json</div>
                </div>
                <div>
                  <span className="text-muted-foreground select-none"># Inspect the compiled artifact</span>
                  <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npx smallchat inspect tools.smallchat.json --providers --selectors</div>
                </div>
                <div>
                  <span className="text-muted-foreground select-none"># Test dispatch resolution</span>
                  <div className="text-gray-300"><span className="text-primary select-none">❯ </span>npx smallchat resolve tools.smallchat.json "search for code"</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-[#050505] pt-16 pb-8 px-6 text-center md:text-left">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 justify-center md:justify-start">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <span className="font-bold text-lg text-white">smallchat</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Built by Johnny Clem. MIT License.
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="https://github.com/johnnyclem/smallchat" className="hover:text-white transition-colors flex items-center">
                <Github className="w-4 h-4 mr-2" /> Source Code
              </a>
              <a href="https://github.com/johnnyclem/smallchat/blob/main/ARCHITECTURE.md" className="hover:text-white transition-colors">
                Architecture
              </a>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs">
                v0.0.1
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
