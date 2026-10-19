import { Icon } from '../../icons/Icon'
import styles from './ZoomControl.module.css'

export type ZoomControlProps = {
  onZoomIn?: () => void
  onZoomOut?: () => void
  canZoomIn?: boolean
  canZoomOut?: boolean
}

/** Figma: Zoom Controls (2009:9699). */
export function ZoomControl({ onZoomIn, onZoomOut, canZoomIn = true, canZoomOut = true }: ZoomControlProps) {
  return (
    <div className={styles.root} role="group" aria-label="Map zoom">
      <button type="button" className={styles.button} aria-label="Zoom in" onClick={onZoomIn} disabled={!canZoomIn}>
        <Icon name="plus" size={18} />
      </button>
      <span className={styles.divider} aria-hidden="true" />
      <button type="button" className={styles.button} aria-label="Zoom out" onClick={onZoomOut} disabled={!canZoomOut}>
        <Icon name="minus" size={18} />
      </button>
    </div>
  )
}
