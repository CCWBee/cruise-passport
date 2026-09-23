// Mechanical scan of CSS against docs/DESIGN.md: sizes, weights, spacing, radii, shadows, blur, caps,
// easing, colours, gradients and endless motion. Heuristic, so it names suspects with line numbers;
// a human (or agent) decides, and the accepted exceptions live in design-allow.txt.
//
//   node tools/qa/scan.mjs <file.css | dir> [...]      list every suspect
//   node tools/qa/scan.mjs --check src                 exit 1 if any suspect is not in design-allow.txt
//
// The --check form is `npm run design:check` and runs in CI before the build, so a stray 11px label
// or a shadow on a card fails the deploy instead of shipping. Add a genuine exception to
// design-allow.txt with its reason; do not widen the scanner.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))

// The scales are read from the token file, so the scan and the system cannot drift apart: every px
// value a --f-*, --s<n> or --r-* token holds is on its scale, plus the few literals named below.
const TOKENS = path.join(here, '..', '..', 'src', 'styles', 'tokens.css')
const tokenPx = (prefix) => {
  if (!existsSync(TOKENS)) return []
  const src = strip(readFileSync(TOKENS, 'utf8'))
  return [...src.matchAll(new RegExp(`--${prefix}[\\w-]*\\s*:\\s*(\\d+(?:\\.\\d+)?px)\\s*;`, 'g'))].map((m) => m[1])
}
// 16px: the iOS zoom guard on fields that predate the 17px body
const FONT_OK = new Set([...tokenPx('f-'), '12px', '16px'])
const SPACE_OK = new Set([...tokenPx('s\\d'), '0', '0px', '1px', '2px', '3px', 'auto'])
// 4px: tiny bars and dots
const RADIUS_OK = new Set([...tokenPx('r-'), '50%', 'inherit', '0', '0px', '4px'])
// a colour is a token; white and the inks are the literal exceptions: night's warm white and day's ink
const COLOR_OK = /^(var\(--[\w-]+\)|transparent|currentColor|inherit|none|#fff|#ffffff|rgba\(255,\s*255,\s*255,\s*[\d.]+\)|rgba\(246,\s*241,\s*233,\s*[\d.]+\)|rgba\(14,\s*26,\s*46,\s*[\d.]+\))$/i
// a shadow is a token too: a value made only of var() references passes
const SHADOW_OK = /^(none|var\(--[\w-]+\)(\s*,\s*var\(--[\w-]+\))*)$/

function scan(file) {
  const src = strip(readFileSync(file, 'utf8'))
  const lines = src.split('\n')
  const out = []
  const flag = (i, why, what) => out.push({ file, line: i + 1, why, what: what.trim() })
  lines.forEach((line, i) => {
    const l = line.trim()
    for (const m of l.matchAll(/font-size\s*:\s*([^;]+);/g)) {
      const v = m[1].trim()
      if (v.startsWith('var(') || v.startsWith('clamp(') || v.startsWith('calc(') || v === 'inherit') continue
      if (!FONT_OK.has(v)) flag(i, 'font-size off scale (the --f-* tokens)', v)
    }
    for (const m of l.matchAll(/(?:^|[\s;{])(padding|margin|gap|row-gap|column-gap|top|right|bottom|left|inset)(?:-[a-z]+)?\s*:\s*([^;]+);/g)) {
      for (const p of m[2].trim().split(/\s+/)) {
        if (/^(var|calc|clamp|min|max|env)\(/.test(p) || p === 'auto' || p.startsWith('-')) continue
        if (/^-?\d*\.?\d+(px)?$/.test(p) && !SPACE_OK.has(p)) flag(i, 'spacing off scale (the --s tokens: 4 8 12 16 24 32)', m[0])
      }
    }
    for (const m of l.matchAll(/border(?:-[a-z-]+)?-radius\s*:\s*([^;]+);/g)) {
      for (const p of m[1].trim().split(/\s+/)) {
        if (/^(var|calc)\(/.test(p)) continue
        if (!RADIUS_OK.has(p)) flag(i, 'radius off scale (the --r-* tokens)', m[0])
      }
    }
    for (const m of l.matchAll(/box-shadow\s*:\s*([^;]+);/g)) {
      const v = m[1].trim()
      if (!SHADOW_OK.test(v)) flag(i, 'shadow not a token (the glass lift, the sheet)', v)
    }
    if (/backdrop-filter/.test(l)) flag(i, 'backdrop-filter (the glass engine in base.css, and chrome that owns its surface)', l)
    if (/text-transform\s*:\s*uppercase/.test(l)) flag(i, 'uppercase label', l)
    if (/letter-spacing\s*:\s*\.?0*[1-9]/.test(l) && !/letter-spacing\s*:\s*-/.test(l)) flag(i, 'tracked label', l)
    if (/cubic-bezier|linear\(|ease-in-out|\bease\b(?!-out)/.test(l) && !/var\(--e-out\)/.test(l)) flag(i, 'easing other than a token (--e-out, --e-spring, --e-drawer)', l)
    for (const m of l.matchAll(/font-weight\s*:\s*([^;]+);/g)) {
      const v = m[1].trim()
      if (!['400', '600', '700', 'normal', 'inherit'].includes(v)) flag(i, 'weight not 400/600/700', v)
    }
    for (const m of l.matchAll(/\bfont\s*:\s*([^;]+);/g)) {
      const w = m[1].trim().split(/\s+/)[0]
      if (/^\d+$/.test(w) && !['400', '600', '700'].includes(w)) flag(i, 'weight not 400/600/700 (font shorthand)', m[1].trim())
    }
    for (const m of l.matchAll(/(#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|color\(display-p3[^)]*\))/gi)) {
      if (!COLOR_OK.test(m[1])) flag(i, 'colour not a token', m[1])
    }
    if (/linear-gradient|radial-gradient/.test(l)) flag(i, 'gradient (the room, the glass, the sea and the medals only)', l)
    if (/animation\s*:\s*[^;]*infinite/.test(l) && !/spin/.test(l)) flag(i, 'endless animation (the room drift, ship bob and spinners only)', l)
  })
  return out
}

function cssFiles(target) {
  if (!existsSync(target)) return []
  if (statSync(target).isFile()) return target.endsWith('.css') ? [target] : []
  return readdirSync(target, { recursive: true })
    .map((f) => path.join(target, String(f)))
    .filter((f) => f.endsWith('.css') && !f.includes('node_modules'))
}

const args = process.argv.slice(2)
const check = args.includes('--check')
const targets = args.filter((a) => !a.startsWith('--'))
// tokens.css defines the palette and the easing, so its literals are the tokens, not violations
const files = targets.flatMap(cssFiles).filter((f) => !/tokens\.css$/.test(f))
const norm = (f) => f.replace(/\\/g, '/')

let allow = []
const allowFile = path.join(here, 'design-allow.txt')
if (check && existsSync(allowFile)) {
  allow = readFileSync(allowFile, 'utf8').split('\n')
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => { const [suffix, needle] = l.split('::').map((s) => s.trim()); return { suffix, needle } })
}
const allowed = (s) => allow.some((a) => norm(s.file).endsWith(a.suffix) && (s.why + ' ' + s.what).includes(a.needle))

let failed = 0
for (const file of files) {
  const suspects = scan(file).filter((s) => !(check && allowed(s)))
  if (!suspects.length) { if (!check) console.log(`${norm(file)}: clean`); continue }
  failed += suspects.length
  for (const s of suspects) console.log(`${norm(s.file)}:${s.line}  ${s.why}: ${s.what}`)
}
if (check) {
  if (failed) { console.error(`\ndesign:check: ${failed} suspect line(s) not in tools/qa/design-allow.txt. Fix them, or add a genuine exception with its reason. See docs/DESIGN.md.`); process.exit(1) }
  console.log(`design:check: ${files.length} files, clean`)
}
