import type { Ramp } from '../../data'
import { Icon } from '../../icons/Icon'
import { classVar } from '../../scale'
import type { Mode } from '../../types'
import styles from './Readout.module.css'

export type ReadoutProps = {
  mode: Mode
  location: string
  coords: string
  /** Layer name, e.g. "Hourly rainfall". */
  layer: string
  /** null with state "noData". */
  value: number | null
  unit: string
  /** Live: update time "13:00". Archive/Forecast: data time "Wed 14 Oct, 13:00". */
  time: string
  /** Rule 9: updated = fresh live value; stale = late, with explicit delay; noData = "—", never 0. */
  state?: 'updated' | 'stale' | 'noData'
  /** Minutes late, for state "stale". */
  delayMin?: number
  /** The value's data class: a swatch of the same colour as the map and the legend. */
  swatch?: { ramp: Ramp; level: number }
  /** Close the card (the pin stays; a click on it opens the card again). */
  onClose?: () => void
  /** Shown when the card is docked because its point is off screen: brings the point back into view. */
  onLocate?: () => void
}

/**
 * Figma: Layer Card (2014:15144) — named Readout in code. Value at the selected point, in a compact card that
 * sits by the pin on the map. The scale moved to its own Legend, fixed at the top right.
 */
export function Readout({ mode, location, coords, layer, value, unit, time, state = 'updated', delayMin, swatch, onClose, onLocate }: ReadoutProps) {
  const noData = state === 'noData' || value === null
  const rightText = mode === 'live' && !noData ? `Updated ${time}` : time

  return (
    <section className={styles.root} data-mode={mode} data-state={noData ? 'noData' : state} aria-label={`${layer} at ${location}`}>
      <header className={styles.head}>
        <div className={styles.place}>
          <p className={styles.location}>
            <Icon name="pin" size={18} />
            {location}
          </p>
          <p className={styles.coords}>{coords}</p>
        </div>
        <div className={styles.actions}>
          {onLocate && (
            <button type="button" className={styles.action} aria-label={`Show ${location} on the map`} title="Show on the map" onClick={onLocate}>
              <Icon name="locate" size={16} />
            </button>
          )}
          {onClose && (
            <button type="button" className={styles.action} aria-label="Close" title="Close (click the pin to open it again)" onClick={onClose}>
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <h2 className={styles.layer}>{layer}</h2>
        <div className={styles.valueRow}>
          <p className={styles.value}>
            {swatch && !noData && swatch.level >= 0 && (
              <span className={styles.swatch} style={{ background: `var(${classVar(swatch.ramp, swatch.level)})` }} aria-hidden="true" />
            )}
            {noData ? (
              <>
                <span aria-hidden="true">—</span>
                <span className="visually-hidden">No data</span>
              </>
            ) : (
              <>
                {value}
                <span className={styles.unit}> {unit}</span>
              </>
            )}
          </p>
          <p className={styles.time}>{rightText}</p>
        </div>
        {state === 'stale' && !noData && (
          <p className={styles.notice}>
            <Icon name="clock" size={14} />
            Data {delayMin ?? '?'} min late
          </p>
        )}
        {noData && (
          <p className={styles.notice}>
            <Icon name="info" size={14} />
            No data for this {mode === 'forecast' ? 'forecast step' : 'hour'}
          </p>
        )}
      </div>
    </section>
  )
}
