import { Icon } from '../../icons/Icon'
import styles from './NotificationBell.module.css'

export type NotificationBellProps = {
  /** Unread alerts. 0 hides the badge. */
  count?: number
  /** The alerts panel is open. */
  expanded?: boolean
  onClick?: () => void
}

/** Figma: Alert Icon (2008:9632). Alerts are red by design: red is reserved for alerts. Opens the AlertPanel. */
export function NotificationBell({ count = 0, expanded, onClick }: NotificationBellProps) {
  const label = count > 0 ? `Alerts, ${count} unread` : 'Alerts, none unread'
  return (
    <button type="button" className={styles.root} aria-label={label} title={label} aria-haspopup="dialog" aria-expanded={expanded} data-expanded={expanded || undefined} onClick={onClick}>
      <Icon name="bell" size={22} />
      {count > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
