import type { ReactNode } from 'react'
import styles from './ComponentsPage.module.css'

type SpecimenProps = {
  name: string
  /** Figma component name and node, e.g. "Timeline · 2010:10063". */
  figma: string
  /** Props signature, shown as code. */
  props: string
  note?: string
  /** Kept in the library but not used on the v1.1 screen: shown with a badge and the reason (UX audit H15). */
  unused?: string
  children: ReactNode
}

/** One component card on the /components page. */
export function Specimen({ name, figma, props, note, unused, children }: SpecimenProps) {
  const id = `c-${name.toLowerCase()}`
  return (
    <section className={styles.specimen} data-unused={unused ? true : undefined} aria-labelledby={id}>
      <header className={styles.specHead}>
        <h3 id={id} className={styles.specName}>
          {name}
          {unused && <span className={styles.unusedBadge}>Not used in the screen</span>}
        </h3>
        <span className={styles.figma}>Figma: {figma}</span>
      </header>
      <code className={styles.props}>{props}</code>
      {note && <p className={styles.note}>{note}</p>}
      {unused && <p className={styles.note}>{unused}</p>}
      <div className={styles.variants}>{children}</div>
    </section>
  )
}

type VariantProps = {
  label: string
  /** This single variant is not used on the v1.1 screen. */
  unused?: boolean
  children: ReactNode
  /** Map-like backdrop for components that sit on the map. */
  onMap?: boolean
  wide?: boolean
}

export function Variant({ label, children, onMap, wide, unused }: VariantProps) {
  return (
    <figure className={styles.variant} data-on-map={onMap || undefined} data-wide={wide || undefined} data-unused={unused || undefined}>
      <div className={styles.stage}>{children}</div>
      <figcaption className={styles.caption}>
        {label}
        {unused && <span className={styles.unusedBadge}>Not used in the screen</span>}
      </figcaption>
    </figure>
  )
}
