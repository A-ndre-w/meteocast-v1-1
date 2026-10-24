// Behaviour rules of the designer brief, as pure functions: (view, intent) → (next view, notice).
// No React here, so each rule can be read and checked on its own.
import {
  allLayers,
  dayAvailable,
  firstForecastInstant,
  groupById,
  groups,
  instantAvailable,
  layerById,
  modesOfStream,
  stepOf,
  streamById,
  twinOf,
  type Layer,
} from '../data'
import { addDays, dayDiff, dayWindow, minutesBetween, modeOf, NOW, shiftMinutes, snapTo, type Snap, type TimeSel } from '../time'
import type { Mode } from '../types'
import type { Preset } from './presets'

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
  /** A user preset was deleted: Undo puts it back where it was and shows it again. */
  | { type: 'presetDeleted'; preset: Preset; index: number; undo: View }

export type Result = { view: View; notice?: Notice }

const windowDays = dayWindow().map((d) => d.day)
const inWindow = (sel: TimeSel) => windowDays.includes(sel.day)
const groupIdOf = (layer: Layer) => groups.find((g) => g.layers.includes(layer))!.id
/** Where to show a layer: the current group or preset when it has the layer (a preset stays selected across
 *  "now"), else the layer's default group. */
const groupFor = (view: View, layer: Layer) => (groupById(view.groupId)?.layers.includes(layer) ? view.groupId : groupIdOf(layer))
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
/**
 * The instant on this layer's own grid. Daily layers hide the hour: on today their instant is always "now".
 * Hourly data snap to the hour (up when moving forward, so a 5-minute step past "now" lands on the next hour of
 * an hourly forecast twin instead of bouncing back); 5-minute data keep the minute.
 */
export function normalize(layer: Layer, sel: TimeSel, how: Snap = 'down'): TimeSel {
  if (layer.interval === 'day') return sel.day === NOW.day ? { day: sel.day, hour: NOW.hour } : { day: sel.day, hour: sel.hour }
  return snapTo(sel, stepOf(layer, sel), how)
}

export function moveExplicit(view: View, rawTarget: TimeSel, snap?: Snap): Result {
  if (!inWindow(rawTarget)) {
    const edge = rawTarget.day < windowDays[0] ? 'start' : 'end'
    return { view, notice: { type: 'windowEdge', edge, day: edge === 'start' ? windowDays[0] : windowDays.at(-1)! } }
  }
  const layer = layerById(view.layerId)
  // Steps snap in their direction; a typed or clicked time snaps to the nearest instant of the data.
  const how = snap ?? (minutesBetween(rawTarget, view.sel) > 0 ? 'up' : 'down')
  const target = normalize(layer, rawTarget, how)
  if (instantAvailable(layer, target)) return { view: { ...view, sel: target } }

  const twin = twinOf(layer)
  const twinTarget = twin && normalize(twin, rawTarget, how)
  if (twin && twinTarget && instantAvailable(twin, twinTarget)) {
    return {
      view: { groupId: groupFor(view, twin), layerId: twin.id, sel: twinTarget },
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
  // From 12:55 on 5-minute data to an hourly stream: the same instant on its grid (12:00), silently.
  const here = stream.layers.find((l) => instantAvailable(l, normalize(l, view.sel)))
  if (here) return { view: { groupId: groupFor(view, here), layerId: here.id, sel: normalize(here, view.sel) } }

  const candidates: { layer: Layer; sel: TimeSel }[] = []
  for (const l of stream.layers) {
    if (instantAvailable(l, NOW)) candidates.push({ layer: l, sel: NOW })
    if (l.modes.includes('forecast')) candidates.push({ layer: l, sel: firstForecastInstant(l) })
  }
  if (!candidates.length) return { view }
  const distance = (sel: TimeSel) => Math.abs(minutesBetween(sel, view.sel))
  const best = candidates.reduce((a, b) => (distance(b.sel) < distance(a.sel) ? b : a))
  const next: View = { groupId: groupFor(view, best.layer), layerId: best.layer.id, sel: best.sel }
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
  const group = groupById(groupId)!
  if (group.layers.some((l) => l.id === view.layerId)) return { view: { ...view, groupId } }
  const ready = group.layers.find((l) => instantAvailable(l, normalize(l, view.sel)))
  if (ready) return { view: { groupId, layerId: ready.id, sel: normalize(ready, view.sel) } }
  const forecast = group.layers.find((l) => l.modes.includes('forecast'))
  if (forecast) return selectStream({ ...view, groupId }, forecast.stream)
  return { view: { groupId, layerId: group.layers[0].id, sel: view.sel } }
}

/**
 * An alert opened from the panel: its data at its instant (on the twin across "now"), in the current group or
 * preset when that has the data. Explicit intent: no toast.
 */
export function showInstant(view: View, streamId: string, at: TimeSel): Result {
  const stream = streamById(streamId)
  const layer = stream.layers.find((l) => instantAvailable(l, normalize(l, at, 'nearest')))
  if (!layer) return selectStream(view, streamId)
  return { view: { groupId: groupFor(view, layer), layerId: layer.id, sel: normalize(layer, at, 'nearest') } }
}

/** Every "Back to live" (timebar, ModePill). Explicit intent: no toast unless the layer changes unexpectedly. */
export function goLive(view: View, layerId = view.layerId): Result {
  const layer = layerById(layerId)
  const sel = NOW
  if (instantAvailable(layer, sel)) return { view: { groupId: groupFor(view, layer), layerId, sel } }
  const twin = twinOf(layer)
  if (twin && instantAvailable(twin, sel)) return { view: { groupId: groupFor(view, twin), layerId: twin.id, sel } }
  const group = groupById(groupFor(view, layer))!
  const live = group.layers.find((l) => instantAvailable(l, sel)) ?? allLayers.find((l) => instantAvailable(l, sel))!
  return {
    view: { groupId: groupFor(view, live), layerId: live.id, sel },
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
  // Loop span (designer decision, 2026-10-21): from where Play was pressed, 24 frames forward — across "now"
  // into the forecast when the stream has it — then back to the start. A frame is the data's own step: 24 hours
  // for hourly data, 2 hours for 5-minute data. Daily data: one frame per day while the stream has days.
  const step = stepOf(stream.find((l) => instantAvailable(l, origin)) ?? layer, origin)
  const next = layer.interval === 'day' ? { ...view.sel, day: addDays(view.sel.day, 1) } : shiftMinutes(view.sel, stepOf(layer, view.sel))
  const span = layer.interval === 'day' ? windowDays.length * 1440 : 24 * step
  const carrier = stream.find((l) => instantAvailable(l, normalize(l, next, 'up')))
  if (!inWindow(next) || minutesBetween(next, origin) >= span || !carrier) {
    const back = stream.find((l) => instantAvailable(l, origin)) ?? layer
    return { groupId: groupFor(view, back), layerId: back.id, sel: origin }
  }
  // Crossing "now" hands over to the twin layer, as a manual move does (no toast).
  return { groupId: groupFor(view, carrier), layerId: carrier.id, sel: normalize(carrier, next, 'up') }
}

export const stepDayTarget = (sel: TimeSel, d: number): TimeSel => ({ ...sel, day: addDays(sel.day, d) })
