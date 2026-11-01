/** The four rules, set as numbered lines in the margin like a page of pleading paper. */
export const RULES: Array<{ title: string; text: string }> = [
  {
    title: "TB · a tombstone",
    text: "Settled truth: a claim a person signed and answers for, with evidence. Active is ground truth; under appeal is ground truth with an asterisk; overridden or struck is history, never cited.",
  },
  {
    title: "UV · an unverified assertion",
    text: "Believed, stated before anyone checked, with a basis and a way to verify it. Flag it, don't block on it. A UV that contests a TB puts that TB under appeal.",
  },
  {
    title: "Promotion, not fiat",
    text: "A UV becomes a TB when a person approves it and one other approver agrees, with evidence among them. Three agent sessions from different angles nominate; no number of agents mints a TB. Nobody corroborates what they drafted: approving or refuting is someone else's act.",
  },
  {
    title: "Resolve, never edit",
    text: "A person refutes a UV with evidence or strikes an entry with a written opinion. Wrong about your own claim? Withdraw it: strike it with the reason, then file it again corrected. Approving a contest overrides the old TB and mints its successor. Every change is an appended line on a hash-chained stream.",
  },
];

export function Rules({ className = "" }: { className?: string }) {
  return (
    <ol className={className} aria-label="The four rules">
      {RULES.map((r, i) => (
        <li key={r.title} className="grid grid-cols-[40px_1fr]">
          <span className="margin-no pt-5" aria-hidden>
            {i + 1}
          </span>
          <div className="flex flex-col gap-2 py-4 pl-4">
            <h3 className="text-base font-medium leading-6 text-foreground">{r.title}</h3>
            <p className="text-base leading-6 text-secondary-foreground">{r.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
