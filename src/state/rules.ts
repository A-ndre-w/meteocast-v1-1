// Behaviour rules of the designer brief, as pure functions: (view, intent) → (next view, notice).
// No React here, so each rule can be read and checked on its own.
import {
  allLayers,
  dayAvailable,
  firstForecastInstant,
  groups,
  instantAvailable,
  layerById,
  modesOfStream,
  streamById,
  twinOf,
  type Layer,
} from '../data'
import { addDays, dayDiff, dayWindow, hoursBetween, modeOf, NOW, shiftHours, type TimeSel } from '../time'
import type { Mode } from '../types'

/** What the user is looking at. Undo restores a whole View. */
export type View = { groupId: string; layerId: string; sel: TimeSel }

export type Notice =
  /** Rule 5: forecast-only layer picked in Live/Archive → jumped to the first forecast instant. */
  | { type: 'forecastOnly'; layer: Layer; undo: View }
  /** Forecast layer picked in Forecast, but its data starts later (e.g. daily layers start tomorrow). */
  | { type: 'forecastStarts'; layer: Layer; day: string; undo: View }
  /** Now / Back to live with a layer that has no live data: fell back to a live layer of the group. */
  | { type: 'noLive'; from: Layer; to: Layer; undo: View }
  /** Screen 03 (block and warn): neither the layer nor its twin has data in that mode. Time does not move. */
  | { type: 'blockedModes'; layer: Layer; modes: Mode[] }
  /** Rule 8: beyond the stream's archive or forecast horizon. Time does not move. */
  | { type: 'blockedHorizon'; layer: Layer; day: string; lastDay: string }
  /** Picking a data stream with nothing at the selected instant: moved to the nearest instant with data. */
  | { type: 'movedTo'; layer: Layer; mode: Mode; undo: View }
  /** Buttons outside the v1 scope (search, alerts, presets): say so instead of doing nothing. */
  | { type: 'notInPrototype'; feature: string }
  /** A step past the first or last day of the timeline (UX audit H3): time does not move, the toast says why. */
  | { type: 'windowEdge'; edge: 'start' | 'end'; day: string }

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
 * Layer has data → move. Twin has data → move on the twin layer: the panel shows one entry per stream,
 * so nothing jumps and the mode cues already say where we are (no toast, UX audit H1). Neither → block + warn.
 */
/** Daily layers hide the hour: on today their instant is always "now". */
const normalize = (layer: Layer, sel: TimeSel): TimeSel =>
  layer.interval === 'day' && sel.day === NOW.day ? { ...sel, hour: NOW.hour } : sel

export function moveExplicit(view: View, rawTarget: TimeSel): Result {
  if (!inWindow(rawTarget)) {
    const edge = rawTarget.day < windowDays[0] ? 'start' : 'end'
    return { view, notice: { type: 'windowEdge', edge, day: edge === 'start' ? windowDays[0] : windowDays.at(-1)! } }
  }
  const layer = layerById(view.layerId)
  const target = normalize(layer, rawTarget)
  if (instantAvailable(layer, target)) return { view: { ...view, sel: target } }

  const twin = twinOf(layer)
  if (twin && instantAvailable(twin, target)) {
    return {
      view: { groupId: groupIdOf(twin), layerId: twin.id, sel: target },
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
 * Picking a data stream in the panel (one entry per quantity; replaces rule 7's disabled layers).
 * Data at the selected instant → select it, time stays. Otherwise move to the nearest instant that has
 * data, with a toast and Undo (the previous view, Archive included):
 * - forecast-only stream from Live/Archive → first forecast instant (rule 5, Screen 02 copy);
 * - real-time stream while in Forecast, or no archive while in Archive → now (Live).
 */
export function selectStream(view: View, streamId: string): Result {
  const stream = streamById(streamId)
  const here = stream.layers.find((l) => instantAvailable(l, view.sel))
  if (here) return { view: { groupId: groupIdOf(here), layerId: here.id, sel: view.sel } }

  const candidates: { layer: Layer; sel: TimeSel }[] = []
  for (const l of stream.layers) {
    if (instantAvailable(l, NOW)) candidates.push({ layer: l, sel: NOW })
    if (l.modes.includes('forecast')) candidates.push({ layer: l, sel: firstForecastInstant(l) })
  }
  if (!candidates.length) return { view }
  const distance = (sel: TimeSel) => Math.abs(hoursBetween(sel, view.sel))
  const best = candidates.reduce((a, b) => (distance(b.sel) < distance(a.sel) ? b : a))
  const next: View = { groupId: groupIdOf(best.layer), layerId: best.layer.id, sel: best.sel }
  const from = modeOfView(view)
  const to = modeOf(best.sel)

  if (to === 'forecast' && from !== 'forecast' && modesOfStream(stream).every((m) => m === 'forecast'))
    return { view: next, notice: { type: 'forecastOnly', layer: best.layer, undo: view } }
  if (to === 'forecast' && from === 'forecast')
    return { view: next, notice: { type: 'forecastStarts', layer: best.layer, day: best.sel.day, undo: view } }
  return { view: next, notice: { type: 'movedTo', layer: best.layer, mode: to, undo: view } }
}

/** Rule 10: switching group never moves time. Pick the first layer that has data now, else apply rule 5. */
export function selectGroup(view: View, groupId: string): Result {
  const group = groups.find((g) => g.id === groupId)!
  if (group.layers.some((l) => l.id === view.layerId)) return { view: { ...view, groupId } }
  const ready = group.layers.find((l) => instantAvailable(l, view.sel))
  if (ready) return { view: { groupId, layerId: ready.id, sel: view.sel } }
  const forecast = group.layers.find((l) => l.modes.includes('forecast'))
  if (forecast) return selectStream({ ...view, groupId }, forecast.stream)
  return { view: { groupId, layerId: group.layers[0].id, sel: view.sel } }
}

/** Every "Back to live" (timebar, ModePill). Explicit intent: no toast unless the layer changes unexpectedly. */
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
 * Play (automatic): starts where the cursor is and moves forward, never back to midnight.
 * `origin` is the instant where Play was pressed; the loop returns there.
 */
export function playStep(view: View, origin: TimeSel): View {
  const layer = layerById(view.layerId)
  const stream = [layer, twinOf(layer)].filter((l): l is Layer => l !== undefined)
  // Loop span (designer decision, 2026-10-21): from where Play was pressed, the next 24 hours —
  // across "now" into the forecast when the stream has it — then back to the start. Daily data: one frame
  // per day for as long as the stream has days, then back to the start day.
  const next = layer.interval === 'day' ? { ...view.sel, day: addDays(view.sel.day, 1) } : shiftHours(view.sel, 1)
  const span = layer.interval === 'day' ? windowDays.length * 24 : 24
  const carrier = stream.find((l) => instantAvailable(l, normalize(l, next)))
  if (!inWindow(next) || hoursBetween(next, origin) >= span || !carrier) {
    const back = stream.find((l) => instantAvailable(l, origin)) ?? layer
    return { groupId: groupIdOf(back), layerId: back.id, sel: origin }
  }
  // Crossing "now" hands over to the twin layer, as a manual move does (no toast).
  return { groupId: groupIdOf(carrier), layerId: carrier.id, sel: normalize(carrier, next) }
}

export const stepDayTarget = (sel: TimeSel, d: number): TimeSel => ({ ...sel, day: addDays(sel.day, d) })
