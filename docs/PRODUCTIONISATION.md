# Productionisation plan

> **Status (Sep 2026):** Lane 1 shipped and live. Lane 2 backend is **live for beta** on Supabase
> project `qpmrfoglxohmjhjtvkac` (anonymous auth, online friend sync, groups, backup) — verified end
> to end. Deferred for beta: Google sign-in + cross-device restore, delete-my-data UI, and the
> Cloudflare Pages move to `cruise.charlesbee.org` (still on GitHub Pages). The EU-region and Google
> steps below were relaxed on request ("not EU based, just get it working for beta testers").


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

### A. Identity, friends and groups

The person is the atom. Two independent relationship layers sit on top, because real cruise social
life has both:

- **Friends (peer, capability).** You meet someone at Crooners, swap codes (link, QR or camera), and
  now you can see into each other's shared passport. Ad-hoc, unlimited, outside any travelling party.
  Symmetric once either side is online: adding writes a friend edge so the other side sees you back on
  their next resolve; offline it is whoever-holds-the-code-sees until sync reconciles it. This is the
  per-person capability model, and it is **Lane 1** (works with QR/link before any backend).
- **Groups (container, roster).** You create a group, share **one** invite, and everyone who joins is
  connected to everyone in it, no pairwise adds. This is the efficient path for a known party (a
  family, a group of friends sailing together). A group has an owner, an invite code/link, a member
  roster, and, designed in from day one but not charged for yet, a **plan** and **slots**. Groups need
  a shared mutable roster, so they are server-backed and land in **Lane 2** (Supabase), but the model
  is fixed now so the schema and UI are right first time.

**How they compose (this is the "makes sense vs people" part):** the person is the unit of identity;
friendships and memberships both grant "see into their shared passport", by two routes (holding a code
vs sharing a group). A person can be in several groups (the family group, plus a "met at trivia"
group) and still have friends outside all of them. You always see: your group roster(s), and your
friends. Payment, when it exists, attaches to a **slot/membership**, never to the person globally, so
one human can sit in a paid group (sponsored) and still keep free friends.

**Paid vs unpaid, forward-looking (no payment built now):**
- `group.plan: 'free' | 'paid'`. Every group is `free` at launch. `paid` unlocks capacity and, later,
  extras (bigger roster, a group Wrapped, a custom group emblem).
- `group.slots`: capacity. Free groups get a **generous** default (around 50, so a family never hits a
  wall mid-sailing); slots only bind once `paid` is real. A paid group is one where an owner has bought
  capacity.
- **Sponsorship** lives on the membership: `membership.sponsored_by` records who paid for that slot.
  This is what lets "I'll buy the group for all of us" (owner sponsors every slot) and "everyone pays
  their own" (each self-sponsors) both make sense. Unset now (all free); the field exists so adding
  Stripe later is additive, not a migration.
- **Differentiator:** a small "Free group" / "Paid group" marker; feature gates read `plan`. The
  distinction is real in the data from the start even while everything is free.

**People are one record, with provenance.** A person you know may be both a direct friend and a
co-member of your group; they must render once, tagged by how you are connected. So the social state
keys people by code and tracks provenance (`friend` edge, and which `groups`), not a flat friend list.
This drives removal semantics, which are part of the GDPR erasure story, so they are designed now even
though groups build in Lane 2:
- **Remove friend:** delete both edges; online sharing stops each way. (An offline QR payload already
  received cannot be recalled; stated honestly.)
- **Leave group / owner removes member:** delete that membership only; a person who is also a direct
  friend stays a friend. A person with no remaining friend edge and no membership drops off your view.
The Lane 1 pairwise UI implements the `friend` slice of this, but the person-row component and the
Social sections are built provenance-ready so groups slot in without reworking the model.

**Link scheme, reserved now so it never reworks:** `/add/<code>` (a friend invite, Lane 1) and
`/join/<invite>` (a group invite, Lane 2) are both fixed in the router design today. A group join
attempted offline queues on the same held/pending machinery sync already uses ("You'll join when
you're back online").

Known **kinks in per-person codes** to handle: before accounts a person is really a device, so the
same human on two phones looks like two people until they sign in and reconcile to one code; codes are
provisional until claimed on the server (first claim wins); guard against adding your own code; name is
mutable but the code never changes. These are documented behaviours, resolved properly by sign-in.

The client-only headline (identity + pairwise friends) is the biggest early UX win and ships on
current hosting before any Supabase exists.

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
  - `friends(user_id uuid, friend_code text, created_at, pk (user_id, friend_code))`: my friend edges,
    server-synced so friendship converges to mutual.
  - `groups(id uuid pk, name text, owner_user_id uuid, plan text default 'free', slots int,
    invite_code text unique, cruise_id text, created_at)`: the paid/unpaid fields exist from day one,
    default free.
  - `memberships(group_id uuid, user_id uuid, role text, sponsored_by text, joined_at,
    pk (group_id, user_id))`: `role` = owner/member, `sponsored_by` = who paid for the slot (unset now).
  - **Read authority: codes bootstrap, edges authorise.** A code is only a token to *start* a
    friendship; it does not by itself grant perpetual read, so there is **no raw `code -> payload`
    endpoint**. Full payloads are served only to people with a live edge or shared membership, which
    makes "Remove friend" real: delete the edge and online sharing stops. (A payload already handed
    over by offline QR is inherently unrevocable; the doc says so honestly rather than pretending.)
  - **RPCs (SECURITY DEFINER, so they can write the reverse edge and enforce capacity):**
    - `lookup(code)` → just `{code, name, colour}`, a preview before you add someone. No payload.
    - `befriend(target_code)` → resolves the code and inserts **both** edges (me↔target), so a
      one-sided add (I scanned your QR) becomes mutual with no accept flow. **Cruise-agnostic**:
      friendships are between people and persist across sailings. Edge-gating plus removal makes a
      leaked code survivable (worst case: someone adds themselves; you remove them and reads stop).
    - `friend_feed(cruise_id)` → payloads, for this cruise, of everyone I have a live edge to.
    - `create_group(name, cruise_id)` → new group + owner membership + fresh invite code.
      `join_group(invite_code)` → inserts my membership if a slot is free; returns the roster.
    - `group_feed(cruise_id)` → payloads of every co-member across my groups on this cruise.
  - **RLS:** upsert only your own `profiles`/`passports`/`backups`/`friends` rows; `backups` reads own
    only; every cross-person read (friends, group co-members) goes through the edge/membership-gated
    RPCs above, never a blanket table read. Group rows are readable to members; a membership is written
    only by its owner or `join_group`. Codes carry enough entropy that they cannot be enumerated;
    **first claim on a code wins**. Note the deliberate asymmetry: friends are cruise-agnostic (people),
    group membership and every feed are per-cruise (a sailing).
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

- **D1 — Retire the Cloudflare Worker and go all-Supabase. CONFIRMED.** The KV mailbox does not fit a
  per-person + groups model; one backend beats two.
- **D2 — Subdomain `cruise.charlesbee.org`. CONFIRMED.**
- **D3 — Keep GitHub Pages as staging, or retire it** once Cloudflare Pages is live? Recommend keep as
  a staging mirror (free, useful for testing before prod).
- **D4 — Friend model = capability-by-code (no accept flow).** Treated as **confirmed**: your own
  message (stable code, add-me menu, QR, camera, appear in the feed) describes exactly this, with no
  request/accept ceremony.

## Nothing-dropped checklist

- [ ] Stable friend code, generated once, migrated for existing users.
- [ ] Two social layers that compose: peer friends (capability code) + groups (roster); a person can
      be in groups and have friends outside them.
- [ ] Friendship converges to mutual online (`befriend` writes the reverse edge; no accept flow).
- [ ] Reads edge/membership-gated (codes bootstrap, edges authorise); Remove friend truly revokes
      online sharing; offline QR noted honestly as unrevocable.
- [ ] People keyed by code with provenance (friend / which groups); removal + leave-group semantics.
- [ ] Groups: create + one-link join (`create_group`/`join_group`), roster, generous free slot default.
- [ ] Router reserves `/add/<code>` and `/join/<invite>`; offline group join queues on held/pending.
- [ ] Paid/unpaid designed in (group.plan/slots, membership.sponsored_by), all free now, no payment UI.
- [ ] "Add me" panel: code + QR + copy.
- [ ] Invite link (tap to add, no typing) + group invite link; typed code is fallback only.
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
