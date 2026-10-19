// Named starting states that reproduce the Figma screens: #/?s=archive, #/?s=switch, …
// Used by the design QA page and handy as deep links in the portfolio.
import { addDays, NOW, shiftHours } from '../time'
import { moveExplicit, selectLayer, type Notice, type View } from './rules'

const live: View = { groupId: 'water', layerId: 'rain-1h', sel: NOW }

export type Scenario = { id: string; title: string; figma: string; view: View; notice?: Notice }

export const scenarios: Scenario[] = [
  { id: 'live', title: 'Live data', figma: 'Screen 01/Live Data.png', view: live },
  {
    id: 'archive',
    title: 'Archive data',
    figma: 'Screen 01/Archive Data.png',
    view: { ...live, sel: { day: addDays(NOW.day, -1), hour: NOW.hour } },
  },
  {
    id: 'forecast',
    title: 'Forecast data',
    figma: 'Screen 01/Forecast Data.png',
    view: { groupId: 'water', layerId: 'rain-1h-fc', sel: { day: addDays(NOW.day, 1), hour: NOW.hour } },
  },
  { id: 'snow', title: 'Snow group (Screen 02)', figma: 'Screen 02/Screen 02.png', view: { groupId: 'snow', layerId: 'snow-ground', sel: NOW } },
  (() => {
    // Screen 02: picking Snow probability while Live → auto switch to Forecast (rule 5).
    const r = selectLayer({ groupId: 'snow', layerId: 'snow-ground', sel: NOW }, 'snow-prob')
    return { id: 'switch', title: 'Auto switch to forecast', figma: 'Screen 02/Auto switch to forecast.png', view: r.view, notice: r.notice }
  })(),
  (() => {
    // Screen 03: moving back from Live with a layer that has no archive → blocked with a warning.
    const r = moveExplicit({ groupId: 'water', layerId: 'lightning', sel: NOW }, shiftHours(NOW, -1))
    return { id: 'missing', title: 'Missing data alert', figma: 'Screen 03/Missing data alert.png', view: r.view, notice: r.notice }
  })(),
]

/** Scenario from the hash query (#/?s=archive). */
export function scenarioFromUrl(): Scenario | undefined {
  const id = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('s')
  return scenarios.find((s) => s.id === id)
}
