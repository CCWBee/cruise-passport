import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

// Live camera QR reader. Mounts once, streams the rear camera, decodes frames with jsQR, and fires
// onResult exactly once. Stops on the first hit; cleans up the stream on unmount. No dialogs.
// A camera fault is reported through onError and renders nothing here: the sheet has to say what to
// do instead, and the way out belongs next to the message rather than under it.
export function Scanner({ onResult, onError }: { onResult: (text: string) => void; onError?: (message: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const cbRef = useRef(onResult)
  cbRef.current = onResult
  const errRef = useRef(onError)
  errRef.current = onError
  const [error, setError] = useState('')

  useEffect(() => {
    let stream: MediaStream | null = null
    let raf = 0
    let cancelled = false
    let done = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const tick = () => {
      if (cancelled || done) return
      const v = videoRef.current
      if (v && ctx && v.readyState >= 2 && v.videoWidth) {
        const scale = Math.min(1, 640 / v.videoWidth)
        const w = Math.round(v.videoWidth * scale)
        const h = Math.round(v.videoHeight * scale)
        canvas.width = w
        canvas.height = h
        ctx.drawImage(v, 0, 0, w, h)
        const img = ctx.getImageData(0, 0, w, h)
        const found = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' })
        if (found?.data) {
          done = true
          cbRef.current(found.data)
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }

    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        const v = videoRef.current
        if (!v) return
        v.srcObject = stream
        await v.play().catch(() => {})
        raf = requestAnimationFrame(tick)
      } catch (e) {
        const name = (e as { name?: string })?.name
        const message = name === 'NotAllowedError'
          ? 'Camera permission was declined.'
          : name === 'NotFoundError'
            ? 'No camera found.'
            : 'Could not start the camera.'
        setError(message)
        errRef.current?.(message)
      }
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (stream) stream.getTracks().forEach((t) => t.stop())
      const v = videoRef.current
      if (v) v.srcObject = null
    }
  }, [])

  if (error) return null // reported through onError; the sheet renders it beside a way forward
  return (
    <div className="scan-frame" data-noswipe>
      <video ref={videoRef} className="scan-video" playsInline muted aria-label="Camera preview" />
      <div className="scan-reticle" aria-hidden />
    </div>
  )
}
