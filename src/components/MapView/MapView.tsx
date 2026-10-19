import type { CSSProperties } from 'react'
import type { Ramp } from '../../data'
import type { Mode } from '../../types'
import { MapPin } from '../MapPin/MapPin'
import { ValueLabel } from '../ValueLabel/ValueLabel'
import styles from './MapView.module.css'

type Point = [number, number]

export type MapViewProps = {
  mode: Mode
  /** Colour family of the data layer. */
  ramp: Ramp
  /** 0–1: how strong the data layer is at this instant. null = no data → data layer hidden. */
  intensity: number | null
  labels: { pos: Point; value: number | null; unit: string }[]
  pin: { pos: Point; label: string }
  zoom?: number
}

const W = 1440
const H = 840
const at = ([x, y]: Point): CSSProperties => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` })

// Blob fields per colour family, in the 1440×840 frame. Rain matches the blobs of assets/map.png.
const blobs: Record<Ramp, { c: Point; r: number; color: string }[]> = {
  rain: [
    { c: [461, 310], r: 150, color: '#5F9FD3' },
    { c: [835, 223], r: 112, color: '#4C82D4' },
    { c: [1109, 461], r: 160, color: '#6FB9CD' },
    { c: [245, 533], r: 90, color: '#7FC2CC' },
  ],
  snow: [
    { c: [1111, 348], r: 170, color: '#47DAFF' },
    { c: [922, 641], r: 130, color: '#47DAFF' },
    { c: [330, 220], r: 110, color: '#7FE4FF' },
  ],
  temp: [
    { c: [520, 420], r: 300, color: '#C9A273' },
    { c: [1040, 300], r: 240, color: '#B98B5A' },
  ],
  neutral: [
    { c: [600, 300], r: 260, color: '#8E8A86' },
    { c: [1100, 520], r: 200, color: '#7D7975' },
  ],
}

/**
 * Map = base image + separate data layer (rule 11). No filter ever touches the data;
 * in Archive only the base map is slightly desaturated.
 */
export function MapView({ mode, ramp, intensity, labels, pin, zoom = 1 }: MapViewProps) {
  const k = intensity ?? 0
  return (
    <div className={styles.viewport} data-mode={mode}>
      <div className={styles.frame} style={{ '--zoom': zoom } as CSSProperties}>
        <img className={styles.base} src={`${import.meta.env.BASE_URL}basemap.svg`} alt="" draggable={false} />
        <div className={styles.lat} aria-hidden="true">
          {[
            ['40°N', 116],
            ['35°N', 332],
            ['30°N', 548],
            ['25°N', 764],
          ].map(([t, y]) => (
            <span key={t} style={at([10, Number(y) - 9])}>
              {t}
            </span>
          ))}
        </div>

        <svg className={styles.data} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" style={{ opacity: intensity === null ? 0 : 0.35 + 0.65 * k }}>
          <defs>
            {blobs[ramp].map((b, i) => (
              <radialGradient key={i} id={`blob-${ramp}-${i}`}>
                <stop offset="0" stopColor={b.color} stopOpacity="0.85" />
                <stop offset="0.55" stopColor={b.color} stopOpacity="0.38" />
                <stop offset="1" stopColor={b.color} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>
          {blobs[ramp].map((b, i) => (
            <circle key={i} className={styles.blob} cx={b.c[0]} cy={b.c[1]} r={b.r * (0.75 + 0.5 * k)} fill={`url(#blob-${ramp}-${i})`} />
          ))}
        </svg>

        {labels.map((l, i) => (
          <span key={i} className={styles.label} style={at(l.pos)}>
            <ValueLabel value={l.value} unit={l.unit} />
          </span>
        ))}

        <span className={styles.pin} style={at(pin.pos)}>
          <MapPin label={pin.label} />
        </span>
      </div>
    </div>
  )
}
