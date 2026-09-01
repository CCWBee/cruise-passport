import {
  useCallback, useEffect, useMemo, useRef, useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BADGES } from '../../data/badges'
import { DECKS } from '../../data/model'
import { useAllDrinks, useStore } from '../../state/store'
import { useSources } from '../../state/social'
import { IconClose } from '../../ui/Icon'
import { useCountUp } from '../../ui/useCountUp'
import {
  WRAPPED_TOTAL, deriveWrapped, voyageDateRange, wrappedUnlocked,
  type WrappedCard,
} from './wrappedData'
import { Soon } from '../../ui/Soon'
import './wrapped.css'

const SEEN_KEY = 'spcc-wrapped-seen'
const CARD_DURATION = 4000

function useReducedMotion(): boolean {
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

function useStoryProgress(key: number, duration: number, paused: boolean, onComplete: () => void): number {
  const [progress, setProgress] = useState(0)
  const elapsed = useRef(0)
  const completed = useRef(false)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete

  useEffect(() => {
    elapsed.current = 0
    completed.current = false
    setProgress(0)
  }, [key])

  useEffect(() => {
    if (!Number.isFinite(duration)) return
    let frame = 0
    let previous = 0
    const tick = (now: number) => {
      if (previous && !paused) elapsed.current += now - previous
      previous = now
      const next = Math.min(1, elapsed.current / duration)
      setProgress(next)
      if (next >= 1) {
        if (!completed.current) {
          completed.current = true
          completeRef.current()
        }
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, key, paused])
  return progress
}

function AnimatedNumber({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setStarted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  const shown = useCountUp(started ? value : 0, 1100)
  return <span className="tnum">{shown.toFixed(decimals)}{suffix}</span>
}

function CardBody({ card }: { card: WrappedCard }) {
  switch (card.kind) {
    case 'cover':
      return (
        <div className="wr-content wr-cover">
          <div className="wr-orbit" aria-hidden="true"><span /><span /><span /></div>
          <p className="wr-eyebrow">A voyage in cocktails</p>
          <h1>Your Sun Princess,<br />wrapped</h1>
          <p className="wr-date tnum">{card.dateRange}</p>
        </div>
      )
    case 'tried':
      return (
        <div className="wr-content wr-centred">
          <p className="wr-eyebrow">You have sipped</p>
          <div className="wr-big"><AnimatedNumber value={card.count} /></div>
          <p className="wr-of">of {WRAPPED_TOTAL} drinks</p>
          <div className="wr-readout glass"><strong><AnimatedNumber value={card.pct} decimals={1} suffix="%" /></strong><span>of the passport</span></div>
        </div>
      )
    case 'topbar':
      return (
        <div className="wr-content wr-centred">
          <p className="wr-eyebrow">Your top bar</p>
          <h2 className="wr-headline">{card.venue}</h2>
          <div className="wr-plate glass">Deck <span className="tnum">{card.deck}</span></div>
          <p className="wr-stat"><strong><AnimatedNumber value={card.count} /></strong> drinks logged here</p>
        </div>
      )
    case 'spirit':
      return (
        <div className="wr-content wr-centred">
          <p className="wr-eyebrow">Favourite spirit</p>
          <h2 className="wr-headline wr-reel">{card.spirit}</h2>
          <p className="wr-stat"><strong><AnimatedNumber value={card.count} /></strong> appearances in your glass</p>
        </div>
      )
    case 'bigday':
      return (
        <div className="wr-content wr-centred">
          <p className="wr-eyebrow">Your biggest day</p>
          <div className="wr-big"><AnimatedNumber value={card.count} /></div>
          <p className="wr-of">drinks logged</p>
          <p className="wr-plate glass">{card.date}</p>
        </div>
      )
    case 'decks':
      return (
        <div className="wr-content wr-centred">
          <p className="wr-eyebrow">Decks conquered</p>
          <div className="wr-ship" aria-hidden="true">
            <span className="wr-ship-top" />
            {DECKS.slice().reverse().map((deck) => <span key={deck} className={card.decks.includes(deck) ? 'visited' : ''} />)}
            <span className="wr-ship-hull" />
          </div>
          <div className="wr-pair">
            <div><strong><AnimatedNumber value={card.count} /></strong><span>decks</span></div>
            <div><strong><AnimatedNumber value={card.venues} /></strong><span>venues</span></div>
          </div>
          <p className="wr-traits tnum">Decks {card.decks.join(' · ')}</p>
        </div>
      )
    case 'archetype':
      return (
        <div className="wr-content wr-centred">
          <p className="wr-eyebrow">Your cocktail archetype</p>
          <div className="wr-type-rings" aria-hidden="true"><span /><span /></div>
          <h2 className="wr-headline wr-archetype-name">{card.archetype.name}</h2>
          <p className="wr-blurb">{card.archetype.blurb}</p>
          <p className="wr-traits">{card.archetype.traits.join(' · ')}</p>
        </div>
      )
    case 'medals':
      return (
        <div className="wr-content wr-centred">
          <p className="wr-eyebrow">The medal haul</p>
          <div className="wr-medal" aria-hidden="true"><span /><span /></div>
          <div className="wr-big"><AnimatedNumber value={card.count} /></div>
          <p className="wr-of">of <span className="tnum">{card.total}</span> medals earned</p>
        </div>
      )
    case 'crew':
      return (
        <div className="wr-content wr-centred">
          <p className="wr-eyebrow">Your crew</p>
          <div className="wr-big"><AnimatedNumber value={card.count} /></div>
          <p className="wr-of">{card.count === 1 ? 'friend aboard' : 'friends aboard'}</p>
          {card.twin && (
            <div className="wr-readout glass"><strong>{card.twin.name}</strong><span>your taste twin · {card.twin.affinityPct}% match</span></div>
          )}
          <p className="wr-stat">
            Together you found <strong><AnimatedNumber value={card.triedTogether} /></strong> of {WRAPPED_TOTAL}
            {card.onlyFriends > 0 && <> · <strong className="tnum">{card.onlyFriends}</strong> you owe to the crew</>}
          </p>
          {card.shared.length > 0 && <p className="wr-traits">Both loved · {card.shared.join(' · ')}</p>}
        </div>
      )
    case 'moment':
      return (
        <div className="wr-content wr-centred">
          <div className="wrapped-3d-slot" role="img" aria-label="3D finale, coming soon" />
          <p className="wr-eyebrow">One more thing</p>
          <h2 className="wr-headline">The tide, in 3D</h2>
          <p className="wr-sub"><Soon label="3D finale · coming soon" /></p>
        </div>
      )
    case 'finale':
      return (
        <div className="wr-content wr-finale">
          <div className="wr-certificate glass">
            <p className="wr-eyebrow">Certificate of a voyage</p>
            <h2>Cruise Wrapped</h2>
            <div className="wr-finale-number"><AnimatedNumber value={card.count} /></div>
            <p className="wr-of">drinks tried · <span className="tnum">{card.pct.toFixed(1)}%</span> complete</p>
            <div className="wr-summary">
              {card.archetype && <p><span>Your taste</span><strong>{card.archetype.name}</strong></p>}
              {card.topBar && <p><span>Top bar</span><strong>{card.topBar}</strong></p>}
              {card.spirit && <p><span>Favourite spirit</span><strong>{card.spirit}</strong></p>}
              {card.medals > 0 && <p><span>Medals</span><strong className="tnum">{card.medals} of {BADGES.length}</strong></p>}
              {card.crew && <p><span>Sailed with</span><strong>{card.crew.twinName ? `${card.crew.count} · twin ${card.crew.twinName}` : `${card.crew.count}`}</strong></p>}
            </div>
            <p className="wr-certificate-date tnum">Sun Princess · {voyageDateRange()}</p>
          </div>
          <button
            type="button"
            className="btn wr-save"
            disabled
            onPointerDown={(event) => event.stopPropagation()}
          >
            Save my Wrapped
          </button>
          <p className="wr-save-note"><Soon label="Shareable image · coming soon" /></p>
        </div>
      )
  }
}

export interface WrappedProps {
  onClose?: () => void
  startIndex?: number
}

export function Wrapped({ onClose, startIndex = 0 }: WrappedProps) {
  const navigate = useNavigate()
  const drinks = useAllDrinks()
  const me = useStore((state) => state.me)
  const srcs = useSources()
  const unlocked = wrappedUnlocked(drinks, me)
  const cards = useMemo(() => deriveWrapped(drinks, me, srcs), [drinks, me, srcs])
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(() => Math.max(0, Math.min(startIndex, cards.length - 1)))
  const [direction, setDirection] = useState<1 | -1>(1)
  const [holding, setHolding] = useState(false)
  const [pagePaused, setPagePaused] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const holdTimer = useRef<number | undefined>(undefined)
  const gesture = useRef({ x: 0, y: 0, time: 0, held: false })

  const close = useCallback(() => {
    if (onClose) onClose()
    else navigate('/')
  }, [navigate, onClose])

  const go = useCallback((move: 1 | -1) => {
    setIndex((current) => {
      const next = current + move
      if (next < 0 || next >= cards.length) return current
      setDirection(move)
      return next
    })
  }, [cards.length])

  const last = index === cards.length - 1
  const progress = useStoryProgress(
    index,
    reduced || last ? Number.POSITIVE_INFINITY : CARD_DURATION,
    holding || pagePaused,
    () => go(1),
  )

  useEffect(() => {
    if (!unlocked) return
    try { localStorage.setItem(SEEN_KEY, '1') } catch { /* additive hint only */ }
  }, [unlocked])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    rootRef.current?.focus()
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  useEffect(() => {
    const visibility = () => setPagePaused(document.hidden)
    const pause = () => setPagePaused(true)
    const resume = () => setPagePaused(false)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('blur', pause)
    window.addEventListener('focus', resume)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('blur', pause)
      window.removeEventListener('focus', resume)
    }
  }, [])

  useEffect(() => {
    if (index >= cards.length) setIndex(Math.max(0, cards.length - 1))
  }, [cards.length, index])

  const clearHold = () => {
    if (holdTimer.current !== undefined) window.clearTimeout(holdTimer.current)
    holdTimer.current = undefined
  }

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as Element).closest('button')) return
    clearHold()
    gesture.current = { x: event.clientX, y: event.clientY, time: performance.now(), held: false }
    event.currentTarget.setPointerCapture(event.pointerId)
    holdTimer.current = window.setTimeout(() => {
      gesture.current.held = true
      setHolding(true)
    }, 200)
  }

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 12 && !gesture.current.held) clearHold()
  }

  const pointerEnd = () => {
    clearHold()
    setHolding(false)
  }

  const pointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    clearHold()
    if (gesture.current.held) { setHolding(false); return }
    const dx = event.clientX - gesture.current.x
    const dy = event.clientY - gesture.current.y
    const elapsed = performance.now() - gesture.current.time
    const distance = Math.hypot(dx, dy)
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
    else if (dy > 120 && Math.abs(dy) > Math.abs(dx)) close()
    else if (elapsed < 220 && distance < 12) {
      const bounds = event.currentTarget.getBoundingClientRect()
      go(event.clientX - bounds.left < bounds.width / 3 ? -1 : 1)
    }
    setHolding(false)
  }

  const keyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') close()
    if (event.key === 'ArrowLeft') go(-1)
    if (event.key === 'ArrowRight') go(1)
  }

  if (!unlocked) {
    return createPortal(
      <div className="wr wr-locked" role="dialog" aria-modal="true" aria-label="Cruise Wrapped">
        <div className="wr-locked-panel glass">
          <p className="wr-eyebrow">Cruise Wrapped</p>
          <h1>Your story is still under way</h1>
          <p>It unlocks when the voyage is complete, or after your twenty-fifth drink.</p>
          <button type="button" className="btn btn-coral" onClick={close}>Back to Home</button>
        </div>
      </div>,
      document.body,
    )
  }

  const card = cards[index]
  return createPortal(
    <div
      ref={rootRef}
      className={`wr wr-${card.kind} ${direction === 1 ? 'forward' : 'back'} ${holding ? 'paused' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Cruise Wrapped"
      aria-describedby="wr-instructions"
      tabIndex={-1}
      onKeyDown={keyDown}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerEnd}
    >
      <p id="wr-instructions" className="wr-sr-only">Tap left or right, swipe, or use the arrow keys to move through your story.</p>
      <div
        className="wr-dots wr-chrome"
        role="progressbar"
        aria-label={`Card ${index + 1} of ${cards.length}`}
        aria-valuemin={1}
        aria-valuemax={cards.length}
        aria-valuenow={index + 1}
      >
        {cards.map((item, itemIndex) => {
          const fill = itemIndex < index ? 1 : itemIndex === index ? progress : 0
          return <span className="wr-dot" key={`${item.kind}-${itemIndex}`}><span style={{ transform: `scaleX(${fill})` }} /></span>
        })}
      </div>
      <button
        type="button"
        className="wr-close glass-live wr-chrome"
        aria-label="Close Cruise Wrapped"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); close() }}
      >
        <IconClose size={18} />
      </button>
      <main className="wr-stage" aria-live="polite">
        <section className="wr-card" key={`${card.kind}-${index}`} aria-label={`Card ${index + 1} of ${cards.length}`}>
          <div className="wr-backdrop" aria-hidden="true" />
          <CardBody card={card} />
        </section>
      </main>
      <div className="wr-hint wr-chrome" aria-hidden="true">
        <span>Previous</span><span>{holding ? 'Paused' : `${index + 1} of ${cards.length}`}</span><span>Next</span>
      </div>
    </div>,
    document.body,
  )
}

export default Wrapped
