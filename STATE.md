# STATE

Open work for the Cocktail Passport. One-line status lives in `E:\claude-projects\PROJECTS.md`;
agent context in `CLAUDE.md`; the reconciled checklist in `docs/PRODUCTIONISATION.md`; the product
architecture in `docs/specs/2026-09-10-product-brief.md`.

## Where it stands (10 September 2026)

- Charles ruled on the fork: (b), a product for any sailing. Build under way on branch `product`,
  with workflows and subagents, one workstream at a time in the order A, C, B, E, BYO
  (the brief has the reasons and the file-contention map).
- `main` now carries the 5 September ops-review apply run as one commit (his 13 paths, committed
  10 September, not pushed). Pushing `main` deploys the `?seed` guard: asked, awaiting his answer.
- Live is `62cdf04` (last green Deploy run, 5 September). Sellability assessment of 10 September
  is folded into the brief; evidence under `tools/qa/shots-live-audit/` (gitignored).

## Open threads

- In flight: Phase 1, spec drafting. One agent per workstream drafts `docs/specs/2026-09-10-<slug>.md`
  from the brief; a critic pass checks each against the constitution and the brief. Workflow
  `scriptPath` and `resumeFromRunId` go here the moment they exist.
- Then per workstream: implement → gate review → fix, each a resumable workflow, committed on
  `product` per pass.
- Console gates for Charles (listed in the 10 September reply): Google provider + manual linking,
  Google Cloud OAuth client, redirect allow-list + Site URL, any 0004 migration, purge two Alex users,
  what is sold and at what price, a second real menu.

## Next action

Launch the Phase 1 spec workflow (all agents `model: 'opus'`), record its handles here, review the
drafted specs, commit them on `product`, then start one dev server on 5173 and run pass A.

## Gotchas

- `tools/qa/shot.mjs` always appends `?seed` and hits `SHOT_BASE`; against live it signs in an
  anonymous user per run. For a live look use `tools/qa/cold.mjs`; for offline, `tools/qa/offline.mjs`.
- The Claude-in-Chrome automation tab freezes `requestAnimationFrame` and force-darkens the page.
- A phone or Brave showing an older design is not a failed deploy: it is workstream A.
- Node on Windows needs `file:///E:/...` for an absolute ESM import; QA scripts import `./cdp.mjs`.
- Never two workflow writers on one file; never a second dev server on 5173.
