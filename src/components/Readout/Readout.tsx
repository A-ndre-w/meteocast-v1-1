import type { Ramp } from '../../data'
import { Icon } from '../../icons/Icon'
import type { Mode } from '../../types'
import { ModeBadge } from '../ModeBadge/ModeBadge'
import styles from './Readout.module.css'

export type ReadoutProps = {
  mode: Mode
  /** Badge offset, e.g. "-24h". */
  offset?: string
  location: string
  coords: string
  /** Layer name, e.g. "Hourly rainfall". */
  layer: string
  /** null with state "noData". */
  value: number | null
  unit: string
  /** Live: update time "13:00". Archive/Forecast: data time "Wed 14, 13:00". */
  time: string
  /** Rule 9: updated = fresh live value; stale = late, with explicit delay; noData = "—", never 0. */
  state?: 'updated' | 'stale' | 'noData'
  /** Minutes late, for state "stale". */
  delayMin?: number
  scale: { max: number; ramp: Ramp }
}

/** Figma: Layer Card (2014:15144) — named Readout in code. Point value for the selected location. */
export function Readout({ mode, offset, location, coords, layer, value, unit, time, state = 'updated', delayMin, scale }: ReadoutProps) {
  const noData = state === 'noData' || value === null
  const pos = noData ? null : Math.min(1, Math.max(0, value! / scale.max))
  const maxLabel = unit === '%' ? `${scale.max}` : `${scale.max}+`
  const rightText = mode === 'live' && !noData ? `Updated ${time}` : time

  return (
    <section className={styles.root} data-mode={mode} data-state={noData ? 'noData' : state} aria-label={`${layer} at ${location}`}>
      <header className={styles.head}>
        <div className={styles.place}>
          <p className={styles.location}>
            <Icon name="pin" size={20} />
            {location}
          </p>
          <p className={styles.coords}>{coords}</p>
        </div>
        <ModeBadge mode={mode} offset={offset} />
      </header>

      <div className={styles.body}>
        <h2 className={styles.layer}>{layer}</h2>
        <div className={styles.valueRow}>
          <p className={styles.value}>
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

      <div className={styles.scale} aria-hidden="true">
        <div className={styles.bar} data-ramp={scale.ramp}>
          {pos !== null && <span className={styles.marker} style={{ left: `${pos * 100}%` }} />}
        </div>
        <div className={styles.ticks}>
          <span>0</span>
          <span>{scale.max / 2}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    </section>
  )
}
