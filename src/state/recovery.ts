// The recovery code: the one secret that brings a passport back on a new phone, or in the app on
// the home screen, with no account. Pure, and it imports nothing, so recovery.test.ts runs it under
// `node --test` exactly as the phone does (restore.ts explains why a module here must not import a
// runtime value: data/model.ts reads `location` at load). sync.ts owns the calls; this file owns the
// secret.
//
// 20 characters of Crockford base32 (no I, L, O or U), 5 bits each, so 100 bits: nobody guesses one
// and nothing on the server needs a rate limit. Made on the phone with crypto.getRandomValues, kept
// in the store, shown in groups of four. The server holds only its SHA-256 (supabase/migrations/
// 0004_recovery.sql), and it normalises a typed code the same way normaliseSecret does.

// The friend code's alphabet (share.ts), repeated rather than imported, for the reason above.
export const RECOVERY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const RECOVERY_LENGTH = 20

/** A new secret. 256 is a multiple of 32, so taking the low five bits of each byte is unbiased. */
export function generateSecret(
  random: (bytes: Uint8Array<ArrayBuffer>) => Uint8Array = (b) => crypto.getRandomValues(b),
): string {
  const bytes = random(new Uint8Array(RECOVERY_LENGTH))
  let out = ''
  for (const b of bytes) out += RECOVERY_ALPHABET[b & 31]
  return out
}

/** What the guest typed or pasted, as the server will read it: upper case, spaces and dashes and
 *  anything else that is not a letter or a digit dropped, and the three letters Crockford reads as
 *  digits folded (O as 0, I and L as 1), since a code copied out by hand is where they come from.
 *  claim_recovery applies the same three steps, so the two hashes agree. */
export function normaliseSecret(raw: string): string {
  return (raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1')
}

/** Twenty characters of the alphabet, nothing else. A code that fails this is wrong before any
 *  request is made, so a typo costs no round trip. */
export function isSecret(normalised: string): boolean {
  return normalised.length === RECOVERY_LENGTH && [...normalised].every((c) => RECOVERY_ALPHABET.includes(c))
}

/** Grouped for reading aloud and copying out: K7QM-3XPA-9RTC-W2HD-6NBF. */
export function formatSecret(secret: string): string {
  return normaliseSecret(secret).replace(/(.{4})(?=.)/g, '$1-')
}

/** The hex SHA-256 of the normalised secret: what set_recovery stores. */
export async function hashSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normaliseSecret(secret)))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
