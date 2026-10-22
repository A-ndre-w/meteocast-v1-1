import type { Ramp } from '../../data'
import { Icon } from '../../icons/Icon'
import { breaksOf, classVar, CLASSES, legendPos } from '../../scale'
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
  /** Legend: colour family and class bounds (src/scale.ts), the same as the map. Without breaks, rain and snow
   * get the precipitation classes and the others equal steps. */
  scale: { max: number; ramp: Ramp; breaks?: number[] }
}

/** Figma: Layer Card (2014:15144) — named Readout in code. Point value for the selected location. */
export function Readout({ mode, offset, location, coords, layer, value, unit, time, state = 'updated', delayMin, scale }: ReadoutProps) {
  const noData = state === 'noData' || value === null
  const breaks = scale.breaks ?? breaksOf(scale.max, unit, scale.ramp === 'rain' || scale.ramp === 'snow')
  const pos = noData ? null : legendPos(value!, breaks)
  // A label under each class bound; the top class is open ("20+"), except for percentages, which end at 100.
  const ticks = unit === '%' ? [0, ...breaks, 100] : [0, ...breaks.slice(0, -1), `${breaks.at(-1)}+`]
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
          {Array.from({ length: CLASSES }, (_, k) => (
            <span key={k} className={styles.band} style={{ background: `var(${classVar(scale.ramp, k)})` }} />
          ))}
          {pos !== null && <span className={styles.marker} style={{ left: `${pos * 100}%` }} />}
        </div>
        <div className={styles.ticks} data-closed={unit === '%' || undefined}>
          {ticks.map((t, i) => (
            <span key={i} style={{ left: `${(i / CLASSES) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
