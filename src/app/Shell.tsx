import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { IconDrinks } from '../ui/Icon'
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
  const { pathname } = useLocation()
  const home = pathname === '/'
  return (
    <>
      <div className="ground" aria-hidden />
      {!home && (
        <header className="app-head">
          <div className="wrap app-head-in">
            <span className="brand" aria-hidden><IconDrinks size={19} /></span>
            <span className="brand-name">Cocktail Passport</span>
          </div>
        </header>
      )}
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
