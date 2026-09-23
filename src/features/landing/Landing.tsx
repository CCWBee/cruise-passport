import { useEffect, useMemo, useRef } from 'react'
import { Masthead } from '../../app/Masthead'
import { startRoom } from '../../app/room'
import { isDesktopVisitor } from '../../data/model'
import { Qr } from '../../ui/Qr'
import './landing.css'

// The price slot. Charles has not decided what is sold or for how much (product brief, E, and the
// open question at the foot of this spec's own file), so this is null and the module does not render.
// Setting it to a sentence is the only change needed; nothing else on the screen moves. It never
// carries a number that has not been decided, and it never says "free" either: zero is a price too.
// The shape, so the decision is a number rather than a blank page:
//   'One passport per sailing, £__, paid once.'
// Anything beyond the amount and how often (what happens after, advertising, refunds) is a promise
// about the business, so it is his sentence to write, not one to draft for him.
const PRICE_LINE: string | null = null

// isDesktopVisitor() decides which branch renders. It lives in src/data/model.ts beside the other QA
// overrides, so this file only exports its component (react(only-export-components)).

// The desktop dead end, removed: a laptop visitor is handed the app on the phone in their pocket
// rather than a first-open screen asking for a name and a colour on a machine that will never be
// carried to a bar. It renders at / for a desktop first open and at /get for anybody, so it brings
// its own room and its own masthead and has no nav, exactly as the entry screen does.
// Nothing here collects, sends or stores anything: the code is drawn from a bundled generator, the
// address comes from location, and the copy is static. There is no state to keep.
export function Landing({ onContinue, continueLabel }: { onContinue: () => void; continueLabel: string }) {
  // The room, mounted and run as Shell and the entry screen mount it (Entry.tsx says why there is no
  // foot). On a laptop it is the same light by the clock the phone will show.
  const roomRef = useRef<HTMLDivElement>(null)
  useEffect(() => (roomRef.current ? startRoom(roomRef.current) : undefined), [])
  // Built the way the add sheet builds its share link: origin plus Vite's base, never a hardcoded
  // host, so a preview encodes the preview and the dev server encodes 127.0.0.1. The address line is
  // the display form of the same value, and the branch is there so the two cannot drift if `base`
  // ever stops being '/'.
  const { value, address } = useMemo(() => {
    const base = import.meta.env.BASE_URL
    return { value: `${location.origin}${base}`, address: location.host + (base === '/' ? '' : base) }
  }, [])
  // Reachable only through /get inside the installed app, where the manifest declares standalone.
  const installed = typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches

  return (
    <>
      {/* outside Shell, so it has to bring the room itself: without it the gradient, the pools and
          the grain go and the screen falls back to the room's flat floor from body */}
      <div className="room" ref={roomRef} aria-hidden />
      <main className="landing">
        <Masthead />
        <div className="landing-body">
          <div className="wrap">
            <header className="landing-head">
              <h1 className="t-title">A drinks logbook for your sailing</h1>
              {/* the entry screen's "what this is" line, character for character out of Entry.tsx, so
                  the two screens a cold visitor can land on answer "what is this" identically */}
              <p className="muted t-body">Tick off, rate and log the cocktails aboard, and see what your crew has found. It works offline.</p>
            </header>

            {/* the dominant element, and the reason the screen exists. Absent on a phone: a code of
                the address the phone is already on tells it nothing. */}
            {isDesktopVisitor() && (
              <section className="section">
                <div className="section-head"><h2 className="t-h2">Open it on your phone</h2></div>
                <div className="landing-code">
                  <p className="t-meta">Point your phone’s camera at this code.</p>
                  {/* the label is the only thing that tells a screen reader this code from an add
                      code or a group invite (Qr's own comment). The plate hides itself if the value
                      will not encode, and the address below is always real, selectable text, so
                      there is a route to the app whether the code draws or not. */}
                  <div className="panel qr-plate">
                    <Qr value={value} size={200} label="Scan to open the Cocktail Passport on your phone" />
                  </div>
                  <p className="t-meta tnum landing-addr">{address}</p>
                </div>
              </section>
            )}

            <section className="section">
              <div className="section-head"><h2 className="t-h2">Add it to your home screen</h2></div>
              {installed ? (
                <p className="t-body">It is already on your home screen.</p>
              ) : (
                <>
                  {/* .line and not .row: these are instructions, not controls. No press tint, no
                      tabstop, no aria-haspopup; the single hairline between them is base.css's. */}
                  <div className="line">
                    <div className="landing-step">
                      <span className="t-strong">On iPhone</span>
                      <span className="t-meta">In Safari, tap the share button, then Add to Home Screen.</span>
                    </div>
                  </div>
                  <div className="line">
                    <div className="landing-step">
                      <span className="t-strong">On Android</span>
                      <span className="t-meta">In Chrome, tap the menu, then Install app.</span>
                    </div>
                  </div>
                  {/* "Cocktails" is the name in index.html and the manifest: the one concrete fact a
                      guest needs to find it again. "Add to Home Screen" and "Install app" keep their
                      capitals because they are the labels on the platforms' own menus, quoted. */}
                  <p className="t-meta landing-note">It saves as Cocktails.</p>
                </>
              )}
            </section>

            {/* price is the last thing a visitor needs and the first thing that would cheapen the
                screen if it led. Empty until Charles rules, and absent rather than empty. */}
            {PRICE_LINE && <p className="t-meta landing-price">{PRICE_LINE}</p>}

            {/* the way on, and the screen's only control. The label is a prop because the caller
                knows which path it is on: the gate opens the entry screen, /get opens the passport. */}
            <button type="button" className="quiet-action" onClick={onContinue}>{continueLabel}</button>
          </div>
        </div>
      </main>
    </>
  )
}
