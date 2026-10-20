import { useEffect, useState } from 'react'
import type { Speed } from '../components/Timebar/Timebar'
import { layerById } from '../data'
import { NOW, shiftHours } from '../time'
import {
  goLive,
  moveExplicit,
  playStep,
  selectGroup,
  selectStream,
  stepDayTarget,
  type Notice,
  type Result,
  type View,
} from './rules'
import { scenarioFromUrl } from './scenarios'

type State = {
  view: View
  zoom: number
  playing: boolean
  speed: Speed
  /** One toast at a time; `key` remounts it so its 6 s timer restarts. */
  notice?: Notice & { key: number }
}

function initialState(): State {
  const scenario = scenarioFromUrl()
  return {
    view: scenario?.view ?? { groupId: 'water', layerId: 'rain-1h', sel: NOW },
    zoom: 1,
    playing: false,
    speed: 1,
    // Scenario toasts stay open (no timer) so the screen can be compared with Figma.
    notice: scenario?.notice && { ...scenario.notice, key: 0 },
  }
}

/** Frame length of the Play loop at 1x. */
const FRAME_MS = 900

let noticeKey = 0

/** App state. All behaviour rules live in ./rules.ts; this hook only applies their results. */
export function useMeteo() {
  const [state, setState] = useState<State>(initialState)

  const apply = (fn: (view: View) => Result, opts: { stopPlay?: boolean } = { stopPlay: true }) =>
    setState((s) => {
      const { view, notice } = fn(s.view)
      return {
        ...s,
        view,
        playing: opts.stopPlay ? false : s.playing,
        // Any new action closes the previous toast: Undo is offered only while nothing else has happened,
        // so it can never throw away navigation done after the switch (UX audit H2). Play frames don't count.
        notice: notice ? { ...notice, key: ++noticeKey } : undefined,
      }
    })

  // Play: automatic movement loops inside the visible day and never crosses "now".
  useEffect(() => {
    if (!state.playing) return
    const t = setInterval(() => setState((s) => ({ ...s, view: playStep(s.view) })), FRAME_MS / state.speed)
    return () => clearInterval(t)
  }, [state.playing, state.speed])

  // Deep links (#/?s=archive) also apply when only the hash changes on an open page.
  useEffect(() => {
    const onHash = () => {
      const s = scenarioFromUrl()
      if (s) setState((st) => ({ ...st, view: s.view, playing: false, notice: s.notice && { ...s.notice, key: 0 } }))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const actions = {
    // Manual gestures = explicit intent: may cross "now" (on the twin layer) or be blocked with a warning.
    selectDay: (day: string) => apply((v) => moveExplicit(v, { ...v.sel, day })),
    selectHour: (hour: number) => apply((v) => moveExplicit(v, { ...v.sel, hour })),
    stepHour: (d: number) => apply((v) => moveExplicit(v, shiftHours(v.sel, d))),
    stepDay: (d: number) => apply((v) => moveExplicit(v, stepDayTarget(v.sel, d))),
    goNow: () => apply((v) => goLive(v)),
    // Changing the data pauses Play: the loop would silently change scope, e.g. hours → days (UX audit H14).
    selectStream: (streamId: string) => apply((v) => selectStream(v, streamId)),
    selectGroup: (groupId: string) => apply((v) => selectGroup(v, groupId)),
    undo: (view: View) => setState((s) => ({ ...s, view, notice: undefined, playing: false })),
    dismissNotice: () => setState((s) => ({ ...s, notice: undefined })),
    notInPrototype: (feature: string) =>
      setState((s) => ({ ...s, notice: { type: 'notInPrototype', feature, key: ++noticeKey } })),
    zoomBy: (d: number) => setState((s) => ({ ...s, zoom: Math.min(2, Math.max(1, +(s.zoom + d).toFixed(2))) })),
    togglePlay: () => setState((s) => ({ ...s, playing: !s.playing })),
    setSpeed: (speed: Speed) => setState((s) => ({ ...s, speed })),
  }

  return { state, view: state.view, layer: layerById(state.view.layerId), actions }
}
