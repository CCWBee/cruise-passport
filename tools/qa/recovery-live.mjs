// The recovery code end to end, against the LIVE backend (docs/specs/2026-09-23-recovery-and-hardening.md,
// section 1 and "For the UI pass"). Two isolated browser contexts are two phones on the dev server,
// with no ?seed and no ?nosync on purpose, so both sync to the live Supabase project.
//
//   A: enters as "QA Recovery A", ticks two drinks tried, waits for Your details to show the code.
//   B: enters as "QA Recovery B", tries a well-formed wrong code (the server path, not the shape
//      check), then brings back A's passport with A's code: two drinks, A's name, A's friend code and
//      the same recovery code must be on B.
//   A: on its next sync shows the moved status and mints no new user.
//   B: Delete my data from Your details.
//
// It signs anonymous users in to the live backend and leaves B's auth user behind (delete_my_data
// erases rows, not the user), so it runs by hand, once, when the recovery path changes, and never in
// a sweep; afterwards delete the users it made (their ids go to IDS_OUT, never to stdout).
// Headless, so only inside the CPU cap:
//   powershell -NoProfile -ExecutionPolicy Bypass -File tools/qa/capped.ps1 -CpuPercent 25 -Log <log> node tools/qa/recovery-live.mjs
// Env: SHOT_BASE (default the dev server), IDS_OUT (a JSON file for the ids), SHOTS_DIR.
import { writeFileSync } from 'node:fs'
import { launch } from './cdp.mjs'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173'
const REF = 'qpmrfoglxohmjhjtvkac'
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ' // src/state/recovery.ts, RECOVERY_ALPHABET
const WRONG_LINE = 'That code does not match a passport.'
const MOVED_LINE = 'This passport moved to another phone or app.'

// Every Supabase call, with its answer's status, recorded from before the app's first script runs.
const TAP = `
window.__taps = [];
(() => {
  const real = window.fetch.bind(window);
  window.fetch = (input, init) => {
    let rec = null;
    try {
      const url = typeof input === 'string' ? input : (input && input.url) || String(input);
      const method = (init && init.method) || (input && input.method) || 'GET';
      if (/supabase\\.co/.test(url)) { rec = { url: url.replace(/\\?.*$/, ''), method, t: Date.now(), status: 0 }; window.__taps.push(rec) }
    } catch {}
    const p = real(input, init);
    if (rec) p.then((r) => { rec.status = r.status; rec.done = Date.now() }, () => { rec.status = -1; rec.done = Date.now() });
    return p;
  };
})();
`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const short = (id) => (id ? String(id).slice(0, 8) + '…' : null)
let fail = false
const results = []
const check = (name, ok, detail) => {
  const line = `${ok ? 'PASS' : 'FAIL'} ${name}${detail === undefined ? '' : ' ' + JSON.stringify(detail)}`
  results.push(line); console.log(line)
  if (!ok) fail = true
  return ok
}
const note = (k, v) => console.log('note', k, JSON.stringify(v))
const ids = { A: [], B: [] }
const saveIds = () => { if (process.env.IDS_OUT) writeFileSync(process.env.IDS_OUT, JSON.stringify(ids, null, 2)) }

const chrome = await launch({ width: 390, height: 844 })
try {
  async function phone(name) {
    const u = await chrome.user(name)
    await chrome.send('Page.addScriptToEvaluateOnNewDocument', { source: TAP }, u.sessionId)
    const js = (v) => JSON.stringify(v)
    const p = {
      u,
      taps: async () => JSON.parse(await u.eval('JSON.stringify(window.__taps || [])')),
      count: async (re, { method, since = 0, ok } = {}) => (await p.taps()).filter((x) => re.test(x.url) && (!method || x.method === method) && x.t >= since && (!ok || (x.status >= 200 && x.status < 300))).length,
      waitFor: async (fn, ms, step = 400) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return Date.now() - t0 } catch { /* page between renders */ } await sleep(step) } return -1 },
      click: (sel) => u.eval(`(() => { const b = document.querySelector(${js(sel)}); if (!b) return false; b.click(); return true })()`),
      clickText: (sel, text) => u.eval(`(() => { const b = [...document.querySelectorAll(${js(sel)})].find((e) => e.textContent.trim() === ${js(text)}); if (!b) return false; b.click(); return true })()`),
      text: (sel) => u.eval(`document.querySelector(${js(sel)})?.textContent.trim() ?? null`),
      // React owns these inputs: the prototype's setter and an input event reach its state, a bare
      // assignment does not
      type: (sel, value) => u.eval(`(() => { const el = document.querySelector(${js(sel)}); if (!el) return false; el.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${js(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); return el.value })()`),
      store: () => u.eval(`(() => { const s = JSON.parse(localStorage.getItem('spcc2') || 'null')?.state ?? {}; const e = s.me?.entries ?? {}; return { name: s.profile?.name ?? null, code: s.profile?.code ?? null, colour: s.profile?.colour ?? null, entered: s.enteredCruise ?? null, cruiseId: s.cruiseId ?? null, tried: Object.keys(e).filter((k) => e[k]?.tried === true).sort(), syncUid: s.syncUid || null } })()`),
      uid: () => u.eval(`(() => { try { return JSON.parse(localStorage.getItem('sb-${REF}-auth-token') || 'null')?.user?.id ?? null } catch { return null } })()`),
      // visibilitychange syncs only while the page reads visible; 'online' calls syncNow() whatever
      hurry: () => u.eval(`(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('online')); return document.visibilityState })()`),
      nav: async (path) => { if (!(await p.click(`a[href="${path}"]`))) await u.goto(BASE + path); await sleep(1200) },
      openDetails: async () => { if (!(await u.eval('Boolean(document.querySelector(".friends-sheet"))'))) { await p.nav('/social'); await p.click('.crew-me'); await sleep(1500) } return u.eval('Boolean(document.querySelector(".friends-sheet"))') },
    }
    return p
  }

  async function enter(p, name) {
    await p.u.goto(BASE + '/')
    const up = await p.waitFor(() => p.u.eval('Boolean(document.querySelector(".entry-done"))'), 30000)
    check(`${p.u.name}: entry screen on a fresh phone`, up >= 0, { ms: up })
    const typed = await p.type('.entry-fields input.field-ctrl', name)
    check(`${p.u.name}: name typed on the entry screen`, typed === name, typed)
    const t = Date.now()
    await p.click('.entry-done')
    const synced = await p.waitFor(async () => (await p.count(/rest\/v1\/passports/, { method: 'POST', since: t, ok: true })) > 0, 60000, 500)
    check(`${p.u.name}: passed the entry screen and published`, synced >= 0, { ms: synced, signups: await p.count(/auth\/v1\/signup/) })
    const s = await p.store()
    check(`${p.u.name}: store holds the name`, s.name === name && s.entered === true, { name: s.name, entered: s.entered })
    return s
  }

  // ── A ──
  const A = await phone('A')
  const B = await phone('B')
  await enter(A, 'QA Recovery A')
  ids.A.push(await A.uid()); saveIds()
  note('A uid', short(ids.A[0]))

  await A.nav('/drinks')
  const tryButtons = await A.u.eval('document.querySelectorAll(".d-try").length')
  for (let i = 0; i < 2; i++) {
    await A.u.eval(`(() => { const b = [...document.querySelectorAll('.d-try')].filter((x) => x.getAttribute('aria-pressed') !== 'true')[0]; b?.click(); return b?.getAttribute('aria-label') })()`)
    await sleep(900)
  }
  const tickedAt = Date.now()
  const aStore = await A.store()
  check('A: two drinks tried', aStore.tried.length === 2, { tried: aStore.tried, buttons: tryButtons })

  // the code appears once a round has published and the server holds its hash
  note('A visibilityState', await A.hurry())
  const detailsA = await A.openDetails()
  check('A: Your details open', detailsA)
  let code = null
  const codeMs = await A.waitFor(async () => { await A.hurry(); code = await A.text('.recovery-code'); return Boolean(code) }, 150000, 3000)
  check('A: Your details shows the recovery code', codeMs >= 0 && /^[0-9A-Z]{4}(-[0-9A-Z]{4}){4}$/.test(code || ''), { ms: codeMs, shape: code ? code.replace(/[0-9A-Z]/g, 'x') : null })
  // the ticks ride in the backup: wait for a backup write that began after the second tick and landed
  const backedUp = await A.waitFor(async () => { await A.hurry(); return (await A.taps()).some((x) => /rest\/v1\/backups/.test(x.url) && x.method === 'POST' && x.t >= tickedAt - 900 && x.status >= 200 && x.status < 300) }, 90000, 3000)
  check('A: backup written after the ticks', backedUp >= 0, { ms: backedUp })
  await sleep(2000)
  const aCrewCode = await (async () => { await A.nav('/social'); return A.text('.crew-me .tnum') })()
  const aFinal = await A.store()
  check('A: friend code on Crew matches the store', Boolean(aCrewCode) && aCrewCode === aFinal.code, { crew: aCrewCode, store: aFinal.code })
  await A.u.shot('recovery-A-code').catch(() => {})

  // ── B ──
  const bEntered = await enter(B, 'QA Recovery B')
  ids.B.push(await B.uid()); saveIds()
  note('B uid', short(ids.B[0]))
  check('B: its own friend code differs from A', bEntered.code && bEntered.code !== aFinal.code, { a: aFinal.code, b: bEntered.code })
  const detailsB = await B.openDetails()
  check('B: Your details open', detailsB)
  const unfolded = await B.clickText('.friends-sheet .quiet-action', 'Bring back a passport')
  await sleep(600)
  check('B: Bring back a passport unfolds', unfolded && await B.u.eval('Boolean(document.querySelector(".bring-back input"))'))

  // well-formed and not A's: one character of A's code changed, so the server is asked and says no
  const raw = code.replace(/-/g, '')
  const flipped = raw.slice(0, -1) + ALPHABET[(ALPHABET.indexOf(raw.at(-1)) + 7) % ALPHABET.length]
  const tWrong = Date.now()
  await B.type('.bring-back input', flipped)
  await sleep(300)
  await B.click('.bring-back .friends-action')
  let wrongLine = null
  const wrongMs = await B.waitFor(async () => { wrongLine = await B.text('.bring-back p[role="status"]'); return wrongLine === WRONG_LINE }, 30000, 400)
  check('B: a wrong code says so', wrongMs >= 0, { line: wrongLine })
  const claimCalls = (await B.taps()).filter((x) => /rpc\/claim_recovery/.test(x.url) && x.t >= tWrong)
  check('B: the wrong code was asked of the server', claimCalls.length === 1 && claimCalls[0].status >= 200 && claimCalls[0].status < 300, claimCalls.map((x) => x.status))
  const bAfterWrong = await B.store()
  check('B: a wrong code changed nothing', bAfterWrong.name === 'QA Recovery B' && bAfterWrong.code === bEntered.code, { name: bAfterWrong.name, code: bAfterWrong.code })

  // the real code
  const tClaim = Date.now()
  await B.type('.bring-back input', code.toLowerCase().replace(/-/g, ' '))
  await sleep(300)
  await B.click('.bring-back .friends-action')
  let tick = false
  const claimMs = await B.waitFor(async () => {
    tick ||= await B.u.eval('document.body.innerText.includes("Passport back")')
    const s = await B.store(); return s.code === aFinal.code
  }, 45000, 300)
  check('B: the claim went through', claimMs >= 0, { ms: claimMs, tick })
  await sleep(2500)
  const bStore = await B.store()
  check('B: two drinks came back', bStore.tried.length === 2 && JSON.stringify(bStore.tried) === JSON.stringify(aFinal.tried), { a: aFinal.tried, b: bStore.tried })
  check('B: A’s name', bStore.name === 'QA Recovery A', bStore.name)
  check('B: A’s friend code', bStore.code === aFinal.code, { a: aFinal.code, b: bStore.code })
  const nameField = await B.u.eval('document.querySelector(".friends-sheet input.field-ctrl")?.value ?? null')
  check('B: Your details name field reads A’s name', nameField === 'QA Recovery A', nameField)
  const bCode = await B.text('.friends-sheet .recovery-code')
  check('B: Your details shows the same recovery code', bCode === code, { same: bCode === code })
  const bUidAfter = await B.uid()
  check('B: the claim kept B’s session (no second user minted)', bUidAfter === ids.B[0] && (await B.count(/auth\/v1\/signup/)) === 1, { same: bUidAfter === ids.B[0], signups: await B.count(/auth\/v1\/signup/) })
  if (bUidAfter && !ids.B.includes(bUidAfter)) { ids.B.push(bUidAfter); saveIds() }
  await B.u.eval('document.querySelector(".sheet-close, [aria-label=\\"Close\\"]")?.click()')
  await sleep(1200)
  await B.nav('/social')
  const bCrew = await B.text('.crew-me .tnum')
  check('B: Crew header shows A’s friend code', bCrew === aFinal.code, { crew: bCrew })
  await B.nav('/drinks')
  const bOn = await B.u.eval('document.querySelectorAll(".d-try[aria-pressed=\\"true\\"]").length')
  check('B: the drinks list shows two tried', bOn === 2, bOn)
  await B.u.shot('recovery-B-claimed').catch(() => {})

  // ── A, its next sync ──
  const aSignupsBefore = await A.count(/auth\/v1\/signup/)
  await A.openDetails()
  let movedMs = await A.waitFor(async () => { await A.hurry(); return A.u.eval(`[...document.querySelectorAll('p[role="status"]')].some((p) => p.textContent.includes(${JSON.stringify(MOVED_LINE)}))`) }, 90000, 3000)
  const aSync = await A.u.eval('[...document.querySelectorAll(".friends-sheet p")].map((p) => p.textContent.trim()).filter(Boolean).slice(-6)')
  check('A: shows the moved status', movedMs >= 0, movedMs >= 0 ? { ms: movedMs } : { lines: aSync })
  // another round or two, to see that nothing mints behind it
  for (let i = 0; i < 3; i++) { await A.hurry(); await sleep(4000) }
  const aSignupsAfter = await A.count(/auth\/v1\/signup/, { since: tClaim })
  const aUidNow = await A.uid()
  check('A: no new user minted after the claim', aSignupsAfter === 0 && (!aUidNow || aUidNow === ids.A[0]), { signupsSinceClaim: aSignupsAfter, signupsBefore: aSignupsBefore, uid: aUidNow === ids.A[0] ? 'unchanged' : aUidNow ? 'CHANGED' : 'cleared' })
  if (aUidNow && !ids.A.includes(aUidNow)) { ids.A.push(aUidNow); saveIds() }
  await A.u.shot('recovery-A-moved').catch(() => {})

  // ── B erases ──
  const tErase = Date.now()
  await B.openDetails()
  const d1 = await B.click('.friends-danger .gbtn')
  await sleep(600)
  const d2 = await B.click('.friends-danger .gbtn.armed')
  check('B: Delete my data tapped twice', d1 && d2, { d1, d2 })
  const toEntry = await B.waitFor(() => B.u.eval('Boolean(document.querySelector(".entry-done"))'), 30000)
  check('B: back on the entry screen after the erase', toEntry >= 0, { ms: toEntry })
  const erased = (await B.taps()).filter((x) => /rpc\/delete_my_data/.test(x.url) && x.t >= tErase)
  check('B: delete_my_data answered 2xx', erased.length === 1 && erased[0].status >= 200 && erased[0].status < 300, erased.map((x) => x.status))
  await sleep(5000)
  check('B: no signup after the erase', (await B.count(/auth\/v1\/signup/, { since: tErase })) === 0)

  for (const p of [A, B]) {
    const bad = p.u.logs.filter((l) => l.startsWith('EXC') || l.startsWith('error'))
    if (bad.length) note(`${p.u.name} console`, bad.slice(0, 8))
  }
} catch (err) {
  check('run completed', false, String(err && err.message || err))
} finally { saveIds(); chrome.close() }
console.log(fail ? 'FAIL' : 'PASS', `${results.filter((l) => l.startsWith('PASS')).length} passed, ${results.filter((l) => l.startsWith('FAIL')).length} failed`)
process.exit(fail ? 1 : 0)
