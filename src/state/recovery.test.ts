/// <reference types="node" />
// The recovery secret, run for real under `node --test` (see restore.test.ts for why the reference
// line and the .ts extension are needed).
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  formatSecret, generateSecret, hashSecret, isSecret, normaliseSecret, RECOVERY_ALPHABET, RECOVERY_LENGTH,
} from './recovery.ts'

test('the alphabet is Crockford base32: 32 characters, no I, L, O or U', () => {
  assert.equal(RECOVERY_ALPHABET.length, 32)
  assert.equal(new Set(RECOVERY_ALPHABET).size, 32)
  for (const c of 'ILOU') assert.equal(RECOVERY_ALPHABET.includes(c), false)
})

test('a new secret is 20 characters of the alphabet, and two are not the same', () => {
  const a = generateSecret()
  const b = generateSecret()
  assert.equal(a.length, RECOVERY_LENGTH)
  assert.equal(isSecret(a), true)
  assert.notEqual(a, b)
})

test('each byte maps to its low five bits, so every character is reachable and none is favoured', () => {
  const bytes = Uint8Array.from({ length: 20 }, (_, i) => i * 13)
  const secret = generateSecret(() => bytes)
  assert.equal(secret, [...bytes].map((b) => RECOVERY_ALPHABET[b & 31]).join(''))
  // 0 and 255 are the extremes; 32 and 0 land on the same character.
  assert.equal(generateSecret(() => new Uint8Array(20).fill(255)), 'Z'.repeat(20))
  assert.equal(generateSecret(() => new Uint8Array(20).fill(32)), '0'.repeat(20))
})

test('normalising drops dashes and spaces, upper-cases, and folds O, I and L', () => {
  assert.equal(normaliseSecret('k7qm-3xpa 9rtc-w2hd-6nlo'), 'K7QM3XPA9RTCW2HD6N10')
  assert.equal(normaliseSecret(' K7QM/3XPA+9RTC.W2HD_6NBF\n'), 'K7QM3XPA9RTCW2HD6NBF')
  assert.equal(normaliseSecret('iIlLoO'), '111100')
  assert.equal(normaliseSecret(''), '')
})

test('isSecret wants exactly 20 characters of the alphabet', () => {
  assert.equal(isSecret('K7QM3XPA9RTCW2HD6NBF'), true)
  assert.equal(isSecret('K7QM3XPA9RTCW2HD6NB'), false)
  assert.equal(isSecret('K7QM3XPA9RTCW2HD6NBFF'), false)
  assert.equal(isSecret('K7QM3XPA9RTCW2HD6NBU'), false) // U is not in the alphabet and is not folded
})

test('the secret is shown in five groups of four', () => {
  assert.equal(formatSecret('K7QM3XPA9RTCW2HD6NBF'), 'K7QM-3XPA-9RTC-W2HD-6NBF')
  assert.equal(formatSecret('k7qm-3xpa-9rtc-w2hd-6nbf'), 'K7QM-3XPA-9RTC-W2HD-6NBF')
})

test('the hash is the hex SHA-256 of the normalised secret, and matches the server', async () => {
  const expected = createHash('sha256').update('K7QM3XPA9RTCW2HD6N10').digest('hex')
  // The same vector supabase/tests/0004_recovery.dryrun.sql registers and then claims with
  // 'k7qm-3xpa-9rtc-w2hd-6nlo', so the phone and claim_recovery agree on it.
  assert.equal(expected, 'b1bfc1efe66b9ea3d0a35289fe68ca2f3961a4dc94ae1dc9f61156ea03a76735')
  assert.equal(await hashSecret('K7QM3XPA9RTCW2HD6N10'), expected)
  assert.equal(await hashSecret('k7qm-3xpa-9rtc-w2hd-6nlo'), expected)
  assert.match(await hashSecret(generateSecret()), /^[0-9a-f]{64}$/)
})
