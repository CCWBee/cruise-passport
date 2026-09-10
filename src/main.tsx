import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/tokens.css'
import './styles/base.css'
import './styles/craft.css'
import './state/sync' // side-effect: attach sync triggers (launch/online/visibility) at startup, not on first Friends open
import './ui/avatarSpring' // side-effect: avatar-group hover spring on friend-dot stacks (hover-capable devices)
import App from './app/App'

// ── The build the guest is looking at ─────────────────────────────────────────────────────────
// autoUpdate already installs a deploy in the background: vite-plugin-pwa sets skipWaiting and
// clientsClaim for registerType 'autoUpdate' (dist/index.js, lines 874 to 876). What was missing
// is the reload, so the page kept running the shell it loaded and the first open after a deploy
// showed the previous build until the app was killed.
//
// The plugin's own client would reload for us: in dist/client/build/register.js, lines 39 to 47,
// the autoUpdate branch listens for workbox's 'activated' and calls window.location.reload() when
// event.isUpdate or event.isExternal, unless onNeedReload is supplied. ('controlling' with
// isUpdate, lines 57 to 64, is the prompt branch and never runs here.) Supplying onNeedReload is
// the documented way to take the reload over (vite-plugin-pwa/types/index.d.ts, line 9).
//
// We take it because a reload while a sheet is open destroys what is half-filled in it: AddSheet's
// form is component state, not the store. And because reloading once the new worker controls this
// page is served out of its precache, where reloading at activation can fall through to the
// network, which on a ship is a white screen. clientsClaim() is a bare activate listener with no
// waitUntil (workbox-core/clientsClaim.js, line 16), so in practice controllerchange arrives
// first; we arm from both and reload once.
// Not a const: a page that installed the worker itself has no controller at load, and must still
// catch the deploy that lands while it stays open. The first controllerchange is that install
// claiming the page, and the shell on screen is already what it just installed; from then on a
// change of controller is an update.
let hadController = 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller)

function startUpdates() {
  if (!('serviceWorker' in navigator)) return
  let armed = false      // a new worker has taken this page over
  let sheetOpen = false  // a Sheet is mounted: hold, whatever else happens
  let reloading = false

  const reload = () => {
    if (!armed || sheetOpen || reloading) return
    reloading = true
    window.location.reload()
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return }   // the first install claiming this page
    armed = true
    reload()
  })
  window.addEventListener('sheet:open', () => { sheetOpen = true })
  window.addEventListener('sheet:closed', () => {
    sheetOpen = false
    // One task later, not inline: closing one sheet to open another empties and refills the stack
    // inside a single React commit, so the next sheet's 'sheet:open' has already run by the time
    // this fires and reload() bails. Same reason it is safe under StrictMode's open/closed/open.
    window.setTimeout(reload, 0)
  })

  registerSW({
    // Registration timing is unchanged: immediate defaults to false, so this still registers on
    // the window load event, exactly as the injected registerSW.js did.
    onNeedReload() { if (hadController) { armed = true; reload() } },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Below the render on purpose: an update that cannot arm is a stale build, a throw above the
// render is a white screen. Nothing is lost by the order. render() returns before React commits,
// so these listeners are attached before any Sheet can mount, and registerSW waits for the window
// load event, so no worker can claim the page before this line has run.
try { startUpdates() } catch { /* the app matters more than the update */ }
