// One screenshot of one screen from the running dev server, seeded, at phone size.
// usage: node shot.mjs <label> <route> [--click <selector>] [--click2 <selector>] [--full] [--wait <ms>] [--eval <js>]
//   label: file name stem (written to shots/<label>.png, plus <label>-full.png with --full)
//   route: WITHOUT the leading slash: drinks, social, stats, "home" for the root (the ?seed demo data is added for you)
//   --click: CSS selector to click after load (opens a sheet); --click2 clicks a second selector after that
//   --eval : JS to run after load/clicks, its JSON result is printed
// Env: SHOTS_DIR (default shots), CDP_PORT (default: derived from pid), SHOT_BASE (default http://127.0.0.1:5173)
import { launch, OUT } from './cdp.mjs'
import { writeFileSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const label = args[0]
// Git Bash rewrites a leading "/drinks" into a Windows path, so routes are passed WITHOUT the slash
// ("drinks", "social", "home" or "." for the root) and normalised here.
const rawRoute = args[1]
if (!label || !rawRoute) { console.error('usage: node shot.mjs <label> <route-without-leading-slash> [--click sel] [--click2 sel] [--full] [--wait ms] [--eval js]'); process.exit(2) }
const route = (rawRoute === 'home' || rawRoute === '.') ? '/'
  : rawRoute.startsWith('home?') ? '/' + rawRoute.slice(4)   // home?day=2026-10-05 -> /?day=2026-10-05
  : '/' + rawRoute.replace(/^([A-Za-z]:)?[\\/]+([^\\/]*[\\/])*/, '')
const opt = (k) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : undefined }
const has = (k) => args.includes(k)
const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173'
const W = 390, H = 844
const wait = Number(opt('--wait') || 2200)

const chrome = await launch({ width: W, height: H })
try {
  const u = await chrome.user('S')
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true }, u.sessionId)
  // the seed query goes before any #hash (an /add#CODE link keeps its fragment intact)
  const [pathPart, hashPart] = route.split('#')
  const url = BASE + pathPart + (pathPart.includes('?') ? '&' : '?') + 'seed' + (hashPart ? '#' + hashPart : '')
  await u.goto(url); await u.sleep(wait)
  for (const k of ['--click', '--click2']) {
    const sel = opt(k)
    if (!sel) continue
    const hit = await u.eval(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
    if (!hit) console.error('WARN: nothing matched', sel)
    await u.sleep(Number(opt('--after') || 1600))  // --after <ms>: settle time after a click (a sheet's wave runs ~2.4s)
  }
  const js = opt('--eval')
  if (js) console.log('eval:', JSON.stringify(await u.eval(js)))
  const geom = JSON.parse(await u.eval('JSON.stringify({w: innerWidth, sw: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight})'))
  console.log(`viewport ${geom.w} scrollWidth ${geom.sw} docHeight ${geom.h}${geom.sw > geom.w ? '  HORIZONTAL OVERFLOW' : ''}`)
  console.log('shot', await u.shot(label))
  if (has('--full')) {
    const r = await chrome.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: Math.min(geom.h, 6000), scale: 1 } }, u.sessionId)
    const file = path.join(OUT, `${label}-full.png`); writeFileSync(file, Buffer.from(r.data, 'base64')); console.log('shot', file)
  }
  const bad = u.logs.filter((l) => l.startsWith('EXC') || l.startsWith('error'))
  if (bad.length) console.log('console:', bad.slice(0, 5).join('\n'))
} finally { chrome.close() }
