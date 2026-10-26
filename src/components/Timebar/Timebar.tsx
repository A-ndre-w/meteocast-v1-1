import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { Icon } from '../../icons/Icon'
import { fmtDayLong, fmtDayMedium, fmtDayShort, pad2 } from '../../time'
import { modeIcon, modeLabel, type Mode } from '../../types'
import { DayChip } from '../DayChip/DayChip'
import type { DayStripDay } from '../DayStrip/DayStrip'
import { LiveViewButton } from '../LiveViewButton/LiveViewButton'
import styles from './Timebar.module.css'

export type Speed = 1 | 2 | 4

export type TimebarProps = {
  mode: Mode
  selectedDay: string
  /** Selected time of day in minutes from midnight (13:00 = 780, 12:55 = 775). */
  selectedMinute: number
  /** Finest resolution of the selected data in minutes (5 for radar, lightning, gusts and nowcasts; 60 for hourly
   *  data): dragging on the track snaps to it. */
  stepMin?: number
  /** Distance from now under the time, e.g. "+1h", "−5min" (the mode word comes from `mode`). */
  offset?: string
  /** "day" hides the hour track (rule 6). */
  interval: 'hour' | 'day'
  days: DayStripDay[]
  /** Hour of "now" when the selected day is today: draws the NOW marker and splits solid/dashed (rule 3). */
  nowHour?: number
  /** Hours of the selected day with no data for the current layer (hatched on the track). */
  unavailableHours?: number[]
  playing?: boolean
  speed?: Speed
  onSelectDay?: (day: string) => void
  /** A point on the track, in minutes from midnight. */
  onSelectTime?: (minute: number) => void
  /** ±1 step of the data's resolution (arrows on the track) — may cross days. */
  onStep?: (delta: number) => void
  /** ±1 hour (PageUp / PageDown), whatever the resolution. */
  onStepHour?: (delta: number) => void
  /** ±1 day (the ‹ › of the day, Shift+arrows). */
  onStepDay?: (delta: number) => void
  /** First / last day of the timeline: the day buttons are shown disabled (UX audit H3). */
  atStart?: boolean
  atEnd?: boolean
  onNow?: () => void
  onTogglePlay?: () => void
  onSpeedChange?: (speed: Speed) => void
}

const HOURS = Array.from({ length: 25 }, (_, h) => h)
const LABELS = [0, 6, 12, 18, 24]
const SPEEDS: Speed[] = [1, 2, 4]
const pct = (minute: number) => `${(minute / 1440) * 100}%`
const fmtMinute = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`

/** A typed time: "12:47", "12.47", "1247", "9" → minutes from midnight, or null when it is not a time. */
function parseTime(text: string): number | null {
  const m = text.trim().match(/^(\d{1,2})(?:[:.\s]?(\d{2}))?$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2] ?? 0)
  return h < 24 && min < 60 ? h * 60 + min : null
}

/** A button that repeats while held: one step on press, then a step every 90 ms after 400 ms. */
function useHold(fn: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const stop = () => {
    clearTimeout(timer.current)
    clearInterval(timer.current)
  }
  useEffect(() => stop, [])
  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return
      fnRef.current()
      stop()
      timer.current = setTimeout(() => {
        timer.current = setInterval(() => fnRef.current(), 90)
      }, 400)
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    // Keyboard (Enter / Space): one step per press; pointer clicks were already handled on pointerdown.
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      if (e.detail === 0) fnRef.current()
    },
  }
}

/** What one Play loop covers: 24 frames of the data's own step. */
function playSpan(daily: boolean, step: number) {
  if (daily) return 'Plays one day per frame, then starts again'
  if (step >= 60) return 'Plays the next 24 hours from the selected time, then starts again'
  return `Plays the next ${(24 * step) / 60} hours in ${step}-minute steps, then starts again`
}

/**
 * Figma: Timeline (2010:10063) — named Timebar in code. One row, about 52px: Play, the day (big, with ‹ › and a
 * calendar), the 24-hour track and Back to live. The track moves in the data's own steps: 5 minutes for data
 * measured every 5 minutes, an hour for hourly data.
 */
export function Timebar({
  mode,
  selectedDay,
  selectedMinute,
  stepMin = 60,
  offset,
  interval,
  days,
  nowHour,
  unavailableHours = [],
  playing = false,
  speed = 1,
  onSelectDay,
  onSelectTime,
  onStep,
  onStepHour,
  onStepDay,
  atStart = false,
  atEnd = false,
  onNow,
  onTogglePlay,
  onSpeedChange,
}: TimebarProps) {
  const rootRef = useRef<HTMLElement>(null)
  const dayBtnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLInputElement>(null)
  const playHintId = useId()
  const dayHintId = useId()
  const popId = useId()
  const timeHintId = useId()
  const [calendarOpen, setCalendarOpen] = useState(false)
  // The time on the thumb shows while the time moves: dragging, keys on the slider, Play.
  const [scrubbing, setScrubbing] = useState(false)
  const [sliderFocus, setSliderFocus] = useState(false)
  const daily = interval === 'day'
  const step = daily ? 1440 : stepMin
  const lastMinute = 1440 - step
  const selected = days.find((d) => d.day === selectedDay)
  // Rule 3: observed data = solid, forecast = dashed.
  const solidTo = selected?.time === 'past' ? 1440 : selected?.time === 'today' ? (nowHour ?? 0) * 60 : 0
  const time = fmtMinute(selectedMinute)
  // The typed time while the field is being edited; null = show the selected time.
  const [draft, setDraft] = useState<string | null>(null)
  const earlier = useHold(() => onStep?.(-1))
  const later = useHold(() => onStep?.(1))
  // While the field has focus, a new time (arrows, Enter, the track) is selected again: the next digits replace it.
  useEffect(() => {
    if (document.activeElement === timeRef.current) timeRef.current?.select()
  }, [selectedMinute, selectedDay])
  const commitDraft = () => {
    const m = draft === null ? null : parseTime(draft)
    if (m !== null && m !== selectedMinute) onSelectTime?.(m)
    setDraft(null)
  }
  // Under the time: where it is relative to now, in words. Without it the tint seemed to change at random.
  const modeLine = (
    <span className={styles.modeLine} data-mode={mode}>
      {modeIcon[mode] ? <Icon name={modeIcon[mode]!} size={12} strokeWidth={2} /> : <span className={styles.liveDot} aria-hidden="true" />}
      {modeLabel[mode]}
      {mode !== 'live' && offset && <span className={styles.offset}>{offset}</span>}
    </span>
  )
  // Back to live beside the time (designer, 2026-10-26): it is where the pointer already is after changing the day
  // or the time, and it reads with the mode line ("ARCHIVE −24h · Back to live"). Always in place, off in Live, so
  // the track never changes width.
  const backToLive = (
    <span className={styles.live}>
      <LiveViewButton status={mode === 'live' ? 'off' : 'on'} onClick={onNow} />
    </span>
  )

  const minuteFromPointer = (e: PointerEvent) => {
    const r = trackRef.current!.getBoundingClientRect()
    const m = Math.round((((e.clientX - r.left) / r.width) * 1440) / step) * step
    return Math.min(lastMinute, Math.max(0, m))
  }

  const onTrackPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setScrubbing(true)
    onSelectTime?.(minuteFromPointer(e))
    trackRef.current?.querySelector<HTMLElement>('[role="slider"]')?.focus()
  }
  const onTrackPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      const m = minuteFromPointer(e)
      if (m !== selectedMinute) onSelectTime?.(m)
    }
  }

  // Keyboard model: arrows = one step of the data (5 min or 1 h), PageUp/Down = an hour, Shift+arrows = a day.
  // In the calendar the arrows walk the days. The time field handles its own keys.
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT') return
    const onSlider = target.getAttribute('role') === 'slider'
    const onChip = target.closest('[data-daystrip]') !== null
    const dir = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : 0
    if (e.key === 'Escape' && calendarOpen) {
      e.preventDefault()
      closeCalendar()
    } else if (dir && (e.shiftKey || onChip)) {
      e.preventDefault()
      onStepDay?.(dir)
    } else if (dir && onSlider) {
      e.preventDefault()
      onStep?.(dir)
    } else if (onSlider && (e.key === 'PageUp' || e.key === 'PageDown')) {
      e.preventDefault()
      onStepHour?.(e.key === 'PageUp' ? 1 : -1)
    } else if (onSlider && (e.key === 'Home' || e.key === 'End')) {
      e.preventDefault()
      onSelectTime?.(e.key === 'Home' ? 0 : lastMinute)
    }
  }

  const closeCalendar = (refocus = true) => {
    setCalendarOpen(false)
    if (refocus) dayBtnRef.current?.focus()
  }

  // Calendar: focus on the selected day when it opens, and focus follows the selection while the arrows walk.
  useEffect(() => {
    if (calendarOpen) popRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus()
  }, [calendarOpen, selectedDay])

  // A click anywhere outside closes the calendar (focus stays where the click put it).
  useEffect(() => {
    if (!calendarOpen) return
    const onDown = (e: globalThis.PointerEvent) => {
      const t = e.target as Node
      if (!popRef.current?.contains(t) && !dayBtnRef.current?.contains(t)) setCalendarOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [calendarOpen])

  const valueText = `${fmtDayLong(selectedDay)}${daily ? '' : `, ${time}`} — ${modeLabel[mode]}${mode !== 'live' && offset ? ` ${offset}` : ''}`
  const thumbAt = pct(selectedMinute)

  return (
    <section ref={rootRef} className={styles.root} data-mode={mode} aria-label="Timeline" onKeyDown={onKeyDown}>
      <div className={styles.player}>
        <button
          type="button"
          className={styles.play}
          aria-label={playing ? 'Pause animation' : 'Play animation'}
          aria-pressed={playing}
          aria-describedby={playHintId}
          title={playSpan(daily, step)}
          onClick={onTogglePlay}
        >
          <Icon name={playing ? 'pause' : 'play'} size={18} />
        </button>
        <span id={playHintId} className="visually-hidden">
          {playSpan(daily, step)}.
        </span>
        {/* One button instead of three chips: each click moves to the next speed. */}
        <button
          type="button"
          className={styles.speed}
          aria-label={`${speed}× speed`}
          title="Playback speed: 1×, 2× or 4×"
          onClick={() => onSpeedChange?.(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
        >
          {speed}×
        </button>
      </div>

      <span className={styles.divider} aria-hidden="true" />

      {/* The day, big: the first thing read on the bar. ‹ › move by a day; the day itself opens the calendar. */}
      <div className={styles.day}>
        <button type="button" className={styles.dayStep} aria-label="Previous day" aria-disabled={atStart || undefined} onClick={() => onStepDay?.(-1)}>
          <Icon name="chevron-left" size={16} />
        </button>
        <span className={styles.dayAnchor}>
          <button
            ref={dayBtnRef}
            type="button"
            className={styles.dayBtn}
            aria-haspopup="dialog"
            aria-expanded={calendarOpen}
            aria-controls={calendarOpen ? popId : undefined}
            aria-describedby={dayHintId}
            onClick={() => (calendarOpen ? closeCalendar() : setCalendarOpen(true))}
          >
            <Icon name="calendar" size={16} className={styles.calendar} />
            <span className={styles.dayLabel}>{fmtDayMedium(selectedDay)}</span>
            {selected?.time === 'today' && <span className={styles.todayDot} aria-hidden="true" />}
          </button>
          <span id={dayHintId} className="visually-hidden">
            {valueText}. Opens the calendar.
          </span>
          {calendarOpen && (
            <div ref={popRef} id={popId} className={styles.popover} role="dialog" aria-label="Choose a day">
              <div data-daystrip className={styles.chips} role="group" aria-label="Day">
                {days.map((d) => (
                  <DayChip
                    key={d.day}
                    time={d.time}
                    label={fmtDayShort(d.day)}
                    fullLabel={fmtDayLong(d.day)}
                    selected={d.day === selectedDay}
                    unavailable={d.unavailable}
                    mode={mode}
                    onClick={() => {
                      onSelectDay?.(d.day)
                      closeCalendar()
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </span>
        <button type="button" className={styles.dayStep} aria-label="Next day" aria-disabled={atEnd || undefined} onClick={() => onStepDay?.(1)}>
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      {daily && (
        <>
          <span className={styles.timeStack}>{modeLine}</span>
          {backToLive}
        </>
      )}

      {!daily && (
        <>
          {/* The time: typed by hand ("12:47" → the nearest instant of the data) or moved with ‹ ›, held to run. */}
          <div className={styles.timeGroup}>
            <button type="button" className={styles.dayStep} aria-label="Earlier" title="Earlier (hold to run)" {...earlier}>
              <Icon name="chevron-left" size={16} />
            </button>
            <span className={styles.timeStack}>
              <input
                ref={timeRef}
                className={styles.timeInput}
                type="text"
                inputMode="numeric"
                aria-label="Time"
                aria-describedby={timeHintId}
                maxLength={5}
                value={draft ?? time}
                // A click selects the whole time (instead of placing the caret), ready to be typed over.
                onMouseDown={(e) => {
                  if (document.activeElement !== e.currentTarget) {
                    e.preventDefault()
                    e.currentTarget.focus()
                  }
                }}
                onFocus={(e) => {
                  setDraft(time)
                  e.currentTarget.select()
                }}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDraft}
                onKeyDown={(e) => {
                  const dir = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0
                  if (e.key === 'Enter') {
                    const field = e.currentTarget
                    commitDraft()
                    // After React puts the time back in the field: selected, ready for the next one.
                    requestAnimationFrame(() => field.select())
                  } else if (e.key === 'Escape') {
                    setDraft(null)
                    e.currentTarget.blur()
                  } else if (dir) {
                    e.preventDefault()
                    setDraft(null)
                    if (e.shiftKey) onStepDay?.(dir)
                    else onStep?.(dir)
                  } else if (e.key === 'PageUp' || e.key === 'PageDown') {
                    e.preventDefault()
                    setDraft(null)
                    onStepHour?.(e.key === 'PageUp' ? 1 : -1)
                  }
                }}
              />
              {modeLine}
            </span>
            <span id={timeHintId} className="visually-hidden">
              {valueText}. Type a time and press Enter; up and down arrows move one step, Page up and Page down an hour.
            </span>
            <button type="button" className={styles.dayStep} aria-label="Later" title="Later (hold to run)" {...later}>
              <Icon name="chevron-right" size={16} />
            </button>
          </div>

          {backToLive}

          <div className={styles.trackWrap}>
            <div
              ref={trackRef}
              className={styles.track}
              onPointerDown={onTrackPointerDown}
              onPointerMove={onTrackPointerMove}
              onPointerUp={() => setScrubbing(false)}
              onPointerCancel={() => setScrubbing(false)}
            >
              <svg className={styles.ticks} viewBox="0 0 24 10" preserveAspectRatio="none" aria-hidden="true">
                {HOURS.map((h) => (
                  <line
                    key={h}
                    className={styles.tick}
                    data-major={h % 6 === 0 || undefined}
                    x1={h}
                    x2={h}
                    y1={h % 6 === 0 ? 1 : 3}
                    y2={h % 6 === 0 ? 9 : 7}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
              {unavailableHours.map((h) => (
                <span key={h} className={styles.gap} style={{ left: pct(h * 60), width: pct(60) }} aria-hidden="true" />
              ))}
              {solidTo < 1440 && <span className={styles.lineDashed} style={{ left: pct(solidTo), right: 0 }} aria-hidden="true" />}
              {solidTo > 0 && <span className={styles.lineSolid} style={{ left: 0, width: pct(solidTo) }} aria-hidden="true" />}
              {LABELS.map((h) => (
                <span key={h} className={styles.hourLabel} style={{ left: pct(h * 60) }} aria-hidden="true">
                  {pad2(h)}
                </span>
              ))}
              {selected?.time === 'today' && nowHour !== undefined && (
                <span className={styles.now} style={{ left: pct(nowHour * 60) }} aria-hidden="true">
                  <span className={styles.nowTag}>Now</span>
                </span>
              )}
              {(scrubbing || sliderFocus || playing) && (
                <span className={styles.thumbLabel} style={{ left: thumbAt }} aria-hidden="true">
                  {fmtDayShort(selectedDay)} · {time}
                </span>
              )}
              <span
                className={styles.thumb}
                onFocus={() => setSliderFocus(true)}
                onBlur={() => setSliderFocus(false)}
                style={{ left: thumbAt }}
                role="slider"
                tabIndex={0}
                aria-label="Time"
                aria-valuemin={0}
                aria-valuemax={lastMinute}
                aria-valuenow={selectedMinute}
                aria-valuetext={valueText}
                aria-keyshortcuts="ArrowLeft ArrowRight PageUp PageDown Shift+ArrowLeft Shift+ArrowRight Home End"
              />
            </div>
          </div>
        </>
      )}

      {daily && <span className={styles.spacer} />}
    </section>
  )
}
