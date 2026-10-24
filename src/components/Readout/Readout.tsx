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
  /** The instant of the value, short ("Fri 16, 16:00"): a quiet context line after the layer name, so the value
   *  can be read with its time without looking down at the timeline. */
  time?: string
  /** How fresh the value is, relative: "just now", "40 min ago", "23 h ago". Hidden with no data. */
  updated?: string
  /** What "updated" means for this mode (last reading, validation, model run): the tooltip of "Updated". */
  updatedHint?: string
  /** Rule 9: updated = fresh live value; stale = late, with explicit delay; noData = "—", never 0. */
  state?: 'updated' | 'stale' | 'noData'
  /** The value's data class: a swatch of the same colour as the map and the legend. */
  swatch?: { ramp: Ramp; level: number }
  /** Close the card: the pin goes too, and the map shows only the legend until another station is clicked. */
  onClose?: () => void
  /** Shown when the card is docked because its point is off screen: brings the point back into view. */
  onLocate?: () => void
  /** Opens the station's chart and table over a time range. */
  onSeries?: () => void
  /** The chart and table are open (the button then reads as on). */
  seriesOpen?: boolean
  /** Data on top of the main one (concept A): their values at this point, one quiet line each. */
  extra?: { name: string; value: number | null; unit: string }[]
}

/**
 * Figma: Layer Card (2014:15144) — named Readout in code. Value at the selected point, in a compact card that
 * sits by the pin on the map. The scale moved to its own Legend, fixed at the top right. The date is only a quiet
 * context line beside the layer name: in bold under the value it competed with it (designer review).
 */
export function Readout({
  mode,
  location,
  coords,
  layer,
  value,
  unit,
  time,
  updated,
  updatedHint,
  state = 'updated',
  swatch,
  onClose,
  onLocate,
  onSeries,
  seriesOpen = false,
  extra = [],
}: ReadoutProps) {
  const noData = state === 'noData' || value === null

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
            <button type="button" className={styles.action} aria-label="Close" title="Close" onClick={onClose}>
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <h2 className={styles.layer}>
          {layer}
          {time && <span className={styles.when}> · {time}</span>}
        </h2>
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
          {updated && !noData && (
            <p className={styles.updated} title={updatedHint}>
              {/* Late live data (rule 9): the delay is the "Updated" text itself, marked with a clock. */}
              {state === 'stale' && <Icon name="clock" size={13} />}
              Updated {updated}
            </p>
          )}
        </div>
        {noData && (
          <p className={styles.notice}>
            <Icon name="info" size={14} />
            No data for this {mode === 'forecast' ? 'forecast step' : 'hour'}
          </p>
        )}
      </div>
      {extra.length > 0 && (
        <dl className={styles.extra}>
          {extra.map((x) => (
            <div key={x.name} className={styles.extraRow}>
              <dt>{x.name}</dt>
              <dd>{x.value === null ? '—' : `${x.value} ${x.unit}`}</dd>
            </div>
          ))}
        </dl>
      )}
      {onSeries && (
        <button type="button" className={styles.series} aria-pressed={seriesOpen} onClick={onSeries}>
          <Icon name="chart" size={16} aria-hidden="true" />
          Chart &amp; table
        </button>
      )}
    </section>
  )
}
