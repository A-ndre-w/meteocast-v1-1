import styles from './Logo.module.css'

/** Figma: Logo (2011:10484) inside its 192×30 plate. */
export function Logo() {
  return (
    <a href="#/" className={styles.root} aria-label="MeteoCast home">
      Meteo<span className={styles.cast}>Cast</span>
    </a>
  )
}
