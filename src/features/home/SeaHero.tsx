// The living sea — Home hero. A raw WebGL1 sum-of-sines sea whose tide-line IS completion.
// Day one: low sea, wide dawn sky. Last drink: the tide meets the sun. Area-honest by
// construction. One live effect, hard-gated for battery. CSS-gradient sea sits behind so it is
// never black; reduced-motion / no-GL show a correct still sea.
import { useEffect, useRef } from 'react'
import './sea.css'

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uLevel;   // 0..1 completion
uniform float uReduced; // 1.0 = hold a still frame

const vec3 SKY_TOP = vec3(1.00,0.914,0.827);
const vec3 SKY_HOR = vec3(1.00,0.827,0.690);
const vec3 SEA_HI  = vec3(0.435,0.863,0.769);
const vec3 SEA_LO  = vec3(0.090,0.376,0.478);
const vec3 SUN     = vec3(1.00,0.878,0.541);

float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
}

void main(){
  vec2  uv  = gl_FragCoord.xy / uRes;        // 0..1, y up
  float asp = uRes.x / uRes.y;
  float t   = uReduced > 0.5 ? 8.0 : uTime;

  float horizon = mix(0.14, 0.80, uLevel);
  vec2  sunP    = vec2(0.74, 0.82);

  vec3 col  = mix(SKY_HOR, SKY_TOP, smoothstep(horizon, 1.0, uv.y));
  float sun = smoothstep(0.17, 0.0, length((uv - sunP) * vec2(asp, 1.0)));
  col += SUN * sun * 0.9;
  // soft glow halo around the sun
  col += SUN * smoothstep(0.42, 0.0, length((uv - sunP) * vec2(asp, 1.0))) * 0.12;

  float surf = horizon
             + 0.012*sin(uv.x*22.0 + t*0.9)
             + 0.008*sin(uv.x*47.0 - t*1.3)
             + 0.006*(noise(vec2(uv.x*9.0, t*0.4)) - 0.5);

  if(uv.y < surf){
    vec3 water = mix(SEA_LO, SEA_HI, clamp((uv.y-(horizon-0.42))/0.42, 0.0, 1.0));
    water = mix(water, SEA_HI, smoothstep(0.05, 0.0, surf-uv.y));
    float glint = smoothstep(0.12,0.0,abs(uv.x-sunP.x))
                * smoothstep(0.10,0.0,surf-uv.y)
                * (0.35 + 0.65*noise(vec2(uv.x*70.0, t*2.2)));
    water += SUN * glint * 0.55;
    col = water;
  }
  // foam on the waterline
  col += vec3(1.0) * smoothstep(0.004, 0.0, abs(uv.y - surf)) * 0.4;

  gl_FragColor = vec4(col, 1.0);
}`

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src); gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); gl.deleteShader(sh); return null }
  return sh
}

export function SeaHero({ level }: { level: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef(level)
  targetRef.current = level

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
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.classList.add('sea-nogl'); return }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uLevel = gl.getUniformLocation(prog, 'uLevel')
    const uReduced = gl.getUniformLocation(prog, 'uReduced')
    gl.uniform1f(uReduced, reduced ? 1 : 0)

    let shown = targetRef.current
    let raf = 0, onScreen = true, running = false
    const t0 = performance.now()

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const w = Math.round(wrap!.clientWidth * dpr), h = Math.round(wrap!.clientHeight * dpr)
      if (cv!.width !== w || cv!.height !== h) { cv!.width = w; cv!.height = h; gl!.viewport(0, 0, w, h) }
      gl!.uniform2f(uRes, w, h)
    }

    function draw(now: number) {
      size()
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
    const onResize = () => draw(performance.now())
    addEventListener('resize', onResize)

    draw(performance.now())
    start()

    return () => {
      stop(); io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      removeEventListener('resize', onResize)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  // CSS-gradient sea as the floor (behind canvas). Waterline from completion.
  const horizon = 0.14 + 0.66 * Math.max(0, Math.min(1, level))
  const waterTop = (1 - horizon) * 100
  const cssStyle = {
    background:
      `linear-gradient(180deg, var(--sea-sky-top) 0%, var(--sea-sky-hor) ${waterTop - 2}%, ` +
      `var(--sea-hi) ${waterTop}%, var(--sea-lo) 100%)`,
  }

  return (
    <div className="sea" ref={wrapRef}>
      <div className="sea-floor" style={cssStyle} aria-hidden />
      <canvas className="sea-canvas" ref={canvasRef} aria-hidden />
    </div>
  )
}
