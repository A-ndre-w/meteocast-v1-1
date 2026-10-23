import styles from './MapPin.module.css'

export type MapPinProps = {
  /** Place name shown above the pin. Left out while the point card, which names the place, is open. */
  label?: string
}

/**
 * Selected location marker (no Figma component — drawn from the screens).
 * Anchored at the tip: place it with the tip on the coordinate.
 */
export function MapPin({ label }: MapPinProps) {
  return (
    <div className={styles.root} role="img" aria-label={label ? `Selected location: ${label}` : 'Selected location'}>
      {label && <span className={styles.label}>{label}</span>}
      <svg className={styles.pin} width="30" height="38" viewBox="0 0 30 38" aria-hidden="true">
        <path
          d="M15 36.5S2 25.4 2 14.5a13 13 0 0 1 26 0C28 25.4 15 36.5 15 36.5Z"
          fill="var(--accent-default)"
          stroke="var(--surface-raised)"
          strokeWidth="2.5"
        />
        <circle cx="15" cy="14.5" r="5" fill="none" stroke="var(--surface-raised)" strokeWidth="2.5" />
      </svg>
    </div>
  )
}
