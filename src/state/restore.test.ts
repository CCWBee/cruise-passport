/// <reference types="node" />
// The restore merge, run for real. Node 22 strips TypeScript natively and ships node:test, so this
// needs no runner and no devDependency: `node --test src/state/restore.test.ts`.
// Two mechanical requirements, both learned by running it. The reference above is not optional:
// tsconfig.app.json restricts `types` to ["vite/client"], so without it tsc reports
// "Cannot find module 'node:test'" for a file its `include` already picks up. And the import below
// carries its .ts extension, because Node ESM will not resolve './restore' and
// allowImportingTsExtensions is what lets tsc accept the extension.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isUntouched, mergeCustom, mergeEntry, mergeProfile, mergeRestore, mergeVisits,
  readBackup, readOAuthError, type BackupState,
} from './restore.ts'
import type { Drink } from '../data/model'
import type { Passport, Profile } from './stats'

const drink = (id: string, name: string): Drink => ({
  id, name, venue: 'crooners', category: 'Cocktail', spirits: [], ingredients: '', flavors: [],
  sweet: 1, strength: 1, frozen: false, price: null, desc: '', verified: false,
  plus: null, premier: null, extra: null,
})
const empty = (): Passport => ({ entries: {}, visits: {} })
const state = (o: Partial<BackupState> = {}): BackupState => ({
  me: o.me ?? empty(),
  custom: o.custom ?? [],
  profile: o.profile ?? { id: '', name: '', colour: 'aqua' },
})

test('isUntouched counts drinks, venues, custom drinks, crew and groups, and nothing else', () => {
  const bare = { me: empty(), custom: [] as unknown[], friends: [] as unknown[], groups: [] as unknown[] }
  assert.equal(isUntouched(bare), true)
  assert.equal(isUntouched({ ...bare, me: { entries: { d1: { tried: true } }, visits: {} } }), false)
  assert.equal(isUntouched({ ...bare, me: { entries: {}, visits: { crooners: { visited: true } } } }), false)
  assert.equal(isUntouched({ ...bare, custom: [{}] }), false)
  assert.equal(isUntouched({ ...bare, friends: [{}] }), false)
  assert.equal(isUntouched({ ...bare, groups: [{}] }), false)
})

test('an untouched phone takes the backup wholesale', () => {
  const remote = state({
    me: {
      entries: { d1: { tried: true, date: '2026-10-04', rating: 4 } },
      visits: { crooners: { visited: true, date: '2026-10-04' } },
    },
    custom: [drink('c1', 'House negroni')],
    profile: { id: 'u1', name: 'Isabel', colour: 'melon', code: 'ABCD-EFGH' },
  })
  const r = mergeRestore(state(), remote, { untouched: true })
  assert.deepEqual(r.me, remote.me)
  assert.deepEqual(r.custom, remote.custom)
  assert.equal(r.profile.name, 'Isabel')
  assert.equal(r.profile.colour, 'melon')
  assert.equal(r.profile.id, 'u1')
  assert.equal(r.adopted, 1)
})

test('a tie on the date leaves the entry with this phone', () => {
  const r = mergeEntry({ tried: true, date: '2026-10-05', rating: 5 }, { tried: true, date: '2026-10-05', rating: 2 })
  assert.equal(r.rating, 5)
  const undated = mergeEntry({ tried: true, rating: 5 }, { tried: true, rating: 2 })
  assert.equal(undated.rating, 5)
})

test('the later date wins a conflicting rating', () => {
  const r = mergeEntry({ tried: true, date: '2026-10-04', rating: 5 }, { tried: true, date: '2026-10-06', rating: 2 })
  assert.equal(r.rating, 2)
})

test('a dated entry beats an undated one, whichever side holds it', () => {
  assert.equal(mergeEntry({ rating: 5 }, { date: '2026-10-04', rating: 2 }).rating, 2)
  assert.equal(mergeEntry({ date: '2026-10-04', rating: 5 }, { rating: 2 }).rating, 5)
})

test('a field only the losing side holds survives', () => {
  const r = mergeEntry(
    { tried: true, date: '2026-10-04', notes: 'the good one', comment: 'lovely' },
    { tried: true, date: '2026-10-06', rating: 3 },
  )
  assert.equal(r.rating, 3)             // the winner's field
  assert.equal(r.notes, 'the good one') // the loser's, kept
  assert.equal(r.comment, 'lovely')
})

test('tried is never untried, whichever side is newer', () => {
  assert.equal(mergeEntry({ tried: true, date: '2026-10-04' }, { tried: false, date: '2026-10-06' }).tried, true)
  assert.equal(mergeEntry({ tried: false, date: '2026-10-06' }, { tried: true, date: '2026-10-04' }).tried, true)
})

test('a visit takes the earlier date, and either side visiting makes it visited', () => {
  const both = mergeVisits({ crooners: { visited: true, date: '2026-10-09' } }, { crooners: { visited: false, date: '2026-10-04' } })
  assert.deepEqual(both.crooners, { visited: true, date: '2026-10-04' })
  const oneSided = mergeVisits({ themix: { visited: true } }, { themix: { date: '2026-10-02' } })
  assert.deepEqual(oneSided.themix, { visited: true, date: '2026-10-02' })
})

test('custom drinks union by id, this phone first', () => {
  const r = mergeCustom([drink('c1', 'Mine'), drink('c2', 'Also mine')], [drink('c2', 'Theirs'), drink('c3', 'New')])
  assert.deepEqual(r.map((d) => d.id), ['c1', 'c2', 'c3'])
  assert.equal(r[1].name, 'Also mine')
})

test('two rows under one id are one drink, whichever side carries them', () => {
  // The backup is untrusted JSON and nothing upstream promises its ids are distinct. The id decides
  // and the first row stands, or allDrinks() would list one custom drink twice and the badge pass
  // would count it twice.
  const withinRemote = mergeCustom([], [drink('c9', 'A'), drink('c9', 'B')])
  assert.deepEqual(withinRemote.map((d) => d.id), ['c9'])
  assert.equal(withinRemote[0].name, 'A')
  const wholesale = mergeRestore(state(), state({ custom: [drink('c9', 'A'), drink('c9', 'B')] }), { untouched: true })
  assert.deepEqual(wholesale.custom.map((d) => d.id), ['c9'])
})

test('readBackup drops a duplicate id, so the sanitiser covers the wholesale path too', () => {
  const ok = readBackup({
    me: { entries: {}, visits: {} },
    custom: [{ id: 'c9', name: 'First' }, { id: 'c9', name: 'Second' }],
  })
  assert.ok(ok)
  assert.deepEqual(ok.custom.map((d) => d.name), ['First'])
})

test('the name comes from the backup only when this phone has none, and the colour follows it', () => {
  const backup: Profile = { id: 'u1', name: 'Isabel', colour: 'melon' }
  const named = mergeProfile({ id: '', name: 'Alex', colour: 'lime' }, backup)
  assert.equal(named.name, 'Alex')
  assert.equal(named.colour, 'lime')
  assert.equal(named.id, 'u1')          // the id is the identity being restored, so it is adopted
  const blank = mergeProfile({ id: '', name: '  ', colour: 'aqua' }, backup)
  assert.equal(blank.name, 'Isabel')
  assert.equal(blank.colour, 'melon')
})

test('a canonical code beats the backup code, and codeChanged reports the difference', () => {
  const local = state({ profile: { id: '', name: 'Alex', colour: 'aqua', code: 'AAAA-1111' } })
  const remote = state({ profile: { id: 'u1', name: 'Alex', colour: 'aqua', code: 'BBBB-2222' } })
  const renamed = mergeRestore(local, remote, { untouched: false, canonicalCode: 'CCCC-3333' })
  assert.equal(renamed.profile.code, 'CCCC-3333')
  assert.equal(renamed.codeChanged, true)
  const unchanged = mergeRestore(local, state({ profile: { ...local.profile } }), { untouched: false })
  assert.equal(unchanged.profile.code, 'AAAA-1111')
  assert.equal(unchanged.codeChanged, false)
})

test('adopted counts newly tried drinks and ignores a wishlist-only entry', () => {
  const local = state({ me: { entries: { d1: { tried: true, date: '2026-10-04' } }, visits: {} } })
  const remote = state({
    me: {
      entries: {
        d1: { tried: true, date: '2026-10-04' }, // already had, on both sides
        d2: { tried: true, date: '2026-10-05' }, // a drink genuinely brought back
        d3: { wish: true },                      // never drunk by anybody, so never counted
      },
      visits: {},
    },
  })
  assert.equal(mergeRestore(local, remote, { untouched: false }).adopted, 1)
})

test('readBackup refuses anything that is not a passport', () => {
  assert.equal(readBackup(null), null)
  assert.equal(readBackup('SPPAeyJ2Ijoy'), null)
  assert.equal(readBackup([]), null)
  assert.equal(readBackup({}), null)
  assert.equal(readBackup({ me: { entries: {} } }), null)              // no visits
  assert.equal(readBackup({ me: { entries: [], visits: {} } }), null)  // entries is not an object
})

test('readBackup rebuilds field by field, so a retired profile field is dropped', () => {
  const ok = readBackup({
    me: {
      entries: { d1: { tried: true, date: '2026-10-04', invented: 'nonsense' } },
      visits: { crooners: { visited: true } },
    },
    custom: [{ id: 'c1', name: 'House negroni' }, { name: 'no id at all' }],
    profile: { id: 'u1', name: 'Isabel', colour: 'melon', code: 'ABCD-EFGH', groupCode: 'GONE', syncUrl: 'https://gone' },
  })
  assert.ok(ok)
  assert.deepEqual(ok.me.entries.d1, { tried: true, date: '2026-10-04' })
  assert.deepEqual(Object.keys(ok.profile).sort(), ['code', 'colour', 'id', 'name'])
  assert.deepEqual(ok.custom.map((d) => d.id), ['c1'])  // a drink with no id cannot be logged against
})

test('readOAuthError reads the fragment and the query, and leaves a share code alone', () => {
  const wanted = { code: 'identity_already_exists', description: 'x' }
  assert.deepEqual(readOAuthError('#error=server_error&error_code=identity_already_exists&error_description=x', ''), wanted)
  assert.deepEqual(readOAuthError('', '?error=server_error&error_code=identity_already_exists&error_description=x'), wanted)
  assert.equal(readOAuthError('#SPPAeyJ2Ijoy', ''), null)
  assert.equal(readOAuthError('', ''), null)
})
