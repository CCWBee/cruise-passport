import {
  Fragment, useCallback, useEffect, useMemo, useRef, useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAllDrinks, useStore } from '../../state/store'
import { useSources } from '../../state/social'
import { IconClose } from '../../ui/Icon'
import { GlassButton } from '../../ui/GlassButton'
import { useCountUp } from '../../ui/useCountUp'
import { SHIP } from '../../data/model'
import { startRoom } from '../../app/room'
import { BADGES } from '../../data/badges'
import { Coin } from '../badges/Coin'
import {
  certificateRows, deriveWrapped, listJoin, voyageDateRange, wrappedTotal, wrappedUnlocked,
  type WrappedCard, type WrappedFinale,
} from './wrappedData'
import { renderWrappedImage } from './wrappedImage'
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

// The one export of the story: a poster of the certificate, shared natively where the browser
// takes files and downloaded where it does not.
function SaveWrapped({ card }: { card: WrappedFinale }) {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  // Safari only honours a download from an anchor in the document, and revoking the URL in the same
  // tick can cancel the save, so detach and revoke on the next turn.
  const download = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cruise-wrapped.png'
    document.body.append(link)
    link.click()
    setTimeout(() => { link.remove(); URL.revokeObjectURL(url) }, 1000)
    setStatus('Saved.')
  }

  const save = async () => {
    if (busy) return
    setBusy(true)
    setStatus('')
    try {
      const blob = await renderWrappedImage(card)
      const file = new File([blob], 'cruise-wrapped.png', { type: 'image/png' })
      if (!navigator.canShare?.({ files: [file] })) { download(blob); return }
      try {
        await navigator.share({ files: [file], title: 'Cruise Wrapped' })
        setStatus('Shared.')
      } catch (error) {
        // A dismissed share sheet is not a failure. Anything else (iOS drops the user activation
        // across the font wait and the canvas encode, and throws NotAllowedError) still has the
        // picture in hand, so save it rather than reporting nothing at all.
        if ((error as Error)?.name === 'AbortError') return
        download(blob)
      }
    } catch {
      setStatus('Could not make the picture. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Both ends of the gesture: swallowing only pointerdown would leave the story's pointerup
          measuring against the previous card's start point, read as a swipe or a dismiss. */}
      {/* The story's one coral fill: /wrapped has no tab bar, so no Log button to take that place. */}
      <GlassButton
        variant="primary"
        size="lg"
        className="wr-save"
        disabled={busy}
        aria-busy={busy}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); void save() }}
      >
        {busy ? 'Making your picture…' : 'Save my Wrapped'}
      </GlassButton>
      {/* empty at rest: the button says what it does; the region stays mounted so "Saved." is announced */}
      <p className="wr-save-note t-meta" role="status">{status}</p>
    </>
  )
}

// A list of drink names in a sentence, each name held whole: balanced on its own, "Both loved:
// Bangkok Mule, Apples Delight and The Cartagena Cool" broke inside "Apples Delight" at 390, and a
// drink's name split over two lines reads as two drinks. listJoin's commas and "and", as spans.
function Names({ names }: { names: string[] }) {
  return (
    <>
      {names.map((name, i) => (
        <Fragment key={i}>
          {i === 0 ? '' : i === names.length - 1 ? ' and ' : ', '}
          <span className="wr-name">{name}</span>
        </Fragment>
      ))}
    </>
  )
}

// Every card is the same skeleton: a quiet label, one thing that is big (a numeral or a name),
// then the plain lines that qualify it. No plates and no rings. The medals slide is the one place a
// disc appears: it shows the coins won beneath the count, because Charles asked on 23 September 2026
// for the medals to be good looking and prominent, and a bare numeral hides them. The count-up belongs to
// the display numeral and nowhere else: digits twitching inside a 13px sentence cost more legibility
// than they buy, and a card whose big thing is a name has no numeral to count.
function CardBody({ card, total }: { card: WrappedCard; total: number }) {
  switch (card.kind) {
    case 'cover':
      return (
        <div className="wr-content wr-cover">
          <h1 className="t-title wr-lead">Your {SHIP}, wrapped</h1>
          <p className="t-meta">A voyage in cocktails</p>
          <p className="t-meta tnum">{card.dateRange}</p>
        </div>
      )
    case 'tried':
      return (
        <div className="wr-content">
          <p className="t-meta">You have tried</p>
          <p className="t-display tnum"><AnimatedNumber value={card.count} /></p>
          <p className="t-meta">of {total} drinks</p>
        </div>
      )
    case 'topbar':
      return (
        <div className="wr-content">
          <p className="t-meta">Your top bar</p>
          <h2 className="t-title wr-lead">{card.venue}</h2>
          <p className="t-meta tnum">Deck {card.deck} · {card.count} drinks</p>
        </div>
      )
    case 'spirit':
      return (
        <div className="wr-content">
          <p className="t-meta">Favourite spirit</p>
          <h2 className="t-title wr-lead">{card.spirit}</h2>
          <p className="t-meta tnum">{card.count} drinks</p>
        </div>
      )
    case 'bigday':
      return (
        <div className="wr-content">
          <p className="t-meta">Your biggest day</p>
          <p className="t-display tnum"><AnimatedNumber value={card.count} /></p>
          <p className="t-meta">drinks logged</p>
          <p className="t-meta">{card.date}</p>
        </div>
      )
    case 'decks':
      return (
        <div className="wr-content">
          <p className="t-meta">Decks visited</p>
          <p className="t-display tnum"><AnimatedNumber value={card.count} /></p>
          <p className="t-meta">across {card.venues} venues</p>
          <p className="t-meta tnum">Decks {listJoin(card.decks)}</p>
        </div>
      )
    case 'archetype':
      return (
        <div className="wr-content">
          <p className="t-meta">Your cocktail archetype</p>
          <h2 className="t-title wr-lead">{card.archetype.name}</h2>
          <p className="t-body wr-blurb">{card.archetype.blurb}</p>
        </div>
      )
    case 'medals':
      return (
        <div className="wr-content">
          <p className="t-meta">Medals</p>
          <p className="t-display tnum"><AnimatedNumber value={card.count} /></p>
          <p className="t-meta tnum">of {card.total} earned</p>
          <div className="wr-coins">
            {card.earned.slice(0, 6).map((id) => {
              const badge = BADGES.find((b) => b.id === id)
              return badge ? <Coin key={id} badge={badge} state="earned" size={96} /> : null
            })}
          </div>
        </div>
      )
    case 'crew':
      return (
        <div className="wr-content">
          <p className="t-meta">Your crew</p>
          <p className="t-display tnum"><AnimatedNumber value={card.count} /></p>
          <p className="t-meta">{card.count === 1 ? 'friend aboard' : 'friends aboard'}</p>
          <div className="wr-facts">
            {card.twin && <p className="t-meta">Taste twin: {card.twin.name}, {card.twin.affinityPct}% match</p>}
            <p className="t-meta">Together you found {card.triedTogether} of {total}</p>
            {card.shared.length > 0 && <p className="t-meta">Both loved: <Names names={card.shared} /></p>}
          </div>
        </div>
      )
    case 'crewfav':
      return (
        <div className="wr-content">
          <p className="t-meta">The crew's favourite</p>
          <h2 className="t-title wr-lead">{card.name}</h2>
          <p className="t-meta tnum">{card.avg.toFixed(1)} stars from {card.raters} of you</p>
        </div>
      )
    case 'split':
      return (
        <div className="wr-content">
          <p className="t-meta">The one that split you</p>
          <h2 className="t-title wr-lead">{card.name}</h2>
          <p className="t-meta tnum">You gave it {card.mine} out of 5, {card.friend} gave it {card.theirs}</p>
        </div>
      )
    case 'find':
      return (
        <div className="wr-content">
          <p className="t-meta">Your find</p>
          <h2 className="t-title wr-lead">{card.name}</h2>
          {/* two lines, one sentence each: as one line it broke after "tried" at 390 */}
          <p className="t-meta">Nobody else in the crew tried it.</p>
          <p className="t-meta tnum">{card.rating ? `You gave it ${card.rating} out of 5.` : 'You recommended it.'}</p>
        </div>
      )
    case 'nexttime':
      return (
        <div className="wr-content">
          <p className="t-meta">Next time</p>
          <h2 className="t-title wr-lead">{card.name}</h2>
          <p className="t-meta">{listJoin(card.by)} loved it. You have not had one yet.</p>
          {/* the name only when more than one loved it; with one, the line above has said who */}
          {card.note && (
            <p className="t-body wr-blurb">
              ‘{card.note.text}’{card.by.length > 1 ? ` (${card.note.name})` : ''}
            </p>
          )}
        </div>
      )
    case 'finale':
      return (
        <div className="wr-content wr-finale">
          {/* glass, the engine's (base.css): the room drifts beneath it, so the film and the lit rim
              read. The inner rule is a child, because the glass's ::after is its edge lens. */}
          <div className="wr-certificate glass">
            <span className="wr-cert-rule" aria-hidden="true" />
            <h2 className="t-title">Cruise Wrapped</h2>
            <p className="t-display tnum wr-cert-number"><AnimatedNumber value={card.count} /></p>
            <p className="t-meta">drinks tried, <span className="tnum">{card.pct.toFixed(0)}%</span> complete</p>
            <div className="wr-summary">
              {certificateRows(card).map((row) => (
                <p key={row.label}><span className="t-meta">{row.label}</span><strong className="tnum">{row.value}</strong></p>
              ))}
            </div>
            <p className="t-meta tnum">{SHIP} · {voyageDateRange()}</p>
          </div>
          <SaveWrapped card={card} />
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
  const roomRef = useRef<HTMLDivElement>(null)
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

  // The story sits in the room the tabs do (room.ts), mounted here because /wrapped is routed
  // outside Shell: the same light by the clock, the same pools, which drift while the guest is
  // tapping through and rest when the phone is left alone. One layer behind every card, so a card
  // slides over a still room rather than bringing a backdrop of its own.
  useEffect(() => (roomRef.current ? startRoom(roomRef.current) : undefined), [unlocked])

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
        <div className="room" ref={roomRef} aria-hidden="true" />
        {/* on the room, no panel: a message and its one way out are not a module with a boundary */}
        <div className="wr-locked-panel">
          <h1 className="t-title">Your story is still under way</h1>
          <p className="t-meta">Cruise Wrapped unlocks when the voyage is complete, or after your twenty-fifth drink.</p>
          {/* filled: /wrapped has no tab bar, so no Log button holds the screen's coral */}
          <GlassButton variant="primary" onClick={close}>Back to Home</GlassButton>
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
      <div className="room" ref={roomRef} aria-hidden="true" />
      <p id="wr-instructions" className="sr-only">Tap left or right, swipe, or use the arrow keys to move through your story.</p>
      <div
        className="wr-dots"
        role="progressbar"
        aria-label={`Card ${index + 1} of ${cards.length}`}
        aria-valuemin={1}
        aria-valuemax={cards.length}
        aria-valuenow={index + 1}
      >
        {cards.map((item, itemIndex) => {
          // An untimed card (reduced motion, and the finale, which waits for the guest) reads as
          // complete: the rail must say where you are even when nothing is counting down.
          const fill = itemIndex < index ? 1 : itemIndex === index ? (reduced || last ? 1 : progress) : 0
          return <span className="wr-dot" key={`${item.kind}-${itemIndex}`}><span style={{ transform: `scaleX(${fill})` }} /></span>
        })}
      </div>
      <button
        type="button"
        className="wr-close pressable"
        aria-label="Close Cruise Wrapped"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); close() }}
      >
        <IconClose size={18} />
      </button>
      <main className="wr-stage" aria-live="polite">
        <section className="wr-card" key={`${card.kind}-${index}`} aria-label={`Card ${index + 1} of ${cards.length}`}>
          <CardBody card={card} total={wrappedTotal(drinks)} />
        </section>
      </main>
      {/* Three slots always, so Previous and Next keep their places; the side words appear only where
          the tap they name actually moves the story. The rail at the top says where you are, so the
          middle slot is empty unless the story is held. */}
      <div className="wr-hint" aria-hidden="true">
        <span>{index > 0 ? 'Previous' : ''}</span>
        <span>{holding ? 'Paused' : ''}</span>
        <span>{last ? '' : 'Next'}</span>
      </div>
    </div>,
    document.body,
  )
}

export default Wrapped
