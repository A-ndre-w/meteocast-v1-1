import { Icon, type IconName } from '../../icons/Icon'
import styles from './OnTheMap.module.css'

export type OnTheMapItem = {
  stream: string
  name: string
  icon: IconName
  /** No data at the selected instant: the chip says so instead of silently showing nothing. */
  noData?: boolean
}

export type OnTheMapProps = {
  main: OnTheMapItem
  overlays: OnTheMapItem[]
  onRemove?: (stream: string) => void
  /** Opens the group the data belongs to, to find it in the list. */
  onOpen?: (stream: string) => void
}

/**
 * What is on the map (concept A), at the top of the layer panel whatever group is open: the main data (the coloured
 * field and its labels) and the data drawn on top of it as symbols, each removable.
 */
export function OnTheMap({ main, overlays, onRemove, onOpen }: OnTheMapProps) {
  return (
    <section className={styles.root} aria-label="On the map">
      <p className={styles.title} aria-hidden="true">
        On the map · {1 + overlays.length}
      </p>
      <ul className={styles.list}>
        <li className={styles.chip} data-main>
          <button type="button" className={styles.open} title="Show in its group" onClick={() => onOpen?.(main.stream)}>
            <Icon name={main.icon} size={14} aria-hidden="true" />
            <span className={styles.name}>{main.name}</span>
            <span className={styles.role}>main</span>
          </button>
        </li>
        {overlays.map((o) => (
          <li key={o.stream} className={styles.chip} data-nodata={o.noData || undefined} title={o.noData ? 'No data at this time' : undefined}>
            <button type="button" className={styles.open} title="Show in its group" onClick={() => onOpen?.(o.stream)}>
              <Icon name={o.icon} size={14} aria-hidden="true" />
              <span className={styles.name}>{o.name}</span>
              {o.noData && <span className={styles.role}>no data now</span>}
            </button>
            <button type="button" className={styles.remove} aria-label={`Remove ${o.name} from the map`} onClick={() => onRemove?.(o.stream)}>
              <Icon name="close" size={12} />
            </button>
          </li>
        ))}
      </ul>
      {overlays.length === 0 && (
        <p className={styles.hint}>
          Add data on top with <Icon name="stack" size={13} />
          <span className="visually-hidden">the layers button</span> on an entry.
        </p>
      )}
    </section>
  )
}
