// The signature wash: a WebGL wave of tinted Liquid Glass washes the sheet's content up onto a bare
// pane, then recedes to the clear glass. The overlay is per-pixel alpha (content shows through the
// tint), and a feDisplacementMap on the content gives the refraction that settles as the water drains.
// One-shot on open. Reduced-motion / no-WebGL fall back to content appearing at once (never breaks).
import { useEffect, useRef, useState } from 'react'

const DURATION = 2400 // ms — one wash-in + recede (the speed Charles settled on)

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
const FRAG = `
precision highp float;
uniform vec2  iRes;
uniform float iP;     // 0..1 progress
uniform float iTime;

const vec3 SEA      = vec3(0.24, 0.82, 0.78);
const vec3 SEA_DEEP = vec3(0.06, 0.46, 0.60);
const vec3 PANE     = vec3(0.984, 0.972, 0.945); // bare sheet before content is washed in

void main(){
  vec2 uv = gl_FragCoord.xy / iRes;
  float t = iTime;

  float up   = smoothstep(0.0,  0.44, iP);   // monotonic high-water mark (content deposited to here)
  float down = 1.0 - smoothstep(0.56, 1.0, iP);
  float tri  = min(up, down);                 // current water level (rises then recedes)

  float waves = 0.082*sin(uv.x*4.2 + t*1.6)
              + 0.030*sin(uv.x*7.5 - t*1.2)
              + 0.026*sin(uv.x*2.2 + t*0.7);
  float depositY = mix(-0.26, 1.26, up)  + waves;
  float crestY   = mix(-0.26, 1.26, tri) + waves;

  if (uv.y > depositY) { gl_FragColor = vec4(PANE, 1.0); return; }  // not yet washed in -> bare pane
  if (uv.y > crestY)   { gl_FragColor = vec4(0.0); return; }        // deposited, above water -> clear

  float depth = crestY - uv.y;
  float tint = 0.5 * smoothstep(0.0, 0.09, depth) * (1.0 - 0.4*smoothstep(0.10, 0.55, depth));
  vec3 seaCol = mix(SEA, SEA_DEEP, clamp(depth*1.5, 0.0, 1.0));
  float foam = smoothstep(0.016, 0.0, depth);
  float edge = smoothstep(0.026, 0.008, depth) * (1.0 - foam);

  vec3 col = mix(seaCol, vec3(1.0), foam);
  col += vec3(1.0) * edge * 0.2;
  float a = clamp(tint + foam*0.95 + edge*0.25, 0.0, 1.0); // content ghosts through the tint
  gl_FragColor = vec4(col, a);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null }
  return s
}

function smoothstep01(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function SheetWave() {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gone, setGone] = useState(reduce)

  useEffect(() => {
    if (reduce) return
    const cv = canvasRef.current
    const sheet = cv?.parentElement as HTMLElement | null
    if (!cv || !sheet) { setGone(true); return }
    const scroll = sheet.querySelector('.sheet-scroll') as HTMLElement | null
    const disp = document.getElementById('spcc-seawarp-disp')

    const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true })
    if (!gl) { setGone(true); return } // no WebGL -> content simply shows, no wave

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) { setGone(true); return }
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setGone(true); return }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'iRes')
    const uP = gl.getUniformLocation(prog, 'iP')
    const uTime = gl.getUniformLocation(prog, 'iTime')

    if (scroll) scroll.style.filter = 'url(#spcc-seawarp)' // refraction that settles (best-effort)

    const t0 = performance.now()
    const draw = (now: number) => {
      const t = (now - t0) / 1000
      const p = Math.min(t / (DURATION / 1000), 1)
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(sheet.clientWidth * dpr))
      const h = Math.max(1, Math.round(sheet.clientHeight * dpr))
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h }
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
      gl.uniform1f(uP, p)
      gl.uniform1f(uTime, t)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (disp) disp.setAttribute('scale', String(20 * (1 - smoothstep01(0.4, 1, p)))) // warp settles as water recedes
      return p
    }

    let raf = 0
    const loop = (now: number) => {
      if (draw(now) >= 1) { finish(); return }
      raf = requestAnimationFrame(loop)
    }
    const finish = () => {
      if (scroll) scroll.style.filter = ''
      setGone(true)
    }
    draw(performance.now())               // cover immediately, so there is no flash before the first frame
    raf = requestAnimationFrame(loop)
    // safety net: if rAF ever stalls (e.g. tab backgrounded at open), never leave the pane covering content
    const safety = window.setTimeout(finish, DURATION + 600)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(safety)
      if (scroll) scroll.style.filter = ''
      // no loseContext(): the canvas is reused across a StrictMode remount, and losing the context
      // poisons the live mount that re-getContext()s the same canvas. It is released on unmount.
    }
  }, [reduce])

  if (gone) return null
  return (
    <>
      <canvas ref={canvasRef} className="sheet-wave-gl" aria-hidden />
      <svg className="sheet-wave-defs" width="0" height="0" aria-hidden focusable="false">
        <filter id="spcc-seawarp" x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.022" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap id="spcc-seawarp-disp" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </>
  )
}
