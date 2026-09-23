/// <reference types="node" />
// The roundup's crew slides, run for real over hand-built passports. The reference and the .ts
// extension are restore.test.ts's two mechanical requirements; crewCards.ts imports types only, so
// neither the store nor the catalogue loads here.
import test from 'node:test'
import assert from 'node:assert/strict'
import { crewFavourite, nextTime, splitDecision, yourFind } from './crewCards.ts'
import type { Drink } from '../../data/model'
import type { Entry } from '../../state/stats'
import type { Source } from '../../state/social'

const drink = (id: string, name: string) => ({ id, name } as Drink)
const byId: Record<string, Drink> = Object.fromEntries(
  [['d1', 'Mai Tai'], ['d2', 'Negroni'], ['d3', 'Sidecar'], ['d4', 'Painkiller'], ['d5', 'Aviation']]
    .map(([id, name]) => [id, drink(id, name)]),
)
const src = (id: string, name: string, entries: Record<string, Entry>, isSelf = false): Source =>
  ({ id, name, colour: 'aqua', isSelf, passport: { entries, visits: {} } })

const me = src('me', 'You', {
  d1: { tried: true, rating: 5 },
  d2: { tried: true, rating: 1 },
  d3: { tried: true, rating: 4, date: '2026-10-04' },
  d4: { tried: true, rating: 4, date: '2026-10-06' },
}, true)
const sam = src('f-sam', 'Sam', {
  d1: { tried: true, rating: 5 },
  d2: { tried: true, rating: 4 },
  d5: { tried: true, rating: 5, rec: true, comment: 'Worth the walk to deck 16' },
})
const ravi = src('f-ravi', 'Ravi', {
  d1: { tried: true, rating: 4 },
  d2: { tried: true, rating: 5 },
  d3: { tried: true },
})

test('the crew favourite needs three raters in a crew of three, and four stars', () => {
  // d1 has 5, 5, 4 from all three; d2 has 1, 4, 5. d1 wins on average among the three-rater drinks.
  assert.deepEqual(crewFavourite([me, sam, ravi], byId), { name: 'Mai Tai', avg: 14 / 3, raters: 3 })
  // two people: two raters is enough, and a shared five is a favourite
  assert.deepEqual(crewFavourite([me, sam], byId), { name: 'Mai Tai', avg: 5, raters: 2 })
  // nobody else: no slide
  assert.equal(crewFavourite([me], byId), null)
  // a crew whose best average is under four has no favourite
  const lukewarm = [src('me', 'You', { d1: { rating: 3 } }, true), src('f', 'Sam', { d1: { rating: 3 } })]
  assert.equal(crewFavourite(lukewarm, byId), null)
})

test('the split is the widest gap of two stars or more, with the friend named', () => {
  assert.deepEqual(splitDecision([me, sam, ravi], byId), { name: 'Negroni', mine: 1, friend: 'Ravi', theirs: 5 })
  const close = [src('me', 'You', { d1: { rating: 4 } }, true), src('f', 'Sam', { d1: { rating: 5 } })]
  assert.equal(splitDecision(close, byId), null)
})

test('your find is loved by you and had by nobody else, the latest first on a tie', () => {
  // d3 is out, because Ravi ticked it without rating it; d4 is the only one left
  assert.deepEqual(yourFind([me, sam, ravi], byId), { name: 'Painkiller', rating: 4 })
  // without Ravi both d3 and d4 are finds at four stars; the later log wins
  assert.deepEqual(yourFind([me, sam], byId), { name: 'Painkiller', rating: 4 })
  assert.equal(yourFind([me], byId), null)
})

test('next time carries who loved it and the first note, with its author', () => {
  assert.deepEqual(nextTime({ drink: byId.d5, by: [ravi, sam] }), {
    name: 'Aviation', by: ['Ravi', 'Sam'], note: { name: 'Sam', text: 'Worth the walk to deck 16' },
  })
  assert.equal(nextTime(undefined), null)
  assert.equal(nextTime({ drink: byId.d5, by: [] }), null)
})
