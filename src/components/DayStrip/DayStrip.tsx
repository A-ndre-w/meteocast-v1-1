import { Icon } from '../../icons/Icon'
import { fmtDayLong, fmtDayShort, type DayInfo } from '../../time'
import type { Mode } from '../../types'
import { DayChip } from '../DayChip/DayChip'
import styles from './DayStrip.module.css'

export type DayStripDay = DayInfo & { unavailable?: boolean }

export type DayStripProps = {
  days: DayStripDay[]
  selectedDay: string
  mode: Mode
  onSelect?: (day: string) => void
}

/** Figma: Daystrip (2010:10400). ‹ 8 DayChips ›. Arrows move the selection by one day. */
export function DayStrip({ days, selectedDay, mode, onSelect }: DayStripProps) {
  const index = days.findIndex((d) => d.day === selectedDay)
  const go = (i: number) => days[i] && onSelect?.(days[i].day)
  return (
    <div className={styles.root} role="group" aria-label="Day">
      <button type="button" className={styles.arrow} aria-label="Previous day" disabled={index <= 0} onClick={() => go(index - 1)}>
        <Icon name="chevron-left" size={16} />
      </button>
      {days.map((d) => (
        <DayChip
          key={d.day}
          time={d.time}
          label={fmtDayShort(d.day)}
          fullLabel={fmtDayLong(d.day)}
          selected={d.day === selectedDay}
          unavailable={d.unavailable}
          mode={mode}
          onClick={() => onSelect?.(d.day)}
        />
      ))}
      <button
        type="button"
        className={styles.arrow}
        aria-label="Next day"
        disabled={index >= days.length - 1}
        onClick={() => go(index + 1)}
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </div>
  )
}
