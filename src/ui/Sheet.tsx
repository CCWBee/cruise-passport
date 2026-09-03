import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from './Icon'
import { SheetWave } from './SheetWave'
import './sheet.css'

// Sheets stack (the scanner opens from the add sheet), and every one of them listens on window, so
// the top of this tells Escape which sheet it means. Registration is mount-only: a parent re-render
// must not shuffle the order underneath the sheet the guest is actually looking at.
const openSheets: symbol[] = []

// ── Body lock ──────────────────────────────────────────────────────────────────────────────────
// iOS ignores body { overflow: hidden }: the page behind keeps scrolling and a pull at the top of
// the sheet reaches the document, where it fires pull-to-refresh. Pinning the body at its current
// offset is the only lock that holds there, so the page is restored (and re-scrolled) on the last
// close. Whatever the body carried before is put back, because Wrapped sets overflow itself.
type BodyLock = { position: string; top: string; left: string; right: string; width: string; overflow: string }
let saved: BodyLock | null = null
let savedY = 0

function lockBody() {
  const s = document.body.style
  saved = { position: s.position, top: s.top, left: s.left, right: s.right, width: s.width, overflow: s.overflow }
  savedY = window.scrollY || document.documentElement.scrollTop || 0
  s.position = 'fixed'
  s.top = `-${savedY}px`
  s.left = '0'
  s.right = '0'
  s.width = '100%'
  s.overflow = 'hidden'
}

function unlockBody() {
  if (!saved) return
  const s = document.body.style
  s.position = saved.position; s.top = saved.top; s.left = saved.left
  s.right = saved.right; s.width = saved.width; s.overflow = saved.overflow
  saved = null
  window.scrollTo(0, savedY)
}

// ── Dismiss thresholds ─────────────────────────────────────────────────────────────────────────
// The reported bug was a sheet that vanished on a lazy 60px drag, because velocity was measured
// from pointerdown over the whole gesture. Distance is now a third of the pane (never under 140px)
// and velocity is the last 80ms only, so a drag that slows to a stop cannot read as a flick.
const MIN_DROP = 140       // px: below this the sheet always settles back, however tall it is
const DROP_FRACTION = 0.35 // of the sheet's own height
const FLICK_V = 1.1        // px/ms over the last 80ms
const FLICK_MIN = 70       // px: a flick still has to travel
const V_WINDOW = 80        // ms
const INTENT = 10          // px of movement before the drag commits to being vertical
const SETTLE = 200         // ms back to rest

// A sheet opens with its title and one meta line (<p className="sheet-meta">) as the first children.
export function Sheet({ onClose, children, labelledBy }: {
  onClose: () => void
  children: ReactNode
  labelledBy?: string // id of the sheet's own title, so it is announced by name
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const me = Symbol('sheet')
    openSheets.push(me)
    if (openSheets.length === 1) lockBody()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openSheets[openSheets.length - 1] === me) closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    // Focus moves in, or a keyboard walks the page behind the backdrop; and back out on close.
    const previous = document.activeElement as HTMLElement | null
    sheetRef.current?.focus()
    return () => {
      openSheets.splice(openSheets.indexOf(me), 1)
      if (!openSheets.length) unlockBody()
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [])

  // ── Drag to dismiss ─────────────────────────────────────────────────────────────────────────
  // Direct manipulation, not decorative motion: it must work for everyone, or the grab handle is an
  // affordance that lies. It starts from the grab band always, and from the scroller only at its top
  // and only downward, so scrolling the sheet never turns into closing it. The title and meta line
  // are the header a thumb actually lands on; they are children of the scroller, so they are armed by
  // the scrollTop-0 rule rather than by a zone of their own. That covers them: whenever the scroller
  // has moved, the header has scrolled off the top of the pane and there is nothing there to grab.
  useEffect(() => {
    const sheet = sheetRef.current, scroller = scrollRef.current
    if (!sheet || !scroller) return

    let armed = false      // a pointer is down somewhere a drag may start
    let live = false       // intent confirmed: this gesture is ours, the sheet follows the finger
    let fromHandle = false // started outside the scroller (grab bar or header zone)
    let id = -1
    let x0 = 0, y0 = 0, dx = 0, dy = 0
    let endedAt = -1000    // when the last live drag finished, so its click can be swallowed
    const trail: { t: number, y: number }[] = []   // ring buffer for the release velocity

    const reset = () => { armed = false; live = false; id = -1; dx = 0; dy = 0; trail.length = 0 }

    const down = (e: PointerEvent) => {
      if (armed) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const t = e.target as HTMLElement | null
      // the QR block and the scanner opt out, and no control is ever a drag handle
      if (!t || t.closest('input,textarea,select,button,canvas,[data-noswipe]')) return
      const inScroll = !!t.closest('.sheet-scroll')
      if (inScroll && scroller.scrollTop > 0) return
      armed = true; fromHandle = !inScroll; id = e.pointerId
      x0 = e.clientX; y0 = e.clientY; dx = 0; dy = 0
      trail.length = 0
      trail.push({ t: performance.now(), y: e.clientY })
    }

    const move = (e: PointerEvent) => {
      if (!armed || e.pointerId !== id) return
      dx = e.clientX - x0; dy = e.clientY - y0
      trail.push({ t: performance.now(), y: e.clientY })
      if (trail.length > 16) trail.shift()
      if (!live) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < INTENT) return   // intent not decided yet
        if (Math.abs(dx) > Math.abs(dy)) { reset(); return }        // across, not down: the content keeps it
        if (!fromHandle && dy <= 0) { reset(); return }             // upward from the top: that is a scroll
        live = true
        sheet.style.transition = 'none'
        try { sheet.setPointerCapture(id) } catch { /* capture is a nicety, not the mechanism */ }
      }
      sheet.style.transform = `translateY(${Math.max(0, dy)}px)`
    }

    // Velocity over the last 80ms of movement, anchored at release: a drag that travels far and then
    // rests before the finger lifts reads as 0, not as the average since pointerdown.
    const releaseVelocity = (now: number) => {
      if (trail.length < 2) return 0
      const last = trail[trail.length - 1]
      const oldest = trail.find((s) => s.t >= now - V_WINDOW)
      if (!oldest || oldest === last) return 0
      const dt = last.t - oldest.t
      return dt > 0 ? (last.y - oldest.y) / dt : 0
    }

    const up = (e: PointerEvent) => {
      if (!armed || e.pointerId !== id) return
      const wasLive = live, travelled = Math.max(0, dy)
      const v = releaseVelocity(performance.now())
      reset()
      if (!wasLive) return
      endedAt = performance.now()
      sheet.style.transition = ''
      const h = sheet.getBoundingClientRect().height || 1
      const far = travelled > Math.max(MIN_DROP, h * DROP_FRACTION)
      const flick = v > FLICK_V && travelled > FLICK_MIN
      if (far || flick) { closeRef.current(); return }
      sheet.style.transition = `transform ${SETTLE}ms var(--e-out)`
      sheet.style.transform = ''
      window.setTimeout(() => { if (!live) sheet.style.transition = '' }, SETTLE)
    }

    // A cancel (the browser took the gesture, or the pointer was lost) is a settle-back, never a
    // dismiss: the guest never asked to close.
    const cancel = () => {
      if (!armed) return
      const wasLive = live
      reset()
      if (!wasLive) return
      endedAt = performance.now()
      sheet.style.transition = `transform ${SETTLE}ms var(--e-out)`
      sheet.style.transform = ''
      window.setTimeout(() => { if (!live) sheet.style.transition = '' }, SETTLE)
    }

    // The browser decides "this touch is a scroll" on the first touchmove it is allowed to keep, and
    // from then on the drag is dead and the pull can reach the document (pull-to-refresh). So the
    // veto goes in well before the 10px intent test: from the top of the scroller there is no
    // downward scroll to lose. It waits for 4px of it, though, because a thumb that plants, shifts a
    // pixel or two down and then scrolls up is a common way to start reading, and a touch that has
    // already been prevented does not get handed back mid-gesture on iOS: that swipe would read as
    // dead. Chrome is measured: it withholds every touchmove until the finger is about 15px out, so
    // the first move this ever sees there is already past 4 and the wait costs nothing (gestures.mjs
    // (g) and (h)). Safari is assumed to hold a similar slop; it cannot be tested headless. If a slow
    // drag from the title turns out to rubber-band the list on the iPhone, VETO back to 0 is the
    // whole revert. Non-passive, or preventDefault is a no-op.
    const VETO = 4
    const touchmove = (e: TouchEvent) => {
      if (!armed) return
      const t = e.touches[0]
      const tdy = t ? t.clientY - y0 : dy
      const tdx = t ? t.clientX - x0 : dx
      if (live || fromHandle || (tdy > VETO && tdy >= Math.abs(tdx))) e.preventDefault()
    }

    // A mouse drag that settles back would otherwise fire the click of whatever row it started on.
    const swallow = (e: MouseEvent) => {
      if (performance.now() - endedAt < 250) { e.stopPropagation(); e.preventDefault(); endedAt = 0 }
    }

    sheet.addEventListener('pointerdown', down)
    sheet.addEventListener('pointermove', move)
    sheet.addEventListener('pointerup', up)
    sheet.addEventListener('pointercancel', cancel)
    sheet.addEventListener('touchmove', touchmove, { passive: false })
    sheet.addEventListener('click', swallow, true)
    return () => {
      sheet.removeEventListener('pointerdown', down)
      sheet.removeEventListener('pointermove', move)
      sheet.removeEventListener('pointerup', up)
      sheet.removeEventListener('pointercancel', cancel)
      sheet.removeEventListener('touchmove', touchmove)
      sheet.removeEventListener('click', swallow, true)
    }
  }, [])

  return createPortal(
    // The scrim is a sibling of the pane, not its parent: two flat glass layers over the page rather
    // than one nested in the other, which Safari renders unevenly.
    <div className="sheet-bg" onClick={(e) => { if (!(e.target as HTMLElement).closest('.sheet')) onClose() }}>
      <div className="sheet-scrim" aria-hidden />
      <div className="sheet" ref={sheetRef} role="dialog" aria-modal tabIndex={-1} aria-labelledby={labelledBy}>
        <SheetWave />
        <div className="sheet-handle" aria-hidden><div className="sheet-grab" /></div>
        <button className="sheet-x pressable" aria-label="Close" onClick={onClose}><IconClose size={16} /></button>
        <div className="sheet-scroll" ref={scrollRef}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
