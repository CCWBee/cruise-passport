/// <reference types="node" />
// The session decision, run for real under `node --test` (see restore.test.ts for the two lines).
import test from 'node:test'
import assert from 'node:assert/strict'
import { judgeRestore, planSession, type SessionFacts } from './session.ts'

const facts = (o: Partial<SessionFacts> = {}): SessionFacts => ({
  live: false, stored: false, kept: false, known: false, retired: false, ...o,
})

test('a live session is used, for every purpose', () => {
  for (const purpose of ['sync', 'erase', 'claim'] as const) {
    assert.equal(planSession(facts({ live: true, kept: true, known: true }), purpose), 'use')
  }
})

test('only a phone that never had a user mints one to sync', () => {
  assert.equal(planSession(facts(), 'sync'), 'mint')
  assert.equal(planSession(facts({ known: true }), 'sync'), 'moved')
})

test('a session the library still stores, but will not hand over, holds the round', () => {
  assert.equal(planSession(facts({ stored: true, kept: true, known: true }), 'sync'), 'wait')
  assert.equal(planSession(facts({ stored: true }), 'erase'), 'wait')
  assert.equal(planSession(facts({ stored: true }), 'claim'), 'wait')
})

test('a session the library removed is put back from the kept copy', () => {
  assert.equal(planSession(facts({ kept: true, known: true }), 'sync'), 'restore')
  assert.equal(planSession(facts({ kept: true }), 'erase'), 'restore')
  assert.equal(planSession(facts({ kept: true }), 'claim'), 'restore')
})

test('erasing never creates a session', () => {
  assert.equal(planSession(facts(), 'erase'), 'nothing')
  assert.equal(planSession(facts({ known: true }), 'erase'), 'nothing')
  assert.equal(planSession(facts({ retired: true, live: true }), 'erase'), 'nothing')
})

test('a retired identity stops syncing, but may still claim', () => {
  assert.equal(planSession(facts({ retired: true }), 'sync'), 'moved')
  assert.equal(planSession(facts({ retired: true, live: true }), 'sync'), 'moved')
  assert.equal(planSession(facts({ retired: true, known: true }), 'claim'), 'mint')
  assert.equal(planSession(facts({ retired: true, live: true }), 'claim'), 'use')
})

test('a claim mints on a fresh phone', () => {
  assert.equal(planSession(facts(), 'claim'), 'mint')
  assert.equal(planSession(facts({ known: true }), 'claim'), 'mint')
})

test('no error restores', () => {
  assert.equal(judgeRestore(null), 'ok')
  assert.equal(judgeRestore(undefined), 'ok')
})

test('a network failure, a timeout, a 5xx or a captive portal holds', () => {
  assert.equal(judgeRestore({ name: 'AuthRetryableFetchError', status: 0 }), 'held')
  assert.equal(judgeRestore({ name: 'AuthRetryableFetchError', status: 503 }), 'held')
  assert.equal(judgeRestore({ name: 'AuthUnknownError' }), 'held') // non-JSON 4xx
  assert.equal(judgeRestore({ name: 'AuthApiError', status: 429, code: 'over_request_rate_limit' }), 'held')
  assert.equal(judgeRestore({ name: 'AuthRefreshDiscardedError', status: 409 }), 'held')
  assert.equal(judgeRestore({ name: 'AuthApiError', status: 408, code: 'request_timeout' }), 'held')
  assert.equal(judgeRestore({ name: 'Error' }), 'held')
})

test('only a definite answer that the identity is gone retires it', () => {
  assert.equal(judgeRestore({ name: 'AuthApiError', status: 400, code: 'refresh_token_not_found' }), 'gone')
  assert.equal(judgeRestore({ name: 'AuthApiError', status: 403, code: 'user_not_found' }), 'gone')
  assert.equal(judgeRestore({ name: 'AuthApiError', status: 403, code: 'session_not_found' }), 'gone')
  assert.equal(judgeRestore({ name: 'AuthSessionMissingError', status: 400 }), 'gone')
  assert.equal(judgeRestore({ name: 'AuthApiError', status: 401, code: 'bad_jwt' }), 'gone')
})

test('a refresh token refused for good is gone too, or the phone would hold for ever', () => {
  assert.equal(judgeRestore({ name: 'AuthApiError', status: 400, code: 'refresh_token_already_used' }), 'gone')
  assert.equal(judgeRestore({ name: 'AuthApiError', status: 403, code: 'session_expired' }), 'gone')
  assert.equal(judgeRestore({ name: 'AuthApiError', status: 403, code: 'user_banned' }), 'gone')
  // but not a rate limit, whatever it is called
  assert.equal(judgeRestore({ name: 'AuthApiError', status: 429 }), 'held')
})
