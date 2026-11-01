import { Band, CommandBlock, GetStarted, PullQuote, SiteFooter, SiteNav, TypewriterIcon, type SiteMeta } from "@workspace/site-kit";
import { LedgerHero } from "@/components/LedgerHero";
import { Rules } from "@/components/Rules";
import { TranscriptExcerpt } from "@/components/TranscriptExcerpt";

const SITE: SiteMeta = {
  id: "stenographer",
  name: "stenographer",
  Icon: TypewriterIcon,
  github: "https://github.com/johnnyclem/stenographer",
  version: "1.1.0",
};
const INSTALL = "npm install @stenographer/core@^1";
const NPX = "npx -y @stenographer/core@^1";
const CLONE = `git clone ${SITE.github}.git`;

export default function App() {
  return (
    <>
      <SiteNav
        site={SITE}
        links={[
          { href: "#top", label: "Ledger" },
          { href: "#rules", label: "Rules" },
          { href: "#start", label: "Install" },
        ]}
      />

      <main>
        <LedgerHero />

        <PullQuote cite="One agent's confidence is not evidence. A person's approval, with one more approver, is.">No number of agents mints a TB</PullQuote>

        <Band id="rules" wide title="The rules" lede="The same rules, truth format v2, run the guided walk, the public ledger above and the MCP server you install">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Rules className="lg:col-span-5" />
            <TranscriptExcerpt className="lg:col-span-7" />
          </div>
          <p className="max-w-3xl text-base leading-6 text-secondary-foreground">
            Stenographer itself does more: it indexes your agents' transcripts, objects when one repeats a dead value, and its optional PreToolUse gate can stop the write.{" "}
            <a href={`${SITE.github}#readme`} className="text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-foreground">
              Read the README
            </a>
          </p>
        </Band>

        <GetStarted
          lede="Node 22 or newer. Runs locally, with no API keys."
          title={`npm · v${SITE.version}`}
          commands={[INSTALL, `${NPX} start ~/.claude/projects/myproj --mode watch`]}
        >
          <CommandBlock
            title="From source · a lockfile install needs Python 3 and make"
            commands={[CLONE, "cd stenographer && npm install && npm run build && npm link", "stenographer start ~/.claude/projects/myproj --mode watch"]}
          />
          <p className="max-w-3xl text-base leading-6 text-secondary-foreground">
            Check any ledger's chain with <code className="font-mono text-sm text-foreground">{NPX} verify ./stenographer.db</code>. To check this one, export it from <code className="font-mono text-sm text-foreground">/api/ledger/export</code>, import the file with{" "}
            <code className="font-mono text-sm text-foreground">import_wiki_entries</code> (an operator tool), then run verify.
          </p>
        </GetStarted>
      </main>

      <SiteFooter site={SITE} tagline="An MCP court reporter for your agents" />
    </>
  );
}
