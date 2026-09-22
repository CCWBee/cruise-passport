// The shaker end to end, without minting a user: loads ?seed&nosync (the seed only fills an untouched
// passport on production, and nosync keeps the run off the backend), opens the sheet from the foot of
// For you, presses, reads the reveal, goes to the drink sheet, closes it and samples the return. The
// return is the case that once replayed the whole opening on a fresh mount; it must read `is-open
// is-still` at the end values in every sample, with the live line empty. Prints the served shell hash
// first, so a stale edge read is visible as such, and exits 1 if any check fails.
//
// What the reveal must show: the cap gone (opacity 0), the glass hanging at its end values (no
// translation, full size) with its foot at least 16 clear of the neck, the family of glass named on
// `data-glass`, the stage the same 275 it was shut, every line of the card and Shake again in, the
// live line saying the card's sentence, and the sheet not scrolling.
// usage: node shake-live.mjs [base]    base defaults to https://cruise.charlesbee.org
//        (the dev server is http://127.0.0.1:5173)
// Env: SHOTS_DIR (default shots), CDP_PORT (default: derived from pid)
import { launch, OUT } from './cdp.mjs'

const BASE = process.argv[2] || 'https://cruise.charlesbee.org'
const W = 390, H = 844
// press to the card's last line: popMs 2340 + landMs 540 + two 80ms staggers + a 300ms line, with room
const SETTLED = 5000

const READ = `(() => {
  const sh = document.querySelector('.shaker'); const cap = sh && sh.querySelector('.shaker-cap'); const g = sh && sh.querySelector('.shaker-glass')
  const tin = sh && sh.querySelector('.shaker-tin'); const ans = document.querySelector('.shake-answer'); const again = document.querySelector('.shake-again')
  const scroll = document.querySelector('.sheet-scroll')
  const mat = (el) => { const m = el && getComputedStyle(el).transform.match(/matrix\\(([^)]+)\\)/); return m ? m[1].split(',').map(Number) : el ? [1, 0, 0, 1, 0, 0] : null }
  const gm = mat(g)
  const box = (el) => el && el.getBoundingClientRect()
  // the foot of the glass as drawn: its drink is a rectangle clipped to the bowl, which a bounding box
  // counts to the floor of the glass's box, so clipped shapes and the clip paths themselves are skipped
  const foot = (el) => Math.max(...[...el.querySelectorAll('path, circle, rect')].filter((e) => !e.hasAttribute('clip-path') && !e.closest('clipPath')).map((e) => e.getBoundingClientRect().bottom))
  return JSON.stringify({
    cls: sh && sh.getAttribute('class'), stageH: sh && Math.round(sh.getBoundingClientRect().height),
    capOpacity: cap && Number(getComputedStyle(cap).opacity),
    glass: g ? { scale: Math.round(gm[0] * 1000) / 1000, ty: Math.round(gm[5] * 10) / 10, family: g.querySelector('[data-glass]')?.dataset.glass, clear: Math.round(box(tin).top - foot(g)) } : null,
    lines: ans ? [...ans.children].map((c) => Number(getComputedStyle(c).opacity)) : [],
    again: again && { vis: getComputedStyle(again).visibility, opacity: Number(getComputedStyle(again).opacity), cls: again.className },
    name: ans && ans.querySelector('h3')?.textContent, drink: ans && ans.dataset.drink,
    live: document.querySelector('.sheet .sr-only[aria-live]')?.textContent ?? null,
    scroll: scroll && [scroll.scrollHeight, scroll.clientHeight],
    btn: document.querySelector('.shake-go')?.textContent, sheets: document.querySelectorAll('.sheet').length })
})()`

const fails = []
const check = (ok, what) => { if (!ok) fails.push(what) }
const atRest = (s, where) => {
  check(/is-open/.test(s.cls) && s.capOpacity === 0, `${where}: the cap is off (${s.cls}, cap ${s.capOpacity})`)
  check(s.glass && s.glass.scale === 1 && s.glass.ty === 0, `${where}: the glass hangs at its end values (${JSON.stringify(s.glass)})`)
  check(s.glass && s.glass.clear >= 16, `${where}: the glass's foot clears the neck by 16 or more (${s.glass?.clear})`)
  check(s.stageH === 275, `${where}: the stage is 275 (${s.stageH})`)
  check(s.lines.length >= 2 && s.lines.every((o) => o === 1), `${where}: every line of the card is in (${s.lines})`)
  check(s.again && s.again.vis === 'visible' && s.again.opacity === 1, `${where}: Shake again is in (${JSON.stringify(s.again)})`)
  check(s.scroll && s.scroll[0] <= s.scroll[1], `${where}: the sheet does not scroll (${s.scroll})`)
}

const chrome = await launch({ width: W, height: H })
const out = {}
try {
  const u = await chrome.user('shake')
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true }, u.sessionId)
  const click = (sel) => u.eval(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  await u.goto(BASE + '/?seed&nosync'); await u.sleep(2500)
  out.shell = await u.eval(`(() => { const s = [...document.scripts].map((s) => s.src).find((s) => /assets\\//.test(s)); return s ? s.replace(/.*\\//, '') : null })()`)
  out.opened = await click('.shake-open'); await u.sleep(1800)
  out.idle = JSON.parse(await u.eval(READ))
  check(out.idle.stageH === 275 && out.idle.capOpacity === 1 && !out.idle.glass, `idle: shut, cap on, no glass (${JSON.stringify(out.idle)})`)
  check(!hasOldDrawing(await u.eval(`JSON.stringify({ lid: !!document.querySelector('.shaker-lid'), token: !!document.querySelector('.shaker-token'), window: !!document.querySelector('.shaker-window') })`)), 'idle: no lid, token or window from the old drawing')
  out.pressed = await click('.shake-go'); await u.sleep(SETTLED)
  out.revealed = JSON.parse(await u.eval(READ)); await u.shot('shake-live-reveal')
  atRest(out.revealed, 'reveal')
  check(!/is-still/.test(out.revealed.cls), 'reveal: not still on the first reveal')
  check(out.revealed.btn === 'Go get it' || out.revealed.btn === 'Go again', `reveal: the button says what to do (${out.revealed.btn})`)
  check(!!out.revealed.live && out.revealed.live.startsWith('Try ') && out.revealed.live.includes(out.revealed.name), `reveal: the live line says the card (${out.revealed.live})`)
  out.went = await click('.shake-go'); await u.sleep(1600)
  out.drinkSheet = JSON.parse(await u.eval(`JSON.stringify({ sheets: document.querySelectorAll('.sheet').length, title: document.querySelector('.sheet h2')?.textContent })`))
  check(out.drinkSheet.sheets === 1 && out.drinkSheet.title === out.revealed.name, `go get it: one sheet, the drink's (${JSON.stringify(out.drinkSheet)})`)
  out.closed = await click('.sheet .sheet-close, .sheet [aria-label="Close"]')
  const samples = []
  for (let i = 0; i < 8; i++) { await u.sleep(120); samples.push(JSON.parse(await u.eval(READ))) }
  out.returnSamples = samples.map((s) => `${s.cls} cap ${s.capOpacity} glass ${JSON.stringify(s.glass)} card ${s.lines} again ${s.again?.opacity} live "${s.live}"`)
  samples.forEach((s, i) => {
    check(/is-open/.test(s.cls) && /is-still/.test(s.cls), `return ${i}: is-open is-still (${s.cls})`)
    atRest(s, `return ${i}`)
    check(s.live === '', `return ${i}: the live line is empty ("${s.live}")`)
  })
  await u.sleep(1500); await u.shot('shake-live-return')
  out.returned = JSON.parse(await u.eval(READ))
  out.errors = u.logs.filter((l) => /EXC|error/i.test(l)).slice(0, 5)
  check(!out.errors.length, `no page errors (${out.errors})`)
} finally { chrome.close() }

function hasOldDrawing(json) { const o = JSON.parse(json); return o.lid || o.token || o.window }

console.log(JSON.stringify(out, null, 1))
console.log('shots in', OUT)
if (fails.length) { console.log(`FAIL ${fails.length}:\n  ` + fails.join('\n  ')); process.exit(1) }
console.log('PASS: the reveal and the return read as they should')
