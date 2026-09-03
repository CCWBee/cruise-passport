// The sheet's gesture contract, driven with real touch events through CDP.
//
//   node tools/qa/gestures.mjs            (dev server already running on 127.0.0.1:5173)
//
// Charles's report on his iPhone was that the drink sheet "disappears when you swipe down too easy",
// that the page sometimes pull-to-refreshes behind it, and that the panes have left-right play. The
// five cases below are that report turned into assertions, plus the width checks for the sideways
// play. Every case prints PASS or FAIL and the run exits 1 if any of them fails.
//
// What this cannot prove: iOS rubber-band and pull-to-refresh are Safari behaviours; headless Chrome
// only shows that we never hand the gesture to the browser in the first place. Nor can it exercise
// the first few pixels of a touch: Chrome withholds every touchmove until the finger is about 15px
// from where it went down (its touch slop), so the veto's 4px window is invisible here. Case (h)
// says what it does and does not hold to.
import { launch } from './cdp.mjs'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173'
const W = 390, H = 844
const MID = Math.round(W / 2)

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '   ' + detail : ''}`)
}

// setTimeout on Windows lands anywhere in a 15ms window, which is the whole budget of a 60ms flick,
// so short waits spin instead.
const waitUntil = async (t) => {
  const gap = t - performance.now()
  if (gap <= 0) return
  if (gap > 24) await new Promise((r) => setTimeout(r, gap - 8))
  while (performance.now() < t) { /* spin the last few ms */ }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const chrome = await launch({ width: W, height: H })
try {
  const u = await chrome.user('G')
  const sid = u.sessionId
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true }, sid)
  await chrome.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 }, sid)

  const touch = (type, points) => chrome.send('Input.dispatchTouchEvent', { type, touchPoints: points }, sid)

  // One finger, from (x, y), moving (dx, dy) over ms in `steps` samples, then released (after `hold`
  // ms of stillness if asked). A CDP round trip is 30 to 70ms, far longer than a flick, so the moves
  // are written to the socket on a spin-timed schedule and only awaited afterwards: the browser
  // receives them in order, at the pace asked for. What the sheet actually saw is measured in the
  // page, not here, and returned as {ms, px, v}.
  async function swipe({ x, y, dx, dy, ms, steps = 12, hold = 0 }) {
    await u.eval(`(() => {
      window.__tm = []
      if (window.__tmL) { document.removeEventListener('touchmove', window.__tmL, true); document.removeEventListener('touchstart', window.__tmL, true) }
      window.__tmL = (e) => window.__tm.push([performance.now(), e.touches[0] ? e.touches[0].clientY : null])
      document.addEventListener('touchstart', window.__tmL, true)
      document.addEventListener('touchmove', window.__tmL, true)
    })()`)
    const t0 = performance.now()
    await touch('touchStart', [{ x, y, id: 1 }])
    const sent = []
    for (let i = 1; i <= steps; i++) {
      await waitUntil(t0 + (ms * i) / steps)
      const k = i / steps
      sent.push(touch('touchMove', [{ x: Math.round(x + dx * k), y: Math.round(y + dy * k), id: 1 }]))
    }
    if (hold) await sleep(hold)
    sent.push(touch('touchEnd', []))
    await Promise.all(sent)
    const tm = await u.eval('JSON.stringify(window.__tm)').then(JSON.parse)
    if (tm.length < 2) return { ms: 0, px: 0, v: 0, n: tm.length }
    const [ta, ya] = tm[0], [tb, yb] = tm[tm.length - 1]
    const span = tb - ta
    return { ms: Math.round(span), px: Math.round(yb - ya), v: span > 0 ? (yb - ya) / span : 0, n: tm.length }
  }
  const seen = (g) => `page saw ${g.px}px over ${g.ms}ms (${g.v.toFixed(2)}px/ms, ${g.n} moves)`

  const open = async (route, sel, settle = 1000) => {
    await u.goto(`${BASE}/${route}?seed`)
    await u.sleep(1800)
    const hit = await u.eval(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
    if (!hit) throw new Error('nothing matched ' + sel)
    await u.sleep(settle)
  }
  const reopen = async (sel, settle = 1000) => {
    await u.eval(`document.querySelector(${JSON.stringify(sel)}).click()`)
    await u.sleep(settle)
  }
  const state = () => u.eval(`(() => {
    const s = document.querySelector('.sheet')
    const sc = document.querySelector('.sheet-scroll')
    return JSON.stringify({
      present: !!s,
      transform: s ? getComputedStyle(s).transform : null,
      top: s ? Math.round(s.getBoundingClientRect().top) : null,
      height: s ? Math.round(s.getBoundingClientRect().height) : null,
      scrollTop: sc ? Math.round(sc.scrollTop) : null,
      scrollW: sc ? sc.scrollWidth : null,
      clientW: sc ? sc.clientWidth : null,
      docW: document.documentElement.scrollWidth,
      bodyPos: document.body.style.position,
    })
  })()`).then(JSON.parse)

  // ── the drink sheet ──────────────────────────────────────────────────────────────────────────
  await open('drinks', '.dcard .d-open')
  let s = await state()
  if (!s.present) throw new Error('the drink sheet did not open')
  console.log(`sheet: top ${s.top}, height ${s.height}, dismiss past ${Math.round(Math.max(140, s.height * 0.35))}px`)
  check('body is locked while the sheet is open', s.bodyPos === 'fixed', `body.style.position=${JSON.stringify(s.bodyPos)}`)

  const head = () => s.top + 10   // inside .sheet-handle

  // (a) a slow 100px drag from the header settles back
  let g = await swipe({ x: MID, y: head(), dx: 0, dy: 100, ms: 600, steps: 20 })
  await sleep(300)
  let after = await state()
  check('(a) slow 100px drag over ~600ms settles back',
    after.present && after.transform === 'none', `${seen(g)}, transform ${after.transform}`)

  // (a2) the reported bug: a lazy 80px drag, quick enough that the old velocity test (dy over the
  // whole gesture, 0.5px/ms) fired, must now settle back
  g = await swipe({ x: MID, y: head(), dx: 0, dy: 80, ms: 140, steps: 7 })
  await sleep(300)
  after = await state()
  check('(a2) lazy 80px drag over ~140ms settles back (the reported bug)',
    after.present && after.transform === 'none', `${seen(g)}, transform ${after.transform}`)

  // (b) a 320px drag dismisses
  if (!after.present) await reopen('.dcard .d-open')
  s = await state()
  g = await swipe({ x: MID, y: head(), dx: 0, dy: 320, ms: 500, steps: 16 })
  await sleep(300)
  after = await state()
  check('(b) 320px drag dismisses', !after.present, seen(g))

  // (c) a fast 90px flick dismisses
  await reopen('.dcard .d-open')
  s = await state()
  g = await swipe({ x: MID, y: head(), dx: 0, dy: 90, ms: 60, steps: 6 })
  await sleep(300)
  after = await state()
  check('(c) 90px flick in ~60ms dismisses', !after.present, seen(g))

  // (f) the same two dismissals started from the title, inside the scroller at scrollTop 0: this is
  // where a thumb actually lands, and it is the path that depends on the touchmove veto beating the
  // browser's own pan latch.
  await reopen('.dcard .d-open')
  s = await state()
  g = await swipe({ x: MID, y: s.top + 60, dx: 0, dy: 320, ms: 500, steps: 16 })
  await sleep(300)
  after = await state()
  check('(f1) 320px drag from the title (scrollTop 0) dismisses', !after.present, seen(g))

  await reopen('.dcard .d-open')
  s = await state()
  g = await swipe({ x: MID, y: s.top + 60, dx: 0, dy: 90, ms: 60, steps: 6 })
  await sleep(300)
  after = await state()
  check('(f2) 90px flick from the title (scrollTop 0) dismisses', !after.present, seen(g))

  // (g) the same drag, crawling: 100 samples over 900ms is ~3px a move. A slow start is where a
  // delayed veto could cost the gesture, because the browser latches a scroll on the first move it
  // is allowed to keep and never gives it back. This is the case that says the delay is safe.
  await reopen('.dcard .d-open')
  s = await state()
  g = await swipe({ x: MID, y: s.top + 60, dx: 0, dy: 320, ms: 900, steps: 100 })
  await sleep(300)
  after = await state()
  check('(g) crawling 320px drag from the title (3px a move) still dismisses', !after.present, seen(g))

  // (h) plant and jiggle, all inside one touch: a thumb settles, slips a pixel or two down, then
  // scrolls up to read. The veto holds off for 4px so those first pixels are never prevented: iOS
  // does not hand a touch back once preventDefault has been called on it, and a swipe that opens
  // with a nudge would otherwise be dead.
  // Headless Chrome cannot exercise that window. Its touch slop withholds every touchmove until the
  // finger is ~15px from where it started, so the sub-4px moves dispatched below never reach the
  // page at all (the count is printed, and it is 0 here). What this case can hold to is the outcome
  // (the gesture ends as a scroll with the sheet still up) and that nothing under 4px was vetoed.
  // The recorder is a document listener: it runs after the sheet's, so it sees defaultPrevented.
  await reopen('.dcard .d-open')
  await u.eval(`document.querySelector('.sheet-scroll').scrollTop = 0`)
  s = await state()
  const ty = s.top + 90
  await u.eval(`(() => {
    window.__pv = []
    if (window.__pvL) document.removeEventListener('touchmove', window.__pvL)
    window.__pvL = (e) => window.__pv.push([Math.round(e.touches[0] ? e.touches[0].clientY : -1), e.defaultPrevented])
    document.addEventListener('touchmove', window.__pvL)
  })()`)
  await touch('touchStart', [{ x: MID, y: ty, id: 1 }])
  await sleep(30)
  await touch('touchMove', [{ x: MID, y: ty + 1, id: 1 }])
  await sleep(30)
  await touch('touchMove', [{ x: MID, y: ty + 2, id: 1 }])
  for (let i = 1; i <= 12; i++) {
    await sleep(16)
    await touch('touchMove', [{ x: MID, y: ty + 2 - i * 14, id: 1 }])
  }
  await touch('touchEnd', [])
  await sleep(400)
  const pv = await u.eval('JSON.stringify(window.__pv)').then(JSON.parse)
  await u.eval(`document.removeEventListener('touchmove', window.__pvL)`)
  after = await state()
  const nudges = pv.filter(([y]) => y - ty > 0 && y - ty <= 4)
  const vetoed = nudges.filter(([, prevented]) => prevented)
  check('(h) a 2px nudge before an upward scroll is not vetoed, and the scroll happens',
    !vetoed.length && after.present && after.scrollTop > 0,
    `${nudges.length} sub-4px moves reached the page (Chrome slop swallows them), ${vetoed.length} vetoed; scrollTop ${after.scrollTop}`)
  await u.eval(`document.querySelector('.sheet-scroll').scrollTop = 0`)

  // (d) with the scroller scrolled down, a downward drag scrolls instead of dismissing
  if (!after.present) await reopen('.dcard .d-open')
  s = await state()
  await swipe({ x: MID, y: s.top + 320, dx: 0, dy: -220, ms: 350, steps: 14, hold: 60 })
  await sleep(400)
  let scrolled = await state()
  check('(d0) a touch swipe scrolls the sheet (touch-action holds)', scrolled.scrollTop > 0, `scrollTop ${scrolled.scrollTop}`)
  if (scrolled.scrollTop < 200) {
    await u.eval(`document.querySelector('.sheet-scroll').scrollTop = 200`)
    await sleep(120)
    scrolled = await state()
  }
  await swipe({ x: MID, y: scrolled.top + 320, dx: 0, dy: 200, ms: 400, steps: 16, hold: 60 })
  await sleep(400)
  after = await state()
  check('(d) 200px downward drag at scrollTop 200 does not dismiss (it scrolls)',
    after.present && after.scrollTop < scrolled.scrollTop,
    `scrollTop ${scrolled.scrollTop} -> ${after.scrollTop}, transform ${after.transform}`)

  // (e) a mostly-horizontal drag does nothing
  if (!after.present) await reopen('.dcard .d-open')
  await u.eval(`document.querySelector('.sheet-scroll').scrollTop = 0`)
  s = await state()
  await swipe({ x: 60, y: s.top + 90, dx: 80, dy: 20, ms: 300, steps: 12 })
  await sleep(300)
  after = await state()
  check('(e) mostly-horizontal 80px drag does nothing',
    after.present && after.transform === 'none' && after.scrollTop === 0,
    `transform ${after.transform}, scrollTop ${after.scrollTop}`)

  // a plain tap inside the sheet still works: arming a drag must not eat taps
  const chip = await u.eval(`(() => { const c = document.querySelector('.ds-chip'); if (!c) return null; const r = c.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), on: c.getAttribute('aria-pressed') }) })()`).then((r) => r && JSON.parse(r))
  if (chip) {
    await touch('touchStart', [{ x: chip.x, y: chip.y, id: 1 }])
    await sleep(60)
    await touch('touchEnd', [])
    await sleep(300)
    const now = await u.eval(`document.querySelector('.ds-chip').getAttribute('aria-pressed')`)
    check('a tap inside the sheet still registers', now !== chip.on, `aria-pressed ${chip.on} -> ${now}`)
  }

  // no sideways play, on the page or in the sheet
  check('drink sheet: no horizontal play', after.docW === W && after.scrollW === after.clientW,
    `doc ${after.docW}, scroll ${after.scrollW}/${after.clientW}`)

  // the close control is 36px drawn and 44px to a thumb: a tap 3px above its box still closes.
  const x = await u.eval(`(() => { const r = document.querySelector('.sheet-x').getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y), w: Math.round(r.width) }) })()`).then(JSON.parse)
  await touch('touchStart', [{ x: x.x, y: x.y - 3, id: 1 }])
  await sleep(60)
  await touch('touchEnd', [])
  await sleep(300)
  const closed = await state()
  check('close: a tap 3px outside the 36px box still closes it (44px target)', !closed.present,
    `button ${x.w}px wide, tapped 3px above its top edge`)

  // the body lock is handed back on close
  if (closed.present) { await u.eval(`document.querySelector('.sheet-x').click()`); await sleep(300) }
  const released = await state()
  check('body lock released on close', !released.present && released.bodyPos === '', `body.style.position=${JSON.stringify(released.bodyPos)}`)

  // ── the other two sheets: width only ─────────────────────────────────────────────────────────
  for (const [label, route, sel] of [['venue', 'ship', '.venue-row'], ['add', 'social', '.social-add']]) {
    await open(route, sel)
    const t = await state()
    check(`${label} sheet: no horizontal play`, t.present && t.docW === W && t.scrollW === t.clientW,
      `doc ${t.docW}, scroll ${t.scrollW}/${t.clientW}`)
  }

  const bad = u.logs.filter((l) => l.startsWith('EXC') || l.startsWith('error'))
  if (bad.length) console.log('console:', bad.slice(0, 5).join('\n'))
} finally { chrome.close() }

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
