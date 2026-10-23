// Screenshot of the prototype for the portfolio, with a headless Chrome or Edge.
// Default: the before / after image. 1440 × 751 has the original screenshot's proportions (1082 × 564) and, at
// 1440 px, the map covers the same area (Lake Garda – Trieste); at 2× it stays sharp when scaled down to 1082.
//
//   npm run dev                      (in another terminal)
//   node scripts/capture.mjs [scenario] [width] [height] [scale]     scenario: live (default), archive, forecast…
//   → design-notes/capture-<scenario>-<width>x<height>@<scale>x.png
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [SCENARIO = 'live', W = '1440', H = '751', SCALE = '2'] = process.argv.slice(2)
const URL = `http://localhost:5173/#/?s=${SCENARIO}`
const OUT = `design-notes/capture-${SCENARIO}-${W}x${H}@${SCALE}x.png`
const PORT = 9334

const browser = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((b) => b && existsSync(b))
if (!browser) throw new Error('No Chrome or Edge found: set CHROME to its path.')

const profile = mkdtempSync(join(tmpdir(), 'meteocast-capture-'))
const chrome = spawn(browser, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--hide-scrollbars',
  // WebGL without a GPU, so MapLibre can draw.
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  'about:blank',
])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  let target
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200)
    target = await fetch(`http://127.0.0.1:${PORT}/json`)
      .then((r) => r.json())
      .then((list) => list.find((t) => t.type === 'page'))
      .catch(() => undefined)
  }
  if (!target) throw new Error('Chrome did not start.')

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((ok) => ws.addEventListener('open', ok, { once: true }))
  let id = 0
  const send = (method, params = {}) =>
    new Promise((ok) => {
      const n = ++id
      const onMessage = (e) => {
        const msg = JSON.parse(e.data)
        if (msg.id !== n) return
        ws.removeEventListener('message', onMessage)
        ok(msg.result)
      }
      ws.addEventListener('message', onMessage)
      ws.send(JSON.stringify({ id: n, method, params }))
    })

  await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: +SCALE, mobile: false })
  await send('Page.navigate', { url: URL })

  // The map is ready when the pin appears; then time for the tiles, the fonts and the label placement.
  let ready = false
  for (let i = 0; i < 60 && !ready; i++) {
    await sleep(500)
    const r = await send('Runtime.evaluate', { expression: "!!document.querySelector('[class*=_pin_]')" })
    ready = r?.result?.value === true
  }
  if (!ready) throw new Error('The map did not load in 30 s: is `npm run dev` running?')
  await sleep(6000)
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(OUT, Buffer.from(data, 'base64'))
  ws.close()
  console.log(`${SCENARIO} → ${OUT}`)
} finally {
  chrome.kill()
  await sleep(300)
  // Chrome may still hold the profile for a moment on Windows: retry, and never fail the export for it.
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  } catch {}
}
