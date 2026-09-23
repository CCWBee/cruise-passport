import { googleSignInEnabled, hasBackend } from '../../state/backend'
import { Sheet } from '../../ui/Sheet'
import './privacy.css'

/** One address a stranger can write to about their own data. While it is empty the two sentences
 *  that name it are not rendered at all: a placeholder address on screen would be worse than no
 *  address, because it is an answer that does not answer. Charles supplies it. */
export const PRIVACY_CONTACT: string = ''

/** The row's second line and the sheet's own meta line are the same sentence, exported once so the
 *  two cannot drift apart. Kept under about 50 characters: the row clips each of its lines to one
 *  (base.css, `.row-copy > *`). */
export const PRIVACY_SUBTITLE = 'What leaves your phone, and how to remove it.'

/** What a guest stands to lose, and how they avoid losing it, since the recovery code (23 September
 *  2026, docs/specs/2026-09-23-recovery-and-hardening.md). Held here, not in ProfileSheet, so the
 *  note and the sheet say it once rather than twice with a drift between them. It is true only where
 *  there is a server to bring a passport back from; a build with none renders GUEST_ONLY_HERE. */
export const GUEST_HONESTY =
  'Once this phone has synced, Your details shows a recovery code. Enter it under Bring back a passport on a new phone, or in the app on your home screen, and this passport comes back with your friend code. Until then, or without the code, clearing your browser or changing phone loses it.'

/** The same answer for a build with no server, where nothing can be brought back. */
const GUEST_ONLY_HERE =
  'This passport is on this phone only. Clear your browser or change phone and it is gone, your friend code with it.'

// The whole answer to "what happens to my data", reached from the consent line on the first-open
// screen and from Your details, and the same text in both. Seven headings is longer than "a short
// sheet" sounds, and it is deliberate: each one answers a question a person is entitled to ask about
// their own data, and dropping one would mean not answering it. The cut to make, if one is ever
// wanted, is shorter sentences, never fewer headings.
export function PrivacySheet({ onClose }: { onClose: () => void }) {
  // A build with no Supabase env vars has no server at all, so the three sections that describe one
  // are not rendered under a disclaimer: that would leave one sheet saying two things.
  const server = hasBackend()

  return (
    <Sheet onClose={onClose} labelledBy="privacy-title">
      <div className="privacy">
        <h2 className="t-h2 sheet-title" id="privacy-title">Privacy note</h2>
        <p className="sheet-meta">{PRIVACY_SUBTITLE}</p>

        {!server && (
          <p className="t-body">This version of the app has no server configured, so nothing described below leaves your phone.</p>
        )}

        <section className="section">
          <div className="section-head"><h3 className="t-h2">What is stored</h3></div>
          <p className="t-body">Your name, your colour and your friend code. For each drink: whether you have tried it, the date, your rating, whether you recommend it, and any comment you write for your crew. Which venues you have visited. Any drink you add yourself. The sailing you are on.</p>
          {server && (<>
            <p className="t-body">A second, private copy of the whole passport is kept so it can be restored, and that one includes your notes, your favourites and your wishlist. Only you can read it.</p>
            <p className="t-body">A scrambled copy of your recovery code (its SHA-256), which can check a code but cannot be turned back into one. The code itself stays on your phone, and is sent only when you use it to bring a passport back.</p>
          </>)}
        </section>

        {server && (
          <section className="section">
            <div className="section-head"><h3 className="t-h2">Who can see it</h3></div>
            <p className="t-body">The people in your crew: anyone you have added, anyone who has added you, and the members of any group you join. They see your name, colour and code, and the drinks you have ticked, rated, recommended or commented on. They never see your notes, your favourites or your wishlist.</p>
            <p className="t-body">Nobody approves an add. Once you have set a name, anyone in the app can find you by name or code, and adding you is mutual at once: they see your passport and you see theirs. The search returns only your name, colour and code, and a guest with no name cannot be found. Removing someone cuts both sides at once.</p>
          </section>
        )}

        {server && (
          <section className="section">
            <div className="section-head"><h3 className="t-h2">Where it is kept</h3></div>
            <p className="t-body">On a server in London, run by Supabase for this app alone and shared with nothing else. The app itself is served by Cloudflare. Both keep the ordinary server logs any website keeps, which include IP addresses.</p>
          </section>
        )}

        <section className="section">
          <div className="section-head"><h3 className="t-h2">What is never collected</h3></div>
          <p className="t-body">{googleSignInEnabled
            ? 'No email address, unless you choose to sign in, and then it is held by the sign-in service and never copied into this app’s own tables.'
            : 'No email address: there is no sign-in.'} No location, no phone number, no date of birth. No analytics, no advertising, no third-party trackers, and nothing stored on your phone beyond what the app needs to work offline.</p>
        </section>

        <section className="section">
          <div className="section-head"><h3 className="t-h2">If you change phone</h3></div>
          <p className="t-body">{server ? GUEST_HONESTY : GUEST_ONLY_HERE}</p>
          {server && (
            <p className="t-body">The code moves the passport rather than copying it: the phone it came from stops syncing.</p>
          )}
        </section>

        {server && (
          <section className="section">
            <div className="section-head"><h3 className="t-h2">Deleting it</h3></div>
            <p className="t-body">Open Your details on the Crew tab and tap Delete my data. It removes your profile, your shared passport, your private restore copy, the scrambled recovery code, your own crew list and your group memberships from the server, and deletes any group you set up. Once your profile is gone, nobody can look your code up again and nobody who had added you can still see you, and the old recovery code brings nothing back. The copy on your phone stays until you clear it yourself. Nothing expires on its own: what is stored stays until you remove it. The app then asks again before anything leaves this phone.</p>
            {googleSignInEnabled && PRIVACY_CONTACT && (
              <p className="t-body">If you signed in with Google, your email address stays with the sign-in service until the account itself is removed, which is done by hand. Ask at the address below and it will be.</p>
            )}
          </section>
        )}

        <section className="section">
          <div className="section-head"><h3 className="t-h2">Who is responsible, and who it is for</h3></div>
          <p className="t-body">This app is run by one person, not a company. The app is for adults; it is not aimed at anyone under eighteen.{PRIVACY_CONTACT ? ` Questions, or a request to see or remove your data: ${PRIVACY_CONTACT}.` : ''}</p>
        </section>

        <p className="t-meta privacy-foot">Updated 23 September 2026.</p>
      </div>
    </Sheet>
  )
}
