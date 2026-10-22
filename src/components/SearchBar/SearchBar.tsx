import { useId, useState } from 'react'
import { Icon, type IconName } from '../../icons/Icon'
import styles from './SearchBar.module.css'

export type SearchResult = { id: string; label: string; detail: string; icon: IconName }

export type SearchBarProps = {
  placeholder?: string
  /** Suggestions for what is typed (UX audit H9: find data in any group). Without it, a plain search field. */
  suggest?: (query: string) => SearchResult[]
  onPick?: (id: string) => void
  /** Enter with no suggestion picked. */
  onSearch?: (query: string) => void
  onLocate?: () => void
}

/**
 * Figma: Search bar (2008:9549), with the "center" locate icon (2008:9590).
 * With `suggest`, an ARIA 1.2 combobox: type, ↓/↑ to move through the list, Enter to pick, Esc to close.
 */
export function SearchBar({ placeholder = 'Search data, location, region', suggest, onPick, onSearch, onLocate }: SearchBarProps) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const results = suggest && query.trim() ? suggest(query.trim()) : []
  const expanded = open && query.trim() !== '' && suggest !== undefined
  const optionId = (i: number) => `${listId}-${i}`

  const pick = (r: SearchResult) => {
    onPick?.(r.id)
    setQuery('')
    setOpen(false)
    setActive(-1)
  }

  return (
    <form
      className={styles.root}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        if (expanded && results[active]) pick(results[active])
        else if (expanded && results.length === 1) pick(results[0])
        else onSearch?.(query)
      }}
    >
      <Icon name="search" size={18} className={styles.searchIcon} />
      <input
        className={styles.input}
        type="search"
        name="q"
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        value={query}
        role={suggest ? 'combobox' : undefined}
        aria-expanded={suggest ? expanded : undefined}
        aria-controls={suggest ? listId : undefined}
        aria-autocomplete={suggest ? 'list' : undefined}
        aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!suggest) return
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setOpen(true)
            if (results.length) setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length)
          } else if (e.key === 'Escape' && expanded) {
            e.preventDefault()
            setOpen(false)
            setActive(-1)
          }
        }}
      />
      <span className={styles.divider} aria-hidden="true" />
      <button type="button" className={styles.locate} aria-label="Use my location" title="Use my location" onClick={onLocate}>
        <Icon name="locate" size={18} />
      </button>

      {suggest && (
        <div className={styles.popup} hidden={!expanded}>
          <ul id={listId} role="listbox" aria-label="Data" className={styles.list}>
            {results.map((r, i) => (
              <li
                key={r.id}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                className={styles.option}
                // mousedown, not click: the input keeps focus and does not close the list first.
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(r)
                }}
                onMouseEnter={() => setActive(i)}
              >
                <Icon name={r.icon} size={18} className={styles.optionIcon} />
                <span className={styles.optionText}>
                  <span className={styles.optionLabel}>{r.label}</span>
                  <span className={styles.optionDetail}>{r.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          {results.length === 0 && (
            <p className={styles.empty}>
              No data called “{query.trim()}”. Searching places is not part of this prototype.
            </p>
          )}
        </div>
      )}
    </form>
  )
}
