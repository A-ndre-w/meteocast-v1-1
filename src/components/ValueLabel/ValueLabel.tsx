import styles from './ValueLabel.module.css'

export type ValueLabelProps = {
  /** null = no data: shows "—", never "0". */
  value: number | null
  unit: string
}

/** Figma: Data Map Label (2009:9669). Point value printed on the map. */
export function ValueLabel({ value, unit }: ValueLabelProps) {
  const text = value === null ? '—' : `${value} ${unit}`
  return (
    <span className={styles.root} aria-label={value === null ? 'No data' : undefined}>
      {text}
    </span>
  )
}
