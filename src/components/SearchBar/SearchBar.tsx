import { Icon } from '../../icons/Icon'
import styles from './SearchBar.module.css'

export type SearchBarProps = {
  placeholder?: string
  onSearch?: (query: string) => void
  onLocate?: () => void
}

/** Figma: Search bar (2008:9549), with the "center" locate icon (2008:9590). */
export function SearchBar({ placeholder = 'Search location, region, coordinate', onSearch, onLocate }: SearchBarProps) {
  return (
    <form
      className={styles.root}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        onSearch?.(new FormData(e.currentTarget).get('q')?.toString() ?? '')
      }}
    >
      <Icon name="search" size={18} className={styles.searchIcon} />
      <input className={styles.input} type="search" name="q" placeholder={placeholder} aria-label={placeholder} />
      <span className={styles.divider} aria-hidden="true" />
      <button type="button" className={styles.locate} aria-label="Use my location" title="Use my location" onClick={onLocate}>
        <Icon name="locate" size={18} />
      </button>
    </form>
  )
}
