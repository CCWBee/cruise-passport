/// <reference types="node" />
// The search's lists, run for real. The reference is there because tsconfig.app.json restricts
// `types` to ["vite/client"], and the .ts extension on the import because Node ESM will not resolve
// './lists' (sailings.test.ts has the same two).
import test from 'node:test'
import assert from 'node:assert/strict'
import { byVenue, emptyLists, rankMatches, type LogCandidate } from './lists.ts'

const d = (id: string, name: string, venue = 'crooners'): LogCandidate => ({ id, name, venue })

test('the empty field lists what is left at the bar, then the wishlist without repeating it', () => {
  const menu = [d('a', 'Aperol Spritz'), d('b', 'Bellini'), d('c', 'Cosmopolitan')]
  const all = [...menu, d('m', 'Mai Tai', 'ocean'), d('n', 'Negroni', 'ocean')]
  const entries = { a: { tried: true }, c: { wish: true }, m: { wish: true }, n: { wish: true, tried: true } }
  const { still, wish } = emptyLists(menu, all, entries)
  assert.deepEqual(still.map((x) => x.id), ['b', 'c'])
  // Cosmopolitan is on the bar's list already; Negroni is wished for but tried
  assert.deepEqual(wish.map((x) => x.id), ['m'])
})

test('with no bar the empty field is the wishlist alone', () => {
  const all = [d('a', 'Aperol Spritz'), d('m', 'Mai Tai', 'ocean')]
  const { still, wish } = emptyLists(null, all, { a: { wish: true } })
  assert.deepEqual(still, [])
  assert.deepEqual(wish.map((x) => x.id), ['a'])
})

test('a typed search puts names that start with the query first, keeps order within each half, and caps', () => {
  const list = [d('1', 'Classic Mojito'), d('2', 'Mojito Royale'), d('3', 'Rum Punch'), d('4', 'Mojo')]
  assert.deepEqual(rankMatches(list, ' MOJ ').map((x) => x.id), ['2', '4', '1', '3'])
  assert.equal(rankMatches(list, 'mo', 2).length, 2)
  assert.deepEqual(rankMatches(list, '').map((x) => x.id), ['1', '2', '3', '4'])
})

test('matches group under their venue in the order of each venue\'s best match', () => {
  const ranked = [d('1', 'Mojito', 'ocean'), d('2', 'Mojo', 'crooners'), d('3', 'Classic Mojito', 'ocean')]
  assert.deepEqual(byVenue(ranked).map((g) => [g.venue, g.list.map((x) => x.id)]), [['ocean', ['1', '3']], ['crooners', ['2']]])
})
