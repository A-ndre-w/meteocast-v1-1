// Behaviour rules of the designer brief, as pure functions: (view, intent) → (next view, notice).
// No React here, so each rule can be read and checked on its own.
import {
  allLayers,
  dayAvailable,
  firstForecastInstant,
  groups,
  instantAvailable,
  layerById,
  twinOf,
  type Layer,
} from '../data'
import { addDays, dayDiff, dayWindow, modeOf, NOW, type TimeSel } from '../time'
import type { Mode } from '../types'

/** What the user is looking at. Undo restores a whole View. */
export type View = { groupId: string; layerId: string; sel: TimeSel }

export type Notice =
  /** Rule 5: forecast-only layer picked in Live/Archive → jumped to the first forecast instant. */
  | { type: 'forecastOnly'; layer: Layer; undo: View }
  /** Forecast layer picked in Forecast, but its data starts later (e.g. daily layers start tomorrow). */
  | { type: 'forecastStarts'; layer: Layer; day: string; undo: View }
  /** Explicit move across "now": the stream continues on its twin layer. Never silent. */
  | { type: 'twin'; layer: Layer; mode: Mode; undo: View }
  /** Now / Back to live with a layer that has no live data: fell back to a live layer of the group. */
  | { type: 'noLive'; from: Layer; to: Layer; undo: View }
  /** Screen 03 (block and warn): neither the layer nor its twin has data in that mode. Time does not move. */
  | { type: 'blockedModes'; layer: Layer; modes: Mode[] }
  /** Rule 8: beyond the stream's archive or forecast horizon. Time does not move. */
  | { type: 'blockedHorizon'; layer: Layer; day: string; lastDay: string }
  /** Buttons outside the v1 scope (search, alerts, presets): say so instead of doing nothing. */
  | { type: 'notInPrototype'; feature: string }

export type Result = { view: View; notice?: Notice }

const windowDays = dayWindow().map((d) => d.day)
const inWindow = (sel: TimeSel) => windowDays.includes(sel.day)
const groupIdOf = (layer: Layer) => groups.find((g) => g.layers.includes(layer))!.id
const streamModes = (layer: Layer): Mode[] => {
  const twin = twinOf(layer)
  const all = new Set([...layer.modes, ...(twin?.modes ?? [])])
  return (['live', 'archive', 'forecast'] as Mode[]).filter((m) => all.has(m))
}

/** Rule 1 + 9: the mode shown is always the mode of the selected instant. */
export const modeOfView = (view: View) => modeOf(view.sel)

/**
 * Manual gesture (click day, click/drag track, arrows, ‹ ›): may cross "now".
 * Layer has data → move. Twin has data → move + switch to twin (toast, Undo). Neither → block + warn.
 */
/** Daily layers hide the hour: on today their instant is always "now". */
const normalize = (layer: Layer, sel: TimeSel): TimeSel =>
  layer.interval === 'day' && sel.day === NOW.day ? { ...sel, hour: NOW.hour } : sel

export function moveExplicit(view: View, rawTarget: TimeSel): Result {
  if (!inWindow(rawTarget)) return { view }
  const layer = layerById(view.layerId)
  const target = normalize(layer, rawTarget)
  if (instantAvailable(layer, target)) return { view: { ...view, sel: target } }

  const twin = twinOf(layer)
  if (twin && instantAvailable(twin, target)) {
    return {
      view: { groupId: groupIdOf(twin), layerId: twin.id, sel: target },
      notice: { type: 'twin', layer: twin, mode: modeOf(target), undo: view },
    }
  }
  return { view, notice: blockNotice(layer, target) }
}

function blockNotice(layer: Layer, target: TimeSel): Notice {
  const modes = streamModes(layer)
  const targetMode = layer.interval === 'day' ? dayMode(target.day) : modeOf(target)
  if (modes.includes(targetMode) && targetMode !== 'live') {
    // The mode exists for this stream, the day is just out of range: say where the data ends.
    const candidates = windowDays.filter((d) => [layer, twinOf(layer)].some((l) => l && dayAvailable(l, d)))
    const lastDay = targetMode === 'forecast' ? candidates[candidates.length - 1] : candidates[0]
    if (lastDay) return { type: 'blockedHorizon', layer, day: target.day, lastDay }
  }
  return { type: 'blockedModes', layer, modes }
}

const dayMode = (day: string): Mode => {
  const d = dayDiff(day, NOW.day)
  return d < 0 ? 'archive' : d > 0 ? 'forecast' : 'live'
}

/**
 * Rule 7: a layer that cannot show data now and has no forecast is disabled (tooltip + Back to live).
 * Forecast-capable layers are never disabled: picking them moves time instead (rule 5).
 */
export function disabledReason(layer: Layer, view: View): string | null {
  if (instantAvailable(layer, view.sel) || layer.modes.includes('forecast')) return null
  const mode = modeOfView(view)
  if (mode === 'forecast') return 'Real-time data only. Not available as forecast.'
  if (mode === 'archive') {
    return layer.modes.includes('archive')
      ? `Archive goes back ${layer.archiveDays} days.`
      : 'Live data only. This layer has no archive.'
  }
  return 'No data for this hour.'
}

/** Picking a layer in the panel. Rule 5 lives here; rule 7 layers never reach it (disabled). */
export function selectLayer(view: View, layerId: string): Result {
  const layer = layerById(layerId)
  const next: View = { groupId: groupIdOf(layer), layerId, sel: view.sel }
  if (instantAvailable(layer, view.sel)) return { view: next }

  if (layer.modes.includes('forecast')) {
    const sel = firstForecastInstant(layer)
    const mode = modeOfView(view)
    // Rule 5: from Live (or Archive) a forecast-only layer jumps to its first forecast instant.
    // Undo restores the PREVIOUS view, Archive included.
    if (mode !== 'forecast') return { view: { ...next, sel }, notice: { type: 'forecastOnly', layer, undo: view } }
    return { view: { ...next, sel }, notice: { type: 'forecastStarts', layer, day: sel.day, undo: view } }
  }
  return { view } // disabled layer (rule 7): nothing happens
}

/** Rule 10: switching group never moves time. Pick the first layer that has data now, else apply rule 5. */
export function selectGroup(view: View, groupId: string): Result {
  const group = groups.find((g) => g.id === groupId)!
  if (group.layers.some((l) => l.id === view.layerId)) return { view: { ...view, groupId } }
  const ready = group.layers.find((l) => instantAvailable(l, view.sel))
  if (ready) return { view: { groupId, layerId: ready.id, sel: view.sel } }
  const forecast = group.layers.find((l) => l.modes.includes('forecast'))
  if (forecast) return selectLayer({ ...view, groupId }, forecast.id)
  return { view: { groupId, layerId: group.layers[0].id, sel: view.sel } }
}

/** Every "Back to live" (timebar, ModePill, disabled-layer tooltip). Explicit intent: no toast unless the layer changes unexpectedly. */
export function goLive(view: View, layerId = view.layerId): Result {
  const layer = layerById(layerId)
  const sel = NOW
  if (instantAvailable(layer, sel)) return { view: { groupId: groupIdOf(layer), layerId, sel } }
  const twin = twinOf(layer)
  if (twin && instantAvailable(twin, sel)) return { view: { groupId: groupIdOf(twin), layerId: twin.id, sel } }
  const group = groups.find((g) => g.id === groupIdOf(layer))!
  const live = group.layers.find((l) => instantAvailable(l, sel)) ?? allLayers.find((l) => instantAvailable(l, sel))!
  return {
    view: { groupId: groupIdOf(live), layerId: live.id, sel },
    notice: { type: 'noLive', from: layer, to: live, undo: view },
  }
}

/**
 * Play (automatic): never crosses "now". Loops over the instants of the visible day that the selected
 * layer itself has (today in Live/Archive: 00→13; today in Forecast: 14→23). Daily layers loop over days.
 */
export function playStep(view: View): View {
  const layer = layerById(view.layerId)
  if (layer.interval === 'day') {
    const days = windowDays.filter((d) => dayAvailable(layer, d))
    if (!days.length) return view
    const i = days.indexOf(view.sel.day)
    return { ...view, sel: normalize(layer, { ...view.sel, day: days[(i + 1) % days.length] }) }
  }
  const hours = Array.from({ length: 24 }, (_, h) => h).filter((h) => instantAvailable(layer, { day: view.sel.day, hour: h }))
  if (!hours.length) return view
  const nextHour = hours.find((h) => h > view.sel.hour) ?? hours[0]
  return { ...view, sel: { ...view.sel, hour: nextHour } }
}

export const stepDayTarget = (sel: TimeSel, d: number): TimeSel => ({ ...sel, day: addDays(sel.day, d) })
