import { useEffect, useState } from 'react'
import type { Speed } from '../components/Timebar/Timebar'
import { layerById } from '../data'
import { NOW, shiftHours } from '../time'
import {
  goLive,
  moveExplicit,
  playStep,
  selectGroup,
  selectLayer,
  stepDayTarget,
  type Notice,
  type Result,
  type View,
} from './rules'

type State = {
  view: View
  zoom: number
  playing: boolean
  speed: Speed
  /** One toast at a time; `key` remounts it so its 6 s timer restarts. */
  notice?: Notice & { key: number }
}

const initial: State = {
  view: { groupId: 'water', layerId: 'rain-1h', sel: NOW },
  zoom: 1,
  playing: false,
  speed: 1,
}

/** Frame length of the Play loop at 1x. */
const FRAME_MS = 900

let noticeKey = 0
const isWarning = (n: Notice) => n.type === 'blockedModes' || n.type === 'blockedHorizon'

/** App state. All behaviour rules live in ./rules.ts; this hook only applies their results. */
export function useMeteo() {
  const [state, setState] = useState<State>(initial)

  const apply = (fn: (view: View) => Result, opts: { stopPlay?: boolean } = { stopPlay: true }) =>
    setState((s) => {
      const { view, notice } = fn(s.view)
      return {
        ...s,
        view,
        playing: opts.stopPlay ? false : s.playing,
        // A new notice replaces the old one. A plain move keeps an info toast (its Undo stays useful)
        // but clears a warning: it was about an attempt the user has moved past.
        notice: notice ? { ...notice, key: ++noticeKey } : s.notice && !isWarning(s.notice) ? s.notice : undefined,
      }
    })

  // Play: automatic movement loops inside the visible day and never crosses "now".
  useEffect(() => {
    if (!state.playing) return
    const t = setInterval(() => setState((s) => ({ ...s, view: playStep(s.view) })), FRAME_MS / state.speed)
    return () => clearInterval(t)
  }, [state.playing, state.speed])

  const actions = {
    // Manual gestures = explicit intent: may cross "now" (twin switch with toast) or be blocked with a warning.
    selectDay: (day: string) => apply((v) => moveExplicit(v, { ...v.sel, day })),
    selectHour: (hour: number) => apply((v) => moveExplicit(v, { ...v.sel, hour })),
    stepHour: (d: number) => apply((v) => moveExplicit(v, shiftHours(v.sel, d))),
    stepDay: (d: number) => apply((v) => moveExplicit(v, stepDayTarget(v.sel, d))),
    goNow: () => apply((v) => goLive(v)),
    goLiveWith: (layerId: string) => apply((v) => goLive(v, layerId)),
    selectLayer: (layerId: string) => apply((v) => selectLayer(v, layerId), { stopPlay: false }),
    selectGroup: (groupId: string) => apply((v) => selectGroup(v, groupId), { stopPlay: false }),
    undo: (view: View) => setState((s) => ({ ...s, view, notice: undefined, playing: false })),
    dismissNotice: () => setState((s) => ({ ...s, notice: undefined })),
    zoomBy: (d: number) => setState((s) => ({ ...s, zoom: Math.min(2, Math.max(1, +(s.zoom + d).toFixed(2))) })),
    togglePlay: () => setState((s) => ({ ...s, playing: !s.playing })),
    setSpeed: (speed: Speed) => setState((s) => ({ ...s, speed })),
  }

  return { state, view: state.view, layer: layerById(state.view.layerId), actions }
}
