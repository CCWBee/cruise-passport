import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Nav } from './Nav'
import { ToastProvider, useToast } from '../ui/Toast'
import { startRoom } from './room'
import './shell.css'

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

export function Shell() {
  // The room the tabs sit in (room.ts): the light by the clock, the pools that drift while the guest
  // is here. The foot is a still copy of the room's floor over the content's last 110px, so a row
  // dissolves into the room as it goes under the tab bar instead of showing through beside it.
  const roomRef = useRef<HTMLDivElement>(null)
  useEffect(() => (roomRef.current ? startRoom(roomRef.current) : undefined), [])
  return (
    <>
      <div className="room" ref={roomRef} aria-hidden />
      <div className="room-foot" aria-hidden />
      {/* No masthead here: every cold visitor meets Entry or the landing first (App.tsx), and both
          carry it. Inside the tabs the guest knows which app this is, and the first line of each
          screen is its own. */}
      <main className="view">
        <ToastProvider>
          <CrewToasts />
          <Outlet />
        </ToastProvider>
      </main>
      <Nav />
    </>
  )
}
