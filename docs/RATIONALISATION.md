# Rationalisation pass (1 September 2026)

The productionisation plan shipped in two lanes on top of a demo, and it left several parallel
threads alive at once: two sync transports, two hosting targets with two base paths, a flat friend
list that the plan itself said should be a provenance-keyed roster, half-wired account adapters, and
"coming soon" markers in a beta. This pass collapses each of those to one approach, and takes the
social layer from "works in a test" to something a non-technical guest can actually use.

## What is cut, and why

| Thread | Decision | Why |
| --- | --- | --- |
| Cloudflare Worker + KV "mailbox" (`worker/`, `VITE_SYNC_URL`, `profile.groupCode`, `profile.syncUrl`, worker mode in `sync.ts`, the "Cruise group" form in the friends sheet) | **Removed.** Worker and KV namespace deleted. | Supabase is the one online backend (decision D1). Two transports meant two group concepts and a form nobody should see. |
| GitHub Pages as the app host (`/cruise-passport/` base, `public/404.html`, the SPA-restore script in `index.html`, `BASE_PATH` dual build) | **Retired as a host; kept only as a redirector.** Base is `/` everywhere. The Pages workflow now publishes a two-line redirect to `cruise.charlesbee.org` that preserves path and hash, so old links (including `/add#…`) still land. | One origin. Two origins meant two identities and two localStorage stores for the same person. |
| Manual Cloudflare deploy (`wrangler pages deploy` from a laptop) | **Replaced by CI.** GitHub Actions builds once (with the Supabase secrets) and deploys that artefact to the existing Pages project with `cloudflare/wrangler-action`. | A direct-upload Pages project cannot be converted to Git-connected, and the build already lives in Actions with the secrets. One pipeline, one artefact. |
| Cruise picker gate on first run | **Skipped while there is one cruise.** The component stays; it only renders when `CRUISES.length > 1`. | A "choose your voyage" screen with one card is a pointless step in front of every invite link. |
| Full-passport QR (`SPP` with every entry) as the in-person add | **Replaced by an identity card.** The QR and share link now carry a tiny card (id, name, colour, code, no entries) as an `/add#…` URL, so a phone's native camera opens it. The passport itself arrives through the backend feed. Offline or no-backend builds fall back to the full payload, so the merge path is unchanged. | The full payload grew with every rating, produced dense QRs, and past a point the QR component gave up and rendered nothing. |
| Paste-a-code as a visible path | **Kept, folded away** behind "Paste a code instead". | Still the only route with no camera and no signal; it just should not be the first thing a guest sees. |
| Unused account adapters (`signInWithGoogle`, `isAnonymous`, `currentUserId`, `signOut`, `fetchBackup`, `lookup`) | **Removed from the client.** `deleteMyData` stays and is now wired to a real control. | Dead code invites drift. Google sign-in and cross-device restore are the next milestone and come back with an OAuth client, not before. |
| `Friend.pending` (set nowhere) | **Made real.** A card-only friend is `pending` until the first feed resolves them. | It was a flag with no writer. |
| "Coming soon" markers: drink photos, the Wrapped "3D finale" slide, the disabled "Save my Wrapped" | **Photos and the 3D slide removed. Save my Wrapped implemented** (renders the certificate to a PNG and shares or downloads it). | Placeholders in a beta read as unfinished. There is no photo source for 214 drinks; the share image is the one promise worth keeping because it is how the app spreads. |
| `FriendsCard` (Home) | **Deleted.** It was not imported anywhere. | Dead file. |
| `Soon` component | **Deleted** once its last use goes. | Nothing left to mark. |

Kept as designed: the `?seed` demo block (dev and screenshot aid, harmless in production), the
`plan`/`slots`/`sponsored_by` columns (paid groups are additive later), the one-merge-path rule, and
the offline-first envelope.

## Social v2: one crew, two routes in

The plan's own words were "people are one record, with provenance, not a flat friend list". The
Lane 2 build did not deliver that: group co-members were merged into `friends[]` and lost their
provenance, "Remove" only removed locally (the server edge survived, so the friend came straight back
on the next pull), and leaving a group was impossible. This pass makes the model match the plan.

### Model

- **Crew** is everyone you can see: direct **friends** (you hold each other's code) plus **group
  co-members** (you share a group). Same `Friend` record, one roster, tagged by route.
- `Friend.groupOnly` marks a person you see only through a group; `Friend.groupIds` lists the
  groups you share (the roster subline names the first). Both feeds go through one merge,
  `applyFeed(direct, group)`: the group-only set is **replaced on every pull** from the group feed,
  so leaving a group (or someone leaving yours) drops them without a purge step, and a direct friend
  who is also a co-member renders once, as a direct friend.
- **Friendship is mutual and the direct feed is the server's word on it.** A direct friend the
  server has confirmed (`needsEdge` cleared) who then vanishes from the direct feed has been removed
  by the other side: they demote to group-only if you still share a group, otherwise they go. A
  friend added from a card or scan carries `needsEdge` until our `befriend` lands, so a not-yet-sent
  edge is never mistaken for a removed one.
- **Remove friend** deletes both server edges (`unfriend` RPC). Locally the record is dropped, or
  demoted to group-only if you still share a group, which is the honest answer. If the call fails
  the code goes on `pendingUnfriends`, replayed on the next pull; a blocked code is skipped when the
  direct feed is folded in, so the friend cannot come back while the removal is in flight.
- **Leave group** (`leave_group`) removes your membership. The owner deletes the group instead
  (`delete_group`, cascades). Group rows are persisted so the Social tab renders offline.
- **Pending invites.** A join link tapped offline is stored and replayed on the next successful
  pull, so "tap the link on the coach, join when the ship's Wi-Fi connects" works.
- Feeds `left join` passports so a co-member who has joined but not yet synced still shows (as
  pending) rather than being invisible until their first sync.

### The screen

Social tab, top to bottom:

1. **Your name, first.** If the profile has no name, a single card asks for it (name + colour) and
   collapses once set. Everything published before that would have said "A friend".
2. **Header** with a small profile chip (dot, name, code). Tap opens the profile sheet: name, colour,
   sync state, and a quiet "Delete my data" at the foot.
3. **Add to your crew** (the primary action). One sheet: your QR (an `/add#` link, so any camera
   works) with your code under it, "Share my link", "Scan a friend", then "Join a group" with an
   invite field, and "Paste a code instead" folded away.
4. **Groups.** Your groups as rows (name, N aboard, "you host"); tap one for the group sheet: roster,
   invite QR and link, leave or delete. "Set up a group" creates one and lands on that sheet with the
   invite ready to send. Create and join need a connection and say so when there is none.
5. **Sailing with.** The whole crew, one row each: dot, name, "12 logged · Gillams" or "Waiting to
   connect". Direct friends have Remove; via-group members do not (leave the group instead).
6. The existing Discover-together and "Nobody's tried these yet" cards, unchanged.

The 65-year-old path is therefore: tap the family's invite link, type a name, done.

## Next milestone (not in this pass)

Accounts: Google sign-in as an optional upgrade of the anonymous session (`linkIdentity`), with
cross-device restore from the `backups` row. Needs a Google Cloud OAuth client and the consent screen
published; the client adapter is trivial to re-add from git history.
