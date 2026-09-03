// Before/after montage of two screenshot sweeps (see shots.mjs), rendered by headless Chrome.
//   node tools/qa/compare.mjs <beforePrefix> <afterPrefix> [outName]
// e.g. node tools/qa/shots.mjs https://cruise.charlesbee.org live ; node tools/qa/shots.mjs http://127.0.0.1:5173 local
//      node tools/qa/compare.mjs live local
import { launch, OUT } from './cdp.mjs'
import { existsSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const [before, after, outName = 'before-after'] = process.argv.slice(2)
if (!before || !after) { console.error('usage: node compare.mjs <beforePrefix> <afterPrefix> [outName]'); process.exit(2) }
const screens = [
  ['Home', 'home'], ['Drinks', 'drinks'], ['Drink sheet', 'drink-sheet'], ['Ship', 'ship'], ['Venue sheet', 'venue-sheet'],
  ['Crew', 'social'], ['Add to your crew', 'add-sheet'], ['Stats', 'stats'], ['Badges', 'badges'], ['Log', 'log'], ['Wrapped', 'wrapped'],
]
const dir = OUT.replace(/\\/g, '/')
const pairs = screens.filter(([, k]) => existsSync(path.join(OUT, `${before}-${k}.png`)) && existsSync(path.join(OUT, `${after}-${k}.png`)))
const cell = ([label, k]) => `
  <figure><figcaption>${label}</figcaption><div class="pair">
    <div><span>${before}</span><img src="file:///${dir}/${before}-${k}.png"></div>
    <div><span>${after}</span><img src="file:///${dir}/${after}-${k}.png"></div>
  </div></figure>`
const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; padding: 24px; background: #fff; font: 14px/1.4 system-ui, sans-serif; color: #1C3C56; }
  h1 { font-size: 20px; font-weight: 600; margin: 0 0 16px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px 20px; }
  figure { margin: 0; } figcaption { font-weight: 600; margin-bottom: 6px; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .pair span { display: block; font-size: 12px; color: rgba(28,60,86,.7); margin-bottom: 4px; }
  img { width: 100%; display: block; border: 1px solid rgba(28,60,86,.12); border-radius: 6px; }
</style><h1>Cocktail Passport · ${before} and ${after}, 390×844</h1><div class="grid">${pairs.map(cell).join('')}</div>`
const page = path.join(OUT, `${outName}.html`)
writeFileSync(page, html)

const W = 1680, H = 1200
const chrome = await launch({ width: W, height: H })
try {
  const u = await chrome.user('C')
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false }, u.sessionId)
  await u.goto('file:///' + page.replace(/\\/g, '/')); await u.sleep(1500)
  const h = await u.eval('document.documentElement.scrollHeight')
  const r = await chrome.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: h, scale: 1 } }, u.sessionId)
  const file = path.join(OUT, `${outName}.png`); writeFileSync(file, Buffer.from(r.data, 'base64')); console.log(file, 'height', h, 'pairs', pairs.length)
} finally { chrome.close() }
