// Screenshot every screen of the live app at phone width, viewport + full page.
// usage: node shots.mjs [baseUrl] [prefix]
import { launch, OUT } from './cdp.mjs'
import { writeFileSync } from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'https://cruise.charlesbee.org'
const PREFIX = process.argv[3] || 'live'
const W = 390, H = 844

const chrome = await launch({ width: W, height: H })
try {
  const u = await chrome.user('S')
  // true phone viewport via CDP (not --window-size, which floors at 500)
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true }, undefined).catch(() => {})
  const full = async (label) => {
    const m = await u.eval('JSON.stringify({w: innerWidth, h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth})')
    const { h, sw, w } = JSON.parse(m)
    console.log(label, 'viewport', w, 'scrollW', sw, 'docH', h)
    const file = path.join(OUT, `${PREFIX}-${label}-full.png`)
    // full page: capture beyond viewport with a clip the size of the document
    const r = await chrome.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: Math.min(h, 6000), scale: 1 } }, u.sessionId)
    writeFileSync(file, Buffer.from(r.data, 'base64'))
    return file
  }
  const shot = async (label) => { await u.shot(`${PREFIX}-${label}`); await full(label) }

  await u.goto(`${BASE}/?seed`); await u.sleep(3500)
  await shot('home')
  await u.goto(`${BASE}/drinks`); await u.sleep(2500)
  await shot('drinks')
  await u.eval(`(() => { const b = document.querySelector('.dcard .d-open'); if (b) b.click(); return !!b })()`)
  await u.sleep(3200)
  await u.shot(`${PREFIX}-drink-sheet`)
  await u.goto(`${BASE}/ship`); await u.sleep(2500)
  await shot('ship')
  await u.eval(`(() => { const b = document.querySelector('.venue-row'); if (b) b.click(); return b && b.className })()`).then((c) => console.log('venue click', c))
  await u.sleep(3200)
  await u.shot(`${PREFIX}-venue-sheet`)
  await u.goto(`${BASE}/social`); await u.sleep(2500)
  await shot('social')
  await u.eval(`(() => { const b = document.querySelector('.social-add'); if (b) b.click(); return !!b })()`)
  await u.sleep(3200)
  await u.shot(`${PREFIX}-add-sheet`)
  await u.goto(`${BASE}/stats`); await u.sleep(2500)
  await shot('stats')
  await u.goto(`${BASE}/badges`); await u.sleep(2500)
  await shot('badges')
  await u.goto(`${BASE}/log`); await u.sleep(2500)
  await shot('log')
  await u.goto(`${BASE}/wrapped`); await u.sleep(3000)
  await shot('wrapped')
  console.log('logs:', u.logs.slice(0, 20).join('\n'))
} finally { chrome.close() }
