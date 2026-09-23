// The living sea, Home's window onto the water. A raw WebGL1 sum-of-sines sea whose tide-line IS
// completion. Day one: low sea, wide sky. Last drink: the tide meets the sun. Area-honest by construction.
// It is alive in one honest way: the sky follows the real clock (six palettes keyed off dayPart(),
// blended across the hour boundary so a live session never steps). The sky chip Home floats on it is
// the glass engine, not the shader (prototype C): it bends the canvas the way the tab bar bends the
// room. One live effect, hard-gated for battery. The CSS-gradient sea sits behind so it is never
// black; reduced-motion / no-GL show a correct still sea with the same sky.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
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

float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
}

// The water's height above the tide line, in canvas units. One long swell carries the ship, about one
// and a half crests across the hero and a tenth of its height from trough to crest; a shorter wave
// rides on it and a little chop keeps the line from reading as a drawn curve. swell() in the script
// below is this function term for term, which is how the liner rides the water the guest sees.
float swell(float x, float t){
  return 0.034*sin(x*9.0  - t*0.90)
       + 0.010*sin(x*17.0 + t*1.30 + 1.3)
       + 0.004*sin(x*41.0 - t*2.10);
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

  float surf = horizon + swell(uv.x, t);

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

void main(){
  vec2  px  = gl_FragCoord.xy;
  float asp = uRes.x / uRes.y;
  float t   = uReduced > 0.5 ? 8.0 : uTime;
  float horizon = mix(0.14, 0.80, uLevel);

  gl_FragColor = vec4(scene(px / uRes, horizon, t, asp), 1.0);
}`

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`

/** The shader's swell() in JS, term for term: the ship reads the water height at its stern and its
 *  bow off this, so it lifts on a crest and pitches down its face rather than bobbing on a clock of
 *  its own. Change one, change both. */
function swell(x: number, t: number): number {
  return 0.034 * Math.sin(x * 9.0 - t * 0.90)
    + 0.010 * Math.sin(x * 17.0 + t * 1.30 + 1.3)
    + 0.004 * Math.sin(x * 41.0 - t * 2.10)
}
/** how much of the water's slope the liner takes as pitch (the reason is beside ride()) */
const PITCH = 0.3

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src); gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn('sea shader:', gl.getShaderInfoLog(sh)); gl.deleteShader(sh); return null }
  return sh
}

// ── the sky, by the hour ────────────────────────────────────────────────────────────────────
// One table, read twice: as GLSL uniforms and as the --sea-* custom properties the CSS floor
// paints, so a phone without WebGL gets the same sky rather than a permanent mid-morning.

type RGB = [number, number, number]
interface Sky {
  top: RGB; hor: RGB; hi: RGB; lo: RGB; sun: RGB; band: RGB; hull: RGB
  sunY: number; sunR: number; sunI: number
  core: number; glow: number; bandI: number; glint: number
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
    sunY: 0.83, sunR: 0.14, sunI: 0.50, core: 0, glow: 0.09, bandI: 0.26, glint: 0.35,
  },
  // the sea the hero shipped with: the dawn-blue morning
  morning: {
    top: rgb('#609CCF'), hor: rgb('#BDD9DA'), hi: rgb('#28AAA3'), lo: rgb('#093755'),
    sun: rgb('#F6CE79'), band: rgb('#D8E6DE'), hull: rgb('#093755'),
    sunY: 0.82, sunR: 0.17, sunI: 0.58, core: 0, glow: 0.07, bandI: 0.00, glint: 0.40,
  },
  // higher, bluer, the light flat and white
  afternoon: {
    top: rgb('#3D7CC4'), hor: rgb('#A8CDE6'), hi: rgb('#1E9FB4'), lo: rgb('#0A3A62'),
    sun: rgb('#FFF2CC'), band: rgb('#C7DDEC'), hull: rgb('#0A3A62'),
    sunY: 0.81, sunR: 0.13, sunI: 0.46, core: 0, glow: 0.05, bandI: 0.00, glint: 0.34,
  },
  // amber along the horizon, the water warm under it
  golden: {
    top: rgb('#7F97C6'), hor: rgb('#F3C078'), hi: rgb('#2E9A96'), lo: rgb('#0C3550'),
    sun: rgb('#FFD48C'), band: rgb('#F6B45E'), hull: rgb('#0C3550'),
    sunY: 0.83, sunR: 0.17, sunI: 0.62, core: 0, glow: 0.11, bandI: 0.34, glint: 0.46,
  },
  // violet-grey overhead, one orange band left on the water's edge
  dusk: {
    top: rgb('#565578'), hor: rgb('#9A7E96'), hi: rgb('#1D6E80'), lo: rgb('#0A2A42'),
    sun: rgb('#F2A05E'), band: rgb('#E8834B'), hull: rgb('#3B5B78'),
    sunY: 0.83, sunR: 0.15, sunI: 0.22, core: 0, glow: 0.07, bandI: 0.44, glint: 0.22,
  },
  // deep navy, a paler horizon, a small hard moon where the sun was, the sea darker
  night: {
    top: rgb('#0E1E38'), hor: rgb('#40587A'), hi: rgb('#10465A'), lo: rgb('#041D2E'),
    sun: rgb('#E9EFF7'), band: rgb('#4A6183'), hull: rgb('#3B5B78'),
    // the moon sits at the height the five suns do, so a full passport meets it the same way
    sunY: 0.83, sunR: 0.05, sunI: 0.95, core: 0.66, glow: 0.07, bandI: 0.20, glint: 0.16,
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
  glint: mixN(a.glint, b.glint, t),
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

/** The skies bright enough to want ink on the chip rather than light type. Dawn and golden hour are
 *  light skies inside the dark rooms, so the chip follows the sky, not the room (C's is-lightsky).
 *  A dark sky only ever falls in the evening or night room, where --ink is light. */
const LIGHT_SKY: ReadonlySet<DayPart> = new Set<DayPart>(['dawn', 'morning', 'afternoon', 'golden'])

export interface SeaHeroProps {
  level: number
  /** the pinned hour (0..23), honoured only where `?hour=` pins it; otherwise the sky takes the
   *  clock itself, minute by minute. See dayPart() in state/stats.ts */
  hour?: number
  /** what floats on the water: Home's sky chip, a `.glass` that bends the canvas. `data-sky` on the
   *  window says whether the sky behind it is light or dark, and sea.css tunes the chip by it */
  children?: ReactNode
}

export function SeaHero({ level, hour, children }: SeaHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const shipRef = useRef<SVGSVGElement>(null)
  const targetRef = useRef(level)
  targetRef.current = level
  const hourRef = useRef(hour)
  hourRef.current = hour

  // Whether the hour is pinned is fixed for the life of the mount: a QA render never changes it and
  // a live session never acquires one.
  const [pin] = useState(pinnedHour)
  // The shader reads the clock every frame; the render path (the CSS floor, the hull, the chip's
  // sky) reads it here, so it needs its own tick or it freezes at the hour the screen was opened.
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
  const lightSky = LIGHT_SKY.has(dayPart(Math.floor(clock)))

  // The four-surface budget (DESIGN.md, Material): glass nobody can see drops its filters, as
  // prototype A's .hero-off does. The chip is inside the window, so the window leaving the screen,
  // or a sheet coming up over it, takes the chip out of the count; .glass-off on the window reaches it.
  const [offScreen, setOffScreen] = useState(false)
  const [sheetUp, setSheetUp] = useState(false)
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const io = new IntersectionObserver((e) => setOffScreen(!e[0].isIntersecting), { threshold: 0 })
    io.observe(wrap)
    const up = () => setSheetUp(true)
    const down = () => setSheetUp(false)
    window.addEventListener('sheet:open', up)
    window.addEventListener('sheet:closed', down)
    return () => {
      io.disconnect()
      window.removeEventListener('sheet:open', up)
      window.removeEventListener('sheet:closed', down)
    }
  }, [])

  useEffect(() => {
    const cv = canvasRef.current, wrap = wrapRef.current
    if (!cv || !wrap) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

    // No antialiasing: a full-screen triangle has no edges to smooth, so multisampling it was work
    // for nothing (the spec, on C's antialias at a dpr of 2)
    const gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
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
    gl.uniform1f(uReduced, reduced ? 1 : 0)

    let shown = targetRef.current
    let raf = 0, onScreen = true, running = false
    const t0 = performance.now()

    // The liner rides the swell. Its stern and bow, as fractions of the hero's width, are read from
    // its laid-out box (computed left and width, which a transform does not move) whenever the hero
    // is sized, and each frame sets its lift and pitch from the water at those two points. The CSS
    // bob in sea.css is the fallback where there is no shader, so it is switched off here.
    const ship = shipRef.current
    let stern = 0.6, bow = 0.8
    function measureShip() {
      if (!ship) return
      const cs = getComputedStyle(ship), w = wrap!.clientWidth
      const left = parseFloat(cs.left), width = parseFloat(cs.width)
      // the hull runs from 6 to 144 of the drawing's 150
      if (w > 0 && width > 0) { stern = (left + width * 0.04) / w; bow = (left + width * 0.96) / w }
    }
    function ride(t: number) {
      if (!ship) return
      const w = wrap!.clientWidth, h = wrap!.clientHeight
      const ys = swell(stern, t), yb = swell(bow, t)
      const lift = ((ys + yb) / 2) * h
      // A liner does not lie flat along the face of a swell: its length and its mass take the edge
      // off, so it pitches a third of the water's slope, at most about 5 degrees, while it lifts by
      // the full height (about 6px either way). Taken whole, the slope tipped it 16 degrees, which
      // reads as a ship foundering rather than riding.
      const pitch = PITCH * Math.atan2((yb - ys) * h, (bow - stern) * w) * 180 / Math.PI
      ship.style.transform = `translateY(-86%) translateY(${(-lift).toFixed(2)}px) rotate(${(-pitch).toFixed(2)}deg)`
    }
    if (ship) { ship.classList.add('is-riding'); measureShip() }

    function size() {
      // 1.5, not a phone's 3: a soft gradient sea drawn at 1.5 cannot be told from one at 3, and it
      // costs a quarter of the fragments (the spec's cap)
      const dpr = Math.min(devicePixelRatio || 1, 1.5)
      const w = Math.round(wrap!.clientWidth * dpr), h = Math.round(wrap!.clientHeight * dpr)
      if (cv!.width !== w || cv!.height !== h) { cv!.width = w; cv!.height = h; gl!.viewport(0, 0, w, h) }
      gl!.uniform2f(uRes, w, h)
    }

    function setSky() {
      const s = skyAt(effectiveHour(hourRef.current, pin))
      const c = (u: WebGLUniformLocation | null, v: RGB) => gl!.uniform3f(u, v[0] / 255, v[1] / 255, v[2] / 255)
      c(uSkyTop, s.top); c(uSkyHor, s.hor); c(uSeaHi, s.hi); c(uSeaLo, s.lo); c(uSunC, s.sun); c(uBandC, s.band)
      gl!.uniform4f(uSunP, 0.74, s.sunY, s.sunR, s.sunI)
      gl!.uniform4f(uSunQ, s.core, s.glow, s.bandI, s.glint)
    }

    function draw(now: number) {
      size(); setSky()
      const t = reduced ? 8 : (now - t0) / 1000
      ride(t)
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
    const onResize = () => { measureShip(); draw(performance.now()) }
    addEventListener('resize', onResize)
    // the still frame has no loop to pick the clock up, so it is redrawn once a minute
    const tick = setInterval(() => { if (!running && !document.hidden && onScreen) draw(performance.now()) }, 60000)

    draw(performance.now())
    start()

    return () => {
      stop(); io.disconnect(); clearInterval(tick)
      document.removeEventListener('visibilitychange', onVis)
      removeEventListener('resize', onResize)
      if (ship) { ship.classList.remove('is-riding'); ship.style.transform = '' }
      gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs); gl.deleteBuffer(buf)
      // The GPU context is freed on a real unmount only. SheetWave drops loseContext() outright
      // because a StrictMode remount re-getContext()s the same canvas and a lost context poisons
      // it; Home mounts and unmounts on every visit to the tab, so the context is worth releasing,
      // and the canvas still being in the document is what tells the two cases apart.
      setTimeout(() => { if (!cv.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext() }, 0)
    }
  }, [])

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
    <div
      className={'sea' + (offScreen || sheetUp ? ' glass-off' : '')}
      ref={wrapRef}
      style={seaVars}
      data-sky={lightSky ? 'light' : 'dark'}
    >
      <div className="sea-floor" style={cssStyle} aria-hidden />
      <canvas className="sea-canvas" ref={canvasRef} aria-hidden />
      {/* a liner riding the tide: its waterline is completion, so it rises as you sip through */}
      <svg className="sea-ship" ref={shipRef} style={{ top: `${waterTop}%` }} viewBox="0 0 150 52" preserveAspectRatio="xMidYMax meet" aria-hidden>
        <path className="ship-hull" d="M6 33 H144 L133 47 Q131 49 126 49 H24 Q19 49 17 47 Z" />
        <path className="ship-deck" d="M31 33 V24 H119 V33 Z M45 24 V17 H105 V24 Z M74 17 V12 H102 V17 Z" />
        <path className="ship-window" d="M39 27h4v3h-4z M49 27h4v3h-4z M59 27h4v3h-4z M69 27h4v3h-4z M79 27h4v3h-4z M89 27h4v3h-4z M99 27h4v3h-4z" />
        <path className="ship-funnel" d="M53 17 L56 5 H67 L70 17 Z" />
        <line className="ship-mast" x1="88" y1="12" x2="88" y2="3" />
      </svg>
      {children}
    </div>
  )
}
