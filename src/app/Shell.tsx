import { Outlet, useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { IconDrinks } from '../ui/Icon'
import { ToastProvider } from '../ui/Toast'
import './shell.css'

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
          <Outlet />
        </ToastProvider>
      </main>
      <Nav />
    </>
  )
}
