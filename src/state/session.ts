// Which session a call runs under, decided from what the phone holds. Pure, imports nothing, tested
// in session.test.ts; backend.ts gathers the facts and acts on the answer.
//
// Why it exists (docs/audits/2026-09-23-live-readiness.md, accounts and offline): once the access
// token has expired, auth-js 2.112.4 removes the stored session when a refresh fails with anything
// it does not count as retryable (a 4xx, or a non-JSON answer such as a captive portal's), and for
// 60 seconds after a retryable failure getSession() answers null while the session is still stored.
// The old ensureSession() read either as "no session" and signed in a new anonymous user, whose
// profile write then failed for ever on the unique friend code and whose first pull emptied the
// crew. Now a phone mints a user only if it never had one; a session the library dropped is put
// back from the copy supabase.ts keeps; and only a definite "that user or token no longer exists"
// retires the identity, after which the phone stops rather than minting a rival.

/** Why a session is wanted. `erase` never creates one (a phone with no session has nothing on the
 *  server), and `claim` may create one even on a retired phone, because the claim moves the old
 *  identity into it. */
export type SessionPurpose = 'sync' | 'erase' | 'claim'

export interface SessionFacts {
  /** getSession() answered with a session. */
  live: boolean
  /** The library's own storage key still holds a session although getSession() said none: a
   *  refresh has just failed and the library is waiting before it tries again. */
  stored: boolean
  /** The copy supabase.ts keeps when the library removes the session itself. */
  kept: boolean
  /** This phone has published under a user id before (the store's `syncUid`). */
  known: boolean
  /** A definite answer has already said this identity is gone. */
  retired: boolean
}

/** use: the live session. wait: hold this round, the library will retry. restore: put the kept copy
 *  back (setSession). mint: sign in a new anonymous user. moved: the identity is gone; stop and say
 *  so. nothing: there is no session and none is wanted. */
export type SessionPlan = 'use' | 'wait' | 'restore' | 'mint' | 'moved' | 'nothing'

export function planSession(f: SessionFacts, purpose: SessionPurpose): SessionPlan {
  if (f.retired && purpose !== 'claim') return purpose === 'erase' ? 'nothing' : 'moved'
  if (f.live) return 'use'
  if (f.stored) return 'wait'
  if (f.kept) return 'restore'
  if (purpose === 'erase') return 'nothing'
  if (purpose === 'claim') return 'mint'
  // A phone that has published before and now holds no session of any kind cannot get its user
  // back, and a new one would fight the old one for the friend code.
  return f.known ? 'moved' : 'mint'
}

/** The parts of an auth-js error the verdict reads. */
export interface AuthErrorLike { name?: string; code?: string; status?: number }

export type RestoreVerdict = 'ok' | 'held' | 'gone'

// What GoTrue says when the refresh token, the user or the session no longer exists. auth-js turns
// session_not_found into an AuthSessionMissingError with no code (lib/fetch.js), so that name is
// read as well.
const GONE_CODES: readonly string[] = ['refresh_token_not_found', 'user_not_found', 'session_not_found']

/** What an attempt to put the kept session back means. A network failure, a timeout, a 5xx, a rate
 *  limit or a non-JSON answer is `held`: keep the copy and try again next round. Only a definite
 *  answer that the token, the user or the session is gone, or a 401 from the API, is `gone`. */
export function judgeRestore(error: AuthErrorLike | null | undefined): RestoreVerdict {
  if (!error) return 'ok'
  if (error.name === 'AuthRetryableFetchError') return 'held'
  if (error.code && GONE_CODES.includes(error.code)) return 'gone'
  if (error.name === 'AuthSessionMissingError') return 'gone'
  if (error.name === 'AuthApiError' && error.status === 401) return 'gone'
  return 'held'
}
