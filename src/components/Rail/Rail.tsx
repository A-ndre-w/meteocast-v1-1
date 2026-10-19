import type { LayerGroup } from '../../data'
import { RailButton } from '../RailButton/RailButton'
import styles from './Rail.module.css'

export type RailProps = {
  groups: LayerGroup[]
  selectedGroupId: string
  onSelect?: (groupId: string) => void
  /** Preset creation is out of v1: the add button is rendered but inert. */
  onAdd?: () => void
}

/** Side rail: one RailButton per layer group (rule 10), plus "add preset". Screen-level, no Figma component. */
export function Rail({ groups, selectedGroupId, onSelect, onAdd }: RailProps) {
  return (
    <nav className={styles.root} aria-label="Layer groups">
      <ul className={styles.list}>
        {groups.map((g) => (
          <li key={g.id}>
            <RailButton
              icon={g.icon}
              label={g.title}
              status={g.id === selectedGroupId ? 'selected' : 'default'}
              onClick={() => onSelect?.(g.id)}
            />
          </li>
        ))}
      </ul>
      <div className={styles.add}>
        <RailButton status="add" label="Create preset (coming soon)" onClick={onAdd} />
      </div>
    </nav>
  )
}
