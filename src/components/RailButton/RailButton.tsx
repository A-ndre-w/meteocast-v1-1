import { Icon, type IconName } from '../../icons/Icon'
import styles from './RailButton.module.css'

export type RailButtonProps = {
  /** Figma "Status". "hover" forces the hover look (for the component page); real hover is CSS. "add" = Figma "preset". */
  status?: 'default' | 'hover' | 'selected' | 'add'
  icon?: IconName
  /** Accessible name — the button shows an icon only. */
  label: string
  onClick?: () => void
}

/** Figma: Rail Button (2007:7333). One layer group per button in the side rail. */
export function RailButton({ status = 'default', icon = 'drizzle', label, onClick }: RailButtonProps) {
  const isAdd = status === 'add'
  return (
    <button
      type="button"
      className={styles.root}
      data-status={status}
      aria-label={label}
      aria-pressed={isAdd ? undefined : status === 'selected'}
      title={label}
      onClick={onClick}
    >
      <Icon name={isAdd ? 'plus' : icon} size={isAdd ? 22 : 22} strokeWidth={isAdd ? 2 : undefined} />
    </button>
  )
}
