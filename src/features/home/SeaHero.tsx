// The living sea, Home's hero. A raw WebGL1 sum-of-sines sea whose tide-line IS completion.
// Day one: low sea, wide sky. Last drink: the tide meets the sun. Area-honest by construction.
// It is alive in two honest ways and no others: the sky follows the real clock (six palettes keyed
// off dayPart(), blended across the hour boundary so a live session never steps), and the two
// chips floating on it are refractive glass (the shader lenses the water inside their rectangles;
// the text stays HTML). One live effect, hard-gated for battery. The CSS-gradient sea sits behind
// so it is never black; reduced-motion / no-GL show a correct still sea with the same sky.
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { dayPart, type DayPart } from '../../state/stats'
import './sea.css'

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uLevel;   // 0..1 completion
uniform float uReduced; // 1.0 = hold a still frame

// the sky, by the hour. JS blends the six palettes and hands the result down; the GLSL holds no
// palette of its own, so the shader and the CSS fallback cannot drift apart.
uniform vec3  uSkyTop, uSkyHor, uSeaHi, uSeaLo, uSunC, uBandC;
uniform vec4  uSunP;    // x, y, radius, intensity  (a small hard disc at night: the moon)
uniform vec4  uSunQ;    // core (edge hardness), glow, horizon band, glint

// the two DOM chips, in device pixels with y up: the water inside them is lensed and filmed
uniform vec4  uChipA, uChipB;   // x, y, w, h
uniform vec4  uChipG;           // radius, lens width, displacement, dpr
uniform float uFilm;            // the white film the glass lays over the water it bends

float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
}

vec3 scene(vec2 uv, float horizon, float t, float asp){
  vec2  sunP = vec2(uSunP.x, uSunP.y);
  float ds   = length((uv - sunP) * vec2(asp, 1.0));

  vec3 col = mix(uSkyHor, uSkyTop, smoothstep(horizon, 1.0, uv.y));
  // the warm band hugging the horizon. Golden hour and dusk do their work here rather than by
  // dropping the sun, so the sun keeps its height and the tide still meets it at a full passport.
  col = mix(col, uBandC, uSunQ.z * smoothstep(horizon + 0.30, horizon, uv.y));
  col += uSunC * smoothstep(uSunP.z, uSunP.z * uSunQ.x, ds) * uSunP.w;
  col += uSunC * smoothstep(uSunP.z * 2.5, 0.0, ds) * uSunQ.y;

  float surf = horizon
             + 0.012*sin(uv.x*22.0 + t*0.9)
             + 0.008*sin(uv.x*47.0 - t*1.3)
             + 0.006*(noise(vec2(uv.x*9.0, t*0.4)) - 0.5);

  if(uv.y < surf){
    vec3 water = mix(uSeaLo, uSeaHi, clamp((uv.y-(horizon-0.42))/0.42, 0.0, 1.0));
    water = mix(water, uSeaHi, smoothstep(0.05, 0.0, surf-uv.y));
    float glint = smoothstep(0.12,0.0,abs(uv.x-sunP.x))
                * smoothstep(0.10,0.0,surf-uv.y)
                * (0.35 + 0.65*noise(vec2(uv.x*70.0, t*2.2)));
    water += uSunC * glint * uSunQ.w;
    col = water;
  }
  // foam on the waterline
  col += vec3(1.0) * smoothstep(0.004, 0.0, abs(uv.y - surf)) * 0.3;
  return col;
}

float sdRR(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, vec2(0.0))) - r;
}

// One chip: the water inside its rounded rectangle, bent at the edge, filmed white, lit from
// above. No text is drawn here: the readout and the countdown are HTML on top.
vec3 chip(vec3 col, vec2 px, vec4 c, float horizon, float t, float asp){
  if(c.z < 2.0) return col;                       // no rect yet
  vec2  hb  = c.zw * 0.5;
  vec2  p   = px - (c.xy + hb);
  float r   = min(uChipG.x, min(hb.x, hb.y));
  float d   = sdRR(p, hb, r);                     // <0 inside
  float dpr = uChipG.w;

  // a 1px rim of darker water just outside: the edge the eye reads as thickness
  col = mix(col, col * 0.80, smoothstep(dpr * 1.6, 0.0, d) * step(0.0, d));

  float inside = 1.0 - smoothstep(-dpr * 0.5, dpr * 0.5, d);
  if(inside < 0.002) return col;

  // the lens: displacement along the rect's own normal, strongest at the edge, nothing in the
  // middle, a few pixels of magnitude
  float e = clamp(-d / uChipG.y, 0.0, 1.0);
  float k = (1.0 - e) * (1.0 - e);
  vec2  g = vec2(sdRR(p + vec2(1.0, 0.0), hb, r) - sdRR(p - vec2(1.0, 0.0), hb, r),
                 sdRR(p + vec2(0.0, 1.0), hb, r) - sdRR(p - vec2(0.0, 1.0), hb, r));
  float gm = length(g);
  vec2  n  = gm > 0.0001 ? g / gm : vec2(0.0, 1.0);

  vec3 base = scene((px + n * k * uChipG.z) / uRes, horizon, t, asp);
  base = mix(base, vec3(1.0), uFilm);
  // one light, from above: a specular line inside the top edge, a faint one along the foot
  float line = smoothstep(dpr * 1.6, 0.0, abs(d + dpr));
  base += vec3(1.0) * line * (max(n.y, 0.0) * 0.55 + max(-n.y, 0.0) * 0.16);

  return mix(col, base, inside);
}

void main(){
  vec2  px  = gl_FragCoord.xy;
  float asp = uRes.x / uRes.y;
  float t   = uReduced > 0.5 ? 8.0 : uTime;
  float horizon = mix(0.14, 0.80, uLevel);

  vec3 col = scene(px / uRes, horizon, t, asp);
  col = chip(col, px, uChipA, horizon, t, asp);
  col = chip(col, px, uChipB, horizon, t, asp);
  gl_FragColor = vec4(col, 1.0);
}`

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src); gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn('sea shader:', gl.getShaderInfoLog(sh)); gl.deleteShader(sh); return null }
  return sh
}

// ── the sky, by the hour ────────────────────────────────────────────────────────────────────
// One table, read twice: as GLSL uniforms and as the --sea-* custom properties the CSS floor
// paints, so a phone without WebGL gets the same sky rather than a permanent mid-morning.
// Every palette is chosen to sit under --ink text on a white-filmed chip; `film` is how much of
// that film the shader lays down and rises as the water darkens (contrast is bought with film).

type RGB = [number, number, number]
interface Sky {
  top: RGB; hor: RGB; hi: RGB; lo: RGB; sun: RGB; band: RGB; hull: RGB
  sunY: number; sunR: number; sunI: number
  core: number; glow: number; bandI: number; glint: number; film: number
}
const rgb = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16),
]
const hex = (c: RGB) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

const SKY: Record<DayPart, Sky> = {
  // pale rose overhead, a gold horizon, the sun just up
  dawn: {
    top: rgb('#B49CC0'), hor: rgb('#F6C9A2'), hi: rgb('#3E8FA0'), lo: rgb('#123A52'),
    sun: rgb('#FFD9A8'), band: rgb('#F3B98C'), hull: rgb('#123A52'),
    sunY: 0.83, sunR: 0.14, sunI: 0.50, core: 0, glow: 0.09, bandI: 0.26, glint: 0.35, film: 0.30,
  },
  // the sea the hero shipped with: the dawn-blue morning
  morning: {
    top: rgb('#609CCF'), hor: rgb('#BDD9DA'), hi: rgb('#28AAA3'), lo: rgb('#093755'),
    sun: rgb('#F6CE79'), band: rgb('#D8E6DE'), hull: rgb('#093755'),
    sunY: 0.82, sunR: 0.17, sunI: 0.58, core: 0, glow: 0.07, bandI: 0.00, glint: 0.40, film: 0.26,
  },
  // higher, bluer, the light flat and white
  afternoon: {
    top: rgb('#3D7CC4'), hor: rgb('#A8CDE6'), hi: rgb('#1E9FB4'), lo: rgb('#0A3A62'),
    sun: rgb('#FFF2CC'), band: rgb('#C7DDEC'), hull: rgb('#0A3A62'),
    sunY: 0.81, sunR: 0.13, sunI: 0.46, core: 0, glow: 0.05, bandI: 0.00, glint: 0.34, film: 0.24,
  },
  // amber along the horizon, the water warm under it
  golden: {
    top: rgb('#7F97C6'), hor: rgb('#F3C078'), hi: rgb('#2E9A96'), lo: rgb('#0C3550'),
    sun: rgb('#FFD48C'), band: rgb('#F6B45E'), hull: rgb('#0C3550'),
    sunY: 0.83, sunR: 0.17, sunI: 0.62, core: 0, glow: 0.11, bandI: 0.34, glint: 0.46, film: 0.30,
  },
  // violet-grey overhead, one orange band left on the water's edge
  dusk: {
    top: rgb('#565578'), hor: rgb('#9A7E96'), hi: rgb('#1D6E80'), lo: rgb('#0A2A42'),
    sun: rgb('#F2A05E'), band: rgb('#E8834B'), hull: rgb('#3B5B78'),
    sunY: 0.83, sunR: 0.15, sunI: 0.22, core: 0, glow: 0.07, bandI: 0.44, glint: 0.22, film: 0.42,
  },
  // deep navy, a paler horizon, a small hard moon where the sun was, the sea darker
  night: {
    top: rgb('#0E1E38'), hor: rgb('#40587A'), hi: rgb('#10465A'), lo: rgb('#041D2E'),
    sun: rgb('#E9EFF7'), band: rgb('#4A6183'), hull: rgb('#3B5B78'),
    // the moon sits at the height the five suns do, so a full passport meets it the same way; the
    // countdown chip crosses its glow at night exactly as it crosses the sun by day
    sunY: 0.83, sunR: 0.05, sunI: 0.95, core: 0.66, glow: 0.07, bandI: 0.20, glint: 0.16, film: 0.55,
  },
}

// the six boundaries dayPart() draws. The palette cross-fades across half an hour either side of
// one, so a session that runs through 19:00 sees dusk arrive rather than switch.
const EDGES = [5, 7, 12, 17, 19, 21]
const mixN = (a: number, b: number, t: number) => a + (b - a) * t
const mixC = (a: RGB, b: RGB, t: number): RGB => [mixN(a[0], b[0], t), mixN(a[1], b[1], t), mixN(a[2], b[2], t)]
const mixSky = (a: Sky, b: Sky, t: number): Sky => ({
  top: mixC(a.top, b.top, t), hor: mixC(a.hor, b.hor, t), hi: mixC(a.hi, b.hi, t),
  lo: mixC(a.lo, b.lo, t), sun: mixC(a.sun, b.sun, t), band: mixC(a.band, b.band, t),
  hull: mixC(a.hull, b.hull, t),
  sunY: mixN(a.sunY, b.sunY, t), sunR: mixN(a.sunR, b.sunR, t), sunI: mixN(a.sunI, b.sunI, t),
  core: mixN(a.core, b.core, t), glow: mixN(a.glow, b.glow, t), bandI: mixN(a.bandI, b.bandI, t),
  glint: mixN(a.glint, b.glint, t), film: mixN(a.film, b.film, t),
})

/** The sky at an hour, fractional hours included. */
export function skyAt(hour: number): Sky {
  const h = ((hour % 24) + 24) % 24
  for (const e of EDGES) {
    const d = h - e
    if (d > -0.5 && d < 0.5) {
      const t = d + 0.5
      return mixSky(SKY[dayPart(e - 1)], SKY[dayPart(e)], t * t * (3 - 2 * t))
    }
  }
  return SKY[dayPart(h)]
}

/** `?hour=N` (QA), or null when the sky is to follow the real clock. The sea reads the query itself
 *  rather than trusting the `hour` prop because it has to tell a pinned hour from a stale one: Home
 *  reads the clock once at mount and never ticks, and a session opened at 20:00 is still open at
 *  23:59. `nowHour()` cannot tell the two apart, so the test is on the query string. */
function pinnedHour(): number | null {
  if (typeof location === 'undefined') return null
  const raw = new URLSearchParams(location.search).get('hour')
  if (raw === null || !/^\d{1,2}$/.test(raw)) return null
  const n = Number(raw)
  return n <= 23 ? n : null
}

/** The hour the sky follows. A pinned hour stays exactly where it was put (the prop is that pin,
 *  Home having read it from the same query); otherwise the sky takes the clock itself, minutes
 *  included, so the cross-fade above has something to fade across and no read goes stale. */
function effectiveHour(prop: number | undefined, pin: number | null): number {
  if (pin !== null) return prop ?? pin
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}

/** The two chips floating on the sea. Home passes their refs; until it does they are found beside
 *  the hero, because SeaHero has to know their rectangles either way. */
function chipEls(wrap: HTMLElement, refs?: RefObject<HTMLElement | null>[]): HTMLElement[] {
  const given = (refs || []).map((r) => r.current).filter(Boolean) as HTMLElement[]
  if (given.length) return given
  return Array.from((wrap.parentElement || wrap).querySelectorAll<HTMLElement>('.sea-readout, .sea-count'))
}

export interface SeaHeroProps {
  level: number
  /** the pinned hour (0..23), honoured only where `?hour=` pins it; otherwise the sky takes the
   *  clock itself, minute by minute. See dayPart() in state/stats.ts */
  hour?: number
  /** the DOM chips floating on the sea (readout, countdown): the shader lenses the water under
   *  their rectangles; the chips themselves stay HTML so the CSS-glass fallback holds */
  chips?: RefObject<HTMLElement | null>[]
}

export function SeaHero({ level, hour, chips }: SeaHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef(level)
  targetRef.current = level
  const hourRef = useRef(hour)
  hourRef.current = hour
  const chipsRef = useRef(chips)
  chipsRef.current = chips

  // Whether the hour is pinned is fixed for the life of the mount: a QA render never changes it and
  // a live session never acquires one.
  const [pin] = useState(pinnedHour)
  // The shader reads the clock every frame; the render path (the CSS floor, the hull, the chips'
  // film) reads it here, so it needs its own tick or it freezes at the hour the screen was opened.
  // A minute is as coarse as the half-hour cross-fade can be drawn with, it does nothing while the
  // tab is hidden, and it catches up on the way back, so it is a clock rather than an animation.
  const [clock, setClock] = useState(() => effectiveHour(hour, pin))
  useEffect(() => {
    const read = () => { if (!document.hidden) setClock(effectiveHour(hourRef.current, pin)) }
    read()
    const id = setInterval(read, 60000)
    document.addEventListener('visibilitychange', read)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', read) }
  }, [pin, hour])

  const sky = skyAt(clock)
  // Dusk and night put a sky behind the countdown darker than the ground its 46% film was measured
  // against. Where WebGL is live the shader's own film carries it; where it is not, the same number
  // is published to the chip as a percentage and sea.css mixes the film up to the sheet's by it. It
  // is a percentage rather than a class so the film follows the sky continuously: a step would be
  // visible as the palette crosses into night.
  const filmPct = Math.round(Math.min(1, Math.max(0, (sky.film - 0.26) / 0.29)) * 100) + '%'

  useEffect(() => {
    const cv = canvasRef.current, wrap = wrapRef.current
    if (!cv || !wrap) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

    const gl = cv.getContext('webgl', { alpha: false, antialias: true, depth: false, stencil: false, powerPreference: 'low-power' })
    if (!gl) { cv.classList.add('sea-nogl'); return } // CSS sea shows through

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) { cv.classList.add('sea-nogl'); return }
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('sea:', gl.getProgramInfoLog(prog)); cv.classList.add('sea-nogl'); return }
    cv.classList.remove('sea-nogl')
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const U = (n: string) => gl.getUniformLocation(prog, n)
    const uRes = U('uRes'), uTime = U('uTime'), uLevel = U('uLevel'), uReduced = U('uReduced')
    const uSkyTop = U('uSkyTop'), uSkyHor = U('uSkyHor'), uSeaHi = U('uSeaHi'), uSeaLo = U('uSeaLo')
    const uSunC = U('uSunC'), uBandC = U('uBandC'), uSunP = U('uSunP'), uSunQ = U('uSunQ')
    const uChipA = U('uChipA'), uChipB = U('uChipB'), uChipG = U('uChipG'), uFilm = U('uFilm')
    gl.uniform1f(uReduced, reduced ? 1 : 0)

    // The program links, so the lens is live and the DOM chips turn their own film down: the
    // shader lays one of its own inside the same rectangles. The class goes on each chip rather
    // than on the hero because the chips are the hero's siblings, not its children, and that is
    // where sea.css has to reach.
    let els: HTMLElement[] = []
    // the chips' own corner radius (--r-control), read off the rendered element rather than
    // repeated as a number here, so the lens cannot come loose from the box it sits inside. The
    // read happens when the chips are found, which is before the first draw, so there is no
    // number to fall back to.
    let chipR = 0
    function readRadius() {
      const v = els[0] ? parseFloat(getComputedStyle(els[0]).borderTopLeftRadius) : NaN
      if (v > 0) chipR = v
    }
    function findChips(): HTMLElement[] {
      const found = chipEls(wrap!, chipsRef.current)
      found.forEach((el) => { el.classList.add('sea-gl'); ro.observe(el) })
      return found
    }

    let shown = targetRef.current
    let raf = 0, onScreen = true, running = false, dpr = 1
    const t0 = performance.now()

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2)
      const w = Math.round(wrap!.clientWidth * dpr), h = Math.round(wrap!.clientHeight * dpr)
      if (cv!.width !== w || cv!.height !== h) { cv!.width = w; cv!.height = h; gl!.viewport(0, 0, w, h) }
      gl!.uniform2f(uRes, w, h)
    }

    // the chip rectangles, CSS px off the DOM, multiplied by the dpr the canvas is sized with and
    // flipped into GL space (y up from the foot of the canvas)
    function setChips() {
      if (!els.length) { els = findChips(); readRadius() }
      const base = wrap!.getBoundingClientRect()
      const slots = [uChipA, uChipB]
      for (let i = 0; i < 2; i++) {
        const el = els[i]
        if (!el) { gl!.uniform4f(slots[i], 0, 0, 0, 0); continue }
        const r = el.getBoundingClientRect()
        const w = r.width * dpr, h = r.height * dpr
        gl!.uniform4f(slots[i], (r.left - base.left) * dpr, cv!.height - (r.top - base.top) * dpr - h, w, h)
      }
      // the chips' own radius, a 10px lens, 6px of displacement
      gl!.uniform4f(uChipG, chipR * dpr, 10 * dpr, 6 * dpr, dpr)
    }

    function setSky() {
      const s = skyAt(effectiveHour(hourRef.current, pin))
      const c = (u: WebGLUniformLocation | null, v: RGB) => gl!.uniform3f(u, v[0] / 255, v[1] / 255, v[2] / 255)
      c(uSkyTop, s.top); c(uSkyHor, s.hor); c(uSeaHi, s.hi); c(uSeaLo, s.lo); c(uSunC, s.sun); c(uBandC, s.band)
      gl!.uniform4f(uSunP, 0.74, s.sunY, s.sunR, s.sunI)
      gl!.uniform4f(uSunQ, s.core, s.glow, s.bandI, s.glint)
      gl!.uniform1f(uFilm, s.film)
    }

    function draw(now: number) {
      size(); setSky(); setChips()
      gl!.uniform1f(uTime, (now - t0) / 1000)
      gl!.uniform1f(uLevel, shown)
      gl!.drawArrays(gl!.TRIANGLES, 0, 3)
    }

    function frame(now: number) {
      const target = targetRef.current
      shown += (target - shown) * 0.06
      if (Math.abs(target - shown) < 0.0002) shown = target
      draw(now)
      const moving = !reduced && Math.abs(target - shown) > 0.0006
      // keep a gentle idle swell alive while visible; stop entirely when hidden/reduced
      if (!reduced && onScreen && !document.hidden) { raf = requestAnimationFrame(frame) }
      else { running = false; if (moving) { /* settle even when reduced */ shown = target; draw(now) } }
    }

    function start() {
      if (running || reduced || document.hidden || !onScreen) { if (reduced || document.hidden || !onScreen) draw(performance.now()); return }
      running = true; raf = requestAnimationFrame(frame)
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; running = false }

    const io = new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; onScreen ? start() : stop() }, { threshold: 0.01 })
    io.observe(cv)
    const onVis = () => { document.hidden ? stop() : start() }
    document.addEventListener('visibilitychange', onVis)
    const onResize = () => { readRadius(); draw(performance.now()) }
    addEventListener('resize', onResize)
    // the chips change width as the count-up runs and as the countdown copy changes
    // width only: the count-up changes it many times a second and a radius does not move with it
    const ro = new ResizeObserver(() => { if (!running) draw(performance.now()) })
    // the still frame has no loop to pick the clock up, so it is redrawn once a minute
    const tick = setInterval(() => { if (!running && !document.hidden && onScreen) draw(performance.now()) }, 60000)

    draw(performance.now())
    start()

    return () => {
      stop(); io.disconnect(); ro.disconnect(); clearInterval(tick)
      document.removeEventListener('visibilitychange', onVis)
      removeEventListener('resize', onResize)
      els.forEach((el) => el.classList.remove('sea-gl'))
      gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs); gl.deleteBuffer(buf)
      // The GPU context is freed on a real unmount only. SheetWave drops loseContext() outright
      // because a StrictMode remount re-getContext()s the same canvas and a lost context poisons
      // it; Home mounts and unmounts on every visit to the tab, so the context is worth releasing,
      // and the canvas still being in the document is what tells the two cases apart.
      setTimeout(() => { if (!cv.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext() }, 0)
    }
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const els = chipEls(wrap, chipsRef.current)
    els.forEach((el) => el.style.setProperty('--sea-film', filmPct))
    return () => els.forEach((el) => el.style.removeProperty('--sea-film'))
  }, [filmPct])

  // CSS-gradient sea as the floor (behind canvas). Waterline from completion, sky from the same
  // table the shader reads, so no-WebGL gets breakfast at breakfast and midnight at midnight.
  const horizon = 0.14 + 0.66 * Math.max(0, Math.min(1, level))
  const waterTop = (1 - horizon) * 100
  const seaVars = {
    '--sea-sky-top': hex(sky.top), '--sea-sky-hor': hex(sky.hor),
    '--sea-hi': hex(sky.hi), '--sea-lo': hex(sky.lo),
    '--sea-sun': hex(sky.sun), '--sea-hull': hex(sky.hull),
  } as CSSProperties
  const cssStyle = {
    background:
      `linear-gradient(180deg, var(--sea-sky-top) 0%, var(--sea-sky-hor) ${waterTop - 2}%, ` +
      `var(--sea-hi) ${waterTop}%, var(--sea-lo) 100%)`,
  }

  return (
    <div className="sea" ref={wrapRef} style={seaVars}>
      <div className="sea-floor" style={cssStyle} aria-hidden />
      <canvas className="sea-canvas" ref={canvasRef} aria-hidden />
      {/* a liner riding the tide: its waterline is completion, so it rises as you sip through */}
      <svg className="sea-ship" style={{ top: `${waterTop}%` }} viewBox="0 0 150 52" preserveAspectRatio="xMidYMax meet" aria-hidden>
        <path className="ship-hull" d="M6 33 H144 L133 47 Q131 49 126 49 H24 Q19 49 17 47 Z" />
        <path className="ship-deck" d="M31 33 V24 H119 V33 Z M45 24 V17 H105 V24 Z M74 17 V12 H102 V17 Z" />
        <path className="ship-window" d="M39 27h4v3h-4z M49 27h4v3h-4z M59 27h4v3h-4z M69 27h4v3h-4z M79 27h4v3h-4z M89 27h4v3h-4z M99 27h4v3h-4z" />
        <path className="ship-funnel" d="M53 17 L56 5 H67 L70 17 Z" />
        <line className="ship-mast" x1="88" y1="12" x2="88" y2="3" />
      </svg>
    </div>
  )
}
