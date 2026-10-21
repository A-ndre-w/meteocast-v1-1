import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Ramp } from '../../data'
import geo from '../../data/geo.json'
import type { Mode } from '../../types'
import { MapPin } from '../MapPin/MapPin'
import { ValueLabel } from '../ValueLabel/ValueLabel'
import styles from './MapView.module.css'

type Point = [number, number]
type StationValue = { name: string; pos: Point; value: number | null }

export type MapViewProps = {
  mode: Mode
  /** Colour family of the data layer. */
  ramp: Ramp
  /** Top of the Readout scale: a value's colour on the map is its colour on that scale. */
  max: number
  unit: string
  /** Precipitation: stations reading 0 get no label and no colour. */
  patchy: boolean
  /** Name of the data shown, for the screen-reader list of station values. */
  layerName: string
  /** The station network around the selected location. */
  stations: StationValue[]
  /** The selected location; its value feeds the field too. */
  pin: { pos: Point; label: string; value: number | null }
  zoom?: number
}

const W = 1440
const H = 840
const at = ([x, y]: Point): CSSProperties => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` })
// The frame pans to keep the pin clear of the layer panel; the base image carries geo.bleed px of map on the left.
const frameStyle = (zoom: number, [x]: Point) => ({ '--zoom': zoom, '--focus-x': x / W, '--bleed': geo.bleed / W }) as CSSProperties

// ---- Field: interpolated from the stations (inverse distance weighting) on a coarse grid ----
// The grid covers the frame plus the bleed; the browser smooths it when stretching the canvas.
const CELL = 12
const GX = (W + geo.bleed) / CELL
const GY = H / CELL
const REACH = 220 // stations further than this from a grid point don't count
const FADE: [number, number] = [90, 170] // the field fades out this far from the nearest station

// Readout scale per colour family (Readout.module.css .bar): from the low end to the top.
const scaleEnds: Record<Ramp, [string, string]> = {
  rain: ['--data-rain-soft', '--data-rain'],
  snow: ['--data-snow-soft', '--data-snow'],
  temp: ['--data-temp-soft', '--data-temp'],
  neutral: ['--surface-sunken', '--text-tertiary'],
}

/** RGBA of a colour token, resolved through a 1px canvas so any CSS colour format works. */
function rgbaOf(token: string): [number, number, number, number] {
  const css = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b, a]
}

function drawField(canvas: HTMLCanvasElement, points: { pos: Point; value: number }[], ramp: Ramp, max: number, patchy: boolean) {
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(GX, GY)
  const [lo, hi] = scaleEnds[ramp].map(rgbaOf)
  for (let j = 0; j < GY; j++) {
    for (let i = 0; i < GX; i++) {
      const x = -geo.bleed + (i + 0.5) * CELL
      const y = (j + 0.5) * CELL
      let sw = 0
      let sv = 0
      let nearest = Infinity
      for (const p of points) {
        const d2 = (p.pos[0] - x) ** 2 + (p.pos[1] - y) ** 2
        nearest = Math.min(nearest, d2)
        if (d2 > REACH * REACH) continue
        const w = 1 / Math.max(d2, 1) ** 1.5 // power 3: each station dominates its surroundings, dry areas stay dry
        sw += w
        sv += w * p.value
      }
      if (sw === 0) continue
      const v = sv / sw
      if (patchy && v < max * 0.02) continue
      const t = Math.min(1, v / max)
      const fade = Math.min(1, Math.max(0, (FADE[1] - Math.sqrt(nearest)) / (FADE[1] - FADE[0])))
      const o = (j * GX + i) * 4
      for (let c = 0; c < 3; c++) img.data[o + c] = lo[c] + (hi[c] - lo[c]) * t
      img.data[o + 3] = (lo[3] + (hi[3] - lo[3]) * t) * fade
    }
  }
  ctx.putImageData(img, 0, 0)
}

// ---- Labels: one per station with a value, strongest first, skipped when it would overlap ----
const LABEL_H = 19
const CHAR_W = 6.7 // Geist Mono 11px
const GAP = 3
const DOT_GAP = 5 // label bottom above the dot

type Rect = [number, number, number, number]
const overlaps = (a: Rect, b: Rect) => a[0] < b[2] + GAP && b[0] < a[2] + GAP && a[1] < b[3] + GAP && b[1] < a[3] + GAP

/** Indices of the stations whose label fits, at k screen px per frame px. */
function placeLabels(stations: StationValue[], unit: string, patchy: boolean, pin: Point, k: number): Set<number> {
  // The pin (about 60 × 70 px, tip at the location) is never covered.
  const taken: Rect[] = [[pin[0] * k - 32, pin[1] * k - 72, pin[0] * k + 32, pin[1] * k]]
  const shown = new Set<number>()
  const order = stations
    .map((s, i) => ({ i, v: s.value }))
    .filter((s): s is { i: number; v: number } => s.v !== null && (!patchy || s.v > 0))
    .sort((a, b) => b.v - a.v)
  for (const { i, v } of order) {
    const w = `${v} ${unit}`.length * CHAR_W + 14
    const [x, y] = stations[i].pos
    const r: Rect = [x * k - w / 2, y * k - DOT_GAP - LABEL_H, x * k + w / 2, y * k - DOT_GAP]
    if (taken.some((t) => overlaps(t, r))) continue
    taken.push(r)
    shown.add(i)
  }
  return shown
}

/**
 * Map = base image + separate data layer (rule 11). No filter ever touches the data;
 * in Archive only the base map is slightly desaturated.
 * Data layer, in three levels of reading: the field interpolated from all stations (coloured like the Readout
 * scale), a dot for every station, and a value label where it rains, decluttered. Hovering a dot or a label
 * shows the station's name and value, zero included.
 */
export function MapView({ mode, ramp, max, unit, patchy, layerName, stations, pin, zoom = 1 }: MapViewProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [frameW, setFrameW] = useState(W)
  const [hover, setHover] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = frameRef.current!
    const ro = new ResizeObserver(() => setFrameW(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const points = useMemo(
    () => [pin, ...stations].flatMap((s) => (s.value === null ? [] : [{ pos: s.pos, value: s.value }])),
    [pin, stations],
  )
  useEffect(() => drawField(canvasRef.current!, points, ramp, max, patchy), [points, ramp, max, patchy])

  const k = (frameW / W) * zoom
  const labelled = useMemo(() => placeLabels(stations, unit, patchy, pin.pos, k), [stations, unit, patchy, pin.pos, k])
  const listed = stations.filter((s) => s.value !== null && (!patchy || s.value > 0)).sort((a, b) => b.value! - a.value!)
  const tip = hover === null ? null : stations[hover]

  return (
    <div className={styles.viewport} data-mode={mode}>
      <a className={styles.attribution} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
        {/* "© OpenStreetMap" / "contributors" */}
        <span>{geo.attribution.split(' ').slice(0, -1).join(' ')}</span>
        <span>{geo.attribution.split(' ').at(-1)}</span>
      </a>
      <div ref={frameRef} className={styles.frame} style={frameStyle(zoom, pin.pos)}>
        {/* Real map (OpenStreetMap, muted) of the original product's area: Trentino – Veneto, zoom 9. */}
        <img className={styles.base} src={`${import.meta.env.BASE_URL}basemap.webp`} alt="" draggable={false} />
        <canvas ref={canvasRef} className={styles.field} data-patchy={patchy} width={GX} height={GY} aria-hidden="true" />

        <div aria-hidden="true" onPointerLeave={() => setHover(null)}>
          {stations.map((s, i) => (
            <span key={s.name} className={styles.dot} style={at(s.pos)} onPointerEnter={() => setHover(i)} />
          ))}
          {stations.map((s, i) =>
            labelled.has(i) ? (
              <span key={s.name} className={styles.label} style={at(s.pos)} onPointerEnter={() => setHover(i)}>
                <ValueLabel value={s.value} unit={unit} />
              </span>
            ) : null,
          )}
        </div>

        <span className={styles.pin} style={at(pin.pos)}>
          <MapPin label={pin.label} />
        </span>

        {tip && (
          <span className={styles.tip} style={at(tip.pos)} aria-hidden="true">
            <span className={styles.tipName}>{tip.name}</span>
            <span className={styles.tipValue}>{tip.value === null ? 'No data' : `${tip.value} ${unit}`}</span>
          </span>
        )}
      </div>

      {/* The same values for screen readers: stations with data, strongest first. */}
      <ul className="visually-hidden" aria-label={`${layerName} at nearby stations`}>
        {listed.map((s) => (
          <li key={s.name}>
            {s.name}: {s.value} {unit}
          </li>
        ))}
      </ul>
    </div>
  )
}
