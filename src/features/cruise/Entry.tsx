import { useState } from 'react'
import { Masthead } from '../../app/Masthead'
import { activeCruiseId, CRUISES, cruiseById } from '../../data/cruises'
import { hasBackend } from '../../state/backend'
import { useStore } from '../../state/store'
import { Select } from '../../ui/Select'
import { PrivacySheet, PRIVACY_SUBTITLE } from '../privacy/PrivacySheet'
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
// It renders outside Shell, so it brings its own ground and its own masthead and has no nav.
export function Entry({ onDone }: { onDone: () => void }) {
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
      {/* the screen renders outside Shell, so it has to bring the ground itself: without it the two
          washes and the grain go and the screen falls back to flat --cream from body */}
      <div className="ground" aria-hidden />
      <main className="entry">
        <Masthead />
        <div className="entry-body">
          <div className="wrap entry-in">
            {many ? (
              <header>
                <div className="section-head"><h1 className="t-title">Choose your sailing</h1></div>
                {/* one control at 44px answers a one-of-n question and needs no selected-state
                    colour; AddSheet's "Add a missing drink" is the API this copies */}
                <div className="entry-fields">
                  <div className="f-field">
                    <span className="f-label">Your sailing</span>
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
                keeps radius 12 and its press tint. It is the privacy row's shape rather than Crew's
                group row, because it is on this screen and two rows on one screen must read the
                same way; that is also why it carries no chevron. .cruise-byo carries no style of
                its own and exists so the QA shot can click it. The copy does not change between the
                two module-2 branches: "not on this list" is true of a one-line block as much as of
                a two-option Select. */}
            <div>
              <button
                type="button"
                className="row pressable cruise-byo"
                aria-haspopup="dialog"
                onClick={() => setSailingOpen(true)}
              >
                <span className="row-copy">
                  <span className="t-strong">Set up your own sailing</span>
                  <span className="t-meta">For a ship that is not on this list</span>
                </span>
              </button>
            </div>

            {/* on the ground, not in a panel: the sibling is ProfileSheet, whose identical pair sits
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
                ? 'Tapping Done turns on sync: your name, colour and the drinks you log go to this app’s own server in London, under your friend code. You do not need to sign in, there is no analytics and no advertising, and you can delete it all from Your details at any time.'
                : 'This version of the app has no server, so nothing leaves this phone. Your passport is stored on this phone only.'}
            </p>

            {/* in its own wrapper so .row:not(:only-child) (base.css) does not square its corners: an
                isolated row keeps radius 12. The same row, class and strings go into ProfileSheet, so
                the note is reached the same way in both places. */}
            <div>
              <button
                type="button"
                className="row pressable privacy-open"
                aria-haspopup="dialog"
                onClick={() => setPrivacyOpen(true)}
              >
                <span className="row-copy">
                  <span className="t-strong">Privacy note</span>
                  <span className="t-meta">{PRIVACY_SUBTITLE}</span>
                </span>
              </button>
            </div>

            {/* always enabled: a name is optional here, because the app has never required one to log
                a drink, and /add, /join and Crew each still ask before anything of yours goes out
                under a name */}
            <button type="button" className="btn btn-wide btn-coral pressable entry-done" onClick={done}>Done</button>
          </div>
        </div>
      </main>
      {privacyOpen && <PrivacySheet onClose={() => setPrivacyOpen(false)} />}
      {sailingOpen && <SailingSheet onClose={() => setSailingOpen(false)} />}
    </>
  )
}
