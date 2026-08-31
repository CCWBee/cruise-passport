import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { EMBLEMS } from './emblems-data'

/** Flat outline geometry of a badge's emblem — a coloured enamel inlay plate for the coin face.
 *  Rendered as a thin flat plate (with a dark groove ring behind it) rather than a raised relief,
 *  so it reads as inlay struck into the coin, not a bump sitting on top. */
export function svgEmblemShape(id: string): THREE.ShapeGeometry | null {
  const inner = EMBLEMS[id]
  if (!inner) return null
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`
    const data = new SVGLoader().parse(svg)
    const shapes: THREE.Shape[] = []
    for (const p of data.paths) for (const s of SVGLoader.createShapes(p)) shapes.push(s)
    if (!shapes.length) return null
    const geo = new THREE.ShapeGeometry(shapes)
    // SVG y-axis points down: flip upright. This mirror inverts winding, so the plate meshes
    // use DoubleSide (a flat plate is the one place DoubleSide is the clean answer).
    geo.scale(1, -1, 1)
    geo.computeBoundingBox()
    const bb = geo.boundingBox!
    const k = 0.82 / Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y)
    geo.scale(k, k, 1)
    geo.center()
    return geo
  } catch {
    return null
  }
}
