import tokens from '../../design-notes/token.json'
import styles from './ComponentsPage.module.css'

const visible = <T extends object>(obj: T) =>
  Object.entries(obj).filter(([k]) => !k.startsWith('_')) as [string, string | number][]

const cssVar = (...parts: string[]) => `--${parts.join('-').replace(/[/\s]+/g, '-').toLowerCase()}`

/** Lightweight Storybook: every component in every variant. Tokens first. */
export function ComponentsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="#/" className={styles.back}>
          ← Prototype
        </a>
        <h1 className={styles.title}>MeteoCast v1.1 — Components</h1>
        <p className={styles.lede}>
          Code twin of the Figma library. Same names, Figma variants become props.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="tokens-color">
        <h2 id="tokens-color" className={styles.h2}>
          Color
        </h2>
        <div className={styles.swatches}>
          {visible(tokens.color).map(([name, value]) => (
            <figure key={name} className={styles.swatch}>
              <span className={styles.chip} style={{ background: `var(${cssVar(name)})` }} />
              <figcaption>
                <code className={styles.name}>{name}</code>
                <code className={styles.value}>{String(value)}</code>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="tokens-type">
        <h2 id="tokens-type" className={styles.h2}>
          Type
        </h2>
        <div className={styles.typeList}>
          {visible(tokens.fontSize).map(([name, px]) => (
            <div key={name} className={styles.typeRow}>
              <code className={styles.name}>
                {name} · {px}px
              </code>
              <span style={{ fontSize: `var(${cssVar('font-size', name)})` }}>Hourly rainfall 4.2 mm</span>
              <span style={{ fontSize: `var(${cssVar('font-size', name)})`, fontFamily: 'var(--font-mono)' }}>
                HOURLY RAINFALL 13:00
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="tokens-shape">
        <h2 id="tokens-shape" className={styles.h2}>
          Radius & shadow
        </h2>
        <div className={styles.shapes}>
          {visible(tokens.radius).map(([name, px]) => (
            <figure key={name} className={styles.shape} style={{ borderRadius: `var(${cssVar('radius', name)})` }}>
              <figcaption>
                <code className={styles.name}>radius/{name}</code>
                <code className={styles.value}>{px}px</code>
              </figcaption>
            </figure>
          ))}
          {visible(tokens.shadow).map(([name]) => (
            <figure key={name} className={styles.shape} style={{ boxShadow: `var(${cssVar('shadow', name)})`, border: 0 }}>
              <figcaption>
                <code className={styles.name}>shadow/{name}</code>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}
