import { useEffect, useRef, useState } from 'react'
import { Masthead } from '../../app/Masthead'
import { startRoom } from '../../app/room'
import { activeCruiseId, CRUISES, cruiseById } from '../../data/cruises'
import { hasBackend } from '../../state/backend'
import { useStore } from '../../state/store'
import { GlassButton } from '../../ui/GlassButton'
import { Select } from '../../ui/Select'
import { PrivacySheet } from '../privacy/PrivacySheet'
import { NameFields } from '../social/NameFields'
import { SailingSheet } from './SailingSheet'
import './cruise.css'

function prettyRange(start: string, end: string): string {
  const s = new Date(`${start}T12:00:00`)
  const e = new Date(`${end}T12:00:00`)
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  return sameMonth
    ? `${s.getDate()} to ${e.getDate()} ${e.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
    : `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} to ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

// The first open, and the only one. Three questions on one screen: which sailing, who you are, and
// whether anything may leave the phone. Nothing has gone to the server when this renders, and nothing
// does until Done: sync.ts gates its whole transport on `enteredCruise`, which is what makes the
// consent line below true rather than a description of what happened a moment ago.
// It renders outside Shell, so it brings its own room and its own masthead and has no nav.
export function Entry({ onDone }: { onDone: () => void }) {
  // The room, mounted and run exactly as Shell mounts it: the light by the clock, the pools that
  // drift while the guest is here and rest while a sheet is up. No foot, because there is no tab bar
  // for a row to pass under. Entry, the landing and Shell never mount together, and each hands the
  // layer on in its cleanup, so the room is started once per screen.
  const roomRef = useRef<HTMLDivElement>(null)
  useEffect(() => (roomRef.current ? startRoom(roomRef.current) : undefined), [])
  const setProfile = useStore((s) => s.setProfile)
  const enterCruise = useStore((s) => s.enterCruise)
  // Initialised from the profile, not from empty: a ?entry run over a store that already has a name
  // would otherwise show a blank field beside a name the guest already set.
  const [draft, setDraft] = useState(() => useStore.getState().profile.name)
  const [chosen, setChosen] = useState(() => activeCruiseId())
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [sailingOpen, setSailingOpen] = useState(false)
  // Two branches, and both render: the registry holds the published sailing plus whatever the guest
  // has set up for themselves, so the second appears the moment they make one.
  const many = CRUISES.length > 1
  const cruise = cruiseById(chosen) ?? CRUISES[0]

  // Local and synchronous, both of them, so there is no waiting state and nothing to fail. setProfile
  // runs first because enterCruise reloads the page when the chosen id differs from the persisted
  // one; on a genuine first open the ids match, so the router simply mounts in place and the current
  // URL decides the screen, invite fragment and all.
  const done = () => {
    if (draft.trim()) setProfile({ name: draft.trim() })
    enterCruise(chosen)
    onDone()
  }

  return (
    <>
      {/* the screen renders outside Shell, so it has to bring the room itself: without it the
          gradient, the pools and the grain go and the screen falls back to the room's flat floor
          from body */}
      <div className="room" ref={roomRef} aria-hidden />
      <main className="entry">
        <Masthead />
        <div className="entry-body">
          <div className="wrap entry-in">
            {many ? (
              <header>
                <div className="section-head"><h1 className="t-title">Choose your sailing</h1></div>
                {/* one control at 44px answers a one-of-n question and needs no selected-state
                    colour; AddSheet's "Add a missing drink" is the API this copies. No f-label: the
                    h1 above is the label, the way the single-sailing branch's ship-name h1 needs no
                    field label either; module 3's name and colour keep their labels because they have
                    no h1 of their own. Dropping the doubled label is also what keeps this taller
                    branch off the scroll on a notched phone (docs/DESIGN.md, Entry). The Select keeps
                    its ariaLabel so a screen reader still hears it. */}
                <div className="entry-fields">
                  <div className="f-field">
                    <Select
                      value={chosen}
                      onChange={setChosen}
                      options={CRUISES.map((c) => ({ value: c.id, label: `${c.ship} · ${prettyRange(c.start, c.end)}` }))}
                      ariaLabel="Your sailing"
                    />
                  </div>
                </div>
              </header>
            ) : (
              <header>
                {/* the ship is the h1 and the masthead carries the app's name: the screen's first
                    question is which sailing, and the answer is the thing to name */}
                <div className="section-head"><h1 className="t-title">{cruise.ship}</h1></div>
                <p className="t-meta tnum">{cruise.line} · {prettyRange(cruise.start, cruise.end)}</p>
              </header>
            )}

            {/* One row beneath module 2, in its own wrapper div for the reason the privacy row has
                one: .row:not(:only-child) (base.css) squares a row with siblings, and wrapped it
                keeps the control radius and its press tint. It is the privacy row's shape rather
                than Crew's group row, because it is on this screen and two rows on one screen must
                read the same way; that is also why it carries no chevron. .cruise-byo carries no style of
                its own and exists so the QA shot can click it. One line: "your own sailing" says
                what it is, and on the single-sailing branch there is no list for a second line to
                point at. */}
            <div>
              <button
                type="button"
                className="row pressable cruise-byo"
                aria-haspopup="dialog"
                onClick={() => setSailingOpen(true)}
              >
                <span className="row-copy">
                  <span className="t-strong">Set up your own sailing</span>
                </span>
              </button>
            </div>

            {/* on the room, not in a panel: the sibling is ProfileSheet, whose identical pair sits
                flat on the sheet. NameCard keeps its panel on Crew because it sits among other
                content there; here the form is the screen, and a box around the only thing present is
                the fourth banned tell */}
            <div className="entry-fields">
              <NameFields draft={draft} onDraft={setDraft} />
            </div>

            <p className="t-body">Tick off, rate and log the cocktails aboard, and see what your crew has found. It works offline.</p>

            {/* The region is eu-west-2, which is London, so the line says London: "in the EU" of a
                London region would be inaccurate, and honest is one of the four qualities. It does not
                say "nothing is tracked" either, because Cloudflare and Supabase both keep ordinary
                server logs with IP addresses in them, which the note two taps away says. */}
            <p className="t-meta">
              {hasBackend()
                ? 'Done turns on sync: your name, colour and the drinks you log go to this app’s own server in London, under your friend code. No sign-in needed, no analytics, no advertising. Delete it all from Your details at any time.'
                : 'This version of the app has no server, so nothing leaves this phone.'}
            </p>

            {/* in its own wrapper so .row:not(:only-child) (base.css) does not square its corners: an
                isolated row keeps the control radius. The same row and class go into ProfileSheet, so
                the note is reached the same way in both places. One deliberate difference: here the row is one
                line, without PRIVACY_SUBTITLE, because the consent line directly above already says
                what leaves the phone and how to remove it. ProfileSheet has no such line, so its row
                keeps the subtitle. */}
            <div>
              <button
                type="button"
                className="row pressable privacy-open"
                aria-haspopup="dialog"
                onClick={() => setPrivacyOpen(true)}
              >
                <span className="row-copy">
                  <span className="t-strong">Privacy note</span>
                </span>
              </button>
            </div>

            {/* always enabled: a name is optional here, because the app has never required one to log
                a drink, and /add, /join and Crew each still ask before anything of yours goes out
                under a name. The screen's one filled control, C's wide button at the foot, as the
                add sheet's Add it is; there is no dock here, so no Log to be the coral one instead */}
            <GlassButton variant="primary" size="lg" block type="button" className="entry-done" onClick={done}>Done</GlassButton>
          </div>
        </div>
      </main>
      {privacyOpen && <PrivacySheet onClose={() => setPrivacyOpen(false)} />}
      {sailingOpen && <SailingSheet onClose={() => setSailingOpen(false)} />}
    </>
  )
}
