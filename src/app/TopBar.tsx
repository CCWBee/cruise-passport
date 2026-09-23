import { useEffect, useState, type RefObject } from 'react'

// Past this much scroll the large title has gone under the status bar, and the bar takes it (C).
const FOLD = 46

// The scroll edge: a screen's large title folds into a strip of glass at the top once it has scrolled
// away (prototype C's top bar, built as B's; shell.css has the recipe). It watches the page, or the
// scroller it is given (the search's), and says the title again at body size. It is chrome and not
// read out: the large title it repeats is the screen's heading. `off` takes it away while a sheet is
// up, so the glass on screen is the sheet's.
export function TopBar({ title, scroller, off = false }: {
  title: string
  scroller?: RefObject<HTMLElement | null>
  off?: boolean
}) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = scroller?.current ?? null
    const target: HTMLElement | Window = el ?? window
    let raf = 0
    const check = () => {
      raf = 0
      setShown((el ? el.scrollTop : window.scrollY) > FOLD)
    }
    // one read a frame, however fast the scroll events come
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check) }
    target.addEventListener('scroll', onScroll, { passive: true })
    check()
    return () => {
      target.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [scroller])
  return (
    <header className={'topbar glass' + (shown && !off ? ' is-shown' : '')} aria-hidden>
      <span className="topbar-title">{title}</span>
    </header>
  )
}
