# STATE

Open work for the Cocktail Passport. One-line status lives in `E:\claude-projects\PROJECTS.md`;
agent context in `CLAUDE.md`; the reconciled checklist in `docs/PRODUCTIONISATION.md`; the product
architecture in `docs/specs/2026-09-10-product-brief.md`, one spec per workstream beside it.

## Where it stands (11 September 2026)

- Charles ruled the fork: (b), a product for any sailing. The build is on branch `product`, done
  with workflows and subagents one workstream at a time (build, gate review, fix each).
- **Four of the five workstreams are shipped on `product`, HEAD `ce1d64d`:** A (the first open after
  a deploy reloads onto the new build), C (optional Google sign-in and a tested restore merge), B
  (the first-open screen, the sync gate behind it, the masthead on Home, the privacy note), E (the
  desktop landing and install path at `/` and `/get`). 60 commits since live, 56 files, +7188/-269.
  All gates green on HEAD: `npm run lint` 28 warnings 0 errors, `tsc` clean, `design:check` 33 files
  clean, `npm test` 17/17, and `npm run build` exits 0 (PWA precache 16 entries).
- **Not merged to `main`.** `main` deploys, so the merge is Charles's call and waits on his gates
  below. `main` is `8b2ca89` locally (the 5 September ops-review tree committed 10 September, not
  pushed); live is `62cdf04` (last green Deploy, 5 September).
- Only **BYO** (bring your own sailing) is unbuilt, and it is gated on two Charles rulings (below).
  A short **polish pass** for three follow-ups is also queued (below).

## The four passes, for the record

- Phase 1 specs (run `wf_59cea1ba-a91`): five specs in `docs/specs/2026-09-10-*.md`.
- Pass A (`wf_a90270f3-7d1`): six commits `b42483a`..`7414857`, review pass.
- Pass C (`wf_d78557ca-8a2`): fourteen commits `dd1a9fa`..`9ff1563` then four fixes to `39676d1`;
  review caught two blockers (an em dash in a `sync.ts` comment, `mergeCustom` keeping duplicate
  ids). Not exercisable here: Google, `linkIdentity`, the `fresh` path, a genuinely missing backup.
- Pass B (`wf_ad2def83-9b8`): fifteen commits `41f724e`..`3cc7f0f` then two docs fixes to `a6e0e17`;
  review caught a false height figure in the DESIGN.md Entry section.
- Pass E: build (`wf_2a3dddfc-aa1`) landed eleven commits `56893b8`..`6fcdcdd` but the workflow died
  on the Fable monthly spend cap before the builder returned, so it shipped unreviewed with one lint
  regression. Review and fix ran separately (`wf_fade852e-771`): the fixer's `ce1d64d` moved
  `isDesktopVisitor` to `model.ts`, lint back to 28. The reviewer confirmed every routing probe and
  gate case (phone `/get` not-entered goes to Entry, both trailing-slash directions, `/add` reaches
  AddRoute). Do not resume `wf_2a3dddfc-aa1`: its build agent is cached as an error, so a resume
  re-runs the build over commits that already exist.
- Attribution oddity, on record, not worth a history rewrite: pass E's eleven build commits carry
  "Co-Authored-By: Claude Opus 5 (1M context)" (a non-existent model) plus a Fable line; C's four fix
  commits carry Opus 5 too. Cannot fix without amend/rebase (forbidden). Cosmetic in unpushed history.

## Open threads

### Charles's gates and rulings (nothing below is blocked on me)

- **Push `main`.** `8b2ca89` carries the `?seed` guard; until it deploys a shared seed link can still
  wipe a real user on the live site. His yes.
- **Dashboard gates for sign-in** (C is built to fail honestly until these are done): Supabase Google
  provider ON, Allow manual linking ON, a Google Cloud OAuth client with the Supabase callback URL,
  Site URL `https://cruise.charlesbee.org` and the four redirect URLs in `supabase/config.toml`.
  `docs/BACKEND_SETUP.md` steps 2 and 4 are the same list.
- **Spec rulings, each built to a stated default so none blocked the build:** C: what a "fresh"
  sign-in erases (default: the guest's own profile, passport and backup rows, memberships left), and
  whether a lost `sessionStorage` trigger gets a manual restore (default: no). B: the privacy contact
  address (`PRIVACY_CONTACT`, empty so its two sentences do not render), retention wording, whether a
  dated consent record is wanted, and whether being added by a friend should need acceptance
  (`befriend` writes both edges today). E: the price sentence (`PRICE_LINE` null), whether a desktop
  visitor may open the passport in the browser (default: yes, one quiet action), generalising the
  `index.html` titles off "Sun Princess".
- **BYO rulings, which gate the last workstream:** ship without a way to hand a sailing to a friend or
  hold until sharing exists ("hold" means BYO does not start); and package tiers on a user sailing
  (default: none, so the Plus/Premier segment disappears there). Spec: `docs/specs/2026-09-10-byo-own-sailing.md`.
- **Roll the Cloudflare API token** (pasted in chat 1 September, still the stored secret; rotation
  register in `project-management/README.md`).

### Follow-ups for the polish pass (small; two need a yes because they change semantics)

1. **Erasure does not stop the upload.** After Delete my data, if sync is live the next round trip
   mints a fresh anonymous user and republishes the same passport and name (`deleteMyData` signs out,
   `resetSocialIdentity` keeps the name, `ensureSession` makes a new user). Coherent fix now that
   consent exists: erasure also clears `enteredCruise`, so the entry screen asks again before anything
   publishes, and the privacy note's Deleting it paragraph says so. Charles's yes (changes what the
   control means). Documented in `CLAUDE.md` Seed as the QA trap it also causes.
2. The disabled "Keep it with Google" in the offline state looks identical to the enabled one
   (`:disabled` falls to the plain surface the plain button already has). One rule in `base.css`.
3. A stacked sheet exactly covers the one beneath (both cap at 88svh). If the layering should read,
   inset or scale the covered pane in `src/ui/Sheet.tsx` (workstream A's file).

### Anonymous QA users to purge from the Supabase dashboard (all 10 September, profile name Alex, zero edges/memberships)

- Sellability shots (~11:00): two, codes not recorded.
- Pass C: builder QR9Y-NYC3 (12:43), QAZ9-2TPD (12:46); reviewer HCBC-6FT7, PZQ5-W9FN and one
  uncaptured (~13:03 to 13:07); fixer 3QJT-1FC5 (13:20), BDHC-KF9X (13:22).
- Pass B: one uncaptured at ~12:48:44 (NOT deleted, minted by the republish seam in follow-up 1).
- Deleted-profile auth rows still present, find by uid: `d7ffee51`, `f07921a5`, `4cf630c9`.
- Never blanket-purge; real users have existed since 3 September.

## Next action

BYO is in flight (below). After it: the polish pass for the three follow-ups, then Charles reviews
and merges `product` to `main` (a production deploy, his yes only).

### In flight: BYO (bring your own sailing), launched 17 September from `45da690`

Charles said "complete anything remaining", so the four open BYO questions are taken on the spec's
stated defaults, all reversible on the branch: ship it solo (no way to hand a sailing to a friend yet;
the sailing sheet says so), a user sailing declares no package tiers, the "Set up your own sailing"
row is shown to everyone, the champion badge takes the sailing's ship name. Harness: reconcile (one
agent maps the spec's stale anchors against the shipped A/C/B/E code into
`docs/specs/2026-09-17-byo-reconcile.md`) -> build steps 1 to 8 (data layer and tests, with the
regression before-sweep first) -> build steps 9 to 19 (screens, fixtures, docs, the after-sweep) ->
refute-by-default review -> fix. No live-backend action anywhere in it. Run `wf_dc035ce5-972`. Resume:
`Workflow({ scriptPath: "C:\Users\Charles\.claude\projects\E--claude-projects-cruise-passport\10468e48-0258-48b8-84c7-deaaceda11ba\workflows\scripts\cruise-pass-byo-own-sailing-wf_dc035ce5-972.js", resumeFromRunId: "wf_dc035ce5-972" })`.
Journal: `...\E--claude-projects\10468e48-0258-48b8-84c7-deaaceda11ba\subagents\workflows\wf_dc035ce5-972\journal.jsonl`.
A stage that returns nothing or says stop ends the run with a note; read the journal before resuming.

## Gotchas

- `tools/qa/shot.mjs` always appends `?seed` and hits `SHOT_BASE`; against live it signs in an
  anonymous user per run. For a live look use `tools/qa/cold.mjs`; offline, `tools/qa/offline.mjs`;
  the update reload, `tools/qa/update.mjs`; the first-open sync gate, `tools/qa/first-open.mjs`.
- Delete my data on a QA run must be on a `?nosync` page, or the erased user is replaced by an
  unreachable one (follow-up 1; `CLAUDE.md` Seed).
- The Claude-in-Chrome automation tab freezes `requestAnimationFrame` and force-darkens the page.
- Node on Windows needs `file:///E:/...` for an absolute ESM import; QA scripts import `./cdp.mjs`.
- Never two workflow writers on one file; never a second dev server on 5173.
- Every workflow here passes `model: "opus"` explicitly. The 10 September cap was Fable's monthly
  limit; keep every pass resumable in case an account wall fires again.
