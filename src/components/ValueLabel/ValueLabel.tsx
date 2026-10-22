import type { CSSProperties } from 'react'
import type { Ramp } from '../../data'
import { classVar, onDark } from '../../scale'
import styles from './ValueLabel.module.css'

export type ValueLabelProps = {
  /** null = no data: shows "—", never "0". */
  value: number | null
  unit: string
  /** Colour family and data class (0–4, src/scale.ts): the label is filled like the map under it. */
  ramp?: Ramp
  level?: number
}

/** Figma: Data Map Label (2009:9669). Point value printed on the map. */
export function ValueLabel({ value, unit, ramp, level = -1 }: ValueLabelProps) {
  const text = value === null ? '—' : `${value} ${unit}`
  const fill = ramp && level >= 0 ? ({ '--fill': `var(${classVar(ramp, level)})` } as CSSProperties) : undefined
  return (
    <span
      className={styles.root}
      style={fill}
      data-filled={fill ? (onDark(level) ? 'dark' : 'light') : undefined}
      aria-label={value === null ? 'No data' : undefined}
    >
      {text}
    </span>
  )
}
