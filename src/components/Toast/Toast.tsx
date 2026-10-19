import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '../../icons/Icon'
import { modeLabel, type Mode } from '../../types'
import styles from './Toast.module.css'

export type ToastProps = {
  /** Mode the message talks about: colours the mode word (see ModeWord). */
  mode: Mode
  /** info = automatic switch (Screen 02). warning = blocked move, missing data (Screen 03). */
  tone?: 'info' | 'warning'
  message: ReactNode
  /** Shows "Undo" when provided (rule 5: restores the previous state, even Archive). */
  onUndo?: () => void
  onClose: () => void
  /** Auto-dismiss after this many ms (rule 5: 6 s). Paused while hovered or focused. 0 = stays. */
  duration?: number
}

/** No Figma component — drawn from Screen 02 / Screen 03. Give it a new `key` for each new message. */
export function Toast({ mode, tone = 'info', message, onUndo, onClose, duration = 6000 }: ToastProps) {
  const [paused, setPaused] = useState(false)
  const remaining = useRef(duration)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!duration || paused) return
    const start = Date.now()
    const t = setTimeout(() => closeRef.current(), remaining.current)
    return () => {
      clearTimeout(t)
      remaining.current -= Date.now() - start
    }
  }, [duration, paused])

  return (
    <div
      className={styles.root}
      data-tone={tone}
      data-mode={mode}
      data-paused={paused || undefined}
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
      style={{ '--toast-duration': `${duration}ms` } as React.CSSProperties}
    >
      <Icon name={tone === 'warning' ? 'warning' : 'info'} size={20} className={styles.icon} />
      <p className={styles.message}>{message}</p>
      {onUndo && (
        <button type="button" className={styles.undo} onClick={onUndo}>
          <Icon name="undo" size={15} />
          Undo
        </button>
      )}
      <button type="button" className={styles.close} aria-label="Dismiss" onClick={onClose}>
        <Icon name="close" size={18} />
      </button>
      {duration > 0 && <span className={styles.timer} aria-hidden="true" />}
    </div>
  )
}

/** Mode name inside a toast message, in the mode's text colour (plus the word itself: never colour alone). */
export function ModeWord({ mode }: { mode: Mode }) {
  return (
    <span className={styles.modeWord} data-mode={mode}>
      {modeLabel[mode]}
    </span>
  )
}
