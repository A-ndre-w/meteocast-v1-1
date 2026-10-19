import type { ReactNode } from 'react'
import styles from './ComponentsPage.module.css'

type SpecimenProps = {
  name: string
  /** Figma component name and node, e.g. "Timeline · 2010:10063". */
  figma: string
  /** Props signature, shown as code. */
  props: string
  note?: string
  children: ReactNode
}

/** One component card on the /components page. */
export function Specimen({ name, figma, props, note, children }: SpecimenProps) {
  const id = `c-${name.toLowerCase()}`
  return (
    <section className={styles.specimen} aria-labelledby={id}>
      <header className={styles.specHead}>
        <h3 id={id} className={styles.specName}>
          {name}
        </h3>
        <span className={styles.figma}>Figma: {figma}</span>
      </header>
      <code className={styles.props}>{props}</code>
      {note && <p className={styles.note}>{note}</p>}
      <div className={styles.variants}>{children}</div>
    </section>
  )
}

type VariantProps = {
  label: string
  children: ReactNode
  /** Map-like backdrop for components that sit on the map. */
  onMap?: boolean
  wide?: boolean
}

export function Variant({ label, children, onMap, wide }: VariantProps) {
  return (
    <figure className={styles.variant} data-on-map={onMap || undefined} data-wide={wide || undefined}>
      <div className={styles.stage}>{children}</div>
      <figcaption className={styles.caption}>{label}</figcaption>
    </figure>
  )
}
