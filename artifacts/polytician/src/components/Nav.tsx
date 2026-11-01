import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { SiteMeta } from "@workspace/site-kit";

const LINKS = [
  { href: "#what", label: "What it does" },
  { href: "#try", label: "Try it" },
  { href: "#start", label: "Get started" },
];

/** Logo, three links, a GitHub text link. Under 768px the links fold into one menu button. */
export function Nav({ site }: { site: SiteMeta }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
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
        <a href="#top" className="inline-flex h-10 items-center gap-2 rounded-control text-base font-medium">
          <site.Icon className="icon-lg" />
          {site.name}
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <a href={site.github} target="_blank" rel="noreferrer" className="nav-link -mr-3 hidden md:inline-flex">
            GitHub
          </a>
          <button
            ref={button}
            type="button"
            className="nav-link -mr-2 h-(--control) w-(--control) cursor-pointer justify-center px-0 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div id={menuId} className="animate-menu absolute inset-x-0 top-full border-b border-border bg-background md:hidden">
          <div className="page-container flex flex-col gap-1 py-3">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="nav-link -mx-3 h-11">
                {l.label}
              </a>
            ))}
            <div className="my-1 border-t border-border" />
            <a href={site.github} target="_blank" rel="noreferrer" className="nav-link -mx-3 h-11">
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
