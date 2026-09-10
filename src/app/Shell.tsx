import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Masthead } from './Masthead'
import { Nav } from './Nav'
import { ToastProvider, useToast } from '../ui/Toast'
import './shell.css'

// The other side of a tapped link. The sender never sees the tick — the tap happened on someone
// else's phone — so the next pull that introduces a friend it did not ask for says so, once, as a
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
  return (
    <>
      <div className="ground" aria-hidden />
      {/* Home carries the masthead too. The app's name has to be somewhere for a visitor who arrives
          cold on the landing screen, and Home's rank order is unchanged by it: the greeting is still
          the screen's first content line, with chrome above it exactly as on Drinks, Ship, Crew and
          You. */}
      <Masthead />
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
