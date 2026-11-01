import { MotionConfig, motion } from "framer-motion";
import { Check, Copy, Github, Menu, MessageSquare, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { FAMILY, type FamilyId } from "./icons";

export * from "./icons";

/*
 * Quiet building blocks over the tokens in theme.css. Nothing here names a
 * product colour or typeface: a site re-skins it by overriding variables.
 * Styling lives in theme.css utilities (panel, btn, tab-item, text-title ...);
 * these components only compose them and add the behaviour.
 */

// ---------------------------------------------------------------------------
// Motion: one curve, one entrance, short feedback
// ---------------------------------------------------------------------------

/** The family's one easing curve (same as --ease-standard in theme.css). */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade and rise 8px over 400ms. Use as `variants` under a `stagger` parent. */
export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
} as const;
/** 50ms between siblings. Parent: initial="hidden" animate="visible" variants={stagger}. */
export const stagger = { visible: { transition: { staggerChildren: 0.05 } } };
/** Enter/exit for tab panels inside AnimatePresence mode="wait": 180ms fade with a 6px rise. */
export const tabPanel = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: EASE },
} as const;

/** Wrap the app once (main.tsx): framer-motion then honours prefers-reduced-motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** A page section: shared container, 64/96 vertical space, a hairline on top. */
export function Section({ id, children, className = "", divider = true }: {
  id?: string;
  children: ReactNode;
  className?: string;
  divider?: boolean;
}) {
  return (
    <section id={id} className={`section-y ${divider ? "border-t border-border" : ""} ${className}`}>
      <div className="page-container">{children}</div>
    </section>
  );
}

export function SectionHeader({ title, lede, align = "start" }: {
  title: string;
  lede: string;
  align?: "start" | "center";
}) {
  const center = align === "center";
  return (
    <div className={`flex flex-col gap-3 ${center ? "items-center text-center" : ""}`}>
      <h2 className="text-title">{title}</h2>
      <p className="text-lead text-secondary-foreground">{lede}</p>
    </div>
  );
}

/**
 * A section with a header. Content sits 32 under the header; `wide` lifts the
 * 64rem reading measure on the content. Everything keeps the container's left edge.
 */
export function Band({ id, title, lede, children, wide = false, align = "start" }: {
  id?: string;
  title: string;
  lede: string;
  children: ReactNode;
  wide?: boolean;
  align?: "start" | "center";
}) {
  return (
    <Section id={id}>
      <SectionHeader title={title} lede={lede} align={align} />
      <div className={`mt-8 flex flex-col gap-6 ${wide ? "" : "max-w-5xl"}`}>{children}</div>
    </Section>
  );
}

/** A statement between sections: 28 to 40, 500, no quote marks, mono caption. */
export function PullQuote({ children, cite, align = "start" }: {
  children: ReactNode;
  cite?: string;
  align?: "start" | "center";
}) {
  const center = align === "center";
  return (
    <section className="border-t border-border py-12 md:py-16">
      <figure className={`page-container ${center ? "text-center" : ""}`}>
        <blockquote className={`text-quote max-w-3xl ${center ? "mx-auto" : ""}`}>{children}</blockquote>
        {cite && <figcaption className="text-meta mt-4">{cite}</figcaption>}
      </figure>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

/** ids that tie a tab to its panel; pass the same idPrefix to TabBar. */
export function tabPanelProps(idPrefix: string, id: string) {
  return {
    id: `${idPrefix}-panel-${id}`,
    role: "tabpanel" as const,
    "aria-labelledby": `${idPrefix}-tab-${id}`,
    tabIndex: 0,
  };
}

/**
 * Real tablist: roving tabindex, arrow keys, Home and End. Give it `idPrefix`
 * and spread `tabPanelProps(idPrefix, id)` on each panel to link them.
 */
export function TabBar<T extends string>({ tabs, active, onChange, label, idPrefix, align = "start", className = "" }: {
  tabs: { id: T; label: string; icon?: ReactNode }[];
  active: T;
  onChange: (id: T) => void;
  /** Accessible name of the tablist. */
  label?: string;
  idPrefix?: string;
  align?: "start" | "center";
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex flex-wrap gap-1 ${align === "center" ? "justify-center" : ""} ${className}`}
    >
      {tabs.map((tab, i) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={idPrefix ? `${idPrefix}-tab-${tab.id}` : undefined}
            aria-selected={selected}
            aria-controls={idPrefix ? `${idPrefix}-panel-${tab.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className="tab-item"
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy and code
// ---------------------------------------------------------------------------

/**
 * Copies `text`. Announces "Copied" politely, swaps the icon for a check for 2s.
 * Style it with the caller's className (for example "btn btn-secondary").
 */
export function CopyButton({ text, label, className = "", copiedLabel, ariaLabel }: {
  text: string;
  label: ReactNode;
  className?: string;
  /** Visible label while copied. Leave out when the label's width must not change. */
  copiedLabel?: ReactNode;
  /** Defaults to "Copy <first line>" when `label` is not a plain string. */
  ariaLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the text is still selectable */
    }
  };
  const name = ariaLabel ?? (typeof label === "string" ? undefined : `Copy ${text.split("\n")[0].slice(0, 80)}`);
  return (
    <>
      <button type="button" onClick={copy} aria-label={name} className={`group inline-flex cursor-pointer items-center gap-2 ${className}`}>
        {copied && copiedLabel ? copiedLabel : label}
        {copied ? <Check className="icon" aria-hidden /> : <Copy className="icon" aria-hidden />}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </>
  );
}

/** Terminal-style block of shell commands with one copy button. */
export function CommandBlock({ title, commands, prompt = "$", wrap = false, className = "" }: {
  title: string;
  commands: string[];
  /** Leading marker per line; false for none. */
  prompt?: string | false;
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean;
  className?: string;
}) {
  return (
    <div className={`panel overflow-hidden ${className}`}>
      <div className="panel-header">
        <span className="font-mono">{title}</span>
        <CopyButton
          text={commands.join("\n")}
          label="Copy"
          copiedLabel="Copied"
          ariaLabel={`Copy commands, ${title}`}
          className="btn btn-ghost btn-sm -my-2 -mr-2 px-2"
        />
      </div>
      <pre className="panel-body overflow-x-auto text-code text-foreground">
        {commands.map((c, i) => (
          <div key={i} className={prompt === false ? "" : "grid grid-cols-[auto_1fr] gap-2"}>
            {prompt !== false && (
              <span aria-hidden className="select-none text-muted-foreground">
                {prompt}
              </span>
            )}
            <span className={wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"}>{c}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function GetStarted({ lede, title, commands, children, heading = "Get started", align = "start" }: {
  lede: string;
  /** Title of the command block. */
  title: string;
  commands: string[];
  children?: ReactNode;
  /** Section heading. */
  heading?: string;
  align?: "start" | "center";
}) {
  return (
    <Section id="start">
      <SectionHeader title={heading} lede={lede} align={align} />
      <div className="mt-8 flex max-w-3xl flex-col gap-4">
        <CommandBlock title={title} commands={commands} />
        {children}
      </div>
    </Section>
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

/**
 * Solid page-coloured bar with a hairline, 56 tall. Under 768px the links
 * collapse into one menu button (aria-expanded), which fades and rises 6px.
 */
export function SiteNav({ site, links }: { site: SiteMeta; links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => {
      if (wide.matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 top-0 z-50 h-(--nav-h) border-b border-border bg-background">
      <div className="page-container flex h-full items-center justify-between gap-4">
        <a href="#top" className="inline-flex h-9 items-center gap-2 rounded-control text-base font-medium">
          <site.Icon className="icon-lg" />
          {site.name}
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <a href={FAMILY[0].url} className="nav-link w-9 justify-center px-0" aria-label="smallchat">
            <MessageSquare className="icon-lg" />
          </a>
          <a href={site.github} target="_blank" rel="noreferrer" className="nav-link w-9 justify-center px-0" aria-label="GitHub">
            <Github className="icon-lg" />
          </a>
          <button
            ref={button}
            type="button"
            className="nav-link w-9 cursor-pointer justify-center px-0 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="icon-lg" /> : <Menu className="icon-lg" />}
          </button>
        </div>
      </div>
      {open && (
        <div id={menuId} className="animate-menu absolute inset-x-0 top-full border-b border-border bg-background md:hidden">
          <div className="page-container flex flex-col gap-1 py-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="nav-link h-11">
                {l.label}
              </a>
            ))}
            <div className="my-1 border-t border-border" />
            <a href={FAMILY[0].url} className="nav-link h-11">
              <MessageSquare className="icon" />
              smallchat
            </a>
            <a href={site.github} target="_blank" rel="noreferrer" className="nav-link h-11">
              <Github className="icon" />
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

/**
 * Left-aligned first screen. With `children` it is a split from 1024px up
 * (text 5 of 12, visual 7 of 12, vertically centred) and a stack below.
 * One primary and one secondary action; `meta` is a quiet mono line.
 * One entrance: fade and rise 8px, 50ms apart.
 */
export function Hero({ badge, meta, title, tagline, lines, install, children }: {
  /** Old name of `meta`. It no longer renders a pill. */
  badge?: string;
  /** Quiet mono line under the actions, for example "MIT, Node 22+". */
  meta?: string;
  title: string;
  tagline: string;
  lines: ReactNode;
  install: { display: string; copy: string };
  children?: ReactNode;
}) {
  const quiet = meta ?? badge;
  return (
    <section id="top" className="section-hero">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className={`page-container ${children ? "grid items-center gap-12 lg:grid-cols-12 lg:gap-16" : ""}`}
      >
        <div className={children ? "lg:col-span-5" : "max-w-3xl"}>
          <motion.h1 variants={fadeUp} className="text-display">
            {title}
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lead mt-6 text-foreground">
            {tagline}
          </motion.p>
          <motion.p variants={fadeUp} className="mt-4 max-w-xl text-base text-secondary-foreground">
            {lines}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#start" className="btn btn-primary btn-lg">
              Get started
            </a>
            <CopyButton
              text={install.copy}
              className="btn btn-secondary btn-lg min-w-0 max-w-full font-mono text-sm"
              label={<span className="truncate">{install.display}</span>}
            />
          </motion.div>
          {quiet && (
            <motion.p variants={fadeUp} className="text-meta mt-6">
              {quiet}
            </motion.p>
          )}
        </div>
        {children && (
          <motion.div variants={fadeUp} className="lg:col-span-7">
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

/**
 * One compact footer on the deepest surface: wordmark, sibling products as
 * quiet text links, then source, licence and version. No second call to action.
 */
export function SiteFooter({ site, tagline }: {
  site: SiteMeta;
  /** Optional quiet line under the wordmark. */
  tagline?: string;
}) {
  const siblings = FAMILY.filter((f) => f.id !== site.id);
  return (
    <footer className="border-t border-border bg-deep py-8 md:py-12">
      <div className="page-container flex flex-col gap-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <a href="#top" className="inline-flex items-center gap-2 text-base font-medium">
              <site.Icon className="icon-lg" />
              {site.name}
            </a>
            {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}
          </div>
          <nav aria-label="The smallchat family" className="flex flex-col gap-2">
            <p className="text-meta">The smallchat family</p>
            <div className="-ml-3 flex flex-wrap gap-x-1 gap-y-1">
              {siblings.map((f) => (
                <a key={f.id} href={f.url} className="nav-link">
                  <f.Icon className="icon" />
                  {f.name}
                </a>
              ))}
            </div>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
          <span>Built by Johnny Clem</span>
          <span>MIT license</span>
          <a href={site.github} className="link-quiet inline-flex items-center gap-2">
            <Github className="icon" />
            Source code
          </a>
          <span className="font-mono tabular-nums">v{site.version}</span>
        </div>
      </div>
    </footer>
  );
}
