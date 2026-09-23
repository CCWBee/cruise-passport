// Render the icon SVGs to PNGs at their exact sizes in one headless Chrome. Only inside
// tools/qa/capped.ps1. The app icon's three steps (docs/DESIGN.md, Iconography):
//   python tools/icon/make_svgs.py <svgDir>          the small, full and maskable drawings
//   node tools/icon/render.mjs <svgDir> public icon-32.png:small:32 icon-180.png:full:180 \
//     icon-192.png:full:192 icon-512.png:full:512 icon-maskable-512.png:maskable:512
//   python tools/icon/contact.py <pngDir> <sheet.png>  the check sheet, from a folder that also
//     holds icon-16.png:small:16 and small-512.png:small:512 (render those two there, not in public)
// icon.svg is small.svg as written. The 180 and larger must be opaque (iOS fills alpha with black):
// the full and maskable drawings are full bleed, so they are. A redraw takes new file names.
// usage: node render.mjs <svgDir> <outDir> name:svg:size ...
import { writeFileSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { launch } from '../qa/cdp.mjs'

const [svgDir, outDir, ...jobs] = process.argv.slice(2)
const b = await launch({ width: 512, height: 512 })
const u = await b.user('icon')
for (const job of jobs) {
  const [name, svgName, sizeS] = job.split(':')
  const size = Number(sizeS)
  const svg = readFileSync(path.join(svgDir, svgName + '.svg'), 'utf8')
  const src = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
  const html = `<!doctype html><html><body style="margin:0;background:transparent"><img id="i" src="${src}" width="${size}" height="${size}" style="display:block"></body></html>`
  await b.send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false }, u.sessionId)
  await b.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }, u.sessionId)
  await u.goto('data:text/html;base64,' + Buffer.from(html).toString('base64'))
  await u.eval('document.getElementById("i").decode().then(() => true)')
  const { data } = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } }, u.sessionId)
  const file = path.join(outDir, name)
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log('wrote', file, size)
}
b.close()
