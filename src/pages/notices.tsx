import type { ReactNode } from 'react'
import { ModeWord } from '../components/Toast/Toast'
import type { Notice, View } from '../state/rules'
import { fmtDayMedium } from '../time'
import type { Mode } from '../types'

export type ToastContent = {
  tone: 'info' | 'warning'
  mode: Mode
  message: ReactNode
  undo?: View
}

const or = (modes: Mode[]) =>
  modes.map((m, i) => (
    <span key={m}>
      {i > 0 && (i === modes.length - 1 ? ' or ' : ', ')}
      <ModeWord mode={m} />
    </span>
  ))

/** Copy of every toast. Mode names always appear as words (never colour alone). */
export function toastFor(n: Notice): ToastContent {
  switch (n.type) {
    case 'forecastOnly': // Screen 02, rule 5
      return {
        tone: 'info',
        mode: 'forecast',
        undo: n.undo,
        message: (
          <>
            <strong>{n.layer.name}</strong> is only available as forecast. Switched to <ModeWord mode="forecast" />.
          </>
        ),
      }
    case 'forecastStarts':
      return {
        tone: 'info',
        mode: 'forecast',
        undo: n.undo,
        message: (
          <>
            <strong>{n.layer.name}</strong> forecast starts {fmtDayMedium(n.day)}. Moved there.
          </>
        ),
      }
    case 'twin':
      return {
        tone: 'info',
        mode: n.mode,
        undo: n.undo,
        // Names the mode the user landed in. The hook closes this toast once the mode changes again.
        message: (
          <>
            <strong>{n.layer.name}</strong>: switched to <ModeWord mode={n.mode} /> data.
          </>
        ),
      }
    case 'noLive':
      return {
        tone: 'info',
        mode: 'live',
        undo: n.undo,
        message: (
          <>
            <strong>{n.from.name}</strong> has no <ModeWord mode="live" /> data. Showing <strong>{n.to.name}</strong>.
          </>
        ),
      }
    case 'blockedModes': // Screen 03
      return {
        tone: 'warning',
        mode: n.modes[0],
        message: (
          <>
            <strong>{n.layer.name}</strong> is only available as {or(n.modes)} data.
          </>
        ),
      }
    case 'blockedHorizon':
      return {
        tone: 'warning',
        mode: 'forecast',
        message: (
          <>
            <strong>{n.layer.name}</strong> has no data for {fmtDayMedium(n.day)}.{' '}
            {n.lastDay > n.day ? `The archive starts ${fmtDayMedium(n.lastDay)}.` : `Data reaches ${fmtDayMedium(n.lastDay)}.`}
          </>
        ),
      }
  }
}
