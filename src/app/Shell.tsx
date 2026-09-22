import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
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
