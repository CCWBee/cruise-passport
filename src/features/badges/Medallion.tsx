import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import type { BadgeDef } from '../../data/badges'
import { svgEmblemShape } from './emblems'

interface MedallionProps {
  badge: BadgeDef
  earned: boolean
}

type Tier = NonNullable<BadgeDef['tier']>

// `inlay` is the enamel colour struck into the coin face — chosen to contrast with each coin's
// metal so the relief reads as coloured inlay as the medal rotates, not just tone-on-tone metal.
const TIER: Record<Tier, { tint: string; warm: boolean; ribbon: string; inlay: string }> = {
  bronze: { tint: '#C98A4C', warm: true, ribbon: '#F0637F', inlay: '#2FB79C' },
  silver: { tint: '#C7D0D8', warm: false, ribbon: '#2FB79C', inlay: '#F0637F' },
  gold: { tint: '#F6B02E', warm: true, ribbon: '#E4A72C', inlay: '#146C93' },
  special: { tint: '#9B8CF2', warm: false, ribbon: '#B7A2EE', inlay: '#F6B02E' },
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

function makeMatcap(base: string, middle: string, shadow: string, rim: string) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas2D is unavailable')

  context.fillStyle = base
  context.beginPath()
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  context.fill()

  let gradient = context.createRadialGradient(size * 0.4, size * 0.34, size * 0.05, size * 0.5, size * 0.5, size * 0.52)
  gradient.addColorStop(0, middle)
  gradient.addColorStop(0.7, base)
  gradient.addColorStop(1, shadow)
  context.globalCompositeOperation = 'source-atop'
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  gradient = context.createRadialGradient(size * 0.36, size * 0.3, 0, size * 0.36, size * 0.3, size * 0.22)
  gradient.addColorStop(0, '#FFFFFF')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  gradient = context.createRadialGradient(size * 0.72, size * 0.78, 0, size * 0.72, size * 0.78, size * 0.3)
  gradient.addColorStop(0, rim)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
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

function makeRibbonGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(-0.18, 0.32)
  shape.lineTo(0.18, 0.32)
  shape.lineTo(0.18, -0.32)
  shape.lineTo(0, -0.2)
  shape.lineTo(-0.18, -0.32)
  shape.closePath()
  return new THREE.ShapeGeometry(shape)
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

  useFrame((_, delta) => {
    const medal = group.current
    if (!medal) return
    const spin = state.current

    if (!spin.dragging && !reducedMotion) {
      const inertia = Math.abs(spin.velocityX) > 0.012 || Math.abs(spin.velocityY) > 0.012
      if (inertia) {
        spin.rotationX += spin.velocityX * delta
        spin.rotationY += spin.velocityY * delta
        const friction = Math.exp(-4.2 * delta)
        spin.velocityX *= friction
        spin.velocityY *= friction
      } else {
        spin.velocityX = 0
        spin.velocityY = 0
        spin.rotationY += delta * 0.16
      }
      spin.rotationX = THREE.MathUtils.clamp(spin.rotationX, -0.8, 0.8)
    }

    medal.rotation.set(spin.rotationX, spin.rotationY, 0)
    if (!reducedMotion && !document.hidden) invalidate()
  })
}

function Scene({ badge, earned, reducedMotion, onUnavailable }: MedallionProps & { reducedMotion: boolean; onUnavailable: () => void }) {
  const group = useRef<THREE.Group>(null)
  const rendererDisposal = useRef<{ renderer: THREE.WebGLRenderer; timer: number } | null>(null)
  const { gl } = useThree()
  const tier = TIER[badge.tier ?? 'bronze']
  const warmMatcap = useMemo(() => makeMatcap('#7A5A2E', '#E9C877', '#2C1F0E', 'rgba(255,220,150,0.6)'), [])
  const coolMatcap = useMemo(() => makeMatcap('#4A5560', '#C7D0D8', '#20262C', 'rgba(210,225,240,0.6)'), [])
  const lockedMatcap = useMemo(() => makeMatcap('#8A94A0', '#EDF1F5', '#606A76', 'rgba(222,230,238,0.6)'), [])
  const discGeometry = useMemo(() => makeDiscGeometry(), [])
  const emblemGeometry = useMemo(() => svgEmblemShape(badge.id) ?? makeEmblemGeometry(badge.id), [badge.id])
  const ribbonGeometry = useMemo(makeRibbonGeometry, [])
  const medalMaterial = useMemo(() => {
    // locked: fully opaque desaturated grey. The old locked material was transparent with
    // depthWrite:false, which painted the far shell through the near one — that read as inside-out.
    if (!earned) return new THREE.MeshMatcapMaterial({ color: new THREE.Color('#EEF2F5'), matcap: lockedMatcap })
    return new THREE.MeshMatcapMaterial({ color: new THREE.Color(tier.tint), matcap: tier.warm ? warmMatcap : coolMatcap })
  }, [coolMatcap, lockedMatcap, earned, tier, warmMatcap])
  // enamel inlay plate: tier colour when earned, quiet grey when locked. Flat plate -> DoubleSide.
  const enamelMaterial = useMemo(
    () => new THREE.MeshMatcapMaterial({
      color: new THREE.Color(earned ? tier.inlay : '#7C8894'),
      matcap: earned ? (tier.warm ? warmMatcap : coolMatcap) : lockedMatcap,
      side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }),
    [earned, tier, warmMatcap, coolMatcap, lockedMatcap],
  )
  // dark groove ring behind the enamel — reads as the engraved recess edge
  const grooveMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color(earned ? '#17202B' : '#5A6670'), side: THREE.DoubleSide }),
    [earned],
  )
  const ribbonMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: tier.ribbon, side: THREE.DoubleSide }),
    [tier.ribbon],
  )

  useDisposable(coolMatcap)
  useDisposable(lockedMatcap)
  useDisposable(discGeometry)
  useDisposable(emblemGeometry)
  useDisposable(medalMaterial)
  useDisposable(enamelMaterial)
  useDisposable(grooveMaterial)
  useDisposable(ribbonGeometry)
  useDisposable(ribbonMaterial)
  useDisposable(warmMatcap)

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
      {earned && (
        <group position={[0, -0.94, -0.12]}>
          <mesh geometry={ribbonGeometry} material={ribbonMaterial} position={[-0.18, 0, 0]} rotation={[0, 0, -0.12]} />
          <mesh geometry={ribbonGeometry} material={ribbonMaterial} position={[0.18, 0, 0]} rotation={[0, 0, 0.12]} />
        </group>
      )}
      {/* one SOLID coin (the old rotated twin is gone) */}
      <mesh geometry={discGeometry} material={medalMaterial} />
      {/* front inlay: dark groove ring behind, coloured enamel flush in the face. Shown for locked
          too (grey), so locked coins keep their art. */}
      <mesh geometry={emblemGeometry} material={grooveMaterial} position={[0, 0, 0.06]} scale={1.06} />
      <mesh geometry={emblemGeometry} material={enamelMaterial} position={[0, 0, 0.064]} />
      {/* back inlay */}
      <mesh geometry={emblemGeometry} material={grooveMaterial} position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]} scale={1.06} />
      <mesh geometry={emblemGeometry} material={enamelMaterial} position={[0, 0, -0.064]} rotation={[0, Math.PI, 0]} />
    </group>
  )
}

export default function Medallion({ badge, earned }: MedallionProps) {
  const reducedMotion = useReducedMotion()
  const [available, setAvailable] = useState(canUseWebGL)
  const markUnavailable = useMemo(() => () => setAvailable(false), [])

  if (!available) throw WEBGL_UNAVAILABLE

  return (
    <Canvas
      aria-label={`${badge.name} medal, ${earned ? 'earned' : 'locked'}. Drag to spin.`}
      role="img"
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ fov: 27, position: [0, 0, 6] }}
      style={{ width: 220, height: 220, maxWidth: '100%', touchAction: 'none', cursor: 'grab', filter: 'drop-shadow(0 12px 14px rgba(28, 60, 86, .2))' }}
    >
      <Scene badge={badge} earned={earned} reducedMotion={reducedMotion} onUnavailable={markUnavailable} />
    </Canvas>
  )
}
