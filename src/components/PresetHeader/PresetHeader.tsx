import { Icon, type IconName } from '../../icons/Icon'
import styles from './PresetHeader.module.css'

export type PresetHeaderProps = {
  icon?: IconName
  title: string
  /** "Default" for the built-in groups, "Custom" for the user's presets. */
  preset?: string
  layerCount: number
  /** User presets only: the pencil that opens the preset editor. */
  onEdit?: () => void
}

/** Figma: Set header (2008:9539). Top of the layer panel. */
export function PresetHeader({ icon = 'drizzle', title, preset = 'Default', layerCount, onEdit }: PresetHeaderProps) {
  return (
    <div className={styles.root}>
      <span className={styles.icon}>
        <Icon name={icon} size={20} />
      </span>
      <span className={styles.text}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.meta}>
          <span>{preset}</span>
          <span>{layerCount} layers</span>
        </span>
      </span>
      {onEdit && (
        <button type="button" className={styles.edit} aria-label={`Edit preset ${title}`} title="Edit preset" onClick={onEdit}>
          <Icon name="edit" size={16} />
        </button>
      )}
    </div>
  )
}
