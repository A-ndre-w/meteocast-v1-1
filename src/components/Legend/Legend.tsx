import type { Ramp } from '../../data'
import { breaksOf, classVar, CLASSES, legendPos } from '../../scale'
import styles from './Legend.module.css'

export type LegendProps = {
  /** What the map shows, e.g. "Hourly rainfall". */
  layer: string
  unit: string
  /** Product, network or model the values come from, e.g. "RadarCast" or "ICON-2I". */
  source?: string
  ramp: Ramp
  max: number
  /** Class bounds (src/scale.ts), the same as the map. Without them, rain and snow get the precipitation
   *  classes and the others equal steps. */
  breaks?: number[]
  /** Value at the selected point: the triangle ties the legend to the card on the map. null = no marker. */
  value?: number | null
}

/**
 * Fixed legend of the map (top right): for scanning the whole map, while the point card sits by the pin.
 * Was the scale at the bottom of the Layer Card (Readout); it now carries its own title and unit.
 */
export function Legend({ layer, unit, source, ramp, max, breaks: given, value = null }: LegendProps) {
  const breaks = given ?? breaksOf(max, unit, ramp === 'rain' || ramp === 'snow')
  const pos = value === null ? null : legendPos(value, breaks)
  // A label under each class bound; the top class is open ("20+"), except for percentages, which end at 100.
  const ticks = unit === '%' ? [0, ...breaks, 100] : [0, ...breaks.slice(0, -1), `${breaks.at(-1)}+`]

  return (
    <section className={styles.root} aria-label={`Legend: ${layer}, ${unit}`}>
      <div className={styles.head}>
        <p className={styles.title}>
          {layer} <span className={styles.unit}>· {unit}</span>
        </p>
        {/* For the people who need to know which product or model they are reading (2026-10-24). */}
        {source && (
          <p className={styles.source} title="Data source">
            <span className="visually-hidden">Source: </span>
            {source}
          </p>
        )}
      </div>
      <div className={styles.bar} aria-hidden="true">
        {Array.from({ length: CLASSES }, (_, k) => (
          <span key={k} className={styles.band} style={{ background: `var(${classVar(ramp, k)})` }} />
        ))}
        {pos !== null && <span className={styles.marker} style={{ left: `${pos * 100}%` }} />}
      </div>
      <div className={styles.ticks} data-closed={unit === '%' || undefined} aria-hidden="true">
        {ticks.map((t, i) => (
          <span key={i} style={{ left: `${(i / CLASSES) * 100}%` }}>
            {t}
          </span>
        ))}
      </div>
      <p className="visually-hidden">
        Five classes: {ticks.join(', ')} {unit}.
      </p>
    </section>
  )
}
