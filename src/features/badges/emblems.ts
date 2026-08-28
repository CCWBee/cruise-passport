import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

// Per-badge emblem art: badge.id -> the INNER markup of a 100x100 viewBox SVG (filled shapes only:
// <path>, <circle>, <ellipse>, <polygon>, <rect> — fill implied, NO stroke-only elements). Extruded
// into metal relief on the coin face. Produced by the emblem workflow; any id missing here falls
// back to the generated star in Medallion.tsx.
export const EMBLEMS: Record<string, string> = {
  // populated from the emblem-production workflow (one entry per badge)
}

/** Build an extruded relief geometry from a badge's emblem markup, sized to sit on the coin face. */
export function svgEmblemGeometry(id: string): THREE.ExtrudeGeometry | null {
  const inner = EMBLEMS[id]
  if (!inner) return null
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`
    const data = new SVGLoader().parse(svg)
    const shapes: THREE.Shape[] = []
    for (const p of data.paths) for (const s of SVGLoader.createShapes(p)) shapes.push(s)
    if (!shapes.length) return null
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.06, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.014, bevelSegments: 2, curveSegments: 10,
    })
    geo.scale(1, -1, 1) // SVG y-down -> three y-up
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    const scale = 0.92 / Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y)
    geo.scale(scale, scale, 1)
    geo.center()
    geo.computeVertexNormals()
    return geo
  } catch {
    return null
  }
}
