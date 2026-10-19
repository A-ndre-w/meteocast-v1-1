import styles from './LiveViewButton.module.css'

export type LiveViewButtonProps = {
  /** Figma "Status": off in Live (nothing to go back to), on in Archive and Forecast. */
  status?: 'on' | 'off'
  onClick?: () => void
}

/** Figma: Live view button (2008:9544). The "Now" button of the timebar (behaviour rule 4). */
export function LiveViewButton({ status = 'on', onClick }: LiveViewButtonProps) {
  const off = status === 'off'
  return (
    <button
      type="button"
      className={styles.root}
      data-status={status}
      disabled={off}
      aria-label={off ? 'Now — already showing live data' : 'Now — jump to live data'}
      onClick={onClick}
    >
      Now
    </button>
  )
}
