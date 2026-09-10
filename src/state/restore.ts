// The restore merge: bringing a passport back from its `backups` row and folding it into whatever is
// already on this phone. Pure functions only, so the whole of it is exercised by restore.test.ts
// under `node --test` with no browser, no store and no network. sync.ts owns the calls and the
// states; this file owns the arithmetic.
//
// Every import here is a whole `import type` statement and never an inline `type` modifier inside a
// value import. Node erases the whole statement, but `import { type X }` leaves a side-effect import
// behind, and data/model.ts reads `location` at module level (`activeCruise().data`), which throws
// the moment it is loaded outside a browser. So this file imports no runtime value from anywhere.
import type { Drink } from '../data/model'
import type { Entry, Passport, Profile, VenueVisit } from './stats'

/** What publishBackend writes through publishBackup (sync.ts), read back. */
export interface BackupState { me: Passport; custom: Drink[]; profile: Profile }
export interface RestoreOpts { untouched: boolean; canonicalCode?: string }
export interface RestoreResult { me: Passport; custom: Drink[]; profile: Profile; adopted: number; codeChanged: boolean }

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined)

/** Nothing has been done on this phone yet: no drinks, no venues, no custom drinks, no crew, no
 *  groups. Deliberately not the `?seed` guard in index.html (51 to 54), which counts these five and
 *  a profile name as well. A name must not count here, because workstream B asks for one on first
 *  open, and every restore would then be blocked on a phone that has done nothing but say who its
 *  owner is. Friends count in both, and for the same reason: a phone with a crew is a phone in use. */
export function isUntouched(s: { me: Passport; custom: unknown[]; friends: unknown[]; groups: unknown[] }): boolean {
  return Object.keys(s.me.entries).length === 0
    && Object.keys(s.me.visits).length === 0
    && s.custom.length === 0
    && s.friends.length === 0
    && s.groups.length === 0
}

function readEntry(raw: unknown): Entry {
  const o = isObj(raw) ? raw : {}
  const e: Entry = {}
  const tried = bool(o.tried); if (tried !== undefined) e.tried = tried
  const date = str(o.date); if (date !== undefined) e.date = date
  const rating = num(o.rating); if (rating !== undefined) e.rating = rating
  const fav = bool(o.fav); if (fav !== undefined) e.fav = fav
  const wish = bool(o.wish); if (wish !== undefined) e.wish = wish
  const again = bool(o.again); if (again !== undefined) e.again = again
  const notes = str(o.notes); if (notes !== undefined) e.notes = notes
  const rec = bool(o.rec); if (rec !== undefined) e.rec = rec
  const comment = str(o.comment); if (comment !== undefined) e.comment = comment
  return e
}

function readVisit(raw: unknown): VenueVisit {
  const o = isObj(raw) ? raw : {}
  const v: VenueVisit = {}
  const visited = bool(o.visited); if (visited !== undefined) v.visited = visited
  const date = str(o.date); if (date !== undefined) v.date = date
  return v
}

/** A custom drink has to be whole to be usable: without an id and a name it cannot be listed or
 *  logged against, so it is dropped rather than carried through as a hole in the catalogue. */
function readDrink(raw: unknown): Drink | null {
  if (!isObj(raw)) return null
  const id = str(raw.id)
  const name = str(raw.name)
  if (!id || !name) return null
  const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  const orNull = <T>(v: T | undefined): T | null => (v === undefined ? null : v)
  return {
    id,
    name,
    venue: str(raw.venue) ?? '',
    category: str(raw.category) ?? '',
    spirits: strings(raw.spirits),
    ingredients: str(raw.ingredients) ?? '',
    flavors: strings(raw.flavors),
    sweet: num(raw.sweet) ?? 0,
    strength: num(raw.strength) ?? 0,
    frozen: bool(raw.frozen) ?? false,
    price: orNull(num(raw.price)),
    desc: str(raw.desc) ?? '',
    verified: bool(raw.verified) ?? false,
    plus: orNull(bool(raw.plus)),
    premier: orNull(bool(raw.premier)),
    extra: orNull(num(raw.extra)),
  }
}

function readProfile(raw: unknown): Profile {
  const o = isObj(raw) ? raw : {}
  const p: Profile = { id: str(o.id) ?? '', name: str(o.name) ?? '', colour: str(o.colour) ?? 'aqua' }
  const code = str(o.code); if (code) p.code = code
  return p
}

/** The row is untrusted JSON that an older build may have written. The store's own migrate chain
 *  shows what that means: migration 6 (the `delete persisted.profile.groupCode` step in store.ts)
 *  strips `groupCode` and `syncUrl`, and a backup written before it still carries them. So it is rebuilt
 *  field by field, anything unrecognised is dropped, and anything that is not an object with both
 *  `me.entries` and `me.visits` is no backup at all, which the caller reports as 'empty'. */
export function readBackup(raw: unknown): BackupState | null {
  if (!isObj(raw)) return null
  const me = raw.me
  if (!isObj(me) || !isObj(me.entries) || !isObj(me.visits)) return null
  const entries: Record<string, Entry> = {}
  for (const [id, v] of Object.entries(me.entries)) entries[id] = readEntry(v)
  const visits: Record<string, VenueVisit> = {}
  for (const [key, v] of Object.entries(me.visits)) visits[key] = readVisit(v)
  // Deduped here as well as in the merge, because this is the sanitiser: a caller that takes the
  // backup wholesale never goes through mergeCustom's local side, and two rows under one id would
  // reach allDrinks() either way. mergeCustom against an empty local list is that same first-seen
  // rule, so there is one implementation of it rather than two that can drift.
  const custom = mergeCustom([], Array.isArray(raw.custom)
    ? raw.custom.map(readDrink).filter((d): d is Drink => d !== null)
    : [])
  return { me: { entries, visits }, custom, profile: readProfile(raw.profile) }
}

/** One drink, held on both phones. The passport has no per-edit clock, so the day the drink was
 *  logged is the only honest recency the data carries: the later date wins, a dated entry beats an
 *  undated one, and a tie (or neither dated) goes to the phone in the guest's hand. Then the union,
 *  which is what makes the merge safe: every field the winner defines wins, every field only the
 *  loser defines is kept (a note, a comment, a rating), and `tried` on either side is never untried,
 *  so no drink logged on either phone is lost.
 *
 *  The cost of that union, and it is deliberate: a rating or a note the guest cleared on this phone
 *  can come back. `store.patch` deletes a key set to `undefined`, so clearing a rating or emptying a
 *  note removes the field rather than tombstoning it, and the union keeps whatever the backup still
 *  holds even where this phone is the later side. Nothing is ever lost, which is the property the
 *  merge is chosen for; a clear is not a fact the data can carry without a per-field clock. */
export function mergeEntry(local: Entry, remote: Entry): Entry {
  // An absent date sorts before every real one, so this is the whole rule in one comparison: the
  // later date wins, a dated entry beats an undated one, and equal (or both absent) leaves local.
  const remoteDate = remote.date || ''
  const remoteWins = remoteDate !== '' && remoteDate > (local.date || '')
  const winner = remoteWins ? remote : local
  const loser = remoteWins ? local : remote
  const out: Entry = { ...loser }
  for (const [k, v] of Object.entries(winner)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v
  }
  if (local.tried || remote.tried) out.tried = true
  return out
}

export function mergeEntries(local: Record<string, Entry>, remote: Record<string, Entry>): Record<string, Entry> {
  const out: Record<string, Entry> = { ...local }
  for (const [id, r] of Object.entries(remote)) {
    out[id] = Object.prototype.hasOwnProperty.call(local, id) ? mergeEntry(local[id], r) : r
  }
  return out
}

/** A visit is a fact about having been somewhere, so either side saying so makes it true, and the
 *  date is the earlier of the two: a visit date is when you first went. */
export function mergeVisits(local: Record<string, VenueVisit>, remote: Record<string, VenueVisit>): Record<string, VenueVisit> {
  const out: Record<string, VenueVisit> = { ...local }
  for (const [key, r] of Object.entries(remote)) {
    if (!Object.prototype.hasOwnProperty.call(local, key)) { out[key] = r; continue }
    const l = local[key]
    const v: VenueVisit = {}
    if (l.visited || r.visited) v.visited = true
    const date = l.date && r.date ? (l.date < r.date ? l.date : r.date) : (l.date || r.date)
    if (date) v.date = date
    out[key] = v
  }
  return out
}

/** Union by id, this phone's list first. A custom drink is a thing the guest wrote, so neither side
 *  is edited: the id decides and the first row carrying it stands, local before remote and, within
 *  either list, in the order it arrived. The set grows as the loop runs rather than being fixed from
 *  `local` up front, because a backup written by an older build can carry the same id twice; letting
 *  both through would put two Drink rows under one id into allDrinks(), which the Drinks list and the
 *  badge pass both read. */
export function mergeCustom(local: Drink[], remote: Drink[]): Drink[] {
  const have = new Set<string>()
  const out: Drink[] = []
  for (const d of [...local, ...remote]) {
    if (have.has(d.id)) continue
    have.add(d.id)
    out.push(d)
  }
  return out
}

/** The name is this phone's when it has one, and the colour follows the name: a guest who has
 *  chosen a colour has chosen it, so the backup's colour is adopted only where the name is too. The
 *  id comes from the backup whenever it has one, because that is the identity being restored. The
 *  code is the caller's canonical one when it supplies it (see sync.ts: it is read from the
 *  signed-in user's own profiles row and adopting it is what keeps every friend edge pointing at a
 *  live handle), else the backup's, else what is here. */
export function mergeProfile(local: Profile, remote: Profile, canonicalCode?: string): Profile {
  const localName = (local.name || '').trim()
  const out: Profile = {
    id: remote.id || local.id,
    name: localName || (remote.name || '').trim(),
    colour: localName ? local.colour : (remote.colour || local.colour),
  }
  const code = canonicalCode || remote.code || local.code
  if (code) out.code = code
  return out
}

/** The whole merge. `untouched` is the shortcut for a phone with nothing on it: the backup is taken
 *  wholesale, though the profile still goes through mergeProfile, because a canonical code wins
 *  either way. `adopted` counts drinks, not entries: an entry carrying only a wishlist flag or a
 *  note is not a drink anybody had, so counting it would make "Brought back 58 drinks" untrue. */
export function mergeRestore(local: BackupState, remote: BackupState, opts: RestoreOpts): RestoreResult {
  const profile = mergeProfile(local.profile, remote.profile, opts.canonicalCode)
  const me: Passport = opts.untouched
    ? { entries: { ...remote.me.entries }, visits: { ...remote.me.visits } }
    : {
      entries: mergeEntries(local.me.entries, remote.me.entries),
      visits: mergeVisits(local.me.visits, remote.me.visits),
    }
  // The untouched shortcut still goes through mergeCustom, with nothing on the local side: taking
  // `remote.custom` as it stands would be the one path that skips the id rule, and a caller may hand
  // this function a remote that never went through readBackup.
  const custom = mergeCustom(opts.untouched ? [] : local.custom, remote.custom)
  let adopted = 0
  for (const [id, e] of Object.entries(me.entries)) {
    if (e.tried && !local.me.entries[id]?.tried) adopted++
  }
  return { me, custom, profile, adopted, codeChanged: profile.code !== local.profile.code }
}

/** The OAuth failure the provider hands back on the return leg. PKCE puts it in the query and the
 *  implicit flow in the fragment; the installed client sets no flowType and so defaults to implicit
 *  (see supabase.ts), and both are read here so neither is assumed. A fragment that is a share code
 *  carries no `error` key, so `/add#SPP…` returns null and is left exactly as it was. */
export function readOAuthError(hash: string, search: string): { code: string; description: string } | null {
  for (const raw of [hash, search]) {
    if (!raw) continue
    const params = new URLSearchParams(raw.replace(/^[#?]/, ''))
    const code = params.get('error_code') || params.get('error')
    if (code) return { code, description: params.get('error_description') || '' }
  }
  return null
}
