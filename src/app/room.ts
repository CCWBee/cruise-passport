// The room the app sits in, by the clock (docs/DESIGN.md, Material). Three rooms over the six parts
// of the day that already key the sea's sky and Home's greeting, so the three never disagree: day is
// morning and afternoon, evening is golden hour and dusk, night is night and dawn. The room is set as
// data-room on <html>, first by the inline script in index.html before the first paint (which has
// to repeat these boundaries, because it runs before any module), then here: again at every boundary
// on a timer, and when the page comes back into view.
//
// This file also owns the room layer's behaviour: the 600ms cross-fade at a boundary, and when the
// pools may drift. They drift for about 20 seconds after the guest last scrolled or touched, and
// rest when the page is hidden, while a sheet is up, and (in CSS) under reduced motion.
import { dayPart } from '../state/stats'
import { nowHour } from '../data/model'
import { isSheetUp } from '../ui/Sheet'

export type Room = 'day' | 'evening' | 'night'

/** The room for a local hour, over `dayPart()`'s boundaries: 7 to 17 day, 17 to 21 evening,
 *  21 to 7 night. */
export function roomFor(hour: number): Room {
  const part = dayPart(hour)
  if (part === 'morning' || part === 'afternoon') return 'day'
  if (part === 'golden' || part === 'dusk') return 'evening'
  return 'night'
}

/** Milliseconds from `now` to the next hour at which the room changes, found by walking the hours
 *  rather than restating the boundaries, so a change to `dayPart()` moves the timer with it. */
export function msToNextRoom(now: Date): number {
  const here = roomFor(now.getHours())
  const next = new Date(now)
  next.setMinutes(0, 0, 0)
  for (let step = 1; step <= 24; step += 1) {
    next.setHours(next.getHours() + 1)
    if (roomFor(next.getHours()) !== here) break
  }
  return Math.max(1000, next.getTime() - now.getTime())
}

// what each room tells the browser: native controls light or dark, and the status bar's colour
// (the top of the room, tokens.css --room-0)
const SCHEME: Record<Room, 'light' | 'dark'> = { day: 'light', evening: 'dark', night: 'dark' }
const THEME: Record<Room, string> = { day: '#DCEBF4', evening: '#1A1830', night: '#0B1222' }

const FADE_MS = 600
const IDLE_MS = 20000

// ?hour= pins the room for QA from the load that carries it, not only while the address does: the
// app's own links drop the query, and the next visibilitychange then put a night render into the
// day room (Brave, /you to /badges at hour 23, 23 September 2026). Read once, with nowHour()'s test.
const PINNED: number | null = (() => {
  if (typeof location === 'undefined') return null
  const raw = new URLSearchParams(location.search).get('hour')
  return raw && /^\d{1,2}$/.test(raw) && Number(raw) <= 23 ? Number(raw) : null
})()
const roomHour = () => PINNED ?? nowHour()

function setDocumentRoom(room: Room) {
  const root = document.documentElement
  root.dataset.room = room
  root.style.colorScheme = SCHEME[room]
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', SCHEME[room])
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME[room])
}

function currentRoom(): Room {
  const set = document.documentElement.dataset.room
  return set === 'day' || set === 'evening' || set === 'night' ? set : roomFor(roomHour())
}

function makeLight(room: Room): HTMLDivElement {
  const light = document.createElement('div')
  light.className = 'room-light'
  light.dataset.room = room
  for (const name of ['a', 'b', 'c']) {
    const pool = document.createElement('i')
    pool.className = `pool pool-${name}`
    light.appendChild(pool)
  }
  return light
}

let layer: HTMLElement | null = null

/** Put the app in `room`. With the layer mounted and a real change, the new room fades in over the
 *  old one on the layer's opacity; the ink and the controls change half way through, when the two
 *  lights are level, rather than at the start, where light type would sit on a still-light sky. */
export function applyRoom(room: Room = roomFor(roomHour())) {
  if (room === currentRoom() && document.documentElement.dataset.room) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!layer || reduced) {
    setDocumentRoom(room)
    layer?.querySelectorAll('.room-light').forEach((el) => { (el as HTMLElement).dataset.room = room })
    return
  }
  const outgoing = Array.from(layer.querySelectorAll<HTMLElement>('.room-light'))
  const incoming = makeLight(room)
  incoming.classList.add('is-arriving')
  layer.appendChild(incoming)
  // one frame with the incoming light at 0, so the opacity has somewhere to transition from
  void incoming.offsetWidth
  incoming.classList.remove('is-arriving')
  window.setTimeout(() => setDocumentRoom(room), FADE_MS / 2)
  window.setTimeout(() => outgoing.forEach((el) => el.remove()), FADE_MS + 50)
}

/** Mount the room layer into `el` (Shell's `.room`) and run it: the boundary timer, the drift while
 *  the guest is using the app, the rests. Returns the cleanup. */
export function startRoom(el: HTMLElement): () => void {
  layer = el
  el.replaceChildren(makeLight(currentRoom()))
  applyRoom()

  let boundary = 0
  const arm = () => {
    window.clearTimeout(boundary)
    boundary = window.setTimeout(() => { applyRoom(); arm() }, msToNextRoom(new Date()))
  }
  arm()

  // Drift: live while the guest is here and nothing covers the room. Activity only stamps the time;
  // one timer checks it when it comes due, so a stream of pointermoves costs no timer churn.
  let lastActive = 0
  let idle = 0
  // a sheet opened by a deep link mounted in Shell's commit and sent 'sheet:open' before this ran
  let sheets = isSheetUp()
  const live = () => !document.hidden && !sheets && performance.now() - lastActive < IDLE_MS
  const update = () => { el.classList.toggle('is-live', live()) }
  const check = () => {
    idle = 0
    update()
    const left = IDLE_MS - (performance.now() - lastActive)
    if (left > 0 && !document.hidden) idle = window.setTimeout(check, left + 50)
  }
  const active = () => {
    lastActive = performance.now()
    if (!idle) check()
  }
  const onVisible = () => {
    if (!document.hidden) { applyRoom(); arm(); active() } else update()
  }
  const onSheetOpen = () => { sheets = true; update() }
  const onSheetClosed = () => { sheets = false; active() }

  const opts: AddEventListenerOptions = { capture: true, passive: true }
  // scroll does not bubble from the screens' own scrollers, so it is heard in the capture phase
  const events = ['scroll', 'pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart'] as const
  events.forEach((type) => window.addEventListener(type, active, opts))
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('sheet:open', onSheetOpen)
  window.addEventListener('sheet:closed', onSheetClosed)
  active()

  return () => {
    window.clearTimeout(boundary)
    window.clearTimeout(idle)
    events.forEach((type) => window.removeEventListener(type, active, opts))
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('sheet:open', onSheetOpen)
    window.removeEventListener('sheet:closed', onSheetClosed)
    el.classList.remove('is-live')
    if (layer === el) layer = null
  }
}
