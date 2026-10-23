import styles from './Logo.module.css'

/**
 * The MeteoCast mark, redrawn as a vector from the product's logo: a ring open on the right, where two radar
 * arcs (70% and 40%) spread from the centre. Brand green (accent/default); decorative, the link carries the name.
 */
export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="var(--accent-default)" aria-hidden="true" focusable="false">
      <path d="M20 0A20 20 0 0 0 20 40V33.5A13.5 13.5 0 0 1 20 6.5Z" />
      <path d="M20 0A20 20 0 0 1 20 40V36.5A16.5 16.5 0 0 0 20 3.5Z" />
      <path d="M20 7A13 13 0 0 1 20 33V29.5A9.5 9.5 0 0 0 20 10.5Z" opacity="0.7" />
      <path d="M20 13.5A6.5 6.5 0 0 1 20 26.5V23A3 3 0 0 0 20 17Z" opacity="0.4" />
    </svg>
  )
}

/** Figma: Logo (2011:10484) inside its 192×30 plate, with the MeteoCast mark before the wordmark. */
export function Logo() {
  return (
    <a href="#/" className={styles.root} aria-label="MeteoCast home">
      <LogoMark />
      <span>
        Meteo<span className={styles.cast}>Cast</span>
      </span>
    </a>
  )
}
