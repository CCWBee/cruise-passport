// The TRUE cold first run: no seed, off the backend, every core screen, full page.
// shot.mjs always adds ?seed, which hides the empty states and (against the live site) signs in an
// anonymous user per run. This one adds ?nosync instead, so it is safe to point at production.
// usage: node cold.mjs [base]    base defaults to http://127.0.0.1:5173; pass https://cruise.charlesbee.org for live
// Env: SHOTS_DIR (default shots), CDP_PORT (default: derived from pid)
import { launch, OUT } from './cdp.mjs'
import { writeFileSync } from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || process.env.SHOT_BASE || 'http://127.0.0.1:5173'
const W = 390, H = 844
const targets = [['cold-home', '/'], ['cold-drinks', '/drinks'], ['cold-ship', '/ship'], ['cold-social', '/social'], ['cold-you', '/you']]

const chrome = await launch({ width: W, height: H })
try {
  for (const [label, route] of targets) {
    const u = await chrome.user('S' + label)
    await chrome.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true }, u.sessionId)
    await u.goto(BASE + route + '?nosync'); await u.sleep(3500)
    const geom = JSON.parse(await u.eval('JSON.stringify({w: innerWidth, sw: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight})'))
    console.log(label, `scrollWidth ${geom.sw}${geom.sw > geom.w ? '  HORIZONTAL OVERFLOW' : ''} docHeight ${geom.h}`)
    const r = await chrome.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: Math.min(geom.h, 6000), scale: 1 } }, u.sessionId)
    const file = path.join(OUT, `${label}-full.png`); writeFileSync(file, Buffer.from(r.data, 'base64')); console.log('shot', file)
  }
} finally { chrome.close() }
