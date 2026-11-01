import { FAMILY, type SiteMeta } from "@workspace/site-kit";

/** One compact row: wordmark, sibling products as quiet text, source, licence, version. */
export function Footer({ site }: { site: SiteMeta }) {
  const siblings = FAMILY.filter((f) => f.id !== site.id);
  return (
    <footer className="border-t border-border bg-deep py-8">
      <div className="page-container flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <a href="#top" className="inline-flex h-10 items-center gap-2 rounded-control text-base font-medium">
            <site.Icon className="icon-lg" />
            {site.name}
          </a>
          <nav aria-label="The smallchat family" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {siblings.map((f) => (
              <a key={f.id} href={f.url} className="link-quiet inline-flex h-9 items-center rounded-control">
                {f.name}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-x-6">
          <span>Built by Johnny Clem</span>
          <div className="flex items-center gap-x-4 sm:gap-x-6">
            <span>MIT license</span>
            <a href={site.github} className="link-quiet inline-flex h-9 items-center rounded-control">
              Source code
            </a>
            <span className="mono">v{site.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
