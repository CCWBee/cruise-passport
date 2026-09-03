// Minimal CDP harness: one headless Chrome, N isolated browser contexts (separate storage), each
// driven as a "user". Node 22 (global WebSocket). Kills only the Chrome it spawned.
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
// Port is per-process so parallel agents can each run their own headless Chrome (CDP_PORT overrides).
const PORT = Number(process.env.CDP_PORT) || 9400 + (process.pid % 400)
export const OUT = path.resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), process.env.SHOTS_DIR || 'shots')
mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function launch({ width = 500, height = 900 } = {}) {
  const profile = path.join(OUT, '..', 'profile-' + Date.now())
  const child = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`,
    // CDP_GPU=1 keeps WebGL (SwiftShader) so the live sea renders; default is the cheap CSS fallback
    ...(process.env.CDP_GPU ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] : ['--disable-gpu']),
    '--no-first-run', 'about:blank',
  ], { stdio: 'ignore' })
  let version
  for (let i = 0; i < 50; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); break } catch { await sleep(200) }
  }
  if (!version) throw new Error('chrome did not come up')
  const ws = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 0
  const pending = new Map()
  const listeners = []
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result) }
    else if (msg.method) listeners.forEach((l) => l(msg))
  }
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const m = ++id; pending.set(m, { res, rej }); ws.send(JSON.stringify({ id: m, method, params, sessionId })) })
  const waitFor = (method, sessionId, timeout = 15000) => new Promise((res, rej) => {
    const t = setTimeout(() => { listeners.splice(listeners.indexOf(l), 1); rej(new Error('timeout ' + method)) }, timeout)
    const l = (msg) => { if (msg.method === method && (!sessionId || msg.sessionId === sessionId)) { clearTimeout(t); listeners.splice(listeners.indexOf(l), 1); res(msg.params) } }
    listeners.push(l)
  })

  async function user(name) {
    const { browserContextId } = await send('Target.createBrowserContext')
    const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId, width, height })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    await send('Page.enable', {}, sessionId)
    await send('Runtime.enable', {}, sessionId)
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true }, sessionId)
    const logs = []
    listeners.push((msg) => {
      if (msg.sessionId !== sessionId) return
      if (msg.method === 'Runtime.consoleAPICalled') logs.push(msg.params.type + ': ' + msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
      if (msg.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text))
    })
    const u = {
      name, logs, sessionId,
      async goto(url) { const load = waitFor('Page.loadEventFired', sessionId); await send('Page.navigate', { url }, sessionId); await load; await sleep(400) },
      async eval(expr) {
        const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId)
        if (r.exceptionDetails) throw new Error(name + ' eval: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text))
        return r.result.value
      },
      async shot(label) {
        const { data } = await send('Page.captureScreenshot', { format: 'png' }, sessionId)
        const file = path.join(OUT, `${label}.png`); writeFileSync(file, Buffer.from(data, 'base64')); return file
      },
      async url() { return u.eval('location.href') },
      sleep,
    }
    return u
  }
  return { user, send, close: () => { try { ws.close() } catch {} ; spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }) } }
}
