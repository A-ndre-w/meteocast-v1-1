import { Icon, type IconName } from '../../icons/Icon'
import styles from './PresetHeader.module.css'

export type PresetHeaderProps = {
  icon?: IconName
  title: string
  /** Preset name; only "DEFAULT" exists in v1 (preset creation is out of scope). */
  preset?: string
  layerCount: number
}

/** Figma: Set header (2008:9539). Top of the layer panel. */
export function PresetHeader({ icon = 'drizzle', title, preset = 'Default', layerCount }: PresetHeaderProps) {
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
    </div>
  )
}
