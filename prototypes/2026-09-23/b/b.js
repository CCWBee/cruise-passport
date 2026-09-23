// Cocktail Passport, prototype B: Open water. No framework, no build, no network.
// Deterministic states: ?screen=home|drinks|sheet|sheet-large|search|medals|medal|ship|crew|you,
// ?hour=0..23 pins the sky (the middle of that hour), ?still holds every entry animation and the
// sea on one frame (for a render that cannot wait). README.md explains the rest.
(() => {
  'use strict'

  const D = window.PB_DATA
  const Q = new URLSearchParams(location.search)
  const STILL = Q.has('still')
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches
  const app = document.getElementById('app')
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s))
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

  // ── the voyage: the prototype stands on the evening of day 7, the last day the seed has entries
  const DAY = 6
  const TODAY = D.days[DAY]
  const TOTAL_DAYS = D.days.length
  const longDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const shortDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  const DRINKS = D.drinks
  const BY_ID = Object.fromEntries(DRINKS.map((d) => [d.id, d]))
  const VENUES = D.venues
  const VKEYS = Object.keys(VENUES)
  const me = D.me // the seed passport, mutable: logging a drink here changes every count

  // the crew, as the ?seed block in index.html has them
  const CREW = [
    { id: 'sam', name: 'Sam', colour: 'var(--friend-melon)', synced: '20 min ago', dayShift: 0, entries: {
      d4: { r: 5, rec: 1, c: 'The blue one is unreal, get it first' }, d9: { r: 5 }, d14: { r: 5, rec: 1 },
      d3: { r: 4 }, d8: { r: 4 }, d55: { r: 5, rec: 1, c: 'Worth the walk to deck 16' }, d60: { r: 5, rec: 1 }, d72: { r: 4, rec: 1 } } },
    { id: 'ravi', name: 'Ravi', colour: 'var(--friend-lime)', synced: '3 h ago', dayShift: 1, entries: {
      d4: { r: 3 }, d9: { r: 4 }, d20: { r: 4 }, d30: { r: 5, rec: 1, c: 'Order two, you will want a second' },
      d101: { r: 5, rec: 1 }, d66: { r: 4, rec: 1 } } },
  ]
  CREW.forEach((f) => Object.keys(f.entries).forEach((id, i) => { f.entries[id].day = D.days[(i + f.dayShift) % 5] }))

  // ── icons: the app's drawn set (src/ui/Icon.tsx), 24 grid, 1.8 stroke ─────────────────────────
  const svg = (inner, size = 24, extra = '') =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`
  const I = {
    home: '<path d="M4 11.2 12 4.5l8 6.7"/><path d="M6 10.4V18a1.2 1.2 0 0 0 1.2 1.2h9.6A1.2 1.2 0 0 0 18 18v-7.6"/>',
    drinks: '<path d="M4.5 6h15L12 14v4.6"/><path d="M8 19.4h8"/>',
    ship: '<path d="M4 13.5h16l-1.6 4.2a2 2 0 0 1-1.9 1.3H7.5a2 2 0 0 1-1.9-1.3L4 13.5z"/><path d="M12 13.3V5"/><path d="M12 5.4 17 8l-5 1.8"/>',
    crew: '<circle cx="9" cy="8" r="3.1"/><path d="M3.6 19.2c.5-3 2.7-4.7 5.4-4.7s4.9 1.7 5.4 4.7"/><path d="M15.4 6.3a2.7 2.7 0 0 1 0 5.2"/><path d="M16.4 14.7c2 .3 3.4 1.7 4 3.6"/>',
    you: '<path d="M6 19v-4.6"/><path d="M12 19V7"/><path d="M18 19v-8.6"/>',
    search: '<circle cx="11" cy="11" r="6.2"/><path d="M20 20l-4.5-4.5"/>',
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    chev: '<path d="m10 6.8 5.2 5.2-5.2 5.2"/>',
    back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    check: '<circle cx="12" cy="12" r="8.4"/><path d="M8.3 12.3l2.4 2.4 4.8-5"/>',
    shaker: '<path d="M10.2 2.8h3.6v2.4h-3.6z"/><path d="M10.2 5.2C8.2 5.9 7.3 7.7 7.2 9.8h9.6c-.1-2.1-1-3.9-3-4.6"/><path d="M6.4 9.8h11.2v2H6.4z"/><path d="M7.1 11.8l1 8.3a1.3 1.3 0 0 0 1.3 1.1h5.2a1.3 1.3 0 0 0 1.3-1.1l1-8.3"/>',
    cocktail: '<path d="M4.5 5.5h15L12 13.5z"/><path d="M12 13.5v6M8.5 19.5h7"/>',
    margarita: '<path d="M3.5 7h15c0 3-2.8 4.3-5.2 4.6 0 2.9-1 4.2-2.3 4.2s-2.3-1.3-2.3-4.2C6.3 11.3 3.5 10 3.5 7z"/><path d="M11 15.8v3.7M7.8 19.5h6.4"/><path d="M15.5 7a3 3 0 0 1 6 0z"/>',
    wine: '<path d="M8 4.5c-1.8 3.5-2 7 .4 8.7 1.8 1.2 5.4 1.2 7.2 0 2.4-1.7 2.2-5.2.4-8.7z"/><path d="M12 14.1v5.4M8.5 19.5h7"/>',
    flute: '<path d="M9.8 3.5h4.4c.4 4.5 0 8.7-2.2 10.7-2.2-2-2.6-6.2-2.2-10.7z"/><path d="M12 14.2v5.3M9 19.5h6"/>',
    pint: '<path d="M6.5 4.5h11l-1.2 14.7a1.2 1.2 0 0 1-1.2 1.1H8.9a1.2 1.2 0 0 1-1.2-1.1z"/><path d="M6.9 8.5h10.2"/>',
    cup: '<path d="M5.5 9.5H16V14a4.5 4.5 0 0 1-4.5 4.5H10A4.5 4.5 0 0 1 5.5 14z"/><path d="M16 11h1.2a2.2 2.2 0 0 1 0 4.4H16M4 20.5h14.5"/><path d="M9 4.8c-.8 1 .8 1.8 0 2.8M12.5 4.8c-.8 1 .8 1.8 0 2.8"/>',
    hurricane: '<path d="M13.4 9 16.2 2.2"/><path d="M8 4c.3 2.5 2 3.5 1.8 5.5-.2 2-2.5 3.5-2.2 6.3.3 2.2 2.2 3.2 4.4 3.2s4.1-1 4.4-3.2c.3-2.8-2-4.3-2.2-6.3-.2-2 1.5-3 1.8-5.5z"/><path d="M9.5 21h5"/>',
    highball: '<path d="M13.2 11.5 16.6 2"/><path d="M7 4.5h10V19a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19z"/>',
    rocks: '<path d="M5.5 8.5h13l-.9 10.3a1.5 1.5 0 0 1-1.5 1.4H7.9a1.5 1.5 0 0 1-1.5-1.4z"/><rect x="9.3" y="11.6" width="5.4" height="5.4" rx="1" transform="rotate(-8 12 14.3)"/>',
  }
  const icon = (k, size, extra) => svg(I[k], size, extra)
  const checkFilled = (size = 24) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M8.2 12.2l2.5 2.5 5-5.2" fill="none" stroke="var(--on-check, #fff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  const starSvg = (size, filled) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="${filled ? 0 : 1.8}" stroke-linejoin="round"><path d="M12 3.6l2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.9l-5 2.75.96-5.6L3.9 9.5l5.6-.8L12 3.6z"/></svg>`

  // the emblems into the shared defs, one symbol each
  const defs = document.getElementById('defs')
  defs.insertAdjacentHTML('beforeend', Object.entries(D.emblems).map(([id, s]) => `<symbol id="em-${id}" viewBox="0 0 100 100">${s}</symbol>`).join(''))

  // ── the passport's numbers ────────────────────────────────────────────────────────────────────
  const tried = (id) => !!(me[id] && me[id].t)
  const listOf = (k) => VENUES[k].shares || k
  // a venue that shares another's list may also pour a drink of its own (Coffee & Cones)
  const drinksAt = (k) => DRINKS.filter((d) => d.v === listOf(k) || d.v === k)
  const money = (p) => '$' + (p % 1 ? p.toFixed(2) : p)
  const pkg = (p) => p === null ? null : p <= 15 ? 'plus' : p <= 20 ? 'prem' : 'over'

  function stat(uptoDay = DAY) {
    const done = DRINKS.filter((d) => me[d.id] && me[d.id].t && D.days.indexOf(me[d.id].day) <= uptoDay)
    const ids = new Set(done.map((d) => d.id))
    const venues = new Set(VKEYS.filter((k) => VENUES[k].visited))
    done.forEach((d) => venues.add(d.v))
    return {
      n: done.length, ids,
      pct: (done.length / DRINKS.length) * 100,
      venues: venues.size, totalVenues: VKEYS.length,
      cat: (c) => done.filter((d) => d.c === c).length,
      catDone: (c) => { const all = DRINKS.filter((d) => d.c === c); return all.length > 0 && all.every((d) => ids.has(d.id)) },
      sp: (x) => done.filter((d) => d.sp.includes(x)).length,
      frozenDone: DRINKS.filter((d) => d.fz).every((d) => ids.has(d.id)),
    }
  }

  // the eighteen medals (src/data/badges.ts), tiers and hints as they are
  const BADGES = [
    { id: 'first', name: 'First Sip', hint: 'Log one drink', tier: 'bronze', test: (s) => s.n >= 1, prog: (s) => [s.n, 1], unit: ['drink', 'drinks'] },
    { id: 'ten', name: 'Ten Down', hint: 'Log ten', tier: 'bronze', test: (s) => s.n >= 10, prog: (s) => [s.n, 10], unit: ['drink', 'drinks'] },
    { id: 'twentyfive', name: 'Twenty Five', hint: 'Log twenty five', tier: 'silver', test: (s) => s.n >= 25, prog: (s) => [s.n, 25], unit: ['drink', 'drinks'] },
    { id: 'fifty', name: 'Fifty', hint: 'Log fifty', tier: 'silver', test: (s) => s.n >= 50, prog: (s) => [s.n, 50], unit: ['drink', 'drinks'] },
    { id: 'hundred', name: 'One Hundred', hint: 'Log one hundred', tier: 'gold', test: (s) => s.n >= 100, prog: (s) => [s.n, 100], unit: ['drink', 'drinks'] },
    { id: 'onefifty', name: 'One Fifty', hint: 'Log one hundred and fifty', tier: 'gold', test: (s) => s.n >= 150, prog: (s) => [s.n, 150], unit: ['drink', 'drinks'] },
    { id: 'twohundred', name: 'Two Hundred', hint: 'Log two hundred', tier: 'gold', test: (s) => s.n >= 200, prog: (s) => [s.n, 200], unit: ['drink', 'drinks'] },
    { id: 'everybar', name: 'Every Bar', hint: 'Check in at every venue', tier: 'gold', test: (s) => s.totalVenues > 0 && s.venues >= s.totalVenues, prog: (s) => [s.venues, s.totalVenues], unit: ['venue', 'venues'] },
    { id: 'martini', name: 'Martini Club', hint: 'Every martini on board', tier: 'silver', test: (s) => s.catDone('Martini') },
    { id: 'margarita', name: 'Margarita Queen', hint: 'Every margarita', tier: 'silver', test: (s) => s.catDone('Margarita') },
    { id: 'frozen', name: 'Brain Freeze', hint: 'Every frozen drink', tier: 'silver', test: (s) => s.frozenDone },
    { id: 'coffee', name: 'Coffee Expert', hint: 'Eight coffee cocktails', tier: 'bronze', test: (s) => s.cat('Coffee') >= 8, prog: (s) => [s.cat('Coffee'), 8], unit: ['coffee cocktail', 'coffee cocktails'] },
    { id: 'whiskey', name: 'Whiskey Lover', hint: 'Ten whiskey or bourbon', tier: 'silver', test: (s) => s.sp('Whiskey') + s.sp('Bourbon') >= 10, prog: (s) => [s.sp('Whiskey') + s.sp('Bourbon'), 10], unit: ['whiskey', 'whiskeys'] },
    { id: 'gin', name: 'Gin Explorer', hint: 'Ten gin drinks', tier: 'silver', test: (s) => s.sp('Gin') >= 10, prog: (s) => [s.sp('Gin'), 10], unit: ['gin', 'gins'] },
    { id: 'rum', name: 'Rum Captain', hint: 'Twelve rum drinks', tier: 'silver', test: (s) => s.sp('Rum') >= 12, prog: (s) => [s.sp('Rum'), 12], unit: ['rum', 'rums'] },
    { id: 'wine', name: 'Wine Connoisseur', hint: 'Twelve wines by the glass', tier: 'silver', test: (s) => s.cat('Wine') >= 12, prog: (s) => [s.cat('Wine'), 12], unit: ['wine', 'wines'] },
    { id: 'master', name: 'Cocktail Master', hint: 'Half of everything', tier: 'gold', percent: true, test: (s) => s.pct >= 50, prog: (s) => [Math.round(s.pct), 50] },
    { id: 'champion', name: 'Sun Princess Champion', hint: 'Ninety per cent', tier: 'special', percent: true, test: (s) => s.pct >= 90, prog: (s) => [Math.round(s.pct), 90] },
  ]
  const B = Object.fromEntries(BADGES.map((b) => [b.id, b]))
  const TIER = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', special: 'Special' }
  const TIER_RANK = { special: 4, gold: 3, silver: 2, bronze: 1 }
  const count = (b, cur, need) => b.percent ? `${cur}% of ${need}%` : `${cur} of ${need}`
  const remainder = (b, cur, need) => {
    const left = Math.max(1, need - cur)
    if (b.percent) return `${left}% more of the list`
    const u = b.unit
    const n = left === 1 ? 'one' : left
    return u ? `${n} more ${left === 1 ? u[0] : u[1]}` : `${n} more`
  }

  function medals() {
    const s = stat()
    const earned = [], reach = [], later = []
    for (const b of BADGES) {
      if (b.test(s)) {
        // the day it was struck: the first day the passport passed the test
        let day = DAY
        for (let d = 0; d <= DAY; d++) if (b.test(stat(d))) { day = d; break }
        earned.push({ b, day }); continue
      }
      const p = b.prog ? b.prog(s) : null
      const pct = p && p[1] > 0 ? Math.min(100, (p[0] / p[1]) * 100) : 0
      // in reach means at least halfway; the rest are still to strike, with what earns them
      if (p && pct >= 50) reach.push({ b, cur: p[0], need: p[1], pct })
      else later.push({ b, cur: p ? p[0] : 0, need: p ? p[1] : 0, pct })
    }
    earned.sort((x, y) => TIER_RANK[y.b.tier] - TIER_RANK[x.b.tier] || y.day - x.day)
    reach.sort((x, y) => y.pct - x.pct)
    later.sort((x, y) => y.pct - x.pct)
    const newest = earned.slice().sort((x, y) => y.day - x.day || TIER_RANK[y.b.tier] - TIER_RANK[x.b.tier])[0]
    return { earned, reach, later, newest, s }
  }

  function days() {
    const s = stat()
    const today = DRINKS.filter((d) => me[d.id] && me[d.id].t && me[d.id].day === TODAY)
    let streak = 0
    for (let d = DAY; d >= 0; d--) { if (DRINKS.some((x) => me[x.id] && me[x.id].t && me[x.id].day === D.days[d])) streak++; else break }
    return { s, today, streak }
  }

  // ── the sky by the hour (SeaHero.tsx's six palettes; dusk darkened for type on the sky) ─────
  const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
  const SKY = {
    dawn: { top: '#B49CC0', hor: '#F6C9A2', hi: '#3E8FA0', lo: '#123A52', sun: '#FFD9A8', band: '#F3B98C', hull: '#123A52', sunR: .14, sunI: .5, core: 0, glow: .09, bandI: .26, glint: .35, stars: 0 },
    morning: { top: '#609CCF', hor: '#BDD9DA', hi: '#28AAA3', lo: '#093755', sun: '#F6CE79', band: '#D8E6DE', hull: '#093755', sunR: .17, sunI: .58, core: 0, glow: .07, bandI: 0, glint: .4, stars: 0 },
    afternoon: { top: '#3D7CC4', hor: '#A8CDE6', hi: '#1E9FB4', lo: '#0A3A62', sun: '#FFF2CC', band: '#C7DDEC', hull: '#0A3A62', sunR: .13, sunI: .46, core: 0, glow: .05, bandI: 0, glint: .34, stars: 0 },
    golden: { top: '#7F97C6', hor: '#F3C078', hi: '#2E9A96', lo: '#0C3550', sun: '#FFD48C', band: '#F6B45E', hull: '#0C3550', sunR: .17, sunI: .62, core: 0, glow: .11, bandI: .34, glint: .46, stars: 0 },
    dusk: { top: '#434262', hor: '#7A6480', hi: '#1D6E80', lo: '#0A2A42', sun: '#F2A05E', band: '#D27440', hull: '#3B5B78', sunR: .15, sunI: .22, core: 0, glow: .07, bandI: .40, glint: .22, stars: .3 },
    night: { top: '#0E1E38', hor: '#40587A', hi: '#10465A', lo: '#041D2E', sun: '#E9EFF7', band: '#4A6183', hull: '#3B5B78', sunR: .05, sunI: .95, core: .66, glow: .07, bandI: .2, glint: .16, stars: 1 },
  }
  for (const k in SKY) for (const c of ['top', 'hor', 'hi', 'lo', 'sun', 'band', 'hull']) SKY[k][c] = hexRgb(SKY[k][c])
  const dayPart = (h) => h < 5 ? 'night' : h < 7 ? 'dawn' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 19 ? 'golden' : h < 21 ? 'dusk' : 'night'
  const greetingWord = (p) => p === 'dawn' || p === 'morning' ? 'Morning' : p === 'afternoon' ? 'Afternoon' : 'Evening'
  const EDGES = [5, 7, 12, 17, 19, 21]
  const mixN = (a, b, t) => a + (b - a) * t
  function skyAt(hour) {
    const h = ((hour % 24) + 24) % 24
    for (const e of EDGES) {
      const d = h - e
      if (d > -0.5 && d < 0.5) {
        const t0 = d + 0.5, t = t0 * t0 * (3 - 2 * t0)
        const a = SKY[dayPart(e - 1)], b = SKY[dayPart(e)], o = {}
        for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, i) => mixN(v, b[k][i], t)) : mixN(a[k], b[k], t)
        return o
      }
    }
    return SKY[dayPart(h)]
  }
  // a pinned hour is the middle of that hour, so ?hour=19 is dusk rather than the cross-fade into it
  const pinRaw = Q.get('hour')
  const PIN = pinRaw !== null && /^\d{1,2}$/.test(pinRaw) && +pinRaw <= 23 ? +pinRaw + 0.5 : null
  const nowHour = () => { if (PIN !== null) return PIN; const d = new Date(); return d.getHours() + d.getMinutes() / 60 }
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
  // light or dark: measured on the sky halfway between the horizon and the top, where the type sits
  const themeOf = (s) => lum(s.hor.map((v, i) => mixN(v, s.top[i], 0.35))) > 0.18 ? 'light' : 'dark'
  const rgbStr = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`

  // the tide line is completion, as on the hero: from 45% of the screen's height at nothing to 59%
  // at everything, so it never climbs into the type on the sky and Home's medal case sits whole
  // above the tab bar
  const horizonFrac = () => 0.45 + 0.14 * Math.min(1, stat().n / DRINKS.length)

  // ── the backdrop: a full-screen port of the hero's sea shader ─────────────────────────────────
  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uHz; uniform float uAmp;
uniform vec3 uTop, uHor, uHi, uLo, uSun, uBand;
uniform vec4 uSunP;   // x, y (0..1), radius (px), intensity
uniform vec4 uSunQ;   // core, glow, band, glint
uniform float uStars;
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
// the hero's swell, term for term, scaled from its 280px to this screen's height
float swell(float x, float t){
  return uAmp * (0.034*sin(x*9.0 - t*0.90) + 0.010*sin(x*17.0 + t*1.30 + 1.3) + 0.004*sin(x*41.0 - t*2.10));
}
void main(){
  vec2 px = gl_FragCoord.xy; vec2 uv = px / uRes; float t = uTime; float hz = uHz;
  vec3 col = mix(uHor, uTop, smoothstep(hz, 1.8, uv.y));
  col = mix(col, uBand, uSunQ.z * smoothstep(hz + 0.30, hz, uv.y));
  float ds = length(px - uSunP.xy * uRes);
  col += uSun * smoothstep(uSunP.z, uSunP.z * uSunQ.x, ds) * uSunP.w;
  col += uSun * smoothstep(uSunP.z * 3.0, 0.0, ds) * uSunQ.y;
  float st = step(0.9992, hash(floor(px / 2.0))) * uStars * smoothstep(hz + 0.08, 0.9, uv.y);
  col += vec3(st * 0.55);
  float surf = hz + swell(uv.x, t);
  if (uv.y < surf) {
    float depth = surf - uv.y;
    vec3 water = mix(uLo, uHi, clamp(1.0 - depth / 0.40, 0.0, 1.0));
    water = mix(water, uHi, smoothstep(0.05 * uAmp, 0.0, depth));
    // long low swells in the water, so the glass above has something to bend
    float rip = noise(vec2(uv.x * 7.0 + t * 0.05, depth * 55.0 - t * 0.35));
    water += (rip - 0.5) * 0.07 * smoothstep(0.34, 0.0, depth);
    float glint = smoothstep(0.12, 0.0, abs(uv.x - uSunP.x)) * smoothstep(0.10 * uAmp * 3.0, 0.0, depth)
                * (0.35 + 0.65 * noise(vec2(uv.x * 70.0, t * 2.2)));
    col = water + uSun * glint * uSunQ.w;
  }
  col += vec3(1.0) * smoothstep(1.4 / uRes.y, 0.0, abs(uv.y - surf)) * 0.3;
  gl_FragColor = vec4(col, 1.0);
}`
  const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'
  const swellJS = (x, t, amp) => amp * (0.034 * Math.sin(x * 9.0 - t * 0.90) + 0.010 * Math.sin(x * 17.0 + t * 1.30 + 1.3) + 0.004 * Math.sin(x * 41.0 - t * 2.10))

  const Sea = (() => {
    const cv = document.getElementById('sea')
    const ship = $('.ship')
    const floor = $('.sky-floor')
    let gl = null, U = {}, raf = 0, paused = false, t0 = performance.now(), dpr = 1
    function compile(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null }
    try {
      gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
      if (gl) {
        const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG)
        const prog = vs && fs && gl.createProgram()
        if (prog) { gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog) }
        if (!prog || !gl.getProgramParameter(prog, gl.LINK_STATUS)) gl = null
        else {
          gl.useProgram(prog)
          const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
          const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
          for (const n of ['uRes', 'uTime', 'uHz', 'uAmp', 'uTop', 'uHor', 'uHi', 'uLo', 'uSun', 'uBand', 'uSunP', 'uSunQ', 'uStars']) U[n] = gl.getUniformLocation(prog, n)
        }
      }
    } catch (e) { gl = null }
    if (!gl) cv.classList.add('nogl')

    let sky = skyAt(nowHour())
    function applySky() {
      sky = skyAt(nowHour())
      const theme = themeOf(sky)
      if (app.dataset.sky !== theme) {
        const st = document.createElement('style')
        st.textContent = '*,*::before,*::after{transition:none!important}'
        document.head.appendChild(st)
        app.dataset.sky = theme
        app.getBoundingClientRect()
        setTimeout(() => st.remove(), 0)
      }
      app.style.setProperty('--hull', rgbStr(sky.hull))
      const H = app.clientHeight, hz = horizonFrac(), y = (1 - hz) * 100
      app.style.setProperty('--hz-y', Math.round((1 - hz) * H) + 'px')
      ship.style.top = y + '%'
      // the floor where there is no WebGL: the same sky, the same tide line, no motion
      floor.style.background = `radial-gradient(circle at 78% 58px, ${rgbStr(sky.sun)} 0, rgba(0,0,0,0) ${Math.round(sky.sunR * 280)}px),` +
        `linear-gradient(180deg, ${rgbStr(sky.hor.map((v, i) => mixN(v, sky.top[i], 0.42)))} 0%, ${rgbStr(sky.hor)} ${y - 1}%, ${rgbStr(sky.hi)} ${y}%, ${rgbStr(sky.lo)} 100%)`
    }
    function draw(now) {
      const w = app.clientWidth, h = app.clientHeight
      const t = STILL || REDUCED ? 8 : (now - t0) / 1000
      const amp = 280 / h, hz = horizonFrac()
      if (gl) {
        dpr = Math.min(devicePixelRatio || 1, 1.5)
        const W = Math.round(w * dpr), Hh = Math.round(h * dpr)
        if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; gl.viewport(0, 0, W, Hh) }
        gl.uniform2f(U.uRes, W, Hh); gl.uniform1f(U.uTime, t); gl.uniform1f(U.uHz, hz); gl.uniform1f(U.uAmp, amp)
        const c3 = (u, v) => gl.uniform3f(u, v[0] / 255, v[1] / 255, v[2] / 255)
        c3(U.uTop, sky.top); c3(U.uHor, sky.hor); c3(U.uHi, sky.hi); c3(U.uLo, sky.lo); c3(U.uSun, sky.sun); c3(U.uBand, sky.band)
        // the sun (the moon at night) high on the right, where the top bar covers it once content scrolls
        gl.uniform4f(U.uSunP, 0.78, 1 - 58 / h, sky.sunR * 280 * 0.8 * dpr, sky.sunI)
        gl.uniform4f(U.uSunQ, sky.core, sky.glow, sky.bandI, sky.glint)
        gl.uniform1f(U.uStars, sky.stars)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      // the liner rides the water: its lift from the swell under it, a third of the slope as pitch
      const stern = 0.62, bow = 0.62 + 104 / w * 0.92
      const ys = swellJS(stern, t, amp), yb = swellJS(bow, t, amp)
      const lift = ((ys + yb) / 2) * h
      const pitch = 0.3 * Math.atan2((yb - ys) * h, (bow - stern) * w) * 180 / Math.PI
      ship.style.transform = `translateY(-86%) translateY(${(-lift).toFixed(2)}px) rotate(${(-pitch).toFixed(2)}deg)`
    }
    function loop(now) { draw(now); raf = requestAnimationFrame(loop) }
    function start() { if (raf || paused || STILL || REDUCED || document.hidden) { draw(performance.now()); return } raf = requestAnimationFrame(loop) }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0 }
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start() })
    addEventListener('resize', () => { applySky(); draw(performance.now()) })
    // the clock: re-read once a minute, so a session that runs into the evening gets the evening
    setInterval(() => { if (PIN === null) { applySky(); if (!raf) draw(performance.now()) } }, 60000)
    applySky(); draw(performance.now())
    return {
      start, applySky, sky: () => sky, draw: () => draw(performance.now()),
      // one live effect at a time: the sea holds still while a sheet's wave runs over it
      pause() { paused = true; stop(); draw(performance.now()) },
      resume() { paused = false; start() },
    }
  })()
  // for a render that cannot run frames (an automation tab): paint one frame on demand
  window.__openWater = { renderOnce: () => Sea.draw() }

  // ── rendering helpers ─────────────────────────────────────────────────────────────────────────
  const stars = (n, size = 13) => n ? `<span class="stars" aria-label="${n} out of 5">${Array.from({ length: n }, () => starSvg(size, true)).join('')}</span>` : ''
  const glassIcon = (d, size = 24) => `<span class="row-lead">${icon(d.g, size)}</span>`

  function coin(b, size, opts = {}) {
    const small = size < 64 ? ' data-small' : ''
    const emb = `<svg class="coin-emb" viewBox="0 0 100 100" aria-hidden="true">
        <use href="#em-${b.id}" transform="translate(1.6 1.8)" class="e-sh"/>
        <use href="#em-${b.id}" transform="translate(-1 -1.1)" class="e-hi"/>
        <use href="#em-${b.id}" fill="url(#emb-${b.tier})"/></svg>`
    const face = `<span class="coin t-${b.tier}"${small} style="--d:${size}px"><span class="coin-beads"></span>${emb}</span>`
    if (!opts.turn && !opts.tilt) return face
    // a coin that turns carries its thickness: edge layers between the face and a plain reverse
    const thick = Math.max(3, Math.round(size * 0.06))
    const layers = Array.from({ length: thick }, (_, i) => `<span class="edge" style="transform:translateZ(${-(i + 0.5)}px)"></span>`).join('')
    const rev = `<svg class="coin-rev" viewBox="0 0 150 52" aria-hidden="true"><path fill="url(#emb-${b.tier})" d="M6 33 H144 L133 47 Q131 49 126 49 H24 Q19 49 17 47 Z M31 33 V24 H119 V33 Z M45 24 V17 H105 V24 Z M74 17 V12 H102 V17 Z M53 17 L56 5 H67 L70 17 Z"/></svg>`
    const back = `<span class="back"><span class="coin t-${b.tier}"${small} style="--d:${size}px"><span class="coin-beads"></span>${rev}</span></span>`
    return `<span class="coin3d${opts.turn ? ' is-turning' : ''}" style="--thick:${thick}px;width:${size}px;height:${size}px"><span class="spinner t-${b.tier}" style="width:${size}px;height:${size}px">${layers}${back}${face}</span></span>`
  }
  function blank(size, pct) {
    const r = 46, c = 2 * Math.PI * r
    const ring = pct ? `<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="${r}"/><circle class="val" cx="50" cy="50" r="${r}" stroke-dasharray="${(c * pct / 100).toFixed(1)} ${c.toFixed(1)}"/></svg>` : ''
    return `<span class="blank" style="--d:${size}px">${ring}</span>`
  }

  // ── HOME ──────────────────────────────────────────────────────────────────────────────────────
  let coinTurned = STILL || REDUCED
  function renderHome() {
    const { s, today, streak } = days()
    const pct = Math.round(s.pct)
    const m = medals()
    const part = dayPart(nowHour())
    const next = m.reach[0]
    const fan = m.earned.filter((e) => e !== m.newest)
    const turn = !coinTurned
    coinTurned = true

    // the last bar: the venue of the last drink written today (never a guess from the clock)
    const last = today.length ? today[today.length - 1].v : null
    const barList = last ? drinksAt(last) : []
    const barDone = barList.filter((d) => tried(d.id)).length
    const barNext = barList.find((d) => !tried(d.id))

    return `
    <section class="hero" aria-label="Your voyage">
      <p class="hero-greet">${greetingWord(part)}, Alex</p>
      <p class="hero-day">Day ${DAY + 1} of ${TOTAL_DAYS} · ${longDate(TODAY)}</p>
      <p class="hero-pct tnum" aria-label="${pct} per cent of the list tried">${pct}<small>%</small></p>
      <p class="hero-sub tnum">${s.n} of ${DRINKS.length} tried</p>
      <div class="hero-facts">
        <div><div class="fact-v tnum">${today.length}</div><div class="fact-l">today</div></div>
        <div><div class="fact-v tnum">${streak}</div><div class="fact-l">day streak</div></div>
        <div><div class="fact-v tnum">${s.venues} of ${s.totalVenues}</div><div class="fact-l">venues</div></div>
      </div>
    </section>

    <section class="plat" aria-labelledby="h-medals">
      <div class="plat-head"><h2 id="h-medals">Medals</h2><span class="meta tnum">${m.earned.length} of ${BADGES.length}</span></div>
      ${m.newest ? `
      <button type="button" class="row case-new" data-act="medal" data-id="${m.newest.b.id}" aria-label="New medal, ${esc(m.newest.b.name)}, ${TIER[m.newest.b.tier]}. ${esc(m.newest.b.hint)}.">
        ${coin(m.newest.b, 96, { turn })}
        <span class="row-copy"><span class="meta">New medal</span><span class="name">${esc(m.newest.b.name)}</span><span class="meta">${TIER[m.newest.b.tier]} · ${esc(m.newest.b.hint)}</span></span>
      </button>` : ''}
      <button type="button" class="row case-fan" data-act="case" aria-label="Open the medal case: ${m.earned.length} of ${BADGES.length} earned">
        <span class="fan">${fan.map((e) => coin(e.b, 52)).join('')}</span>
        <span class="fan-more">All ${BADGES.length}</span>${icon('chev', 20, 'class="chev"')}
      </button>
      ${next ? `
      <button type="button" class="row" data-act="medal" data-id="${next.b.id}" aria-label="${esc(next.b.name)}, ${count(next.b, next.cur, next.need)}">
        ${blank(44, next.pct)}
        <span class="row-copy"><span class="strong">${esc(next.b.name)}</span><span class="meta tnum">${count(next.b, next.cur, next.need)} · ${remainder(next.b, next.cur, next.need)}</span></span>
        ${icon('chev', 20, 'class="chev"')}
      </button>` : ''}
    </section>

    <section class="plat" aria-labelledby="h-foryou">
      <div class="plat-head"><h2 id="h-foryou">For you</h2></div>
      <ul class="shelf" role="list">
        ${picks().map((p) => `
        <li class="pick"><button type="button" class="pick" data-act="drink" data-id="${p.d.id}" aria-label="${esc(p.d.n)}, ${esc(VENUES[p.d.v].name)}. ${esc(p.why)}">
          ${glassIcon(p.d, 28)}
          <span class="pick-why">${esc(p.why)}</span>
          <span class="pick-name">${esc(p.d.n)}</span>
          <span class="pick-where">${esc(VENUES[p.d.v].name)}</span>
        </button></li>`).join('')}
      </ul>
      <button type="button" class="row" data-act="shake" aria-haspopup="dialog">
        <span class="row-lead shaker">${icon('shaker')}</span>
        <span class="row-copy"><span class="strong">Shake for a drink</span></span>
      </button>
    </section>

    ${last ? `
    <section class="plat" aria-labelledby="h-bar">
      <div class="plat-head"><h2 id="h-bar">Last bar</h2></div>
      <button type="button" class="row" data-act="tab" data-tab="ship" aria-label="${esc(VENUES[last].name)}, ${barDone} of ${barList.length} tried here">
        <span class="row-copy"><span class="strong">${esc(VENUES[last].name)}</span>
        <span class="meta tnum">${barDone} of ${barList.length} tried here${barNext ? ` · ${esc(barNext.n)} next` : ''}</span></span>
        ${icon('chev', 20, 'class="chev"')}
      </button>
    </section>` : ''}`
  }

  // For you: honest picks only. A crew member whose ratings match yours on the drinks you share,
  // or the spirit you have given three or more fives.
  function picks() {
    const out = [], seen = new Set()
    for (const f of CREW) {
      const shared = Object.keys(f.entries).filter((id) => me[id] && me[id].r)
      const matches = shared.filter((id) => Math.abs(me[id].r - f.entries[id].r) <= 0).length
      const twin = shared.length >= 3 && matches / shared.length >= 0.8
      Object.entries(f.entries).filter(([id, e]) => e.rec && !tried(id)).sort((a, b) => b[1].r - a[1].r).forEach(([id]) => {
        if (seen.has(id)) return
        seen.add(id); out.push({ d: BY_ID[id], why: twin ? `${f.name} matches your taste` : `Loved by ${f.name}`, rank: twin ? 0 : 2 })
      })
    }
    const fives = {}
    DRINKS.forEach((d) => { if (me[d.id] && me[d.id].r === 5) d.sp.forEach((x) => { fives[x] = (fives[x] || 0) + 1 }) })
    const top = Object.entries(fives).filter(([x, n]) => n >= 3 && x !== 'Liqueur').sort((a, b) => b[1] - a[1])[0]
    if (top) DRINKS.filter((d) => d.sp.includes(top[0]) && !tried(d.id) && !seen.has(d.id)).slice(0, 2)
      .forEach((d) => out.push({ d, why: `Because you love ${top[0].toLowerCase()}`, rank: 1 }))
    return out.sort((a, b) => a.rank - b.rank).slice(0, 6)
  }

  // ── DRINKS ────────────────────────────────────────────────────────────────────────────────────
  let filter = 'all', dq = ''
  function drinkRow(d) {
    const e = me[d.id] || {}
    const meta = d.ing || (d.p !== null ? money(d.p) : '')
    return `
      <div class="drow" data-row="${d.id}">
        <button type="button" class="drow-open" data-act="drink" data-id="${d.id}">
          ${glassIcon(d)}
          <span class="drow-copy">
            <span class="drow-l1"><span class="drow-name">${esc(d.n)}</span>${stars(e.r)}</span>
            ${meta ? `<span class="drow-meta"><span class="ing">${esc(d.ing)}</span>${d.p !== null ? `<span class="price tnum">${money(d.p)}</span>` : ''}</span>` : ''}
          </span>
        </button>
        <button type="button" class="try" data-act="try" data-id="${d.id}" aria-pressed="${!!e.t}" aria-label="Tried, ${esc(d.n)}">${e.t ? checkFilled(26) : icon('check', 26)}</button>
      </div>`
  }
  function groupsFor() {
    const q = dq.trim().toLowerCase()
    const keep = (d) => matchQ(d, q) && (filter === 'all' || (filter === 'untried' && !tried(d.id)) || (filter === 'fav' && me[d.id] && me[d.id].f))
    return VKEYS.filter((k) => !VENUES[k].shares || DRINKS.some((d) => d.v === k)).map((k) => ({ k, list: DRINKS.filter((d) => d.v === k && keep(d)) })).filter((g) => g.list.length)
  }
  function countLine(groups = groupsFor()) {
    const n = groups.reduce((a, g) => a + g.list.length, 0)
    const label = filter === 'untried' ? 'not tried' : filter === 'fav' ? (n === 1 ? 'favourite' : 'favourites') : (n === 1 ? 'drink' : 'drinks')
    return `<p class="count tnum" id="d-count">${n} ${label}${filter === 'all' && !dq.trim() ? ` · ${stat().n} tried` : ''}</p>`
  }
  const matchQ = (d, q) => !q || (d.n + ' ' + VENUES[d.v].name + ' ' + d.ing + ' ' + d.sp.join(' ')).toLowerCase().includes(q)
  function drinksList() {
    const groups = groupsFor()
    return `
      ${countLine(groups)}
      ${groups.length ? groups.map((g) => {
        const all = DRINKS.filter((d) => d.v === g.k), done = all.filter((d) => tried(d.id)).length
        return `
        <section class="plat" aria-label="${esc(VENUES[g.k].name)}">
          <div class="plat-head"><h2>${esc(VENUES[g.k].name)}</h2><span class="meta tnum">Deck ${VENUES[g.k].deck}${done ? ` · ${done} of ${all.length}` : ''}</span></div>
          ${g.list.map(drinkRow).join('')}
        </section>`
      }).join('') : `<section class="plat"><p class="empty">No drink matches that. Try a bar or a spirit.</p></section>`}`
  }
  function renderDrinks() {
    return `
      <h1 class="large">Drinks</h1>
      <div class="find">
        <label class="field">${icon('search', 20)}<span class="sr-only">Search drinks</span>
          <input id="dq" type="search" value="${esc(dq)}" placeholder="Negroni, Crooners, rum" autocomplete="off" enterkeyhint="search"></label>
      </div>
      <div class="seg" role="group" aria-label="Show">
        <button type="button" data-act="filter" data-f="all" aria-pressed="${filter === 'all'}">All</button>
        <button type="button" data-act="filter" data-f="untried" aria-pressed="${filter === 'untried'}">Not tried</button>
        <button type="button" data-act="filter" data-f="fav" aria-pressed="${filter === 'fav'}">Favourites</button>
      </div>
      <div id="d-list">${drinksList()}</div>`
  }

  // ── SHIP ──────────────────────────────────────────────────────────────────────────────────────
  function renderShip() {
    const decks = [...new Set(VKEYS.map((k) => VENUES[k].deck))].sort((a, b) => a - b)
    const s = stat()
    return `
      <h1 class="large">Ship</h1>
      ${decks.map((dk) => `
      <section class="plat" aria-label="Deck ${dk}">
        <div class="plat-head"><h2>Deck ${dk === 15 ? '15/16' : dk}</h2></div>
        ${VKEYS.filter((k) => VENUES[k].deck === dk).map((k) => {
          const v = VENUES[k], list = drinksAt(k), done = list.filter((d) => tried(d.id)).length
          const went = v.visited || s.ids && [...s.ids].some((id) => BY_ID[id].v === k)
          return `<div class="row">
            <span class="row-copy"><span class="strong">${esc(v.name)}</span>
              <span class="meta tnum">${v.shares ? `Same list as ${esc(VENUES[v.shares].name)} · ` : ''}${list.length ? `${done} of ${list.length}` : 'No drinks listed'}</span>
              ${done ? `<span class="meter"><i style="width:${(done / list.length * 100).toFixed(1)}%"></i></span>` : ''}</span>
            ${went ? `<span class="visited" aria-label="Visited">${checkFilled(22)}</span>` : ''}
          </div>`
        }).join('')}
      </section>`).join('')}`
  }

  // ── CREW, with the crew's own facts (what the roundup's crew slides say) ──────────────────────
  function crewFacts() {
    const people = [{ name: 'You', r: (id) => me[id] && me[id].r }, ...CREW.map((f) => ({ name: f.name, r: (id) => f.entries[id] && f.entries[id].r }))]
    const ids = [...new Set([...Object.keys(me), ...CREW.flatMap((f) => Object.keys(f.entries))])].filter((id) => BY_ID[id])
    // the favourite: the best average among drinks all three of you rated
    let fav = null
    for (const id of ids) {
      const rs = people.map((p) => p.r(id)).filter(Boolean)
      if (rs.length < people.length) continue
      const avg = rs.reduce((a, b) => a + b, 0) / rs.length
      if (!fav || avg > fav.avg) fav = { id, avg }
    }
    // the one that split you: the widest gap between your rating and a crew member's
    let split = null
    for (const f of CREW) for (const [id, e] of Object.entries(f.entries)) {
      if (!me[id] || !me[id].r) continue
      const gap = Math.abs(me[id].r - e.r)
      if (!split || gap > split.gap) split = { id, gap, f, theirs: e.r, yours: me[id].r }
    }
    // your find: a five of yours, a favourite, that nobody else has tried
    const find = DRINKS.find((d) => me[d.id] && me[d.id].r === 5 && me[d.id].f && CREW.every((f) => !f.entries[d.id]))
    // one they loved that you missed: the crew's best untried by you
    let missed = null
    for (const f of CREW) for (const [id, e] of Object.entries(f.entries)) if (!tried(id) && e.r === 5 && (!missed || e.r > missed.e.r)) missed = { id, e, f }
    const words = ['none', 'one', 'two', 'three', 'four', 'five']
    return [
      fav && { d: BY_ID[fav.id], k: 'The crew’s favourite', line: `${fav.avg.toFixed(1)} on average, from all three of you` },
      split && { d: BY_ID[split.id], k: 'The one that split you', line: `${split.f.name} gave it ${words[split.theirs]}. You gave it ${words[split.yours]}.` },
      find && { d: find, k: 'Your find', line: 'Five stars from you, and nobody else has had it' },
      missed && { d: BY_ID[missed.id], k: 'For next time', line: `${missed.f.name} gave it five. You have not had it yet.` },
    ].filter(Boolean)
  }
  function renderCrew() {
    return `
      <h1 class="large">Crew</h1>
      <section class="plat" aria-label="You">
        <div class="row"><span class="dot" style="background:var(--friend-aqua)" aria-hidden="true">A</span>
          <span class="row-copy"><span class="strong">Alex</span><span class="meta">How your crew sees you</span></span></div>
      </section>
      <section class="plat" aria-labelledby="h-with">
        <div class="plat-head"><h2 id="h-with">Sailing with</h2></div>
        ${CREW.map((f) => `
        <div class="row"><span class="dot" style="background:${f.colour}" aria-hidden="true">${f.name[0]}</span>
          <span class="row-copy"><span class="strong">${f.name}</span><span class="meta tnum">${Object.keys(f.entries).length} tried · synced ${f.synced}</span></span></div>`).join('')}
        <button type="button" class="row" data-act="noop"><span class="row-copy"><span class="strong">Add to your crew</span></span>${icon('chev', 20, 'class="chev"')}</button>
      </section>
      <section class="plat" aria-labelledby="h-sofar">
        <div class="plat-head"><h2 id="h-sofar">The crew so far</h2></div>
        ${crewFacts().map((x) => `
        <button type="button" class="row" data-act="drink" data-id="${x.d.id}">
          ${glassIcon(x.d)}
          <span class="row-copy"><span class="meta">${x.k}</span><span class="strong">${esc(x.d.n)}</span><span class="meta" style="white-space:normal">${esc(x.line)}</span></span>
        </button>`).join('')}
      </section>`
  }

  // ── YOU ───────────────────────────────────────────────────────────────────────────────────────
  let youSeg = 'stats'
  function renderYou() {
    const segs = [['stats', 'Stats'], ['medals', 'Medals'], ['log', 'Log']]
    let body = ''
    if (youSeg === 'stats') {
      const decks = [...new Set(VKEYS.map((k) => VENUES[k].deck))].sort((a, b) => a - b)
      const rows = decks.map((dk) => {
        const list = DRINKS.filter((d) => VENUES[d.v].deck === dk)
        const done = list.filter((d) => tried(d.id)).length
        return { dk, done, all: list.length }
      }).filter((r) => r.all)
      const spirits = {}
      DRINKS.forEach((d) => { if (tried(d.id)) d.sp.forEach((x) => { spirits[x] = (spirits[x] || 0) + 1 }) })
      const top = Object.entries(spirits).sort((a, b) => b[1] - a[1]).slice(0, 5)
      body = `
      <section class="plat" aria-labelledby="h-been">
        <div class="plat-head"><h2 id="h-been">Where you have been</h2></div>
        ${rows.map((r) => `<div class="row"><span class="row-copy"><span class="strong">Deck ${r.dk === 15 ? '15/16' : r.dk}</span>
          <span class="meta tnum">${r.done} of ${r.all}</span>${r.done ? `<span class="meter" style="height:6px"><i style="width:${(r.done / r.all * 100).toFixed(1)}%"></i></span>` : ''}</span></div>`).join('')}
      </section>
      <section class="plat" aria-labelledby="h-drink">
        <div class="plat-head"><h2 id="h-drink">What you drink</h2></div>
        ${top.map(([x, n]) => `<div class="row"><span class="row-copy"><span class="strong">${x}</span></span><span class="meta tnum">${n}</span></div>`).join('')}
      </section>`
    } else if (youSeg === 'medals') {
      body = caseBody()
    } else {
      const byDay = D.days.slice(0, DAY + 1).map((iso, i) => ({ iso, i, list: DRINKS.filter((d) => me[d.id] && me[d.id].t && me[d.id].day === iso) })).reverse().filter((g) => g.list.length).slice(0, 2)
      body = byDay.map((g) => `
      <section class="plat" aria-label="Day ${g.i + 1}">
        <div class="plat-head"><h2>Day ${g.i + 1} · ${shortDate(g.iso)}</h2><span class="meta tnum">${g.list.length}</span></div>
        ${g.list.map((d) => `<button type="button" class="row" data-act="drink" data-id="${d.id}">${glassIcon(d)}<span class="row-copy"><span class="strong">${esc(d.n)}</span></span>${stars(me[d.id].r)}</button>`).join('')}
      </section>`).join('')
    }
    return `
      <h1 class="large">You</h1>
      <div class="seg" role="group" aria-label="Show" style="margin:0 0 var(--s3)">
        ${segs.map(([k, l]) => `<button type="button" data-act="youseg" data-seg="${k}" aria-pressed="${youSeg === k}">${l}</button>`).join('')}
      </div>
      ${body}`
  }

  // ── THE MEDAL CASE ────────────────────────────────────────────────────────────────────────────
  function caseBody() {
    const m = medals()
    const [feature, ...rest] = m.earned
    return `
      <section class="plat" aria-labelledby="h-earned">
        <div class="plat-head"><h2 id="h-earned">Earned</h2><span class="meta tnum">${m.earned.length} of ${BADGES.length}</span></div>
        ${feature ? `
        <button type="button" class="feature" data-act="medal" data-id="${feature.b.id}" style="width:100%">
          ${coin(feature.b, 148)}
          <span class="name">${esc(feature.b.name)}</span>
          <span class="meta">${TIER[feature.b.tier]} · ${esc(feature.b.hint)} · Day ${feature.day + 1}</span>
        </button>` : ''}
        ${rest.length ? `<div class="struck">${rest.map((e) => `
          <button type="button" data-act="medal" data-id="${e.b.id}" aria-label="${esc(e.b.name)}, ${TIER[e.b.tier]}">
            ${coin(e.b, 92)}<span class="nm">${esc(e.b.name)}</span><span class="tr">${TIER[e.b.tier]}</span>
          </button>`).join('')}</div>` : ''}
      </section>
      ${m.reach.length ? `
      <section class="plat" aria-labelledby="h-reach">
        <div class="plat-head"><h2 id="h-reach">In reach</h2></div>
        ${m.reach.map((r) => `
        <button type="button" class="row" data-act="medal" data-id="${r.b.id}" aria-label="${esc(r.b.name)}, ${count(r.b, r.cur, r.need)}">
          ${blank(44, r.pct)}
          <span class="row-copy"><span class="strong">${esc(r.b.name)}</span><span class="meta tnum">${count(r.b, r.cur, r.need)} · ${remainder(r.b, r.cur, r.need)}</span></span>
        </button>`).join('')}
      </section>` : ''}
      ${m.later.length ? `
      <section class="plat" aria-labelledby="h-later">
        <div class="plat-head"><h2 id="h-later">Still to strike</h2></div>
        ${m.later.map((r) => `
        <button type="button" class="row" data-act="medal" data-id="${r.b.id}">
          ${blank(36)}
          <span class="row-copy"><span class="strong">${esc(r.b.name)}</span><span class="meta tnum">${esc(r.b.hint)}${r.cur ? ` · ${count(r.b, r.cur, r.need)}` : ''}</span></span>
        </button>`).join('')}
      </section>` : ''}`
  }
  const renderMedals = () => `<h1 class="large">Medals</h1>${caseBody()}`

  // ── SEARCH: Log a drink ───────────────────────────────────────────────────────────────────────
  let sq = ''
  function searchRow(d, here = false) {
    const v = VENUES[d.v]
    const line = here ? (d.ing || (d.p !== null ? money(d.p) : d.c)) : `${v.name} · Deck ${v.deck}`
    return `
      <div class="drow" data-row="${d.id}">
        <button type="button" class="drow-open" data-act="drink" data-id="${d.id}">
          ${glassIcon(d)}
          <span class="drow-copy"><span class="drow-l1"><span class="drow-name">${esc(d.n)}</span>${stars((me[d.id] || {}).r)}</span>
          <span class="drow-meta"><span class="ing">${esc(line)}</span></span></span>
        </button>
        <button type="button" class="try" data-act="try" data-id="${d.id}" aria-pressed="${tried(d.id)}" aria-label="Tried, ${esc(d.n)}">${tried(d.id) ? checkFilled(26) : icon('check', 26)}</button>
      </div>`
  }
  function searchResults() {
    const q = sq.trim().toLowerCase()
    if (q) {
      const hits = DRINKS.filter((d) => matchQ(d, q)).slice(0, 40)
      return hits.length
        ? `<section class="plat" aria-label="Results"><div class="plat-head"><h2>${hits.length === 40 ? 'The first 40' : hits.length === 1 ? 'One drink' : hits.length + ' drinks'}</h2></div>${hits.map((d) => searchRow(d)).join('')}</section>`
        : `<section class="plat"><p class="empty">Nothing on the list is called that. Try the bar’s name.</p></section>`
    }
    const { today } = days()
    const last = today.length ? today[today.length - 1].v : 'goodspirits'
    const here = drinksAt(last).filter((d) => !tried(d.id)).slice(0, 5)
    return `
      <section class="plat" aria-labelledby="h-here">
        <div class="plat-head"><h2 id="h-here">Still to try at ${esc(VENUES[last].name)}</h2></div>
        ${here.map((d) => searchRow(d, true)).join('')}
      </section>
      <section class="plat" aria-labelledby="h-sfy">
        <div class="plat-head"><h2 id="h-sfy">For you</h2></div>
        ${picks().slice(0, 4).map((p) => searchRow(p.d)).join('')}
      </section>`
  }
  const renderSearch = () => `<h1 class="large">Log a drink</h1><div id="s-res">${searchResults()}</div>`

  // ── screens and navigation ────────────────────────────────────────────────────────────────────
  const TABS = [['home', 'Home'], ['drinks', 'Drinks'], ['ship', 'Ship'], ['crew', 'Crew'], ['you', 'You']]
  const RENDER = { home: renderHome, drinks: renderDrinks, ship: renderShip, crew: renderCrew, you: renderYou, medals: renderMedals, search: renderSearch }
  const TITLE = { home: '', drinks: 'Drinks', ship: 'Ship', crew: 'Crew', you: 'You', medals: 'Medals', search: 'Log a drink' }
  const state = { tab: 'home', pushed: null, search: false, sheet: null }
  const scr = (k) => document.getElementById('s-' + k)
  const current = () => state.search ? 'search' : state.pushed || state.tab

  function paint(k, keepScroll = true) {
    const el = scr(k), top = el.scrollTop
    el.innerHTML = RENDER[k]()
    if (keepScroll) el.scrollTop = top
  }
  function show() {
    const cur = current()
    for (const k of Object.keys(RENDER)) {
      const el = scr(k)
      el.classList.toggle('is-on', k === cur)
      el.classList.toggle('is-under', k === state.tab && !!state.pushed && !state.search)
      el.setAttribute('aria-hidden', String(k !== cur))
      if (k !== cur) el.setAttribute('inert', ''); else el.removeAttribute('inert')
    }
    app.classList.toggle('is-search', state.search)
    $('.tab-back').tabIndex = state.search ? 0 : -1
    $$('.tab', tabsEl).forEach((t) => { t.tabIndex = state.search ? -1 : 0 })
    $('.logbtn-face').tabIndex = state.search ? -1 : 0
    qEl.tabIndex = state.search ? 0 : -1
    const tb = $('#topbar')
    tb.classList.toggle('has-back', !!state.pushed && !state.search)
    $('.tb-back').innerHTML = `${icon('back', 22)}${state.pushed ? TABS.find((t) => t[0] === state.tab)[1] : ''}`
    onScroll()
    $$('.tab', tabsEl).forEach((t) => t.setAttribute('aria-current', t.dataset.tab === state.tab ? 'page' : 'false'))
  }
  function go(tab, fromBar = false) {
    if (state.search) closeSearch(false)
    const same = state.tab === tab && !state.pushed
    if (!fromBar && state.tab !== tab) placeDroplet(TABS.findIndex((t) => t[0] === tab), true)
    state.pushed = null
    if (state.tab !== tab) { state.tab = tab; paint(tab); scr(tab).scrollTop = 0 }
    else if (same) scr(tab).scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' })
    show()
  }
  function push(k) { state.pushed = k; paint(k, false); scr(k).scrollTop = 0; show() }
  function back() { state.pushed = null; show() }

  // the top bar: the large title collapses into it once it has scrolled under
  function onScroll() {
    const cur = current(), el = scr(cur)
    const past = cur === 'home' ? el.scrollTop > 200 : el.scrollTop > 40
    $('#topbar').classList.toggle('is-on', past)
    $('#tb-title').textContent = cur === 'home' ? `${Math.round(stat().pct)}% · Day ${DAY + 1} of ${TOTAL_DAYS}` : TITLE[cur]
  }
  Object.keys(RENDER).forEach((k) => scr(k).addEventListener('scroll', () => { if (current() === k) onScroll() }, { passive: true }))

  // ── the tab bar and its droplet ───────────────────────────────────────────────────────────────
  const tabbar = $('#tabbar'), drop = $('#droplet'), tabsEl = $('#tabs')
  tabsEl.innerHTML = TABS.map(([k, l], i) => `<button type="button" class="tab" data-i="${i}" data-tab="${k}" aria-label="${l}">${icon(k)}<span>${l}</span></button>`).join('')
  $('.tab-back').innerHTML = icon('close', 24)
  let dropX = 0, dropAnim = null
  const barW = () => app.clientWidth - 16 * 3 - 62 + 8
  const tabW = () => (barW() - 8) / TABS.length
  function markUnder(i) { $$('.tab', tabsEl).forEach((t, j) => t.classList.toggle('is-under', j === i)) }
  function placeDroplet(i, animate) {
    const w = tabW(), x = i * w
    drop.style.setProperty('--tab-w', w + 'px')
    if (!animate || REDUCED || STILL) {
      if (dropAnim) dropAnim.cancel()
      drop.style.transform = `translateX(${x}px)`
      dropX = x; markUnder(i); return
    }
    // the liquid morph: the droplet slides and swells on the way, and settles where it lands
    const from = dropX, mid = (from + x) / 2
    const dist = Math.min(1, Math.abs(x - from) / (w * 2))
    if (dropAnim) dropAnim.cancel()
    dropAnim = drop.animate([
      { transform: `translateX(${from}px) scale(1, 1)` },
      { transform: `translateX(${mid}px) scale(${1 + 0.16 * dist}, ${1 + 0.06 * dist})`, offset: 0.45 },
      { transform: `translateX(${x}px) scale(1, 1)` },
    ], { duration: 460, easing: 'cubic-bezier(.32,.72,0,1)' })
    drop.style.transform = `translateX(${x}px)`
    dropX = x
    setTimeout(() => markUnder(i), 140)
  }
  // drag the droplet across the bar: it lifts under the finger and the tab it leaves you on opens
  let drag = null
  tabbar.addEventListener('pointerdown', (e) => {
    if (state.search || e.button > 0) return
    const r = tabbar.getBoundingClientRect()
    drag = { id: e.pointerId, x0: e.clientX, left: r.left, moved: false }
    tabbar.setPointerCapture(e.pointerId)
  })
  tabbar.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return
    if (!drag.moved && Math.abs(e.clientX - drag.x0) < 8) return
    if (!drag.moved) { drag.moved = true; tabbar.classList.add('is-dragging'); if (dropAnim) dropAnim.cancel() }
    const w = tabW()
    const x = Math.max(0, Math.min(barW() - 8 - w, e.clientX - drag.left - 4 - w / 2))
    drop.style.transform = `translateX(${x}px) scale(1.1, 1.08)`
    dropX = x
    markUnder(Math.round(x / w))
  })
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return
    const w = tabW()
    let i
    if (drag.moved) i = Math.round(dropX / w)
    else i = Math.max(0, Math.min(TABS.length - 1, Math.floor((e.clientX - drag.left - 4) / w)))
    tabbar.classList.remove('is-dragging')
    drag = null
    if (e.type === 'pointercancel') { placeDroplet(TABS.findIndex((t) => t[0] === state.tab), true); return }
    const k = TABS[i][0]
    placeDroplet(i, true)
    go(k, true)
  }
  tabbar.addEventListener('pointerup', endDrag)
  tabbar.addEventListener('pointercancel', endDrag)
  // keyboard: the tabs are buttons; Enter and Space arrive as a click with no pointer
  tabsEl.addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b && e.detail === 0) go(b.dataset.tab) })

  // pressed glass swells: a class on pointer down, so a thumb gets it as a mouse does
  document.addEventListener('pointerdown', (e) => { const s = e.target.closest('.swell'); if (s) s.classList.add('is-pressed') })
  const unpress = () => $$('.swell.is-pressed').forEach((s) => s.classList.remove('is-pressed'))
  document.addEventListener('pointerup', unpress); document.addEventListener('pointercancel', unpress)

  // ── search: the Log button morphs into a field; the capsule folds to the way back ──────────────
  const qEl = $('#q')
  $('.logbtn-face').innerHTML = `${icon('search', 24)}<span>Log</span>`
  $('.clear').innerHTML = icon('close', 20)
  $('.sh-close span').innerHTML = icon('close', 18)
  function openSearch(focus = true) {
    state.search = true; sq = ''; qEl.value = ''; $('.logbtn').classList.remove('has-q')
    paint('search', false); scr('search').scrollTop = 0
    show()
    // focus inside the tap, so a phone raises its keyboard
    if (focus) qEl.focus({ preventScroll: true })
  }
  function closeSearch(repaint = true) {
    state.search = false; qEl.blur(); $('#logbtn').style.marginBottom = ''; $('#tabbar').style.marginBottom = ''
    if (repaint) { paint(current()); show() }
  }
  const syncClear = () => $('.logbtn').classList.toggle('has-q', !!qEl.value)
  qEl.addEventListener('input', () => { sq = qEl.value; syncClear(); $('#s-res').innerHTML = searchResults() })
  // keep the field above a phone's keyboard
  if (window.visualViewport) {
    const vv = window.visualViewport
    const lift = () => {
      const kb = state.search ? Math.max(0, innerHeight - vv.height - vv.offsetTop) : 0
      for (const el of [$('#logbtn'), $('#tabbar')]) el.style.marginBottom = kb ? kb + 'px' : ''
    }
    vv.addEventListener('resize', lift); vv.addEventListener('scroll', lift)
  }

  // ── the sheet: medium and large, dragged or tapped between, and closed ─────────────────────────
  const sheet = $('#sheet'), shScroll = $('#sh-scroll')
  let det = 'medium', sheetY = 0, lastTrigger = null
  const H = () => app.clientHeight
  const topOf = () => sheet.offsetTop
  const medY = () => Math.round(H() * 0.44 - topOf())   // medium: the top of the sheet at 44% down
  function setY(y, animate = true) {
    sheetY = y
    sheet.classList.toggle('is-dragging', !animate)
    sheet.style.transform = `translateY(${y}px)`
    const t = Math.max(0, Math.min(1, 1 - y / Math.max(1, medY())))
    sheet.style.setProperty('--sheet-t', t.toFixed(3))
  }
  function setDetent(d, animate = true) {
    det = d
    sheet.classList.toggle('is-large', d === 'large')
    setY(d === 'large' ? 0 : medY(), animate)
    if (d === 'medium') shScroll.scrollTop = 0
  }
  function openSheet(kind, id, opts = {}) {
    lastTrigger = document.activeElement
    state.sheet = { kind, id }
    shScroll.innerHTML = kind === 'drink' ? drinkSheet(id) : medalSheet(id)
    sheet.hidden = false
    app.classList.add('sheet-open')
    for (const k of Object.keys(RENDER)) scr(k).setAttribute('inert', '')
    const detent = opts.detent || 'medium'
    if (opts.instant || REDUCED || STILL) {
      setDetent(detent, false)
      if (REDUCED && !STILL) { sheet.style.opacity = '0'; requestAnimationFrame(() => { sheet.style.transition = 'opacity 200ms linear'; sheet.style.opacity = '1' }) }
    } else {
      sheet.classList.add('is-dragging'); sheet.style.transform = `translateY(${H()}px)`
      sheet.getBoundingClientRect()
      setTimeout(() => setDetent(detent, true), 20)
      // the wave opens a drink; a medal opens on its coin turning instead, one moment at a time
      if (kind === 'drink') wave()
    }
    if (kind === 'medal' && !opts.noTurn && !STILL && !REDUCED) { const c = $('.coin3d', shScroll); if (c) c.classList.add('is-turning') }
    $('#sh-scroll .sh-title, #sh-scroll .medal-name')?.setAttribute('id', 'sh-title')
    setTimeout(() => $('.sh-close').focus({ preventScroll: true }), opts.instant ? 0 : 300)
  }
  function closeSheet() {
    if (!state.sheet) return
    state.sheet = null
    sheet.classList.remove('is-dragging')
    sheet.style.transform = `translateY(${H()}px)`
    app.classList.remove('sheet-open')
    Sea.resume()
    show()
    const done = () => { if (!state.sheet) { sheet.hidden = true; shScroll.innerHTML = ''; sheet.style.transition = '' } }
    setTimeout(done, REDUCED ? 0 : 420)
    // what changed in the sheet shows on the screen beneath it
    paint(current())
    if (lastTrigger && lastTrigger.isConnected) lastTrigger.focus({ preventScroll: true })
  }
  // the gesture: from the grab bar and the header always; from the content when it is at its top
  // and the pull is downward, or at medium, where the whole sheet is the handle
  let sd = null
  sheet.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return
    if (e.target.closest('input, textarea, .chip, .star, .sh-close')) return
    const inHead = !!e.target.closest('#sh-head')
    sd = { id: e.pointerId, y0: e.clientY, x0: e.clientX, base: sheetY, inHead, dir: 0, pts: [[e.timeStamp, e.clientY]], active: false }
  })
  sheet.addEventListener('pointermove', (e) => {
    if (!sd || e.pointerId !== sd.id) return
    const dy = e.clientY - sd.y0, dx = e.clientX - sd.x0
    if (!sd.active) {
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return
      if (Math.abs(dx) > Math.abs(dy)) { sd = null; return }        // sideways: not ours
      const fromContent = !sd.inHead
      if (fromContent && det === 'large' && !(dy > 0 && shScroll.scrollTop <= 0)) { sd = null; return } // let it scroll
      sd.active = true
      sheet.setPointerCapture(e.pointerId)
    }
    let y = sd.base + dy
    if (y < 0) y = y / 3                                               // friction past the top
    setY(y, false)
    sd.pts.push([e.timeStamp, e.clientY]); if (sd.pts.length > 6) sd.pts.shift()
    e.preventDefault()
  })
  const sheetUp = (e) => {
    if (!sd || e.pointerId !== sd.id) return
    const was = sd; sd = null
    if (!was.active) return
    const p = was.pts, a = p[0], b = p[p.length - 1]
    const v = (b[1] - a[1]) / Math.max(1, b[0] - a[0])                 // px per ms, down is positive
    const M = medY(), y = sheetY
    if (v > 1.1 && y > M * 0.2) { if (det === 'large' && y < M) setDetent('medium'); else closeSheet(); return }
    if (v < -0.6) { setDetent('large'); return }
    if (y > M + (H() - topOf() - M) * 0.35 && y - M > 100) { closeSheet(); return }
    setDetent(y < M / 2 ? 'large' : 'medium')
  }
  sheet.addEventListener('pointerup', sheetUp)
  sheet.addEventListener('pointercancel', sheetUp)
  let ty = 0
  shScroll.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY }, { passive: true })
  shScroll.addEventListener('touchmove', (e) => {
    if (sd && sd.active) { e.preventDefault(); return }
    if (det === 'large' && shScroll.scrollTop <= 0 && e.touches[0].clientY > ty) e.preventDefault()
  }, { passive: false })
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (state.sheet) closeSheet(); else if (state.search) closeSearch() }
  })

  // the blue wave: the sheet's signature opening. It washes the content up onto a pane of the
  // sheet's own glass and recedes, leaving the sheet clear. The sea holds still while it runs.
  function wave() {
    if (REDUCED || STILL) return
    const cv = document.createElement('canvas'); cv.className = 'wave'
    const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false })
    if (!gl) return
    const sky = Sea.sky(), dark = app.dataset.sky === 'dark'
    const f = (c) => c.map((v) => (v / 255).toFixed(3)).join(',')
    const PANE = dark ? '0.06,0.13,0.21' : '0.97,0.98,0.99'
    const src = `precision highp float; uniform vec2 iRes; uniform float iP; uniform float iTime;
      const vec3 SEA = vec3(${f(sky.hi)}); const vec3 SEA_DEEP = vec3(${f(sky.lo)}); const vec3 PANE = vec3(${PANE});
      void main(){ vec2 uv = gl_FragCoord.xy / iRes; float t = iTime;
        float up = smoothstep(0.0, 0.44, iP); float down = 1.0 - smoothstep(0.56, 1.0, iP); float tri = min(up, down);
        float waves = 0.082*sin(uv.x*4.2 + t*1.6) + 0.030*sin(uv.x*7.5 - t*1.2) + 0.026*sin(uv.x*2.2 + t*0.7);
        float depositY = mix(-0.26, 1.26, up) + waves; float crestY = mix(-0.26, 1.26, tri) + waves;
        if (uv.y > depositY) { gl_FragColor = vec4(PANE, 0.9); return; }
        if (uv.y > crestY) { gl_FragColor = vec4(0.0); return; }
        float depth = crestY - uv.y;
        float tint = 0.42 * smoothstep(0.0, 0.09, depth) * (1.0 - 0.4*smoothstep(0.10, 0.55, depth));
        vec3 seaCol = mix(SEA, SEA_DEEP, clamp(depth*1.5, 0.0, 1.0));
        float foam = smoothstep(0.016, 0.0, depth); float edge = smoothstep(0.026, 0.008, depth) * (1.0 - foam);
        vec3 col = mix(seaCol, vec3(1.0), foam); col += vec3(1.0) * edge * 0.2;
        gl_FragColor = vec4(col, clamp(tint + foam*0.95 + edge*0.25, 0.0, 1.0)); }`
    const sh = (type, s) => { const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null }
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, src)
    if (!vs || !fs) return
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uR = gl.getUniformLocation(prog, 'iRes'), uP = gl.getUniformLocation(prog, 'iP'), uT = gl.getUniformLocation(prog, 'iTime')
    sheet.appendChild(cv)
    Sea.pause()
    const DUR = 2400, t0 = performance.now()
    const draw = (now) => {
      const t = (now - t0) / 1000, p = Math.min(1, (now - t0) / DUR), dpr = Math.min(devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.round(sheet.clientWidth * dpr)), h = Math.max(1, Math.round(sheet.clientHeight * dpr))
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h }
      gl.viewport(0, 0, w, h); gl.uniform2f(uR, w, h); gl.uniform1f(uP, p); gl.uniform1f(uT, t)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      return p
    }
    const end = () => { cv.remove(); Sea.resume() }
    draw(performance.now())
    let raf = requestAnimationFrame(function loop(now) { if (draw(now) >= 1) { end(); return } raf = requestAnimationFrame(loop) })
    // never leave the pane over the content, even where frames do not run
    setTimeout(() => { cancelAnimationFrame(raf); if (cv.isConnected) end() }, DUR + 600)
  }

  // ── the drink sheet (DrinkSheet.tsx's content, in the same order) ──────────────────────────────
  function drinkSheet(id) {
    const d = BY_ID[id], v = VENUES[d.v], e = me[id] || {}
    const tier = pkg(d.p)
    const price = d.p === null ? '' : tier === 'plus' ? `Plus ${money(d.p)}` : tier === 'prem' ? `Premier ${money(d.p)}` : `${money(d.p)}, ${money(Math.max(0, d.p - 20))} over Premier`
    const facts = [price, [...d.fl, ...(d.fz ? ['Frozen'] : [])].join(', ')].filter(Boolean).join(' · ')
    const raters = [e.r, ...CREW.map((f) => f.entries[id] && f.entries[id].r)].filter(Boolean)
    const recs = CREW.filter((f) => f.entries[id] && f.entries[id].rec)
    const said = CREW.filter((f) => f.entries[id] && f.entries[id].c)
    const chip = (k, label, on, mint) => `<button type="button" class="chip${mint ? ' mint' : ''}" data-act="chip" data-k="${k}" data-id="${id}" aria-pressed="${!!on}">${label}</button>`
    const dots = (n) => [1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')
    const names = (l) => l.length < 2 ? l[0] || '' : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]
    return `
      <h2 class="sh-title">${esc(d.n)}</h2>
      <p class="sh-meta">${esc(v.name)} · Deck ${v.deck} · ${esc(d.c)}</p>
      ${d.ing ? `<p class="sh-p">${esc(d.ing)}</p>` : ''}
      ${d.ds ? `<p class="sh-p meta">${esc(d.ds)}</p>` : ''}
      ${facts ? `<p class="sh-p meta">${esc(facts)}</p>` : ''}
      ${!d.ok ? `<p class="sh-p meta">Not on a published menu. Check at the bar.</p>` : ''}
      <div class="dots-row">
        <div class="dmeter"><span class="dmeter-l">Sweetness</span><span class="dots" role="img" aria-label="Sweetness, ${d.sw} out of 5">${dots(d.sw)}</span></div>
        <div class="dmeter"><span class="dmeter-l">Strength</span><span class="dots" role="img" aria-label="Strength, ${d.st} out of 5">${dots(d.st)}</span></div>
      </div>
      ${d.st === 0 ? `<p class="sh-p meta">Alcohol free</p>` : ''}
      <div class="sh-group">
        <div class="rate-head"><span class="l">Your rating</span>${raters.length > 1 ? `<span class="meta tnum">${(raters.reduce((a, b) => a + b, 0) / raters.length).toFixed(1)} average from ${raters.length} aboard</span>` : ''}</div>
        <div class="stars-in">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star${n <= (e.r || 0) ? ' on' : ''}" data-act="rate" data-id="${id}" data-n="${n}" aria-label="${n} star${n > 1 ? 's' : ''}" aria-pressed="${n === e.r}">${starSvg(28, n <= (e.r || 0))}</button>`).join('')}</div>
        ${recs.length ? `<p class="recby">${recs.map((f) => `<span class="dot" style="width:20px;height:20px;background:${f.colour}" aria-hidden="true"></span>`).join('')}<span>Recommended by ${names(recs.map((f) => f.name))}</span></p>` : ''}
      </div>
      <div class="chips">${chip('t', 'Tried', e.t, true)}${chip('f', 'Favourite', e.f)}${chip('w', 'Wishlist', e.w)}${chip('rec', 'Recommend', e.rec)}</div>
      ${e.t ? `<p class="sh-p meta">Tried on day ${D.days.indexOf(e.day) + 1}, ${longDate(e.day)}</p>` : ''}
      <div class="sh-group"><label class="f-label" for="n-${id}">Private notes</label><textarea class="textarea" id="n-${id}" rows="3"></textarea></div>
      <div class="sh-group"><label class="f-label" for="c-${id}">Comment for your crew</label><textarea class="textarea" id="c-${id}" rows="2" maxlength="140"></textarea></div>
      ${said.length ? `<section class="sh-group"><h3 class="strong">What the crew said</h3>${said.map((f) => `
        <div class="said"><span class="dot" style="width:26px;height:26px;background:${f.colour}" aria-hidden="true">${f.name[0]}</span>
          <div><p class="strong">${f.name} ${stars(f.entries[id].r, 12)}</p><p class="meta">${esc(f.entries[id].c)}</p></div></div>`).join('')}</section>` : ''}`
  }

  // ── the medal sheet: the coin large, its name, its tier and what earned it ────────────────────
  function medalSheet(id) {
    const b = B[id], m = medals()
    const got = m.earned.find((e) => e.b.id === id)
    const p = b.prog ? b.prog(m.s) : null
    let why = ''
    if (got) {
      const d = got.day
      why = `Struck on day ${d + 1}, ${longDate(D.days[d])}.`
      if (id === 'gin') {
        const gins = DRINKS.filter((x) => tried(x.id) && x.sp.includes('Gin'))
        const todays = gins.filter((x) => me[x.id].day === TODAY).map((x) => x.n)
        why += ` You are on ${gins.length} gins${todays.length ? `, most recently ${todays.slice(-2).join(' and ')}` : ''}.`
      } else if (p) why += ` You are on ${count(b, p[0], p[1]).split(' of ')[0]}.`
    } else if (p) {
      why = `${count(b, p[0], p[1])}. ${remainder(b, p[0], p[1]).replace(/^./, (c) => c.toUpperCase())} to strike it.`
    } else why = 'Not started yet.'
    return `
      <div class="medal-stage">${got ? coin(b, 184, { tilt: true }) : blank(184, p ? Math.min(100, p[0] / p[1] * 100) : 0)}</div>
      <h2 class="medal-name">${esc(b.name)}</h2>
      <p class="medal-tier">${TIER[b.tier]} · ${esc(b.hint)}</p>
      <p class="medal-why sh-p">${esc(why)}</p>`
  }
  // the big coin follows the finger a little, and settles back
  shScroll.addEventListener('pointermove', (e) => {
    const c = e.target.closest('.coin3d'); if (!c || REDUCED || (sd && sd.active)) return
    if (c.classList.contains('is-turning')) return
    const r = c.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    c.classList.add('is-tilting')
    $('.spinner', c).style.transition = ''
    $('.spinner', c).style.transform = `rotateY(${(x * 24).toFixed(1)}deg) rotateX(${(-y * 24).toFixed(1)}deg)`
  })
  shScroll.addEventListener('pointerleave', () => { const s = $('.coin3d .spinner', shScroll); if (s) { s.style.transition = 'transform 500ms var(--e-settle)'; s.style.transform = '' } })
  app.addEventListener('animationend', (e) => { const c = e.target.closest && e.target.closest('.coin3d'); if (c) c.classList.remove('is-turning') })

  // ── actions ───────────────────────────────────────────────────────────────────────────────────
  function logTried(id, btn) {
    const e = me[id] || (me[id] = {})
    e.t = e.t ? 0 : 1
    if (e.t) e.day = TODAY
    // the row's own check is the confirmation; a result the guest can see needs nothing more
    $$(`[data-act="try"][data-id="${id}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', String(!!e.t)); b.innerHTML = e.t ? checkFilled(26) : icon('check', 26)
      if (e.t && !REDUCED) { b.classList.remove('just'); b.getBoundingClientRect(); b.classList.add('just') }
    })
    $('#live').textContent = e.t ? `${BY_ID[id].n} logged` : `${BY_ID[id].n} unticked`
    Sea.applySky(); Sea.draw()
    if (current() === 'drinks') { const c = $('#d-count'); if (c) c.outerHTML = countLine() }
  }

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return
    const a = el.dataset.act, id = el.dataset.id
    if (a === 'tab') go(el.dataset.tab)
    else if (a === 'back') back()
    else if (a === 'case') push('medals')
    else if (a === 'medal') openSheet('medal', id)
    else if (a === 'drink') openSheet('drink', id)
    else if (a === 'try') logTried(id, el)
    else if (a === 'search') openSearch()
    else if (a === 'search-close') closeSearch()
    else if (a === 'q-clear') { qEl.value = ''; sq = ''; syncClear(); $('#s-res').innerHTML = searchResults(); qEl.focus() }
    else if (a === 'sheet-close') closeSheet()
    else if (a === 'sheet-cycle') setDetent(det === 'medium' ? 'large' : 'medium')
    else if (a === 'filter') { filter = el.dataset.f; paint('drinks') }
    else if (a === 'youseg') { youSeg = el.dataset.seg; paint('you') }
    else if (a === 'rate') {
      const n = +el.dataset.n, en = me[id] || (me[id] = {})
      en.r = en.r === n ? 0 : n
      $$('.star', shScroll).forEach((s, i) => { const on = i < en.r; s.classList.toggle('on', on); s.innerHTML = starSvg(28, on); s.setAttribute('aria-pressed', String(i + 1 === en.r)) })
    } else if (a === 'chip') {
      const k = el.dataset.k, en = me[id] || (me[id] = {})
      if (k === 't') { logTried(id); shScroll.innerHTML = drinkSheet(id); return }
      en[k] = en[k] ? 0 : 1
      el.setAttribute('aria-pressed', String(!!en[k]))
    } else if (a === 'shake') {
      // the shaker's door: the tin rattles and hands over an untried drink (the real Shake sheet
      // stays as it is in the app; this is only its door)
      const ic = $('.shaker', el)
      const pool = DRINKS.filter((d) => !tried(d.id))
      const pick = pool[Math.floor(Math.random() * pool.length)]
      if (REDUCED) { openSheet('drink', pick.id); return }
      ic.classList.remove('is-shaking'); ic.getBoundingClientRect(); ic.classList.add('is-shaking')
      setTimeout(() => openSheet('drink', pick.id), 540)
    }
  })
  app.addEventListener('input', (e) => {
    if (e.target.id === 'dq') { dq = e.target.value; $('#d-list').innerHTML = drinksList() }
  })

  // ── first paint and the deterministic states ──────────────────────────────────────────────────
  for (const k of Object.keys(RENDER)) if (k !== 'home') paint(k, false)
  const want = Q.get('screen') || 'home'
  const TAB_OF = { home: 'home', drinks: 'drinks', sheet: 'drinks', 'sheet-large': 'drinks', search: 'home', medals: 'home', medal: 'home', ship: 'ship', crew: 'crew', you: 'you' }
  state.tab = TAB_OF[want] || 'home'
  if (want !== 'home') coinTurned = true
  paint('home', false)
  if (want === 'medals' || want === 'medal') { state.pushed = 'medals'; paint('medals', false) }
  show()
  if (want === 'search') openSearch(false)
  if (want === 'sheet' || want === 'sheet-large') openSheet('drink', 'd30', { instant: true, detent: want === 'sheet-large' ? 'large' : 'medium' })
  if (want === 'medal') openSheet('medal', 'gin', { instant: true, noTurn: true })
  Sea.start()
  placeDroplet(TABS.findIndex((t) => t[0] === state.tab), false)
  addEventListener('resize', () => { placeDroplet(TABS.findIndex((t) => t[0] === state.tab), false); if (state.sheet) setDetent(det, false) })
})()
