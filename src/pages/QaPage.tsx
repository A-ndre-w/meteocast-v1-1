import { useEffect, useState } from 'react'
import { scenarios } from '../state/scenarios'
import styles from './QaPage.module.css'

type Blend = 'side' | 'overlay' | 'difference'

/**
 * Design QA (dev only): the Figma export and the live code at the same 1440×840 frame.
 * Overlay with an opacity slider, or "difference" blending to make every offset glow.
 */
export function QaPage() {
  const [id, setId] = useState(scenarios[0].id)
  const [blend, setBlend] = useState<Blend>('difference')
  const [opacity, setOpacity] = useState(1)
  const [scale, setScale] = useState(0.5)
  const s = scenarios.find((x) => x.id === id)!
  // Region zoom from the URL: #/qa?x=80&y=680&z=3 (design px, zoom factor).
  const q = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const zx = +(q.get('x') ?? 0)
  const zy = +(q.get('y') ?? 0)
  const z = +(q.get('z') ?? 1)
  const initial = q.get('s')
  useEffect(() => {
    if (initial) setId(initial)
  }, [initial])

  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 48) / (blend === 'side' ? 2900 : 1440)) * z)
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [blend, z])

  const img = `/assets/${encodeURI(s.figma)}`
  const app = `/?qa=${id}#/?s=${id}`

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <a href="#/">← Prototype</a>
        <strong>Design QA</strong>
        <select value={id} onChange={(e) => setId(e.target.value)} aria-label="Screen">
          {scenarios.map((x) => (
            <option key={x.id} value={x.id}>
              {x.title}
            </option>
          ))}
        </select>
        <div role="radiogroup" aria-label="Comparison" className={styles.modes}>
          {(['difference', 'overlay', 'side'] as Blend[]).map((b) => (
            <label key={b}>
              <input type="radio" name="blend" checked={blend === b} onChange={() => setBlend(b)} /> {b}
            </label>
          ))}
        </div>
        {blend === 'overlay' && (
          <label>
            Figma opacity <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(+e.target.value)} />
          </label>
        )}
        <code>{s.figma}</code>
      </header>

      <div className={styles.stage} data-blend={blend} style={{ '--s': scale, '--x': `${-zx}px`, '--y': `${-zy}px`, '--z': z } as React.CSSProperties}>
        <div className={styles.frame}>
          <iframe key={id} src={app} title="Code" width={1440} height={840} />
        </div>
        <div className={styles.frame}>
          <img src={img} alt={`Figma: ${s.title}`} style={blend === 'overlay' ? { opacity } : undefined} />
        </div>
      </div>
    </div>
  )
}
