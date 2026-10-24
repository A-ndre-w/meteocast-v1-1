// Overlays (designer decision, 2026-10-24, concept A): one main layer draws the coloured field and the value
// labels; up to three more data are drawn on top as symbols, so two colour fields never cover each other.
// Lightning as bolts, wind as arrows, everything else as small outlined values under the stations.
import { instantAvailable, location, stationValues, streamById, valueAt, type Layer } from '../data'
import type { Point } from '../map/geo'
import type { TimeSel } from '../time'
import { normalize } from './rules'

export const MAX_OVERLAYS = 3

export type OverlayKind = 'bolt' | 'arrow' | 'value'

export const overlayKind = (stream: string): OverlayKind => (stream === 'water/lightning' ? 'bolt' : stream.startsWith('wind/') ? 'arrow' : 'value')

export type Overlay = {
  stream: string
  name: string
  unit: string
  kind: OverlayKind
  /** The layer that has data at the selected instant (Real time or Forecast twin); undefined = none now. */
  layer?: Layer
  /** One value per station, in the network's order (Trento first). */
  values: (number | null)[]
  /** Wind only: where the arrows point, degrees clockwise from north. */
  dirs: number[]
  /** Largest value now: symbols scale against it. */
  max: number
}

/** An overlay's data at the selected instant, for every station of the network (Trento first, as on the map). */
export function overlayAt(stream: string, sel: TimeSel, network: { name: string; pos: Point }[]): Overlay {
  const s = streamById(stream)
  const layer = s.layers.find((l) => instantAvailable(l, normalize(l, sel, 'nearest')))
  const at = layer && normalize(layer, sel, 'nearest')
  const others = layer && at ? stationValues(layer, at) : []
  const values = network.map((st, i) => (!layer || !at ? null : st.name === location.name ? valueAt(layer.id, at) : (others[i - 1] ?? null)))
  // Wind from the south-west (as in the wind alert), turning a little across the map and over the hours.
  const h = sel.hour + (sel.minute ?? 0) / 60
  const dirs = network.map((st) => 45 + 25 * Math.sin(st.pos[0] / 150 + st.pos[1] / 210 + h / 5))
  const max = Math.max(0, ...values.filter((v): v is number => v !== null))
  return { stream, name: s.name, unit: s.layers[0].unit, kind: overlayKind(stream), layer, values, dirs, max }
}
