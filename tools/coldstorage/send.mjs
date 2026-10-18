// Cold storage, 18 October 2026: sends each guest their voyage email through Resend, from Bobble's
// verified domain (bobbledesigns.com) dressed as the Cocktail Passport, with every picture as an
// inline attachment (cid:), which Gmail and Apple Mail show in the body and which survives Gmail's
// SVG stripping. The key is RESEND_API_KEY in E:\claude-projects\bobble-repo\.env, read here and never
// printed. Each send carries an idempotency key per guest, so a retry cannot send twice.
// Run: node tools/coldstorage/send.mjs --dry   (prints what would go)   then without --dry to send
import { readFileSync, writeFileSync } from 'node:fs'
import { summaries, recipients, html, text, pictures, ext, subject } from './render.mjs'

const dry = process.argv.includes('--dry')
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7)
const FROM = 'Cocktail Passport <passport@bobbledesigns.com>'
const env = readFileSync('E:/claude-projects/bobble-repo/.env', 'utf8')
const KEY = env.match(/^RESEND_API_KEY=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '')
if (!KEY) throw new Error('RESEND_API_KEY not found')

const log = []
for (const s of summaries) {
  if (only && s.code !== only) continue
  const to = recipients[s.code]
  const names = pictures(s)
  const attachments = names.map((name) => ({
    filename: `${name}.${ext(name)}`,
    content: readFileSync(`archive/emails/img/${name}.${ext(name)}`).toString('base64'),
    content_id: name,
  }))
  const body = { from: FROM, to: [to], subject: subject(s), html: html(s, (name) => `cid:${name}`), text: text(s), attachments }
  const bytes = JSON.stringify(body).length
  if (dry) { console.log(s.code, s.name, to, `${attachments.length} pictures`, `${Math.round(bytes / 1024)} KB`); continue }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `cruise-coldstorage-2026-10-18-${s.code}` },
    body: JSON.stringify(body),
  })
  const out = await res.json().catch(() => ({}))
  console.log(s.code, s.name, to, res.status, out.id ?? JSON.stringify(out))
  log.push({ code: s.code, to, status: res.status, id: out.id ?? null, error: out.id ? null : out })
}
if (!dry) writeFileSync(`archive/emails/sent-${only ?? 'all'}.json`, JSON.stringify(log, null, 2))
