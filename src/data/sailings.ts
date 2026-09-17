// The sailings a guest sets up for themselves, and every venue they add to one. model.ts resolves
// its dataset at module load (`const DATA = activeCruise().data`), before the zustand store exists,
// so the catalogue cannot live in the store. It lives in its own localStorage key beside
// `spcc-cruise`, read through the same try/catch idiom activeCruiseId() already uses: anything
// unreadable is treated as empty rather than thrown.
//
// No read at module load. The first call to allSailings() or venuesFor() reads and caches; the
// module body touches nothing. cruises.ts forces that first read anyway when it builds CRUISES, so
// nothing changes in the browser, but it means this file can be imported by a test under
// `node --test`, where localStorage does not exist. Every write invalidates the cache, so the next
// call reads the store back rather than trusting what it just held.
//
// It holds no drinks, no entries and no visits. Those are store state, so removing a sailing or a
// venue is two calls: the store's forgetSailing()/forgetVenue() first, then the removal here.
import type { VenueRaw } from './raw'

export interface Sailing {
  id: string // 'byo-XXXXXXXX'
  ship: string
  line: string // '' when not given
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  updatedAt: number
}

interface SailingStore {
  v: 1
  sailings: Sailing[]
  /** cruise id -> venue key -> venue. Holds a user sailing's whole venue list, and any venue
   *  added to a published sailing. One shape, so there is one lookup. */
  venues: Record<string, Record<string, VenueRaw>>
}

/** Every sailing with its venues: one object, so a future share codec is a codec and not a
 *  migration. It is also what rides in the account backup. */
export interface SailingExport {
  sailings: Sailing[]
  venues: Record<string, Record<string, VenueRaw>>
}

const STORAGE = 'spcc-sailings'
// Crockford base32 minus I, L, O and U: the ambiguity-free alphabet share.ts already spells a
// friend code in, so an id read aloud off one screen cannot be mistyped into another.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

const emptyStore = (): SailingStore => ({ v: 1, sailings: [], venues: {} })

let cache: SailingStore | null = null

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** A sailing has to be whole to be usable: without an id and dates it cannot be entered or
 *  rendered, so a malformed record is dropped rather than half-adopted. */
function readSailing(raw: unknown): Sailing | null {
  if (!isObj(raw)) return null
  const id = typeof raw.id === 'string' ? raw.id : ''
  const start = typeof raw.start === 'string' ? raw.start : ''
  const end = typeof raw.end === 'string' ? raw.end : ''
  if (!id || !start || !end) return null
  return {
    id,
    ship: typeof raw.ship === 'string' ? raw.ship : '',
    line: typeof raw.line === 'string' ? raw.line : '',
    start,
    end,
    updatedAt: typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0,
  }
}

function readVenue(raw: unknown): VenueRaw | null {
  if (!isObj(raw)) return null
  const name = typeof raw.name === 'string' ? raw.name : ''
  if (!name) return null
  const v: VenueRaw = {
    name,
    deck: typeof raw.deck === 'number' && Number.isFinite(raw.deck) ? raw.deck : 0,
    type: typeof raw.type === 'string' ? raw.type : 'Bar',
    hours: typeof raw.hours === 'string' ? raw.hours : '',
    blurb: typeof raw.blurb === 'string' ? raw.blurb : '',
  }
  if (typeof raw.shares === 'string') v.shares = raw.shares
  if (typeof raw.sharesNote === 'string') v.sharesNote = raw.sharesNote
  return v
}

/** The whole store, rebuilt field by field from whatever is in localStorage. A blocked store, a
 *  corrupt blob and a store written by a newer version all read as empty: this is the catalogue the
 *  app renders from, so a throw here would be a white screen rather than a missing sailing. */
function read(): SailingStore {
  if (cache) return cache
  const out = emptyStore()
  try {
    const raw = localStorage.getItem(STORAGE)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isObj(parsed) && parsed.v === 1) {
        if (Array.isArray(parsed.sailings)) {
          for (const entry of parsed.sailings) {
            const s = readSailing(entry)
            if (s && !out.sailings.some((x) => x.id === s.id)) out.sailings.push(s)
          }
        }
        if (isObj(parsed.venues)) {
          for (const [cruiseId, record] of Object.entries(parsed.venues)) {
            if (!isObj(record)) continue
            const venues: Record<string, VenueRaw> = {}
            for (const [key, venue] of Object.entries(record)) {
              const v = readVenue(venue)
              if (v) venues[key] = v
            }
            out.venues[cruiseId] = venues
          }
        }
      }
    }
  } catch { /* storage blocked, or a blob the app did not write: the catalogue is empty */ }
  cache = out
  return out
}

/** Writes and then drops the cache, so the next read comes off the store rather than off memory.
 *  Where the store is blocked that means the write is honestly invisible, exactly as
 *  activeCruiseId() treats a blocked store. */
function write(next: SailingStore): void {
  try { localStorage.setItem(STORAGE, JSON.stringify(next)) } catch { /* storage blocked */ }
  cache = null
}

export function allSailings(): Sailing[] {
  return read().sailings.slice()
}

export function sailingById(id: string): Sailing | undefined {
  return read().sailings.find((s) => s.id === id)
}

/** Adds the sailing, or replaces the one with its id. `updatedAt` is stamped here, so the restore
 *  merge always has a number to compare and no caller has to remember one. */
export function saveSailing(sailing: Sailing): void {
  const store = read()
  const next: Sailing = { ...sailing, updatedAt: Date.now() }
  const at = store.sailings.findIndex((s) => s.id === sailing.id)
  const sailings = at > -1
    ? store.sailings.map((s, i) => (i === at ? next : s))
    : [...store.sailings, next]
  write({ ...store, sailings, venues: { ...store.venues } })
}

/** The sailing and its venues. The drinks logged on it are the store's, so forgetSailing() runs
 *  first: by the time this returns, the venue keys it held can no longer be read. */
export function deleteSailing(id: string): void {
  const store = read()
  const venues = { ...store.venues }
  delete venues[id]
  write({ ...store, sailings: store.sailings.filter((s) => s.id !== id), venues })
}

export function venuesFor(cruiseId: string): Record<string, VenueRaw> {
  return { ...(read().venues[cruiseId] ?? {}) }
}

export function saveVenue(cruiseId: string, key: string, venue: VenueRaw): void {
  const store = read()
  write({
    ...store,
    venues: { ...store.venues, [cruiseId]: { ...(store.venues[cruiseId] ?? {}), [key]: venue } },
  })
}

export function removeVenue(cruiseId: string, key: string): void {
  const store = read()
  const venues = { ...(store.venues[cruiseId] ?? {}) }
  delete venues[key]
  write({ ...store, venues: { ...store.venues, [cruiseId]: venues } })
}

/** Random characters off the ambiguity-free alphabet. Falls back to Math.random where the Web
 *  Crypto API is absent, exactly as share.ts's genCode() does: an id nobody types is worth less
 *  than an app that throws while making one. */
function chars(n: number): string {
  const bytes = new Uint8Array(n)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256)
  let out = ''
  for (const b of bytes) out += ALPHABET[b & 31]
  return out
}

/** Unique per sailing, so the backend's per-cruise scoping does the right thing with no schema
 *  change: a user sailing's backup is simply another row under its own cruise id. */
export function newSailingId(): string {
  return 'byo-' + chars(8)
}

/** Keeps [a-z0-9] and collapses everything else to nothing, so a key is readable in a URL and in a
 *  share code. A name in a non-Latin script, or one that is only punctuation, comes out empty. */
const slug = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '')

/** 'u-' plus the slug plus four characters. The published keys are all [a-z0-9]+ with no hyphen
 *  (all 28 in raw.ts match), so 'u-' can never collide with one and isUserVenue() is a prefix test.
 *  Four characters is about a million, which is not enough to assume uniqueness on its own: the
 *  generator retries until the key is free, and after eight tries appends a second group rather
 *  than looping for ever. Renaming a venue does not change its key, so nothing logged there is
 *  orphaned. */
export function newVenueKey(cruiseId: string, name: string): string {
  const stem = 'u-' + (slug(name).slice(0, 20) || 'venue') + '-'
  const taken = venuesFor(cruiseId)
  let key = ''
  for (let i = 0; i < 8; i++) {
    key = (stem + chars(4)).toLowerCase()
    if (!taken[key]) return key
  }
  return (key + '-' + chars(4)).toLowerCase()
}

/** A venue the guest made, rather than one the sailing was published with. */
export const isUserVenue = (key: string): boolean => key.startsWith('u-')

export function exportAll(): SailingExport {
  const store = read()
  return { sailings: store.sailings.slice(), venues: { ...store.venues } }
}

export function exportSailing(id: string): SailingExport {
  const sailing = sailingById(id)
  return {
    sailings: sailing ? [sailing] : [],
    venues: sailing ? { [id]: venuesFor(id) } : {},
  }
}

/** Takes the merged catalogue as it stands. The merge itself is restore.ts's mergeSailings(), which
 *  is pure and has no localStorage of its own, so this is the one place a restored sailing lands. */
export function importSailings(list: SailingExport): void {
  const sailings: Sailing[] = []
  for (const entry of list.sailings) {
    const s = readSailing(entry)
    if (s && !sailings.some((x) => x.id === s.id)) sailings.push(s)
  }
  const venues: Record<string, Record<string, VenueRaw>> = {}
  for (const [cruiseId, record] of Object.entries(list.venues ?? {})) {
    if (!isObj(record)) continue
    const kept: Record<string, VenueRaw> = {}
    for (const [key, venue] of Object.entries(record)) {
      const v = readVenue(venue)
      if (v) kept[key] = v
    }
    venues[cruiseId] = kept
  }
  write({ v: 1, sailings, venues })
}
