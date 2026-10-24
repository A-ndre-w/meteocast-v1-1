import { useEffect, useRef, type ReactNode } from 'react'
import { streamsOf, type LayerGroup, type Stream } from '../../data'
import { MAX_OVERLAYS } from '../../state/overlays'
import { LayerItem } from '../LayerItem/LayerItem'
import { PresetHeader } from '../PresetHeader/PresetHeader'
import styles from './LayerPanel.module.css'

export type LayerPanelProps = {
  group: LayerGroup
  selectedStreamId?: string
  /** Does this stream have data at the selected instant? If not the item is quieter but still clickable. */
  isAvailable?: (stream: Stream) => boolean
  onSelect?: (streamId: string) => void
  /** A user preset: the header says "Custom" and offers Edit. */
  onEditPreset?: () => void
  /** Streams drawn on top of the main one (concept A). */
  overlays?: string[]
  onToggleOverlay?: (streamId: string) => void
  /** What is on the map, above the group's list: stays the same whatever group is open. */
  onMap?: ReactNode
}

/**
 * Figma: Panel (2036:19020), redesigned after the UX review (U1).
 * One entry per data quantity instead of Real time / Forecast sections: the user picks the data,
 * the timeline decides the mode. No mode icons on the entries (designer testing, 2026-10-24: superfluous; the
 * timeline shows where each data has values). Nothing is locked:
 * picking data that has nothing at the selected instant moves time to the nearest instant, with Undo.
 */
export function LayerPanel({ group, selectedStreamId, isAvailable, onSelect, onEditPreset, overlays = [], onToggleOverlay, onMap }: LayerPanelProps) {
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
      {onMap}
      <div className={styles.header}>
        <PresetHeader
          icon={group.icon}
          title={group.title}
          preset={onEditPreset ? 'Custom' : 'Default'}
          layerCount={streams.length}
          onEdit={onEditPreset}
        />
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
                idle={isAvailable ? !isAvailable(s) : false}
                onSelect={() => onSelect?.(s.id)}
                onToggleOverlay={onToggleOverlay && s.id !== selectedStreamId ? () => onToggleOverlay(s.id) : undefined}
                overlay={overlays.includes(s.id)}
                overlayFull={overlays.length >= MAX_OVERLAYS}
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
