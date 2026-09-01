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
  - Additional redirect URLs (add all): `http://localhost:5173`, `http://localhost:4173`,
    `https://cruise.charlesbee.org`. Missing origins are the classic Google-redirect failure. The
    old GitHub Pages address only redirects now and does not need to be listed.

## 3. Run the schema

- **SQL editor → New query**, paste the whole of `supabase/migrations/0001_init.sql`, run it.
- It creates the tables (profiles, passports, backups, friends, groups, memberships), row-level
  security (own-row only), and the RPCs (lookup, befriend, friend_feed, my_groups, create_group,
  join_group, group_feed, delete_my_data). Safe to re-run.

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

Guest limitation, stated plainly (also shown in-app before sign-in): an anonymous user who loses their
device cache is unrecoverable, friend code included. Signing in is what makes progress durable.
