// The glass in real WebKit (docs/specs/2026-09-23-polish-two.md, part 4): Home, the Log button close
// up, the tab bar and its droplet, a drink sheet at medium and large, the sky chip and a toast, at
// 390 by 844, device scale 3, as a phone, in Playwright's WebKit build. Chromium drew the round Log
// button clean while an iPhone showed a darker square inside it, so a WebKit render is the only
// check of the glass that counts for Safari. Every URL carries ?seed&nosync.
//
// Playwright is never installed into the project. Install it and its WebKit into a scratch folder
// (Git Bash):
//
//   npm i playwright@1.63.0 --prefix <scratch>/pw
//   PLAYWRIGHT_BROWSERS_PATH=<scratch>/pw/browsers npx --prefix <scratch>/pw playwright install webkit
//
// then run it inside the CPU cap, with the dev server up (npm run dev). capped.ps1 is a PowerShell
// script and reads a flag such as --out as one of its own, so through it the options go in the
// environment (PowerShell):
//
//   $env:PW_DIR = '<scratch>\pw'; $env:PLAYWRIGHT_BROWSERS_PATH = '<scratch>\pw\browsers'
//   $env:WK_HOURS = '13,19,23'   # optional, as are WK_BASE (default the dev server) and WK_OUT
//   powershell -NoProfile -ExecutionPolicy Bypass -File tools/qa/capped.ps1 -CpuPercent 10 -Log <log> node tools/qa/webkit-shots.mjs
//
// Outside the cap the same options are --base, --hours and --out.
//
// Writes tools/qa/sweeps/webkit-<stamp>/<state>-<hour>.png (gitignored), and prints, per hour, the
// computed clip of every glass layer on the Log button, the capsule, the sky chip, the sheet and the
// toast.
//
// Read the first line it prints before the pictures. Playwright's Windows WebKit (the WinCairo port,
// 1.63.0 on 23 September 2026) reports backdrop-filter as supported and paints none of it: a round
// blur over black and white stripes comes out with the stripes sharp. So on Windows a clean render
// here proves the layout, the radii and the computed clip-paths, never the blur, and the square
// Charles saw on his iPhone cannot be reproduced on this machine; the script says which case it is
// in by sampling a probe before the app loads. A Mac's Playwright WebKit should paint the filter; it
// has not been tried.
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const PW_DIR = process.env.PW_DIR
if (!PW_DIR) { console.error('Set PW_DIR to the folder playwright was installed into with --prefix'); process.exit(2) }
const { webkit } = createRequire(path.join(PW_DIR, 'package.json'))('playwright')

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d }
const BASE = arg('--base', process.env.WK_BASE || 'http://127.0.0.1:5173')
const HOURS = arg('--hours', process.env.WK_HOURS || '13,19,23').split(',').map(Number)
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
const OUT = path.resolve(arg('--out', process.env.WK_OUT || path.join(HERE, 'sweeps', `webkit-${stamp}`)))
mkdirSync(OUT, { recursive: true })

const url = (route, hour) => BASE + route + (route.includes('?') ? '&' : '?') + `seed&nosync&hour=${hour}`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// What WebKit computed for each glass layer: the pseudo-elements' filters, radius and clip, and the
// element's own isolation and overflow, which is where a square layer would come from.
const LAYERS = (sel) => `(() => {
  const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null
  const pick = (cs) => ({ bf: cs.webkitBackdropFilter || cs.backdropFilter, br: cs.borderRadius, clip: cs.clipPath, mask: (cs.webkitMaskImage || cs.maskImage || '').slice(0, 24), z: cs.zIndex, op: cs.opacity })
  const cs = getComputedStyle(el)
  return { el: { iso: cs.isolation, br: cs.borderRadius, ov: cs.overflow, clip: cs.clipPath }, before: pick(getComputedStyle(el, '::before')), after: pick(getComputedStyle(el, '::after')) }
})()`

const browser = await webkit.launch()
try {
  // Does this build paint backdrop-filter at all? A blurred disc over 2px stripes: if it paints, the
  // disc's centre is a mid grey; if not, neighbouring pixels there are still black and white.
  {
    const p = await browser.newPage({ viewport: { width: 120, height: 120 } })
    await p.setContent(`<body style="margin:0;background:repeating-linear-gradient(90deg,#000 0 2px,#fff 2px 4px)"><div style="position:absolute;inset:10px;border-radius:50%;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)"></div></body>`)
    const png = await p.screenshot({ clip: { x: 56, y: 58, width: 8, height: 1 } })
    await p.close()
    // decode the eight pixels by rendering the PNG into a canvas in another page
    const q = await browser.newPage()
    const px = await q.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
      const g = c.getContext('2d'); g.drawImage(img, 0, 0)
      return [...g.getImageData(0, 0, c.width, 1).data].filter((_, i) => i % 4 === 0)
    }, png.toString('base64'))
    await q.close()
    const spread = Math.max(...px) - Math.min(...px)
    console.log(spread > 128 ? 'backdrop-filter painted: NO (this WebKit build draws no blur; read the shots for layout and clip only)' : 'backdrop-filter painted: yes')
  }
  for (const hour of HOURS) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.log(`[${hour}] pageerror`, e.message))
    const shot = async (name, opts = {}) => {
      const file = path.join(OUT, `${name}-${hour}.png`)
      await page.screenshot({ path: file, ...opts })
      console.log(`[${hour}]`, name)
    }
    const box = async (sel, pad = 12) => {
      const b = await page.locator(sel).first().boundingBox()
      if (!b) return null
      return { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: Math.min(390, b.width + pad * 2), height: b.height + pad * 2 }
    }

    // Home, the Log button, the capsule and its droplet, the sky chip
    await page.goto(url('/', hour)); await sleep(3000)
    await shot('home')
    const log = await box('.logbtn', 10)
    if (log) await shot('log-close', { clip: log })
    const dock = await box('.dock', 8)
    if (dock) await shot('dock', { clip: dock })
    const chip = await box('.sea-chip', 10)
    if (chip) await shot('sky-chip', { clip: chip })
    console.log(`[${hour}] logbtn`, JSON.stringify(await page.evaluate(LAYERS('.logbtn'))))
    console.log(`[${hour}] tabbar`, JSON.stringify(await page.evaluate(LAYERS('.tabbar'))))
    console.log(`[${hour}] sea-chip`, JSON.stringify(await page.evaluate(LAYERS('.sea-chip'))))
    console.log(`[${hour}] tab-return`, JSON.stringify(await page.evaluate(LAYERS('.tab-return'))))

    // A drink sheet at medium, then large
    await page.goto(url('/drinks', hour)); await sleep(2600)
    await page.locator('.dcard .d-open').first().click(); await sleep(3200)
    await shot('drink-medium')
    console.log(`[${hour}] sheet`, JSON.stringify(await page.evaluate(LAYERS('.sheet'))))
    const expand = page.locator('[aria-label="Expand"]').first()
    if (await expand.count()) { await expand.click(); await sleep(1400); await shot('drink-large') }

    // A toast: tick a drink from the search Log opens
    await page.goto(url('/', hour)); await sleep(2600)
    await page.locator('.logbtn').first().click(); await sleep(1600)
    await shot('search')
    const tick = page.locator('.search-layer .d-try:not(.on)').first()
    if (await tick.count()) {
      await tick.click(); await sleep(700)
      const t = await box('.toast', 12)
      if (t) await shot('toast', { clip: t })
      console.log(`[${hour}] toast`, JSON.stringify(await page.evaluate(LAYERS('.toast'))))
      await shot('toast-screen')
    } else console.log(`[${hour}] no unticked drink in the search to raise a toast`)
    await ctx.close()
  }
} finally {
  await browser.close()
  console.log('out:', OUT)
}
