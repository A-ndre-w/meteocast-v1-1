import { Icon } from '../../icons/Icon'
import { modeIcon, modeLabel, type Mode } from '../../types'
import styles from './ModePill.module.css'

export type ModePillProps = {
  mode: Mode
  /** "Wed 14 Oct, 13:00" */
  time: string
  /** "24h ago", "in 24h" */
  relative: string
  onBackToLive?: () => void
}

/** Figma: Map Pill (2024:15692) — named ModePill in code. Hidden in Live (rule 2): renders nothing. */
export function ModePill({ mode, time, relative, onBackToLive }: ModePillProps) {
  const icon = modeIcon[mode]
  if (mode === 'live' || !icon) return null
  return (
    <div className={styles.root} data-mode={mode}>
      <span className={styles.icon}>
        <Icon name={icon} size={15} strokeWidth={2} />
      </span>
      <strong className={styles.mode}>{modeLabel[mode]}</strong>
      <span className={styles.time}>{time}</span>
      <span className={styles.relative}>{relative}</span>
      <button type="button" className={styles.back} onClick={onBackToLive}>
        Back to live
        <Icon name="arrow-right" size={13} />
      </button>
    </div>
  )
}
