import { Icon } from '../../icons/Icon'
import { modeLabel, type Mode } from '../../types'
import styles from './ModeAvailability.module.css'

export type ModeAvailabilityProps = {
  /** Modes the data stream has (Archive, Live, Forecast). */
  modes: Mode[]
  /** Mode of the selected instant: its icon is highlighted when the data has it. */
  current: Mode
}

/** Spoken/tooltip version: "Archive, Live and Forecast". */
export const availabilityText = (modes: Mode[]) =>
  modes.map((m) => modeLabel[m]).join(', ').replace(/, ([^,]*)$/, ' and $1')

const ORDER: Mode[] = ['archive', 'live', 'forecast']

/**
 * No Figma component (UX review H12, designer choice B, 2026-10-21). The three mode icons used by
 * ModeBadge and ModePill, in timeline order: present = secondary, missing = faint, current mode = its colour.
 * Replaces the earlier CoverageBar, which read as a code to learn.
 */
export function ModeAvailability({ modes, current }: ModeAvailabilityProps) {
  return (
    <span className={styles.root} title={`Data: ${availabilityText(modes)}`} aria-hidden="true">
      {ORDER.map((m) => (
        <span
          key={m}
          className={styles.slot}
          data-mode={m}
          data-has={modes.includes(m) || undefined}
          data-current={(m === current && modes.includes(m)) || undefined}
        >
          {m === 'live' ? <span className={styles.dot} /> : <Icon name={m === 'archive' ? 'archive' : 'forecast'} size={14} strokeWidth={2} />}
        </span>
      ))}
    </span>
  )
}
