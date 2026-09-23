// A time limit on every Supabase request. Pure, imports nothing, tested in timeout.test.ts;
// supabase.ts passes the wrapped fetch to createClient as `global.fetch`.
//
// With no limit, one request stalled on ship Wi-Fi held the sync round open, and every later
// trigger (the minute's interval, the return to the app, the `online` event) joined that same
// round, so the status said "Syncing…" until the browser gave up, however long that was. Now a
// stalled request fails as a network failure after 15 seconds (20 for the claim, which moves a
// whole identity in one transaction), the round is held, and the next one runs.
//
// The abort is our own AbortController's on a timer rather than AbortSignal.timeout(), for two
// reasons: the default reason is an AbortError, which postgrest-js treats as final, where the
// TimeoutError AbortSignal.timeout() raises sends a GET into postgrest-js's retry loop with a fresh
// limit each time; and the caller's own signal is joined by a listener, since AbortSignal.any() is
// missing from iOS before 17.4.

export const REQUEST_TIMEOUT_MS = 15_000
export const CLAIM_TIMEOUT_MS = 20_000

/** The limit for one request, by its URL. */
export function timeoutFor(url: string): number {
  return url.includes('/rpc/claim_recovery') ? CLAIM_TIMEOUT_MS : REQUEST_TIMEOUT_MS
}

const urlOf = (input: RequestInfo | URL): string =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

/** `base`, with each request aborted once its limit passes. The timer is cleared as soon as the
 *  response arrives (or the request fails), so nothing is left running behind it. */
export function withTimeout(
  base: typeof fetch,
  limit: (url: string) => number = timeoutFor,
): typeof fetch {
  return (input, init) => {
    const controller = new AbortController()
    const outer = init?.signal
    const follow = () => controller.abort(outer?.reason)
    if (outer?.aborted) follow()
    else outer?.addEventListener('abort', follow, { once: true })
    const timer = setTimeout(() => controller.abort(), limit(urlOf(input)))
    const done = () => { clearTimeout(timer); outer?.removeEventListener('abort', follow) }
    let pending: Promise<Response>
    try {
      pending = base(input, { ...init, signal: controller.signal })
    } catch (e) {
      done()
      return Promise.reject(e)
    }
    return pending.then(
      (res) => { done(); return res },
      (err: unknown) => { done(); throw err },
    )
  }
}
