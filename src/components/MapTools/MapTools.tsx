import { Icon, type IconName } from '../../icons/Icon'
import styles from './MapTools.module.css'

export type MapTool = { id: string; icon: IconName; label: string; onClick?: () => void }

/**
 * Map tools of the original platform (measure, base map, screenshot), stacked above the zoom control in the same
 * box. Icon buttons with their name as tooltip and accessible name.
 */
export function MapTools({ tools }: { tools: MapTool[] }) {
  return (
    <div className={styles.root} role="group" aria-label="Map tools">
      {tools.map((t, i) => (
        <span key={t.id} className={styles.cell}>
          {i > 0 && <span className={styles.divider} aria-hidden="true" />}
          <button type="button" className={styles.button} aria-label={t.label} title={t.label} onClick={t.onClick}>
            <Icon name={t.icon} size={18} />
          </button>
        </span>
      ))}
    </div>
  )
}
