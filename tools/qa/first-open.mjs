// The sync gate: a cold first open must reach the entry screen without touching Supabase.
// shot.mjs always appends ?seed, and a seeded store is already entered, so this check cannot be a
// screenshot: it opens the root with no query at all in a fresh browser context and asserts both
// halves, that the entry screen is up and that nothing went to the backend.
//
//   node tools/qa/first-open.mjs
//
// Exits 0 on PASS, 1 on failure. It must NEVER click Done: that would create a live anonymous user
// on the real backend on every run.
// Env: SHOT_BASE (default http://127.0.0.1:5173)
import { launch } from './cdp.mjs'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173'

// Collected through a PerformanceObserver installed before navigation, not read back out of
// performance.getEntriesByType('resource'): that buffer holds 250 entries by default and a Vite dev
// server serves this app's module graph in far more than that, so a late request would be dropped
// and the check would pass vacuously. An observer is not capped, and buffered:true picks up anything
// that landed before it ran.
//
// The pattern is deliberately NOT a bare /supabase/i. backend.ts imports ./supabase statically, so
// the dev server serves /src/state/supabase.ts on every load, including a correct first open; a bare
// match would report that as a violation, the run would fail on working code, and the next person
// would loosen the test. The two things that actually matter are the API host (<ref>.supabase.co)
// and the pre-bundled dependency (/node_modules/.vite/deps/@supabase_supabase-js.js), which is the
// only way supabase-js itself can arrive, since src/state/supabase.ts imports it dynamically. A pass
// therefore proves both that no request was made and that the library was never fetched.
const TAP = `
window.__sb = [];
new PerformanceObserver((l) => { for (const e of l.getEntries()) if (/\\.supabase\\.co|node_modules[^"']*supabase/i.test(e.name)) window.__sb.push(e.name) })
  .observe({ type: 'resource', buffered: true });
`

const chrome = await launch({ width: 390, height: 844 })
let code = 0
try {
  // chrome.user() creates its own browser context, so this is a phone that has never opened the app:
  // no localStorage, no persisted store, enteredCruise at its false default.
  const u = await chrome.user('S')
  await chrome.send('Page.addScriptToEvaluateOnNewDocument', { source: TAP }, u.sessionId)
  await u.goto(BASE + '/')
  await u.sleep(3000)

  const hits = JSON.parse(await u.eval('JSON.stringify(window.__sb || [])'))
  const entry = await u.eval("Boolean(document.querySelector('.entry-done'))")

  if (!entry) { console.log('FAIL first open: no entry screen (.entry-done not found)'); code = 1 }
  if (hits.length) { console.log('FAIL first open: ' + hits.length + ' supabase request(s)\n  ' + hits.join('\n  ')); code = 1 }
  if (!code) console.log('PASS first open: entry screen, 0 supabase requests')

  const bad = u.logs.filter((l) => l.startsWith('EXC') || l.startsWith('error'))
  if (bad.length) console.log('console:', bad.slice(0, 5).join('\n'))
} finally { chrome.close() }
process.exit(code)
