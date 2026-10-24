import { useEffect, useId, useRef, useState } from 'react'
import { Icon, type IconName } from '../../icons/Icon'
import styles from './TopMenu.module.css'

export type TopMenuItem = { icon: IconName; label: string; description?: string; onSelect?: () => void }

export type TopMenuProps = {
  icon: IconName
  /** Accessible name of the button, also its tooltip. */
  label: string
  /** Title over the list, e.g. "Additional services". */
  heading: string
  /** Small line under the heading (the account's name). */
  subheading?: string
  items: TopMenuItem[]
}

/**
 * A square button in the top bar (same as the alerts bell) that opens a short list below it: additional services,
 * the account. A disclosure, not an ARIA menu: Tab moves through the items; Esc or a click outside closes it.
 */
export function TopMenu({ icon, label, heading, subheading, items }: TopMenuProps) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    rootRef.current?.querySelector<HTMLElement>('[data-menu-list] button')?.focus()
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.preventDefault()
          close()
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name={icon} size={22} />
      </button>
      {open && (
        <div id={listId} className={styles.panel} data-menu-list>
          <p className={styles.heading}>
            {heading}
            {subheading && <span className={styles.subheading}>{subheading}</span>}
          </p>
          <ul className={styles.list}>
            {items.map((it) => (
              <li key={it.label}>
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => {
                    close()
                    it.onSelect?.()
                  }}
                >
                  <span className={styles.itemIcon} aria-hidden="true">
                    <Icon name={it.icon} size={18} />
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemLabel}>{it.label}</span>
                    {it.description && <span className={styles.itemDesc}>{it.description}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
