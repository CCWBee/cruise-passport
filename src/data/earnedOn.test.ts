/// <reference types="node" />
// The day a medal was struck, run for real. The reference is there because tsconfig.app.json
// restricts `types` to ["vite/client"], and the .ts extension on the import because Node ESM will
// not resolve './earnedOn' (sailings.test.ts has the same two). The stat computation is a stand-in
// with computeStats' shape, since stats.ts cannot be loaded under node --test; earnedOn takes it as
// a parameter for that reason.
import test from 'node:test'
import assert from 'node:assert/strict'
import { earnedOn } from './earnedOn.ts'
import type { BadgeStat } from './badges'
import type { Entry, Passport, VenueVisit } from '../state/stats'

const GIN = new Set(['a', 'b', 'c', 'd'])
const VENUES = ['crooners', 'ocean', 'bellini']

function statOf(p: Passport): BadgeStat {
  const tried = Object.keys(p.entries).filter((id) => p.entries[id].tried)
  const venues = VENUES.filter((k) => p.visits[k]?.visited).length
  return {
    n: tried.length, venues, totalVenues: VENUES.length, pct: (tried.length / 10) * 100,
    frozenDone: false,
    cat: () => 0,
    catDone: () => false,
    sp: (x) => (x === 'Gin' ? tried.filter((id) => GIN.has(id)).length : 0),
  }
}

const on = (date?: string): Entry => ({ tried: true, date })
const visit = (date?: string): VenueVisit => ({ visited: true, date })
const passport = (entries: Record<string, Entry>, visits: Record<string, VenueVisit> = {}): Passport =>
  ({ entries, visits })

const three = { test: (s: BadgeStat) => s.n >= 3 }
const twoGins = { test: (s: BadgeStat) => s.sp('Gin') >= 2 }
const everyBar = { test: (s: BadgeStat) => s.venues >= s.totalVenues }

test('the day the count is crossed, not the day of the last drink', () => {
  const p = passport({ a: on('2026-10-03'), x: on('2026-10-04'), y: on('2026-10-04'), z: on('2026-10-06') })
  assert.equal(earnedOn(three, p, statOf), '2026-10-04')
})

test('the passport holds its keys in the order they were written, and the replay reads them by date', () => {
  const p = passport({ z: on('2026-10-09'), a: on('2026-10-05'), b: on('2026-10-07'), y: on('2026-10-03') })
  assert.equal(earnedOn(twoGins, p, statOf), '2026-10-07')
})

test('a check-in counts on its own day, so Every Bar is struck by the last visit', () => {
  const p = passport(
    { a: on('2026-10-03') },
    { crooners: visit('2026-10-03'), ocean: visit('2026-10-05'), bellini: visit('2026-10-08') },
  )
  assert.equal(earnedOn(everyBar, p, statOf), '2026-10-08')
})

test('an entry that is no longer ticked plays no part', () => {
  const p = passport({ a: on('2026-10-03'), b: { tried: false, date: '2026-10-04' }, c: on('2026-10-06') })
  assert.equal(earnedOn(twoGins, p, statOf), '2026-10-06')
})

test('a badge not earned has no day', () => {
  assert.equal(earnedOn(three, passport({ a: on('2026-10-03') }), statOf), null)
  assert.equal(earnedOn(three, passport({}), statOf), null)
})

test('earned only with an undated drink, the day cannot be known and none is named', () => {
  const p = passport({ a: on('2026-10-03'), b: on('2026-10-04'), c: on() })
  assert.equal(three.test(statOf(p)), true)
  assert.equal(earnedOn(three, p, statOf), null)
})

test('an undated drink does not stop a badge the dated record earns by itself', () => {
  const p = passport({ q: on(), a: on('2026-10-03'), b: on('2026-10-04'), c: on('2026-10-05') })
  assert.equal(earnedOn(three, p, statOf), '2026-10-05')
})
