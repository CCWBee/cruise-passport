// The shaker on production, end to end, without minting a user: loads ?seed&nosync (the seed only
// fills an untouched passport, and nosync keeps the run off the backend), opens the sheet from the
// foot of For you, presses, reads the reveal, goes to the drink sheet, closes it and samples the
// return. The return is the case that once replayed the whole opening on a fresh mount; it must
// read `is-open is-still` at the end values (lid -105, drop -84) in every sample with the live line
// empty. Prints the served shell hash first, so a stale edge read is visible as such.
// usage: node shake-live.mjs [base]    base defaults to https://cruise.charlesbee.org
// Env: SHOTS_DIR (default shots), CDP_PORT (default: derived from pid)
import { launch, OUT } from './cdp.mjs'

const BASE = process.argv[2] || 'https://cruise.charlesbee.org'
const W = 390, H = 844

const READ = `(() => {
  const sh = document.querySelector('.shaker'); const lid = sh && sh.querySelector('.shaker-lid'); const tok = sh && sh.querySelector('.shaker-token'); const ans = document.querySelector('.shake-answer')
  const mat = (el) => { const m = el && getComputedStyle(el).transform.match(/matrix\\(([^)]+)\\)/); return m ? m[1].split(',').map(Number) : null }
  const deg = (el) => { const m = mat(el); return m ? Math.round(Math.atan2(m[1], m[0]) * 180 / Math.PI * 10) / 10 : null }
  const ty = (el) => { const m = mat(el); return m ? Math.round(m[5] * 10) / 10 : null }
  return JSON.stringify({ cls: sh && sh.getAttribute('class'), lid: deg(lid), token: ty(tok), tokenOpacity: tok && getComputedStyle(tok).opacity, cardOpacity: ans && getComputedStyle(ans).opacity,
    name: ans && ans.querySelector('h3')?.textContent, drink: ans && ans.dataset.drink, live: document.querySelector('.sheet .sr-only[aria-live]')?.textContent ?? null,
    btn: document.querySelector('.shake-go')?.textContent, sheets: document.querySelectorAll('.sheet').length })
})()`

const chrome = await launch({ width: W, height: H })
const out = {}
try {
  const u = await chrome.user('shake')
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true }, u.sessionId)
  const click = (sel) => u.eval(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  await u.goto(BASE + '/?seed&nosync'); await u.sleep(2500)
  out.shell = await u.eval(`(() => { const s = [...document.scripts].map((s) => s.src).find((s) => /assets\\//.test(s)); return s ? s.replace(/.*\\//, '') : null })()`)
  out.opened = await click('.shake-open'); await u.sleep(1800)
  out.idle = await u.eval(`JSON.stringify({ lid: !!document.querySelector('.shaker-lid'), token: !!document.querySelector('.shaker-token'), window: !!document.querySelector('.shaker-window'), btn: document.querySelector('.shake-go')?.textContent })`)
  out.pressed = await click('.shake-go'); await u.sleep(3400)   // 1800 shake + 300 hold + the lid and the drop
  out.revealed = await u.eval(READ); await u.shot('shake-live-reveal')
  out.went = await click('.shake-go'); await u.sleep(1600)
  out.drinkSheet = await u.eval(`JSON.stringify({ sheets: document.querySelectorAll('.sheet').length, title: document.querySelector('.sheet h2')?.textContent })`)
  out.closed = await click('.sheet .sheet-close, .sheet [aria-label="Close"]')
  const samples = []
  for (let i = 0; i < 8; i++) { await u.sleep(120); samples.push(JSON.parse(await u.eval(READ))) }
  out.returnSamples = samples.map((s) => `${s.cls} lid ${s.lid} token ${s.token}/${s.tokenOpacity} card ${s.cardOpacity} live "${s.live}"`)
  await u.sleep(1500); await u.shot('shake-live-return')
  out.returned = await u.eval(READ)
  out.errors = u.logs.filter((l) => /EXC|error/i.test(l)).slice(0, 5)
} finally { chrome.close() }
console.log(JSON.stringify(out, null, 1))
console.log('shots in', OUT)
