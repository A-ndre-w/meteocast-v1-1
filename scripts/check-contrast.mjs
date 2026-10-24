// WCAG 2.x contrast check for the text/background pairs the UI actually uses.
// Run: npm run contrast. Fails (exit 1) if any pair is below its target.
import { readFileSync } from 'node:fs'

const { color } = JSON.parse(readFileSync('design-notes/token.json', 'utf8'))

// Composite a #RRGGBBAA colour over an opaque background.
const parse = (hex) => {
  const h = hex.replace('#', '')
  const n = (i) => parseInt(h.slice(i, i + 2), 16)
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 }
}
const over = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
})
const lum = ({ r, g, b }) => {
  const c = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)
}
const ratio = (fgKey, bgKey, baseKey = 'bg/canvas') => {
  const base = parse(color[baseKey])
  const bg = over(parse(color[bgKey]), base)
  const fg = over(parse(color[fgKey]), bg)
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

// [foreground, background, target, where it is used]
const pairs = [
  ['text/primary', 'surface/raised', 4.5, 'body text on cards'],
  ['text/secondary', 'surface/raised', 4.5, 'meta, section labels'],
  ['text/tertiary', 'surface/raised', 4.5, 'readout value, scale labels'],
  ['text/tertiary', 'bg/deep', 4.5, 'archive timebar labels'],
  ['text/tertiary', 'bg/forecast', 4.5, 'forecast timebar labels'],
  ['text/tertiary', 'surface/sunken', 4.5, 'speed chips, Now (off)'],
  ['text/secondary', 'surface/sunken', 4.5, 'data source tag in the legend'],
  ['mode/archive', 'bg/deep', 4.5, 'ARCHIVE −24h under the time'],
  ['mode/forecast-strong', 'bg/forecast', 4.5, 'FORECAST +5min under the time'],
  ['text/primary', 'surface/default', 4.5, 'day chips'],
  ['icon/selected', 'mode/archive', 4.5, 'ARCHIVE badge, selected archive chip'],
  ['icon/selected', 'mode/forecast-strong', 4.5, 'FORECAST badge, selected forecast chip'],
  ['icon/selected', 'icon/default', 4.5, 'selected chip in Live'],
  ['accent/on', 'accent/strong', 4.5, 'Now (on)'],
  ['accent/strong', 'surface/raised', 4.5, 'Undo, Go to live'],
  ['accent/strong', 'bg/deep', 4.5, 'Back to live (archive pill)'],
  ['accent/strong', 'bg/forecast', 4.5, 'Back to live (forecast pill)'],
  ['mode/forecast-strong', 'surface/raised', 4.5, '"Forecast" word in toast'],
  ['text/primary', 'accent/soft', 4.5, 'selected layer label and speed chip (accent-soft fill)'],
  ['status/danger', 'surface/raised', 3, 'bell icon (non-text, 3:1)'],
  ['accent/on-dark', 'text/primary', 4.5, 'link on the dark tooltip'],
  ['accent/default', 'surface/raised', 3, 'selected border, focus, pin (non-text, 3:1)'],
  // Value labels on the map, filled with their data class: dark text on classes 1–3, white on 4–5.
  ...['rain', 'snow', 'temp', 'neutral'].flatMap((r) =>
    [1, 2, 3, 4, 5].map((k) => [k <= 3 ? 'text/primary' : 'icon/selected', `data/${r}-${k}`, 4.5, `value label, ${r} class ${k}`]),
  ),
  // Supplementary cue: mode is always also given by text + icon, so 1.4.11 does not require 3:1.
  ['mode/forecast', 'bg/forecast', 3, 'INFO forecast stripe (supplementary, mode also in text)', true],
  // Reference only: the original Figma pairings that failed AA.
  ['icon/selected', 'mode/forecast', 4.5, 'REFERENCE Figma badge (replaced)', true],
  ['accent/default', 'surface/raised', 4.5, 'REFERENCE brand green #00A644 as text: not used for text, accent/strong is', true],
]

let failed = 0
for (const [fg, bg, target, use, reference] of pairs) {
  const r = ratio(fg, bg)
  const ok = r >= target
  if (!ok && !reference) failed++
  const flag = ok ? 'PASS' : reference ? 'info' : 'FAIL'
  console.log(`${flag}  ${r.toFixed(2).padStart(5)}:1 (≥${target})  ${fg} on ${bg} — ${use}`)
}
if (failed) {
  console.error(`\n${failed} pair(s) below target`)
  process.exit(1)
}
