import type { ReactNode } from 'react'
import styles from './SectionLabel.module.css'

export type SectionLabelProps = {
  children: ReactNode
  id?: string
}

/** Figma: Menu Section label (2008:9345). "REAL TIME", "FORECAST" headings in the layer panel. */
export function SectionLabel({ children, id }: SectionLabelProps) {
  return (
    <h3 className={styles.root} id={id}>
      {children}
    </h3>
  )
}
