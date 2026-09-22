// Polish item 1, the one allowed live-backend check (docs/specs/2026-09-17-polish.md).
// Fresh context, fetch tap before navigation, /?seed with sync live, erase twice, assert, Done,
// assert resume, then erase again on a ?nosync load to leave the backend clean.
// It signs two anonymous users in to the LIVE backend and deletes both itself, so it is never part of
// a sweep: run it by hand, once, when erasure or the sync gate changes. usage: node erase-live.mjs
// (SHOT_BASE picks the server; the dev server's .env points at the live project).
import { launch } from './cdp.mjs'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173'
const REF = 'qpmrfoglxohmjhjtvkac'
const TAP = `
window.__taps = [];
(() => {
  const real = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      const url = typeof input === 'string' ? input : (input && input.url) || String(input);
      const method = (init && init.method) || (input && input.method) || 'GET';
      if (/supabase\\.co/.test(url)) window.__taps.push({ url: url.replace(/\\?.*$/, ''), method, t: Date.now() });
    } catch {}
    return real(input, init);
  };
})();
`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const out = { steps: [] }
const log = (k, v) => { out.steps.push({ [k]: v }); console.log(k, JSON.stringify(v)) }

const chrome = await launch({ width: 390, height: 844 })
let fail = false
const check = (name, ok, detail) => { log(name, { ok, detail }); if (!ok) fail = true }
try {
  const u = await chrome.user('S')
  await chrome.send('Page.addScriptToEvaluateOnNewDocument', { source: TAP }, u.sessionId)
  const taps = () => u.eval('JSON.stringify(window.__taps || [])').then(JSON.parse)
  const count = (list, re, method, since = 0) => list.filter((x) => re.test(x.url) && (!method || x.method === method) && x.t >= since).length
  const ids = () => u.eval(`(() => { let uid = null, code = null; try { uid = JSON.parse(localStorage.getItem('sb-${REF}-auth-token') || 'null')?.user?.id ?? null } catch {} try { code = JSON.parse(localStorage.getItem('spcc2') || 'null')?.state?.profile?.code ?? null } catch {} return { uid, code } })()`)
  const waitFor = async (fn, ms, step = 250) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return Date.now() - t0; await sleep(step) } return -1 }
  const click = (sel) => u.eval(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)

  // 1. seed with sync live
  await u.goto(BASE + '/?seed')
  const signedUp = await waitFor(async () => { const l = await taps(); return count(l, /auth\/v1\/signup/) > 0 && count(l, /rest\/v1\/passports/, 'POST') > 0 }, 30000, 500)
  check('seed signup and publish', signedUp >= 0, { ms: signedUp })
  await sleep(1500)
  const first = await ids()
  log('first identity', first)

  // 2. Crew, Your details, Delete my data twice
  await click('a[href$="/social"]')
  await sleep(1500)
  await click('.crew-me')
  await sleep(1500)
  const d1 = await click('.friends-danger .btn')
  await sleep(600)
  const d2 = await click('.friends-danger .btn.armed')
  check('delete tapped twice', d1 && d2, { d1, d2 })
  const toEntry = await waitFor(() => u.eval('Boolean(document.querySelector(".entry-done"))'), 15000)
  const t0 = Date.now()
  check('entry screen after erase', toEntry >= 0, { ms: toEntry })
  const l1 = await taps()
  check('delete_my_data fired', count(l1, /rpc\/delete_my_data/, 'POST') === 1, count(l1, /rpc\/delete_my_data/))
  check('logout fired', count(l1, /auth\/v1\/logout/) >= 1, count(l1, /auth\/v1\/logout/))
  const signupsBefore = count(l1, /auth\/v1\/signup/)
  await sleep(10000)
  const l2 = await taps()
  check('zero signup for 10s', count(l2, /auth\/v1\/signup/, null, t0) === 0 && count(l2, /auth\/v1\/signup/) === signupsBefore, count(l2, /auth\/v1\/signup/, null, t0))
  check('zero profiles upsert for 10s', count(l2, /rest\/v1\/profiles/, 'POST', t0) === 0, count(l2, /rest\/v1\/profiles/, 'POST', t0))
  check('zero requests of any kind for 10s', count(l2, /./, null, t0) === 0, l2.filter((x) => x.t >= t0))
  const entry = await u.eval(`(() => ({ name: document.querySelector('.entry input')?.value ?? null, local: JSON.parse(localStorage.getItem('spcc2')).state.enteredCruise, code: JSON.parse(localStorage.getItem('spcc2')).state.profile.code, session: localStorage.getItem('sb-${REF}-auth-token') }))()`)
  log('entry screen state', entry)
  console.log('shot', await u.shot('polish-erase-entry'))

  // 3. Done resumes sync
  const t1 = Date.now()
  await click('.entry-done')
  const resumed = await waitFor(async () => { const l = await taps(); return count(l, /auth\/v1\/signup/, null, t1) > 0 && count(l, /rest\/v1\/passports/, 'POST', t1) > 0 }, 8000, 100)
  check('signup and publish after Done (target 3000ms)', resumed >= 0 && resumed <= 3000, { ms: resumed })
  await sleep(1500)
  const second = await ids()
  log('second identity', second)

  // 4. clean up on a ?nosync load, same context
  const t2 = Date.now()
  await u.goto(BASE + '/social?nosync')
  await sleep(2000)
  await click('.crew-me')
  await sleep(1500)
  await click('.friends-danger .btn')
  await sleep(600)
  await click('.friends-danger .btn.armed')
  const toEntry2 = await waitFor(() => u.eval('Boolean(document.querySelector(".entry-done"))'), 15000)
  const l3 = await taps()
  check('second erase reached entry', toEntry2 >= 0, { ms: toEntry2 })
  check('second delete_my_data fired', count(l3, /rpc\/delete_my_data/, 'POST', t2) === 1, count(l3, /rpc\/delete_my_data/, 'POST', t2))
  check('no signup on the cleanup load', count(l3, /auth\/v1\/signup/, null, t2) === 0, count(l3, /auth\/v1\/signup/, null, t2))
  const bad = u.logs.filter((l) => l.startsWith('EXC') || l.startsWith('error'))
  if (bad.length) log('console', bad.slice(0, 8))
} finally { chrome.close() }
console.log(fail ? 'FAIL' : 'PASS')
process.exit(fail ? 1 : 0)
