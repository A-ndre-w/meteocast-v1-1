import { useEffect, useState } from 'react'
import type { Speed } from '../components/Timebar/Timebar'
import { layerById, stepOf } from '../data'
import { NOW, shiftMinutes, type TimeSel } from '../time'
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
  playing: boolean
  /** Where Play was pressed: the loop runs 24 h forward from here and comes back. */
  playOrigin?: TimeSel
  speed: Speed
  /** One toast at a time; `key` remounts it so its 6 s timer restarts. */
  notice?: Notice & { key: number }
}

function initialState(): State {
  const scenario = scenarioFromUrl()
  return {
    view: scenario?.view ?? { groupId: 'water', layerId: 'rain-1h', sel: NOW },
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

  // Play: from the instant where it was pressed, 24 h forward, then back to that instant.
  useEffect(() => {
    if (!state.playing) return
    const t = setInterval(
      () => setState((s) => ({ ...s, view: playStep(s.view, s.playOrigin ?? s.view.sel) })),
      FRAME_MS / state.speed,
    )
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
    // A point on the 24 h track or a typed time, in minutes from midnight: snapped to the nearest instant of the data.
    selectTime: (minute: number) => apply((v) => moveExplicit(v, shiftMinutes({ day: v.sel.day, hour: 0 }, minute), 'nearest')),
    // One step of the selected data's own resolution at that instant: 5 minutes (also in a nowcast), an hour, a day.
    step: (d: number) => apply((v) => moveExplicit(v, shiftMinutes(v.sel, d * stepOf(layerById(v.layerId), v.sel)))),
    /** ±1 hour, whatever the data's resolution (PageUp / PageDown). */
    stepHour: (d: number) => apply((v) => moveExplicit(v, shiftMinutes(v.sel, d * 60))),
    stepDay: (d: number) => apply((v) => moveExplicit(v, stepDayTarget(v.sel, d))),
    goNow: () => apply((v) => goLive(v)),
    // Changing the data pauses Play: the loop would silently change scope, e.g. hours → days (UX audit H14).
    selectStream: (streamId: string) => apply((v) => selectStream(v, streamId)),
    selectGroup: (groupId: string) => apply((v) => selectGroup(v, groupId)),
    undo: (view: View) => setState((s) => ({ ...s, view, notice: undefined, playing: false })),
    dismissNotice: () => setState((s) => ({ ...s, notice: undefined })),
    notInPrototype: (feature: string) =>
      setState((s) => ({ ...s, notice: { type: 'notInPrototype', feature, key: ++noticeKey } })),
    togglePlay: () => setState((s) => ({ ...s, playing: !s.playing, playOrigin: s.playing ? undefined : s.view.sel })),
    setSpeed: (speed: Speed) => setState((s) => ({ ...s, speed })),
  }

  return { state, view: state.view, layer: layerById(state.view.layerId), actions }
}
