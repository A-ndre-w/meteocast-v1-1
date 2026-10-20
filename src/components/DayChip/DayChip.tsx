import type { Mode } from '../../types'
import styles from './DayChip.module.css'

export type DayChipProps = {
  /** Figma "Time": past = solid, today = solid + dot, future = dashed border. */
  time: 'past' | 'today' | 'future'
  selected?: boolean
  /** Beyond the layer's horizon or outside its modes. Still clickable: the app explains why it can't go there. */
  unavailable?: boolean
  /** Colour of the selected chip. Live → neutral (green is reserved for alerts). */
  mode?: Mode
  /** Short label, e.g. "Wed 13". */
  label: string
  /** Full accessible name, e.g. "Wednesday 13 October". */
  fullLabel?: string
  /** Forces the Figma hover variant (component page only). */
  hover?: boolean
  onClick?: () => void
}

/** Figma: DayChip (2009:9943). */
export function DayChip({ time, selected = false, unavailable = false, mode = 'live', label, fullLabel, hover, onClick }: DayChipProps) {
  // WCAG 2.5.3 Label in Name: the accessible name starts with the visible text ("Tue 13"), details follow.
  const extra = [fullLabel, time === 'today' && 'today', unavailable && 'no data for this layer'].filter(Boolean).join(', ')
  return (
    <button
      type="button"
      className={styles.root}
      data-time={time}
      data-selected={selected || undefined}
      data-unavailable={unavailable || undefined}
      data-hover={hover || undefined}
      data-mode={mode}
      aria-pressed={selected}
      aria-disabled={unavailable || undefined}
      onClick={onClick}
    >
      {time === 'today' && <span className={styles.dot} aria-hidden="true" />}
      {label}
      {extra && <span className="visually-hidden">, {extra}</span>}
    </button>
  )
}
