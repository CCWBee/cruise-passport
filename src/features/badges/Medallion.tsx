import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import type { BadgeDef } from '../../data/badges'
import { svgEmblemShape } from './emblems'

interface MedallionProps {
  badge: BadgeDef
  earned: boolean
}

interface Tone {
  metal: string
  inlay: string
}

const WEBGL_UNAVAILABLE = new Promise<never>(() => undefined)
let webGLSupported: boolean | undefined

function canUseWebGL() {
  if (webGLSupported !== undefined) return webGLSupported
  if (typeof document === 'undefined') return false

  try {
    const probe = document.createElement('canvas')
    const context = probe.getContext('webgl2') ?? probe.getContext('webgl')
    webGLSupported = context !== null
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webGLSupported = false
  }

  return webGLSupported
}

// One shading texture for every coin: white where the surface faces the guest, darkening softly at
// the turn of the rim. It carries no colour of its own — the metal is the material's tint, read off
// the CSS — so the coin in the sheet is the same metal as the disc in the grid. No specular, no
// second hue: the old matcaps held fourteen hand-picked hexes and rendered a different object.
function makeShadeMatcap() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas2D is unavailable')

  context.fillStyle = '#FFFFFF'
  context.beginPath()
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  context.fill()

  // the ramp starts well out, so the face of the coin samples pure white and shows exactly the
  // metal the flat disc shows; only the turn of the rim darkens
  const shade = context.createRadialGradient(size / 2, size / 2, size * 0.31, size / 2, size / 2, size / 2)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.28)')
  context.globalCompositeOperation = 'source-atop'
  context.fillStyle = shade
  context.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

// The coin's two colours come from the page, not from this file: a hidden probe per custom property,
// rasterised through a 1px canvas so a `color-mix()` or a translucent ink resolves exactly as it
// does on the flat disc (the emblem is composited over the metal, the metal over the panel).
function readTone(metal: HTMLElement, emblem: HTMLElement, ground: HTMLElement): Tone | null {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  const paint = (element: HTMLElement) => {
    context.fillStyle = getComputedStyle(element).color
    context.fillRect(0, 0, 1, 1)
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data
    return `rgb(${r}, ${g}, ${b})`
  }

  paint(ground)
  const metalColor = paint(metal)
  const inlayColor = paint(emblem)
  return { metal: metalColor, inlay: inlayColor }
}

// A SOLID coin: top surface -> a short vertical rim band -> mirrored bottom surface, closed at both
// centres. (The old build was two single-sided domes meeting at a knife edge — hollow, so at an angle
// you saw straight into the culled interior.) The profile is reversed so the lathe winds its normals
// OUTWARD; without that the exterior faces are back-faces and get culled (the coin reads inside-out).
function makeDiscGeometry() {
  const e = 0.1
  const top = [
    new THREE.Vector2(0.0, e * 0.55),
    new THREE.Vector2(0.62, e * 0.62),
    new THREE.Vector2(0.8, e * 0.7),
    new THREE.Vector2(0.88, e * 0.92),
    new THREE.Vector2(0.94, e * 0.8),
    new THREE.Vector2(0.985, e * 0.55),
    new THREE.Vector2(1.0, e * 0.3), // rim top
  ]
  const profile: THREE.Vector2[] = [
    ...top,
    new THREE.Vector2(1.0, -e * 0.3), // rim bottom (short vertical edge band)
    ...top.slice(0, -1).reverse().map((p) => new THREE.Vector2(p.x, -p.y)),
  ]
  profile.reverse()
  const geometry = new THREE.LatheGeometry(profile, 72)
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

function makeEmblemGeometry(id: string) {
  let hash = 0
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  const points = 5 + (hash % 3)
  const shape = new THREE.Shape()

  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? 0.48 : 0.22
    const angle = -Math.PI / 2 + (index * Math.PI) / points
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()

  const geometry = new THREE.ShapeGeometry(shape) // flat plate — inlaid, not a raised relief
  geometry.center()
  return geometry
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

function useDisposable(resource: { dispose: () => void }) {
  const pending = useRef<{ resource: object; timer: number } | null>(null)

  useEffect(() => {
    if (pending.current?.resource === resource) {
      window.clearTimeout(pending.current.timer)
      pending.current = null
    }

    return () => {
      const disposal = { resource, timer: 0 }
      disposal.timer = window.setTimeout(() => {
        resource.dispose()
        if (pending.current === disposal) pending.current = null
      }, 0)
      pending.current = disposal
    }
  }, [resource])
}

function useMedallionSpin(group: RefObject<THREE.Group | null>, reducedMotion: boolean) {
  const { gl, invalidate } = useThree()
  const state = useRef({
    dragging: false,
    pointerId: -1,
    previousX: 0,
    previousY: 0,
    previousTime: 0,
    rotationX: -0.12,
    rotationY: -0.35,
    velocityX: 0,
    velocityY: 0,
  })

  useEffect(() => {
    const canvas = gl.domElement
    const spin = state.current

    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault()
      spin.dragging = true
      spin.pointerId = event.pointerId
      spin.previousX = event.clientX
      spin.previousY = event.clientY
      spin.previousTime = event.timeStamp
      spin.velocityX = 0
      spin.velocityY = 0
      canvas.setPointerCapture(event.pointerId)
      canvas.style.cursor = 'grabbing'
      invalidate()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!spin.dragging || event.pointerId !== spin.pointerId) return
      event.preventDefault()
      const elapsed = Math.max(8, event.timeStamp - spin.previousTime) / 1000
      const deltaX = event.clientX - spin.previousX
      const deltaY = event.clientY - spin.previousY
      const nextVelocityY = THREE.MathUtils.clamp((deltaX * 0.007) / elapsed, -9, 9)
      const nextVelocityX = THREE.MathUtils.clamp((deltaY * 0.007) / elapsed, -6, 6)

      spin.rotationY += deltaX * 0.007
      spin.rotationX = THREE.MathUtils.clamp(spin.rotationX + deltaY * 0.007, -0.8, 0.8)
      spin.velocityY = nextVelocityY
      spin.velocityX = nextVelocityX
      spin.previousX = event.clientX
      spin.previousY = event.clientY
      spin.previousTime = event.timeStamp
      invalidate()
    }

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== spin.pointerId) return
      spin.dragging = false
      spin.pointerId = -1
      if (reducedMotion) {
        spin.velocityX = 0
        spin.velocityY = 0
      }
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      canvas.style.cursor = 'grab'
      invalidate()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerEnd)
    canvas.addEventListener('pointercancel', onPointerEnd)
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerEnd)
      canvas.removeEventListener('pointercancel', onPointerEnd)
    }
  }, [gl, invalidate, reducedMotion])

  useEffect(() => {
    const resume = () => {
      if (!document.hidden && !reducedMotion) invalidate()
    }
    document.addEventListener('visibilitychange', resume)
    return () => document.removeEventListener('visibilitychange', resume)
  }, [invalidate, reducedMotion])

  // The coin turns when the guest turns it and coasts to a stop. It never spins on its own: motion
  // here is direct manipulation, not weather.
  useFrame((_, delta) => {
    const medal = group.current
    if (!medal) return
    const spin = state.current
    let moving = spin.dragging

    if (!spin.dragging && !reducedMotion) {
      const inertia = Math.abs(spin.velocityX) > 0.012 || Math.abs(spin.velocityY) > 0.012
      if (inertia) {
        spin.rotationX += spin.velocityX * delta
        spin.rotationY += spin.velocityY * delta
        const friction = Math.exp(-4.2 * delta)
        spin.velocityX *= friction
        spin.velocityY *= friction
        moving = true
      } else {
        spin.velocityX = 0
        spin.velocityY = 0
      }
      spin.rotationX = THREE.MathUtils.clamp(spin.rotationX, -0.8, 0.8)
    }

    medal.rotation.set(spin.rotationX, spin.rotationY, 0)
    if (moving && !document.hidden) invalidate()
  })
}

function Scene({ badge, tone, reducedMotion, onUnavailable }: { badge: BadgeDef; tone: Tone; reducedMotion: boolean; onUnavailable: () => void }) {
  const group = useRef<THREE.Group>(null)
  const rendererDisposal = useRef<{ renderer: THREE.WebGLRenderer; timer: number } | null>(null)
  const { gl } = useThree()
  const shadeMatcap = useMemo(() => makeShadeMatcap(), [])
  const discGeometry = useMemo(() => makeDiscGeometry(), [])
  const emblemGeometry = useMemo(() => svgEmblemShape(badge.id) ?? makeEmblemGeometry(badge.id), [badge.id])
  // the coin face: the tier's metal, flat, shaded only where it turns away
  const medalMaterial = useMemo(
    () => new THREE.MeshMatcapMaterial({ color: new THREE.Color(tone.metal), matcap: shadeMatcap }),
    [shadeMatcap, tone.metal],
  )
  // the emblem struck into the face: the same pale metal the flat disc uses. Flat plate -> DoubleSide.
  const inlayMaterial = useMemo(
    () => new THREE.MeshMatcapMaterial({
      color: new THREE.Color(tone.inlay),
      matcap: shadeMatcap,
      side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }),
    [shadeMatcap, tone.inlay],
  )

  useDisposable(shadeMatcap)
  useDisposable(discGeometry)
  useDisposable(emblemGeometry)
  useDisposable(medalMaterial)
  useDisposable(inlayMaterial)

  useMedallionSpin(group, reducedMotion)

  useEffect(() => {
    const canvas = gl.domElement
    const onContextLost = (event: Event) => {
      event.preventDefault()
      webGLSupported = false
      onUnavailable()
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    return () => canvas.removeEventListener('webglcontextlost', onContextLost)
  }, [gl, onUnavailable])

  useEffect(() => {
    if (rendererDisposal.current?.renderer === gl) {
      window.clearTimeout(rendererDisposal.current.timer)
      rendererDisposal.current = null
    }

    return () => {
      const disposal = { renderer: gl, timer: 0 }
      disposal.timer = window.setTimeout(() => {
        gl.renderLists.dispose()
        gl.dispose()
        gl.forceContextLoss()
        if (rendererDisposal.current === disposal) rendererDisposal.current = null
      }, 0)
      rendererDisposal.current = disposal
    }
  }, [gl])

  return (
    <group ref={group} dispose={null}>
      {/* one SOLID coin, no ribbon: a badge is a coin, not a rosette */}
      <mesh geometry={discGeometry} material={medalMaterial} />
      {/* the emblem, flush in the face, front and back. A locked coin keeps its art, quietly. */}
      <mesh geometry={emblemGeometry} material={inlayMaterial} position={[0, 0, 0.064]} />
      <mesh geometry={emblemGeometry} material={inlayMaterial} position={[0, 0, -0.064]} rotation={[0, Math.PI, 0]} />
    </group>
  )
}

export default function Medallion({ badge, earned }: MedallionProps) {
  const reducedMotion = useReducedMotion()
  const [available, setAvailable] = useState(canUseWebGL)
  const [tone, setTone] = useState<Tone | null>(null)
  const markUnavailable = useMemo(() => () => setAvailable(false), [])
  const metalProbe = useRef<HTMLSpanElement>(null)
  const emblemProbe = useRef<HTMLSpanElement>(null)
  const groundProbe = useRef<HTMLSpanElement>(null)
  const tier = badge.tier ?? 'bronze'

  // before paint, so the coin never shows a colour it then corrects
  useLayoutEffect(() => {
    const [metal, emblem, ground] = [metalProbe.current, emblemProbe.current, groundProbe.current]
    if (!metal || !emblem || !ground) return
    const read = readTone(metal, emblem, ground)
    // no 2D canvas to resolve the metal with: fall back to the flat disc rather than guess a colour
    if (read) setTone(read)
    else setAvailable(false)
  }, [tier, earned])

  if (!available) throw WEBGL_UNAVAILABLE

  return (
    <div className={`medal-stage medal-tier medal-${tier} ${earned ? 'is-earned' : 'is-locked'}`}>
      <span className="medal-probe medal-probe-metal" ref={metalProbe} aria-hidden="true" />
      <span className="medal-probe medal-probe-emblem" ref={emblemProbe} aria-hidden="true" />
      <span className="medal-probe medal-probe-ground" ref={groundProbe} aria-hidden="true" />
      {tone && (
        <Canvas
          aria-label={`${badge.name} medal, ${earned ? 'earned' : 'locked'}. Drag to spin.`}
          role="img"
          frameloop="demand"
          dpr={[1, 2]}
          // no tone mapping: the film curve would lift the metal off the value the flat disc paints
          gl={{ alpha: true, antialias: true, powerPreference: 'low-power', toneMapping: THREE.NoToneMapping }}
          camera={{ fov: 27, position: [0, 0, 6] }}
          style={{ width: 220, height: 220, maxWidth: '100%', touchAction: 'none', cursor: 'grab' }}
        >
          <Scene badge={badge} tone={tone} reducedMotion={reducedMotion} onUnavailable={markUnavailable} />
        </Canvas>
      )}
    </div>
  )
}
