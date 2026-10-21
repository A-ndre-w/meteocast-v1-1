import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Icon, type IconName } from '../../icons/Icon'
import styles from './RailButton.module.css'

export type RailPreviewItem = { id: string; label: string; meta?: string; current?: boolean }

export type RailButtonProps = {
  /** Figma "Status". "hover" forces the hover look (for the component page); real hover is CSS. "add" = Figma "preset". */
  status?: 'default' | 'hover' | 'selected' | 'add'
  icon?: IconName
  /** Accessible name — the button shows an icon only. Also the tooltip (or the preview title). */
  label: string
  onClick?: () => void
  /**
   * Group preview (UX audit H9, designer choice B): on hover or focus, the group's data are listed next to
   * the button and can be picked without switching group first. Keyboard: → into the list, ↑ ↓ to move,
   * ← or Esc back to the button.
   */
  preview?: { items: RailPreviewItem[]; onPick: (id: string) => void }
}

/** Figma: Rail Button (2007:7333). One layer group per button in the side rail. */
export function RailButton({ status = 'default', icon = 'drizzle', label, onClick, preview }: RailButtonProps) {
  const isAdd = status === 'add'
  const hintId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // Closed right after a pick, until the pointer or focus leaves.
  const [closed, setClosed] = useState(false)
  // Fixed position: the rail list scrolls, so an absolute tooltip would be clipped (same approach as LayerItem).
  const [pos, setPos] = useState<{ top: number; left: number }>()

  const place = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    if (!preview) return setPos({ top: r.top + r.height / 2, left: r.right + 10 })
    const estimated = 44 + preview.items.length * 34
    setPos({ top: Math.max(8, Math.min(r.top - 6, window.innerHeight - 8 - estimated)), left: r.right + 10 })
  }

  const items = () => [...(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
  const onKeyDown = (e: KeyboardEvent) => {
    if (!preview) return
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLButtonElement)
    if (e.target === buttonRef.current && e.key === 'ArrowRight') {
      e.preventDefault()
      setClosed(false)
      ;(list.find((b) => b.getAttribute('aria-current')) ?? list[0])?.focus()
    } else if (i >= 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length]?.focus()
    } else if (i >= 0 && (e.key === 'ArrowLeft' || e.key === 'Escape')) {
      e.preventDefault()
      buttonRef.current?.focus()
    }
  }

  return (
    <span
      className={styles.wrap}
      data-preview={preview ? true : undefined}
      data-closed={closed || undefined}
      onMouseEnter={(e) => place(e.currentTarget)}
      onMouseLeave={() => setClosed(false)}
      onFocus={(e) => place(e.currentTarget)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setClosed(false)}
      onKeyDown={onKeyDown}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.root}
        data-status={status}
        aria-label={label}
        aria-pressed={isAdd ? undefined : status === 'selected'}
        aria-describedby={preview ? hintId : undefined}
        onClick={onClick}
      >
        <Icon name={isAdd ? 'plus' : icon} size={22} strokeWidth={isAdd ? 2 : undefined} />
      </button>

      {preview ? (
        <>
          <span id={hintId} className="visually-hidden">
            Right arrow to browse its data.
          </span>
          <div className={styles.preview} style={pos} ref={listRef} role="group" aria-label={`${label} data`}>
            <p className={styles.previewTitle} aria-hidden="true">
              {label}
            </p>
            {preview.items.map((it) => (
              <button
                key={it.id}
                type="button"
                tabIndex={-1}
                className={styles.previewItem}
                aria-current={it.current || undefined}
                onClick={() => {
                  preview.onPick(it.id)
                  setClosed(true)
                  buttonRef.current?.focus()
                }}
              >
                <span>{it.label}</span>
                {it.meta && <span className={styles.previewMeta}>{it.meta}</span>}
              </button>
            ))}
          </div>
        </>
      ) : (
        // Visual only: the button already carries the name.
        <span className={styles.tip} style={pos} aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  )
}
