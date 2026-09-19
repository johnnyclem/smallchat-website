---
title: Truth Ledger
sidebar_label: Truth Ledger
---

# Truth Ledger

Long-running agents accumulate "facts" with no record of who asserted them, what the evidence
was, or whether anyone ever disputed them. The truth-ledger interop gives smallchat's memory
stack (the vendored Short-Hand compactor) a principled answer: it consumes
[Stenographer](https://github.com/johnnyclem/stenographer)'s **TB/UV v2 asserted-truth ledger**
at a JSONL seam — a format-level contract, no code dependency in either direction.

Available in TypeScript as `@shorthand/core/truth` (re-exported from `@smallchat/core`) and in
Swift as `SmallChatTruth`.

## Two axes, not one

Every ledger entry carries **provenance** (where did this come from — a message id, a commit, a
file and line) and a **confidence type** (how much should you trust it). The confidence axis has
exactly two values:

| Type | Meaning |
|------|---------|
| **TB** — asserted tombstone | A prior statement is provably stale or wrong. Signed by a named author, with at least one piece of evidence. |
| **UV** — unverified assertion | "There be dragons." Believed true, stated before verification exists, with a machine-actionable `verifyBy` hint. |

Collapsing these into a single "invariant" bucket is explicitly a regression: an invariant that
compacted well but was never verified is a UV, and consumers deserve to know the difference.

## The consumption rules

The rules ship in code (`classifyEntry` / `selectCurrentTruth`), not as documentation you have to
remember:

- **Active TB** → ground truth. Compact it, rely on it, cite it.
- **Contested TB** → ground truth *with a visible asterisk*: the TB **and** its contesting UVs
  both carry through compaction. The dispute is never resolved silently in either direction.
- **Open UV** → **flag, don't block.** Compaction never promotes a UV into something that reads
  as proven — the `[UV — UNVERIFIED]` marker survives every level.
- **Overridden TB / refuted UV** → history. Never citable, excluded from current truth, and
  displaced from any cached compaction on the next sync.

## Reading the ledger

The wire format is append-only JSONL — one signed entry per line, readable with `cat`, diffable
in a PR. Later lines for the same id supersede earlier ones. Stenographer-specific fields travel
under a namespaced `x-steno` key that smallchat preserves opaquely, so the round-trip invariant
`serialize(parse(lines)) == lines` holds field-for-field.

```typescript
import {
  readWikiFile,
  selectCurrentTruth,
  TruthAwareCompactor,
  DefaultCompactor,
} from '@smallchat/core';

const { entries, errors } = readWikiFile('./team-wiki.jsonl');
const selection = selectCurrentTruth(entries);

const compactor = new TruthAwareCompactor(new DefaultCompactor(), selection);
const state = await compactor.compact(history, 'L3');
// state.summary now ends with an "## Asserted Truth (ledger)" section;
// state.truth carries the structured selection.
```

In Swift, the same seam looks like:

```swift
import SmallChatTruth
import SmallChatCompaction

let result = TruthWiki.parse(jsonl)
let selection = TruthWiki.selectCurrentTruth(result.entries)

// Truth entries become corpus items that must survive compaction:
let verifier = CompactionVerifier(invariants: [TruthInvariants.preserved(selection)])
```

`TruthInvariants.preserved` fails any compaction that drops a truth entry — or strips the
`UNVERIFIED` marker from a UV, which would silently promote a belief into a fact.

## Writing back: proposals only

Compaction may emit its candidate invariants toward the ledger — settled configuration entities,
decisions that were never superseded — but only as machine-drafted `PROPOSAL(kind: "uv")` lines.
Nothing becomes truth until a named author signs it on the stenographer side.

```typescript
import { proposeInvariants, appendProposalsFile } from '@smallchat/core';

const proposals = proposeInvariants(state, { author: 'johnny' });
appendProposalsFile('./proposals.jsonl', proposals); // dedupes by targetRef
```

There is no anonymous write path: generic identities (`system`, `assistant`, `agent`, …) are
rejected at the schema level, and repeated compaction rounds deduplicate by `targetRef` instead
of re-proposing the same invariant.

## Into L4

Short-Hand's L4 memory layer stores project-level invariants as string registers. When ledger
entries are projected into L4 (`truthToInvariantRecords`), the confidence type rides along
*inside the value* — `[TB] …` vs `[UV — UNVERIFIED] …` — so it survives any string-typed store
and no downstream reader can mistake tribal knowledge for verified fact.
