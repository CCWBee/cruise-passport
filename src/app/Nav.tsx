import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { IconClose, IconSearch } from '../ui/Icon'
import { openLog, registerLogField, useLogSearch } from '../features/search/log'
import { TABS, tabOf } from './tabs'
import { useSettled } from './useSettled'
import './nav.css'

// The dock: prototype C's floating capsule of the five tabs, the droplet that marks the one you are
// on, and Log at the trailing end, which opens the search and becomes its field (docs/DESIGN.md,
// Navigation). Every piece is the glass engine's; what moves, moves on transform, clip-path on the
// filtered layers, or opacity on a child, never width on a backdrop-filtered element.

// A drag along the capsule commits after 6px across (C), so a tap that shifts a pixel is still a tap.
const DRAG_START = 6
// A's run: 480ms on a linear timeline, each segment eased on its own (below)
const RUN_MS = 480
// how long after a drag the click it would fire is swallowed (Sheet.tsx uses the same)
const SWALLOW_MS = 250
// --t-drawer: the fold, and the step down under a sheet. A piece that is hidden once it has run
// drops its filters (.glass-off, useSettled), so the budget counts only glass that paints.
const DRAWER_MS = 440

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Where the bead is drawn now, mid-run or mid-drag: the x of its computed translate. Read before a
// run is cancelled, so the next one starts from where the eye last saw it rather than jumping.
//
// The bead's place is the `translate` property and its stretch is `transform`, never one transform
// that carries both. The CSS `scale` property (the compact dock's wider bead, the lift under a
// thumb) applies after `transform` and before `translate`, so a translateX inside `transform` was
// scaled with the bead: at 320 the 1.14 put the bead on "You" 28px to the right, half under Log (the
// polish-two sweep, 23 September 2026). `translate` is outside the scale, so the bead lands on its tab.
function drawnX(el: HTMLElement): number {
  const t = getComputedStyle(el).translate
  const x = !t || t === 'none' ? 0 : parseFloat(t)
  return Number.isFinite(x) ? x : 0
}

// The touch light follows the finger (base.css, .spec)
function lightAt(el: HTMLElement, e: PointerEvent) {
  const r = el.getBoundingClientRect()
  el.style.setProperty('--lx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`)
  el.style.setProperty('--ly', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`)
}

export function Nav({ down }: { down: boolean }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const open = useLogSearch((s) => s.open)
  const q = useLogSearch((s) => s.q)
  const setQ = useLogSearch((s) => s.setQ)
  const close = useLogSearch((s) => s.close)
  const active = tabOf(pathname)
  // the tab whose label sits on the bead: the active one, or the one under a dragged bead
  const [under, setUnder] = useState(-1)
  const lit = under > -1 ? under : active

  const barRef = useRef<HTMLElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const beadRef = useRef<HTMLElement>(null)
  const fieldRef = useRef<HTMLInputElement>(null)
  // where the bead comes to rest, as its style translate says; the route effect skips a run to the
  // place a drag has already sent it
  const restX = useRef<number | null>(null)
  const activeRef = useRef(active)
  activeRef.current = active
  const downRef = useRef(down)
  downRef.current = down

  const slot = useCallback((i: number) => {
    const t = tabsRef.current?.children[i] as HTMLElement | undefined
    return t ? { x: t.offsetLeft, w: t.offsetWidth } : null
  }, [])

  // ── the droplet ─────────────────────────────────────────────────────────────────────────────
  // It slides to the tab and swells on the way (A's liquid morph, prototype A, a.js 956 to 966): the
  // keyframes are eased segment by segment on a linear timeline, because one easing over the whole
  // run squeezed the swell into its first 60ms, where no thumb sees it; this way the 1.22 by 1.08
  // stretch peaks at 45% of the run, overshoots the tab by 4% and settles. Any run already going is
  // cancelled first, from where it is, so quick taps never stack.
  const place = useCallback((i: number, animate: boolean, fromX?: number) => {
    const bead = beadRef.current
    const s = slot(i)
    if (!bead || !s) return
    const from = fromX ?? drawnX(bead)
    bead.getAnimations().forEach((a) => a.cancel())
    const to = s.x
    restX.current = to
    bead.style.width = `${s.w}px`
    bead.style.translate = `${to}px 0`
    bead.style.transform = ''
    if (!animate || Math.abs(to - from) < 1) return
    if (reducedMotion()) {
      bead.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' })
      return
    }
    const mid = (from + to) / 2
    bead.animate([
      { translate: `${from}px 0`, transform: 'scale(1, 1)', easing: 'cubic-bezier(.3, .5, .5, 1)' },
      { translate: `${mid}px 0`, transform: 'scale(1.22, 1.08)', offset: 0.45, easing: 'cubic-bezier(.2, .7, .3, 1)' },
      { translate: `${to - (to - from) * -0.04}px 0`, transform: 'scale(.97, 1.02)', offset: 0.8, easing: 'ease-out' },
      { translate: `${to}px 0`, transform: 'scale(1, 1)' },
    ], { duration: RUN_MS, easing: 'linear' })
  }, [slot])

  // the route moves it: a tap on a tab, a link from a screen, the back button
  const placed = useRef(false)
  useLayoutEffect(() => {
    if (active < 0) return
    const s = slot(active)
    if (placed.current && s && restX.current !== null && Math.abs(restX.current - s.x) < 1) return
    place(active, placed.current)
    placed.current = true
  }, [active, place, slot])

  // a new width (a rotation, the compact dock) re-measures the slots and puts the bead back, still
  useEffect(() => {
    const tabs = tabsRef.current
    if (!tabs || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => { if (activeRef.current > -1) place(activeRef.current, false) })
    ro.observe(tabs)
    return () => ro.disconnect()
  }, [place])

  // ── dragging along the capsule ──────────────────────────────────────────────────────────────
  // The bead follows the finger, stretched a little, and lands on the nearest tab when it lets go
  // (C). A tap is left to the link under it, and the route moves the bead; only a drag navigates
  // from here, and the click it would fire is swallowed.
  useEffect(() => {
    const bar = barRef.current, bead = beadRef.current
    if (!bar || !bead) return
    let g: { id: number; x0: number; start: number; x: number; moved: boolean } | null = null
    let endedAt = -1000

    const nearest = (x: number) => {
      let best = 0, gap = Infinity
      for (let i = 0; i < TABS.length; i++) {
        const s = slot(i)
        if (s && Math.abs(s.x - x) < gap) { gap = Math.abs(s.x - x); best = i }
      }
      return best
    }
    const end = () => { bar.classList.remove('is-touching', 'is-dragging'); setUnder(-1) }

    const down = (e: PointerEvent) => {
      if (g || useLogSearch.getState().open) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const x = drawnX(bead)
      g = { id: e.pointerId, x0: e.clientX, start: x, x, moved: false }
      bar.classList.add('is-touching')
      lightAt(bar, e)
    }
    const move = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return
      lightAt(bar, e)
      const dx = e.clientX - g.x0
      if (!g.moved) {
        if (Math.abs(dx) < DRAG_START || activeRef.current < 0) return
        g.moved = true
        bead.getAnimations().forEach((a) => a.cancel())
        bar.classList.add('is-dragging')
        try { bar.setPointerCapture(g.id) } catch { /* capture is a nicety, not the mechanism */ }
      }
      const last = slot(TABS.length - 1)?.x ?? 0
      g.x = Math.max(0, Math.min(last, g.start + dx))
      bead.style.translate = `${g.x}px 0`
      bead.style.transform = 'scale(1.16, 1.08)'
      setUnder(nearest(g.x))
    }
    const up = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return
      const was = g
      g = null
      end()
      if (!was.moved) return
      endedAt = performance.now()
      const i = e.type === 'pointercancel' ? activeRef.current : nearest(was.x)
      place(i, true, was.x)
      if (i !== activeRef.current) navigate(TABS[i].to)
    }
    const swallow = (e: MouseEvent) => {
      if (performance.now() - endedAt < SWALLOW_MS) { e.preventDefault(); e.stopPropagation(); endedAt = -1000 }
    }

    bar.addEventListener('pointerdown', down)
    bar.addEventListener('pointermove', move)
    bar.addEventListener('pointerup', up)
    bar.addEventListener('pointercancel', up)
    bar.addEventListener('click', swallow, true)
    return () => {
      bar.removeEventListener('pointerdown', down)
      bar.removeEventListener('pointermove', move)
      bar.removeEventListener('pointerup', up)
      bar.removeEventListener('pointercancel', up)
      bar.removeEventListener('click', swallow, true)
    }
  }, [navigate, place, slot])

  // ── the search field ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    registerLogField(fieldRef.current)
    return () => registerLogField(null)
  }, [])

  const shut = useCallback(() => {
    fieldRef.current?.blur()
    close()
  }, [close])

  // a route change (a tab, a link in a result's sheet) ends the search; so does Escape, when no
  // sheet is above it to take the key first
  useEffect(() => { if (useLogSearch.getState().open) shut() }, [pathname, shut])
  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape' && !downRef.current) shut() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, shut])

  // The field and the return button ride above the keyboard (C): the layout viewport does not shrink
  // for it on iOS, so the height it takes is read off visualViewport and handed to the dock (and to the
  // search's scroller, so its last row can scroll clear) as --kb.
  useEffect(() => {
    const vv = window.visualViewport
    const root = document.documentElement
    if (!open || !vv) return
    const lift = () => {
      const kb = window.innerHeight - vv.height - vv.offsetTop
      if (kb > 80) root.style.setProperty('--kb', `${Math.round(kb)}px`)
      else root.style.removeProperty('--kb')
    }
    vv.addEventListener('resize', lift)
    vv.addEventListener('scroll', lift)
    lift()
    return () => {
      vv.removeEventListener('resize', lift)
      vv.removeEventListener('scroll', lift)
      root.style.removeProperty('--kb')
    }
  }, [open])

  const onFieldKey = (e: KeyboardEvent<HTMLInputElement>) => {
    // Search on the keyboard puts it away, so the results can be read
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  const from = active > -1 ? TABS[active] : null
  const Back = from?.Icon
  // the pieces the fold has hidden, and the whole dock once it has stepped down under a sheet
  const pairOff = useSettled(!open, DRAWER_MS)
  const restOff = useSettled(open, DRAWER_MS)
  const dockOff = useSettled(down, DRAWER_MS)
  const off = (hidden: boolean) => (hidden ? ' glass-off' : '')

  return (
    <div className={'dock' + (open ? ' is-search' : '') + (down ? ' is-down' : '') + off(dockOff)}>
      <nav
        className={'tabbar glass' + (active < 0 ? ' no-tab' : '') + off(restOff)}
        ref={barRef}
        aria-label="Sections"
        aria-hidden={open || undefined}
      >
        <i className="spec" aria-hidden />
        <i className="droplet" ref={beadRef} aria-hidden />
        <div className="tabs" ref={tabsRef}>
          {TABS.map(({ to, label, Icon }, i) => (
            <NavLink
              key={to}
              to={to}
              className={'tab' + (i === lit ? ' is-under' : '')}
              aria-current={i === active ? 'page' : undefined}
              tabIndex={open ? -1 : undefined}
              onClick={() => {
                // the tab you are on, tapped again, goes back to its top
                if (i === activeRef.current) window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
              }}
            >
              <Icon size={25} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* the capsule folded: one round button, the tab you came from, that closes the search */}
      <button
        type="button"
        className={'tab-return glass press' + off(pairOff)}
        aria-label={from ? `Close search and go back to ${from.label}` : 'Close search'}
        aria-hidden={!open || undefined}
        tabIndex={open ? 0 : -1}
        onClick={shut}
      >
        <i className="spec" aria-hidden />
        {Back ? <Back size={25} /> : <IconClose size={22} />}
      </button>

      {/* Log: the one tinted glass, a magnifier and the word, because what it opens is a search (A
          and B; C's bare plus said "add"). The tap focuses the field inside itself (openLog). */}
      <button
        type="button"
        className={'logbtn glass glass-tint press' + off(restOff)}
        aria-label="Log a drink"
        aria-hidden={open || undefined}
        tabIndex={open ? -1 : 0}
        onClick={openLog}
      >
        <i className="spec" aria-hidden />
        <span className="log-face">
          <IconSearch size={24} />
          <span>Log</span>
        </span>
      </button>

      {/* The field Log becomes. It is always in the page and focusable, only transparent and
          untouchable while closed, because a field that is hidden cannot take focus inside the tap. */}
      <div className={'logfield glass' + off(pairOff)} aria-hidden={!open || undefined}>
        <IconSearch size={20} className="logfield-icon" />
        <input
          ref={fieldRef}
          className="logfield-input"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Drink, bar or spirit"
          aria-label="Search drinks to log"
          tabIndex={open ? 0 : -1}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onFieldKey}
        />
        {q && (
          <button
            type="button"
            className="logfield-clear pressable"
            aria-label="Clear search"
            onClick={() => { setQ(''); fieldRef.current?.focus() }}
          >
            <IconClose size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
