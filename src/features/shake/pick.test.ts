/// <reference types="node" />
// The shaker's pick, run for real. It imports nothing but itself, so there is no stub to build here;
// the two mechanical requirements are sailings.test.ts's: the reference above, because
// tsconfig.app.json restricts `types` to ["vite/client"], and the .ts extension on the import below,
// because Node ESM will not resolve './pick'.
import test from 'node:test'
import assert from 'node:assert/strict'
import { RECENT_KEPT, shake, type ShakeCandidate, type ShakeInput } from './pick.ts'

const drink = (id: string, spirits: string[] = ['Gin']): ShakeCandidate =>
  ({ id, name: id.toUpperCase(), venue: 'omalleys', category: 'Signature', spirits })

/** A fixed sequence, so every draw below is stated rather than hoped for. It repeats its last value
 *  once exhausted, which keeps a test that shakes more often than it planned honest rather than
 *  NaN. */
const seq = (...values: number[]): (() => number) => {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

const input = (over: Partial<ShakeInput> = {}): ShakeInput => ({
  drinks: [drink('a'), drink('b'), drink('c')],
  entries: {},
  forYou: [],
  recent: [],
  random: () => 0,
  ...over,
})

test('no drinks at all: null, the defence behind the hidden row', () => {
  assert.equal(shake(input({ drinks: [] })), null)
})

test('only untried drinks are candidates, and a rated one counts as had', () => {
  const out = shake(input({
    entries: { a: { tried: true }, b: { rating: 3 } },
    random: () => 0,
  }))
  assert.equal(out?.id, 'c')
  assert.equal(out?.allTried, false)
})

test('a drink revealed this session is avoided while another candidate exists', () => {
  const out = shake(input({ recent: ['a'], random: () => 0 }))
  assert.equal(out?.id, 'b')
})

test('the recent guard yields rather than leaving nothing to say', () => {
  const out = shake(input({ recent: ['a', 'b', 'c'], random: () => 0 }))
  assert.equal(out?.id, 'a')
})

test('a "For you" pick carries weight 4 and that shelf entry\'s own reason', () => {
  // bands over a total of 6: a is [0, 1), b is [1, 2), c is [2, 6)
  const out = shake(input({
    forYou: [{ id: 'c', reason: 'Sam loved it' }],
    random: () => 0.5,
  }))
  assert.equal(out?.id, 'c')
  assert.equal(out?.reason, 'Sam loved it')
})

// The spirits come off the catalogue, so a rating on a drink this sailing does not carry says
// nothing about the guest's taste and is not counted. These three are in the list and rated, which
// is also why they are not candidates.
const RATED_GINS = [drink('g1'), drink('g2'), drink('g3')]
const THREE_FIVES = { g1: { rating: 5 }, g2: { rating: 4 }, g3: { rating: 4 } }

test('the top spirit carries weight 2 and names itself, lower-cased', () => {
  const out = shake(input({
    drinks: [...RATED_GINS, drink('a', ['Rum']), drink('b', ['Gin'])],
    entries: THREE_FIVES,
    // bands over a total of 3: a is [0, 1), b is [1, 3)
    random: () => 0.99,
  }))
  assert.equal(out?.id, 'b')
  assert.equal(out?.reason, 'Because you love gin')
})

test('wine and beer are never the top spirit', () => {
  const out = shake(input({
    drinks: [drink('w1', ['Wine']), drink('w2', ['Wine']), drink('w3', ['Wine']), drink('a', ['Wine'])],
    entries: { w1: { rating: 5 }, w2: { rating: 5 }, w3: { rating: 5 } },
    random: () => 0,
  }))
  assert.equal(out?.id, 'a')
  assert.equal(out?.reason, 'One you have not tried')
})

test('two of a spirit is not a taste: the fallback reason stands', () => {
  const out = shake(input({
    drinks: [drink('g1'), drink('g2'), drink('a', ['Gin'])],
    entries: { g1: { rating: 5 }, g2: { rating: 4 } },
    random: () => 0,
  }))
  assert.equal(out?.id, 'a')
  assert.equal(out?.reason, 'One you have not tried')
})

test('the draw walks the weighted bands: 4 for the shelf, 2 for the spirit, 1 for the rest', () => {
  const base: Partial<ShakeInput> = {
    drinks: [...RATED_GINS, drink('a', ['Rum']), drink('b', ['Gin']), drink('c', ['Rum'])],
    entries: THREE_FIVES,
    forYou: [{ id: 'a', reason: 'Sam matches your taste' }],
  }
  // bands over a total of 7: a is [0, 4), b is [4, 6), c is [6, 7)
  assert.equal(shake({ ...input(base), random: () => 0.1 })?.id, 'a')
  assert.equal(shake({ ...input(base), random: () => 0.8 })?.id, 'b')
  assert.equal(shake({ ...input(base), random: () => 0.99 })?.id, 'c')
  // a random() that returns exactly 1 still lands on a real drink
  assert.equal(shake({ ...input(base), random: () => 1 })?.id, 'c')
})

test('the same sequence gives the same answers', () => {
  const runs = [0, 1].map(() => {
    const random = seq(0.1, 0.8, 0.99)
    return [0, 1, 2].map(() => shake(input({ random }))?.id)
  })
  assert.deepEqual(runs[0], runs[1])
})

test('every drink tried: the highest rated, and the button says so', () => {
  const out = shake(input({
    entries: { a: { tried: true, rating: 3 }, b: { tried: true, rating: 5 }, c: { tried: true, rating: 4 } },
  }))
  assert.equal(out?.id, 'b')
  assert.equal(out?.allTried, true)
  assert.equal(out?.reason, 'You have tried them all. Have another.')
})

test('every drink tried, ratings level: the tie goes to the latest date', () => {
  const out = shake(input({
    entries: {
      a: { tried: true, rating: 5, date: '2026-10-04' },
      b: { tried: true, rating: 5, date: '2026-10-09' },
      c: { tried: true, rating: 5, date: '2026-10-06' },
    },
  }))
  assert.equal(out?.id, 'b')
})

test('every drink tried and none rated: still an answer, not a null', () => {
  const out = shake(input({
    entries: { a: { tried: true }, b: { tried: true }, c: { tried: true, date: '2026-10-08' } },
  }))
  assert.equal(out?.id, 'c')
  assert.equal(out?.allTried, true)
})

test('the session remembers six reveals', () => {
  assert.equal(RECENT_KEPT, 6)
})
