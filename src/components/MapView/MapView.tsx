import { Map as MlMap, type ImageSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type Ref } from 'react'
import type { Ramp } from '../../data'
import { HOME, lngLat, STYLE, type Point } from '../../map/geo'
import type { Mode } from '../../types'
import { MapPin } from '../MapPin/MapPin'
import { ValueLabel } from '../ValueLabel/ValueLabel'
import styles from './MapView.module.css'

type StationValue = { name: string; pos: Point; value: number | null }

export type MapViewHandle = { zoomIn: () => void; zoomOut: () => void }

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
  /** The station network around the selected location. Positions in design-frame px (src/map/geo.ts). */
  stations: StationValue[]
  /** The selected location; its value feeds the field too. */
  pin: { pos: Point; label: string; value: number | null }
  /** Tells the zoom control whether it can still zoom in / out. */
  onZoomRange?: (canIn: boolean, canOut: boolean) => void
  ref?: Ref<MapViewHandle>
}

// The selected location never lands further left than in the design frame: there it is clear of the layer panel.
const PIN_MIN_X = 398

// ---- Field: interpolated from the stations (inverse distance weighting) on a coarse grid ----
// The grid is an image draped on the map between these design-frame px corners; MapLibre smooths it.
const AREA: [Point, Point] = [[-640, -420], [2080, 1260]]
const CELL = 16
const GX = (AREA[1][0] - AREA[0][0]) / CELL
const GY = (AREA[1][1] - AREA[0][1]) / CELL
const CORNERS = [AREA[0], [AREA[1][0], AREA[0][1]], AREA[1], [AREA[0][0], AREA[1][1]]].map((p) => lngLat(p as Point)) as [Point, Point, Point, Point]
const REACH = 220 // stations further than this from a grid point don't count
const FADE: Point = [90, 170] // the field fades out this far from the nearest station

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

function fieldImage(points: { pos: Point; value: number }[], ramp: Ramp, max: number, patchy: boolean): ImageData {
  const img = new ImageData(GX, GY)
  const [lo, hi] = scaleEnds[ramp].map(rgbaOf)
  for (let j = 0; j < GY; j++) {
    for (let i = 0; i < GX; i++) {
      const x = AREA[0][0] + (i + 0.5) * CELL
      const y = AREA[0][1] + (j + 0.5) * CELL
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
  return img
}

// ---- Labels: one per station with a value, strongest first, skipped when it would overlap ----
const LABEL_H = 19
const CHAR_W = 6.7 // Geist Mono 11px
const GAP = 3
const DOT_GAP = 5 // label bottom above the dot

type Rect = [number, number, number, number]
const overlaps = (a: Rect, b: Rect) => a[0] < b[2] + GAP && b[0] < a[2] + GAP && a[1] < b[3] + GAP && b[1] < a[3] + GAP

/** Indices of the stations whose label fits, given their screen positions. */
function placeLabels(stations: StationValue[], screen: Point[], unit: string, patchy: boolean, pin: Point): Set<number> {
  // The pin (about 60 × 70 px, tip at the location) is never covered.
  const taken: Rect[] = [[pin[0] - 32, pin[1] - 72, pin[0] + 32, pin[1]]]
  const shown = new Set<number>()
  const order = stations
    .map((s, i) => ({ i, v: s.value }))
    .filter((s): s is { i: number; v: number } => s.v !== null && (!patchy || s.v > 0))
    .sort((a, b) => b.v - a.v)
  for (const { i, v } of order) {
    const w = `${v} ${unit}`.length * CHAR_W + 14
    const [x, y] = screen[i]
    const r: Rect = [x - w / 2, y - DOT_GAP - LABEL_H, x + w / 2, y - DOT_GAP]
    if (taken.some((t) => overlaps(t, r))) continue
    taken.push(r)
    shown.add(i)
  }
  return shown
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Map = base map + separate data layer (rule 11). No filter ever touches the data.
 * The base is a real vector map (MapLibre + OpenFreeMap), with real pan and zoom.
 * Data layer, in three levels of reading: the field interpolated from all stations (coloured like the Readout
 * scale, drawn under the place names), a dot for every station, and a value label where it rains, decluttered
 * (zooming in reveals more). Hovering a dot or a label shows the station's name and value, zero included.
 */
export function MapView({ mode, ramp, max, unit, patchy, layerName, stations, pin, onZoomRange, ref }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const [ready, setReady] = useState(false)
  const [, setFrame] = useState(0) // re-render the overlay on every map move
  const [settled, setSettled] = useState(0) // re-run label placement when the map stops
  const [hover, setHover] = useState<number | null>(null)
  const onZoomRangeRef = useRef(onZoomRange)
  onZoomRangeRef.current = onZoomRange
  const pinPos = useRef(pin.pos)
  pinPos.current = pin.pos

  useLayoutEffect(() => {
    const map = new MlMap({
      container: containerRef.current!,
      style: STYLE,
      center: HOME.center,
      zoom: HOME.zoom,
      minZoom: HOME.zoom - 1.5,
      maxZoom: HOME.zoom + 3, // beyond this the station network is too sparse for the field
      // South-west and north-east corners: a margin of the design frame around the station network.
      maxBounds: [lngLat([-1100, 1540]), lngLat([2540, -700])],
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    })
    map.touchZoomRotate.disableRotation()
    mapRef.current = map

    // Until the user moves the map, keep the design framing: pan right if the pin would sit under the panel.
    let userMoved = false
    const frame = () => {
      if (userMoved) return
      map.jumpTo({ center: HOME.center, zoom: HOME.zoom })
      const x = map.project(lngLat(pinPos.current)).x
      if (x < PIN_MIN_X) map.panBy([x - PIN_MIN_X, 0], { animate: false })
    }
    const report = () => onZoomRangeRef.current?.(map.getZoom() < map.getMaxZoom() - 0.01, map.getZoom() > map.getMinZoom() + 0.01)
    map.on('dragstart', () => (userMoved = true))
    map.on('zoomstart', (e) => {
      if (e.originalEvent) userMoved = true
    })
    map.on('resize', frame)
    map.on('move', () => setFrame((n) => n + 1))
    map.on('moveend', () => setSettled((n) => n + 1))
    map.on('zoomend', report)
    map.on('load', () => {
      frame()
      report()
      // The field goes under the first label layer, so place names stay readable on top of the data.
      const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol')?.id
      map.addSource('field', { type: 'image', coordinates: CORNERS })
      map.addLayer({ id: 'field', type: 'raster', source: 'field', paint: { 'raster-fade-duration': 0, 'raster-resampling': 'linear' } }, firstSymbol)
      setReady(true)
    })
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // The zoom buttons zoom around the selected location, which stays where it is (the wheel zooms around the pointer).
  const zoomBy = (d: number) => {
    const map = mapRef.current
    if (!map) return
    const z = Math.min(map.getMaxZoom(), Math.max(map.getMinZoom(), Math.round(map.getZoom()) + d))
    map.zoomTo(z, { around: lngLat(pinPos.current), animate: !reducedMotion() })
  }
  useImperativeHandle(ref, () => ({ zoomIn: () => zoomBy(1), zoomOut: () => zoomBy(-1) }))

  const points = useMemo(
    () => [pin, ...stations].flatMap((s) => (s.value === null ? [] : [{ pos: s.pos, value: s.value }])),
    [pin, stations],
  )
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    ;(map.getSource('field') as ImageSource).updateImage({ image: fieldImage(points, ramp, max, patchy) })
    map.setPaintProperty('field', 'raster-opacity', patchy ? 0.9 : 0.55)
  }, [ready, points, ramp, max, patchy])

  // Overlay positions follow the map on every frame; label placement is redone when the map settles.
  const map = mapRef.current
  const project = (p: Point): Point => {
    if (!map) return [-100, -100]
    const { x, y } = map.project(lngLat(p))
    return [x, y]
  }
  const screen = stations.map((s) => project(s.pos))
  const pinAt = project(pin.pos)
  // Recomputed when the map settles (settled) or the data change, not on every frame.
  const labelled = useMemo(() => (ready ? placeLabels(stations, screen, unit, patchy, pinAt) : new Set<number>()), [ready, settled, stations, unit, patchy])
  const listed = stations.filter((s) => s.value !== null && (!patchy || s.value > 0)).sort((a, b) => b.value! - a.value!)
  const tip = hover === null ? null : stations[hover]
  const at = ([x, y]: Point) => ({ left: x, top: y })

  return (
    <div className={styles.viewport} data-mode={mode}>
      <div ref={containerRef} className={styles.map} />

      {ready && (
        <div className={styles.overlay} aria-hidden="true" onPointerLeave={() => setHover(null)}>
          {stations.map((s, i) => (
            <span key={s.name} className={styles.dot} style={at(screen[i])} onPointerEnter={() => setHover(i)} />
          ))}
          {stations.map((s, i) =>
            labelled.has(i) ? (
              <span key={s.name} className={styles.label} style={at(screen[i])} onPointerEnter={() => setHover(i)}>
                <ValueLabel value={s.value} unit={unit} />
              </span>
            ) : null,
          )}
          {tip && (
            <span className={styles.tip} style={at(screen[hover!])}>
              <span className={styles.tipName}>{tip.name}</span>
              <span className={styles.tipValue}>{tip.value === null ? 'No data' : `${tip.value} ${unit}`}</span>
            </span>
          )}
        </div>
      )}

      {ready && (
        <span className={styles.pin} style={at(pinAt)}>
          <MapPin label={pin.label} />
        </span>
      )}

      {/* Map data credits (ODbL and OpenMapTiles licences), required, one short line each. */}
      <p className={styles.attribution}>
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>
        <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
      </p>

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
