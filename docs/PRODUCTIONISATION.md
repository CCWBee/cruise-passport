# Productionisation plan

How the Cocktail Passport goes from a single hard-coded GitHub Pages demo to a hosted,
account-backed, multi-cruise product with a real friend graph. Written to be executed in order,
shipping value at every step, and never breaking the thing that matters most: it works at sea with
no internet.

## Goal and principles

- **Offline-first is non-negotiable.** A cruise has patchy or paid Wi-Fi. The local cache
  (Zustand persist) stays the source of truth. Every online feature degrades to a cached or QR path,
  never a blank screen. Success is a confirmed HTTP response, never `navigator.onLine`.
- **Guest-first.** No login wall. You open the app, pick your cruise, and start ticking drinks with
  zero account. Signing in is an optional upgrade that backs your data up and recovers it on another
  device.
- **One merge path.** `importFriendPayload(SharePayload)` already merges a friend's whole passport.
  QR, camera and the online backend are just three transports feeding that one function. We do not
  add a second merge.
- **Right-sized.** This is Izzy plus friends on a two-week sailing, not a social network. Capability
  codes, not friend-request/accept ceremony. One Postgres project, a couple of tables, thin RLS.

## Where we are today

- **Host:** GitHub Pages at `ccwbee.github.io/cruise-passport/` (base path `/cruise-passport/`),
  deployed by `.github/workflows/deploy.yml`.
- **Backend:** a Cloudflare Worker + KV "dumb mailbox" (`cruise-sync.charlesbee.workers.dev`),
  group-code model: everyone who types the same group code sees each other. `PUT /g/:group/:member`,
  `GET /g/:group`.
- **Identity:** `profile.id` is a UUID (`crypto.randomUUID`). No stable human-readable code. Friends
  are added by pasting an `SPP…` code, or by joining a group.
- **Cruise data:** hard-coded in `src/data/raw.ts` (`START`, `END`, `VENUES`, `COCKTAILS`, …),
  surfaced through `src/data/model.ts` as module-level `DRINKS`, `DAYS`, `START`, `END`. Every
  feature imports these directly. There is exactly one cruise and it is baked in.
- **PWA:** vite-plugin-pwa configured (autoUpdate, precache, manifest with icons). Core app already
  works offline because state is local.

## Target architecture

```
              Cloudflare Pages  (cruise.charlesbee.org, base '/')
                     │  serves the static PWA
                     ▼
        ┌─────────────────────────────┐        Supabase project  (separate from Bobble)
        │  App (local-first)          │  online   ┌───────────────────────────────┐
        │  - Zustand persist = truth  │◀────────▶ │  Auth: anonymous + Google      │
        │  - identity: uuid + code    │           │  profiles(user_id, code, …)    │
        │  - friend graph: codes[]    │           │  passports(user_id, payload)   │
        │  - one merge: importPayload │           │  RPC resolve(codes[]) -> rows  │
        └─────────────────────────────┘           │  RLS: write own, read by code  │
              ▲            ▲                        └───────────────────────────────┘
         QR / camera   local cache
        (offline add)  (offline all)
```

The Cloudflare Worker + KV mailbox is **retired** once Supabase is live (decision D1). Supabase
becomes the single online backend: identity/backup (auth), friend resolution (RPC), and durable
storage. Offline paths (local cache + QR/camera) are unchanged.

## Workstreams

### A. Identity and the friend graph (client only, no backend needed)

The headline feature and the biggest UX win. Ships on current hosting before any Supabase exists.

- **Stable friend code.** Derive a short, human-readable, persistent code per device, e.g.
  `IZZY-4K2P` (optional name prefix + random base32). Stored in `profile.code`, generated once,
  never changes. This is your public handle. The UUID (`profile.id`) stays the internal key that
  payloads are stamped with.
- **"Add me" menu.** A dedicated panel (on the Social tab): shows *your* code big, *your* code as a
  **QR** for others to scan, a Copy button, and a **Scan a friend** button that opens the camera.
- **Easy onboarding is the priority (non-technical guests, e.g. a 65-year-old).** Typing a code is
  the last resort, never the main path. In order of ease:
  1. **Invite link** — "Add me" also produces a share link (`/add/<code>`). Text, WhatsApp or AirDrop
     it; the recipient taps, the app opens and adds you, no typing. Reliable when people set up
     before boarding (internet ashore), which is the expected flow. The link can also carry the
     payload for an instant offline add.
  2. **QR + camera** — in person: point, scan, done. No typing.
  3. **Typed code** — fallback only.
  - **Optional group invite** — one link that mutually adds everyone who taps it (a family of six taps
    one link instead of fifteen pairwise adds). This is sugar over the friend graph and the `resolve`
    RPC, **not** the old KV group mailbox: still one data model, still capability codes.
- **Camera scan.** Use the device camera (`getUserMedia`) plus a QR decoder to read a friend's QR.
  The QR encodes their code and, when it fits, their latest `SharePayload`, so a scan adds them
  **instantly and fully offline** (straight into `importFriendPayload`). If the payload does not fit
  the QR, we store the code and resolve the payload online later.
- **Friend list = people you added.** Replaces the group model in the UI. Social feed shows each
  friend's latest shared activity (already built in `Social.tsx`/`DiscoverTogether.tsx`, just fed by
  the code graph instead of the group).
- **QR generation + decode** are small vendored libs (no runtime CDN, per the artifact/library
  rules): a QR encoder for display, `jsQR`/`qr-scanner` for the camera. Verify bundle size.
- **Emit mode B (deflate).** `encodeShare` currently emits mode A (plain) though `decodeShare`
  already accepts B; the asymmetry was built for this. Deflating shrinks the QR enough that a real
  passport's full payload fits, so a scan is a full offline add far more often instead of degrading
  to code-only.
- **Pending roster row.** A friend scanned code-only (payload did not fit, or typed by hand) is a
  "pending" row: known code, no name/colour/activity until the first online `resolve`. That state
  ships the moment the camera does, so the roster and feed must render it gracefully.
- **Backwards compatible:** the `SPP…` paste path stays as a fallback for anyone who cannot scan.

Files: `state/share.ts` (add `code`, emit mode B), `state/store.ts` (profile.code + migration v4),
new `features/social/AddMe.tsx` + camera component, `ui/Qr.tsx`, retire group UI in `FriendsSheet`.
Note: the `?seed` block in `index.html` writes `version: 2`; bump it in lockstep with every store
migration (v4/v5) or demo seeding silently breaks.

### B. Accounts and the Supabase backend (needs Charles's Supabase project)

- **Anonymous-first auth.** On first online moment, create a Supabase **anonymous** session so RLS
  can secure writes. Invisible, no UI. The local uuid+code remain the offline identity; the anon
  session's row is keyed to that code.
- **Optional Google sign-in.** A single "Back up my passport" / "Sign in" action upgrades the
  anonymous user to Google via `linkIdentity`, preserving the same user and all data. This is the
  "accounts so losing your cache doesn't lose progress" path: after sign-in the passport is mirrored
  server-side and restorable on a new device.
- **Two payloads, deliberately separate.** The social `SharePayload` (SPP) is lossy by design:
  `shareable()` drops `fav`, `wish`, `again`, `notes` and custom drinks, because friends should not
  see your wishlist or private notes. So it must **not** double as the account backup, or restore
  silently loses them. Two stores:
  - **Shared passport** (`passports`): the SPP payload, friend-readable via `resolve`. Feeds the feed
    and taste-match.
  - **Full backup** (`backups`): the complete local state (`me` entries including fav/wish/again/notes,
    `custom` drinks, profile), owner-only, never returned by `resolve`. This is the
    "lose your cache, keep your progress" store.
- **Schema (I write the SQL migration; Charles runs it in the Supabase SQL editor), cruise-scoped
  from day one** so cruise #2 is not a painful migration:
  - `profiles(user_id uuid references auth.users, code text unique, name text, colour text,
    updated_at, pk (user_id))`. Code is per person, not per cruise.
  - `passports(user_id uuid, cruise_id text, payload jsonb, updated_at, pk (user_id, cruise_id))`.
  - `backups(user_id uuid, cruise_id text, state jsonb, updated_at, pk (user_id, cruise_id))`, owner-only.
  - `resolve(codes text[], cruise_id text)` SECURITY DEFINER RPC → `[{code, name, colour, payload,
    updated_at}]` for those codes on that cruise. Codes are capabilities: having a friend's code
    authorises reading their shared passport (same trust as handing someone a QR).
  - **RLS:** upsert only your own rows (`auth.uid() = user_id`) in all three tables; `backups` also
    reads own only; `profiles`/`passports` reads go only through `resolve` (no blanket table read).
    Codes carry enough entropy that they cannot be enumerated; **first claim on a code wins**.
- **Wire format v3:** stamp the payload with its cruise id (`cr`). `parseFriend` validates against
  `DRINK_BY_ID`/`START`/`END`, which become cruise-scoped in D, so a payload whose `cr` is not the
  active cruise is ignored (defined behaviour, never a crash).
- **Restore is a NEW, self-only merge path** (distinct from `importFriendPayload`, which only ever
  merges friends). Spec it before Codex builds it: a fresh device that signs in adopts the account's
  canonical `code` from `profiles`, then reconciles server `backups` against local state by
  `updated_at` (newer wins, never a blind overwrite). Guest with no prior local state → server is
  truth. No account → nothing to restore.
- **Keys:** the Supabase URL and **anon/publishable** key are safe in client code (they are designed
  to be public and RLS does the protecting). They go in `.env` (gitignored), a Cloudflare Pages env
  var, and a GitHub Actions secret. They never go in any context-loaded doc.

### C. Sync rework (needs B)

- Swap the Worker transport in `state/sync.ts` for Supabase:
  - **publish:** upsert my `passports` row (anon or Google session).
  - **pull:** `resolve(myFriendCodes)` → run each returned payload through `importFriendPayload`.
- Keep the existing envelope verbatim: debounce, backoff, foreground flush, visibility/online
  triggers, "held" state when offline. The transport changes; the offline-first machinery does not.
- Retire `worker/` (decision D1). Keep it in git history; stop deploying it.

### D. Generalisable cruise selection (client, bounded refactor)

The riskiest refactor: today `START`/`END`/`DRINKS`/`DAYS` are module-level singletons imported
everywhere. Generalising means the active cruise supplies them.

- **Cruise registry:** `src/data/cruises.ts` → `[{ id, name, ship, start, end, dataset }]`. One entry
  now: `sun-princess-2026` wrapping the existing `raw.ts` dataset unchanged.
- **Active cruise:** stored in state; a **cruise picker** on entry (the landing) lets you choose one
  and "load into it until it is over". Passport is keyed by cruise id so two cruises never collide
  (`me` becomes `passports[cruiseId]`). Migration v5 moves the current `me` under `sun-princess-2026`.
- **Scoping:** the cleanest bounded approach is an active-cruise accessor rather than rewriting every
  import. `model.ts` exposes `activeCruise()` and the derived `DRINKS/DAYS/START/END` resolve from
  it. Where components import the constants directly, they move to the accessor. This is mechanical
  and wide, so it is a good Codex job with an Opus review of the seams (date logic, share `START/END`
  validation, badges that count drinks).
- **After the cruise:** the entry can mark a past cruise read-only/archived; you can still browse your
  Wrapped. Not building multi-cruise switching UI beyond a picker now, but the data shape supports it.

### E. Hosting migration to Cloudflare Pages (needs Charles: domain)

- New **Cloudflare Pages** project building the repo (`npm run build`, output `dist`).
- **Base path becomes `/`** (root of a subdomain) instead of `/cruise-passport/`. Router basename is
  already `BASE_URL`; make the Vite base env-driven so GH Pages (staging) and Pages (prod) both work.
- **Custom domain:** `cruise.charlesbee.org` (decision D2). charlesbee.org is already on Cloudflare, so
  this is adding a subdomain + Pages custom domain, no new domain purchased.
- **Update absolute URLs:** `og:url`, `og:image`, `twitter:image`, canonical → the new host. (A comment
  in `index.html` already flags these.)
- **SPA fallback trap.** `public/404.html` is the GitHub Pages deep-link hack. Cloudflare Pages does
  the opposite: with no `404.html` it falls back to `index.html` (correct for an SPA), but a present
  `404.html` disables that fallback and prod deep links break. So the build **includes** `404.html`
  for the GH Pages target and **excludes** it for the Pages target. (Verify against current CF Pages
  docs when we get here.)
- **GitHub Pages** stays as a staging mirror or is retired (decision D3).
- **Landing page:** a light hero at `/` (brand, one line, "Open your passport" → cruise picker). Not a
  heavy marketing site. Guest can go straight in.

### F. PWA and offline hard-caching (client)

- Precache the full app shell + the active cruise dataset (it is JS, already in the bundle).
- Runtime caching: Supabase `resolve` reads are **network-first with cache fallback** so the feed
  shows last-known friends offline; publishes queue and flush on reconnect (already the sync
  behaviour). Any future images are cache-first.
- Offline fallback route; confirm installability end to end (icons already done).
- Verify with a real throttled/offline render, not by reasoning about the config.

### G. Cruise Wrapped social slide (client) — already requested twice, still outstanding

Fold the crew/taste-match numbers into the Wrapped finale: a slide for "your crew" (who you sailed
with, shared favourites, your taste twin, drinks only you tried, drinks only they did). Reuses
`state/social.ts` (`tasteTwin`, `tasteAffinity`, `undiscovered`, `groupReach`). No backend.

### H. Data protection (UK GDPR / EU GDPR) — designed in, not bolted on

Once names and logs live on a server for UK/EU users, this is a real obligation, kept right-sized for
a friends-and-family app. Charles is the data controller; Supabase and Cloudflare are processors (both
publish GDPR DPAs).

- **Minimise.** Store only what the app needs: a display name (encourage a first name or nickname, not
  a full legal name), a colour, drink ratings/notes, visits, cruise id, the friend code. No address,
  no phone, no date of birth. Email exists only if the user chooses Google sign-in, and is held by
  Supabase Auth, not copied into our tables.
- **Not health data.** Framed as cocktails tried on a holiday, not consumption tracking. We store no
  special-category data and add nothing that could read as health monitoring.
- **Adults only.** Alcohol-adjacent; not directed at or promoted to under-18s. State it plainly.
- **Lawful basis = consent.** Local-only guest use needs none (no server, no third party). The moment
  data leaves the device (sign-in or online sync) is gated by a short, plain **privacy note**: what we
  keep, where (EU region), who can see it (friends you added, via your code), and how to delete it.
  No dark patterns, no pre-ticked boxes.
- **No third-party tracking.** No analytics, no ad SDKs, no tracking cookies. This keeps us out of
  cookie-consent-banner territory entirely; only essential local storage is used.
- **Right to erasure + portability.** A real **"Delete my data"** action: clears local state, deletes
  the server `profiles`/`passports`/`backups` rows, and deletes the Supabase auth user. Export already
  exists (your passport code is your data, portable). Access request = the same export.
- **Retention.** Data is tied to a cruise. Offer deletion any time; consider auto-expiring rows some
  months after a cruise ends so nothing lingers indefinitely.
- **Security.** RLS (write-own, read-by-code), un-enumerable codes, HTTPS only, EU data region. The
  only client-side key is the publishable anon key (public by design; RLS does the protecting).

## What Charles must do (cannot be automated; dashboard work)

1. **Supabase:** create a **new project**, separate from Bobble (own org/project), and choose an **EU
   region** (UK/EU users). In Auth:
   - Enable **Anonymous sign-ins**.
   - Enable the **Google** provider.
   - Turn on **manual linking** (the setting that lets an anonymous user link a Google identity via
     `linkIdentity`; it is separate from enabling the provider, so check the toggle name in the
     current dashboard).
   - Under **Auth → URL configuration**, set the Site URL and add **every** app origin to the redirect
     allow-list: `http://localhost:5173`, the GH Pages staging URL, and `https://cruise.charlesbee.org`.
     Missing origins are the classic Google-redirect failure (hit this on Bobble).
   - Send me the **project URL** and the **anon/publishable key** (both public-safe). I supply the SQL
     migration for you to paste into the SQL editor.
2. **Google Cloud:** create an OAuth consent screen + OAuth client for the Supabase Google provider
   (redirect URL is the one Supabase shows). Paste the client id/secret into Supabase's Google
   provider. Same shape as Bobble, but a **separate** client.
3. **Cloudflare Pages:** create a Pages project connected to the `CCWBee/cruise-passport` repo (I will
   have the build config ready), add the custom domain `cruise.charlesbee.org`, and set the Supabase
   env vars in Pages. Or authorise me to run the `wrangler pages` setup and you approve the domain.
4. Confirm the decisions below.

**Guest-mode limitation, stated plainly (belongs in the in-app privacy note too):** an anonymous
(not signed-in) user who loses their device cache is unrecoverable, friend code included, because
nothing durable ties that data to them. That is the honest reason to sign in, and it must be a
visible choice, not a surprise.

## Execution order and delegation

Two lanes so nothing blocks on the dashboard work.

**Lane 1 — ship now on current hosting (no backend):**
1. A. Identity + code + "Add me" + QR + camera add (Opus architects the identity/merge seam; Codex
   writes the QR/camera components to spec; Opus reviews).
2. G. Wrapped social slide.
3. D. Generalisable cruise-select (Codex does the wide mechanical accessor refactor; Opus audits the
   date/share/badge seams).
4. F. PWA caching hardening.

**Lane 2 — once Charles delivers Supabase keys + domain:**
5. B. Supabase client, anon + Google auth, RLS migration.
6. C. Sync rework onto Supabase; retire the Worker; **delete the KV namespace** afterwards.
7. E. Cloudflare Pages + subdomain + base-path + OG URLs; retire/point GH Pages.

**C must land before E (hard dependency, not a preference):** the Worker's CORS only allows
`ccwbee.github.io`. If we move the host (E) before sync is off the Worker (C), the new origin is
blocked and sync dies. Getting onto Supabase first makes the host move safe.

Delegation follows the model-selection rule: Opus holds architecture, taste and review; gpt-5.6-sol
(Codex) writes bulk/spec'd code; subagents on Opus for parallel review. Concurrency within limits.

## Decisions needed from Charles

- **D1 — Retire the Cloudflare Worker and go all-Supabase?** Recommend **yes**: the group-code
  mailbox does not fit a per-person friend graph, and one backend beats two. (You just deployed the
  Worker, hence flagging it.)
- **D2 — Subdomain?** Recommend **`cruise.charlesbee.org`**. Alternatives: `drinks.`, `passport.`.
- **D3 — Keep GitHub Pages as staging, or retire it** once Cloudflare Pages is live? Recommend keep as
  a staging mirror (free, useful for testing before prod).
- **D4 — Friend model = capability-by-code (no accept flow).** Treated as **confirmed**: your own
  message (stable code, add-me menu, QR, camera, appear in the feed) describes exactly this, with no
  request/accept ceremony.

## Nothing-dropped checklist

- [ ] Stable friend code, generated once, migrated for existing users.
- [ ] "Add me" panel: code + QR + copy.
- [ ] Invite link (tap to add, no typing) + optional group invite; typed code is fallback only.
- [ ] QR emits mode B (deflate) so real payloads fit; camera scan adds a friend fully offline.
- [ ] Pending roster/feed row for a code-only friend renders gracefully.
- [ ] Paste-code fallback retained.
- [ ] Two payloads: lossy social SPP + full owner-only backup. Restore never loses fav/wish/notes/custom.
- [ ] Restore is a defined self-only merge path (adopt canonical code, newer-wins), not an ad-hoc one.
- [ ] Anonymous auth (invisible) + optional Google sign-in with data-preserving link (manual linking on).
- [ ] Auth redirect allow-list covers localhost + staging + prod origins.
- [ ] Cruise-scoped schema + v3 wire format (`cr`) from day one; off-cruise payloads ignored, never crash.
- [ ] RLS: write-own, read-by-code; codes un-enumerable; first-claim-wins.
- [ ] Sync reworked onto Supabase; offline envelope unchanged; Worker retired; KV deleted.
- [ ] Cruise registry + picker; passport keyed by cruise; store migration; `?seed` version bumped in lockstep.
- [ ] Cloudflare Pages + `cruise.charlesbee.org`; base path `/`; OG/canonical URLs updated; 404.html excluded for Pages.
- [ ] PWA precache + network-first feed + offline fallback, verified on a real offline render.
- [ ] Wrapped social slide.
- [ ] Data protection: EU region, minimisation, consent + in-app privacy note, delete-my-data (erasure), no third-party tracking.
- [ ] Guest-mode limitation surfaced as an honest choice (lose cache = unrecoverable without sign-in).
- [ ] Login stays optional throughout; no hard gate.
- [ ] Keys only in `.env`/Pages/Actions, never in context-loaded docs.
- [ ] Isabel's repo untouched; Bobble's Supabase untouched.
```
