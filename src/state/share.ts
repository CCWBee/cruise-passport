// Offline share codec. A friend's whole passport travels as an SPP-prefixed base64url code.
// Encoder emits mode A (plain); decoder accepts A and B (deflate) so an older phone never fails
// to paste a newer sender's code. Pasted codes are untrusted → decode is try/catch + sanitised.
import { DRINK_BY_ID, START, END } from '../data/model'
import { FRIEND_COLOURS, type Entry, type Passport, type Friend, type Profile } from './stats'

const PREFIX = 'SPP'
export class ShareError extends Error {}

const b64url = {
  enc: (b: Uint8Array) => {
    let s = ''
    for (const x of b) s += String.fromCharCode(x)
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  },
  dec: (s: string) => {
    const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : ''
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
    const o = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i)
    return o
  },
}
async function inflateRaw(b: Uint8Array) {
  const ds = new DecompressionStream('deflate-raw')
  return new Uint8Array(await new Response(new Blob([b as BlobPart]).stream().pipeThrough(ds)).arrayBuffer())
}
async function deflateRaw(b: Uint8Array) {
  const cs = new CompressionStream('deflate-raw')
  return new Uint8Array(await new Response(new Blob([b as BlobPart]).stream().pipeThrough(cs)).arrayBuffer())
}

interface PEntry { t?: 1; d?: string; r?: number; rc?: 1; c?: string }
export interface SharePayload {
  v: 2; id: string; n: string; c: string; ts: number
  k?: string // stable friend code (added additively; older decoders ignore it)
  e: Record<string, PEntry>; s: Record<string, 1>
}

// Crockford base32 minus I,L,O,U so a spoken/typed code has no ambiguous characters.
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
function genCode(): string {
  const bytes = new Uint8Array(8)
  if (crypto?.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256)
  let s = ''
  for (const b of bytes) s += CODE_ALPHABET[b & 31] // 40 bits, ~1.1e12 space: un-enumerable here
  return s.slice(0, 4) + '-' + s.slice(4)
}
/** Stable public handle. Generated once; callers persist it via ensureIdentity. */
export function ensureMyCode(profile: Profile): string {
  return profile.code || genCode()
}
/** Normalise a typed/scanned code: upper-case, keep base32, re-hyphen as XXXX-XXXX. */
export function normaliseCode(raw: string): string {
  const s = (raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/[ILOU]/g, '')
  return s.length > 4 ? s.slice(0, 4) + '-' + s.slice(4, 8) : s
}

const shareable = (e: Entry): PEntry | null => {
  const p: PEntry = {}
  if (e.tried) p.t = 1
  if (e.date) p.d = e.date
  if (e.rating) p.r = e.rating
  if (e.rec) p.rc = 1
  if (e.comment?.trim()) p.c = e.comment.trim().slice(0, 140)
  return Object.keys(p).length ? p : null
}

export function ensureMyId(profile: Profile): string {
  return profile.id || (crypto?.randomUUID?.() ?? 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8))
}

export function buildPayload(me: Passport, profile: Profile): SharePayload {
  const e: Record<string, PEntry> = {}
  for (const [id, entry] of Object.entries(me.entries)) {
    if (id[0] === 'c') continue // custom-drink ids don't exist on other devices
    const p = shareable(entry)
    if (p) e[id] = p
  }
  const s: Record<string, 1> = {}
  for (const [k, v] of Object.entries(me.visits)) if (v.visited) s[k] = 1
  const out: SharePayload = { v: 2, id: ensureMyId(profile), n: profile.name || 'A friend', c: profile.colour || 'aqua', ts: Date.now(), e, s }
  if (profile.code) out.k = profile.code
  return out
}

// Emit mode B (deflate) when the browser supports it and it actually shrinks the payload, so a full
// passport fits in a QR far more often. Falls back to mode A; every decoder already reads both.
export async function encodeShare(payload: SharePayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload))
  if (typeof CompressionStream !== 'undefined') {
    try {
      const deflated = await deflateRaw(json)
      if (deflated.length < json.length) return PREFIX + 'B' + b64url.enc(deflated)
    } catch { /* fall through to plain */ }
  }
  return PREFIX + 'A' + b64url.enc(json)
}

export async function decodeShare(code: string): Promise<SharePayload> {
  const c = code.trim()
  if (!c.startsWith(PREFIX)) throw new ShareError('That is not a passport code.')
  const mode = c[PREFIX.length]
  const body = c.slice(PREFIX.length + 1)
  let bytes = b64url.dec(body)
  if (mode === 'B') bytes = await inflateRaw(bytes)
  else if (mode !== 'A') throw new ShareError('This code is from a newer version of the app.')
  const raw = JSON.parse(new TextDecoder().decode(bytes))
  if (!raw || typeof raw !== 'object' || raw.v !== 2 || !raw.id) throw new ShareError('This code is damaged.')
  return raw as SharePayload
}

const hashColour = (id: string) => {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return FRIEND_COLOURS[Math.abs(h) % FRIEND_COLOURS.length]
}

/** Untrusted payload -> sanitised Friend. Garbage never crashes the app. */
export function parseFriend(p: SharePayload): Friend {
  const entries: Record<string, Entry> = {}
  for (const [id, pe] of Object.entries(p.e || {})) {
    if (!DRINK_BY_ID[id]) continue
    const e: Entry = {}
    if (pe.t) e.tried = true
    if (typeof pe.d === 'string' && pe.d >= START && pe.d <= END) e.date = pe.d
    if (typeof pe.r === 'number') e.rating = Math.min(5, Math.max(1, Math.round(pe.r)))
    if (pe.rc) e.rec = true
    if (typeof pe.c === 'string' && pe.c.trim()) e.comment = pe.c.trim().slice(0, 140)
    if (Object.keys(e).length) entries[id] = e
  }
  const visits: Record<string, { visited: boolean }> = {}
  for (const k of Object.keys(p.s || {})) visits[k] = { visited: true }
  const colour = (FRIEND_COLOURS as readonly string[]).includes(p.c) ? p.c : hashColour(p.id)
  const name = (typeof p.n === 'string' ? p.n : '').trim().slice(0, 24) || 'A friend'
  const code = typeof p.k === 'string' && p.k.trim() ? normaliseCode(p.k) : undefined
  return { id: String(p.id).slice(0, 64), name, colour, code, passport: { entries, visits }, exportedAt: Number(p.ts) || 0 }
}
