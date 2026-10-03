---
title: Truth Ledger
sidebar_label: Truth Ledger
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Truth Ledger

Long-running agents accumulate "facts" with no record of who asserted them, what the evidence
was, or whether anyone ever disputed them. The truth-ledger interop gives smallchat's memory
stack a principled answer: it reads
[Stenographer](https://github.com/johnnyclem/stenographer)'s **truth format v2** at a JSONL seam.
The contract is the line format (`spec/truth-format` in the stenographer repository), with golden
fixtures every reader runs. Neither side has a code dependency on the other.

- **TypeScript:** `@shorthand/core/truth` (`@shorthand/core` 1.0.0). It is a dependency of
  `@smallchat/core` 1.0.0, so it is already installed; to use it on its own,
  `npm install @shorthand/core@^1`. `@smallchat/core/truth` still re-exports it in 1.x, marked
  deprecated (removed in 2.0). The root `@smallchat/core` entry no longer re-exports it.
- **Swift:** the `SmallChatTruth` product of smallchat-swift 1.0.0.

## Two axes, not one

Every ledger entry carries **provenance** (where it came from: a message id, a commit, a file and
line) and a **confidence type** (how much to trust it). The confidence axis has exactly two values:

| Type | Meaning |
|------|---------|
| **TB** — asserted tombstone | A prior statement is stale or wrong, and someone stands behind saying so. Signed by a person, or by an agent whose line carries a quorum (see [below](#agents-settle-claims-together)). At least one piece of evidence. |
| **UV** — unverified assertion | "There be dragons." Believed true, stated before anyone verified it, with a machine-actionable `verifyBy` hint. |

Collapsing these into a single "invariant" bucket is explicitly a regression: an invariant that
compacted well but was never verified is a UV, and consumers deserve to know the difference.

## Streams: one writer, hash-chained

A truth file is UTF-8 JSONL, one entry per line, readable with `cat` and diffable in a PR.

- **One writer per file.** Only the file's writer appends to it. A team shares truth by each
  member's stenographer exporting to a file of its own (for example `wiki/<handle>.jsonl`). Other
  tools never append to a file stenographer exports: they submit a PROPOSAL envelope for a person
  to notarize.
- **Hash-chained.** Every line carries `seq` (1, 2, 3, … with no gaps), `prevHash` (the previous
  line's `hash`) and `hash`: the SHA-256 of the line's RFC 8785 (JCS) form without `hash`. A reader
  refuses a line whose hash doesn't match, and a file whose chain breaks.
- **What the chain shows.** No line was edited, removed, reordered or inserted between the first
  and last line, and the lines come from one stream. It does not show who wrote them: anyone can
  compute the hashes. It does not show lines removed from the end, unless you keep the last hash
  you read and check the stream still holds it. Key signatures are planned for 1.x.

## Status is a fold

A status change is never an edit. It is an appended `TRANSITION` line that names the entry, its
new status and the line that caused it. An entry's current status is the `status` of the
highest-`seq` TRANSITION that targets it, else the entry line's own.

| Type | Known statuses | Current truth |
|------|----------------|---------------|
| TB | `active`, `contested`, `overridden`, `struck` | `active`, and `contested` (with an asterisk) |
| UV | `open`, `verified`, `refuted`, `struck` | `open` (a heads-up) |

**Fail closed.** A missing or unknown status, an unsigned TB, a version 1 TB (no hash), a TB an
agent signed without a valid quorum, an evidence kind or link type the reader doesn't know on an
agent's TB, and an id that two lines or files disagree about are never current truth. The reader
keeps such lines verbatim and writes them back exactly as read. Several files, one per teammate,
fold one by one; each entry then takes the most advanced status any file reached
(`active < contested < overridden < struck`, `open < verified < refuted < struck`).

## The consumption rules

The rules ship in code (`classifyEntry` / `selectCurrentTruth`, and `CONSUMPTION_RULES` as text
for prompts), not as documentation you have to remember:

- **Active TB** → ground truth. Compact it, rely on it, cite it.
- **Contested TB** → ground truth *with a visible asterisk*: the TB **and** its contesting UVs
  both carry through compaction. The dispute is never resolved silently in either direction.
- **Open UV** → **flag, don't block.** Compaction never promotes a UV into something that reads
  as proven: the `[UV — UNVERIFIED]` marker survives every level.
- **Everything else** (overridden or struck TB, verified, refuted or struck UV, unknown status,
  inadmissible entry) → history. Never citable, excluded from current truth, and displaced from
  any cached compaction on the next sync.

## Agents settle claims together

An agent never settles a claim alone. Agents settle claims only as a **quorum**: two or more agent
sessions agreeing from different angles at the same time. A person may still sign alone, on
evidence of any kind.

What agents may settle: resolving an open UV as `verified` or `refuted`, and writing a TB an agent
signs. Nothing else. Overriding a TB, striking, dismissing and every ruling stay a person's acts.
Verifying a UV that contests a TB would override that TB, so agents can't do it: their agreement
goes to a person instead. An opposite verdict inside the window is a dispute: no quorum forms,
and a person is told.

A line that agents settled carries a `quorum`: one member `{author, agentSessionId, ts, evidence}`
per agreeing session. The rules:

1. **Two or more** members, each with a distinct `agentSessionId`.
2. **The writer is a member**: the agent whose attestation completed the quorum.
3. **Different angles**: every member cites at least one item of settling evidence, no two members
   cite the same item (in any spelling), and the settling evidence spans at least two kinds.
4. **At the same time**: every member's timestamp and the line's own lie within 15 minutes
   (900 000 ms) of each other.
5. **Agreeing**: an ADDENDUM's members file the same verdict, matching its `verifies` or
   `refutes` link. A quorum TB carries the literals its members agreed on.
6. **The line shows its evidence**: the line's `evidence` is exactly the members' evidence.

A reader refuses a line whose quorum breaks these rules, and with it the stream.

| Evidence class | Kinds | Can settle a claim an agent signs? |
|---|---|---|
| Settling | `commit`, `file`, `test`, `claimed-command`, `wiki` | Yes |
| Question | `message`, `chat`, `ticket`, `doc`, pre-1.0 `command` | No: it raises a question, but isn't a check |

A kind the reader doesn't know counts as question-class. An agent's TB that cites one is not
truth (`inadmissible.reason: 'unknown-value'`), however valid its quorum. A TB an agent signed
without a quorum is `'agent-without-quorum'`. The TypeScript module exports the rule as
`checkQuorum(line)`, `evidenceClass(kind)`, `SETTLING_EVIDENCE_KINDS`, `QUORUM_WINDOW_MS`
(900 000) and `QUORUM_MIN_MEMBERS` (2). The exact rules are stenographer's truth-format spec,
"Agent quorum".

## Reading the ledger

<Tabs groupId="language">
<TabItem value="typescript" label="TypeScript">

```typescript
import { readWikiFile, selectCurrentTruth, TruthAwareCompactor } from '@shorthand/core/truth';
import { DefaultCompactor } from '@shorthand/core/compaction';

// One writer's hash-chained stream (pass { signers } to check who may sign)
const read = readWikiFile('./wiki/alex.jsonl');
if (read.refused) throw new Error(read.errors.map((e) => e.error).join('\n'));

const selection = selectCurrentTruth(read.entries); // groundTruth / contested / unverified / history

const compactor = new TruthAwareCompactor(new DefaultCompactor(), selection);
const snapshot = await compactor.compact(history, 'L3');
// snapshot.summary ends with an "## Asserted Truth (ledger)" section;
// snapshot.truth carries the structured selection.
```

`parseWikiFiles` reads one file per teammate, and `parseWikiLines(moreLines, { base: read })`
folds the lines appended since an earlier read into it. Ledger text is untrusted: a field that
contains `[TB] …` renders escaped, so it can't pass for a ledger line.

</TabItem>
<TabItem value="swift" label="Swift">

```swift
import SmallChatTruth
import SmallChatCompaction

let result = TruthWiki.parse(jsonl)   // result.refused: the stream failed a check, nothing in it is truth
let selection = TruthWiki.selectCurrentTruth(result.entries)

// Truth entries become corpus items that must survive compaction:
let verifier = CompactionVerifier(invariants: [TruthInvariants.preserved(selection)])
```

`TruthInvariants.preserved` fails any compaction that drops a truth entry, or strips the
`UNVERIFIED` marker from a UV, which would silently promote a belief into a fact.

</TabItem>
</Tabs>

## Writing back: proposals only

Compaction may send its candidate invariants toward the ledger (settled configuration entities,
decisions that were never superseded), but only as `PROPOSAL` lines with `kind: "uv"`: the
suite's single PROPOSAL envelope, written as the writer's own hash-chained stream. Stenographer
files each one as an open proposal. Nothing becomes truth until a person notarizes it.

```typescript
import { proposeInvariants, appendProposalsFile, COMPACTION_DETECTOR } from '@shorthand/core/truth';

const proposals = proposeInvariants(snapshot, { author: COMPACTION_DETECTOR }); // 'detector:short-hand'
appendProposalsFile('./proposals.jsonl', proposals); // continues the file's chain, skips repeats
```

There is no anonymous write path: generic identities (`system`, `assistant`, `agent`, …) throw
before a line is written, and nothing the compactor emits is signed. `appendProposalsFile` skips a
proposal the file already holds (same kind, `targetRef` and claim or assertion), so repeated
compaction rounds don't re-propose the same invariant, while a corrected value is proposed again.

## Into L4

`@shorthand/core`'s L4 memory layer stores project-level invariants as string registers. When ledger
entries are projected into L4 (`truthToInvariantRecords`), the confidence type rides along
*inside the value* — `[TB] …`, `[TB ⚠ CONTESTED] …` or `[UV — UNVERIFIED] …` — so it survives any
string-typed store and no downstream reader can mistake tribal knowledge for verified fact.
