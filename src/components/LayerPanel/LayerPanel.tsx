import { useEffect, useId, useRef, useState } from 'react'
import { sectionOf, type Layer, type LayerGroup } from '../../data'
import { Icon } from '../../icons/Icon'
import { LayerItem } from '../LayerItem/LayerItem'
import { PresetHeader } from '../PresetHeader/PresetHeader'
import { SectionLabel } from '../SectionLabel/SectionLabel'
import styles from './LayerPanel.module.css'

export type LayerPanelProps = {
  group: LayerGroup
  selectedLayerId?: string
  /** Rule 7: why a layer can't be picked at the selected instant (null = enabled). Shown in its tooltip. */
  getDisabledReason?: (layer: Layer) => string | null
  onSelect?: (layerId: string) => void
  onGoLive?: (layerId: string) => void
}

/**
 * Figma: Panel (2036:19020). One layer group, split into Real time / Forecast, single selection (rule 10).
 * UX review U1 (minimal fix): a section where nothing is available right now collapses to one line,
 * and the selected layer is always scrolled into view.
 */
export function LayerPanel({ group, selectedLayerId, getDisabledReason, onSelect, onGoLive }: LayerPanelProps) {
  const baseId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  // Sections the user opened while they were fully unavailable.
  const [opened, setOpened] = useState<string[]>([])

  const sections = [
    { key: 'realtime', title: 'Real time', layers: group.layers.filter((l) => sectionOf(l) === 'realtime') },
    { key: 'forecast', title: 'Forecast', layers: group.layers.filter((l) => sectionOf(l) === 'forecast') },
  ]
    .filter((s) => s.layers.length > 0)
    .map((s) => {
      const reasons = s.layers.map((l) => getDisabledReason?.(l) ?? null)
      return { ...s, reasons, allDisabled: reasons.every((r) => r !== null) }
    })

  // Forget opened sections once they are available again, so the next time they start collapsed.
  const collapsibleKeys = sections.filter((s) => s.allDisabled).map((s) => s.key).join()
  useEffect(() => {
    setOpened((o) => o.filter((k) => collapsibleKeys.split(',').includes(k)))
  }, [collapsibleKeys])

  // Keep the selected layer visible (it used to end up below the fold in Forecast).
  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [selectedLayerId, collapsibleKeys])

  return (
    <nav className={styles.root} aria-label={`${group.title} layers`}>
      <div className={styles.header}>
        <PresetHeader icon={group.icon} title={group.title} layerCount={group.layers.length} />
      </div>
      <div className={styles.scroll} ref={scrollRef}>
        {sections.map((s) => {
          const collapsed = s.allDisabled && !opened.includes(s.key)
          const listId = `${baseId}-${s.key}-list`
          return (
            <section key={s.key} className={styles.section} aria-labelledby={`${baseId}-${s.key}`}>
              {s.allDisabled ? (
                <button
                  type="button"
                  className={styles.disclosure}
                  aria-expanded={!collapsed}
                  aria-controls={listId}
                  onClick={() => setOpened((o) => (collapsed ? [...o, s.key] : o.filter((k) => k !== s.key)))}
                >
                  <SectionLabel id={`${baseId}-${s.key}`}>{s.title}</SectionLabel>
                  <span className={styles.hint}>{s.layers.length} not available now</span>
                  <Icon name="chevron-right" size={14} className={styles.chevron} />
                </button>
              ) : (
                <SectionLabel id={`${baseId}-${s.key}`}>{s.title}</SectionLabel>
              )}
              {!collapsed && (
                <ul className={styles.list} id={listId}>
                  {s.layers.map((layer, i) => {
                    const reason = s.reasons[i]
                    return (
                      <li key={layer.id}>
                        <LayerItem
                          icon={layer.icon}
                          label={layer.name}
                          meta={layer.meta}
                          status={reason !== null ? 'disabled' : layer.id === selectedLayerId ? 'selected' : 'default'}
                          disabledReason={reason ?? undefined}
                          onGoLive={onGoLive && layer.modes.includes('live') ? () => onGoLive(layer.id) : undefined}
                          onSelect={() => onSelect?.(layer.id)}
                        />
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </nav>
  )
}
