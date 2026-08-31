import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import type { BadgeDef } from '../../data/badges'
import { svgEmblemGeometry } from './emblems'

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

function makeMatcap(warm: boolean) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas2D is unavailable')

  const base = warm ? '#7A5A2E' : '#4A5560'
  const middle = warm ? '#E9C877' : '#C7D0D8'
  const shadow = warm ? '#2C1F0E' : '#20262C'

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
  gradient.addColorStop(0, warm ? 'rgba(255,220,150,0.6)' : 'rgba(210,225,240,0.6)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function makeDiscGeometry(earned: boolean) {
  const edge = 0.1
  const profile = [
    new THREE.Vector2(0, edge * 0.55),
    new THREE.Vector2(0.62, edge * 0.62),
    new THREE.Vector2(0.8, edge * 0.7),
    new THREE.Vector2(0.88, edge * 0.92),
    new THREE.Vector2(0.94, edge * 0.8),
    new THREE.Vector2(0.985, edge * 0.55),
    new THREE.Vector2(1, 0),
  ]
  const geometry = new THREE.LatheGeometry(profile, earned ? 96 : 40)
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

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.065,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.016,
    bevelSegments: 2,
    curveSegments: 8,
  })
  geometry.center()
  geometry.computeVertexNormals()
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
  const warmMatcap = useMemo(() => makeMatcap(true), [])
  const coolMatcap = useMemo(() => makeMatcap(false), [])
  const discGeometry = useMemo(() => makeDiscGeometry(earned), [earned])
  const emblemGeometry = useMemo(() => svgEmblemGeometry(badge.id) ?? makeEmblemGeometry(badge.id), [badge.id])
  const ribbonGeometry = useMemo(makeRibbonGeometry, [])
  const medalMaterial = useMemo(() => {
    if (!earned) {
      return new THREE.MeshMatcapMaterial({
        color: new THREE.Color('#DCE9EA'),
        matcap: coolMatcap,
        opacity: 0.78,
        transparent: true,
        depthWrite: false,
      })
    }
    return new THREE.MeshMatcapMaterial({
      color: new THREE.Color(tier.tint),
      matcap: tier.warm ? warmMatcap : coolMatcap,
    })
  }, [coolMatcap, earned, tier, warmMatcap])
  const emblemMaterial = useMemo(
    () => new THREE.MeshMatcapMaterial({ color: new THREE.Color(tier.inlay), matcap: tier.warm ? warmMatcap : coolMatcap }),
    [tier, warmMatcap, coolMatcap],
  )
  const ribbonMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: tier.ribbon, side: THREE.DoubleSide }),
    [tier.ribbon],
  )

  useDisposable(coolMatcap)
  useDisposable(discGeometry)
  useDisposable(emblemGeometry)
  useDisposable(medalMaterial)
  useDisposable(emblemMaterial)
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
      <mesh geometry={discGeometry} material={medalMaterial} />
      <mesh geometry={discGeometry} material={medalMaterial} rotation={[0, Math.PI, 0]} />
      {earned && (
        <>
          <mesh geometry={emblemGeometry} material={emblemMaterial} position={[0, 0, 0.105]} />
          <mesh geometry={emblemGeometry} material={emblemMaterial} position={[0, 0, -0.105]} rotation={[0, Math.PI, 0]} scale={0.72} />
        </>
      )}
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
