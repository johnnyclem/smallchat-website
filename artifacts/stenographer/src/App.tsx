import { Check, Gavel, ScrollText, Swords, Users } from "lucide-react";
import { Band, CommandBlock, GetStarted, Glow, PullQuote, SiteFooter, SiteNav, TypewriterIcon, type SiteMeta } from "@workspace/site-kit";
import { LedgerHero } from "@/components/LedgerHero";

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

function Rules() {
  const cards = [
    {
      icon: ScrollText,
      title: "TB · a tombstone",
      text: "Settled truth: a claim a person signed and answers for, with evidence. Active is ground truth; under appeal is ground truth with an asterisk; overridden or struck is history, never cited.",
    },
    {
      icon: Swords,
      title: "UV · an unverified assertion",
      text: "Believed, stated before anyone checked, with a basis and a way to verify it. Flag it, don't block on it. A UV that contests a TB puts that TB under appeal.",
    },
    {
      icon: Users,
      title: "Promotion, not fiat",
      text: "A UV becomes a TB when a person approves it and one other approver agrees, with evidence among them. Three agent sessions from different angles nominate; no number of agents mints a TB. Nobody corroborates what they drafted: approving or refuting is someone else's act.",
    },
    {
      icon: Gavel,
      title: "Resolve, never edit",
      text: "A person refutes a UV with evidence or strikes an entry with a written opinion. Wrong about your own claim? Withdraw it: strike it with the reason, then file it again corrected. Approving a contest overrides the old TB and mints its successor. Every change is an appended line on a hash-chained stream.",
    },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {cards.map((c) => (
        <div key={c.title} className="glass-panel glass-panel-hover rounded-2xl p-5">
          <c.icon className="w-6 h-6 text-primary mb-3" />
          <h4 className="text-base font-semibold text-white mb-1.5">{c.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <div className="relative w-full">
      <Glow rgb="248,168,40" />
      <div className="relative z-10">
        <SiteNav
          site={SITE}
          links={[
            { href: "#top", label: "Ledger" },
            { href: "#rules", label: "Rules" },
            { href: "#start", label: "Install" },
          ]}
        />

        <LedgerHero />

        <PullQuote cite="One agent's confidence is not evidence. A person's approval, with one more approver, is.">No number of agents mints a TB.</PullQuote>

        <Band id="rules" title="The rules" lede="The same engine runs the guided walk, the public ledger above, and the MCP server you install.">
          <Rules />
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed flex items-center justify-center gap-1.5 flex-wrap">
            <Check className="w-3.5 h-3.5 text-green-400" /> Stenographer itself does more: it indexes your agents' transcripts, objects when one repeats a dead value, and its PreToolUse gate can stop the write.
            <a href={`${SITE.github}#readme`} className="text-primary hover:underline">Read the README.</a>
          </p>
        </Band>

        <GetStarted
          lede={`Node 22 or newer. Runs locally, with no API keys. Check any ledger's chain with ${NPX} verify ./stenographer.db, this one included: export it and import it.`}
          title={`npm · v${SITE.version}`}
          commands={[INSTALL, `${NPX} start ~/.claude/projects/myproj --mode watch`]}
        >
          <CommandBlock
            title="from source · a lockfile install needs Python 3 and make"
            commands={[CLONE, "cd stenographer && npm install && npm run build && npm link", "stenographer start ~/.claude/projects/myproj --mode watch"]}
          />
        </GetStarted>

        <SiteFooter site={SITE} />
      </div>
    </div>
  );
}
