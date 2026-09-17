/// <reference types="node" />
// The catalogue store, run for real. It can be loaded here at all because it reads nothing at
// module load; a localStorage stub is enough to exercise every path. The two mechanical
// requirements are restore.test.ts's: the reference above, because tsconfig.app.json restricts
// `types` to ["vite/client"], and the .ts extension on the import below, because Node ESM will not
// resolve './sailings'.
//
// localStorage is defined through Object.defineProperty rather than assigned: Node exposes it on
// globalThis as an accessor, so a plain assignment is either ignored or a throw.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allSailings, deleteSailing, exportAll, exportSailing, importSailings, isUserVenue, newSailingId,
  newVenueKey, sailingById, saveSailing, saveVenue, removeVenue, venuesFor, type Sailing,
} from './sailings.ts'
import { VENUES } from './raw.ts'

const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => { store.clear() },
  },
})

/** The module caches its read, so every case starts from an empty store through the one write path
 *  that drops that cache. */
function reset(): void {
  store.clear()
  importSailings({ sailings: [], venues: {} })
}

const sailing = (id: string, ship = 'QA Sailing'): Sailing =>
  ({ id, ship, line: 'QA Line', start: '2027-03-01', end: '2027-03-10', updatedAt: 0 })

const venue = (name: string) => ({ name, deck: 4, type: 'Bar', hours: '', blurb: '' })

test('a generated venue key never collides with a published key and never comes out as u--', () => {
  reset()
  const published = Object.keys(VENUES)
  for (const name of ['Fixture Bar One', 'Fixture Café', '!!!', 'バー', '  ', 'A']) {
    const key = newVenueKey('byo-1', name)
    assert.ok(isUserVenue(key), key + ' is not a user venue key')
    assert.equal(published.includes(key), false, key + ' collides with a published venue')
    assert.equal(key.includes('u--'), false, key + ' has an empty slug')
    assert.match(key, /^u-[a-z0-9]+-[a-z0-9]{4}$/)
  }
})

test('every published key is [a-z0-9]+, which is what makes the u- prefix safe', () => {
  for (const key of Object.keys(VENUES)) assert.match(key, /^[a-z0-9]+$/)
})

test('newVenueKey retries rather than returning a key already on that sailing', () => {
  reset()
  const real = globalThis.crypto
  // Every draw the same, so the first eight tries all produce the one key that is already taken and
  // the generator has to extend it rather than hand back a duplicate.
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    writable: true,
    value: { getRandomValues: (a: Uint8Array) => { a.fill(0); return a } },
  })
  try {
    const first = newVenueKey('byo-1', 'Fixture Bar One')
    saveVenue('byo-1', first, venue('Fixture Bar One'))
    const second = newVenueKey('byo-1', 'Fixture Bar One')
    assert.notEqual(second, first)
    assert.ok(second.startsWith(first), second + ' should extend ' + first)
    assert.equal(Object.keys(venuesFor('byo-1')).length, 1)
  } finally {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, writable: true, value: real })
  }
})

test('venuesFor returns an empty record for a cruise id it has never seen', () => {
  reset()
  assert.deepEqual(venuesFor('byo-nothing-here'), {})
  assert.deepEqual(venuesFor('sun-princess-2026'), {})
  saveVenue('byo-1', 'u-bar-aaaa', venue('Fixture Bar One'))
  assert.deepEqual(venuesFor('byo-2'), {})
  assert.equal(Object.keys(venuesFor('byo-1')).length, 1)
})

test('exportAll round-trips through importSailings', () => {
  reset()
  saveSailing(sailing('byo-1'))
  saveSailing(sailing('byo-2', 'Second Sailing'))
  saveVenue('byo-1', 'u-bar-aaaa', venue('Fixture Bar One'))
  saveVenue('byo-1', 'u-cafe-bbbb', venue('Fixture Café'))
  saveVenue('sun-princess-2026', 'u-extra-cccc', venue('Fixture Bar Two'))
  const out = exportAll()
  importSailings(out)
  assert.deepEqual(exportAll(), out)
  assert.deepEqual(allSailings().map((s) => s.id), ['byo-1', 'byo-2'])
  assert.deepEqual(Object.keys(venuesFor('byo-1')).sort(), ['u-bar-aaaa', 'u-cafe-bbbb'])
  assert.equal(venuesFor('sun-princess-2026')['u-extra-cccc'].name, 'Fixture Bar Two')
})

test('exportSailing carries one sailing with its venues, and nothing else', () => {
  reset()
  saveSailing(sailing('byo-1'))
  saveSailing(sailing('byo-2', 'Second Sailing'))
  saveVenue('byo-1', 'u-bar-aaaa', venue('Fixture Bar One'))
  saveVenue('byo-2', 'u-other-bbbb', venue('Fixture Bar Two'))
  const one = exportSailing('byo-1')
  assert.deepEqual(one.sailings.map((s) => s.id), ['byo-1'])
  assert.deepEqual(Object.keys(one.venues), ['byo-1'])
  assert.deepEqual(exportSailing('byo-missing'), { sailings: [], venues: {} })
})

test('saveSailing replaces by id and stamps updatedAt, and deleteSailing takes its venues with it', () => {
  reset()
  saveSailing(sailing('byo-1'))
  saveSailing({ ...sailing('byo-1', 'Renamed'), updatedAt: 0 })
  assert.equal(allSailings().length, 1)
  assert.equal(sailingById('byo-1')!.ship, 'Renamed')
  assert.ok(sailingById('byo-1')!.updatedAt > 0)
  saveVenue('byo-1', 'u-bar-aaaa', venue('Fixture Bar One'))
  saveVenue('byo-2', 'u-other-bbbb', venue('Fixture Bar Two'))
  deleteSailing('byo-1')
  assert.equal(sailingById('byo-1'), undefined)
  assert.deepEqual(venuesFor('byo-1'), {})
  assert.equal(venuesFor('byo-2')['u-other-bbbb'].name, 'Fixture Bar Two')
})

test('removeVenue takes one venue and leaves the rest of the sailing alone', () => {
  reset()
  saveVenue('byo-1', 'u-bar-aaaa', venue('Fixture Bar One'))
  saveVenue('byo-1', 'u-cafe-bbbb', venue('Fixture Café'))
  removeVenue('byo-1', 'u-bar-aaaa')
  assert.deepEqual(Object.keys(venuesFor('byo-1')), ['u-cafe-bbbb'])
})

test('a blocked or corrupt store reads as an empty catalogue rather than a throw', () => {
  reset()
  store.set('spcc-sailings', '{ not json at all')
  assert.deepEqual(allSailings(), [])
  assert.deepEqual(venuesFor('byo-1'), {})
})

test('a sailing id is byo- plus eight characters off the ambiguity-free alphabet', () => {
  const ids = new Set<string>()
  for (let i = 0; i < 50; i++) {
    const id = newSailingId()
    assert.match(id, /^byo-[0-9A-HJKMNP-TV-Z]{8}$/)
    ids.add(id)
  }
  assert.equal(ids.size, 50)
})
