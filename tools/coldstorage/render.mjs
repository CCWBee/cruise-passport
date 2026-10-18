// Cold storage, 18 October 2026: turns archive/summaries/<code>.json into one email per guest,
// archive/emails/<code>.html plus a plain-text twin, in the app's night-bar dress. The hero is the
// guest's own Wrapped certificate and every drink carries its glass, both drawn by the app's own code
// (tools/coldstorage/render.html); the wording follows the Wrapped screen. Recipients and the
// hand-written lines come from archive/recipients.json and archive/quips.json (gitignored: personal).
// Run: node tools/coldstorage/render.mjs        (send.mjs builds the same HTML with cid: pictures)
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'

const C = { ink: '#F6F1E9', ink2: '#B9B2C9', ink3: '#8C84A0', coral: '#FF6B84', coralText: '#FFA3B4', brand: '#FF5B78' }
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const ROUND = "ui-rounded, 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const join = (xs) => xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
const first = (n) => String(n || '').trim().split(/\s+/)[0] || 'there'
const longDay = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const shortDay = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const stars = (r) => r ? '★'.repeat(r) + '☆'.repeat(5 - r) : ''
const card = (s, kind) => s.cards.find((c) => c.kind === kind)

export const recipients = JSON.parse(readFileSync('archive/recipients.json', 'utf8'))
let quips = {}
try { quips = JSON.parse(readFileSync('archive/quips.json', 'utf8')) } catch { /* none */ }
export const summaries = readdirSync('archive/summaries').map((f) => JSON.parse(readFileSync(`archive/summaries/${f}`, 'utf8')))
  .filter((s) => recipients[s.code])
// the party: everyone being emailed, with what each logged, compared in every email
const party = summaries.map((s) => ({ code: s.code, name: s.name, n: s.tried.length }))
  .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))

/** The pictures one guest's email shows, by name: their certificate and each glass it draws. */
export function pictures(s) {
  const glasses = new Set(['cocktail', ...s.tried.map((t) => t.glass)])
  return [...slideNames(s), `cert-${s.code}`, ...[...glasses].map((f) => `glass-${f}`)]
}
/** The guest's slides, in story order, as slides.html saved them. */
export function slideNames(s) {
  return readdirSync('archive/emails/img').filter((f) => f.startsWith(`slide-${s.code}-`))
    .map((f) => f.replace(/\.jpg$/, '')).sort((a, b) => Number(a.split('-').pop()) - Number(b.split('-').pop()))
}
export const ext = (name) => name.startsWith('cert-') || name.startsWith('slide-') ? 'jpg' : 'png'

/** The email. `img(name)` is where a picture is found: a file for the local preview, a cid: for the
 *  sent email, whose pictures travel as inline attachments (Gmail shows those, and strips SVG). */
export function html(s, img) {
  const n = s.tried.length
  const g = (family, px) => `<img src="${img(`glass-${family}`)}" width="${px}" height="${px}" alt="" style="display:block;border:0">`
  const p = (txt, size, colour) => `<p style="margin:0 0 14px;font-size:${size}px;line-height:1.55;color:${colour}">${txt}</p>`
  const h2 = (t) => `<p style="margin:0 0 14px;font-family:${ROUND};font-size:21px;font-weight:700;letter-spacing:-.01em;color:${C.ink}">${t}</p>`
  const block = (inner, top = 40) => `<tr><td style="padding:${top}px 28px 0">${inner}</td></tr>`

  // the story: the slides tools/coldstorage/slides.html drew, in order, then the certificate
  const slides = slideNames(s)
  const story = slides.map((name, i) => `<tr><td style="padding:${i ? 14 : 28}px 16px 0"><img src="${img(name)}" width="568" alt="" style="display:block;width:100%;max-width:568px;height:auto;border:0;border-radius:24px"></td></tr>`).join('')

  // the log, a day at a time
  const days = [...new Set(s.tried.map((t) => t.date))]
  const log = days.map((d) => `<p style="margin:22px 0 4px;font-size:13px;font-weight:600;color:${C.ink3}">${esc(longDay(d))}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${s.tried.filter((t) => t.date === d).map((t) => `
      <tr><td width="46" valign="top" style="padding:10px 12px 10px 0">${g(t.glass, 34)}</td>
        <td valign="top" style="padding:10px 0"><p style="margin:0;font-size:16px;color:${C.ink}">${esc(t.name)}</p>
          <p style="margin:2px 0 0;font-size:13px;color:${C.ink3}">${esc(t.venue)}</p>
          ${t.notes.trim() ? `<p style="margin:4px 0 0;font-size:14px;font-style:italic;color:${C.ink2}">"${esc(t.notes.trim())}"</p>` : ''}</td>
        <td valign="top" style="padding:12px 0 10px 12px;white-space:nowrap;text-align:right;font-size:15px;letter-spacing:1px;color:${C.coral}">${stars(t.rating)}</td></tr>`).join('')}</table>`).join('')

  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>Your Sun Princess voyage, in drinks</title></head>
<body style="margin:0;padding:0;background:#0F1121">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0F1121" style="background:#0F1121;background-image:linear-gradient(180deg,#0B1222 0%,#130F1F 55%,#1A1226 100%)"><tr><td align="center" style="padding:28px 0 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${FONT}">
  <tr><td style="padding:0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="32" valign="middle">${g('cocktail', 24)}</td>
    <td valign="middle" style="white-space:nowrap;font-family:${ROUND};font-size:16px;font-weight:700;color:${C.brand}">Cocktail Passport</td>
    <td valign="middle" align="right" style="white-space:nowrap;font-size:13px;color:${C.ink3}">3 to 17 Oct</td></tr></table></td></tr>
  ${block(`<p style="margin:0 0 18px;font-family:${ROUND};font-size:36px;line-height:1.1;font-weight:700;letter-spacing:-.02em;color:${C.ink}">Hello ${esc(first(s.name))}.</p>
    ${(quips[s.code] ?? []).map((q, i) => p(esc(q), i ? 16 : 18, i ? C.ink2 : C.ink)).join('')}`, 36)}
  ${story}
  <tr><td style="padding:14px 16px 0"><img src="${img(`cert-${s.code}`)}" width="568" alt="Your Cruise Wrapped: ${n} drinks tried" style="display:block;width:100%;max-width:568px;height:auto;border:0;border-radius:24px"></td></tr>
  ${log ? block(h2('Everything you tried') + log, 36) : ''}
  ${block(`<p style="margin:0;font-size:13px;line-height:1.6;color:${C.ink3}">The passport has docked for the season and its server is being shut down. Your drinks are still in the app on your phone; this email is your copy to keep. Nothing for you to do.</p>`, 44)}
</table></td></tr></table></body></html>`
}

export function text(s) {
  const n = s.tried.length
  const lines = ['Cocktail Passport', 'Sun Princess, 3 to 17 October 2026', '', `Hello ${first(s.name)}.`, '']
  for (const q of quips[s.code] ?? []) lines.push(q, '')
  lines.push(`${n} ${n === 1 ? 'drink' : 'drinks'} tried, ${Math.round(n / s.total * 100)}% of the ${s.total} on board.`)
  for (const r of s.certificate) lines.push(`${r.label}: ${r.value}`)
  const bd = card(s, 'bigday'); if (bd) lines.push(`Biggest day: ${bd.date}, ${bd.count} ${bd.count === 1 ? 'drink' : 'drinks'}`)
  if (s.medals.length) lines.push(`Medals struck: ${join(s.medals)}`)
  lines.push('', 'How the party did', ...party.map((x) => `${first(x.name)}${x.code === s.code ? ' (you)' : ''}: ${x.n}`))
  if (n) lines.push('', 'Everything you tried', ...s.tried.map((t) => `${shortDay(t.date)}  ${t.name}, ${t.venue}${t.rating ? `  ${t.rating}/5` : ''}${t.notes.trim() ? `  "${t.notes.trim()}"` : ''}`))
  lines.push('', 'The passport has docked for the season and its server is being shut down. Your drinks are still in the app on your phone; this email is your copy to keep. Nothing for you to do.')
  return lines.join('\n')
}

// run directly: write the local previews, and one self-contained copy per guest with the pictures
// inside it (archive/emails/<code>.preview.html), which opens anywhere
if (process.argv[1]?.endsWith('render.mjs')) {
  mkdirSync('archive/emails', { recursive: true })
  for (const s of summaries) {
    writeFileSync(`archive/emails/${s.code}.html`, html(s, (name) => `img/${name}.${ext(name)}`))
    writeFileSync(`archive/emails/${s.code}.txt`, text(s))
    writeFileSync(`archive/emails/${s.code}.preview.html`, html(s, (name) => {
      const e = ext(name)
      return `data:image/${e === 'jpg' ? 'jpeg' : 'png'};base64,` + readFileSync(`archive/emails/img/${name}.${e}`).toString('base64')
    }))
    console.log(s.code, s.name, recipients[s.code], pictures(s).join(' '))
  }
}
