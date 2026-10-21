import { setWorkerUrl } from 'maplibre-gl'
// MapLibre finds its worker next to its own module, which Vite moves: hand it the worker Vite bundles instead.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import geo from '../data/geo.json'

setWorkerUrl(workerUrl)

export type Point = [number, number]

// Data positions are "design-frame px": the 1440×840 Figma frame at web-map zoom 9 (256 px tiles), centred on
// the original product's view (src/data/geo.json). One px ≈ 200 m. They convert to longitude / latitude here.
const WORLD = 256 * 2 ** geo.zoom
const mercator = (lon: number, lat: number): Point => {
  const r = (lat * Math.PI) / 180
  return [((lon + 180) / 360) * WORLD, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * WORLD]
}
const [CX, CY] = mercator(geo.center.lon, geo.center.lat)

/** Longitude / latitude of a design-frame px position. */
export const lngLat = ([x, y]: Point): Point => {
  const wx = x + CX - 720
  const wy = y + CY - 420
  return [(wx / WORLD) * 360 - 180, (Math.atan(Math.sinh(Math.PI * (1 - (2 * wy) / WORLD))) * 180) / Math.PI]
}

/** The design view: the original product's framing. */
export const HOME = {
  center: [geo.center.lon, geo.center.lat] as Point,
  // MapLibre counts zoom on 512 px tiles: design zoom 9 on 256 px tiles is MapLibre zoom 8.
  zoom: geo.zoom - 1,
}

// Clear base map without keys, vector tiles (OpenFreeMap, OpenMapTiles schema, OpenStreetMap data).
export const STYLE = 'https://tiles.openfreemap.org/styles/positron'
