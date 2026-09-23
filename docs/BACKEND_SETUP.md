# Backend setup (Charles, ~10 minutes)

Lane 1 (identity, in-person friend add, Wrapped, cruise-select, offline PWA) is live and needs no
backend. Lane 2 (accounts, cross-device backup, online friend/group sync, Google sign-in) needs one
Supabase project. This is the only step gated on you: I cannot create your Supabase project or Google
OAuth client. Once you do the below and send me the two public values, I wire and verify the rest.

## 1. Create the Supabase project

- New project, **separate from Bobble** (its own project, ideally its own org). Choose an **EU
  region** (UK/EU users).
- Project name e.g. `cruise-passport`.

## 2. Auth settings

- **Authentication → Providers → Email**: fine to leave as is (we do not require email).
- **Authentication → Providers → Anonymous**: turn **ON** (guest sessions so RLS can secure writes).
- **Authentication → Providers → Google**: turn **ON**. You will paste a Google client id/secret here
  (step 4).
- **Authentication → (Sign In / Providers settings) → Allow manual linking**: turn **ON**. This is what
  lets a guest (anonymous) session upgrade to Google without losing their data. It is a separate
  toggle from enabling the provider; if you cannot find it, tell me your dashboard version.
- **Authentication → URL Configuration**:
  - Site URL: `https://cruise.charlesbee.org`.
  - Additional redirect URLs (add all four, trailing slashes exactly as written):
    `http://localhost:5173/`, `http://localhost:4173/`, `https://cruise.charlesbee.org/`,
    `https://cruise.charlesbee.org`. Missing origins are the classic Google-redirect failure, and so
    is a trailing-slash mismatch: the app sends its origin plus `BASE_URL`, which ends in a slash, so
    the live origin is listed both ways. The old GitHub Pages address only redirects now and does not
    need to be listed. `supabase/config.toml` holds the same list; keep the two in step.

## 3. Run the schema

- **SQL editor → New query**, paste the whole of `supabase/migrations/0001_init.sql`, run it.
- It creates the tables (profiles, passports, backups, friends, groups, memberships), row-level
  security (own-row only), and the RPCs (lookup, befriend, friend_feed, my_groups, create_group,
  join_group, group_feed, delete_my_data). Safe to re-run.
- Then the later migrations, in order, each safe to re-run:
  - `0002_social_v2.sql`: unfriend both ways, leave and delete a group, the group roster, both feeds
    left-joined (live).
  - `0003_find_profiles.sql`: find people by name or code (live).
  - `0004_recovery.sql`: the recovery code. The `recovery` table (a SHA-256 per user, RLS on, no
    policies), `set_recovery(hash)`, `claim_recovery(secret)`, which moves a whole identity onto the
    claiming phone and deletes the old auth user, and `delete_my_data` taking the recovery row with
    the rest. Written and dry-run on 23 September 2026; the main session applies it, and the app's
    recovery code does nothing until it is live (the phone keeps asking `set_recovery` each round and
    shows no code until one answers).
  - `0005_tighten_policies.sql`: `friends` and `memberships` become read and delete only for their
    owner, so every write goes through the functions. Written and dry-run; applied only when Charles
    says yes.
- Apply a file with `npx supabase db query --linked --project-ref qpmrfoglxohmjhjtvkac -f <file>` from
  the repo root (the CLI logged in; no Docker, no database password).
- **Dry-run a migration before applying it:** `node supabase/tests/dryrun.mjs 0004` (or `0005`). It
  puts the migration's own text inside a DO block with throwaway users and assertions
  (`supabase/tests/<n>_*.dryrun.sql`), runs it against the live project, and the block ends by
  raising, so everything rolls back; it prints `DRYRUN <n> OK …` or the first failed assertion, then
  a read-only check (`<n>_*.persisted.sql`) that none of it persisted. On 23 September 2026 both
  passed and the check afterwards read 33 auth users before and after, no `recovery` table, no
  recovery functions, and 0001's two FOR ALL policies still in place.

## 4. Google OAuth client

- Google Cloud console → new project (or reuse) → **APIs & Services → Credentials → Create OAuth
  client ID → Web application**.
- Authorised redirect URI: the callback URL Supabase shows on its Google provider page
  (looks like `https://<your-project>.supabase.co/auth/v1/callback`).
- Copy the client id + secret into Supabase's Google provider (step 2), save.
- (Same shape as Bobble, but a **separate** client for this project.)

## 5. Send me the two public values

- **Project URL** (`https://<project>.supabase.co`)
- **anon / publishable key** (Project Settings → API → Project API keys → `anon public`).

Both are designed to be public and safe in client code; RLS does the protecting. I put them in a
gitignored `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), a Cloudflare Pages env var, and a
GitHub Actions secret. **Never** send the `service_role` key; it is not used client-side and must not
leave the dashboard.

## What happens after

With those two values set, the app: creates an invisible anonymous session on first online use (guest
still works with no session), offers an optional "Back up my passport" Google sign-in that preserves
the same account, mirrors your passport to `backups` for cross-device restore, and turns on online
friend + group sync (create/join a group by link, add friends by code/QR/link) on top of the existing
offline paths. Nothing is charged; `plan`/`slots`/`sponsored_by` exist for a future paid tier.

Guest limitation, stated plainly: an anonymous user who loses their
device cache is unrecoverable, friend code included. Signing in is what makes progress durable.

Since 23 September 2026 (with `0004` applied) that limitation has an answer that needs no account:
the recovery code. Google stays off and its code paths stay in place, unreachable
(`googleSignInEnabled` in `src/state/backend.ts`). After a phone's first successful sync it makes a
20-character secret, keeps it, and registers its SHA-256 with `set_recovery`; Your details shows it
(the UI lands with the night-bar screens). Typing it into "Bring back a passport" on another phone,
or in the home-screen app, calls `claim_recovery`, which moves the profile (and so the friend code),
the passports, the backups, the friend edges, the memberships and owned groups onto that phone's
session and deletes the old auth user; the old copy's next refresh is told its user is gone, and it
stops syncing and says so rather than minting a new identity. The design and the copy are in
`docs/specs/2026-09-23-recovery-and-hardening.md`.

## 6. The keep-awake check

`.github/workflows/health-check.yml` runs every other day at 08:00 UTC (and by hand from the Actions
tab): the site must answer with the app's page (a 5xx, no answer, or a 200 that is not the app fails;
a Cloudflare 403 to a runner does not), and a REST read of `profiles` with the publishable key must
return 200 (row-level security answers it with an empty list). That read is real database traffic,
so it also resets the free tier's seven-day idle timer. It reads `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` from the repo secrets the deploy uses. A failure turns the job red and GitHub
emails the repo owner.
