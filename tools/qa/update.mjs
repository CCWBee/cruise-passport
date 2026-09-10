// The simulated deploy. Copies dist/ into two trees, makes the second a genuinely different build,
// serves one of them and swaps to the other without ever navigating the page again, so anything the
// page then does came from the app and not from the harness. Asserts that it reloads itself onto the
// new shell, and that it holds that reload while a sheet is open with the form intact.
// usage: npm run build && node tools/qa/update.mjs
// Env: UPDATE_PORT (default 4180), SHOTS_DIR (default shots), CDP_PORT (default: derived from pid)
import { launch, OUT } from './cdp.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const HERE = path.resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))
const DIST = path.resolve(HERE, '../../dist')
const ROOT = path.join(HERE, 'shots-update')
const A = path.join(ROOT, 'a')
const B = path.join(ROOT, 'b')
const PORT = Number(process.env.UPDATE_PORT) || 4180
const NEW_CHUNK = 'index-BBBBBBBB.js'
const W = 390, H = 844

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
class Failed extends Error {}
const fail = (why) => { throw new Failed(why) }

// ── 1. The two trees ───────────────────────────────────────────────────────────────────────────
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('run npm run build first'); process.exit(1) }
fs.rmSync(ROOT, { recursive: true, force: true })   // a stale tree from a previous run proves nothing
fs.cpSync(DIST, A, { recursive: true })
fs.cpSync(DIST, B, { recursive: true })

// ── 2. Make b a different build ────────────────────────────────────────────────────────────────
// The shell chunk first. It is in the precache manifest as {url:"assets/index-<hash>.js",revision:null},
// so its URL carries the hash and renaming it is enough to change the manifest.
const bHtmlPath = path.join(B, 'index.html')
const bSwPath = path.join(B, 'sw.js')
let bHtml = fs.readFileSync(bHtmlPath, 'utf8')
let bSw = fs.readFileSync(bSwPath, 'utf8')

const chunk = bHtml.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/)
if (!chunk) {
  console.error('no shell chunk in index.html. First module script tag:', bHtml.match(/<script type="module"[^>]*>/)?.[0] ?? '(none)')
  process.exit(1)
}
const OLD_CHUNK = chunk[1]
const count = (s, needle) => s.split(needle).length - 1
if (count(bHtml, OLD_CHUNK) !== 1) { console.error(`index.html names ${OLD_CHUNK} ${count(bHtml, OLD_CHUNK)} times, expected 1`); process.exit(1) }
if (count(bSw, OLD_CHUNK) !== 1) { console.error(`sw.js names ${OLD_CHUNK} ${count(bSw, OLD_CHUNK)} times, expected 1`); process.exit(1) }
// Tree b renames the entry chunk and nothing else, so b's lazy chunks still carry a's hashes and are
// dangling by design: the fixture proves the navigation onto the new shell, not that the reloaded app
// then runs.
fs.renameSync(path.join(B, 'assets', OLD_CHUNK), path.join(B, 'assets', NEW_CHUNK))
bHtml = bHtml.replaceAll(OLD_CHUNK, NEW_CHUNK)
bSw = bSw.replaceAll(OLD_CHUNK, NEW_CHUNK)

// Then index.html's precache revision. Without it the new worker decides index.html is unchanged,
// copies the old cache entry forward and serves a shell pointing at a file that no longer exists.
// The built sw.js is minified JavaScript, not JSON, so the keys are unquoted; tolerate either key
// style and either field order, and take whichever branch of the alternation matched.
const REV = /\{(?:"?url"?:"\/?index\.html","?revision"?:"([0-9a-f]{32})"|"?revision"?:"([0-9a-f]{32})","?url"?:"\/?index\.html")\}/
const rev = bSw.match(REV)
if (!rev) {
  const at = bSw.indexOf('index.html')
  console.error('no index.html precache entry in sw.js. Around it:\n' + bSw.slice(Math.max(0, at - 240), at + 240))
  process.exit(1)
}
const hex = rev[1] ?? rev[2]
bSw = bSw.slice(0, rev.index) + rev[0].replace(hex, 'b'.repeat(32)) + bSw.slice(rev.index + rev[0].length)

fs.writeFileSync(bHtmlPath, bHtml)
fs.writeFileSync(bSwPath, bSw)
// A worker whose bytes are identical is never treated as an update, and the whole run would pass
// nothing at all in silence.
if (bSw === fs.readFileSync(path.join(A, 'sw.js'), 'utf8')) { console.error('b/sw.js is byte-identical to a/sw.js: nothing would update'); process.exit(1) }

// ── 3. Serve, from a directory that can be swapped under the page ──────────────────────────────
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
}
let current = A
const server = http.createServer((req, res) => {
  // The pathname only, query dropped: workbox-precaching fetches revisioned entries as
  // index.html?__WB_REVISION__=<hash>, and a server that resolves req.url verbatim 404s every one of
  // them, so the new worker never finishes installing and the run times out for no visible reason.
  let name
  try { name = decodeURIComponent(new URL(req.url, 'http://x').pathname) } catch { name = '/' }
  let file = path.resolve(current, '.' + name)
  if (!file.startsWith(path.resolve(current))) { res.writeHead(403).end(); return }
  // Anything not on disk falls back to the shell: case 2 loads /drinks before any worker exists.
  let stat = null
  try { stat = fs.statSync(file) } catch { /* not there: the shell answers */ }
  if (!stat || !stat.isFile()) file = path.join(current, 'index.html')
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',   // so the swapped sw.js is genuinely re-fetched
  })
  fs.createReadStream(file).pipe(res)
})
// A port already held by another agent's run would otherwise hang here with nothing said.
server.once('error', (e) => { console.error('port ' + PORT + ' busy: ' + e.message); process.exit(1) })
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${PORT}`   // 127.0.0.1 is a secure context, so workers register

// ── 4. The shell probe ─────────────────────────────────────────────────────────────────────────
// index.html carries an inline classic script (the ?seed block) as well as the module entry, so the
// [src] is what picks out the entry. The try is not optional: cdp.mjs's eval throws on a page
// exception and the CDP call rejects mid-navigation, which is exactly what this script provokes, so
// a poll tick that cannot read returns empty and is tried again.
const shell = async (u) => { try { return await u.eval("document.querySelector('script[type=module][src]')?.src || ''") } catch { return '' } }
const waitForShell = async (u, want, ms) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if ((await shell(u)).includes(want)) return Date.now() - t0
    await sleep(500)
  }
  return -1
}
const controlled = async (u) => { try { return await u.eval('!!navigator.serviceWorker.controller') } catch { return false } }
// What the browser itself does on a navigation, and the only thing this script does after the swap.
const checkForUpdate = async (u) => {
  try {
    await u.eval("navigator.serviceWorker.getRegistration().then(r => r ? r.update() : Promise.reject(new Error('no registration'))).then(() => 'ok')")
    return ''
  } catch (e) { return String(e.message || e) }   // a reload can cut the call off: the poll decides
}

const chrome = await launch({ width: W, height: H })
let bad = null
try {
  // ── 5. Case 1: no sheet open ─────────────────────────────────────────────────────────────────
  {
    const u = await chrome.user('update')
    await u.goto(`${BASE}/?seed&nosync`); await sleep(3000)   // registration is on load, then the install
    // The first install must not reload: there was no controller, so nothing was replaced and a
    // reload would only cost the guest their place. A regression of that gate reads as 'reload' here.
    if ((await u.eval("performance.getEntriesByType('navigation')[0].type")) !== 'navigate') fail('first install reloaded the page')
    await u.goto(`${BASE}/?seed&nosync`); await sleep(2000)   // the worker now controls the page
    if (!(await controlled(u))) fail('no sheet: the worker never took control of the first build')
    if (!(await shell(u)).includes(OLD_CHUNK)) fail(`no sheet: expected the page to be on ${OLD_CHUNK}, it is on ${await shell(u)}`)

    current = B
    const why = await checkForUpdate(u)
    const took = await waitForShell(u, NEW_CHUNK, 30000)   // the precache is 1.7 MiB and installs before activation
    if (took < 0) fail(`no sheet: still on the old shell after 30s${why ? ' (update() said: ' + why + ')' : ''}`)
    console.log(`PASS  no sheet: reloaded itself onto the new shell in ${took}ms`)
  }

  // ── 6. Case 2: a sheet open ──────────────────────────────────────────────────────────────────
  {
    current = A
    const u = await chrome.user('update-sheet')   // its own storage, so it installs a from scratch
    await u.goto(`${BASE}/drinks?seed&nosync`); await sleep(3000)
    await u.goto(`${BASE}/drinks?seed&nosync`); await sleep(2000)
    if (!(await controlled(u))) fail('sheet open: the worker never took control of the first build')
    if (!(await shell(u)).includes(OLD_CHUNK)) fail(`sheet open: expected the page to be on ${OLD_CHUNK}, it is on ${await shell(u)}`)

    if (!(await u.eval("(() => { const b = document.querySelector('.dtoolbar button'); if (!b) return false; b.click(); return true })()"))) fail('sheet open: no "Add a missing drink" button on Drinks')
    await sleep(800)
    if (!(await u.eval("!!document.querySelector('.sheet')"))) fail('sheet open: the add sheet did not open')

    // Case 1's target is still alive, so this page is not the focused one and element.focus() can
    // leave activeElement where it was, which types into nothing. And the field carries autoFocus,
    // but Sheet.tsx focuses the dialog in its own mount effect, so focus has to be put on the input
    // by hand before anything is typed.
    await chrome.send('Emulation.setFocusEmulationEnabled', { enabled: true }, u.sessionId)
    await u.eval("document.querySelector('#add-name').focus()")
    await chrome.send('Input.insertText', { text: 'Test negroni' }, u.sessionId)
    await sleep(300)
    const typed = await u.eval("document.querySelector('#add-name').value")
    if (typed !== 'Test negroni') fail(`sheet open: the name field reads ${JSON.stringify(typed)}, so the case would prove nothing`)

    // Count the handovers. Without this the three assertions below also pass when the new worker
    // simply never finished installing in 12s: nothing was held, because nothing ever asked to
    // reload, and "reload held" would be printed over an install that had not happened.
    await u.eval("window.__cc = 0; navigator.serviceWorker.addEventListener('controllerchange', () => { window.__cc++ })")

    current = B
    await checkForUpdate(u)
    await sleep(12000)
    if (!(await shell(u)).includes(OLD_CHUNK)) fail('sheet open: the page reloaded with the sheet still open')
    if (!(await u.eval("!!document.querySelector('.sheet')"))) fail('sheet open: the sheet went away')
    if ((await u.eval("document.querySelector('#add-name').value")) !== 'Test negroni') fail('sheet open: the half-typed form was lost')
    if (!((await u.eval('window.__cc')) >= 1)) fail('sheet open: no new worker ever took control, so nothing was held')
    console.log('shot', await u.shot('update-held'))
    console.log('PASS  sheet open: reload held, form intact')

    await u.eval("document.querySelector('.sheet-x').click()")
    const took = await waitForShell(u, NEW_CHUNK, 20000)
    if (took < 0) fail('sheet closed: the held reload never ran')
    console.log('shot', await u.shot('update-after'))
    console.log(`PASS  sheet closed: reloaded onto the new shell in ${took}ms`)
  }
} catch (e) {
  bad = e instanceof Failed ? e.message : (e.stack || String(e))
} finally {
  chrome.close()
  server.close()
}

if (bad) { console.error('FAIL  ' + bad); process.exit(1) }
console.log('screenshots in', OUT)
