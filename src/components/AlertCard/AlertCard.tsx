import { useId } from 'react'
import { isActive, type Alert, type Severity } from '../../data/alerts'
import { streamById } from '../../data'
import { Icon } from '../../icons/Icon'
import { addDays, fmtAgo, fmtDayShort, fmtTime, NOW } from '../../time'
import styles from './AlertCard.module.css'

export const severityLabel: Record<Severity, string> = { severe: 'Severe', warning: 'Warning', notice: 'Notice' }

/** "22:00", "tomorrow, 06:00", "yesterday, 23:00", "Sat 17, 09:00". */
function fmtWhen(sel: Alert['until']) {
  const word = sel.day === NOW.day ? '' : sel.day === addDays(NOW.day, 1) ? 'tomorrow, ' : sel.day === addDays(NOW.day, -1) ? 'yesterday, ' : `${fmtDayShort(sel.day)}, `
  return word + fmtTime(sel)
}

export type AlertCardProps = {
  alert: Alert
  unread?: boolean
  /** Shows the alert on the map: its data, its instant and, if any, its station. */
  onOpen?: () => void
}

/**
 * One alert (designer's mockup, 2026-10-24): icon tile and level tag in the level's colour (yellow, orange, red —
 * never green, the brand's), title, area, text, until when it applies. The title is the button; the whole card
 * is its target.
 */
export function AlertCard({ alert, unread = false, onOpen }: AlertCardProps) {
  const titleId = useId()
  const active = isActive(alert)
  return (
    <article className={styles.root} data-severity={alert.severity} data-unread={unread || undefined} data-expired={!active || undefined} aria-labelledby={titleId}>
      <span className={styles.tile} aria-hidden="true">
        <Icon name={streamById(alert.stream).icon} size={18} />
      </span>
      <div className={styles.body}>
        <div className={styles.top}>
          <span className={styles.tag}>{severityLabel[alert.severity]}</span>
          <span className={styles.ago}>
            {unread && <span className={styles.dot} aria-hidden="true" />}
            {unread && <span className="visually-hidden">Unread, </span>}
            {fmtAgo(alert.issuedMin)}
          </span>
        </div>
        <h3 id={titleId} className={styles.title}>
          <button type="button" className={styles.open} onClick={onOpen}>
            {alert.title}
          </button>
        </h3>
        <p className={styles.area}>{alert.area}</p>
        <p className={styles.text}>{alert.text}</p>
        <p className={styles.until}>{active ? `Active until ${fmtWhen(alert.until)}` : `Ended ${fmtWhen(alert.until)}`}</p>
      </div>
    </article>
  )
}
