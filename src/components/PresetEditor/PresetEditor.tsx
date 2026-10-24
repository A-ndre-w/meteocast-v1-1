import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { groups, streamsOf } from '../../data'
import { Icon, type IconName } from '../../icons/Icon'
import { MAX_TITLE, PRESET_ICONS, type Preset } from '../../state/presets'
import styles from './PresetEditor.module.css'

export type PresetEditorProps = {
  /** The preset being edited; without it the editor creates a new one. */
  preset?: Preset
  /** Data ticked when creating: the one on the map, so a preset starts from what the user is looking at. */
  initialStreams?: string[]
  onSave?: (p: Omit<Preset, 'id'> & { id?: string }) => void
  onCancel?: () => void
  onDelete?: () => void
  /** Focus the name on open (off on the components page, where several editors are shown). */
  autoFocus?: boolean
}

/**
 * Creates or edits a user preset, in the place of the layer panel: a name, an icon and the data, picked from every
 * group. Not in Figma (presets were out of v1 there); built on the panel's surface, LayerItem's type sizes and the
 * Rail's icons.
 */
export function PresetEditor({ preset, initialStreams = [], onSave, onCancel, onDelete, autoFocus = true }: PresetEditorProps) {
  const titleId = useId()
  const iconGroup = useId()
  const errorId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(preset?.title ?? '')
  const [icon, setIcon] = useState<IconName>(preset?.icon ?? 'pin')
  const [picked, setPicked] = useState<string[]>(preset?.streams ?? initialStreams)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (autoFocus) nameRef.current?.focus()
  }, [autoFocus])

  const toggle = (id: string) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
    setError(undefined)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Give the preset a name.')
      nameRef.current?.focus()
      return
    }
    if (!picked.length) {
      setError('Pick at least one data layer.')
      return
    }
    onSave?.({ id: preset?.id, title, icon, streams: picked })
  }

  return (
    <div
      className={styles.root}
      role="dialog"
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onCancel?.()
        }
      }}
    >
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {preset ? 'Edit preset' : 'New preset'}
          </h2>
          <button type="button" className={styles.close} aria-label="Cancel" onClick={onCancel}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className={styles.body}>
          <label className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              ref={nameRef}
              className={styles.input}
              value={title}
              maxLength={MAX_TITLE}
              placeholder="e.g. Flood watch"
              aria-invalid={error && !title.trim() ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(e) => {
                setTitle(e.target.value)
                setError(undefined)
              }}
            />
          </label>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>Icon</legend>
            <div className={styles.icons}>
              {PRESET_ICONS.map((name) => (
                <label key={name} className={styles.iconOption} title={name.replace(/-/g, ' ')}>
                  <input type="radio" name={iconGroup} className="visually-hidden" checked={icon === name} onChange={() => setIcon(name)} />
                  <Icon name={name} size={20} aria-hidden="true" />
                  <span className="visually-hidden">{name.replace(/-/g, ' ')}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>
              Data <span className={styles.count}>· {picked.length} selected</span>
            </legend>
            {groups.map((g) => (
              <div key={g.id} className={styles.group} role="group" aria-label={g.title}>
                <p className={styles.groupTitle} aria-hidden="true">
                  {g.title}
                </p>
                <ul className={styles.streams}>
                  {streamsOf(g).map((s) => (
                    <li key={s.id}>
                      <label className={styles.stream}>
                        <input type="checkbox" className={styles.check} checked={picked.includes(s.id)} onChange={() => toggle(s.id)} />
                        <span className={styles.box} aria-hidden="true">
                          <Icon name="check" size={14} strokeWidth={2.5} />
                        </span>
                        <span className={styles.streamText}>
                          <span className={styles.streamName}>{s.name}</span>
                          <span className={styles.streamMeta}>{s.meta}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </fieldset>
        </div>

        <div className={styles.foot}>
          {error && (
            <p id={errorId} className={styles.error} role="alert">
              <Icon name="warning" size={14} aria-hidden="true" />
              {error}
            </p>
          )}
          <div className={styles.actions}>
            {onDelete && (
              <button type="button" className={styles.delete} onClick={onDelete}>
                <Icon name="trash" size={16} aria-hidden="true" />
                Delete
              </button>
            )}
            <button type="button" className={styles.cancel} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className={styles.save}>
              {preset ? 'Save' : 'Create preset'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
