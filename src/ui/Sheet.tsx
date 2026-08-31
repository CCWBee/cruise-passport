import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from './Icon'
import { SheetWave } from './SheetWave'
import './sheet.css'

export function Sheet({ onClose, children, eyebrow }: { onClose: () => void; children: ReactNode; eyebrow?: ReactNode }) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  // drag-to-dismiss — only engages from the very top of the scroll area
  useEffect(() => {
    const sheet = sheetRef.current, scroller = scrollRef.current
    if (!sheet || !scroller) return
    // Drag-to-dismiss is direct manipulation, not decorative motion — it must work for
    // everyone, or the grab handle becomes an affordance that lies (the original's bug).
    let y0 = 0, dy = 0, drag = false, t0 = 0
    const down = (e: PointerEvent) => {
      if (scroller.scrollTop > 0) return
      if ((e.target as HTMLElement).closest('input,textarea,select,button,canvas,[data-noswipe]')) return
      drag = true; y0 = e.clientY; t0 = performance.now(); sheet.style.transition = 'none'
    }
    const move = (e: PointerEvent) => {
      if (!drag) return
      dy = Math.max(0, e.clientY - y0)
      if (dy > 4) sheet.setPointerCapture(e.pointerId)
      sheet.style.transform = `translateY(${dy}px)`
      const bg = sheet.parentElement as HTMLElement
      if (bg) bg.style.background = `rgba(33,58,87,${0.34 * (1 - Math.min(dy / 500, 0.7))})`
    }
    const up = () => {
      if (!drag) return
      drag = false; sheet.style.transition = ''
      const v = dy / Math.max(1, performance.now() - t0)
      if (dy > 130 || v > 0.5) onClose()
      else { sheet.style.transform = ''; const bg = sheet.parentElement as HTMLElement; if (bg) bg.style.background = '' }
      dy = 0
    }
    sheet.addEventListener('pointerdown', down)
    sheet.addEventListener('pointermove', move)
    sheet.addEventListener('pointerup', up)
    sheet.addEventListener('pointercancel', up)
    return () => {
      sheet.removeEventListener('pointerdown', down)
      sheet.removeEventListener('pointermove', move)
      sheet.removeEventListener('pointerup', up)
      sheet.removeEventListener('pointercancel', up)
    }
  }, [onClose])

  return createPortal(
    <div className="sheet-bg glass-live" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet" ref={sheetRef} role="dialog" aria-modal>
        <SheetWave />
        <div className="sheet-grab" aria-hidden />
        <button className="sheet-x pressable" aria-label="Close" onClick={onClose}><IconClose size={16} /></button>
        <div className="sheet-scroll" ref={scrollRef}>
          {eyebrow}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
