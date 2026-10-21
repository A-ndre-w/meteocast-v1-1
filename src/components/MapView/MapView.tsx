import type { CSSProperties } from 'react'
import type { Ramp } from '../../data'
import geo from '../../data/geo.json'
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
// The frame pans to keep the pin clear of the layer panel; the base image carries geo.bleed px of map on the left.
const frameStyle = (zoom: number, [x]: Point) => ({ '--zoom': zoom, '--focus-x': x / W, '--bleed': geo.bleed / W }) as CSSProperties

// Real places on the base map (scripts/build-basemap.mjs), in frame pixels.
const place = (name: keyof typeof geo.places, dx = 0, dy = 0): Point => [geo.places[name].px[0] + dx, geo.places[name].px[1] + dy]

// Blob fields per colour family, placed on real places. Rain echoes the original product screenshot:
// heavy cell over Belluno, showers over Trento, rain toward the plain (Vicenza, Pordenone).
const blobs: Record<Ramp, { c: Point; r: number; color: string }[]> = {
  rain: [
    { c: place('Trento', 30, -10), r: 120, color: '#5F9FD3' },
    { c: place('Belluno', 0, -10), r: 120, color: '#4C82D4' },
    { c: place('Treviso', 170, -90), r: 160, color: '#6FB9CD' },
    { c: place('Vicenza', -20, -10), r: 110, color: '#7FC2CC' },
  ],
  snow: [
    { c: place('Bolzano', 30, 10), r: 170, color: '#47DAFF' },
    { c: place('Cortina', 0, 20), r: 130, color: '#47DAFF' },
    { c: place('Trento', -90, -130), r: 110, color: '#7FE4FF' },
  ],
  temp: [
    { c: place('Feltre', -60, 30), r: 300, color: '#C9A273' },
    { c: place('Treviso', 240, -250), r: 240, color: '#B98B5A' },
  ],
  neutral: [
    { c: place('Feltre', -40, -120), r: 260, color: '#8E8A86' },
    { c: place('Treviso', 300, -80), r: 200, color: '#7D7975' },
  ],
}

// Snow reads as a faint veil in the Figma screens; rain is the strongest field.
const strength: Record<Ramp, number> = { rain: 1, snow: 0.45, temp: 0.6, neutral: 0.5 }

/**
 * Map = base image + separate data layer (rule 11). No filter ever touches the data;
 * in Archive only the base map is slightly desaturated.
 */
export function MapView({ mode, ramp, intensity, labels, pin, zoom = 1 }: MapViewProps) {
  const k = intensity ?? 0
  return (
    <div className={styles.viewport} data-mode={mode}>
      <a className={styles.attribution} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
        {/* "© OpenStreetMap" / "contributors" */}
        <span>{geo.attribution.split(' ').slice(0, -1).join(' ')}</span>
        <span>{geo.attribution.split(' ').at(-1)}</span>
      </a>
      <div className={styles.frame} style={frameStyle(zoom, pin.pos)}>
        {/* Real map (OpenStreetMap, muted) of the original product's area: Trentino – Veneto, zoom 9. */}
        <img className={styles.base} src={`${import.meta.env.BASE_URL}basemap.webp`} alt="" draggable={false} />
        <svg className={styles.data} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" style={{ opacity: intensity === null ? 0 : Math.min(1, 0.65 + 0.5 * k) }}>
          <defs>
            {blobs[ramp].map((b, i) => (
              <radialGradient key={i} id={`blob-${ramp}-${i}`}>
                <stop offset="0" stopColor={b.color} stopOpacity={0.85 * strength[ramp]} />
                <stop offset="0.55" stopColor={b.color} stopOpacity={0.38 * strength[ramp]} />
                <stop offset="1" stopColor={b.color} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>
          {blobs[ramp].map((b, i) => (
            <circle key={i} className={styles.blob} cx={b.c[0]} cy={b.c[1]} r={b.r * (0.9 + 0.5 * k)} fill={`url(#blob-${ramp}-${i})`} />
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
