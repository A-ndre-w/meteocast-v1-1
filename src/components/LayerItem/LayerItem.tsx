import { useId, useState } from 'react'
import { Icon, type IconName } from '../../icons/Icon'
import styles from './LayerItem.module.css'

export type LayerItemProps = {
  /** Figma "Status" + "disabled" (code-side addition, behaviour rule 7). "hover" forces the hover look. */
  status?: 'default' | 'hover' | 'selected' | 'disabled'
  icon?: IconName
  label: string
  /** Unit and cadence, e.g. "mm - hourly". */
  meta?: string
  onSelect?: () => void
  /** Shown in the tooltip when disabled. */
  disabledReason?: string
  /** Action offered in the disabled tooltip. */
  onGoLive?: () => void
}

/** Figma: Layer/Item (2007:7454). Single selection inside the layer panel. */
export function LayerItem({
  status = 'default',
  icon = 'drizzle',
  label,
  meta,
  onSelect,
  disabledReason = 'Real-time data only. Not available in Forecast.',
  onGoLive,
}: LayerItemProps) {
  const tipId = useId()
  const disabled = status === 'disabled'
  // Fixed position so the tip escapes the panel's scroll clipping; DOM order (and Tab order) unchanged.
  const [tipPos, setTipPos] = useState<{ top: number; left: number }>()
  const place = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setTipPos({ top: r.top + r.height / 2, left: r.right + 10 })
  }

  return (
    <div
      className={styles.wrap}
      data-status={status}
      onMouseEnter={disabled ? (e) => place(e.currentTarget) : undefined}
      onFocus={disabled ? (e) => place(e.currentTarget) : undefined}
    >
      <button
        type="button"
        className={styles.root}
        data-status={status}
        aria-pressed={status === 'selected'}
        aria-disabled={disabled || undefined}
        aria-describedby={disabled ? tipId : undefined}
        onClick={disabled ? undefined : onSelect}
      >
        <span className={styles.icon}>
          <Icon name={icon} size={20} />
        </span>
        <span className={styles.text}>
          <span className={styles.label}>{label}</span>
          {meta && <span className={styles.meta}>{meta}</span>}
        </span>
        {disabled && <Icon name="lock" size={14} className={styles.lock} />}
      </button>

      {disabled && (
        <div className={styles.tip} id={tipId} role="tooltip" style={tipPos}>
          <span>{disabledReason}</span>
          {onGoLive && (
            <button type="button" className={styles.tipAction} onClick={onGoLive}>
              Back to live
              <Icon name="arrow-right" size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
