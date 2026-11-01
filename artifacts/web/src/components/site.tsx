import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import type { Transition, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/** The one easing curve. Every motion on the site uses it. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** The one icon style: 16px, 1.5 stroke, in the colour of its text role. */
export function Icon({ as: Glyph, className }: { as: LucideIcon; className?: string }) {
  return <Glyph className={cn("h-4 w-4 shrink-0", className)} strokeWidth={1.5} aria-hidden />;
}

/** Tab panels fade and rise a few pixels. */
export const panelMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: EASE } satisfies Transition,
};

/** The single entrance on load: a short fade and rise with a small stagger. */
export const enterGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
export const enterItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

/** Page container: 16px gutters on phones, 24 from sm up. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function Section({
  id,
  tone = "base",
  children,
}: {
  id: string;
  tone?: "base" | "deep";
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-16 border-t py-16 md:py-24", tone === "deep" && "bg-deep")}>
      <Container className="space-y-10">{children}</Container>
    </section>
  );
}

/** Section header: the title on the left, a plain sentence and one link on the right from lg up. */
export function SectionHeader({
  title,
  lead,
  href,
  linkLabel,
}: {
  title: string;
  lead: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <header className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end lg:gap-16">
      <h2 className="text-balance text-[28px] font-medium leading-[1.15] md:text-[40px] md:tracking-[-0.02em]">{title}</h2>
      <div className="max-w-xl space-y-2">
        <p className="text-pretty text-base leading-relaxed text-subtle">{lead}</p>
        {href && linkLabel && <TextLink href={href}>{linkLabel}</TextLink>}
      </div>
    </header>
  );
}

export function TextLink({
  href,
  children,
  external = false,
  className,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "group inline-flex items-center gap-2 py-2 text-sm font-medium text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-foreground",
        className,
      )}
    >
      {children}
      <Icon as={ArrowRight} className="text-muted-foreground transition-colors group-hover:text-foreground" />
    </a>
  );
}

/**
 * Tabs with real roles and arrow-key movement. The active tab carries the lit rail.
 * Pair with a panel that has `role="tabpanel"`, `id={panelId(prefix)}` and
 * `aria-labelledby={tabId(prefix, active)}`.
 */
export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
export const panelId = (prefix: string) => `${prefix}-panel`;

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  prefix,
  label,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  prefix: string;
  label: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
      {tabs.map((tab, i) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            role="tab"
            id={tabId(prefix, tab.id)}
            aria-selected={isActive}
            aria-controls={panelId(prefix)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative h-11 shrink-0 cursor-pointer whitespace-nowrap px-3 text-sm font-medium transition-colors",
              isActive ? "lit-x text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** A 6px status dot in a semantic colour. */
export function StatusDot({ className, color }: { className?: string; color?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", className)}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}

/** An id, a flag or a command fragment in running text. */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code className={cn("rounded bg-raised px-2 py-0.5 font-mono text-[13px] text-foreground", className)}>
      {children}
    </code>
  );
}

/** Running text with `code` fragments set as tags. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) => (i % 2 === 1 ? <Tag key={i}>{part}</Tag> : <span key={i}>{part}</span>))}
    </>
  );
}

/** Cells that share one hairline grid, so a set of facts reads as one block. */
export function Cells({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid gap-px overflow-hidden rounded-xl border bg-border", className)}>{children}</div>;
}

/** One cell. A lead cell sets its title and body one step larger. */
export function Cell({
  icon,
  title,
  children,
  className,
  lead = false,
}: {
  icon?: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
  lead?: boolean;
}) {
  return (
    <div className={cn("space-y-3 bg-card p-6", className)}>
      {icon && <Icon as={icon} className="text-muted-foreground" />}
      <h4 className={cn("font-medium", lead ? "text-xl" : "text-base")}>{title}</h4>
      <p className={cn("text-pretty leading-relaxed text-subtle", lead ? "text-base" : "text-sm")}>{children}</p>
    </div>
  );
}
