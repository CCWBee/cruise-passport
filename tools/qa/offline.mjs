// Does the PWA really render offline? Load twice (install, then let the worker take control), cut
// the network at the CDP layer, reload, and screenshot what came back. Prints the worker state
// before the cut; a body with the app's own title and a non-trivial length means the precache served.
// usage: node offline.mjs [base]    base defaults to https://cruise.charlesbee.org (a dev server has no worker)
// Env: SHOTS_DIR (default shots), CDP_PORT (default: derived from pid)
import { launch, OUT } from './cdp.mjs'
import { writeFileSync } from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'https://cruise.charlesbee.org'
const W = 390, H = 844

const chrome = await launch({ width: W, height: H })
try {
  const u = await chrome.user('offline')
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true }, u.sessionId)
  await u.goto(BASE + '/?nosync'); await u.sleep(4000)   // register + install
  await u.goto(BASE + '/?nosync'); await u.sleep(3000)   // the worker now controls the page
  console.log('worker before the cut:', await u.eval(`(async () => {
    const reg = await navigator.serviceWorker.getRegistration()
    return JSON.stringify({ controller: !!navigator.serviceWorker.controller, hasReg: !!reg, active: !!(reg && reg.active) })
  })()`))
  await chrome.send('Network.enable', {}, u.sessionId)
  await chrome.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 }, u.sessionId)
  await u.sleep(500)
  await chrome.send('Page.reload', {}, u.sessionId); await u.sleep(4000)
  const geom = JSON.parse(await u.eval('JSON.stringify({sw: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, title: document.title, bodyLen: document.body ? document.body.innerText.length : 0})'))
  console.log('offline render:', JSON.stringify(geom))
  const r = await chrome.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: Math.min(geom.h || H, 3000), scale: 1 } }, u.sessionId)
  const file = path.join(OUT, 'offline-reload-full.png'); writeFileSync(file, Buffer.from(r.data, 'base64')); console.log('shot', file)
} finally { chrome.close() }
