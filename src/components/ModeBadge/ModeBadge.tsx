import { Icon } from '../../icons/Icon'
import { modeIcon, modeLabel, type Mode } from '../../types'
import styles from './ModeBadge.module.css'

export type ModeBadgeProps = {
  mode: Mode
  /** Distance from now, e.g. "-24h", "+3d". Ignored in Live. */
  offset?: string
}

/** Figma: Timebar/Daychip (2010:10046). Mode tag used in the Timebar and in the Readout: text + icon + colour. */
export function ModeBadge({ mode, offset }: ModeBadgeProps) {
  const icon = modeIcon[mode]
  return (
    <span className={styles.root} data-mode={mode}>
      {icon ? <Icon name={icon} size={13} strokeWidth={2} /> : <span className={styles.dot} aria-hidden="true" />}
      <span>
        {modeLabel[mode].toUpperCase()}
        {mode !== 'live' && offset && <span className={styles.offset}> {offset}</span>}
      </span>
    </span>
  )
}
