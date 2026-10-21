// Builds the base map from real OpenStreetMap-based tiles for the area of the original MeteoCast screenshot
// (Trentino – Veneto), so the portfolio can show a before / after of the same place.
// Framing fitted on the screenshot: centre 46.021° N, 12.006° E; zoom 9 covers the same span at 1440 px.
//
//   node scripts/build-basemap.mjs [source] [out] [--muted]     source: topo (OpenTopoMap, default) | osm
//
// Output: public/basemap.webp (1440 × 840 frame + BLEED px of extra map on the left, see MapView), src/data/geo.json
// (frame pixel positions of real places) and design-notes/basemap-1440x840.png (the bare frame, for the Figma screens).
// One static image from ~24 tiles, built once and cached in .cache/tiles (git-ignored): light use, within the
// providers' tile usage policies. The attribution is shown on the map (geo.json → attribution).
// --muted: desaturates and lightens the base toward the design system canvas. The data layer is never touched.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const SOURCES = {
  topo: {
    url: (x, y, z) => `https://${'abc'[(x + y) % 3]}.tile.opentopomap.org/${z}/${x}/${y}.png`,
    attribution: 'Map data © OpenStreetMap contributors, SRTM · Map style © OpenTopoMap (CC-BY-SA)',
  },
  osm: {
    url: (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
    attribution: '© OpenStreetMap contributors',
  },
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const MUTED = process.argv.includes('--muted')
const SOURCE = args[0] ?? 'topo'
const OUT = args[1] ?? 'public/basemap.webp'
if (!SOURCES[SOURCE]) throw new Error(`Unknown source ${SOURCE}`)

const CENTER = { lon: 12.006, lat: 46.021 }
const ZOOM = 9
const W = 1440
const H = 840
const TILE = 256
// Extra map west of the frame: on narrow windows MapView pans right so Trento stays clear of the layer panel.
const BLEED = 240

const world = (lon, lat) => {
  const s = TILE * 2 ** ZOOM
  const r = (lat * Math.PI) / 180
  return [((lon + 180) / 360) * s, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * s]
}
const [cx, cy] = world(CENTER.lon, CENTER.lat)
const left = cx - W / 2
const top = cy - H / 2
/** Frame pixel (1440 × 840) of a coordinate. */
const toFrame = (lon, lat) => {
  const [x, y] = world(lon, lat)
  return [Math.round(x - left), Math.round(y - top)]
}

async function tile(x, y) {
  const dir = join('.cache', 'tiles', SOURCE, String(ZOOM), String(x))
  const file = join(dir, `${y}.png`)
  if (existsSync(file)) return readFileSync(file)
  const url = SOURCES[SOURCE].url(x, y, ZOOM)
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MeteoCast-portfolio-prototype/1.1 (one static basemap, cached; github.com/A-ndre-w/meteocast-v1-1)' },
  })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  mkdirSync(dir, { recursive: true })
  writeFileSync(file, buf)
  await new Promise((r) => setTimeout(r, 150)) // be gentle with volunteer-run tile servers
  return buf
}

const x0 = Math.floor((left - BLEED) / TILE)
const y0 = Math.floor(top / TILE)
const x1 = Math.floor((left + W) / TILE)
const y1 = Math.floor((top + H) / TILE)
const composites = []
for (let x = x0; x <= x1; x++)
  for (let y = y0; y <= y1; y++) composites.push({ input: await tile(x, y), left: (x - x0) * TILE, top: (y - y0) * TILE })

const stitched = await sharp({
  create: { width: (x1 - x0 + 1) * TILE, height: (y1 - y0 + 1) * TILE, channels: 3, background: '#f2f2f0' },
})
  .composite(composites)
  .png()
  .toBuffer()

const ox = Math.round(left - BLEED - x0 * TILE)
const oy = Math.round(top - y0 * TILE)
const look = (img) => (MUTED ? img.modulate({ saturation: 0.35, brightness: 1.06 }) : img)
await look(sharp(stitched).extract({ left: ox, top: oy, width: W + BLEED, height: H })).webp({ quality: 86 }).toFile(OUT)
if (!args[1]) await look(sharp(stitched).extract({ left: ox + BLEED, top: oy, width: W, height: H })).png().toFile('design-notes/basemap-1440x840.png')

// Weather stations shown on the map: real towns of Trentino – Alto Adige, Veneto, Friuli and the edges of
// Lombardy and Carinthia, roughly as dense as the original product's network. Trento is the selected location.
// [name, lon, lat] — positions to about 1 km, enough at zoom 9 (1 px ≈ 200 m).
const STATIONS = [
  ['Trento', 11.1217, 46.0679], ['Rovereto', 11.04, 45.89], ['Arco', 10.886, 45.918], ['Riva del Garda', 10.84, 45.885],
  ['Pergine Valsugana', 11.24, 46.06], ['Levico Terme', 11.3, 46.01], ['Borgo Valsugana', 11.457, 46.052], ['Cles', 11.034, 46.364],
  ['Malè', 10.913, 46.353], ['Tione di Trento', 10.725, 46.035], ['Pinzolo', 10.766, 46.16], ['Cavalese', 11.46, 46.29],
  ['Predazzo', 11.6, 46.31], ['Canazei', 11.77, 46.476], ['San Martino di Castrozza', 11.8, 46.26], ['Fiera di Primiero', 11.83, 46.176],
  ['Mezzolombardo', 11.09, 46.21], ['Ala', 11.0, 45.76], ['Storo', 10.58, 45.85], ['Folgaria', 11.17, 45.92],
  ['Bolzano', 11.3548, 46.4983], ['Merano', 11.16, 46.67], ['Bressanone', 11.66, 46.715], ['Brunico', 11.94, 46.8],
  ['Egna', 11.27, 46.32], ['Silandro', 10.77, 46.63], ['Ortisei', 11.67, 46.575], ['San Candido', 12.28, 46.73],
  ['Chiusa', 11.57, 46.64], ['Caldaro', 11.24, 46.41], ['Corvara', 11.87, 46.55],
  ['Edolo', 10.33, 46.18], ['Bormio', 10.37, 46.47], ['Ponte di Legno', 10.51, 46.26], ['Breno', 10.3, 45.96], ['Salò', 10.52, 45.61],
  ['Belluno', 12.2167, 46.1403], ['Feltre', 11.91, 46.0186], ['Agordo', 12.03, 46.28], ['Cortina d’Ampezzo', 12.1357, 46.5405],
  ['Pieve di Cadore', 12.37, 46.43], ['Auronzo di Cadore', 12.44, 46.56], ['Arabba', 11.875, 46.497], ['Longarone', 12.3, 46.27],
  ['Asiago', 11.51, 45.875], ['Bassano del Grappa', 11.7339, 45.7667], ['Schio', 11.36, 45.71], ['Thiene', 11.48, 45.71],
  ['Valdagno', 11.3, 45.65], ['Recoaro Terme', 11.22, 45.71], ['Vicenza', 11.5475, 45.5455], ['Verona', 10.99, 45.44],
  ['Bussolengo', 10.85, 45.47], ['Malcesine', 10.81, 45.76], ['Bardolino', 10.72, 45.55], ['Castelfranco Veneto', 11.93, 45.67],
  ['Montebelluna', 12.05, 45.78], ['Valdobbiadene', 11.99, 45.9], ['Conegliano', 12.3, 45.89], ['Vittorio Veneto', 12.3, 45.99],
  ['Treviso', 12.2433, 45.6669], ['Padova', 11.88, 45.41], ['Cittadella', 11.78, 45.65], ['Mestre', 12.24, 45.49],
  ['Venezia', 12.33, 45.44], ['San Donà di Piave', 12.57, 45.63], ['Jesolo', 12.64, 45.53], ['Oderzo', 12.49, 45.78],
  ['Pordenone', 12.66, 45.96], ['Sacile', 12.5, 45.95], ['Maniago', 12.71, 46.17], ['Spilimbergo', 12.9, 46.11],
  ['Tolmezzo', 13.01, 46.4], ['Gemona del Friuli', 13.14, 46.28], ['Udine', 13.235, 46.065], ['Cividale del Friuli', 13.43, 46.09],
  ['Palmanova', 13.31, 45.905], ['Latisana', 13.0, 45.78], ['Codroipo', 12.98, 45.96], ['Ampezzo', 12.8, 46.42],
  ['Forni di Sopra', 12.58, 46.42], ['Tarvisio', 13.58, 46.505], ['Gorizia', 13.62, 45.94], ['Lignano', 13.14, 45.68],
  ['Grado', 13.39, 45.68], ['Monfalcone', 13.53, 45.81], ['Trieste', 13.77, 45.65],
  ['Kötschach', 12.99, 46.67], ['Hermagor', 13.37, 46.63], ['Villach', 13.85, 46.61],
]
const stations = STATIONS.map(([name, lon, lat]) => ({ name, lon, lat, px: toFrame(lon, lat) })).filter(
  ({ px: [x, y] }) => x >= 10 - BLEED && x <= W - 10 && y >= 10 && y <= H - 10,
)
if (!args[1]) {
  const doc = 'Generated by scripts/build-basemap.mjs — weather stations in frame pixels (1440×840; x < 0 is the bleed on the left).'
  writeFileSync('src/data/geo.json', JSON.stringify({ _doc: doc, source: SOURCE, attribution: SOURCES[SOURCE].attribution, muted: MUTED, center: CENTER, zoom: ZOOM, bleed: BLEED, stations }, null, 1) + '\n')
}
console.log(`${SOURCE}${MUTED ? ' (muted)' : ''}: ${composites.length} tiles → ${OUT} (${W + BLEED}×${H}), ${stations.length} stations`)
