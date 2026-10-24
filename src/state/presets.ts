// User presets: a name, an icon and a set of data streams picked from any group. Saved in this browser only
// (localStorage); they show in the Rail after the default groups and behave like a group everywhere else.
import { useSyncExternalStore } from 'react'
import { allLayers, groups, setPresetGroups, type LayerGroup } from '../data'
import type { IconName } from '../icons/Icon'

export type Preset = { id: string; title: string; icon: IconName; streams: string[] }

/** Icons offered in the preset editor: the group icons plus a pin for place-based presets. */
export const PRESET_ICONS: IconName[] = ['drizzle', 'snow', 'cloudy', 'thermometer', 'sunny', 'wind', 'sever-thunderstorm', 'waves', 'fog', 'humidity', 'pin']

export const MAX_TITLE = 24
const KEY = 'meteocast.presets.v1'
const knownStreams = new Set(allLayers.map((l) => l.stream))

const isPreset = (p: unknown): p is Preset => {
  const x = p as Preset
  return typeof x?.id === 'string' && typeof x.title === 'string' && Array.isArray(x.streams) && PRESET_ICONS.includes(x.icon)
}

function load(): Preset[] {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(list)) return []
    // Data that no longer exists is dropped; a preset left empty goes with it.
    return list
      .filter(isPreset)
      .map((p) => ({ ...p, title: p.title.slice(0, MAX_TITLE), streams: p.streams.filter((s) => knownStreams.has(s)) }))
      .filter((p) => p.streams.length > 0)
  } catch {
    return []
  }
}

/** A preset as a layer group: every layer of its streams (Real time and Forecast twins), in the order picked. */
export const groupOf = (p: Preset): LayerGroup => ({
  id: p.id,
  title: p.title,
  icon: p.icon,
  layers: p.streams.flatMap((s) => allLayers.filter((l) => l.stream === s)),
})

let presets: Preset[] = load()
setPresetGroups(presets.map(groupOf))
const listeners = new Set<() => void>()

function commit(next: Preset[]) {
  presets = next
  setPresetGroups(next.map(groupOf))
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Private window or storage blocked: the preset lives until the page is reloaded.
  }
  listeners.forEach((l) => l())
}

export const presetStore = {
  get: () => presets,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  /** Creates (no id yet) or replaces a preset; returns its id. */
  save(p: Omit<Preset, 'id'> & { id?: string }): string {
    const id = p.id ?? `preset-${Date.now().toString(36)}`
    const preset = { ...p, id, title: p.title.trim().slice(0, MAX_TITLE) }
    const at = presets.findIndex((x) => x.id === id)
    commit(at < 0 ? [...presets, preset] : presets.map((x) => (x.id === id ? preset : x)))
    return id
  },
  remove(id: string) {
    commit(presets.filter((p) => p.id !== id))
  },
  /** Undo of a delete: back in its old place. */
  restore(p: Preset, index: number) {
    const next = presets.filter((x) => x.id !== p.id)
    next.splice(Math.min(index, next.length), 0, p)
    commit(next)
  },
}

export const usePresets = () => useSyncExternalStore(presetStore.subscribe, presetStore.get)

/** Is this group id a user preset (as opposed to a default group)? */
export const isPresetId = (id: string) => !groups.some((g) => g.id === id)
