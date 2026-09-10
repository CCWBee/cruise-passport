# Sign-in and restore

Workstream C of `docs/specs/2026-09-10-product-brief.md`. Read the brief, `docs/DESIGN.md` and
`docs/DESIGN-AUDIT.md` before implementing. Branch `product`; one commit per numbered step.

## Purpose

A guest who clears their browser or changes phone loses the passport and the friend code with it, and
nothing in the app says so. This adds an optional Google sign-in in the Profile sheet, a line that
states plainly what a guest stands to lose, and a defined merge that brings the passport back from
the `backups` row the app has been writing since 3 September but has never read. Guest stays the
default: nothing here asks anyone to sign in before they can log a drink.

## What exists

Every line number below was opened and checked against the working tree at `83e16e7` on 10 September
2026. Where the file has moved by the time this is implemented, the anchor is the quoted code, not
the number.

### `src/state/backend.ts` (lines 1 to 200, read in full)

The Supabase adapter. The contract is in its header (1 to 7) and it binds everything below: nothing
throws, writes report `false`, and a feed reports `null` for "the call did not answer" rather than
`[]`, because "you have nobody" is a different answer and the caller must not act on the wrong one.

- 22: `hasBackend()` is the build-time flag (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set),
  never connectivity.
- 26 to 33: `sb()` swallows a failed dynamic import so a stale chunk cannot break the never-throws
  contract. Every call goes through it.
- 36 to 48: `ensureSession()` returns the current user id, **creating an anonymous session if there
  is none**. This is what makes a guest a row owner under RLS, and it is why no function on the
  restore path may call it: a restore must never mint a user (see step 4).
- 52 to 74: `upsertProfile`, `publishPassport`, `publishBackup`. `publishBackup` writes
  `{ me, custom, profile }` (see `sync.ts` 67) and is the row this workstream finally reads back.
- 87 to 96 (`findProfiles`) and 119 to 132 (the feeds): the `null`-not-`[]` pattern to copy.
- 167 to 174 (`joinGroup`): the three-way return (`value | 'invalid' | null`) to copy for
  `fetchBackup` and `fetchProfile`.
- 193 to 200: `deleteMyData()` runs the erasure RPC and then signs the session out inline, so the
  next sync starts as a fresh user rather than republishing under the identity just erased. It is the
  GDPR path and this workstream does not reuse it for anything else (see step 6).

### `git show 037be89:src/state/backend.ts` (the adapter to recover, read in full)

Removed in 7d4e3c6. It carries, verbatim, the four functions this workstream needs:
`currentUserId()`, `isAnonymous()` (a user with no email and no identities),
`signInWithGoogle(redirectTo)` (`linkIdentity` when the session is anonymous, `signInWithOAuth`
otherwise), `signOut()`, and `fetchBackup(cruiseId)` (`backups` select by `user_id` and `cruise_id`,
`maybeSingle`). Recover them; do not rewrite the bodies. Four adaptations, each forced by the current
contract or by a defect in the recovered code, and each with its reason below:

1. `isAnonymous()` as recovered **returns `false` when there is no session at all**
   (`Boolean(user) && …` with `user` undefined). At launch there is usually no session yet, because
   `booting` runs before the first `ensureSession()`, so a fresh phone would read as signed in and the
   sheet would say "Kept with Google" with no button on the very first open. The test therefore
   becomes three-valued, `sessionKind()`, and `isAnonymous()` is kept as a one-line wrapper over it so
   there is one place the question is answered (step 3).
2. `fetchBackup` gains a third return value, `'none'`, because "there is no backup" and "the call did
   not answer" lead to opposite actions (step 4).
3. `fetchBackup` (and the new `fetchProfile`) resolve the user through `currentUserId()`, not
   `ensureSession()`, because `ensureSession()` mints an anonymous user and the restore path must
   never do that (step 4).
4. `signInWithGoogle` gains a mode and returns a result instead of swallowing the error, because the
   sheet has to say "sign-in is not available yet" rather than appear to do nothing (step 6).

### `src/state/sync.ts` (lines 1 to 191, read in full)

- 16 to 19: `SyncStatus` and `useSyncStore`, the store the Profile sheet already reads.
- 29 to 33: `mode()`. `?nosync` forces `off`, which is what keeps a headless QA run off the backend.
  Everything this workstream adds to the launch path is gated on `mode()` for the same reason.
- 43: `holdPending()`. `held` is the app's offline signal: success is a confirmed response, never
  `navigator.onLine`.
- 57 to 69: `publishBackend()`. Line 67 is the backup write, best-effort and unawaited.
- 96 to 119: `pullBackend()`. Line 104 is the `needsEdge` befriend loop, which is how a re-adopted
  code gets its edges rebuilt. Line 111 is the hold-do-not-write-an-empty-roster rule.
- 138 to 151: `runSync()`, publish then pull, `holdPending()` on either failing.
- 153 to 157: `syncNow()` and the `activeSync` single-flight guard.
- 173 to 175: the subscription that marks a sync pending whenever `me` or `profile` changes identity.
- 183 to 191: the startup block. **`pending` is `true` at launch (188), so the first `syncNow()`
  publishes the local passport, backup included, before anything has read the server.** On a new
  phone that would overwrite a good backup with an empty one. Restore has to run first, and this is
  the single most important correctness point in this workstream.

### `src/state/store.ts` (lines 1 to 414, read in full)

- 32 to 80: `State`. 134 to 347: the creator.
- 169 to 174 (`patch`) is the funnel every entry mutation goes through; 193 to 198 `toggleVisit`;
  200 `addCustom`; 215 `setProfile`.
- 204 to 209: `ensureIdentity()` stamps a uuid and a code once, guests included; called at 407 on
  hydrate. This is why a guest already has a code to lose.
- 216 to 224: `upsertFriend` sets `needsEdge: true` on a direct friend, the flag `pullBackend` reads.
- 283 to 336: `applyFeed`, the online merge. Not touched here.
- 338 to 341: `resetSocialIdentity()` comes back as a stranger after an erasure. Restore is the
  opposite operation and must not reuse it.
- 348 to 401: persist. Name `spcc2` (349), version `8` (350), `migrate` (352 to 394), `partialize`
  (396 to 400).

### `src/state/supabase.ts` (lines 1 to 30)

`detectSessionInUrl: true` (20), so the client itself inspects the OAuth callback parameters. The
client is created lazily through a dynamic import, but `sync.ts` runs at launch, so it is created at
launch whenever a backend is configured. No `flowType` is set, so the installed default applies; the
three facts that follow are what make the `'linked'` state below possible, and they were read out of
`node_modules/@supabase/auth-js/dist/module/GoTrueClient.js` at version 2.112.4:

- The default is `flowType: 'implicit'` (line 21 of that file), so a provider error comes back in the
  **fragment**, not the query. `readOAuthError` reads both anyway (PKCE would put it in the query),
  so no `flowType` change is needed and none is made.
- On a URL login failure the client **keeps the existing session**. `_initialize` (around 397 to 410)
  returns the error and its own comment says so: "Don't remove existing session on URL login failure.
  A failed attempt (e.g. reused magic link) shouldn't invalidate a valid session." It also names
  `identity_already_exists` explicitly. This is load-bearing: the anonymous session survives a
  refused `linkIdentity`, so the `'linked'` state can still act as that user.
- On the error path `_getSessionFromURL` throws at its first check (around 3244) and never reaches
  the hash-clearing branch, so **the error parameters are left in the URL**. Cleaning them is ours to
  do, and the error is never surfaced to the app any other way: `getSession()` awaits
  `initializePromise` and ignores its error.

### `src/features/friends/ProfileSheet.tsx` (lines 1 to 91, read in full)

Title and meta (36 to 37), name field (39 to 48), colour picker (50 to 65), code (67 to 72), the
sync line (18 to 22 and 74), and the delete-my-data block gated on `hasBackend()` (76 to 87). The
header comment at 9 to 10 ("Nothing here is an account; there is nothing to log in to") stops being
true and is rewritten in step 10.

### `src/features/friends/friends.css` (lines 1 to 199, read in full)

The block rhythm this workstream needs **already exists here and is generic**, so nothing new is
minted for it:

- 45: `.friends-block { margin-top: var(--s5) }`, the 24 above a group inside a crew sheet.
- 46: `.friends-action { margin-top: var(--s4) }`, the 16 from a group's content to its full-width
  button.
- 47: `.friends-status { margin-top: var(--s3) }`, the status line.
- 50 to 59: `.friends-quiet`, the folded-away text action, used at `AddCrewSheet.tsx` 289.
- 62: `.friends-danger { margin-top: var(--s6) }`, the 32 that keeps a two-tap confirm at the foot.
- 123: `.addme-hint { margin-top: var(--s2) }`, the 8 from a button to the line that qualifies it. It
  is the only member of that family named for one sheet, and step 9 renames it.

`AddCrewSheet.tsx` 255 to 268 is the worked example of the whole pattern: a `.friends-block` holding
its content, then `btn btn-wide friends-action`.

### `src/features/friends/ConfirmButton.tsx` (lines 1 to 40)

The two-tap confirm. `label`, `confirmLabel`, `note` (rendered at 37 as `p.muted.t-body.confirm-note`
with `role="status"` only while armed), `className` defaulting to `btn btn-wide`, and a 6-second
self-disarm. Reused unchanged for the one destructive path this workstream adds.

### `supabase/config.toml` (lines 1 to 11)

`site_url` still points at the retired GitHub Pages address (4) and the redirect list carries it
twice (7 and 8). `enable_anonymous_sign_ins = true` (11) is already right.

### `supabase/migrations/0001_init.sql` (lines 1 to 221)

`backups` (37 to 43, primary key `user_id, cruise_id`), the own-row RLS policy that already allows
the owner to read it back (85), `profiles` with `code` unique (23) and its own-row policy (83), and
`delete_my_data()` (200 to 213). Every own-row policy is `for all`, so the owner may `delete` its own
rows from the client with no RPC, which is what step 6 uses. Note what `delete_my_data()` does at
207: it deletes **groups this user owns**, and `memberships.group_id` cascades (64), so running it
destroys a group for every other member. That is right for a GDPR erasure and wrong for a sign-in,
which is why step 6 does not use it. No new migration.

### `docs/BACKEND_SETUP.md` (lines 1 to 64)

Charles's dashboard steps, already written: anonymous on (17), Google on (18 to 19), **allow manual
linking** on (20 to 22, the toggle `linkIdentity` depends on), the URL configuration (23 to 27) and
the Google Cloud client (36 to 43). Step 12 below reconciles the URLs in it with `config.toml`.

### `package.json` (lines 1 to 38) and `tsconfig.app.json`

No `test` script and no test runner. `"type": "module"` is set (5), which `node --test` requires for
a `.ts` file. `@types/node` is already a devDependency (28). Node here is v22.18.0, which strips
TypeScript types natively and has `node:test` built in, so a test file needs no new dependency at all
(verified by running it, see Verification). `tsconfig.app.json` sets `"types": ["vite/client"]`,
`"allowImportingTsExtensions": true`, `"verbatimModuleSyntax": true`, `"erasableSyntaxOnly": true`
and `"include": ["src"]`. Those five decide the shape of the test file: the `types` list is why it
needs a `node` reference, `allowImportingTsExtensions` is why it may import `./restore.ts` with the
extension (which Node **requires**), `erasableSyntaxOnly` is why the source is already strippable,
and `include` is why `tsc -p tsconfig.app.json --noEmit` and `npm run build` typecheck the test file
along with everything else.

### `index.html` (the `?seed` guard, 37 to 55)

The block opens at 42 and 51 to 54 is the touched predicate: entries, visits, **friends**, groups,
custom drinks or a profile name. `isUntouched` in this workstream is a different question and the
difference is written out under Data and state.

### Other files read for form, not edited by this workstream

`src/app/App.tsx` (BrowserRouter with `basename={import.meta.env.BASE_URL}`; Crew is `/social` at
175; `AddRoute` reads `window.location.hash` for `SPP…` at 45, which the OAuth error stripper must
never touch; `InviteScreen` at 31 to 40 is a `p.t-body` line),
`src/features/social/Social.tsx` (the profile control at 114 to 126, `aria-label="Your details"` at
119, the screenshot's selector; the one coral control on Crew is `social-add` at 131),
`src/features/friends/AddCrewSheet.tsx` (169: the in-sheet heading form
`<div className="section-head"><h3 className="t-h2">Find them</h3></div>`; 222: `className="btn
btn-wide addme-send"`; 225: the `.addme-hint` line; 289: the `.friends-quiet` text action),
`src/styles/base.css` (82 to 83 `.section-head`, 166 to 178 the button set, 178 `.btn:disabled`
falling to the plain surface), `src/styles/tokens.css` (95: `--s2: 8px`, `--s4: 16px`, `--s5: 24px`),
`src/state/share.ts` and `src/state/stats.ts` (the `Entry`, `VenueVisit`, `Passport`, `Profile` and
`SharePayload` shapes), `tools/qa/shot.mjs` (33: the seed parameter is appended with `&` when the
route already has a query, so a `?qa=` route works; 40: `--after <ms>` is real though the usage line
does not list it) and `tools/qa/scan.mjs`.

## Design placement

Everything that renders is inside the **Profile sheet**, opened from Crew. `DESIGN.md` Screens →
Crew makes the profile control module 1, at the right of "Your crew"; the sheet behind it is where
identity and the one way out already live, and the brief puts sign-in, restore status and the
honesty line there.

Rank order inside the sheet, after this change:

1. Title "Your details" and its meta line (unchanged).
2. Your name.
3. Your colour.
4. Your code.
5. **Keep your passport** (new).
6. The sync and restore line (the existing `.friends-status`, extended).
7. Delete my data (unchanged, stays last).

"Keep your passport" sits at 5 and not higher: the sheet's five-second read is "who am I to the
crew", so identity keeps the top. It sits above the sync line because "will I lose this" outranks "is
the crew up to date", and directly above it because the two are the same subject and the restore
result is reported on that line.

The sheet's meta line at 37 ("The name and colour your crew sees on everything you share.") is left
alone. It describes modules 2 to 4, which are still what the sheet is for; a meta line that also
tried to introduce sign-in would be two sentences, and `DESIGN.md` Sheets allows one.

Form, composed from siblings, nothing minted except where the table says so:

| Element | Primitive | Sibling it copies |
| --- | --- | --- |
| The block wrapper | `div.friends-block` | `AddCrewSheet.tsx` 255, "Join a group" |
| The heading | `.section-head` with `h3.t-h2` | `AddCrewSheet.tsx` 169, "Find them" |
| The honesty line | `p.t-body` | `ConfirmButton.tsx` 37 and `App.tsx` 35 |
| The action | `button.btn.btn-wide.friends-action` | `AddCrewSheet.tsx` 268, "Join group" |
| The line under it | `p.t-meta.friends-hint` | `AddCrewSheet.tsx` 225, renamed in step 9 |
| The status line | `p.t-meta.friends-status` with `role="status"` | `ProfileSheet.tsx` 74 |
| The one destructive path | `ConfirmButton` | `ProfileSheet.tsx` 78, delete-my-data |
| The way out of it | `button.friends-quiet` | `AddCrewSheet.tsx` 289, "Paste a code instead" |

Colours: no new colour and no state colour. The button is a plain `.btn`, not `.btn-coral`. Reason:
sign-in is optional and guest-first, and Crew has already spent its one filled accent on "Add to your
crew" (`Social.tsx` 131). (Charles's call to overrule; see Open questions.) The four banned tells: no
eyebrow pill and no dot (the heading is a plain `h3.t-h2`), no rule along the heading or the block,
no emoji (no icon at all here, the word is enough), and no new box (the block sits flat on the sheet,
no `.panel`).

**CSS: one rule added, one renamed, none duplicated.** The first draft of this spec minted
`.keep { margin-top: var(--s5) }` and `.keep-hint { margin-top: var(--s2) }`. `.keep` is
byte-for-byte `.friends-block` (friends.css 45) and the button margin is `.friends-action` (46), so
that draft was minting a second copy of an existing primitive, which is the failure `DESIGN.md`
"Working on this design" step 4 exists to prevent. What is genuinely missing is a generically named
8-above hint line: the only one in the file is `.addme-hint` (123), named for the add sheet. So:

```css
/* the line that qualifies the button above it, 8 above so it reads as part of that control rather
   than as the next group. Renamed from .addme-hint: it is the fourth member of the generic
   .friends-block / .friends-action / .friends-status family and two sheets now use it. */
.friends-hint { margin-top: var(--s2); }
```

replaces `.addme-hint` in `friends.css`, and the one existing use (`AddCrewSheet.tsx` 225) is swept
to the new name in the same commit. Net: the stylesheet gains no rules and loses a sheet-specific
name. Do not add `.keep` or `.keep-hint`.

## Behaviour

`account` and `restore` below are the two new fields on `useSyncStore` (see Data and state). All
copy is verbatim. Which line each `restore` value lands on:

| `restore` | Where it shows |
| --- | --- |
| `'unavailable'`, `'failed-signin'` | replaces the hint line under the button |
| `'linked'` | replaces the whole block (heading, line, confirm) |
| `'working'`, `'done'`, `'empty'`, `'failed'` | the status line at rank 6 |
| `'idle'` | nothing; the status line falls back to the sync line |

### The block does not render at all

When `account === 'off'`, which is `!hasBackend()`: an offline build has nothing to sign in to. Same
gate the delete-my-data block already uses.

### First-time, guest, online (`account: 'guest'`, `restore: 'idle'`)

```
Keep your passport
This passport is on this phone only. Clear your browser or change phone and it is gone, your
friend code with it.
[ Keep it with Google ]
Sign in and your passport comes back on any phone. We use Google only to know it is you.
```

Tapping the button: write the chosen mode into `sessionStorage` under `spcc-signin`, then call
`startSignIn()`. The browser leaves for Google. Nothing else on the sheet changes, because the page
is going away.

### Guest, offline (`account: 'guest'` and `useSyncStore.status === 'held'`)

Same block, the button `disabled`, and the last line replaced by:

```
You are offline. Sign in when you are back.
```

`held` is the app's offline signal (`sync.ts` 43): success is a confirmed response, never
`navigator.onLine`. `.btn:disabled` already falls to the plain surface (`base.css` 178).

### The provider is not switched on (`restore: 'unavailable'`)

Set when `startSignIn()` returns `'unavailable'`: `signInWithOAuth` and `linkIdentity` both return an
error and do not redirect when the provider is off or manual linking is off. The last line becomes,
and the button stays enabled so a later attempt costs one tap:

```
Sign-in is not available yet. Your passport stays on this phone.
```

### Sign-in failed for any other reason (`restore: 'failed-signin'`)

```
That did not work. Try again in a moment.
```

Reached three ways: `startSignIn()` returned `'failed'`; the pre-sign-in row discard in `'fresh'`
mode failed, so nothing was attempted; or the return leg found `spcc-signin` set, no OAuth error in
the URL and still no signed-in session, which is the cancelled-at-Google case.

### Returning, signed in (`account: 'saved'`)

```
Keep your passport
Kept with Google. Sign in on any phone and this passport comes back.
```

No button. There is no sign-out control (Out of scope, with the reason).

### The restore line

Rendered on the existing `.friends-status` line, which already carries the sync state. Restore wins
the line while it has something to say, because it is the answer to the tap the guest just made; the
sync line returns when `restore` falls back to `'idle'`.

| `restore` | Line |
| --- | --- |
| `'working'` | `Bringing your passport back…` |
| `'done'`, `restored > 1` | `Brought back 58 drinks.` (the number is `restored`) |
| `'done'`, `restored === 1` | `Brought back 1 drink.` |
| `'done'`, `restored === 0` | `Your passport is already up to date.` |
| `'empty'` | `Nothing to bring back yet. From now on this passport is kept.` |
| `'failed'` | `Could not reach your backup. It will try again.` |

`restored` counts drinks, not entries: an entry that is `tried` in the merged passport and was not
`tried` locally. An entry that carries only a wishlist flag or a note is not a drink anybody had, so
counting it would make "Brought back 58 drinks" untrue.

`'done'` clears itself to `'idle'` after 8 seconds (one `setTimeout`, set where `'done'` is set, so
it does not depend on the sheet being mounted), so opening the sheet an hour later does not report a
restore as if it had just happened. `'failed'` does not clear: it is still true.

### The Google account already keeps a passport (`restore: 'linked'`)

The one state that needs a decision from the guest. It is reached on the return leg: `linkIdentity`
cannot know in advance, and Supabase redirects back with an error whose `error_code` is
`identity_already_exists`. The anonymous session is still live at that point (see `supabase.ts`
above, the auth-js comment), so the app can still act as that user. The block becomes:

```
Keep your passport
This Google account already keeps a passport. Bringing it back joins it with the one on this
phone, so no drink is lost.
[ Bring that one back ]   (first tap)
[ Tap again to continue ] (armed)
Your code changes to the one that account already uses, and any group you joined on this phone is
left behind.
```

The copy says "joins" and not "replaces" because that is what the code does: `mergeRestore` with
`untouched: false` is a union and never drops a drink logged on either side. The note names the two
things that genuinely go and nothing else. It does **not** say "your crew will have to add you
again", which the first draft claimed and which is false: `applyRestore` flags every direct friend
`needsEdge`, so the next pull re-befriends them under the new code (`sync.ts` 104; `befriend` writes
both edges), and they simply see the guest under a different code. Groups are the real loss, because
the guest's membership rows belong to the account being left behind.

`ConfirmButton` with `label="Bring that one back"`, `confirmLabel="Tap again to continue"` and
`note="Your code changes to the one that account already uses, and any group you joined on this
phone is left behind."`. Confirming runs `startSignIn('fresh')`. Below the confirm, the way out
stays available:

```
Or keep using this phone's passport as a guest.
```

as a `.friends-quiet` text action (the sibling is the folded-away paste path in `AddCrewSheet`, 289),
which sets `restore` back to `'idle'` and leaves everything alone.

`'linked'` is session state and is not persisted. A reload before the guest decides loses it, because
the URL was cleaned when it was read; the block simply returns to its first-time shape and one more
tap reaches the same place. That is the intended behaviour, not a gap to close with storage.

### On launch, signed in, local passport untouched

No tap, no visible state until it has an answer. `restore` goes `'working'` then `'done'` or
`'empty'` or `'failed'`. The visible result is the passport itself: the Home hero reads the restored
percentage, so the tick stays silent (`DESIGN.md` States: actions whose result is already visible are
not confirmed again).

### On launch, signed in, local passport in use

Nothing happens. The launch restore does not run, because merging without being asked, on a phone
already in use, is not a decision the app makes for the guest. It runs on the next explicit sign-in.

### On the return leg after a successful sign-in

`sessionStorage` holds `spcc-signin`, so restore runs even though the local passport is in use: the
guest asked for exactly this. The redirect lands on the app root, not on Crew, so the sheet is not
reopened; the result is on Home, and the line is there when they next open the sheet.

## Data and state

### `src/state/restore.ts` (new, pure, tested)

Only `import type` declarations, never an inline `type` modifier inside a value import. Reason, and
it is load-bearing: Node erases a whole `import type` statement, but `import { type X }` leaves a
side-effect import behind, and `data/model.ts` (7: `activeCruise().data`) and anything reaching it
read `location` at module level and throw under `node --test`. This file therefore imports no runtime
value from anywhere in `src`. Verified by running it, not reasoned: a test importing a type from a
module whose body reads `location` passes under Node v22.18.0.

```ts
export interface BackupState { me: Passport; custom: Drink[]; profile: Profile }
export interface RestoreOpts { untouched: boolean; canonicalCode?: string }
export interface RestoreResult { me: Passport; custom: Drink[]; profile: Profile; adopted: number; codeChanged: boolean }

export function isUntouched(s: { me: Passport; custom: unknown[]; friends: unknown[]; groups: unknown[] }): boolean
export function readBackup(raw: unknown): BackupState | null
export function mergeEntry(local: Entry, remote: Entry): Entry
export function mergeEntries(local: Record<string, Entry>, remote: Record<string, Entry>): Record<string, Entry>
export function mergeVisits(local: Record<string, VenueVisit>, remote: Record<string, VenueVisit>): Record<string, VenueVisit>
export function mergeCustom(local: Drink[], remote: Drink[]): Drink[]
export function mergeProfile(local: Profile, remote: Profile, canonicalCode?: string): Profile
export function mergeRestore(local: BackupState, remote: BackupState, opts: RestoreOpts): RestoreResult
export function readOAuthError(hash: string, search: string): { code: string; description: string } | null
```

The rules, each with the reason that goes in the comment:

- **`isUntouched`**: no entries, no visits, no custom drinks, no friends, no groups. It deliberately
  differs from the `?seed` guard in `index.html` (51 to 54), which counts the same five **plus a
  profile name**. A name must not count here, because workstream B asks for one on first open and
  every restore would then be blocked on a phone that has done nothing but say who its owner is.
  Friends count in both, and for the same reason: a phone with a crew and no drinks is in use.
- **`readBackup`**: the row is untrusted JSON that may have been written by an older build. The
  store's own migrate chain shows what that means in practice: migration 6 (`store.ts` 367 to 375)
  strips `profile.groupCode` and `profile.syncUrl` from a persisted profile, and a backup written
  before it can still carry them. Rebuild it field by field, drop anything unrecognised, and return
  `null` unless the value is an object whose `me.entries` and `me.visits` are both objects. A
  malformed backup is treated as no backup, which the caller reports as `'empty'`.
- **`mergeEntry`**: the winner is the side whose `date` sorts later; an entry with a `date` beats one
  without; two entries with the same `date`, or neither with one, tie to local. Then the union: every
  field the winner defines wins, every field only the loser defines is kept, including `notes` and
  `comment`. The passport has no per-edit clock, so the day the drink was logged is the only honest
  recency the data carries, and ties go to the phone in the guest's hand. The union is what makes the
  merge safe: a drink logged on either phone is never dropped and a `tried` is never untried.
- **`mergeEntries`**: ids on one side only are taken as they are; ids on both go through `mergeEntry`.
- **`mergeVisits`**: `visited` is true if either says so; the date is the earlier of the two, or
  whichever side has one when the other does not, because a visit date is when you first went.
- **`mergeCustom`**: union by `id`, local first, a remote drink appended only when its id is absent.
- **`mergeProfile`**: `name` is local when it is non-empty after trimming, else the backup's.
  `colour` follows `name`: adopted from the backup only when the local name is empty, since a guest
  who has chosen a colour has chosen it. `id` is adopted from the backup whenever the backup has a
  non-empty one. `code` is `canonicalCode` when the caller supplies one, else the backup's, else
  local.
- **`mergeRestore`** with `untouched: true` takes the backup wholesale (still through
  `mergeProfile`, so `canonicalCode` still wins). `adopted` counts entry ids in the result whose
  `tried` is true and which were not `tried` in `local.me.entries`. `codeChanged` is
  `result.profile.code !== local.profile.code`.
- **`readOAuthError`** parses hash (with any leading `#`) and search (with any leading `?`) as
  `URLSearchParams` and returns the first of `error_code` or `error` with its `error_description`.
  PKCE puts the error in the query, the implicit flow in the fragment, and the installed client
  defaults to implicit, so both are read and neither is assumed. A fragment that is a share code has
  no `error` key, so `/add#SPP…` returns `null` and is never touched.

### Why the code is adopted whenever there is a backup, and not only when local is untouched

The brief's wording is "adopt the canonical friend code from the backup when local is untouched".
Traced against the schema that is unsafe on the path restore exists for, so this spec adopts it
whenever the server has one, and the brief's condition survives only as the `untouched` shortcut in
`mergeRestore`. The trace:

A new phone creates anonymous user A2 at launch and, because `pending` is true at startup,
`upsertProfile` writes A2 a `profiles` row with this phone's fresh code C2. The guest signs in. Their
real account is A1, whose `profiles` row holds C1, and every friend's `friends.friend_code` row points
at C1. If the local passport had been used and kept C2, the next `upsertProfile(A1, C2)` hits
`profiles.code unique` (line 23 of the migration), which A2's row owns, and every sync fails from
then on. Remove A2's row and it is worse, not better: A1's code is renamed to C2 and every friend
edge pointing at C1 is orphaned. So the canonical code is read from the server for the signed-in user
(`fetchProfile()`, own-row RLS, no new migration) and adopted; every local direct friend is then
flagged `needsEdge` so the next pull re-befriends them under C1 (`sync.ts` 104, and `befriend` is
idempotent). Adopting C1 never collides: `upsertProfile` conflicts on `user_id`, which is A1's own
primary key, so it updates A1's row in place. On the same-device upgrade through `linkIdentity` the
user id never changes, so the code never changes and none of this fires.

### `src/state/sync.ts`

`SyncState` (18) gains three fields, all session-only, none persisted:

```ts
interface SyncState {
  status: SyncStatus; lastSyncedAt: number | null; pending: boolean
  account: 'off' | 'guest' | 'saved'
  restore: 'idle' | 'working' | 'done' | 'empty' | 'failed' | 'linked' | 'unavailable' | 'failed-signin'
  restored: number
}
```

Initial `account` is `'off'` when `!hasBackend()`, else `'guest'`: the truthful default for almost
everyone, corrected to `'saved'` by the launch check, which finishes long before the sheet can be
opened, so there is no flash of the wrong line. There is deliberately no `restoreAt` field: the
`'done'` line clears itself on a timer, so nothing needs to store when it happened.

### `src/state/store.ts`

One new action, no new persisted field:

```ts
applyRestore: (r: RestoreResult) => void
```

It sets `me`, `custom` and `profile` in one `set`; when `r.codeChanged` it maps every direct friend
(not `groupOnly`, has a `code`) to `{ ...f, needsEdge: true }`; and it seeds `seenMedals` with every
badge the merged passport already earns, exactly as migration 8 does at 384 to 392 (`computeStats`
and `BADGES` are already imported at 5 and 7). Without that, a restored passport earns a dozen medals
at once and Home shows a coin for each, which is the failure migration 8 exists to prevent. It never
calls `resetSocialIdentity()` (338), which is the opposite operation.

**Persist version: unchanged at 8, no migrate step.** This workstream adds no persisted field, and a
version bump with nothing to migrate is a lie in the chain at 352 to 394. Every existing user's data
is therefore untouched by this workstream: `partialize` (396 to 400) is unchanged, so nothing is
dropped from storage, and `applyRestore` only ever writes fields that already persist. Workstream B
takes 9 for `enteredCruise`; if an implementer here finds a persisted field is genuinely needed, it
takes 9 and B moves to 10.

### Storage keys

| Key | Where | Owner | Note |
| --- | --- | --- | --- |
| `spcc2` | localStorage | `store.ts` 349 | unchanged, version 8, `partialize` unchanged |
| `spcc-cruise` | localStorage | `data/cruises.ts` 41 | unchanged |
| `spcc-signin` | **sessionStorage** | new, `sync.ts` | holds the mode, `'link'` or `'fresh'`, written before the redirect. Read on the return leg; cleared once the restore reaches any state but `'failed'`, so a failed attempt is retried by the backoff rather than forgotten. Session, not local, so a tab that never came back does not force a restore next week |
| `sb-<ref>-auth-token` | localStorage | supabase-js | not ours; never read or written by hand |

Every read and write of `spcc-signin` is wrapped in try/catch, as `cruises.ts` does (44 to 57):
storage can be blocked.

## Backend

- **Tables**: `backups` gains its first reader (select `state, updated_at` where `user_id` and
  `cruise_id`); `profiles` gains a self-read (select `code, name, colour` where `user_id`) and, on
  the `'fresh'` path only, a self-delete of `profiles`, `passports` and `backups`. All are covered by
  the existing own-row `for all` policies at lines 83, 84 and 85 of `0001_init.sql`. No RPC is added.
- **RLS**: unchanged. Nothing here reads or writes another person's row, so no `SECURITY DEFINER`
  function is involved and the "codes bootstrap, edges authorise" rule at lines 9 to 11 of the
  migration is untouched.
- **Migration**: none. No `0004`.
- **`supabase/config.toml`**: rewritten to

```toml
project_id = "cruise-passport"

[auth]
site_url = "https://cruise.charlesbee.org"
# The client sends origin + BASE_URL, which ends in a slash; a trailing-slash mismatch is the
# classic Google-redirect failure, so both forms of the live origin are listed.
additional_redirect_urls = [
  "http://localhost:5173/",
  "http://localhost:4173/",
  "https://cruise.charlesbee.org/",
  "https://cruise.charlesbee.org",
]
enable_anonymous_sign_ins = true
# A guest session upgrades to Google through linkIdentity, which the dashboard calls "Allow manual
# linking". Without it every upgrade fails and the passport starts again under a new user.
enable_manual_linking = true
```

  This file is the record of what the dashboard must hold; the hosted project is configured by hand
  (`docs/BACKEND_SETUP.md`), so changing it here does not change the live project. Those are Charles's
  gates and they are listed under Open questions.

## Implementation steps

Each step is one commit and leaves the app working.

1. **`src/state/restore.ts`**: the pure module. Types, `isUntouched`, `readBackup`, `mergeEntry`,
   `mergeEntries`, `mergeVisits`, `mergeCustom`, `mergeProfile`, `mergeRestore`, `readOAuthError`.
   Type-only imports, as above.
2. **`src/state/restore.test.ts`**: the tests. Two mechanical requirements, both verified by running
   them on this machine: the first line is `/// <reference types="node" />` (the app tsconfig
   restricts `types` to `vite/client`, so without it `tsc` reports `Cannot find module 'node:test'`),
   and the import of the module under test carries the extension, `from './restore.ts'` (Node ESM
   will not resolve `./restore`, and `allowImportingTsExtensions` in the tsconfig is what lets `tsc`
   accept the extension). At least these cases: untouched adopts wholesale; a touched local keeps its
   own entry when the dates tie; the later date wins on a conflicting rating; a dated entry beats an
   undated one; a field only the loser has survives; `tried` is never untried; a visit takes the
   earlier date; custom drinks union by id with local first; a name is taken from the backup only
   when local is empty and colour follows it; `canonicalCode` beats the backup's code; `codeChanged`
   is true when it differs; `adopted` counts only newly-tried drinks and ignores a wishlist-only
   entry; `readBackup` returns `null` for garbage and for a missing `me.visits`, and strips
   `groupCode`; `readOAuthError` finds `identity_already_exists` in the fragment and in the query and
   returns `null` for `#SPPAeyJ2Ijoy…`.
3. **`src/state/backend.ts`**: recover `currentUserId` and `signOut` from 037be89 as they stand. Add

   ```ts
   export type SessionKind = 'none' | 'anonymous' | 'signed-in'
   export async function sessionKind(): Promise<SessionKind>
   ```

   One `getSession()`: no session at all is `'none'`; `user.is_anonymous === true`, or the recovered
   fallback test (no email and no identities), is `'anonymous'`; anything else is `'signed-in'`.
   `isAnonymous()` is kept under its recovered name as `(await sessionKind()) === 'anonymous'`, so
   there is one implementation of the question. The three-valued form is not a refinement: the
   recovered two-valued one calls a phone with no session yet "not anonymous", and the launch check
   runs before the first session exists, so on a fresh phone it would report a guest as signed in.
   Also have `deleteMyData` (193) call the recovered `signOut()` instead of its inline
   `client.auth.signOut()`, so there is one way to end a session.
4. **`src/state/backend.ts`**: `fetchBackup(cruiseId): Promise<{ state: unknown; updatedAt: number } | 'none' | null>`.
   The body is 037be89's, with two changes. `maybeSingle`'s no-row case returns `'none'` and an error
   returns `null`: the distinction is the whole point, because on `'none'` publishing is safe and on
   `null` we must not write a possibly empty passport over a backup we could not read. And the user
   is resolved with `currentUserId()`, not `ensureSession()`, returning `null` when there is none:
   `ensureSession()` **creates** an anonymous user, and a restore that mints a user would both defeat
   `?nosync` and read an empty row for a stranger. Copy the comment style of `joinGroup` (165 to 166).
5. **`src/state/backend.ts`**: `fetchProfile(): Promise<{ code: string; name: string; colour: string } | 'none' | null>`,
   the same three-way return and the same `currentUserId()` rule, selecting the caller's own
   `profiles` row. `code` is the canonical code. `name` and `colour` are read as well because
   `profiles` is global across sailings (brief, line 16): an account whose backup for *this* sailing
   is `'none'` may still have a name from a previous one, and adopting it when the local name is
   empty is the same rule `mergeProfile` already applies.
6. **`src/state/backend.ts`**: the sign-in pair.

   ```ts
   export async function discardGuestRows(): Promise<boolean>
   export async function signInWithGoogle(redirectTo: string, mode: 'link' | 'fresh'): Promise<'redirecting' | 'unavailable' | 'failed'>
   ```

   `discardGuestRows()` deletes this session's own `profiles`, `passports` and `backups` rows through
   the own-row policies (`.from(t).delete().eq('user_id', uid)` with `uid` from `currentUserId()`;
   `false` only when a delete errors). **No session returns `true`, not `false`**: there is nothing to
   discard, `signInWithOAuth` needs no session, and reporting failure would leave a phone that has
   never completed a sync unable to sign in at all. It exists because the identity about to be
   abandoned must not sit frozen in a friend's feed under a code nobody can reach, and it is **not**
   `deleteMyData()`: that RPC also deletes groups this user owns (migration 207) and
   `memberships.group_id` cascades (64), so using it here would destroy a family group for everyone
   in it because one member signed in.

   `signInWithGoogle`: `'link'` calls `linkIdentity`, **except when `sessionKind()` is `'none'`**,
   where there is no identity to link to and `linkIdentity` would simply error; that case calls
   `signInWithOAuth` whatever the mode says. `'fresh'` calls `discardGuestRows()` first and returns
   `'failed'` without redirecting if it reports `false`, because signing into A1 while A2's rows
   survive is the exact ghost `'fresh'` exists to prevent; on success it calls `signInWithOAuth`. It
   does **not** sign out first: keeping the anonymous session means a guest who cancels at Google
   still holds the same user id and code, and the next sync simply republishes the rows just deleted,
   so a cancelled attempt costs a round trip rather than an identity. Map the error to
   `'unavailable'` when `error.code` is `provider_disabled` or `manual_linking_disabled`, or when the
   message matches `/not enabled|unsupported provider|manual linking/i` (the regex is the fallback,
   because `code` is only present on newer GoTrue responses); any other error is `'failed'`; no error
   is `'redirecting'`.

   Also, at module load: `const oauth = readOAuthError(location.hash, location.search)` behind a
   `typeof location !== 'undefined'` guard, exported as `oauthError()`. It must be read at module
   evaluation and nowhere later, and this is safe and necessary in that order: `backend.ts` is fully
   evaluated before anything calls `getSupabase()`, which is a dynamic import, so the URL is still
   intact; and although the installed client leaves an error URL uncleaned (see `supabase.ts` above),
   depending on that is not worth it. When `oauth` is non-null, strip only the OAuth keys
   (`error`, `error_code`, `error_description`, `state`, `provider_token`, `access_token`,
   `refresh_token`, `expires_in`, `expires_at`, `token_type`) from the URL with `history.replaceState`
   and leave every other parameter and any fragment without an `error` key exactly as it was, so
   `/add#SPP…` and `?seed` survive.
7. **`src/state/store.ts`**: the `applyRestore` action, declared in `State` (beside the other social
   actions, around 72) and implemented beside `resetSocialIdentity` (338).
8. **`src/state/sync.ts`**: the store fields, the QA overrides and the launch order.
   - `qaOverrides()` beside `mode()` (29 to 33), reading one query parameter,
     `?qa=account:saved,restore:done,restored:58,sync:held,signedin:1`, comma-separated `key:value`
     pairs, parsed once into a module constant. Two behaviours:
     - `account`, `restore`, `restored` and `sync` are applied to `useSyncStore` at module load and
       are the only values ever written to it: when any of **those four** is present,
       `restoreOnLaunch()`, `markPending()` and `syncNow()` all return immediately, so nothing the
       app does afterwards can overwrite the state being screenshotted. Without that, the first
       `markPending()` after hydration resets `status`, and `sync:held` would never survive to the
       shot. `signedin` is not one of the four and leaves sync running normally.
     - `signedin:1` is the opposite: it makes **both** `restoreOnLaunch()` and `restoreNow()` read
       `sessionKind()` as `'signed-in'`, so the whole restore path runs against the anonymous user's
       own rows. Both, not just the first: `restoreNow()` re-checks the session and would otherwise
       bail on the very run this override exists to produce. It is what makes the launch order
       testable against the real backend with no Google account (see Verification). It is a QA
       override in the same family as `?day=` and `?hour=` in `data/model.ts` and it changes nothing
       for a real session.
   - `restoreOnLaunch()`, in this order, with its **whole body inside one try/catch** that sets
     `restore: 'failed'` and returns on a throw. `booting` must never reject: a rejected `booting`
     would throw out of `await booting` into `holdPending()` on every retry for the rest of the
     session, and `booting.then(() => syncNow())` would never fire at all, so one thrown error in
     `sessionKind()` or a blocked `sessionStorage` would take the whole sync down.
     1. `mode() === 'off'` (no backend configured, or `?nosync`) or any of the four state overrides
        present: return, leaving `account` at its initial value and `restore: 'idle'`. No call is
        made, so a headless run creates no anonymous user, which is the whole point of `?nosync`.
     2. Read and hold `spcc-signin` (do not clear it yet).
     3. If `oauthError()` reports `identity_already_exists` (by `code`, or an `error_description`
        matching `/identity.*already.*(exist|link)/i` as the fallback), set `restore: 'linked'`,
        clear `spcc-signin`, and stop. The anonymous session is still live, which is what the
        `'linked'` confirm then acts on.
     4. `await sessionKind()`. `'none'` and `'anonymous'` both mean `account: 'guest'`: if
        `spcc-signin` was set, this is the cancelled-at-Google case, so set `restore: 'failed-signin'`
        and clear the key; otherwise leave `restore: 'idle'`. Return either way.
     5. `'signed-in'` means `account: 'saved'`. Run `restoreNow()` when the local passport
        `isUntouched()` or `spcc-signin` was set; otherwise return, leaving `restore: 'idle'`.
   - `restoreNow()`: re-check `sessionKind()` first, and on anything but `'signed-in'` set
     `restore: 'idle'` and return, so the retry inside `runSync()` can never shut the publish gate
     for ever on a session that has gone. Then `restore: 'working'`; `fetchProfile()` and
     `fetchBackup(cruiseId)` in parallel. It makes **no sync call of its own** (see the launch order
     below).
     - `null` from either call is `restore: 'failed'`: the publish gate stays shut, because writing a
       possibly empty passport over a backup we could not read is the one unrecoverable thing here.
       `spcc-signin` is left in place so the retry still counts as an asked-for restore.
     - `'none'` from the backup is `restore: 'empty'`, but it still applies the canonical code:
       `applyRestore` with `me` and `custom` unchanged and
       `mergeProfile(local.profile, { …local.profile, name: profileRow.name, colour: profileRow.colour }, canonicalCode)`,
       which adopts the server name and colour only when the local name is empty. An account with
       friends from a previous sailing and no backup on this one is exactly the case where skipping
       the code rename orphans every edge.
     - A row gives `readBackup`, then `mergeRestore`, then `applyRestore`, `restore: 'done'`,
       `restored: result.adopted`, and an 8-second timer back to `'idle'`.
     - On any terminal state but `'failed'`, clear `spcc-signin`.
   - `startSignIn(mode?: 'link' | 'fresh')`: choose `'fresh'` when `isUntouched()` (nothing local to
     preserve, and it skips the `identity_already_exists` round trip that the new-phone case would
     otherwise always take) and `'link'` otherwise; write that mode to `spcc-signin`; set the
     `leaving` flag below; call `signInWithGoogle` with
     `new URL(import.meta.env.BASE_URL, window.location.origin).href` as `redirectTo`; on a
     non-`'redirecting'` result, clear `leaving`, delete `spcc-signin` again and map the result onto
     `restore` (`'unavailable'` or `'failed-signin'`).
   - **`let leaving = false`, a module flag, and `runSync()` returns at once while it is set.** It is
     what stops a sync recreating the rows `'fresh'` has just deleted. Between `discardGuestRows()`
     and the browser actually leaving for Google there is a real window, and three timers can fire
     into it: the 2-second debounce (53), the 60-second visible interval (180) and the backoff (41).
     `pending` is almost always true, so `publishBackend()` would write the profile, passport and
     backup straight back, and A1 would then sign in over a live A2, which is the ghost `'fresh'`
     exists to prevent. The flag is cleared only when the sign-in did not redirect, because a page
     that is leaving has no later state to restore.
   - **The launch order, which is what stops an empty passport overwriting a good backup.** Nothing
     else in this workstream matters as much, and it is easy to write as a deadlock, so it is spelled
     out:
     - Module level: `const booting: Promise<void> = restoreOnLaunch()`. One promise, named, created
       once, and created after `backend.ts` has been evaluated (it is imported at the top), so
       `oauthError()` has already captured the URL.
     - The startup block (187 to 190) becomes `void booting.then(() => syncNow())`, and the QA state
       overrides are written to `useSyncStore` as the **last statement in that block**, after line
       188's `setState({ status: 'idle', pending: true })`, which also runs at module load and would
       otherwise clobber `sync:held` before the shutter.
     - `runSync()` (138) starts with `await booting`. `restoreNow()` calls nothing that leads back to
       `runSync`, so this can never wait on itself. In particular there is no `refreshNow()` inside
       the restore: `applyRestore` changes `profile`, the subscription at 173 to 175 marks the sync
       pending, and the pull that `booting.then` fires brings the crew back under the canonical code.
     - Then, still at the top of `runSync()`: when `restore` is `'failed'`, `await restoreNow()`
       again, and only if it is *still* `'failed'` call `holdPending()` and return without publishing.
       The backoff at 37 to 42 is what re-enters `runSync`, so this is what makes "It will try again"
       true rather than a permanently shut gate.
9. **`src/features/friends/friends.css` and `src/features/friends/AddCrewSheet.tsx`**: rename
   `.addme-hint` to `.friends-hint` with the comment from Design placement, and change the one use at
   `AddCrewSheet.tsx` 225. No other CSS.
10. **`src/features/friends/ProfileSheet.tsx`**: the block. `account`, `restore`, `restored` from
    `useSyncStore`; `div.friends-block` holding the heading, honesty line,
    `button.btn.btn-wide.friends-action` and `p.t-meta.friends-hint` per Behaviour; the
    `ConfirmButton` branch plus its `.friends-quiet` way out for `'linked'`; the restore line folded
    into `syncLine` (18 to 22) so there is still one status line, not two. Rewrite the file header
    (9 to 10) to say what the sheet now holds.
11. **`supabase/config.toml`**: the rewrite above.
12. **Docs**: `CLAUDE.md` Operating notes, replace the three-line "Accounts: there is no sign-in and
    no restore yet" paragraph with what is now true, and add the `?qa=` overrides beside the `?seed`
    and `?nosync` notes. `docs/BACKEND_SETUP.md`, reconcile the redirect list at 25 to 27 with
    `config.toml` (add the trailing-slash forms and the note about why; `http://localhost:4173` is
    already there). Merge into both; never rewrite them.

## Verification

The dev server on 5173 is already running; never start a second. The baseline these are judged
against was measured on `83e16e7` on 10 September 2026, by running each command: `design:check` 31
files clean, `oxlint` 0 errors and 28 warnings, `tsc` no output and exit 0.

```
node --test src/state/restore.test.ts
```

must print `# fail 0` and exit 0. Verified on this machine before writing this spec, by running the
shape rather than assuming it: Node v22.18.0 strips TypeScript natively and runs `node:test`, so this
adds **no devDependency at all**; `import type` from a module that reads `location` at load is fully
erased (the test passes, which it could not if the module were loaded); and the import of the module
under test must carry its `.ts` extension, because extensionless fails with
`ERR_MODULE_NOT_FOUND`. `"type": "module"` in `package.json` is what lets Node treat the file as ESM;
it is already set. Optionally add `"test": "node --test \"src/**/*.test.ts\""` to `package.json`
scripts; the glob form was also run and works on this Node.

```
npx tsc -p tsconfig.app.json --noEmit
```

no output, exit 0. This typechecks the test file too (`include` is `["src"]`), which is why the
`node` reference on line 1 is not optional.

```
npm run lint
```

0 errors. The 28 warnings are known and were counted; a 29th means something new.

```
npm run design:check
```

prints `design:check: 31 files, clean`. The file count does not change: no CSS file is added.

Screenshots, 390×844, against 5173. Every one carries `&nosync` so the run never touches the live
backend and never creates an anonymous user (`CLAUDE.md`, Seed), and every one carries a `?qa=` state
override, which by step 8 makes sync inert so the state being shot cannot be overwritten before the
shutter.

```
node tools/qa/shot.mjs c-profile-guest    "social?qa=account:guest&nosync"                          --click "[aria-label='Your details']" --after 3000
node tools/qa/shot.mjs c-profile-offline  "social?qa=account:guest,sync:held&nosync"                --click "[aria-label='Your details']" --after 3000
node tools/qa/shot.mjs c-profile-gated    "social?qa=account:guest,restore:unavailable&nosync"      --click "[aria-label='Your details']" --after 3000
node tools/qa/shot.mjs c-profile-saved    "social?qa=account:saved&nosync"                          --click "[aria-label='Your details']" --after 3000
node tools/qa/shot.mjs c-profile-restored "social?qa=account:saved,restore:done,restored:58&nosync" --click "[aria-label='Your details']" --after 3000
node tools/qa/shot.mjs c-profile-linked   "social?qa=account:guest,restore:linked&nosync"           --click "[aria-label='Your details']" --after 3000
```

`shot.mjs` appends the seed parameter with `&` when the route already carries a query (33), so these
resolve to `/social?qa=…&nosync&seed`. Each must print `viewport 390 scrollWidth 390` with no
`HORIZONTAL OVERFLOW` and no `console:` line, and each PNG must show, read honestly: the rank order
above, "Keep your passport" as a plain heading with no pill, no dot and no rule, one line of honesty
at body size, one plain full-width button (no coral fill), the status line beneath it, and
delete-my-data still last. `c-profile-linked` must additionally show the armed and unarmed confirm
reachable and the quiet way out beneath it.

**The launch order, exercised for real without a Google account.** This is the one behaviour that
must not be signed off on reasoning, and `?qa=signedin:1` exists so it does not have to be. Against
the live backend, in a normal browser at `http://127.0.0.1:5173`:

1. Load `/?seed` once and wait for the sync to settle, so this phone's anonymous user publishes its
   own `profiles`, `passports` and `backups` rows.
2. In devtools, `sessionStorage.setItem('spcc-signin', 'link')`, then reload as `/?qa=signedin:1`.
   Both halves are needed and each stands for a real condition: `?seed` leaves a **touched**
   passport, so the launch restore runs only on the asked-for-it branch, which is exactly the
   `spcc-signin` key, and `signedin:1` stands in for the Google identity there is no way to have
   here. In the network panel the `backups` **select** must precede the first `backups` upsert, and
   the Profile sheet must read `Your passport is already up to date.` (`restore: 'done'`,
   `restored: 0`, because the backup is this phone's own). That is the full path run against real
   rows: `fetchProfile`, `fetchBackup`, `readBackup`, `mergeRestore`, `applyRestore`, and `runSync`
   waiting on `booting`.
3. Reload as `/` with no override and no session key (step 2 clears it on `'done'`) and confirm there
   is **no** `backups` select at all: a guest never reads a backup.
4. Delete the `backups` row for that user in the dashboard, set `spcc-signin` again, and repeat step
   2: the line must read `Nothing to bring back yet. From now on this passport is kept.` The Supabase
   dashboard only opens in Brave on this machine; if it cannot be reached, skip this one step and say
   in the report that the `'empty'` branch was covered by the unit tests alone.

This creates one anonymous user with profile name Alex and no edges or memberships. Purge it the same
day under the rule in `CLAUDE.md` (Seed); never blanket-purge.

`readOAuthError` and the `'linked'` state are checked by loading
`http://127.0.0.1:5173/?error=server_error&error_code=identity_already_exists&error_description=x`
and then the fragment form,
`http://127.0.0.1:5173/#error=server_error&error_code=identity_already_exists&error_description=x`,
and confirming in both that the block shows the `'linked'` state and that the URL has been cleaned of
the OAuth keys and nothing else. `http://127.0.0.1:5173/add#SPPAeyJ2Ijoy…` must be untouched and
still add the friend.

Google itself, `linkIdentity`, `signInWithOAuth` and the real `identity_already_exists` redirect
cannot be exercised until the gates below are cleared. The `error_code` value and the mapping of
`provider_disabled` and `manual_linking_disabled` are taken from GoTrue's own error codes and from
the installed client's handling of them, not from a run. Say exactly that in the report rather than
implying any of it was tested end to end.

## Files touched

Within the brief's contention map for C (`src/state/backend.ts`, `src/state/sync.ts`,
`src/state/store.ts`, new `src/state/restore.ts`, `src/features/friends/ProfileSheet.tsx`,
`supabase/config.toml`, docs), plus:

- `src/state/restore.test.ts`: new, because the brief says the merge ships "as pure functions with
  tests", and the test file is where those tests live.
- `src/features/friends/friends.css`: one rule renamed, none added, because the block rhythm this
  needs already exists as `.friends-block` and `.friends-action` and only the hint line was named for
  one sheet.
- `src/features/friends/AddCrewSheet.tsx`: **one class name at line 225**, the sweep that `DESIGN.md`
  step 4 requires when a primitive is renamed. It is outside the brief's map for C, so it is called
  out here; no other workstream claims this file (B claims `src/features/cruise/*`, `App.tsx`,
  `Home.tsx`, `store.ts`), so it carries no contention risk. If a reviewer would rather not widen the
  map, the alternative is to leave `.addme-hint` alone and use it from the Profile sheet under its
  add-sheet name; do not add a second rule with the same value.
- `package.json`: one optional line in `scripts`, at the end, so a merge with workstream A's tests is
  trivial.

Not touched: `src/app/App.tsx`, `src/features/social/Social.tsx`, `src/app/Shell.tsx`,
`src/state/supabase.ts`, `src/data/model.ts`, `index.html`, `tsconfig.app.json`, any migration.

## Out of scope

- **Sign out.** Signing out drops to no session, and the next `ensureSession()` mints a fresh
  anonymous user, which republishes the passport under a new identity and orphans every friend edge.
  A safe sign-out needs its own state (forget the passport, or keep it and stay a guest) and its own
  copy. `signOut()` is recovered in the adapter because the brief says recover it, and
  `deleteMyData` uses it; no control surfaces it.
- **The privacy note sheet.** Workstream B mints it and links it from the consent line and from the
  Profile sheet. This workstream leaves the hook to B rather than building a second one.
- **Apple or email sign-in.** Google only, as the brief says.
- **Restoring friends and groups.** The backup holds `{ me, custom, profile }` only. Friends come
  back through the feed once the canonical code is adopted, which is why the code matters more than
  the passport. Groups do not come back at all on the `'fresh'` path, and the confirm's note says so.
  (`seenMedals` is not restored either, but it is not simply ignored: `applyRestore` reseeds it from
  the merged passport, as Data and state sets out.)
- **Cross-cruise restore.** `fetchBackup` is per `cruise_id`; a second sailing restores its own row.
- **Any change to the guest path.** A guest with no session, on a build with no backend, behaves
  exactly as it does today, and with `?nosync` the launch restore makes no call at all.

## Open questions for Charles

1. **The dashboard gates, all yours and all needed before a real sign-in can be tested end to end**:
   Google provider on, **Allow manual linking** on, the Google Cloud OAuth client with the Supabase
   callback URL, and the URL configuration set to Site URL `https://cruise.charlesbee.org` with the
   four redirect URLs in `supabase/config.toml` above, trailing slashes exactly as listed.
   `docs/BACKEND_SETUP.md` steps 2 and 4 are the same list. Until these are done the app is honest
   about it: the button says "Sign-in is not available yet."
2. **The button's weight.** It is specified as a plain `.btn .btn-wide`, not coral, so guest-first is
   what the screen reads and Crew keeps its one filled accent for "Add to your crew". If you want
   sign-in to be findable rather than quiet, it becomes the sheet's one coral control. Taste call,
   one line to change.
3. **The honesty line's bluntness.** "Clear your browser or change phone and it is gone, your friend
   code with it" is deliberately flat. If that reads as a warning notice on a holiday app rather than
   as honesty, say so and it softens.
4. **What the `'fresh'` sign-in erases, and what it leaves.** Specified as: it deletes this phone's
   guest `profiles`, `passports` and `backups` rows, so a half-made identity does not sit frozen in
   someone else's crew list, and it deliberately does **not** run `delete_my_data()`, which would
   also delete any group that guest owns and, through the cascade, remove every other member from it.
   The cost of stopping short is that the abandoned user keeps its membership rows: it stays a
   phantom in the member count of any group it joined, and if it owned a group that group has an
   owner nobody can reach. Both are recoverable by hand in the dashboard, neither loses anyone's
   data. It is still a real deletion of server rows, so the call is yours.
5. **The one dead end left, and the one-line fix if you want it.** The return-leg restore is
   triggered by `spcc-signin` in `sessionStorage`. If that is lost (the callback opens in a different
   tab, or the guest finishes the sign-in hours later from a link), the phone comes back signed in
   with `account: 'saved'`, a passport already in use, and no way to ask for the restore: the block
   has no button in that state. The brief names exactly two triggers and this spec does not add a
   third. If you want it closed, the fix is a `.friends-quiet` text action under the `'saved'` line,
   "Bring my passport back", calling `restoreNow()` directly. One control, one state, one screenshot.
