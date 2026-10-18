// Cold storage, 18 October 2026: one voyage summary email per guest, built from archive/summaries.
// The structure follows the recap emails that read as official (Resy, Waymo, Amtrak, Peloton and
// Google's, studied on reallygoodemails.com on 18 October 2026): a written preheader, a small centred
// wordmark, a statement strip (who, which sailing, the dates, the passport number), a picture with
// no words in it, the personal numbers as live text (label, figure, what it means), numbered
// rankings, one comparison, the log as a receipt with a total, a note on where the numbers come from,
// one button, the summary poster to save, and a dry footer saying why the email came. The pictures
// are drawn by the app's own code (tools/coldstorage/slides.html, render.html).
// Run: node tools/coldstorage/render.mjs        (send.mjs builds the same HTML with cid: pictures)
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'

const C = { ink: '#F6F1E9', ink2: '#B9B2C9', ink3: '#8C84A0', line: '#2C2542', coral: '#FF6B84', coralText: '#FFA3B4', brand: '#FF5B78', strip: '#1C1730' }
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const ROUND = "ui-rounded, 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const APP = 'https://cruise.charlesbee.org'
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const join = (xs) => xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
const first = (n) => String(n || '').trim().split(/\s+/)[0] || 'there'
const shortDay = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const stars = (r) => r ? '★'.repeat(r) + '☆'.repeat(5 - r) : ''
const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th')
const card = (s, kind) => s.cards.find((c) => c.kind === kind)
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`

export const recipients = JSON.parse(readFileSync('archive/recipients.json', 'utf8'))
let quips = {}
try { quips = JSON.parse(readFileSync('archive/quips.json', 'utf8')) } catch { /* none */ }
export const summaries = readdirSync('archive/summaries').map((f) => JSON.parse(readFileSync(`archive/summaries/${f}`, 'utf8')))
  .filter((s) => recipients[s.code])
const party = summaries.map((s) => ({ code: s.code, name: s.name, n: s.tried.length }))
  .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))

export const subject = (s) => `${first(s.name)}, your Sun Princess voyage in drinks`
export function preheader(s) {
  const n = s.tried.length, bars = topBars(s).length
  return n ? `${plural(n, 'drink')} across ${plural(bars, 'bar')} on the Sun Princess. Here is the full account.`
    : 'No drinks logged, but the party kept count. Here is how it went.'
}

/** The pictures one guest's email shows, by name. */
export function pictures(s) {
  const glasses = new Set(['cocktail', ...s.tried.map((t) => t.glass), ...Object.values(s.crewGlass ?? {})])
  return ['hero', `poster-${s.code}`, ...[...glasses].map((f) => `glass-${f}`)]
}
export const ext = (name) => name.startsWith('poster-') || name === 'hero' ? 'jpg' : 'png'

const topDrinks = (s) => [...s.tried].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || Number(b.fav) - Number(a.fav) || b.date.localeCompare(a.date)).slice(0, 5)
function topBars(s) {
  return Object.entries(s.tried.reduce((m, t) => (m[t.venue] = (m[t.venue] ?? 0) + 1, m), {}))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}
function moments(s) {
  const c = card(s, 'crew'); if (!c) return []
  const gl = (name) => s.crewGlass?.[name] ?? 'cocktail'
  const out = []
  if (c.twin) out.push([gl(c.shared[0]), 'Taste twin', `${c.twin.name}, a ${c.twin.affinityPct}% match${c.shared.length ? `. You both loved the ${join(c.shared)}.` : '.'}`])
  const sp = card(s, 'split'); if (sp) out.push([gl(sp.name), 'The one that split you', `The ${sp.name}: you gave it ${sp.mine} out of 5, ${sp.friend} gave it ${sp.theirs}.`])
  const f = card(s, 'find'); if (f) out.push([gl(f.name), 'Your find', `The ${f.name}. Nobody else in the crew tried it${f.rating ? `, and you gave it ${f.rating} out of 5` : ''}.`])
  const nx = card(s, 'nexttime'); if (nx) out.push([gl(nx.name), 'Next time', `The ${nx.name}. ${join(nx.by)} loved it${nx.note ? `: "${nx.note.text.trim()}"` : '.'}`])
  return out
}

/** The email. `img(name)` is where a picture is found: a file for the local preview, a cid: for the
 *  sent email, whose pictures travel as inline attachments (Gmail shows those, and strips SVG). */
export function html(s, img) {
  const n = s.tried.length
  const rank = party.findIndex((p) => p.code === s.code) + 1
  const g = (family, px) => `<img src="${img(`glass-${family}`)}" width="${px}" height="${px}" alt="" style="display:block;border:0">`
  const row = (inner, top = 44, side = 32) => `<tr><td style="padding:${top}px ${side}px 0">${inner}</td></tr>`
  const label = (t, colour = C.ink3) => `<p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:.01em;color:${colour}">${t}</p>`
  const h2 = (t) => `<p style="margin:0 0 18px;font-family:${ROUND};font-size:22px;font-weight:700;letter-spacing:-.01em;color:${C.ink}">${t}</p>`
  const button = (text, href) => `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="${C.coral}" style="border-radius:999px;background:${C.coral}">
      <a href="${href}" style="display:inline-block;padding:15px 30px;font-family:${ROUND};font-size:16px;font-weight:700;color:#1A0B14;text-decoration:none;border-radius:999px">${text}</a></td></tr></table>`

  // the statement strip: who, which sailing, when, and the passport number (the friend code)
  const strip = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.strip}" style="background:${C.strip};border-radius:14px"><tr>
      <td style="padding:14px 18px;font-size:13px;line-height:1.5;color:${C.ink2}"><strong style="color:${C.ink};font-weight:600">${esc(s.name)}</strong><br>Sun Princess</td>
      <td align="right" style="padding:14px 18px;font-size:13px;line-height:1.5;color:${C.ink2}">3 to 17 October 2026<br>Passport ${esc(s.code)}</td></tr></table>`

  // the figures, as live text: a label, the number, what it means
  const bd = card(s, 'bigday'), dk = card(s, 'decks'), md = card(s, 'medals'), ar = card(s, 'archetype')
  const stat = (lab, num, line) => `<td width="50%" valign="top" style="padding:0 16px 28px 0">${label(lab)}
      <p style="margin:0;font-family:${ROUND};font-size:46px;line-height:1;font-weight:800;letter-spacing:-.02em;color:${C.ink}">${num}</p>
      <p style="margin:8px 0 0;font-size:14px;line-height:1.45;color:${C.ink2}">${line}</p></td>`
  const stats = [
    stat('Drinks tried', n, `${Math.round(n / s.total * 100)}% of the ${s.total} on board`),
    stat('In your party', ordinal(rank), `of ${party.length}, by drinks logged`),
    stat('Biggest day', bd ? bd.count : 0, bd ? `drinks on ${esc(bd.date)}` : 'no day stood out'),
    stat('Bars', dk ? dk.venues : 0, dk ? `across ${dk.count === 1 ? 'deck' : 'decks'} ${esc(join(dk.decks.map(String)))}` : 'none on the log'),
  ]
  const figures = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${stats[0]}${stats[1]}</tr><tr>${stats[2]}${stats[3]}</tr></table>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td valign="top" style="padding:0">${label('Your taste')}
      <p style="margin:0;font-family:${ROUND};font-size:30px;line-height:1.15;font-weight:800;color:${C.ink}">${ar ? esc(ar.archetype.name) : 'Undeclared'}</p>
      <p style="margin:6px 0 0;font-size:15px;line-height:1.5;color:${C.ink2}">${ar ? esc(ar.archetype.blurb) : 'Nothing logged to judge by, which is a judgement of sorts.'}</p>
      <p style="margin:16px 0 0;font-size:14px;color:${C.ink2}">Medals: ${md ? `${md.count} of ${md.total}, ${esc(join(s.medals))}` : 'none struck'}</p></td></tr></table>`

  // the rankings
  const td = topDrinks(s), tb = topBars(s).slice(0, 5)
  const rankRow = (i, left, mid, right) => `<tr>
      <td width="28" valign="top" style="padding:12px 0;font-family:${ROUND};font-size:18px;font-weight:800;color:${i ? C.ink3 : C.coral}">${i + 1}</td>
      ${left}<td valign="top" style="padding:12px 0">${mid}</td>
      <td valign="top" align="right" style="padding:13px 0 12px 12px;white-space:nowrap;font-size:14px;color:${C.coral};letter-spacing:1px">${right}</td></tr>`
  const drinksList = td.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${td.map((t, i) => rankRow(i,
      `<td width="44" valign="top" style="padding:8px 10px 8px 0">${g(t.glass, 32)}</td>`,
      `<p style="margin:0;font-size:16px;color:${C.ink}">${esc(t.name)}</p><p style="margin:2px 0 0;font-size:13px;color:${C.ink3}">${esc(t.venue)}</p>`,
      stars(t.rating))).join('')}</table>` : `<p style="margin:0;font-size:15px;color:${C.ink2}">Nothing logged. The menu remains a mystery.</p>`
  const barsList = tb.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${tb.map(([v, k], i) => rankRow(i, '',
      `<p style="margin:0;font-size:16px;color:${C.ink}">${esc(v)}</p>`, `<span style="letter-spacing:0;color:${C.ink2}">${plural(k, 'drink')}</span>`)).join('')}</table>` : ''

  // the party, compared
  const max = Math.max(1, ...party.map((x) => x.n))
  const bars = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${party.map((x) => {
    const me = x.code === s.code, w = Math.max(2, Math.round(x.n / max * 100))
    return `<tr><td style="padding:8px 12px 8px 0;width:28%;white-space:nowrap;font-size:15px;color:${me ? C.coralText : C.ink}">${esc(first(x.name))}${me ? ' (you)' : ''}</td>
      <td style="padding:8px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="${w}%" bgcolor="${me ? C.coral : '#4A4166'}" style="height:10px;border-radius:5px;background:${me ? C.coral : '#4A4166'};font-size:0;line-height:0">&nbsp;</td>${w < 100 ? '<td style="font-size:0;line-height:0">&nbsp;</td>' : ''}</tr></table></td>
      <td style="padding:8px 0 8px 14px;width:10%;text-align:right;font-family:${ROUND};font-size:16px;font-weight:800;color:${me ? C.coralText : C.ink}">${x.n}</td></tr>`
  }).join('')}</table>`
  const crewMoments = moments(s)
  const crew = crewMoments.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">${crewMoments.map(([family, lab, line]) => `
      <tr><td width="52" valign="top" style="padding:14px 12px 14px 0">${g(family, 40)}</td>
        <td valign="top" style="padding:14px 0">${label(esc(lab))}<p style="margin:0;font-size:16px;line-height:1.5;color:${C.ink}">${esc(line)}</p></td></tr>`).join('')}</table>` : ''

  // the receipt: every drink, in order, and the total
  const receipt = n ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${s.tried.map((t) => `
      <tr><td valign="top" style="padding:9px 12px 9px 0;width:76px;white-space:nowrap;font-size:13px;color:${C.ink3}">${esc(shortDay(t.date))}</td>
        <td valign="top" style="padding:9px 0"><span style="font-size:15px;color:${C.ink}">${esc(t.name)}</span><br><span style="font-size:12px;color:${C.ink3}">${esc(t.venue)}</span>${t.notes.trim() ? `<br><span style="font-size:13px;font-style:italic;color:${C.ink2}">"${esc(t.notes.trim())}"</span>` : ''}</td>
        <td valign="top" align="right" style="padding:10px 0 9px 12px;white-space:nowrap;font-size:13px;letter-spacing:1px;color:${C.coral}">${stars(t.rating)}</td></tr>`).join('')}
      <tr><td colspan="3" style="padding:14px 0 0;border-top:1px solid ${C.line};font-size:15px;color:${C.ink}"><strong style="font-weight:700">Total: ${plural(n, 'drink')}, ${plural(topBars(s).length, 'bar')}, ${plural(new Set(s.tried.map((t) => t.date)).size, 'day')} with a drink logged</strong></td></tr></table>` : ''

  const section = (title, body, top = 48) => row(h2(title) + body, top)
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(subject(s))}</title></head>
<body style="margin:0;padding:0;background:#0F1121">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${esc(preheader(s))}${'&#8199;&#847;'.repeat(60)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0F1121" style="background:#0F1121"><tr><td align="center" style="padding:28px 0 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:${FONT}">
  <tr><td align="center" style="padding:0 32px 22px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td valign="middle" style="padding-right:8px">${g('cocktail', 22)}</td>
    <td valign="middle" style="font-family:${ROUND};font-size:17px;font-weight:800;color:${C.brand}">Cocktail Passport</td></tr></table></td></tr>
  <tr><td style="padding:0 16px">${strip}</td></tr>
  <tr><td style="padding:16px 16px 0"><img src="${img('hero')}" width="568" alt="The nine glasses of the Sun Princess menu" style="display:block;width:100%;max-width:568px;height:auto;border:0;border-radius:18px"></td></tr>
  ${row(`<p style="margin:0 0 16px;font-family:${ROUND};font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-.02em;color:${C.ink}">Your voyage, in drinks</p>
    <p style="margin:0 0 16px;font-size:17px;line-height:1.55;color:${C.ink}">Hello ${esc(first(s.name))}.</p>
    ${(quips[s.code] ?? []).map((q) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:${C.ink2}">${esc(q)}</p>`).join('')}
    <div style="padding-top:10px">${button('Open your passport', APP)}</div>`, 36)}
  ${section('The numbers', figures)}
  ${section('Your top drinks', drinksList)}
  ${barsList ? section('Your top bars', barsList) : ''}
  ${section('The party', bars + crew)}
  ${receipt ? section('Your receipt', receipt) : ''}
  ${section('Keep it', `<p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${C.ink2}">The whole voyage on one page, to save or send on.</p>
    <img src="${img(`poster-${s.code}`)}" width="536" alt="${esc(first(s.name))}'s voyage on one page: ${plural(n, 'drink')} tried" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:20px">
    <div style="padding-top:24px">${button('Open your passport', APP)}</div>`)}
  ${row(`<p style="margin:0;font-size:12px;line-height:1.6;color:${C.ink3}">How these numbers were made: each count is what you logged in the app and your phone last synced${s.backupAt ? `, on ${esc(new Date(s.backupAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }))}` : ''}. A drink logged only on your phone after that is not counted. "Bars" counts the venues of the drinks you logged. Your taste is worked out from what you tried and how you rated it, the same way the app's Wrapped does it.</p>`, 48)}
  <tr><td style="padding:32px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${C.line};padding-top:22px;font-size:12px;line-height:1.7;color:${C.ink3}">
    You are receiving this one-off email because you kept a Cocktail Passport on the Sun Princess, 3 to 17 October 2026. The passport has docked for the season and its server is being shut down. Your drinks are still in the app on your phone, and this email is your copy to keep. There is nothing to unsubscribe from: there will not be another.<br><br>
    Cocktail Passport · <a href="${APP}" style="color:${C.ink2};text-decoration:underline">cruise.charlesbee.org</a>
  </td></tr></table></td></tr>
</table></td></tr></table></body></html>`
}

export function text(s) {
  const n = s.tried.length, rank = party.findIndex((p) => p.code === s.code) + 1
  const L = [subject(s), '', `${s.name} · Sun Princess · 3 to 17 October 2026 · Passport ${s.code}`, '', 'Your voyage, in drinks', '', `Hello ${first(s.name)}.`, '']
  for (const q of quips[s.code] ?? []) L.push(q, '')
  L.push(`Open your passport: ${APP}`, '', 'The numbers')
  L.push(`Drinks tried: ${n} (${Math.round(n / s.total * 100)}% of the ${s.total} on board)`, `In your party: ${ordinal(rank)} of ${party.length}`)
  const bd = card(s, 'bigday'); if (bd) L.push(`Biggest day: ${bd.count} drinks on ${bd.date}`)
  const dk = card(s, 'decks'); if (dk) L.push(`Bars: ${dk.venues}, across decks ${join(dk.decks.map(String))}`)
  const ar = card(s, 'archetype'); if (ar) L.push(`Your taste: ${ar.archetype.name}. ${ar.archetype.blurb}`)
  if (s.medals.length) L.push(`Medals: ${join(s.medals)}`)
  const td = topDrinks(s); if (td.length) L.push('', 'Your top drinks', ...td.map((t, i) => `${i + 1}. ${t.name}, ${t.venue}${t.rating ? ` (${t.rating}/5)` : ''}`))
  const tb = topBars(s).slice(0, 5); if (tb.length) L.push('', 'Your top bars', ...tb.map(([v, k], i) => `${i + 1}. ${v}, ${plural(k, 'drink')}`))
  L.push('', 'The party', ...party.map((x) => `${first(x.name)}${x.code === s.code ? ' (you)' : ''}: ${x.n}`))
  for (const [, lab, line] of moments(s)) L.push(`${lab}: ${line}`)
  if (n) L.push('', 'Your receipt', ...s.tried.map((t) => `${shortDay(t.date)}  ${t.name}, ${t.venue}${t.rating ? `  ${t.rating}/5` : ''}${t.notes.trim() ? `  "${t.notes.trim()}"` : ''}`), `Total: ${plural(n, 'drink')}`)
  L.push('', `You are receiving this one-off email because you kept a Cocktail Passport on the Sun Princess, 3 to 17 October 2026. The passport has docked for the season and its server is being shut down. Your drinks are still in the app on your phone, and this email is your copy to keep. There will not be another.`, '', `Cocktail Passport · ${APP}`)
  return L.join('\n')
}

// run directly: the local previews, and one self-contained copy per guest with the pictures inside it
// (archive/emails/<code>.preview.html), which opens anywhere
if (process.argv[1]?.endsWith('render.mjs')) {
  mkdirSync('archive/emails', { recursive: true })
  for (const s of summaries) {
    writeFileSync(`archive/emails/${s.code}.html`, html(s, (name) => `img/${name}.${ext(name)}`))
    writeFileSync(`archive/emails/${s.code}.txt`, text(s))
    writeFileSync(`archive/emails/${s.code}.preview.html`, html(s, (name) => {
      const e = ext(name)
      return `data:image/${e === 'jpg' ? 'jpeg' : 'png'};base64,` + readFileSync(`archive/emails/img/${name}.${e}`).toString('base64')
    }))
    console.log(s.code, s.name, '|', subject(s), '|', preheader(s))
  }
}
