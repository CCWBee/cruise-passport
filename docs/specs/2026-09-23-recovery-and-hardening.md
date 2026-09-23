# Recovery code and live hardening

23 September 2026, branch `hardening` (worktree `E:\claude-projects\cruise-passport-hardening`), to
merge into `night-bar` before it goes live. Charles: "Sure sounds good and get it pushed plz", in
answer to replacing Google sign-in with an account-free recovery code. The findings behind every
item are in `docs/audits/2026-09-23-live-readiness.md` (the live-readiness audit of the same
morning), with file and line references into `main`.

## Why

Every guest is anonymous: a name, a colour and a friend code on the phone, and an anonymous Supabase
login made on first sync. The server keeps a private backup of each passport, but only a Google
sign-in can read it back, and Google is off. So a lost phone, a Safari wipe (WebKit clears a site's
storage after seven days of Safari use without a visit, unless it is on the home screen), or moving
from a Safari tab to the home-screen app (two separate storages on iOS) loses the passport for good.
Charles judged Google a hassle for guests. A recovery code needs no account and no console work.

## 1. The recovery code

**What the guest sees.** The screens are being rebuilt on `night-bar` at the same time, so **this
branch touches no file under `src/features/` and no file in `src/ui/` or `src/app/`**: it builds
everything under the UI and exports it (a small hook or functions from `src/state/`), and the UI below
is added after the merge, in the night-bar screens. Write the UI's copy into the spec's section as it
stands, so the later pass copies it:

- In Your details, a section "Save your passport": the code, grouped for reading
  (`K7QM-3XPA-9RTC-W2HD-6NBF`), Copy, and Share (the native share sheet, so it goes to Notes or
  Messages), with one line: "Keep this somewhere safe. On a new phone, or in the app on your home
  screen, enter it to bring your passport back." It appears once the phone has synced at least once
  (before that there is nothing on the server to bring back).
- On the entry screen, and in Your details, a quiet action "Bring back a passport", unfolding to one
  field and a button. Success lands on the `Confirm` tick ("Passport back") and the app shows the
  restored passport; a wrong code says "That code does not match a passport." and nothing changes;
  offline says "No connection. Try again with a signal."
- The "Keep it with Google" block is hidden while Google is off (it only ever answered "Sign-in is
  not available yet"). The Google code paths stay in the codebase, unreachable, for later.

**The secret.** 20 characters from Crockford base32 (no I, L, O, U), 100 bits, generated on the phone
with `crypto.getRandomValues`, persisted in the store, shown grouped in fives. It is never sent in the
clear except to register and to claim; the server stores only its SHA-256.

**The server** (a new migration, `supabase/migrations/0004_recovery.sql`):

- `public.recovery (user_id uuid primary key references auth.users on delete cascade, hash text
  unique not null, created_at timestamptz not null default now())`, RLS on, no policies (reached
  only through the functions below).
- `set_recovery(p_hash text)`: SECURITY DEFINER, `search_path = public`, for `authenticated` only:
  upsert the caller's row. The phone sends the hex SHA-256 of the normalised secret (upper case, no
  dashes), computed with `crypto.subtle.digest`.
- `claim_recovery(p_secret text)`: SECURITY DEFINER, for `authenticated` only. Hashes the normalised
  secret server-side (pgcrypto `digest`, schema `extensions` on Supabase), finds the owner. If none,
  returns null. If the owner is the caller, returns the caller's backups. Otherwise it moves the whole
  identity to the caller, in one transaction: delete the caller's own rows (profile, passports,
  backups, friends, memberships, recovery; the caller is a fresh phone), re-point every row of the
  owner (`profiles`, `passports`, `backups`, `friends.user_id`, `memberships.user_id`,
  `groups.owner`, `recovery`) to the caller, delete the owner's auth user, and return the moved
  backups as `jsonb` (`[{cruise_id, state, updated_at}]`). The friend code moves with the profile, so
  every friend's edge (`friends.friend_code`) and every group keeps working. 100 bits needs no rate
  limit; do not add a lookup that confirms whether a code exists apart from the claim itself.
- Revoke from `anon` and `public`; grant execute to `authenticated`, as `0003` does.
- A dry run proves it before it is applied: a DO block (or a transaction ending in ROLLBACK) that
  makes two users, claims one into the other and asserts the moves. See
  `C:\Users\Charles\.claude\projects\E--claude-projects\memory\project_bobble_usage_dashboard_split.md`
  for the dry-run-in-a-DO-block technique. **This branch writes the migration and its dry run and
  never applies anything to the live project.** The main session applies it.

**The phone** (`src/state/`):

- A pure module for the secret: generate, normalise, format, hash; tested with `node --test`.
- After the first successful publish, and whenever the store has a secret whose hash the server has
  not confirmed, `set_recovery` is called (idempotent; remember confirmation in the store).
- Claim: `claim_recovery` over the current session, then the returned backup merged into the store
  with the existing restore merge (`src/state/restore.ts`), the store's social identity (code, name,
  colour) taken from the claimed profile, the secret kept (the same code keeps working), then a
  publish. Reuse the restore path's code rather than writing a second merge.
- A copy that has been claimed away (its auth user is gone) must not mint a new anonymous user that
  fights over the friend code: see 2.

## 2. Keep one identity on patchy Wi-Fi

The audit traced this in `@supabase/auth-js` 2.112.4: once the access token has expired, a refresh
that fails with an error the library treats as non-retryable (a 4xx or non-JSON answer, which a ship's
captive portal can give) removes the stored session; `ensureSession` then signs in anonymously again,
the new user's profile upsert fails for ever on the unique code, its first pull empties the crew list,
and the status reads "Offline" while online.

- Give the client a storage adapter that keeps a copy of the auth session when the library removes it
  other than through the app's own sign-out or erase.
- `ensureSession`: with no live session but a kept one, restore it (`setSession` with the kept
  tokens, which refreshes). A network failure, a timeout, or a 5xx keeps the copy and reports "held";
  only a definite answer that the refresh token or the user no longer exists (Supabase's
  `refresh_token_not_found`, `user_not_found` or `session_not_found` error codes, or an equivalent
  401 from the API) retires the identity, and then the phone does not mint a new anonymous user: it
  stops syncing and shows a plain status in Your details: "This passport moved to another phone or
  app. Bring it back with your recovery code, or start again." Minting a fresh user is only for a
  phone that never had one.
- Tests: the decision function (kept session, error kind) is pure and tested.

## 3. Timeouts

Every Supabase request gets a timeout: a `fetch` wrapper passed as `global.fetch` to `createClient`,
aborting after 15 seconds (20 for the claim). A stalled request then fails as a network failure, the
round is held, and the next round runs; nothing waits behind it.

## 4. Delete my data

- Pause sync before erasing: an `erasing` flag checked at the top of a sync round and between its
  steps, and `deleteMyData` awaits the round in flight before calling `delete_my_data`.
- Every publish step (`upsertProfile`, `publishPassport`, `publishBackup`) stops if the user id it
  started with is no longer the session's, and none of them mints a session.
- `deleteMyData` must not create a session to erase (a phone with no session has nothing on the
  server): it erases only over an existing one, else reports done locally.
- The recovery row goes with the rest (`delete_my_data` gains `recovery`; put that in `0004`).

## 5. `?seed` and `?fixture` never sync

A demo or fixture load marks the store entered, so today it syncs a fake passport to the live
project; 124 of 166 live accounts were this until the purge. `mode()` in `sync.ts` returns local
whenever the URL carries `seed` or `fixture`, whatever the store says, and the sync status says so.

## 6. An error screen instead of a blank page

A React error boundary around the app (in `src/main.tsx`): a failed lazy chunk after a deploy reloads
the page once (a session flag stops a loop); any other error shows one plain screen in the current
room's tokens: "Something went wrong." and a Reload button. No stack trace shown.

## 7. Ask the browser to keep the passport

`navigator.storage.persist()` once the guest has passed the entry screen, where supported, silently.

## 8. CI and a keep-awake check

- `.github/workflows/deploy.yml`: Node 22 (the tests rely on Node 22 stripping TypeScript), and an
  `npm test` step before the build.
- A new `.github/workflows/health-check.yml` from Bobble's
  (`E:\claude-projects\bobble-repo\.github\workflows\health-check.yml`): every two days, the site
  answers (5xx or unreachable fails; a Cloudflare 403 to a runner does not), and a Supabase REST read
  answers 200, which also resets the free tier's idle timer. The publishable key is public (it ships
  in the bundle); read it and the URL from the repo secrets the deploy already uses
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) rather than writing them in. A failure turns the job
  red and GitHub emails Charles.

## 9. The friends and memberships policies (written, not applied)

Any session can insert a row into `friends` directly (the policy is FOR ALL on the owner's uid), so it
can read a guest's shared passport through `friend_feed` without a reverse edge the guest could see
or cut, and the same for `memberships` and a group whose id it knows. Every legitimate write goes
through the SECURITY DEFINER functions. `supabase/migrations/0005_tighten_policies.sql` replaces the
two FOR ALL policies with SELECT and DELETE on the owner's own rows. It is written and dry-run here;
it is applied only when Charles says yes.

## Done means

`npm test` (with new tests for the secret, the session decision and the timeout wrapper), `npx tsc
-b`, `npm run lint` with no errors, `npm run design:check`, `npm run build` all exit 0; both
migrations dry-run against the live project in a rolled-back transaction with their assertions
passing; nothing applied; `docs/DESIGN.md`'s registry, `docs/BACKEND_SETUP.md`, `MAINTENANCE.md`
(the runbook: install to the home screen first, save the recovery code) and `CLAUDE.md` updated.
