import { useEffect, useRef } from 'react'
import { modesOfStream, streamsOf, type LayerGroup, type Stream } from '../../data'
import type { Mode } from '../../types'
import { LayerItem } from '../LayerItem/LayerItem'
import { PresetHeader } from '../PresetHeader/PresetHeader'
import styles from './LayerPanel.module.css'

export type LayerPanelProps = {
  group: LayerGroup
  selectedStreamId?: string
  /** Mode of the selected instant: highlighted in every entry's mode icons. */
  cursor: Mode
  /** Does this stream have data at the selected instant? If not the item is quieter but still clickable. */
  isAvailable?: (stream: Stream) => boolean
  onSelect?: (streamId: string) => void
}

/**
 * Figma: Panel (2036:19020), redesigned after the UX review (U1).
 * One entry per data quantity instead of Real time / Forecast sections: the user picks the data,
 * the timeline decides the mode. Each entry shows which modes it has (ModeAvailability). Nothing is locked:
 * picking data that has nothing at the selected instant moves time to the nearest instant, with Undo.
 */
export function LayerPanel({ group, selectedStreamId, cursor, isAvailable, onSelect }: LayerPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const streams = streamsOf(group)

  // Keep the selected entry visible.
  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [selectedStreamId, group.id])

  return (
    <nav className={styles.root} aria-label={`${group.title} layers`}>
      <div className={styles.header}>
        <PresetHeader icon={group.icon} title={group.title} layerCount={streams.length} />
      </div>
      <div className={styles.scroll} ref={scrollRef}>
        <ul className={styles.list}>
          {streams.map((s) => (
            <li key={s.id}>
              <LayerItem
                icon={s.icon}
                label={s.name}
                meta={s.meta}
                status={s.id === selectedStreamId ? 'selected' : 'default'}
                availability={{ modes: modesOfStream(s), current: cursor }}
                idle={isAvailable ? !isAvailable(s) : false}
                onSelect={() => onSelect?.(s.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
