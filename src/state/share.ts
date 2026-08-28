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

interface PEntry { t?: 1; d?: string; r?: number; rc?: 1; c?: string }
export interface SharePayload {
  v: 2; id: string; n: string; c: string; ts: number
  e: Record<string, PEntry>; s: Record<string, 1>
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
  return { v: 2, id: ensureMyId(profile), n: profile.name || 'A friend', c: profile.colour || 'aqua', ts: Date.now(), e, s }
}

export function encodeShare(payload: SharePayload): string {
  return PREFIX + 'A' + b64url.enc(new TextEncoder().encode(JSON.stringify(payload)))
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
  return { id: String(p.id).slice(0, 64), name, colour, passport: { entries, visits }, exportedAt: Number(p.ts) || 0 }
}
