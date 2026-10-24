import type { IconName } from '../icons/Icon'
import { addDays, dayDiff, minutesBetween, modeOf, NOW, shiftHours, type TimeSel } from '../time'
import type { Mode } from '../types'
import catalogue from './layers.json'

export type Ramp = 'rain' | 'snow' | 'temp' | 'neutral'

export type Layer = {
  id: string
  /** One data quantity. A Real time and a Forecast layer with the same stream are twins. */
  stream: string
  name: string
  meta: string
  icon: IconName
  unit: string
  /** Where the values come from: the product or network for observed data, the model for forecasts. */
  source: string
  modes: Mode[]
  interval: 'hour' | 'day'
  /** Resolution in minutes for data measured more often than hourly (5: radar, lightning, gusts). Default 60. */
  stepMin?: number
  /**
   * Forecasts that start with a nowcast: for the first `minutes` after "now" the radar (or the lightning network) is
   * extrapolated every `stepMin` minutes; after that the hourly model takes over.
   */
  nowcast?: { minutes: number; stepMin: number; source: string }
  archiveDays: number
  horizonDays: number
  scale: { max: number; ramp: Ramp }
  /** Live value arrives late: Readout shows "stale" with the delay. */
  liveDelayMin?: number
  /** [dayOffsetFromToday, fromHour, toHour] ranges with no data → Readout "noData". */
  noDataHours?: [number, number, number][]
}

export type LayerGroup = { id: string; title: string; icon: IconName; layers: Layer[] }

export const groups = catalogue.groups as LayerGroup[]
export const allLayers = groups.flatMap((g) => g.layers)
export const layerById = (id: string) => allLayers.find((l) => l.id === id)!
export const groupOf = (layerId: string) => groups.find((g) => g.layers.some((l) => l.id === layerId))!

// User presets behave like groups (src/state/presets.ts keeps this list in step with what is saved).
let presetGroups: LayerGroup[] = []
export const setPresetGroups = (list: LayerGroup[]) => {
  presetGroups = list
}
/** A default group or a user preset. */
export const groupById = (id: string): LayerGroup | undefined => groups.find((g) => g.id === id) ?? presetGroups.find((g) => g.id === id)

/** Real-time section = layers that have Live; Forecast section = forecast-only layers. */
export const sectionOf = (layer: Layer) => (layer.modes.includes('live') ? 'realtime' : 'forecast')

/** Rule 8: does this layer have data on this day at all? (day granularity, for DayChips) */
export function dayAvailable(layer: Layer, day: string, now: TimeSel = NOW): boolean {
  const d = dayDiff(day, now.day)
  if (d < 0) return layer.modes.includes('archive') && -d <= layer.archiveDays
  if (d > 0) return layer.modes.includes('forecast') && d <= layer.horizonDays
  // Today mixes modes. Hourly layers: the hour decides. Daily layers: today's value is the live one,
  // so a forecast-only daily layer starts tomorrow (Screen 02 switches to Fri 16).
  return layer.interval === 'hour' || layer.modes.includes('live')
}

/** Does this layer have data at this exact instant? */
export function instantAvailable(layer: Layer, sel: TimeSel, now: TimeSel = NOW): boolean {
  if (!dayAvailable(layer, sel.day, now)) return false
  // Only on the layer's own grid at that instant: hourly data have no 12:55.
  if (layer.interval === 'hour' && ((sel.minute ?? 0) % stepOf(layer, sel, now) !== 0)) return false
  // Daily layers: one value per day. Past/future days are decided by the day; today needs the mode too,
  // so a live-only daily layer is not available at a forecast hour of today (rule 7 disables it).
  if (layer.interval === 'day') return dayDiff(sel.day, now.day) !== 0 || layer.modes.includes(modeOf(sel, now))
  return layer.modes.includes(modeOf(sel, now))
}

/** Rule 5: first instant with forecast data — next hour for hourly layers, tomorrow (same hour) for daily ones. */
export function firstForecastInstant(layer: Layer, now: TimeSel = NOW): TimeSel {
  return layer.interval === 'day' ? { day: addDays(now.day, 1), hour: now.hour } : shiftHours(now, 1)
}

/** Is this instant inside the layer's nowcast (the first minutes after "now")? */
export function inNowcast(layer: Layer, sel: TimeSel, now: TimeSel = NOW): boolean {
  if (!layer.nowcast) return false
  const m = minutesBetween(sel, now)
  return m > 0 && m <= layer.nowcast.minutes
}

/**
 * Step of the timeline for this layer at this instant, in minutes: 5 for 5-minute data and nowcasts, 60 for hourly,
 * a whole day for daily. Without an instant: the layer's own resolution, outside any nowcast.
 */
export function stepOf(layer: Layer, sel?: TimeSel, now: TimeSel = NOW): number {
  if (layer.interval === 'day') return 1440
  if (sel && inNowcast(layer, sel, now)) return layer.nowcast!.stepMin
  return layer.stepMin ?? 60
}

/** The finest step anywhere in the stream (layer + twin): what dragging on the track snaps to. */
export function finestStep(layer: Layer): number {
  if (layer.interval === 'day') return 1440
  return Math.min(...[layer, twinOf(layer)].flatMap((l) => (l ? [l.stepMin ?? 60, l.nowcast?.stepMin ?? 60] : [])))
}

/** Product, network or model behind the value at this instant: the nowcast has its own source. */
export const sourceAt = (layer: Layer, sel: TimeSel) => (inNowcast(layer, sel) ? layer.nowcast!.source : layer.source)

export const offersMode = (layer: Layer, mode: Mode) => layer.modes.includes(mode)

// ---- Values (generated by scripts/build-data.mjs) ----
import seriesFile from './series.json'

type SeriesFile = {
  start: string
  location: { name: string; coords: string; pin: [number, number] }
  series: Record<string, { decimals: number; values: (number | null)[] }>
}
const data = seriesFile as unknown as SeriesFile

export const location = data.location

/**
 * Value at the selected location, or null when the layer has no data at that instant. The series is hourly;
 * 5-minute data between two hours follow the line between them, with a small deterministic wobble.
 */
export function valueAt(layerId: string, sel: TimeSel): number | null {
  const s = data.series[layerId]
  const d = dayDiff(sel.day, data.start)
  const i = d * 24 + sel.hour
  if (!s || d < 0 || i >= s.values.length) return null
  const v = s.values[i]
  const minute = sel.minute ?? 0
  if (!minute || v === null) return v
  const next = s.values[i + 1] ?? v
  const t = minute / 60
  const wobble = 1 + 0.08 * Math.sin(i * 1.7 + minute * 0.9)
  return Number(Math.max(0, (v + ((next ?? v) - v) * t) * wobble).toFixed(s.decimals))
}

// ---- Stations: the network around the selected location (src/data/geo.json, real towns) ----
import geo from './geo.json'

type Point = [number, number]
export type Station = { name: string; pos: Point }

/** Every station except the selected location, which the pin and the Readout already show. */
export const stations: Station[] = geo.stations.filter((s) => s.name !== location.name).map((s) => ({ name: s.name, pos: s.px as Point }))

/** Coordinates of a station as the card shows them, e.g. "46.07° N, 11.12° E". */
export function coordsOf(name: string): string {
  const s = geo.stations.find((x) => x.name === name)
  return s ? `${s.lat.toFixed(2)}° N, ${s.lon.toFixed(2)}° E` : ''
}

/** Precipitation comes in patches: stations outside them read 0. Other quantities vary smoothly across the map. */
export const isPatchy = (layer: Layer) => /^(water|snow|storms)\//.test(layer.stream) && !/hydrometric|leaf-wetness/.test(layer.stream)

// Weather cells in frame px: c = centre, r = spread, a = strength. They drift a little hour by hour.
// Rain echoes the original product screenshot: heavy over Belluno and Garda – Verona, showers over Trento,
// rain on the plain and in Friuli. Snow sits on the high ground. The smooth field is a gentle north–south gradient.
type Cell = { c: Point; r: number; a: number }
const cells: Record<'rain' | 'snow' | 'smooth', Cell[]> = {
  rain: [
    { c: [398, 395], r: 80, a: 1 },
    { c: [797, 357], r: 85, a: 2 },
    { c: [300, 640], r: 100, a: 1.6 },
    { c: [600, 650], r: 80, a: 0.9 },
    { c: [1180, 330], r: 95, a: 1.1 },
    { c: [483, 169], r: 60, a: 0.5 },
    { c: [900, 180], r: 70, a: 0.7 },
  ],
  snow: [
    { c: [398, 395], r: 80, a: 1.3 },
    { c: [470, 110], r: 110, a: 1.5 },
    { c: [700, 170], r: 120, a: 1.6 },
    { c: [900, 140], r: 90, a: 1.3 },
    { c: [130, 330], r: 100, a: 1.4 },
    { c: [1100, 200], r: 90, a: 1.1 },
  ],
  smooth: [
    { c: [700, 760], r: 420, a: 0.45 },
    { c: [600, 80], r: 380, a: -0.3 },
    { c: [1250, 450], r: 260, a: 0.15 },
  ],
}

const seedOf = (s: string) => ([...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261) % 628) / 100

/** Field strength at p, hour h (hours since the window start). Patchy fields are 0 outside the cells. */
function field(kind: keyof typeof cells, [x, y]: Point, h: number, seed: number): number {
  let f = 0
  cells[kind].forEach(({ c, r, a }, k) => {
    const cx = c[0] + 45 * Math.sin(h / 9 + k * 1.7 + seed)
    const cy = c[1] + 30 * Math.cos(h / 13 + k * 2.3 + seed)
    const amp = a * (0.75 + 0.25 * Math.sin(h / 7 + k + seed))
    f += amp * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * r * r))
  })
  return kind === 'smooth' ? Math.max(0.1, 0.7 + f) : Math.max(0, f - 0.4)
}

/**
 * Values at every station (same order as `stations`), or null when the layer has no data at that instant.
 * Scaled so the field equals Trento's value at Trento: the network and the Readout always agree.
 */
export function stationValues(layer: Layer, sel: TimeSel): (number | null)[] {
  const v0 = valueAt(layer.id, sel)
  if (v0 === null) return stations.map(() => null)
  const kind = !isPatchy(layer) ? 'smooth' : layer.stream.startsWith('snow/') ? 'snow' : 'rain'
  const h = dayDiff(sel.day, data.start) * 24 + (layer.interval === 'day' ? 12 : sel.hour + (sel.minute ?? 0) / 60)
  const seed = seedOf(layer.stream)
  const ratio = v0 / field(kind, location.pin, h, seed)
  const dec = data.series[layer.id].decimals
  const cap = layer.unit === '%' ? 100 : Infinity
  return stations.map((s) => Number(Math.min(cap, field(kind, s.pos, h, seed) * ratio).toFixed(dec)))
}

// ---- Twins: the same quantity split into a Real time and a Forecast layer ----
// "The user thinks about the data, not the mode": Hourly rainfall (real time) and Hourly rainfall
// (forecast) share a stream id: one data stream on the timeline. Availability is the union of both.

/** The other layer of the same stream (declared in layers.json, not guessed from the name). */
export function twinOf(layer: Layer): Layer | undefined {
  return allLayers.find((l) => l.id !== layer.id && l.stream === layer.stream)
}

/** Rule 8 for the timeline: a day is unavailable only if neither the layer nor its twin has data. */
export const streamDayAvailable = (layer: Layer, day: string) => {
  const twin = twinOf(layer)
  return dayAvailable(layer, day) || (twin !== undefined && dayAvailable(twin, day))
}

export const streamInstantAvailable = (layer: Layer, sel: TimeSel) => {
  const twin = twinOf(layer)
  return instantAvailable(layer, sel) || (twin !== undefined && instantAvailable(twin, sel))
}

// ---- Streams: what the layer panel lists (one entry per data quantity, UX review U1) ----

export type Stream = { id: string; name: string; meta: string; icon: IconName; layers: Layer[] }

/** Streams of a group, in panel order (first appearance of each stream). */
export function streamsOf(group: LayerGroup): Stream[] {
  const out: Stream[] = []
  for (const l of group.layers) {
    const s = out.find((x) => x.id === l.stream)
    if (s) s.layers.push(l)
    else out.push({ id: l.stream, name: l.name, meta: l.meta, icon: l.icon, layers: [l] })
  }
  return out
}

export const streamById = (id: string): Stream => {
  for (const g of groups) {
    const s = streamsOf(g).find((x) => x.id === id)
    if (s) return s
  }
  throw new Error(`Unknown stream ${id}`)
}

/** Modes the stream has data in, in timeline order. */
export const modesOfStream = (s: Stream): Mode[] =>
  (['archive', 'live', 'forecast'] as Mode[]).filter((m) => s.layers.some((l) => l.modes.includes(m)))
