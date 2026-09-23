// Headless sweep of every screen and sheet in the three rooms, for a review that reads pictures
// rather than driving a browser. Charles asked for it by name on 23 September 2026 ("Would headless
// be faster? If so do it it's just you running them so should be fine"); the standing rule is still
// Brave for verification, so run this only when he asks for a headless run.
//
//   CDP_GPU=1 node tools/qa/sweep.mjs [--base http://127.0.0.1:5173] [--only home,drinks] [--hours 13,19,23]
//
// One headless Chrome, one isolated context per hour, the hours run side by side. Every URL carries
// ?seed&nosync, so nothing reaches the live backend. Writes tools/qa/sweeps/<stamp>/<state>-<hour>.png
// and manifest.json (per shot: innerWidth, scrollWidth, backdrop-filtered surfaces, exceptions),
// then contact.py lays each state's three hours side by side for the reviewers.
import { launch } from './cdp.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d }
const BASE = arg('--base', 'http://127.0.0.1:5173')
const HOURS = arg('--hours', '13,19,23').split(',').map(Number)
const ONLY = arg('--only', '') ? new Set(arg('--only', '').split(',')) : null
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
const DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), 'sweeps', stamp)
mkdirSync(DIR, { recursive: true })

// Helpers run inside the page.
const click = (sel) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (e) e.click(); return !!e })()`
const clickText = (text) => `(() => { const e = [...document.querySelectorAll('button, a, [role=button]')].find((b) => b.textContent.trim().startsWith(${JSON.stringify(text)})); if (e) e.click(); return !!e })()`
const typeInto = (sel, text) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.focus(); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, ${JSON.stringify(text)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`
const METRICS = `(() => {
  // Counts painted surfaces, which is what the budget of four means: a box in view, not hidden by
  // visibility or an opacity of 0 on itself or an ancestor, and a layer (the element or a pseudo)
  // that is itself visible and carries a backdrop-filter.
  const vis = (el) => {
    const r = el.getBoundingClientRect()
    if (!(r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight)) return false
    return el.checkVisibility ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true
  }
  let glass = 0
  for (const el of document.querySelectorAll('*')) {
    if (!vis(el)) continue
    for (const p of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, p)
      const bf = cs.backdropFilter || cs.webkitBackdropFilter
      if (!bf || bf === 'none' || (p !== null && cs.content === 'none')) continue
      if (cs.visibility !== 'visible' || Number(cs.opacity) === 0) continue
      glass++; break
    }
  }
  return { w: innerWidth, sw: document.documentElement.scrollWidth, room: document.documentElement.dataset.room || '', glass, fault: !!document.querySelector('.fault') }
})()`

// Each state: a route (the query is added), steps run after load, and how long to settle. A sheet's
// wave runs about 2.4s, so a sheet waits 3.2s before its picture.
const S = (name, route, steps = [], settle = 2600) => ({ name, route, steps, settle })
const STATES = [
  S('home', '/'),
  S('home-aboard', '/?day=2026-10-05'),
  S('search', '/', [[click('.logbtn'), 1800]]),
  S('search-typed', '/', [[click('.logbtn'), 1500], [typeInto('.search-layer input, input[type=search]', 'gin'), 1500]]),
  S('drinks', '/drinks'),
  S('drinks-filters', '/drinks', [[click('.dfbtn'), 1200]]),
  S('drink-medium', '/drinks', [[click('.dcard .d-open'), 3200]]),
  S('drink-large', '/drinks', [[click('.dcard .d-open'), 3200], [click('[aria-label="Expand"]'), 1200]]),
  S('add-drink', '/drinks', [[clickText('Add a missing drink'), 3200]]),
  S('stats', '/stats'),
  S('badges', '/badges'),
  S('medal', '/badges?badge=gin', [], 3400),
  S('log', '/log'),
  S('ship', '/ship'),
  S('venue', '/ship', [[click('.venue-row'), 3200]]),
  S('crew', '/social'),
  S('add-crew', '/social', [[click('.crew-add'), 3200]]),
  S('group', '/social', [[clickText('Set up a group'), 3200]]),
  S('details', '/social', [[click('.crew-me'), 3200]]),
  S('details-code', '/social?qa=code:1', [[click('.crew-me'), 3200]]),
  S('claim-wrong', '/social?qa=claim:wrong', [[click('.crew-me'), 3200]]),
  // The Confirm tick "Passport back" clears itself after about 1.3s, so the claim is made after the
  // sheet is up and the picture is taken while the tick is still on screen. The store is Vite's own
  // module instance (the URL the page loaded, with any ?t= stamp), so setting it here is the same change a real claim makes.
  S('claim-done', '/social', [[click('.crew-me'), 3200], [`import(performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('/src/state/sync.ts')) || '/src/state/sync.ts').then((m) => { m.useSyncStore.setState({ claim: 'done' }); return true })`, 550]]),
  S('sync-moved', '/social?qa=sync:moved', [[click('.crew-me'), 3200]]),
  S('shake', '/', [[click('.shake-open'), 3000]]),
  S('shake-reveal', '/', [[click('.shake-open'), 3000], [click('.shake-go'), 4200]]),
  S('wrapped', '/wrapped', [], 2600),
  S('entry', '/?entry'),
  S('privacy', '/?entry', [[click('.privacy-open'), 3200]]),
  S('sailing', '/?entry', [[click('.cruise-byo'), 3200]]),
  // The phone branch lives at /get: at / a seeded store has already entered, so the gate is passed
  S('landing-phone', '/get?landing=phone'),
].filter((s) => !ONLY || ONLY.has(s.name))

const url = (route, hour) => BASE + route + (route.includes('?') ? '&' : '?') + `seed&nosync&hour=${hour}`

const chrome = await launch({ width: 390, height: 844 })
const manifest = []
try {
  const run = async (hour, w, h, list, suffix = '') => {
    const u = await chrome.user(`h${hour}${suffix}`)
    await chrome.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 900 }, u.sessionId)
    for (const s of list) {
      const label = `${s.name}${suffix}-${hour}`
      try {
        await u.goto(url(s.route, hour))
        await u.sleep(s.settle)
        const clicked = []
        for (const [js, wait] of s.steps) { clicked.push(await u.eval(js)); await u.sleep(wait) }
        // Wrapped's story advances every 4s; its settle is inside that, so the picture is the cover
        const file = await u.shot(path.relative(path.resolve(DIR, '..', '..', 'shots'), path.join(DIR, label)))
        const m = await u.eval(METRICS)
        manifest.push({ label, state: s.name, hour, w, file, clicked, ...m, errors: u.logs.filter((l) => l.startsWith('EXC') || l.startsWith('error')).slice(-3) })
        u.logs.length = 0
        console.log(label, JSON.stringify({ sw: m.sw, w: m.w, room: m.room, glass: m.glass, clicked }))
      } catch (e) {
        manifest.push({ label, state: s.name, hour, w, error: String(e.message || e) })
        console.log(label, 'FAILED', e.message)
      }
    }
  }
  const narrow = STATES.filter((s) => ['home', 'drinks', 'badges', 'crew', 'entry', 'search'].includes(s.name))
  await Promise.all([
    ...HOURS.map((hr) => run(hr, 390, 844, STATES)),
    run(13, 320, 568, narrow, '-320'),
    run(23, 320, 568, narrow, '-320'),
    ...(ONLY && !ONLY.has('landing-desktop') ? [] : HOURS.map((hr) => run(hr, 1280, 800, [S('landing-desktop', '/?landing=desktop')], '-wide'))),
  ])
} finally {
  writeFileSync(path.join(DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  chrome.close()
  console.log('out:', DIR, 'shots:', manifest.filter((m) => m.file).length, 'failed:', manifest.filter((m) => m.error).length)
}
