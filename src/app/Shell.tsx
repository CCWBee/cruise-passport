import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { TopBar } from './TopBar'
import { useTopBarTitle } from './screenTitle'
import { TABS, tabOf } from './tabs'
import { ToastProvider, useToast } from '../ui/Toast'
import { SearchOverlay } from '../features/search/SearchOverlay'
import { useLogSearch } from '../features/search/log'
import { startRoom } from './room'
import { isSheetUp } from '../ui/Sheet'
import { useSettled } from './useSettled'
import './shell.css'

// .view.is-covered's fade (shell.css)
const COVER_MS = 160

// The other side of a tapped link. The sender never sees the tick (the tap happened on someone
// else's phone), so the next pull that introduces a friend it did not ask for says so, once, as a
// toast. sync.ts decides what counts (docs/DESIGN.md, Crew); this only reports it.
function CrewToasts() {
  const toast = useToast()
  useEffect(() => {
    const onAdded = (event: Event) => {
      const name = (event as CustomEvent<{ name?: string }>).detail?.name?.trim()
      toast({ title: `${name || 'A friend'} added you`, tone: 'success' })
    }
    window.addEventListener('crew:added', onAdded)
    return () => window.removeEventListener('crew:added', onAdded)
  }, [toast])
  return null
}

// Whether a sheet is up, from the events Sheet.tsx sends: the dock steps down under it and the top
// bar leaves, so the glass on screen is the sheet's. A sheet opened by a deep link mounts in the same
// commit as Shell and sends its event before this effect subscribes, so the state is read once after.
function useSheetUp() {
  const [up, setUp] = useState(false)
  useEffect(() => {
    const on = () => setUp(true)
    const off = () => setUp(false)
    window.addEventListener('sheet:open', on)
    window.addEventListener('sheet:closed', off)
    if (isSheetUp()) setUp(true)
    return () => {
      window.removeEventListener('sheet:open', on)
      window.removeEventListener('sheet:closed', off)
    }
  }, [])
  return up
}

export function Shell() {
  // The room the tabs sit in (room.ts): the light by the clock, the pools that drift while the guest
  // is here. The foot is a still copy of the room's floor over the content's last 110px, so a row
  // dissolves into the room as it goes under the tab bar instead of showing through beside it.
  const roomRef = useRef<HTMLDivElement>(null)
  useEffect(() => (roomRef.current ? startRoom(roomRef.current) : undefined), [])
  const { pathname } = useLocation()
  const searching = useLogSearch((s) => s.open)
  // the screen under the search, once its 160ms fade has run, drops any glass it holds (Home's sea
  // chips) with .glass-off, so the budget counts only glass that paints
  const covered = useSettled(searching, COVER_MS)
  const title = useTopBarTitle((s) => s.title)
  const sheetUp = useSheetUp()
  // A screen is keyed by its tab, so moving between tabs mounts the new one fresh and it fades in,
  // while You's three segments, one tab, change in place without the rise.
  const tab = tabOf(pathname)
  const screen = tab > -1 ? `tab-${tab}` : pathname
  return (
    // The toasts wrap the whole shell: the search logs drinks from over the screen and says so.
    <ToastProvider>
      <div className="room" ref={roomRef} aria-hidden />
      <div className="room-foot" aria-hidden />
      {/* No masthead here: every cold visitor meets Entry or the landing first (App.tsx), and both
          carry it. Inside the tabs the guest knows which app this is, and the first line of each
          screen is its own. While the search is up the screen stays mounted under it, hidden, so
          closing the search puts the guest back where they were, scrolled where they were. */}
      <main className={'view' + (searching ? ' is-covered' : '') + (covered ? ' glass-off' : '')} aria-hidden={searching || undefined}>
        <CrewToasts />
        <div className="screen" key={screen}>
          <Outlet />
        </div>
      </main>
      {!searching && <TopBar key={screen} title={title || (tab > -1 ? TABS[tab].label : '')} off={sheetUp} />}
      {searching && <SearchOverlay sheetUp={sheetUp} />}
      <Nav down={sheetUp} />
    </ToastProvider>
  )
}
