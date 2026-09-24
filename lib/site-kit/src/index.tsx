import { motion } from "framer-motion";
import { Copy, Github, MessageSquare, Rocket } from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { FAMILY, type FamilyId } from "./icons";

export * from "./icons";

// ---------------------------------------------------------------------------
// Motion presets (same timings as smallchat's Home)
// ---------------------------------------------------------------------------

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} as const;
export const stagger = { visible: { transition: { staggerChildren: 0.1 } } };
export const inView = {
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, margin: "-100px" },
  variants: stagger,
} as const;
/** Enter/exit for tab panels inside AnimatePresence mode="wait". */
export const tabPanel = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3 },
} as const;

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

export function TabBar<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: string; icon: ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
            active === tab.id
              ? "text-white bg-white/[0.08] border border-white/15"
              : "text-muted-foreground hover:text-white/70 border border-transparent"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function PullQuote({ children, cite }: { children: ReactNode; cite?: string }) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6">
      <motion.figure {...inView} className="max-w-4xl mx-auto text-center">
        <motion.blockquote variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-gradient leading-tight">
          “{children}”
        </motion.blockquote>
        {cite && (
          <motion.figcaption variants={fadeUp} className="mt-5 text-sm text-muted-foreground font-mono">
            {cite}
          </motion.figcaption>
        )}
      </motion.figure>
    </section>
  );
}

export function SectionHeader({ title, lede }: { title: string; lede: string }) {
  return (
    <motion.div variants={fadeUp} className="text-center space-y-4">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{lede}</p>
    </motion.div>
  );
}

/** A banded section (the darker stripes between pull quotes). */
export function Band({ id, title, lede, children, wide = false }: {
  id?: string;
  title: string;
  lede: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section id={id} className="py-20 sm:py-24 px-4 sm:px-6 bg-black/40 border-y border-white/5 scroll-mt-20">
      <motion.div {...inView} className={`${wide ? "max-w-6xl" : "max-w-5xl"} mx-auto space-y-10`}>
        <SectionHeader title={title} lede={lede} />
        <motion.div variants={fadeUp} className="space-y-10">
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}

export function CopyButton({ text, label, className = "" }: { text: string; label: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the text is still selectable */
    }
  };
  return (
    <button onClick={copy} className={`group ${className}`}>
      {label}
      <Copy className={`w-4 h-4 ml-2 shrink-0 transition-colors ${copied ? "text-green-400" : "text-muted-foreground group-hover:text-white"}`} />
    </button>
  );
}

/** Terminal-style block of shell commands with one copy button. */
export function CommandBlock({ title, commands }: { title: string; commands: string[] }) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 text-xs text-muted-foreground">
        <span className="font-mono">{title}</span>
        <CopyButton text={commands.join("\n")} className="flex items-center hover:text-white transition-colors cursor-pointer" label="Copy" />
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-white/90">
        {commands.map((c, i) => (
          <div key={i}>
            <span className="text-primary select-none">$ </span>
            {c}
          </div>
        ))}
      </pre>
    </div>
  );
}

export function GetStarted({ lede, title, commands, children }: {
  lede: string;
  title: string;
  commands: string[];
  children?: ReactNode;
}) {
  return (
    <section id="start" className="py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20">
      <motion.div {...inView} className="max-w-3xl mx-auto space-y-10">
        <SectionHeader title="Get started" lede={lede} />
        <motion.div variants={fadeUp} className="space-y-4">
          <CommandBlock title={title} commands={commands} />
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page chrome
// ---------------------------------------------------------------------------

export interface SiteMeta {
  id: FamilyId;
  name: string;
  Icon: ComponentType<{ className?: string }>;
  github: string;
  version: string;
}

/** Soft glow of the site's colour behind everything. */
export function Glow({ rgb }: { rgb: string }) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 pointer-events-none opacity-60"
      style={{ background: `radial-gradient(60% 45% at 50% 0%, rgba(${rgb},0.16), transparent 70%)` }}
    />
  );
}

export function SiteNav({ site, links }: { site: SiteMeta; links: { href: string; label: string }[] }) {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center space-x-2">
          <site.Icon className="w-5 h-5 text-primary" />
          <span className="font-bold tracking-tight text-white">{site.name}</span>
        </a>
        <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <a href={FAMILY[0].url} className="text-muted-foreground hover:text-white transition-colors" aria-label="smallchat">
            <MessageSquare className="w-5 h-5" />
          </a>
          <a href={site.github} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors" aria-label="GitHub">
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </nav>
  );
}

/** Centered hero in smallchat's layout; `children` is the visual under it. */
export function Hero({ badge, title, tagline, lines, install, children }: {
  badge: string;
  title: string;
  tagline: string;
  lines: ReactNode;
  install: { display: string; copy: string };
  children?: ReactNode;
}) {
  return (
    <section id="top" className="pt-32 pb-16 px-4 sm:px-6 min-h-screen flex flex-col items-center justify-center text-center">
      <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto space-y-8">
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          {badge}
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tighter text-gradient leading-tight">
          {title}
        </motion.h1>
        <motion.p variants={fadeUp} className="text-2xl md:text-3xl text-white/90 max-w-3xl mx-auto font-medium leading-snug tracking-tight">
          {tagline}
        </motion.p>
        <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
          {lines}
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a href="#start" className="btn btn-primary">
            <Rocket className="w-5 h-5" /> Get started
          </a>
          <CopyButton
            text={install.copy}
            className="btn btn-glass font-mono text-sm sm:text-base max-w-full"
            label={<span className="truncate">{install.display}</span>}
          />
        </motion.div>
      </motion.div>
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="w-full max-w-3xl mt-20"
        >
          {children}
        </motion.div>
      )}
    </section>
  );
}

export function SiteFooter({ site }: { site: SiteMeta }) {
  const siblings = FAMILY.filter((f) => f.id !== site.id);
  return (
    <footer className="border-t border-white/10 bg-[#050505] pt-12 sm:pt-16 pb-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-2">
            <site.Icon className="w-6 h-6 text-primary" />
            <span className="font-bold text-2xl text-white">{site.name}</span>
          </div>
          <a href="#start" className="btn btn-primary">
            <Rocket className="w-5 h-5" /> Get started
          </a>
        </div>
        <div className="text-center space-y-4">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">The smallchat family</p>
          <div className="flex flex-wrap justify-center gap-3">
            {siblings.map((f) => (
              <a
                key={f.id}
                href={f.url}
                className="glass-panel glass-panel-hover flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white/90"
              >
                <span style={{ color: f.color }}>
                  <f.Icon className="w-4 h-4" />
                </span>
                {f.name}
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
          <p className="text-sm text-muted-foreground">Built by Johnny Clem. MIT License.</p>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <a href={site.github} className="hover:text-white transition-colors flex items-center">
              <Github className="w-4 h-4 mr-2" /> Source Code
            </a>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs">v{site.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
