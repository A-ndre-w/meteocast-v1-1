import type { Mode } from './types'

/**
 * An instant on the single timeline: a calendar day (ISO, UTC), an hour 0–23 and, for data measured every
 * 5 minutes, the minute (0, 5 … 55). Hourly data always sit on minute 0.
 */
export type TimeSel = { day: string; hour: number; minute?: number }

/** Simulated "now", fixed so portfolio screenshots stay stable (matches the Figma screens). */
export const NOW: TimeSel = { day: '2026-10-15', hour: 13 }

const DAY_MS = 86_400_000
const toDate = (day: string) => new Date(`${day}T00:00:00Z`)
const toIso = (d: Date) => d.toISOString().slice(0, 10)

export const addDays = (day: string, n: number) => toIso(new Date(toDate(day).getTime() + n * DAY_MS))
export const dayDiff = (a: string, b: string) => Math.round((toDate(a).getTime() - toDate(b).getTime()) / DAY_MS)

/** Hours from `b` to `a` (positive = a is later). */
export const hoursBetween = (a: TimeSel, b: TimeSel) => dayDiff(a.day, b.day) * 24 + (a.hour - b.hour)

/** Minutes from `b` to `a` (positive = a is later). */
export const minutesBetween = (a: TimeSel, b: TimeSel) => hoursBetween(a, b) * 60 + (a.minute ?? 0) - (b.minute ?? 0)

export const isSame = (a: TimeSel, b: TimeSel) => minutesBetween(a, b) === 0

/** Rule 1: Live only at exactly "now"; before = Archive, after = Forecast (also within today). */
export function modeOf(sel: TimeSel, now: TimeSel = NOW): Mode {
  const m = minutesBetween(sel, now)
  return m === 0 ? 'live' : m < 0 ? 'archive' : 'forecast'
}

/** Move by minutes across day boundaries. */
export function shiftMinutes(sel: TimeSel, minutes: number): TimeSel {
  const total = sel.hour * 60 + (sel.minute ?? 0) + minutes
  const days = Math.floor(total / 1440)
  const inDay = ((total % 1440) + 1440) % 1440
  const minute = inDay % 60
  return { day: addDays(sel.day, days), hour: Math.floor(inDay / 60), ...(minute ? { minute } : {}) }
}

/** Move by hours across day boundaries (the minute stays). */
export const shiftHours = (sel: TimeSel, hours: number): TimeSel => shiftMinutes(sel, hours * 60)

/** Minute of the day, 0–1439. */
export const minuteOfDay = (sel: TimeSel) => sel.hour * 60 + (sel.minute ?? 0)

export type Snap = 'down' | 'up' | 'nearest'

/** Snap to a step in minutes (60 for hourly data): down, up (moving forward) or to the nearest (a typed time). */
export function snapTo(sel: TimeSel, step: number, how: Snap = 'down'): TimeSel {
  const m = minuteOfDay(sel)
  const round = how === 'up' ? Math.ceil : how === 'nearest' ? Math.round : Math.floor
  const snapped = round(m / step) * step
  return snapped === m ? sel : shiftMinutes({ day: sel.day, hour: 0 }, snapped)
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const parts = (day: string) => {
  const d = toDate(day)
  return { wd: d.getUTCDay(), date: d.getUTCDate(), month: d.getUTCMonth() }
}

export const pad2 = (n: number) => String(n).padStart(2, '0')
export const fmtHour = (hour: number) => `${pad2(hour)}:00`
/** "13:00", "12:55" */
export const fmtTime = (sel: TimeSel) => `${pad2(sel.hour)}:${pad2(sel.minute ?? 0)}`
/** "Wed 13" */
export const fmtDayShort = (day: string) => `${WD[parts(day).wd]} ${parts(day).date}`
/** "Thu 15 Oct" */
export const fmtDayMedium = (day: string) => `${fmtDayShort(day)} ${MON[parts(day).month]}`
/** "Thursday 15 October" */
export const fmtDayLong = (day: string) => {
  const p = parts(day)
  return `${WD_LONG[p.wd]} ${p.date} ${MON_LONG[p.month]}`
}
/** The one absolute format used everywhere: "Wed 14 Oct, 13:00". */
export const fmtStamp = (sel: TimeSel) => `${fmtDayMedium(sel.day)}, ${fmtTime(sel)}`

/** How long ago something happened, for "Updated …": "just now", "5 min ago", "23 h ago", "3 days ago". */
export function fmtAgo(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${Math.round(minutes)} min ago`
  if (minutes < 48 * 60) return `${Math.round(minutes / 60)} h ago`
  return `${Math.round(minutes / 1440)} days ago`
}

/** The one relative format used everywhere: "−5min", "−24h", "+5h", "+3d" (days from 48h on). True minus sign. */
export function fmtOffset(sel: TimeSel, now: TimeSel = NOW): string {
  const m = minutesBetween(sel, now)
  if (m === 0) return ''
  const sign = m < 0 ? '−' : '+'
  const abs = Math.abs(m)
  if (abs < 60) return `${sign}${abs}min`
  const h = Math.round(abs / 60)
  return h < 48 ? `${sign}${h}h` : `${sign}${Math.round(h / 24)}d`
}

export type DayInfo = { day: string; time: 'past' | 'today' | 'future' }

/** The 8-day window of the screens: 2 days back, today, 5 ahead. */
export function dayWindow(now: TimeSel = NOW, back = 2, ahead = 5): DayInfo[] {
  return Array.from({ length: back + ahead + 1 }, (_, i) => {
    const day = addDays(now.day, i - back)
    const d = dayDiff(day, now.day)
    return { day, time: d < 0 ? 'past' : d === 0 ? 'today' : 'future' }
  })
}
