import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useAllDrinks, useStore } from '../../state/store'
import { deriveWrapped } from './wrappedData'
import { IconClose } from '../../ui/Icon'
import './wrapped.css'

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

function BigNum({ n }: { n: number }) {
  const [v, setV] = useState(reduced() ? n : 0)
  useEffect(() => {
    if (reduced()) { setV(n); return }
    let raf = 0; const start = performance.now(); const dur = 900
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      setV(Math.round(n * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [n])
  return <span className="tnum">{v}</span>
}

export function Wrapped({ onClose }: { onClose: () => void }) {
  const drinks = useAllDrinks()
  const me = useStore((s) => s.me)
  const cards = useMemo(() => deriveWrapped(drinks, me), [drinks, me])
  const [i, setI] = useState(0)
  const paused = useRef(false)

  const go = (d: number) => setI((v) => {
    const nv = v + d
    if (nv < 0) return 0
    if (nv >= cards.length) { onClose(); return v }
    return nv
  })

  // autoplay (skipped under reduced-motion)
  useEffect(() => {
    if (reduced() || paused.current) return
    const t = setTimeout(() => go(1), 4200)
    return () => clearTimeout(t)
  }, [i])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [])

  // tap zones + swipe
  const down = useRef({ x: 0, t: 0 })
  const onDown = (e: React.PointerEvent) => { paused.current = true; down.current = { x: e.clientX, t: performance.now() } }
  const onUp = (e: React.PointerEvent) => {
    paused.current = false
    const dx = e.clientX - down.current.x
    if (Math.abs(dx) > 44) { go(dx < 0 ? 1 : -1); return }
    const w = (e.currentTarget as HTMLElement).clientWidth
    go(e.clientX - (e.currentTarget as HTMLElement).getBoundingClientRect().left < w * 0.33 ? -1 : 1)
  }

  const card = cards[i]

  return createPortal(
    <div className="wr" style={{ '--accent': card.accent } as CSSProperties}>
      <div className="wr-dots">
        {cards.map((_, k) => <span key={k} className={'wr-dot' + (k < i ? ' done' : k === i ? ' on' : '')} />)}
      </div>
      <button className="wr-close pressable" aria-label="Close" onClick={onClose}><IconClose size={18} /></button>

      <div className="wr-stage" onPointerDown={onDown} onPointerUp={onUp}>
        <div className="wr-card" key={i}>
          {card.eyebrow && <div className="wr-eyebrow">{card.eyebrow}</div>}
          {card.big && <div className="wr-big"><BigNum n={Number(card.big)} />{card.bigSuffix}</div>}
          {card.headline && <h2 className="wr-headline">{card.headline}</h2>}
          {card.value && <div className="wr-value">{card.value}</div>}
          {card.sub && <p className="wr-sub">{card.sub}</p>}
          {card.kind === 'moment' && <div className="wrapped-3d-slot" aria-hidden />}
          {card.kind === 'finale' && (
            <button className="btn btn-coral wr-save" onClick={() => { /* share export added next */ }}>Save my Wrapped</button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
