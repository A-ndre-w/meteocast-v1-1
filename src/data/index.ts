import type { IconName } from '../icons/Icon'
import { addDays, dayDiff, modeOf, NOW, shiftHours, type TimeSel } from '../time'
import type { Mode } from '../types'
import catalogue from './layers.json'

export type Ramp = 'rain' | 'snow' | 'temp' | 'neutral'

export type Layer = {
  id: string
  name: string
  meta: string
  icon: IconName
  unit: string
  modes: Mode[]
  interval: 'hour' | 'day'
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
  if (layer.interval === 'day') return true
  return layer.modes.includes(modeOf(sel, now))
}

/** Rule 5: first instant with forecast data — next hour for hourly layers, tomorrow (same hour) for daily ones. */
export function firstForecastInstant(layer: Layer, now: TimeSel = NOW): TimeSel {
  return layer.interval === 'day' ? { day: addDays(now.day, 1), hour: now.hour } : shiftHours(now, 1)
}

export const offersMode = (layer: Layer, mode: Mode) => layer.modes.includes(mode)
