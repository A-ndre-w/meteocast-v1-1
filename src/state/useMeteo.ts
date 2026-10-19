import { useState } from 'react'
import { groupOf, groups, layerById } from '../data'
import type { Speed } from '../components/Timebar/Timebar'
import { addDays, dayWindow, NOW, shiftHours, type TimeSel } from '../time'

export type MeteoState = {
  groupId: string
  layerId: string
  sel: TimeSel
  zoom: number
  playing: boolean
  speed: Speed
}

export const initialState: MeteoState = {
  groupId: 'water',
  layerId: 'rain-1h',
  sel: NOW,
  zoom: 1,
  playing: false,
  speed: 1,
}

const windowDays = dayWindow().map((d) => d.day)
const inWindow = (sel: TimeSel) => windowDays.includes(sel.day)

/** App state. Step 4: plain navigation. Behaviour rules (auto switch, blocks, toasts) arrive in step 5. */
export function useMeteo() {
  const [state, setState] = useState<MeteoState>(initialState)
  const set = (patch: Partial<MeteoState>) => setState((s) => ({ ...s, ...patch }))
  const moveTo = (sel: TimeSel) => inWindow(sel) && set({ sel })

  const actions = {
    selectGroup(groupId: string) {
      const group = groups.find((g) => g.id === groupId)!
      const keep = groupOf(state.layerId).id === groupId
      set({ groupId, layerId: keep ? state.layerId : group.layers[0].id })
    },
    selectLayer: (layerId: string) => set({ layerId, groupId: groupOf(layerId).id }),
    selectDay: (day: string) => moveTo({ ...state.sel, day }),
    selectHour: (hour: number) => moveTo({ ...state.sel, hour }),
    stepHour: (d: number) => moveTo(shiftHours(state.sel, d)),
    stepDay: (d: number) => moveTo({ ...state.sel, day: addDays(state.sel.day, d) }),
    goNow: () => set({ sel: NOW }),
    zoomBy: (d: number) => set({ zoom: Math.min(2, Math.max(1, +(state.zoom + d).toFixed(2))) }),
    togglePlay: () => set({ playing: !state.playing }),
    setSpeed: (speed: Speed) => set({ speed }),
  }

  return { state, layer: layerById(state.layerId), actions }
}
