// Exports the base map, alone, in the 1440×840 design frame: design-notes/basemap-1440x840.png, the background
// for the Figma screens. It opens the dev-only page #/basemap in a headless Chrome or Edge, waits until MapLibre
// has drawn every tile (the page sets data-map-idle on <body>) and takes the screenshot.
//
//   npm run dev                      (in another terminal)
//   node scripts/export-basemap.mjs [url]       url: default http://localhost:5173/#/basemap
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const URL = process.argv[2] ?? 'http://localhost:5173/#/basemap'
const OUT = 'design-notes/basemap-1440x840.png'
const PORT = 9333

const browser = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((b) => b && existsSync(b))
if (!browser) throw new Error('No Chrome or Edge found: set CHROME to its path.')

const profile = mkdtempSync(join(tmpdir(), 'meteocast-export-'))
const chrome = spawn(browser, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1440,840',
  // WebGL without a GPU, so MapLibre can draw.
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  'about:blank',
])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  // The page target, through the DevTools HTTP endpoint.
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

  // Exact 1440×840 viewport (the window size includes the browser frame), then the page.
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 840, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: URL })

  let idle = false
  for (let i = 0; i < 60 && !idle; i++) {
    await sleep(500)
    const r = await send('Runtime.evaluate', { expression: "document.body.hasAttribute('data-map-idle')" })
    idle = r?.result?.value === true
  }
  if (!idle) throw new Error('The map did not finish loading in 30 s.')
  await sleep(300)
  const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 840, scale: 1 } })
  writeFileSync(OUT, Buffer.from(data, 'base64'))
  ws.close()
  console.log(`basemap → ${OUT}`)
} finally {
  chrome.kill()
  await sleep(300)
  // Chrome may still hold the profile for a moment on Windows: retry, and never fail the export for it.
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  } catch {}
}
