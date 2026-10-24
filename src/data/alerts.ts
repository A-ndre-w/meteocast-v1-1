// Alerts of the prototype: fixed, around "now" (Thu 15 Oct 2026, 13:00). Each one points at the data, the instant
// and, when it is about a place, the station to show on the map.
import { addDays, minutesBetween, NOW, type TimeSel } from '../time'

/** Meteoalarm-style levels: yellow, orange, red. Green is the brand's, so no level uses it. */
export type Severity = 'notice' | 'warning' | 'severe'

export type Alert = {
  id: string
  severity: Severity
  title: string
  /** Where, in words: a station, a radius around it, or a region. */
  area: string
  text: string
  /** Data stream to show (layers.json "stream"). */
  stream: string
  /** Instant to show on the timeline. */
  at: TimeSel
  /** Station to pin, when the alert is about a place on the network. */
  station?: string
  /** Minutes before now the alert was issued. */
  issuedMin: number
  /** When it stops applying. Past = expired, kept in the list for reference. */
  until: TimeSel
}

const today = NOW.day
const tomorrow = addDays(NOW.day, 1)
const yesterday = addDays(NOW.day, -1)

export const alerts: Alert[] = [
  {
    id: 'flash-flood-trento',
    severity: 'severe',
    title: 'Flash flood watch',
    area: 'Trento',
    text: 'Heavy showers expected between 16:00 and 22:00, locally over 18 mm/h.',
    stream: 'water/rainfall-rate',
    at: { day: today, hour: 16 },
    station: 'Trento',
    issuedMin: 12,
    until: { day: today, hour: 22 },
  },
  {
    id: 'wind-north-italy',
    severity: 'warning',
    title: 'Strong wind',
    area: 'North Italy',
    text: 'Sustained 45 km/h with gusts up to 78 km/h from south-west.',
    stream: 'wind/wind-speed',
    at: NOW,
    issuedMin: 34,
    until: { day: tomorrow, hour: 6 },
  },
  {
    id: 'lightning-trento',
    severity: 'notice',
    title: 'Lightning activity',
    area: 'Within 30 km of Trento',
    text: 'Strikes detected in the last 60 minutes. Cell drifting north-east.',
    stream: 'water/lightning',
    at: NOW,
    station: 'Trento',
    issuedMin: 12,
    until: { day: today, hour: 15 },
  },
  {
    id: 'river-verona',
    severity: 'warning',
    title: 'River level rising',
    area: 'Adige at Verona',
    text: 'Rising 12 cm/h. The first flood threshold could be reached tomorrow morning.',
    stream: 'water/hydrometric-level',
    at: NOW,
    station: 'Verona',
    issuedMin: 70,
    until: { day: tomorrow, hour: 12 },
  },
  {
    id: 'snow-cortina',
    severity: 'notice',
    title: 'Fresh snow',
    area: 'Cortina d’Ampezzo',
    text: '18 cm of new snow above 1,500 m in the last 24 hours.',
    stream: 'snow/snow-on-the-ground',
    at: { day: yesterday, hour: 18 },
    station: 'Cortina d’Ampezzo',
    issuedMin: 20 * 60,
    until: { day: yesterday, hour: 23 },
  },
]

/** Unread at the start of the session: the three issued in the last hour. */
export const initiallyUnread = alerts.filter((a) => a.issuedMin < 60).map((a) => a.id)

export const isActive = (a: Alert, now: TimeSel = NOW) => minutesBetween(a.until, now) > 0
