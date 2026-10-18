// Cold storage, 18 October 2026: turns archive/summaries/<code>.json into one email per guest,
// archive/emails/<code>.html plus a plain-text twin, in the app's night-bar dress. The wording follows
// the Wrapped screen (src/features/wrapped/Wrapped.tsx) card for card. Recipients come from
// archive/recipients.json (gitignored: addresses are personal data). Run: node tools/coldstorage/render.mjs
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'

const C = {
  room: '#140E22', panel: '#1E1733', line: '#2E2645', ink: '#F6F1E9', ink2: '#B9B2C9', ink3: '#8C84A0',
  coral: '#FF6B84', coralText: '#FFA3B4',
}
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const join = (xs) => xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
const first = (n) => String(n || '').trim().split(/\s+/)[0] || 'there'
const day = (iso) => {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00Z')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}
const stars = (r) => r ? '★'.repeat(r) + '☆'.repeat(5 - r) : ''
const card = (s, kind) => s.cards.find((c) => c.kind === kind)

function facts(s) {
  const rows = []
  const a = card(s, 'archetype'); if (a) rows.push(['Your taste', a.archetype.name, a.archetype.blurb])
  const t = card(s, 'topbar'); if (t) rows.push(['Top bar', `${t.venue}, Deck ${t.deck}`, `${t.count} ${t.count === 1 ? 'drink' : 'drinks'} there`])
  const sp = card(s, 'spirit'); if (sp) rows.push(['Favourite spirit', sp.spirit, `${sp.count} ${sp.count === 1 ? 'drink' : 'drinks'}`])
  const b = card(s, 'bigday'); if (b) rows.push(['Biggest day', b.date, `${b.count} ${b.count === 1 ? 'drink' : 'drinks'}`])
  const d = card(s, 'decks'); if (d) rows.push(['Bars', `${d.venues} ${d.venues === 1 ? 'bar' : 'bars'}`, `across ${d.count === 1 ? 'deck' : 'decks'} ${join(d.decks.map(String))}`])
  const m = card(s, 'medals'); if (m) rows.push(['Medals', `${m.count} of ${m.total}`, join(s.medals)])
  return rows
}

function crewLines(s) {
  const out = []
  const c = card(s, 'crew'); if (!c) return out
  out.push(`You sailed with ${join(s.crew)}. Together you found ${c.triedTogether} of the ${s.total} drinks on board.`)
  if (c.twin) out.push(`Your taste twin was ${c.twin.name}, a ${c.twin.affinityPct}% match.`)
  if (c.shared.length) out.push(`You both loved the ${join(c.shared)}.`)
  const sp = card(s, 'split'); if (sp) out.push(`The one that split you: the ${sp.name}. You gave it ${sp.mine} out of 5, ${sp.friend} gave it ${sp.theirs}.`)
  const f = card(s, 'find'); if (f) out.push(`Your find: the ${f.name}. Nobody else in the crew tried it${f.rating ? `, and you gave it ${f.rating} out of 5` : ''}.`)
  const n = card(s, 'nexttime'); if (n) out.push(`Next time: the ${n.name}. ${join(n.by)} loved it and you have not had one yet${n.note ? `. ${n.note.name} wrote: "${n.note.text.trim()}"` : ''}.`)
  return out
}

function html(s) {
  const n = s.tried.length
  const pct = s.total ? Math.round(n / s.total * 100) : 0
  const lead = n
    ? `<p style="margin:0;font-size:64px;line-height:1;font-weight:700;color:${C.ink}">${n}</p>
       <p style="margin:8px 0 0;font-size:15px;color:${C.ink2}">${n === 1 ? 'drink' : 'drinks'} tried, ${pct}% of the ${s.total} on board</p>`
    : `<p style="margin:0;font-size:17px;line-height:1.5;color:${C.ink2}">Your passport stayed empty this time: no drinks logged. The crew kept theirs, so here is what they found.</p>`
  const factRows = facts(s).map(([k, v, sub]) => `
      <tr><td style="padding:12px 0;border-top:1px solid ${C.line};vertical-align:top;width:38%;font-size:13px;color:${C.ink3}">${esc(k)}</td>
          <td style="padding:12px 0;border-top:1px solid ${C.line};vertical-align:top;font-size:15px;color:${C.ink}"><strong style="font-weight:600">${esc(v)}</strong>${sub ? `<br><span style="font-size:13px;color:${C.ink2}">${esc(sub)}</span>` : ''}</td></tr>`).join('')
  const crew = crewLines(s).map((l) => `<p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:${C.ink}">${esc(l)}</p>`).join('')
  const log = s.tried.map((t) => `
      <tr><td style="padding:10px 12px 10px 0;border-top:1px solid ${C.line};vertical-align:top;white-space:nowrap;font-size:13px;color:${C.ink3}">${esc(day(t.date))}</td>
          <td style="padding:10px 0;border-top:1px solid ${C.line};vertical-align:top;font-size:15px;color:${C.ink}">${esc(t.name)}<br><span style="font-size:13px;color:${C.ink2}">${esc(t.venue)}</span>${t.notes.trim() ? `<br><span style="font-size:13px;font-style:italic;color:${C.ink2}">"${esc(t.notes.trim())}"</span>` : ''}</td>
          <td style="padding:10px 0 10px 12px;border-top:1px solid ${C.line};vertical-align:top;white-space:nowrap;text-align:right;font-size:14px;letter-spacing:1px;color:${C.coral}">${stars(t.rating)}</td></tr>`).join('')
  const section = (title, body) => `
    <tr><td style="padding:28px 28px 0">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;letter-spacing:.02em;color:${C.coralText}">${title}</p>
      ${body}
    </td></tr>`
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>Your Sun Princess voyage, in drinks</title></head>
<body style="margin:0;padding:0;background:${C.room};font-family:${FONT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.room}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.panel};border-radius:16px">
  <tr><td style="padding:28px 28px 0">
    <p style="margin:0;font-size:15px;font-weight:700;color:${C.coral}">Cocktail Passport</p>
    <p style="margin:4px 0 0;font-size:13px;color:${C.ink3}">Sun Princess · 3 to 17 October 2026</p>
  </td></tr>
  <tr><td style="padding:28px 28px 0">
    <p style="margin:0 0 20px;font-size:17px;color:${C.ink}">Hello ${esc(first(s.name))},</p>
    ${lead}
  </td></tr>
  ${factRows ? section('Your voyage', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${factRows}</table>`) : ''}
  ${crew ? section('Your crew', crew) : ''}
  ${log ? section('Everything you tried', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${log}</table>`) : ''}
  <tr><td style="padding:28px">
    <p style="margin:0;font-size:13px;line-height:1.6;color:${C.ink3}">The passport has docked for the season and its server is being shut down. Your drinks are still in the app on your phone; this email is your copy to keep. Nothing for you to do.</p>
  </td></tr>
</table></td></tr></table></body></html>`
}

function text(s) {
  const lines = [`Cocktail Passport`, `Sun Princess, 3 to 17 October 2026`, '', `Hello ${first(s.name)},`, '']
  const n = s.tried.length
  lines.push(n ? `${n} ${n === 1 ? 'drink' : 'drinks'} tried, ${Math.round(n / s.total * 100)}% of the ${s.total} on board.` : 'Your passport stayed empty this time: no drinks logged. The crew kept theirs, so here is what they found.', '')
  for (const [k, v, sub] of facts(s)) lines.push(`${k}: ${v}${sub ? ` (${sub})` : ''}`)
  const crew = crewLines(s); if (crew.length) lines.push('', 'Your crew', ...crew)
  if (n) lines.push('', 'Everything you tried', ...s.tried.map((t) => `${day(t.date)}  ${t.name}, ${t.venue}${t.rating ? `  ${t.rating}/5` : ''}${t.notes.trim() ? `  "${t.notes.trim()}"` : ''}`))
  lines.push('', 'The passport has docked for the season and its server is being shut down. Your drinks are still in the app on your phone; this email is your copy to keep. Nothing for you to do.')
  return lines.join('\n')
}

const recipients = JSON.parse(readFileSync('archive/recipients.json', 'utf8'))
mkdirSync('archive/emails', { recursive: true })
const index = []
for (const f of readdirSync('archive/summaries')) {
  const s = JSON.parse(readFileSync(`archive/summaries/${f}`, 'utf8'))
  const to = recipients[s.code]
  if (!to) continue
  writeFileSync(`archive/emails/${s.code}.html`, html(s))
  writeFileSync(`archive/emails/${s.code}.txt`, text(s))
  index.push({ code: s.code, name: s.name, to, tried: s.tried.length })
}
writeFileSync('archive/emails/index.json', JSON.stringify(index, null, 2))
console.log(index)
