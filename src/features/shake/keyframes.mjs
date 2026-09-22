// Writes the shaker's computed keyframes into shake.css. Run it after changing SHAKER in Shaker.tsx
// or any table below:   node src/features/shake/keyframes.mjs
//
// Two kinds of keyframes come out of it, and both are here for the same reason: a hand-typed
// percentage of a 2340ms timeline is how a knock ends up 20ms off its sound.
//
//   the shake and the held beat, one timeline of popMs, written as a table in ms from the press with
//   the easing of the segment that leaves each row, so the tin and the cap cannot drift off the
//   rattle, whose knocks come from the same SHAKER.knocks;
//   the flights (the cap off, the glass out of the mouth and back), sampled from the motion itself
//   every 20ms and joined linearly, which is how a fall speeds up and a glass's size can follow where
//   its foot is. DESIGN.md Motion lists "linear between samples" as a written exception.
//
// Transforms are in the drawing's grid units (shown at 0.9 on screen), because the elements they
// move are SVG groups: a CSS px there is a user unit. Not imported by the app; node only.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))
const tsx = readFileSync(path.join(here, 'Shaker.tsx'), 'utf8')
const block = tsx.match(/export const SHAKER = \{([\s\S]*?)\n\}/)[1]
const num = (k) => Number(block.match(new RegExp(`${k}:\\s*(\\d+)`))[1])
const S = {
  shakeMs: num('shakeMs'), popMs: num('popMs'), landMs: num('landMs'), closeMs: num('closeMs'),
  knocks: block.match(/knocks:\s*\[([^\]]+)\]/)[1].split(',').map(Number),
}
if (S.shakeMs !== 1800) throw new Error('the stroke table below is drawn against a 1800ms shake')
const [K1, K2] = S.knocks
const POP = S.popMs

const r = (n, d = 2) => { const v = Math.round(n * 10 ** d) / 10 ** d; return Object.is(v, -0) ? 0 : v }
const pct = (ms, total) => `${r((ms / total) * 100)}%`
const EASE = { s: 'var(--e-shake)', o: 'var(--e-out)', l: 'linear' }

// ── the rig, from the press: [ms, x, y, degrees, easing of the segment leaving this row] ──
// The strokes, 0 to 1700, are travel up the tin's own axis and back, gentle, harder, violent, each on
// --e-shake so the tin turns at each end rather than jumping off it. 1700 to 1800 is the set-down,
// linear, because a tin put down hard does not slow before it meets the bar; the clack lands at 1800.
// Then one rebound of 2.8 (2.5 on screen), and the two knocks from inside, 3.4 then 5.6 (3 then 5).
const RIG = [
  [0, 0, 0, 0, 's'],
  [110, 0, 3, -3, 's'],
  [240, 5, -16, 8, 's'],
  [460, 1, -3, 3, 's'],
  [600, 9, -26, 13, 's'],
  [750, 1, -2, 6, 's'],
  [900, 10, -28, 14, 's'],
  [1050, 1, -2, 6, 's'],
  [1200, 11, -30, 15, 's'],
  [1300, 0, -1, 8, 's'],
  [1380, 14, -38, 19, 's'],
  [1460, -2, -1, 9, 's'],
  [1540, 15, -40, 20, 's'],
  [1620, 2, -2, 8, 's'],
  [1700, 14, -38, 19, 'l'],
  [1800, 0, 0, 0, 'o'],
  [1840, 0, -2.8, 0, 's'],
  [1890, 0, 0, 0, 'o'],
  [K1, 0, 0, 0, 'o'],
  [K1 + 25, 0, -3.4, 0, 'l'],
  [K1 + 60, 0, 0, 0, 'o'],
  [K2, 0, 0, 0, 'o'],
  [K2 + 18, 0, -5.6, 0, 'l'],
  [K2 + 50, 0, 0, 0, 'o'],
  [POP, 0, 0, 0, 'o'],
]

// ── the cap, from the press: [ms, y, degrees, easing] ──
// It lags the tin at the top of each stroke, lifting off the strainer and knocking back, more as the
// shake gets harder; it jumps once as the tin is set down. Then the pressure: it lifts off the neck
// on each knock, 7.8 (7 on screen), then 13.3 (12), the second quicker and held; then it is pressed
// down 1.8 (1.6) into the neck over 75ms, and the pop throws it from there.
const CAP = [
  [0, 0, 0, 'o'],
  [260, -1, 0, 'o'],
  [460, 0, 0, 'o'],
  [620, -2, 3, 'o'],
  [750, 0, 0, 'o'],
  [920, -2, -3, 'o'],
  [1050, 0, 0, 'o'],
  [1220, -2, 3, 'o'],
  [1300, 0, 0, 'o'],
  [1395, -3, -4, 'o'],
  [1460, 0, 0, 'o'],
  [1555, -3, 4, 'o'],
  [1620, 0, 0, 'o'],
  [1715, -3, -4, 'o'],
  [1800, 0, 0, 'o'],
  [1825, -2, 2, 'o'],
  [1860, 0, 0, 'o'],
  [K1 + 5, 0, 0, 'o'],
  [K1 + 55, -7.8, 2, 's'],
  [K1 + 110, 0, 0, 'o'],
  [K2 + 2, 0, 0, 'o'],
  [K2 + 35, -13.3, -2, 'o'],
  [K2 + 85, -12.4, 1, 'o'],
  [K2 + 135, -13, 0, 's'],
  [POP, 1.8, 0, 'o'],
]
if (CAP.some(([ms], i) => i && ms <= CAP[i - 1][0]) || RIG.some(([ms], i) => i && ms <= RIG[i - 1][0])) {
  throw new Error('a table is out of order: check SHAKER.knocks against the rows around them')
}

const table = (name, rows, fmt, def) => [
  `@keyframes ${name} {`,
  ...rows.map((row, i) => {
    const e = row[row.length - 1]
    const tf = i < rows.length - 1 && e !== def ? ` animation-timing-function: ${EASE[e]};` : ''
    return `  ${pct(row[0], POP)} { transform: ${fmt(row)};${tf} }`
  }),
  '}',
].join('\n')

// --e-out as a function of time, for the sampled flights: cubic-bezier(.22, .9, .32, 1)
const bezier = (x1, y1, x2, y2) => (t) => {
  const cx = (u) => 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u ** 2 * (1 - u) + u ** 3
  const cy = (u) => 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u ** 2 * (1 - u) + u ** 3
  let lo = 0, hi = 1
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (cx(m) < t) lo = m; else hi = m }
  return cy((lo + hi) / 2)
}
const eOut = bezier(0.22, 0.9, 0.32, 1)

const sampled = (name, ms, every, at) => {
  const lines = [`@keyframes ${name} {`]
  for (let t = 0; t <= ms + 0.001; t += every) {
    const last = t + every > ms + 0.001
    const tt = last ? ms : t
    lines.push(`  ${r((tt / ms) * 100)}% { ${at(tt)}${last ? '' : ' animation-timing-function: linear;'} }`)
    if (last) break
  }
  if (lines.length && !lines[lines.length - 1].startsWith('  100%')) lines.push(`  100% { ${at(ms)} }`)
  lines.push('}')
  return lines.join('\n')
}

// ── the cap off, from the pop: thrown up off the neck on --e-out to its apex in 70ms (80 above, 72 on
// screen, leaning 18 to the right so it is clear of the glass coming up behind it), then a fall on a
// parabola, running right and tumbling, fading from 60ms after the apex and gone by 180 after it,
// inside the 300 the spec allows. It starts from the press-down's 1.8, where the beat left it.
export const CAP_OFF = { rise: 70, fall: 190, apex: -80, drift: 18, run: 0.8, g: 0.006, fadeFrom: 60, fadeFor: 120 }
const capAt = (t) => {
  const { rise, apex, drift, run, g } = CAP_OFF
  let x, y, deg, o
  if (t <= rise) {
    const u = t / rise
    x = drift * u; y = 1.8 + (apex - 1.8) * eOut(u); deg = 25 * u; o = 1
  } else {
    const f = t - rise
    x = drift + run * f; y = apex + 0.5 * g * f * f; deg = 25 + f * 0.95
    o = f < CAP_OFF.fadeFrom ? 1 : Math.max(0, 1 - (f - CAP_OFF.fadeFrom) / CAP_OFF.fadeFor)
  }
  return `opacity: ${r(o)}; transform: translate(${r(x, 1)}px, ${r(y, 1)}px) rotate(${r(deg, 1)}deg);`
}

// ── the glass: its foot starts just under the neck at 0.6 of its size, which is the neck's width over
// the glass's, so it is never wider than the mouth while it is in it; it keeps that size until its
// foot reaches the neck (20 on the grid), grows to full size as it clears it, overshoots 8 past its
// hang at 62% of the landing and settles back onto it. The glass group's origin is the middle of its
// foot, at the hang (4), so the transform is how far the foot is below its hang and the scale.
const HANG = 4, NECK = 20, S0 = 0.6, BOX_H = 72
const D0 = NECK + 1 + BOX_H * S0 - HANG   // the box's top 1 under the neck line
const OVER = -8, PEAK = 0.62
// the glass starts 20ms behind the cap, so the cap is off the neck before the rim comes up under it;
// it still shows inside 40ms of the cap leaving, because its first frames are its fastest
export const GLASS_LAG = 20
const scaleAt = (dy) => {
  const foot = HANG + dy
  if (foot >= NECK) return S0
  if (foot <= 8) return 1
  const u = (NECK - foot) / (NECK - 8)
  return S0 + (1 - S0) * u * u * (3 - 2 * u)
}
const glassAt = (dy) => `transform: translate(0, ${r(dy, 1)}px) scale(${r(scaleAt(dy), 3)});`
const RISE = S.landMs - GLASS_LAG
const riseDy = (t) => {
  const u = t / RISE
  return u <= PEAK ? D0 + (OVER - D0) * eOut(u / PEAK) : OVER + (0 - OVER) * eOut((u - PEAK) / (1 - PEAK))
}
// the sink before a second shake: the same path backwards, off the hang and into the mouth in 180
export const SINK = 180
const sinkDy = (t) => D0 * eOut(t / SINK)

// The cap must clear the glass coming up behind it: at every 5ms of the flight, the gap between the
// cap's turned box and the part of the glass's box that is out of the mouth, while the cap shows.
const GLASS_HALF = 29, RIM = 6
let tightest = Infinity
for (let t = 0; t <= CAP_OFF.rise + CAP_OFF.fall; t += 5) {
  const m = capAt(t).match(/opacity: ([\d.]+); transform: translate\(([-\d.]+)px, ([-\d.]+)px\) rotate\(([-\d.]+)deg\)/)
  if (Number(m[1]) < 0.35) continue
  const cx = 44 + Number(m[2]), cy = 11 + Number(m[3]), a = (Number(m[4]) * Math.PI) / 180
  const hw = 17 * Math.abs(Math.cos(a)) + 9 * Math.abs(Math.sin(a)), hh = 17 * Math.abs(Math.sin(a)) + 9 * Math.abs(Math.cos(a))
  const tg = t - GLASS_LAG, dy = tg < 0 ? D0 : tg <= RISE ? riseDy(tg) : 0, sc = scaleAt(dy), foot = HANG + dy
  const gy0 = foot - (BOX_H - RIM) * sc, gy1 = Math.min(foot, NECK)
  if (gy0 >= NECK) continue
  const gapX = Math.abs(cx - 44) - hw - GLASS_HALF * sc
  const gapY = Math.max(gy0 - (cy + hh), (cy - hh) - gy1)
  tightest = Math.min(tightest, Math.max(gapX, gapY))
}
if (tightest < 0) console.warn(`WARNING: the cap passes through the glass (by ${r(-tightest, 1)} on the grid)`)
else console.log(`the cap clears the glass by ${r(tightest, 1)} at its closest`)

const out = [
  '/* ── computed: node src/features/shake/keyframes.mjs writes everything from here to the end marker,',
  '   from SHAKER in Shaker.tsx and the tables in that script. Edit there, not here. ── */',
  table('shaker-shake', RIG, ([, x, y, d]) => `translate(${x}px, ${y}px) rotate(${d}deg)`, 's'),
  table('shaker-beat', CAP, ([, y, d]) => `translateY(${y}px) rotate(${d}deg)`, 'o'),
  sampled('shaker-cap-off', CAP_OFF.rise + CAP_OFF.fall, 20, capAt),
  sampled('shaker-glass-rise', RISE, 20, (t) => glassAt(riseDy(t))),
  sampled('shaker-glass-sink', SINK, 20, (t) => glassAt(sinkDy(t))),
  '/* ── end of computed keyframes ── */',
].join('\n')

const cssFile = path.join(here, 'shake.css')
const css = readFileSync(cssFile, 'utf8')
const start = css.indexOf('/* ── computed:')
const endMark = '/* ── end of computed keyframes ── */'
const end = css.indexOf(endMark)
if (start < 0 || end < 0) throw new Error('shake.css has no computed block to replace')
writeFileSync(cssFile, css.slice(0, start) + out + css.slice(end + endMark.length))
console.log(`shake.css: computed keyframes written for popMs ${POP}, landMs ${S.landMs}, knocks ${S.knocks.join(', ')}`)
console.log(`cap off ${CAP_OFF.rise + CAP_OFF.fall}ms, glass rises from ${r(D0, 1)} below its hang at ${S0}`)
