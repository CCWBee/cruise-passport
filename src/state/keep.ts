// Ask the browser to keep this site's storage, once the guest has passed the entry screen.
//
// Everything the guest has (the passport, the sailings, the session) is in localStorage. WebKit
// deletes a site's script-writable storage after seven days of Safari use without a visit, unless
// the site is on the home screen, and navigator.storage.persist() is how a page asks to be kept
// (granted on heuristics, a home-screen app among them). It is asked silently, where the browser has
// it, and a refusal changes nothing: the recovery code is the way back either way. Before Done there
// is nothing of the guest's worth keeping, and asking would be a prompt on some browsers for a
// visitor who has not decided to stay.
import { useStore } from './store'

function ask(): void {
  try {
    const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined
    if (!storage?.persist) return
    void storage.persisted()
      .then((kept) => (kept ? true : storage.persist()))
      .catch(() => { /* a refusal is an answer, and so is an error */ })
  } catch { /* no storage manager on this browser */ }
}

/** Ask now if the guest is already past the entry screen, else the moment they are. */
export function keepStorageOnceEntered(): void {
  if (useStore.getState().enteredCruise) { ask(); return }
  const stop = useStore.subscribe((s) => {
    if (!s.enteredCruise) return
    stop()
    ask()
  })
}
