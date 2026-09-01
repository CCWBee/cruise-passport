import qrcode from 'qrcode-generator'
import { useMemo } from 'react'

// A QR rendered as one SVG path (dark modules), on a fixed white plate so it scans reliably in
// either theme. Returns null if the value is too large to encode, so callers can show a fallback.
export function Qr({ value, size = 220, className }: { value: string; size?: number; className?: string }) {
  const model = useMemo(() => {
    try {
      const qr = qrcode(0, 'M') // auto version, medium error-correction
      qr.addData(value)
      qr.make()
      const n = qr.getModuleCount()
      let d = ''
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
      return { d, n }
    } catch {
      return null
    }
  }, [value])

  if (!model) return null
  const pad = 2 // quiet zone in modules
  const vb = model.n + pad * 2
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      role="img"
      aria-label="Scan to add me"
      shapeRendering="crispEdges"
    >
      <rect width={vb} height={vb} fill="#ffffff" rx={1.5} />
      <path transform={`translate(${pad} ${pad})`} d={model.d} fill="#0E2A3B" />
    </svg>
  )
}
