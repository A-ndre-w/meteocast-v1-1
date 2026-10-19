import { useState } from 'react'
import { Icon, type IconName } from '../../icons/Icon'
import styles from './RailButton.module.css'

export type RailButtonProps = {
  /** Figma "Status". "hover" forces the hover look (for the component page); real hover is CSS. "add" = Figma "preset". */
  status?: 'default' | 'hover' | 'selected' | 'add'
  icon?: IconName
  /** Accessible name — the button shows an icon only. Also shown as a tooltip on hover and keyboard focus. */
  label: string
  onClick?: () => void
}

/** Figma: Rail Button (2007:7333). One layer group per button in the side rail. */
export function RailButton({ status = 'default', icon = 'drizzle', label, onClick }: RailButtonProps) {
  const isAdd = status === 'add'
  // Fixed position: the rail list scrolls, so an absolute tooltip would be clipped (same approach as LayerItem).
  const [tipPos, setTipPos] = useState<{ top: number; left: number }>()
  const place = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setTipPos({ top: r.top + r.height / 2, left: r.right + 10 })
  }

  return (
    <span className={styles.wrap} onMouseEnter={(e) => place(e.currentTarget)} onFocus={(e) => place(e.currentTarget)}>
      <button
        type="button"
        className={styles.root}
        data-status={status}
        aria-label={label}
        aria-pressed={isAdd ? undefined : status === 'selected'}
        onClick={onClick}
      >
        <Icon name={isAdd ? 'plus' : icon} size={22} strokeWidth={isAdd ? 2 : undefined} />
      </button>
      {/* Visual only: the button already carries the name. */}
      <span className={styles.tip} style={tipPos} aria-hidden="true">
        {label}
      </span>
    </span>
  )
}
