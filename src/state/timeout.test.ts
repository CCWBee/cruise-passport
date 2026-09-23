/// <reference types="node" />
// The request time limit, run for real under `node --test` (see restore.test.ts for the two lines).
import test from 'node:test'
import assert from 'node:assert/strict'
import { CLAIM_TIMEOUT_MS, REQUEST_TIMEOUT_MS, timeoutFor, withTimeout } from './timeout.ts'

/** A fetch that never answers on its own and rejects the way a browser's does when aborted. */
const stalled = (seen?: { signal?: AbortSignal | null }): typeof fetch => (_input, init) => {
  if (seen) seen.signal = init?.signal
  return new Promise<Response>((_, reject) => {
    const signal = init?.signal
    const fail = () => reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'))
    if (signal?.aborted) fail()
    else signal?.addEventListener('abort', fail, { once: true })
  })
}

test('the claim gets 20 seconds and every other request 15', () => {
  assert.equal(REQUEST_TIMEOUT_MS, 15_000)
  assert.equal(CLAIM_TIMEOUT_MS, 20_000)
  assert.equal(timeoutFor('https://x.supabase.co/rest/v1/rpc/claim_recovery'), 20_000)
  assert.equal(timeoutFor('https://x.supabase.co/rest/v1/rpc/friend_feed'), 15_000)
  assert.equal(timeoutFor('https://x.supabase.co/rest/v1/profiles?on_conflict=user_id'), 15_000)
  assert.equal(timeoutFor('https://x.supabase.co/auth/v1/token?grant_type=refresh_token'), 15_000)
})

test('a stalled request fails as an AbortError once its limit passes', async () => {
  const f = withTimeout(stalled(), () => 30)
  const started = Date.now()
  await assert.rejects(f('https://x.supabase.co/rest/v1/rpc/friend_feed'), (e: unknown) => (e as Error).name === 'AbortError')
  assert.ok(Date.now() - started >= 25)
})

test('the limit is read from the URL of each request', async () => {
  const asked: string[] = []
  const f = withTimeout(stalled(), (url) => { asked.push(url); return 5 })
  await assert.rejects(f(new URL('https://x.supabase.co/rest/v1/rpc/claim_recovery')))
  await assert.rejects(f(new Request('https://x.supabase.co/rest/v1/backups')))
  assert.deepEqual(asked, ['https://x.supabase.co/rest/v1/rpc/claim_recovery', 'https://x.supabase.co/rest/v1/backups'])
})

test('an answer in time passes through untouched, and its timer is cleared', async () => {
  const ok = new Response('[]', { status: 200 })
  let aborted = false
  const f = withTimeout(async (_i, init) => {
    init?.signal?.addEventListener('abort', () => { aborted = true })
    return ok
  }, () => 20)
  assert.equal(await f('https://x.supabase.co/rest/v1/rpc/friend_feed'), ok)
  await new Promise((r) => setTimeout(r, 40))
  assert.equal(aborted, false)
})

test('a failure in time passes through as it came', async () => {
  const f = withTimeout(async () => { throw new TypeError('Failed to fetch') }, () => 1_000)
  await assert.rejects(f('https://x.supabase.co/rest/v1/rpc/friend_feed'), { name: 'TypeError', message: 'Failed to fetch' })
})

test("the caller's own signal still aborts the request", async () => {
  const seen: { signal?: AbortSignal | null } = {}
  const caller = new AbortController()
  const f = withTimeout(stalled(seen), () => 60_000)
  const pending = f('https://x.supabase.co/rest/v1/rpc/friend_feed', { signal: caller.signal })
  caller.abort(new DOMException('Caller gave up', 'AbortError'))
  await assert.rejects(pending, { message: 'Caller gave up' })
  assert.notEqual(seen.signal, caller.signal) // the wrapper's own signal, following the caller's
})

test('a signal already aborted aborts at once', async () => {
  const caller = new AbortController()
  caller.abort()
  const f = withTimeout(stalled(), () => 60_000)
  await assert.rejects(f('https://x.supabase.co/rest/v1/rpc/friend_feed', { signal: caller.signal }))
})
