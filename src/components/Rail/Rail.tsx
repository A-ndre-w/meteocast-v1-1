import { useEffect, useRef } from 'react'
import type { LayerGroup } from '../../data'
import { RailButton } from '../RailButton/RailButton'
import styles from './Rail.module.css'

export type RailProps = {
  groups: LayerGroup[]
  /** The user's presets, after the default groups. */
  presets?: { id: string; title: string; icon: LayerGroup['icon'] }[]
  selectedGroupId: string
  /** Groups and presets with data on the map (main or overlay): a dot on their button when another one is open. */
  onMapGroups?: string[]
  onSelect?: (groupId: string) => void
  /** Opens the preset editor. */
  onAdd?: () => void
}

/** Side rail: one RailButton per layer group (rule 10), the user's presets, and "add preset". Screen-level. */
export function Rail({ groups, presets = [], selectedGroupId, onMapGroups = [], onSelect, onAdd }: RailProps) {
  const listRef = useRef<HTMLUListElement>(null)
  // The list scrolls on short windows or with many presets: keep the selected group or preset in view.
  useEffect(() => {
    listRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selectedGroupId, presets.length])

  return (
    <nav className={styles.root} aria-label="Layer groups">
      <ul className={styles.list} ref={listRef}>
        {groups.map((g) => (
          <li key={g.id}>
            <RailButton
              icon={g.icon}
              label={g.title}
              status={g.id === selectedGroupId ? 'selected' : 'default'}
              onMap={g.id !== selectedGroupId && onMapGroups.includes(g.id)}
              onClick={() => onSelect?.(g.id)}
            />
          </li>
        ))}
        {presets.length > 0 && (
          <li className={styles.divider} aria-hidden="true" />
        )}
        {presets.map((p) => (
          <li key={p.id}>
            <RailButton
              icon={p.icon}
              label={`${p.title} (preset)`}
              status={p.id === selectedGroupId ? 'selected' : 'default'}
              onMap={p.id !== selectedGroupId && onMapGroups.includes(p.id)}
              onClick={() => onSelect?.(p.id)}
            />
          </li>
        ))}
      </ul>
      <div className={styles.add}>
        <RailButton status="add" label="Create preset" onClick={onAdd} />
      </div>
    </nav>
  )
}
