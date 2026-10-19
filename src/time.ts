import type { Mode } from './types'

/** An instant on the single timeline: a calendar day (ISO, UTC) and an hour 0–23. */
export type TimeSel = { day: string; hour: number }

/** Simulated "now", fixed so portfolio screenshots stay stable (matches the Figma screens). */
export const NOW: TimeSel = { day: '2026-10-15', hour: 13 }

const DAY_MS = 86_400_000
const toDate = (day: string) => new Date(`${day}T00:00:00Z`)
const toIso = (d: Date) => d.toISOString().slice(0, 10)

export const addDays = (day: string, n: number) => toIso(new Date(toDate(day).getTime() + n * DAY_MS))
export const dayDiff = (a: string, b: string) => Math.round((toDate(a).getTime() - toDate(b).getTime()) / DAY_MS)

/** Hours from `b` to `a` (positive = a is later). */
export const hoursBetween = (a: TimeSel, b: TimeSel) => dayDiff(a.day, b.day) * 24 + (a.hour - b.hour)

export const isSame = (a: TimeSel, b: TimeSel) => a.day === b.day && a.hour === b.hour

/** Rule 1: Live only at exactly "now"; before = Archive, after = Forecast (also within today). */
export function modeOf(sel: TimeSel, now: TimeSel = NOW): Mode {
  const h = hoursBetween(sel, now)
  return h === 0 ? 'live' : h < 0 ? 'archive' : 'forecast'
}

/** Move by hours across day boundaries. */
export function shiftHours(sel: TimeSel, hours: number): TimeSel {
  const total = sel.hour + hours
  const days = Math.floor(total / 24)
  return { day: addDays(sel.day, days), hour: ((total % 24) + 24) % 24 }
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
/** "Wed 13" */
export const fmtDayShort = (day: string) => `${WD[parts(day).wd]} ${parts(day).date}`
/** "Thu 15 Oct" */
export const fmtDayMedium = (day: string) => `${fmtDayShort(day)} ${MON[parts(day).month]}`
/** "Thursday 15 October" */
export const fmtDayLong = (day: string) => {
  const p = parts(day)
  return `${WD_LONG[p.wd]} ${p.date} ${MON_LONG[p.month]}`
}
/** "Wed 14, 13:00" (Readout) */
export const fmtReadoutTime = (sel: TimeSel) => `${fmtDayShort(sel.day)}, ${fmtHour(sel.hour)}`
/** "Wed 14 Oct, 13:00" (ModePill) */
export const fmtPillTime = (sel: TimeSel) => `${fmtDayMedium(sel.day)}, ${fmtHour(sel.hour)}`

/** Signed distance from now for badges: "-24h", "+5h", "+3d" (days from 48h on). */
export function fmtOffset(sel: TimeSel, now: TimeSel = NOW): string {
  const h = hoursBetween(sel, now)
  if (h === 0) return ''
  const sign = h < 0 ? '-' : '+'
  const abs = Math.abs(h)
  return abs < 48 ? `${sign}${abs}h` : `${sign}${Math.round(abs / 24)}d`
}

/** Human distance for the ModePill: "24h ago", "in 5h", "in 3 days". */
export function fmtRelative(sel: TimeSel, now: TimeSel = NOW): string {
  const h = hoursBetween(sel, now)
  if (h === 0) return 'now'
  const abs = Math.abs(h)
  const span = abs < 48 ? `${abs}h` : `${Math.round(abs / 24)} days`
  return h < 0 ? `${span} ago` : `in ${span}`
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
