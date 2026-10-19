import { useId } from 'react'
import { sectionOf, type Layer, type LayerGroup } from '../../data'
import { LayerItem } from '../LayerItem/LayerItem'
import { PresetHeader } from '../PresetHeader/PresetHeader'
import { SectionLabel } from '../SectionLabel/SectionLabel'
import styles from './LayerPanel.module.css'

export type LayerPanelProps = {
  group: LayerGroup
  selectedLayerId?: string
  /** Rule 7: layers that can't show data at the selected instant (real-time only while in Forecast). */
  isDisabled?: (layer: Layer) => boolean
  disabledReason?: string
  onSelect?: (layerId: string) => void
  onGoLive?: (layerId: string) => void
}

/** Figma: Panel (2036:19020). One layer group, split into Real time / Forecast, single selection (rule 10). */
export function LayerPanel({ group, selectedLayerId, isDisabled, disabledReason, onSelect, onGoLive }: LayerPanelProps) {
  const baseId = useId()
  const sections = [
    { key: 'realtime', title: 'Real time', layers: group.layers.filter((l) => sectionOf(l) === 'realtime') },
    { key: 'forecast', title: 'Forecast', layers: group.layers.filter((l) => sectionOf(l) === 'forecast') },
  ].filter((s) => s.layers.length > 0)

  return (
    <nav className={styles.root} aria-label={`${group.title} layers`}>
      <div className={styles.header}>
        <PresetHeader icon={group.icon} title={group.title} layerCount={group.layers.length} />
      </div>
      <div className={styles.scroll}>
        {sections.map((s) => (
          <section key={s.key} className={styles.section} aria-labelledby={`${baseId}-${s.key}`}>
            <SectionLabel id={`${baseId}-${s.key}`}>{s.title}</SectionLabel>
            <ul className={styles.list}>
              {s.layers.map((layer) => {
                const disabled = isDisabled?.(layer) ?? false
                return (
                  <li key={layer.id}>
                    <LayerItem
                      icon={layer.icon}
                      label={layer.name}
                      meta={layer.meta}
                      status={disabled ? 'disabled' : layer.id === selectedLayerId ? 'selected' : 'default'}
                      disabledReason={disabledReason}
                      onSelect={() => onSelect?.(layer.id)}
                      onGoLive={onGoLive && (() => onGoLive(layer.id))}
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}
