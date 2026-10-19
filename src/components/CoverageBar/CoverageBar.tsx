import { modeLabel, type Mode } from '../../types'
import styles from './CoverageBar.module.css'

export type CoverageBarProps = {
  /** Modes the data stream has (Archive, Live, Forecast). */
  modes: Mode[]
  /** Mode of the selected instant: where the cursor sits. */
  cursor: Mode
}

/** Spoken/tooltip version of the bar: "Archive, Live and Forecast". */
export const coverageText = (modes: Mode[]) =>
  modes.map((m) => modeLabel[m]).join(', ').replace(/, ([^,]*)$/, ' and $1')

/**
 * No Figma component (UX review U1). A mini timeline in the language of the Timebar:
 * solid = archive, dot = live (hollow when there is no live), dashed = forecast; the tick is the selected instant.
 */
export function CoverageBar({ modes, cursor }: CoverageBarProps) {
  return (
    <span className={styles.root} title={`Data: ${coverageText(modes)}`} aria-hidden="true">
      {modes.includes('archive') && <span className={styles.archive} />}
      {modes.includes('forecast') && <span className={styles.forecast} />}
      <span className={styles.now} data-on={modes.includes('live') || undefined} />
      <span className={styles.cursor} data-at={cursor} data-mode={cursor} />
    </span>
  )
}
