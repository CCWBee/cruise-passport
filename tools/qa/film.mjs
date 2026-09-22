// Film an interaction: what a still cannot show is how a motion reads, so this records one. It loads
// a seeded route, optionally opens something (--click), then starts a screencast, fires the moment
// (--press) and records for --record ms. Out come three things in SHOTS_DIR/<label>/:
//
//   sheet.png   a contact sheet: one tile every --every ms, each stamped with its time from the
//               press, cropped to --crop's box so the motion is big enough to judge
//   film.html   a self-contained flipbook that plays the frames at their real timing (and at a
//               quarter speed, which is where timing faults show), openable straight off disk
//   frames.json the timestamps, so a probe can line the frames up against the CSS
//
// usage: node film.mjs <label> <route> [--click sel] [--press sel] [--record ms] [--every ms]
//                      [--crop sel] [--cols n] [--after ms] [--click2 sel] [--after2 ms] [--reduced]
//   route without the leading slash, as shot.mjs takes it (Git Bash rewrites /route)
//   --click  opens the thing first (a sheet), then waits --after (default 3000, a settled sheet)
//   --click2 a second step before filming (the first shake, to film Shake again), then --after2
//   --press  the control that starts the motion; the clock starts at the press
//   --crop   a selector whose box (plus 24px) every tile shows; default the whole viewport
//   --reduced emulates prefers-reduced-motion: reduce, to film the fallback
// Env: SHOT_BASE (default http://127.0.0.1:5173), SHOTS_DIR (default shots), CDP_PORT.
// It never touches the backend: ?seed&nosync is always appended.
import { launch, OUT } from './cdp.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const [label, rawRoute] = argv
if (!label || rawRoute === undefined) {
  console.error('usage: node film.mjs <label> <route> [--click sel] [--press sel] [--record ms] [--every ms] [--crop sel] [--cols n] [--after ms] [--reduced]')
  process.exit(2)
}
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d }
const has = (k) => argv.includes(k)
const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173'
const route = rawRoute.replace(/^\/+/, '')
const url = `${BASE}/${route}${route.includes('?') ? '&' : '?'}seed&nosync`
const RECORD = Number(opt('--record', 3200))
const EVERY = Number(opt('--every', 100))
const COLS = Number(opt('--cols', 6))
const AFTER = Number(opt('--after', 3000))
const W = 390, H = 844

const dir = path.join(OUT, label)
mkdirSync(dir, { recursive: true })

const chrome = await launch({ width: W, height: H })
try {
  const u = await chrome.user('film')
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true }, u.sessionId)
  if (has('--reduced')) await chrome.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, u.sessionId)
  await u.goto(url); await u.sleep(1500)
  const click = (sel) => u.eval(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  if (opt('--click')) {
    if (!(await click(opt('--click')))) throw new Error('no element for --click ' + opt('--click'))
    await u.sleep(AFTER)
  }
  if (opt('--click2')) {
    if (!(await click(opt('--click2')))) throw new Error('no element for --click2 ' + opt('--click2'))
    await u.sleep(Number(opt('--after2', 4000)))
  }
  // the crop box, in CSS px, read before the motion starts so every tile shows the same window
  const cropSel = opt('--crop')
  const box = cropSel
    ? JSON.parse(await u.eval(`(() => { const e = document.querySelector(${JSON.stringify(cropSel)}); if (!e) return 'null'; const r = e.getBoundingClientRect(); return JSON.stringify({ x: r.left, y: r.top, w: r.width, h: r.height }) })()`))
    : null
  const pad = 24
  const crop = box
    ? { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), w: Math.min(W, box.w + pad * 2), h: Math.min(H, box.h + pad * 2) }
    : { x: 0, y: 0, w: W, h: H }

  const frames = []
  let t0 = null
  const off = chrome.on((msg) => {
    if (msg.method !== 'Page.screencastFrame' || msg.sessionId !== u.sessionId) return
    const { data, metadata, sessionId: ackId } = msg.params
    chrome.send('Page.screencastFrameAck', { sessionId: ackId }, u.sessionId).catch(() => {})
    frames.push({ ts: metadata.timestamp * 1000, data })
  })
  await chrome.send('Page.startScreencast', { format: 'jpeg', quality: 82, everyNthFrame: 1, maxWidth: W * 2, maxHeight: H * 2 }, u.sessionId)
  await u.sleep(250)   // a few frames of the still before the press, so tile 0 is the rest state
  const press = opt('--press')
  if (press) {
    t0 = await u.eval(`(() => { const b = document.querySelector(${JSON.stringify(press)}); if (!b) return -1; b.click(); return performance.timeOrigin + performance.now() })()`)
    if (t0 < 0) throw new Error('no element for --press ' + press)
  } else t0 = Date.now()
  await u.sleep(RECORD)
  await chrome.send('Page.stopScreencast', {}, u.sessionId)
  off()
  if (!frames.length) throw new Error('the screencast returned no frames')

  // A screencast only sends a frame when something repaints, so a still stretch has none: each tile
  // takes the last frame at or before its time, which is what was on the glass at that moment.
  const at = (ms) => { let pick = frames[0]; for (const f of frames) { if (f.ts - t0 <= ms) pick = f; else break } return pick }
  const tiles = []
  for (let ms = -100; ms <= RECORD; ms += EVERY) tiles.push({ ms, f: at(ms) })
  const tw = Math.round(crop.w), th = Math.round(crop.h)
  const tile = (t) => `<figure><div class="f" style="width:${tw}px;height:${th}px;background-image:url(data:image/jpeg;base64,${t.f.data});background-size:${W}px ${H}px;background-position:${-crop.x}px ${-crop.y}px"></div><figcaption>${t.ms < 0 ? 'before' : t.ms + ' ms'}</figcaption></figure>`
  const sheetHtml = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:16px;background:#fff;font:600 13px system-ui;color:#1C3C56}
    h1{font-size:15px;margin:0 0 12px} .g{display:grid;grid-template-columns:repeat(${COLS},${tw}px);gap:12px}
    figure{margin:0} .f{border:1px solid rgba(28,60,86,.12);border-radius:6px;background-repeat:no-repeat}
    figcaption{margin-top:4px;font-variant-numeric:tabular-nums}</style>
    <h1>${label} · ${route} · a tile every ${EVERY} ms from the press${has('--reduced') ? ' · reduced motion' : ''}</h1><div class="g">${tiles.map(tile).join('')}</div>`
  writeFileSync(path.join(dir, 'sheet.html'), sheetHtml)

  // render the contact sheet in the same browser, full page
  const s = await chrome.user('sheet')
  const sheetW = 32 + COLS * tw + (COLS - 1) * 12
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: sheetW, height: 900, deviceScaleFactor: 1, mobile: false }, s.sessionId)
  await chrome.send('Page.navigate', { url: 'file:///' + path.join(dir, 'sheet.html').replace(/\\/g, '/') }, s.sessionId)
  await s.sleep(1200)
  const hgt = await s.eval('document.documentElement.scrollHeight')
  const shotData = await chrome.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: sheetW, height: hgt, scale: 1 } }, s.sessionId)
  writeFileSync(path.join(dir, 'sheet.png'), Buffer.from(shotData.data, 'base64'))

  // the flipbook: real timing, and a quarter speed, which is where a wrong beat shows
  const list = frames.map((f) => ({ t: Math.round(f.ts - t0), d: f.data }))
  const film = `<!doctype html><meta charset="utf-8"><title>${label}</title><style>
    body{margin:0;display:grid;place-items:center;min-height:100vh;background:#e9e4d8;font:600 14px system-ui;color:#1C3C56}
    .v{width:${tw * 2}px;height:${th * 2}px;border-radius:12px;overflow:hidden;background-repeat:no-repeat;background-size:${W * 2}px ${H * 2}px;background-position:${-crop.x * 2}px ${-crop.y * 2}px;box-shadow:0 1px 0 rgba(0,0,0,.08)}
    .c{display:flex;gap:12px;margin-top:12px;align-items:center} button{font:inherit;padding:8px 14px;border-radius:10px;border:1px solid rgba(28,60,86,.2);background:#fff;color:inherit}
    .t{font-variant-numeric:tabular-nums;min-width:90px}</style>
    <div><div class="v" id="v"></div><div class="c"><button id="p1">Play</button><button id="p4">Play at a quarter speed</button><span class="t" id="t"></span></div></div>
    <script>const F=${JSON.stringify(list)};const v=document.getElementById('v'),tl=document.getElementById('t');
    const show=(f)=>{v.style.backgroundImage='url(data:image/jpeg;base64,'+f.d+')';tl.textContent=(f.t<0?'before':f.t+' ms')};show(F[0]);
    let raf=0;function play(rate){cancelAnimationFrame(raf);const start=performance.now()-(F[0].t/rate);let i=0;
    const step=(now)=>{const ms=(now-start)*rate;while(i<F.length-1&&F[i+1].t<=ms)i++;show(F[i]);if(i<F.length-1)raf=requestAnimationFrame(step)};raf=requestAnimationFrame(step)}
    document.getElementById('p1').onclick=()=>play(1);document.getElementById('p4').onclick=()=>play(.25);</script>`
  writeFileSync(path.join(dir, 'film.html'), film)
  writeFileSync(path.join(dir, 'frames.json'), JSON.stringify({ route, press, record: RECORD, crop, frames: list.map((f) => f.t) }))
  console.log(`${frames.length} frames over ${RECORD} ms`)
  console.log('sheet', path.join(dir, 'sheet.png'))
  console.log('film ', path.join(dir, 'film.html'))
  const errs = u.logs.filter((l) => /EXC|error/i.test(l))
  if (errs.length) console.log('page errors:', errs.slice(0, 5).join(' | '))
} finally { chrome.close() }
