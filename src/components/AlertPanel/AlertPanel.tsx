import { useEffect, useId, useRef, useState } from 'react'
import { isActive, type Alert } from '../../data/alerts'
import { Icon } from '../../icons/Icon'
import { AlertCard } from '../AlertCard/AlertCard'
import styles from './AlertPanel.module.css'

type Filter = 'all' | 'active' | 'severe'

export type AlertPanelProps = {
  alerts: Alert[]
  unread: string[]
  /** Minutes since the list was refreshed (footer). */
  updatedMin?: number
  onOpen?: (alert: Alert) => void
  onMarkAllRead?: () => void
  onManage?: () => void
  onClose?: () => void
  /** Focus the panel on open (off on the components page). */
  autoFocus?: boolean
}

/**
 * Alerts panel under the bell (designer's mockup, 2026-10-24; Figma Alert Panel 2087:32857 was out of v1).
 * Header with the count of active severe alerts and "Mark all read", filters All · Active · Severe, the cards,
 * and a footer with subscriptions and the last update. Esc or a click outside closes it.
 */
export function AlertPanel({ alerts, unread, updatedMin = 2, onOpen, onMarkAllRead, onManage, onClose, autoFocus = true }: AlertPanelProps) {
  const titleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const severe = alerts.filter((a) => a.severity === 'severe' && isActive(a)).length
  const active = alerts.filter((a) => isActive(a)).length
  const shown = alerts.filter((a) => (filter === 'active' ? isActive(a) : filter === 'severe' ? a.severity === 'severe' : true))

  useEffect(() => {
    if (autoFocus) rootRef.current?.focus()
  }, [autoFocus])

  const filters: [Filter, string, number?][] = [
    ['all', 'All'],
    ['active', 'Active', active],
    ['severe', 'Severe', severe],
  ]

  return (
    <div
      ref={rootRef}
      className={styles.root}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose?.()
        }
      }}
    >
      <div className={styles.head}>
        <div>
          <h2 id={titleId} className={styles.title}>
            Alerts
          </h2>
          <p className={styles.summary} data-severe={severe > 0 || undefined}>
            {severe > 0 ? `${severe} severe` : `${active} active`}
            {unread.length > 0 && <span className={styles.unreadCount}> · {unread.length} unread</span>}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            type="button"
            className={styles.markRead}
            onClick={() => {
              onMarkAllRead?.()
              // The button goes away with the last unread alert: keep focus in the panel.
              rootRef.current?.focus()
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      <div className={styles.filters} role="group" aria-label="Show">
        {filters.map(([id, label, count]) => (
          <button key={id} type="button" className={styles.filter} aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label}
            {count !== undefined && count > 0 && <span className={styles.filterCount} data-severe={id === 'severe' || undefined}>{count}</span>}
          </button>
        ))}
      </div>

      <div className={styles.scroll}>
        {shown.length ? (
          <ul className={styles.list}>
            {shown.map((a) => (
              <li key={a.id}>
                <AlertCard alert={a} unread={unread.includes(a.id)} onOpen={() => onOpen?.(a)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No alerts here.</p>
        )}
      </div>

      <div className={styles.foot}>
        <button type="button" className={styles.manage} onClick={onManage}>
          <Icon name="settings" size={18} aria-hidden="true" />
          Manage subscriptions
        </button>
        <span className={styles.updated}>Updated {updatedMin} min ago</span>
      </div>
    </div>
  )
}
