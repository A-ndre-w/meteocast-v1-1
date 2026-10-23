import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Icon } from '../../icons/Icon'
import { fmtDayLong, fmtDayMedium, fmtDayShort, fmtHour } from '../../time'
import { modeLabel, type Mode } from '../../types'
import { DayStrip, type DayStripDay } from '../DayStrip/DayStrip'
import { LiveViewButton } from '../LiveViewButton/LiveViewButton'
import { ModeBadge } from '../ModeBadge/ModeBadge'
import styles from './Timebar.module.css'

export type Speed = 1 | 2 | 4

export type TimebarProps = {
  mode: Mode
  selectedDay: string
  selectedHour: number
  /** "day" hides the hour track (rule 6). */
  interval: 'hour' | 'day'
  days: DayStripDay[]
  /** Badge offset, e.g. "-24h". */
  offset?: string
  /** Hour of "now" when the selected day is today: draws the NOW marker and splits solid/dashed (rule 3). */
  nowHour?: number
  /** Hours of the selected day with no data for the current layer (hatched on the track). */
  unavailableHours?: number[]
  playing?: boolean
  speed?: Speed
  onSelectDay?: (day: string) => void
  onSelectHour?: (hour: number) => void
  /** ±1 hour (arrows) — may cross days. */
  onStepHour?: (delta: number) => void
  /** ±1 day (Shift+arrows, PageUp/Down, arrows on daily layers). */
  onStepDay?: (delta: number) => void
  /** First / last instant of the timeline: the ‹ › buttons are shown disabled (UX audit H3). */
  atStart?: boolean
  atEnd?: boolean
  onNow?: () => void
  onTogglePlay?: () => void
  onSpeedChange?: (speed: Speed) => void
}

const HOURS = Array.from({ length: 25 }, (_, h) => h)
const SPEEDS: Speed[] = [1, 2, 4]
const pct = (h: number) => `${(h / 24) * 100}%`

/** Figma: Timeline (2010:10063) — named Timebar in code. One timeline for Archive, Live and Forecast. */
export function Timebar({
  mode,
  selectedDay,
  selectedHour,
  interval,
  days,
  offset,
  nowHour,
  unavailableHours = [],
  playing = false,
  speed = 1,
  onSelectDay,
  onSelectHour,
  onStepHour,
  onStepDay,
  atStart = false,
  atEnd = false,
  onNow,
  onTogglePlay,
  onSpeedChange,
}: TimebarProps) {
  const rootRef = useRef<HTMLElement>(null)
  const playHintId = useId()
  const dateHintId = useId()
  const trackRef = useRef<HTMLDivElement>(null)
  // The hour label on the thumb shows while the time moves: dragging, keys on the slider, Play.
  const [scrubbing, setScrubbing] = useState(false)
  const [sliderFocus, setSliderFocus] = useState(false)
  const daily = interval === 'day'
  const selected = days.find((d) => d.day === selectedDay)
  // Rule 3: observed data = solid, forecast = dashed.
  const solidTo = selected?.time === 'past' ? 24 : selected?.time === 'today' ? (nowHour ?? 0) : 0

  const hourFromPointer = (e: PointerEvent) => {
    const r = trackRef.current!.getBoundingClientRect()
    return Math.min(23, Math.max(0, Math.round(((e.clientX - r.left) / r.width) * 24)))
  }

  const onTrackPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setScrubbing(true)
    onSelectHour?.(hourFromPointer(e))
    trackRef.current?.querySelector<HTMLElement>('[role="slider"]')?.focus()
  }
  const onTrackPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      const h = hourFromPointer(e)
      if (h !== selectedHour) onSelectHour?.(h)
    }
  }

  // Keyboard model (brief): arrows = hours, Shift+arrows = days. On daily layers arrows move days.
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    const onSlider = target.getAttribute('role') === 'slider'
    const onChip = target.closest('[data-daystrip]') !== null
    const dir = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : 0
    if (dir && (e.shiftKey || onChip)) {
      e.preventDefault()
      onStepDay?.(dir)
    } else if (dir && onSlider) {
      e.preventDefault()
      onStepHour?.(dir)
    } else if (onSlider && (e.key === 'PageUp' || e.key === 'PageDown')) {
      e.preventDefault()
      onStepDay?.(e.key === 'PageUp' ? 1 : -1)
    } else if (onSlider && (e.key === 'Home' || e.key === 'End')) {
      e.preventDefault()
      onSelectHour?.(e.key === 'Home' ? 0 : 23)
    }
  }

  // Keyboard on the day chips: focus follows the selected day, so repeated arrows keep walking.
  useEffect(() => {
    const strip = rootRef.current?.querySelector('[data-daystrip]')
    if (strip?.contains(document.activeElement)) strip.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus()
  }, [selectedDay])

  const step = (dir: number) => (daily ? onStepDay?.(dir) : onStepHour?.(dir))
  const valueText = `${fmtDayLong(selectedDay)}${daily ? '' : `, ${fmtHour(selectedHour)}`} — ${modeLabel[mode]}`

  return (
    <section ref={rootRef} className={styles.root} data-mode={mode} aria-label="Timeline" onKeyDown={onKeyDown}>
      <div className={styles.row}>
        <div className={styles.controls}>
          <div className={styles.player}>
            <button type="button" className={styles.stepBtn} aria-label={daily ? 'Previous day' : 'Previous hour'} aria-disabled={atStart || undefined} onClick={() => step(-1)}>
              <Icon name="chevron-left" size={16} />
            </button>
            <button
              type="button"
              className={styles.play}
              aria-label={playing ? 'Pause animation' : 'Play animation'}
              aria-pressed={playing}
              aria-describedby={playHintId}
              title="Plays the next 24 hours from the selected time, then starts again"
              onClick={onTogglePlay}
            >
              <Icon name={playing ? 'pause' : 'play'} size={18} />
            </button>
            <span id={playHintId} className="visually-hidden">
              Plays the next 24 hours from the selected time, then starts again.
            </span>
            <button type="button" className={styles.stepBtn} aria-label={daily ? 'Next day' : 'Next hour'} aria-disabled={atEnd || undefined} onClick={() => step(1)}>
              <Icon name="chevron-right" size={16} />
            </button>
          </div>

          {/* One button instead of three chips: each click moves to the next speed (compact timebar, concept A). */}
          <button
            type="button"
            className={styles.speed}
            aria-label={`${speed}× speed`}
            title="Playback speed: 1×, 2× or 4×"
            onClick={() => onSpeedChange?.(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
          >
            {speed}×
          </button>

          <span className={styles.badgeSlot}>
            <ModeBadge mode={mode} offset={offset} />
          </span>

          {/* The calendar icon promised a picker (UX review U9): the date now takes you to the day chips. */}
          <button
            type="button"
            className={styles.datetime}
            data-daily={daily || undefined}
            aria-describedby={dateHintId}
            onClick={() => rootRef.current?.querySelector<HTMLElement>('[data-daystrip] [aria-pressed="true"]')?.focus()}
          >
            <Icon name="calendar" size={18} className={styles.calendar} />
            <span className={styles.date}>{fmtDayMedium(selectedDay)}</span>
            {!daily && <span className={styles.hour}>{fmtHour(selectedHour)}</span>}
          </button>
          <span id={dateHintId} className="visually-hidden">
            {valueText}. Moves focus to the day chips.
          </span>

          <LiveViewButton status={mode === 'live' ? 'off' : 'on'} onClick={onNow} />
        </div>

        <span className={styles.divider} aria-hidden="true" />

        <div data-daystrip className={styles.strip}>
          <DayStrip days={days} selectedDay={selectedDay} mode={mode} onSelect={onSelectDay} />
        </div>
      </div>

      {!daily && (
        <div className={styles.trackRow}>
          <span className={styles.end} aria-hidden="true">
            00
          </span>
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
                <span key={h} className={styles.gap} style={{ left: pct(h), width: pct(1) }} aria-hidden="true" />
              ))}
              {solidTo < 24 && <span className={styles.lineDashed} style={{ left: pct(solidTo), right: 0 }} aria-hidden="true" />}
              {solidTo > 0 && <span className={styles.lineSolid} style={{ left: 0, width: pct(solidTo) }} aria-hidden="true" />}
              {selected?.time === 'today' && nowHour !== undefined && (
                <span className={styles.now} style={{ left: pct(nowHour) }} aria-hidden="true">
                  <span className={styles.nowTag}>Now</span>
                </span>
              )}
              {(scrubbing || sliderFocus || playing) && (
                <span className={styles.thumbLabel} style={{ left: pct(selectedHour) }} aria-hidden="true">
                  {fmtDayShort(selectedDay)} · {fmtHour(selectedHour)}
                </span>
              )}
              <span
                className={styles.thumb}
                onFocus={() => setSliderFocus(true)}
                onBlur={() => setSliderFocus(false)}
                style={{ left: pct(selectedHour) }}
                role="slider"
                tabIndex={0}
                aria-label="Hour"
                aria-valuemin={0}
                aria-valuemax={23}
                aria-valuenow={selectedHour}
                aria-valuetext={valueText}
                aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End"
              />
            </div>
          </div>
          <span className={styles.end} aria-hidden="true">
            24
          </span>
        </div>
      )}
    </section>
  )
}
