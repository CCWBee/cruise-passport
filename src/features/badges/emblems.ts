import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { EMBLEMS } from './emblems-data'

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
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: 0.06, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.014, bevelSegments: 2, curveSegments: 10 })
    // SVG y-axis points down, so flip Y to stand the relief upright. Use a rotation, not
    // scale(1,-1,1): the mirror has a negative determinant and inverts triangle winding, which
    // bakes inward-facing normals into computeVertexNormals below (the coin then reads hollow).
    geo.rotateX(Math.PI)
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
