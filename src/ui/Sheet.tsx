import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from './Icon'
import { SheetWave } from './SheetWave'
import './sheet.css'

// Sheets stack (the scanner opens from the add sheet), and every one of them listens on window, so
// the top of this tells Escape which sheet it means. Registration is mount-only: a parent re-render
// must not shuffle the order underneath the sheet the guest is actually looking at.
const openSheets: symbol[] = []

/** Whether a sheet is mounted now. 'sheet:open' is sent from the sheet's own mount effect, and a
 *  sheet that mounts in the same commit as its listeners (a deep link such as /badges?badge=gin on
 *  a cold load) runs that effect before theirs, so they miss the event. A listener that subscribes
 *  in an effect reads this once after subscribing: Shell's dock and room.ts's pools. (main.tsx
 *  subscribes before the first render, so it cannot miss one.) */
export function isSheetUp(): boolean {
  return openSheets.length > 0
}

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

// ── Two heights (prototype C) ──────────────────────────────────────────────────────────────────
// Medium: the sheet's top at 47% of the screen and the pane scaled to .955 from its foot, a glass
// film over a light scrim, so the screen it came from reads through and beside it. Large: full width
// and height, with a second film brought in by opacity for reading. Between the two the transform,
// the film and the scrim all follow one number, the sheet's offset, so a drag carries all three and
// nothing animates a filter.
export type SheetHeight = 'medium' | 'large'
const MEDIUM_TOP = 0.47
const MEDIUM_SCALE = 0.955
const DRAWER = 440 // ms, --t-drawer: the sheet moving between heights, in and out

// ── Drag thresholds (C's) ──────────────────────────────────────────────────────────────────────
// Velocity is the last 80ms of movement, anchored at release, so a drag that slows to a stop cannot
// read as a flick (the bug that once dismissed a sheet on a lazy 60px drag). A flick down closes it,
// or from large above the medium line takes it to medium; a flick up takes it to large. Otherwise
// where it was let go decides: past the medium line by a third of the way to closed (never under
// 120px) it closes, above half the medium line it goes large, and between it settles at medium.
const FLICK_DOWN = 0.9      // px/ms
const FLICK_UP = 0.6        // px/ms
const MIN_DROP = 120        // px past the medium line
const DROP_FRACTION = 0.35  // of the way from medium to closed
const V_WINDOW = 80         // ms
const INTENT = 10           // px of movement before the drag commits to being vertical
// Pulled above large, the sheet gives a little and comes back: the square root of the pull, times 4.
const rubber = (v: number) => Math.sqrt(v) * 4

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// A sheet opens with its title and one meta line (<p className="sheet-meta">) as the first children.
// `height` is where it opens: large by default, because a form wants its fields and the keyboard;
// a sheet to look at (a drink, a venue) opens at medium over the screen it came from. `wave` is the
// SheetWave opening, for a sheet opened by a tap.
export function Sheet({ onClose, children, labelledBy, height = 'large', wave = true }: {
  onClose: () => void
  children: ReactNode
  labelledBy?: string // id of the sheet's own title, so it is announced by name
  height?: SheetHeight
  wave?: boolean
}) {
  const layerRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const filmRef = useRef<HTMLElement>(null)
  const grabRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  // the geometry, measured on open and on resize, and where the sheet is
  const geo = useRef({ top: 0, h: 800, yMed: 400, yClosed: 900, y: 900, height, closing: false, timer: 0 })

  const measure = useCallback(() => {
    const layer = layerRef.current, sheet = sheetRef.current
    if (!layer || !sheet) return
    const g = geo.current
    const H = layer.clientHeight
    g.top = sheet.offsetTop
    g.h = H - g.top
    // the visible top at medium is 47% of the way down: the offset that puts it there once the pane
    // is scaled from its foot
    g.yMed = Math.max(1, Math.round(H * MEDIUM_TOP - g.top - (1 - MEDIUM_SCALE) * g.h))
    g.yClosed = g.h + 40
  }, [])

  const apply = useCallback((y: number) => {
    const sheet = sheetRef.current, film = filmRef.current, scrim = scrimRef.current
    if (!sheet || !film || !scrim) return
    const g = geo.current
    g.y = y
    const p = y <= 0 ? 1 : Math.max(0, 1 - y / g.yMed)
    const s = MEDIUM_SCALE + (1 - MEDIUM_SCALE) * p
    const ty = y < 0 ? -rubber(-y) : y
    sheet.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${s.toFixed(4)})`
    film.style.opacity = p.toFixed(3)
    // the scrim at .7 of itself at medium and all of it at large (C's .42 and .6 at night), gone by
    // the time the sheet is
    const sc = y <= g.yMed ? 0.7 + 0.3 * p : 0.7 * Math.max(0, 1 - (y - g.yMed) / (g.yClosed - g.yMed))
    scrim.style.opacity = sc.toFixed(3)
  }, [])

  // the drawer transition on the pane, the film and the scrim; off while a finger drives them
  const animate = useCallback((on: boolean) => { layerRef.current?.classList.toggle('is-anim', on) }, [])

  const settle = useCallback((to: SheetHeight) => {
    const g = geo.current
    g.height = to
    sheetRef.current?.classList.toggle('is-medium', to === 'medium')
    if (to === 'medium' && scrollRef.current) scrollRef.current.scrollTop = 0
    grabRef.current?.setAttribute('aria-label', to === 'large' ? 'Shrink' : 'Expand')
    apply(to === 'large' ? 0 : g.yMed)
  }, [apply])

  // Every close the sheet starts itself (the X, the scrim, Escape, a drag) goes down first, then
  // tells the owner, which unmounts it. An owner that closes it directly (a form's Save) unmounts it
  // at once, as it always has.
  const dismiss = useCallback(() => {
    const g = geo.current, layer = layerRef.current
    if (g.closing || !layer) return
    g.closing = true
    layer.classList.add('is-closing')
    if (reducedMotion()) {
      g.timer = window.setTimeout(() => closeRef.current(), 200)
      return
    }
    animate(true)
    apply(g.yClosed)
    g.timer = window.setTimeout(() => closeRef.current(), DRAWER)
  }, [animate, apply])

  // sheet:open and sheet:closed, below: src/main.tsx holds its post-deploy reload while one is
  // mounted, room.ts rests the pools, and Shell steps the dock down.
  useEffect(() => {
    const me = Symbol('sheet')
    const g = geo.current
    openSheets.push(me)
    if (openSheets.length === 1) { lockBody(); window.dispatchEvent(new Event('sheet:open')) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openSheets[openSheets.length - 1] === me) dismiss()
    }
    window.addEventListener('keydown', onKey)
    // Focus moves in, or a keyboard walks the page behind the scrim; and back out on close.
    const previous = document.activeElement as HTMLElement | null
    sheetRef.current?.focus({ preventScroll: true })
    return () => {
      window.clearTimeout(g.timer)
      openSheets.splice(openSheets.indexOf(me), 1)
      if (!openSheets.length) { unlockBody(); window.dispatchEvent(new Event('sheet:closed')) }
      window.removeEventListener('keydown', onKey)
      previous?.focus?.({ preventScroll: true })
    }
  }, [dismiss])

  // ── Opening ─────────────────────────────────────────────────────────────────────────────────
  // From below the screen to its height on the drawer curve, the pane and the scrim together. The
  // pane is never faded in: opacity on the sheet, or on any ancestor, would make it a backdrop root
  // and its glass would show nothing behind it for the length of the fade. Under reduced motion the
  // whole layer fades in over 200ms instead, and for those 200ms the pane is flat; that is the cost.
  useLayoutEffect(() => {
    const layer = layerRef.current, sheet = sheetRef.current
    if (!layer || !sheet) return
    measure()
    if (reducedMotion()) {
      layer.classList.add('is-entering')
      settle(geo.current.height)
      return
    }
    animate(false)
    apply(geo.current.yClosed)
    void sheet.offsetHeight // the closed position is laid out before the transition starts from it
    animate(true)
    settle(geo.current.height)
  }, [animate, apply, measure, settle])

  // a new size (a rotation, the keyboard on some Androids) re-measures and puts the sheet back, still
  useEffect(() => {
    const onResize = () => {
      if (geo.current.closing) return
      measure()
      animate(false)
      apply(geo.current.height === 'large' ? 0 : geo.current.yMed)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [animate, apply, measure])

  // once the pane has arrived, the drawer's class comes off and takes will-change with it (sheet.css),
  // so a pane at rest at medium is drawn at its own scale rather than as a shrunk bitmap; every move
  // puts the class back first
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const onEnd = (e: TransitionEvent) => {
      if (e.target === sheet && e.propertyName === 'transform' && !geo.current.closing) animate(false)
    }
    sheet.addEventListener('transitionend', onEnd)
    return () => sheet.removeEventListener('transitionend', onEnd)
  }, [animate])

  // ── Dragging ────────────────────────────────────────────────────────────────────────────────
  // Direct manipulation, not decorative motion: it must work for everyone, or the grab handle is an
  // affordance that lies. At medium the content does not scroll, so a drag from anywhere on the
  // sheet moves it, up to large or down to close. At large it starts from the head always, and from
  // the scroller only at its top and only downward, so scrolling the sheet never turns into moving
  // it. The title and meta line are the header a thumb actually lands on; they are children of the
  // scroller, so they are armed by the scrollTop-0 rule rather than by a zone of their own.
  useEffect(() => {
    const sheet = sheetRef.current, scroller = scrollRef.current
    if (!sheet || !scroller) return

    let armed = false      // a pointer is down somewhere a drag may start
    let live = false       // intent confirmed: this gesture is ours, the sheet follows the finger
    let fromHandle = false // it may go either way: the head, or anywhere at medium
    let id = -1
    let x0 = 0, y0 = 0, dx = 0, dy = 0
    let s0 = 0             // the sheet's offset when the drag took hold
    let endedAt = -1000    // when the last live drag finished, so its click can be swallowed
    const trail: { t: number, y: number }[] = []   // ring buffer for the release velocity

    const reset = () => { armed = false; live = false; id = -1; dx = 0; dy = 0; trail.length = 0 }

    const down = (e: PointerEvent) => {
      if (armed || geo.current.closing) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const t = e.target as HTMLElement | null
      // fields keep their own gestures, the QR block and the scanner opt out, and the X is a button
      // only; any other control can start a drag, and a drag that moves never becomes its click
      if (!t || t.closest('input,textarea,select,canvas,[data-noswipe],.sheet-x')) return
      const medium = geo.current.height === 'medium'
      const inScroll = !!t.closest('.sheet-scroll')
      if (!medium && inScroll && scroller.scrollTop > 0) return
      armed = true; fromHandle = medium || !inScroll; id = e.pointerId
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
        // from here the sheet moves with the finger, from where it is, with no jump for the 10px
        // the intent test took
        y0 = e.clientY; s0 = geo.current.y
        animate(false)
        try { sheet.setPointerCapture(id) } catch { /* capture is a nicety, not the mechanism */ }
      }
      apply(s0 + (e.clientY - y0))
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
      const wasLive = live
      const v = releaseVelocity(performance.now())
      reset()
      if (!wasLive) return
      endedAt = performance.now()
      const g = geo.current, y = g.y
      let to: SheetHeight | 'close'
      if (v > FLICK_DOWN) to = g.height === 'large' && y < g.yMed ? 'medium' : 'close'
      else if (v < -FLICK_UP) to = 'large'
      else if (y > g.yMed + Math.max(MIN_DROP, (g.yClosed - g.yMed) * DROP_FRACTION)) to = 'close'
      else if (y < g.yMed * 0.5) to = 'large'
      else to = 'medium'
      if (to === 'close') { dismiss(); return }
      animate(true)
      settle(to)
    }

    // A cancel (the browser took the gesture, or the pointer was lost) settles back where it was,
    // never a dismiss: the guest never asked to close.
    const cancel = () => {
      if (!armed) return
      const wasLive = live
      reset()
      if (!wasLive) return
      endedAt = performance.now()
      animate(true)
      settle(geo.current.height)
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
    // whole revert. At medium nothing scrolls, so every armed touch is ours. Non-passive, or
    // preventDefault is a no-op.
    const VETO = 4
    const touchmove = (e: TouchEvent) => {
      if (!armed) return
      const t = e.touches[0]
      const tdy = t ? t.clientY - y0 : dy
      const tdx = t ? t.clientX - x0 : dx
      if (live || fromHandle || (tdy > VETO && tdy >= Math.abs(tdx))) e.preventDefault()
    }

    // A drag that settles would otherwise fire the click of whatever row or button it started on.
    const swallow = (e: MouseEvent) => {
      if (performance.now() - endedAt < 250) { e.stopPropagation(); e.preventDefault(); endedAt = 0 }
    }

    // With a mouse there is no drag to find: the wheel takes a medium sheet to large, and a large one
    // pulled back from its top returns to medium (C).
    const wheel = (e: WheelEvent) => {
      const g = geo.current
      if (g.closing) return
      if (g.height === 'medium' && e.deltaY > 8) { e.preventDefault(); animate(true); settle('large') }
      else if (g.height === 'large' && scroller.scrollTop <= 0 && e.deltaY < -40) { animate(true); settle('medium') }
    }

    sheet.addEventListener('pointerdown', down)
    sheet.addEventListener('pointermove', move)
    sheet.addEventListener('pointerup', up)
    sheet.addEventListener('pointercancel', cancel)
    sheet.addEventListener('touchmove', touchmove, { passive: false })
    sheet.addEventListener('click', swallow, true)
    sheet.addEventListener('wheel', wheel, { passive: false })
    return () => {
      sheet.removeEventListener('pointerdown', down)
      sheet.removeEventListener('pointermove', move)
      sheet.removeEventListener('pointerup', up)
      sheet.removeEventListener('pointercancel', cancel)
      sheet.removeEventListener('touchmove', touchmove)
      sheet.removeEventListener('click', swallow, true)
      sheet.removeEventListener('wheel', wheel)
    }
  }, [animate, apply, dismiss, settle])

  const toggle = () => {
    animate(true)
    settle(geo.current.height === 'large' ? 'medium' : 'large')
  }

  return createPortal(
    // The scrim is a sibling of the pane, not its parent: an ancestor with any opacity would cut the
    // pane's glass off from the screen behind it. A tap on it closes the sheet.
    <div className="sheet-layer" ref={layerRef}>
      <div className="sheet-scrim" ref={scrimRef} aria-hidden onClick={dismiss} />
      <div className="sheet glass" ref={sheetRef} role="dialog" aria-modal tabIndex={-1} aria-labelledby={labelledBy}>
        <i className="sheet-film" ref={filmRef} aria-hidden />
        {wave && <SheetWave />}
        <div className="sheet-head">
          <button type="button" className="sheet-grab" ref={grabRef} aria-label={height === 'large' ? 'Shrink' : 'Expand'} onClick={toggle}>
            <i aria-hidden />
          </button>
          <button type="button" className="sheet-x pressable" aria-label="Close" onClick={dismiss}><IconClose size={18} /></button>
        </div>
        <div className="sheet-scroll" ref={scrollRef}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
