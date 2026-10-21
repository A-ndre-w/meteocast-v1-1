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
  /** Top of the Readout scale: a value's colour on the map is its colour on that scale. */
  max: number
  labels: { pos: Point; value: number | null; unit: string }[]
  /** The selected location; its value draws a field too. */
  pin: { pos: Point; label: string; value: number | null }
  zoom?: number
}

const W = 1440
const H = 840
const at = ([x, y]: Point): CSSProperties => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` })
// The frame pans to keep the pin clear of the layer panel; the base image carries geo.bleed px of map on the left.
const frameStyle = (zoom: number, [x]: Point) => ({ '--zoom': zoom, '--focus-x': x / W, '--bleed': geo.bleed / W }) as CSSProperties

// Readout scale per colour family (Readout.module.css .bar): from the low end to the top.
const scaleEnds: Record<Ramp, [string, string]> = {
  rain: ['var(--data-rain-soft)', 'var(--data-rain)'],
  snow: ['var(--data-snow-soft)', 'var(--data-snow)'],
  temp: ['var(--data-temp-soft)', 'var(--data-temp)'],
  neutral: ['var(--surface-sunken)', 'var(--text-tertiary)'],
}

/** Colour of a value on the Readout scale (t = value / max, 0–1). */
const scaleColor = (ramp: Ramp, t: number) => `color-mix(in srgb, ${scaleEnds[ramp][1]} ${Math.round(t * 100)}%, ${scaleEnds[ramp][0]})`

/**
 * Map = base image + separate data layer (rule 11). No filter ever touches the data;
 * in Archive only the base map is slightly desaturated.
 * One field per value on the map (the pin and each label), centred on it, coloured like the value on the
 * Readout scale and larger when stronger: what the label says is what the colour shows.
 */
export function MapView({ mode, ramp, max, labels, pin, zoom = 1 }: MapViewProps) {
  const fields = [pin, ...labels].flatMap((p) => (p.value === null ? [] : [{ c: p.pos, t: Math.min(1, Math.max(0, p.value / max)) }]))
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
        <svg className={styles.data} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            {fields.map((b, i) => (
              <radialGradient key={i} id={`field-${i}`}>
                <stop offset="0" style={{ stopColor: scaleColor(ramp, b.t) }} />
                <stop offset="0.5" style={{ stopColor: scaleColor(ramp, b.t), stopOpacity: 0.6 }} />
                <stop offset="1" style={{ stopColor: scaleColor(ramp, b.t), stopOpacity: 0 }} />
              </radialGradient>
            ))}
          </defs>
          {fields.map((b, i) => (
            <circle key={i} className={styles.blob} cx={b.c[0]} cy={b.c[1]} r={80 + 90 * Math.sqrt(b.t)} fill={`url(#field-${i})`} />
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
