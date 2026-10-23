import { Map as MlMap, type FilterSpecification, type GeoJSONSource, type ImageSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import type { Ramp } from '../../data'
import { HOME, lngLat, STYLE, type Point } from '../../map/geo'
import { classOf, classVar, CLASSES } from '../../scale'
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
  /** Class bounds (src/scale.ts), the same as the legend: a colour always means the same amount. */
  breaks: number[]
  unit: string
  /** Precipitation: stations reading 0 get no label and no colour. */
  patchy: boolean
  /** Name of the data shown, for the stations' accessible names. */
  layerName: string
  /** Every station, the selected one included. Positions in design-frame px (src/map/geo.ts). */
  stations: StationValue[]
  /** Name of the selected station: the pin and the card stand on it. */
  selected: string
  /** A click (or Enter) on a station selects it and opens its card; on the selected one, reopens the card. */
  onSelect: (name: string) => void
  /** The card of the selected point, given whether it is docked (point off screen) and how to bring the point back. */
  card?: (docked: boolean, locate: () => void) => ReactNode
  cardOpen?: boolean
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

/** RGBA of a colour token, resolved through a 1px canvas so any CSS colour format works. */
function rgbaOf(token: string): [number, number, number, number] {
  const css = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b, a]
}

const UP = 8 // classes are drawn on a grid 8× finer than the interpolation (2 px): bands with clean edges
const EDGE = 0.82 // a class edge is drawn slightly darker, like the isolines of a weather map

function fieldImage(points: { pos: Point; value: number }[], ramp: Ramp, breaks: number[], patchy: boolean): ImageData {
  // 1. Interpolated value and fade on the coarse grid.
  const val = new Float32Array(GX * GY)
  const fade = new Float32Array(GX * GY)
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
      val[j * GX + i] = sw === 0 ? 0 : sv / sw
      fade[j * GX + i] = Math.min(1, Math.max(0, (FADE[1] - Math.sqrt(nearest)) / (FADE[1] - FADE[0])))
    }
  }
  const at = (a: Float32Array, gx: number, gy: number) => {
    const x = Math.min(GX - 1, Math.max(0, gx))
    const y = Math.min(GY - 1, Math.max(0, gy))
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const x1 = Math.min(GX - 1, x0 + 1)
    const y1 = Math.min(GY - 1, y0 + 1)
    const tx = x - x0
    const ty = y - y0
    const top = a[y0 * GX + x0] * (1 - tx) + a[y0 * GX + x1] * tx
    const bottom = a[y1 * GX + x0] * (1 - tx) + a[y1 * GX + x1] * tx
    return top * (1 - ty) + bottom * ty
  }

  // 2. Class of every fine pixel (traces of precipitation are -1: not drawn).
  const FX = GX * UP
  const FY = GY * UP
  const cls = new Int8Array(FX * FY)
  const alpha = new Float32Array(FX * FY)
  for (let j = 0; j < FY; j++) {
    for (let i = 0; i < FX; i++) {
      const gx = (i + 0.5) / UP - 0.5
      const gy = (j + 0.5) / UP - 0.5
      const v = at(val, gx, gy)
      cls[j * FX + i] = classOf(v, breaks, patchy)
      alpha[j * FX + i] = at(fade, gx, gy)
    }
  }

  // 3. Colours, with the class edges a shade darker.
  const colors = Array.from({ length: CLASSES }, (_, k) => rgbaOf(classVar(ramp, k)))
  const img = new ImageData(FX, FY)
  for (let j = 0; j < FY; j++) {
    for (let i = 0; i < FX; i++) {
      const n = j * FX + i
      const k = cls[n]
      if (k < 0) continue
      const edge = (i + 1 < FX && cls[n + 1] !== k) || (j + 1 < FY && cls[n + FX] !== k)
      const c = colors[k]
      const o = n * 4
      for (let ch = 0; ch < 3; ch++) img.data[o + ch] = edge ? c[ch] * EDGE : c[ch]
      img.data[o + 3] = 255 * alpha[n]
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

/**
 * The interface floating over the map, in map px: the children of every element marked data-map-obstacle, or the
 * element itself when it has none (layer panel, Rail, Readout, timebar, search, zoom…). A label partly hidden
 * under them reads as a glitch.
 */
function obstacles(container: HTMLElement, exclude?: Element | null): Rect[] {
  const box = container.getBoundingClientRect()
  return [...document.querySelectorAll('[data-map-obstacle]')]
    .filter((el) => el !== exclude)
    .flatMap((el) => (el.children.length ? [...el.children] : [el]))
    .map((c) => c.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => [r.left - box.left, r.top - box.top, r.right - box.left, r.bottom - box.top])
}

/** Indices of the stations whose label fits, given their screen positions: whole, on screen, uncovered. */
function placeLabels(stations: StationValue[], screen: Point[], unit: string, breaks: number[], patchy: boolean, pin: Point, skip: number, container: HTMLElement): Set<number> {
  // The pin (about 60 × 70 px, tip at the location), the card by it and the interface are never covered.
  const taken: Rect[] = [[pin[0] - 32, pin[1] - 72, pin[0] + 32, pin[1]], ...obstacles(container)]
  const { clientWidth: vw, clientHeight: vh } = container
  const onScreen = (r: Rect) => r[0] >= GAP && r[1] >= GAP && r[2] <= vw - GAP && r[3] <= vh - GAP
  const shown = new Set<number>()
  const order = stations
    .map((s, i) => ({ i, v: s.value }))
    .filter((s): s is { i: number; v: number } => s.i !== skip && classOf(s.v, breaks, patchy) >= 0)
    .sort((a, b) => b.v - a.v)
  for (const { i, v } of order) {
    const w = `${v} ${unit}`.length * CHAR_W + 14
    const [x, y] = screen[i]
    const r: Rect = [x - w / 2, y - DOT_GAP - LABEL_H, x + w / 2, y - DOT_GAP]
    if (!onScreen(r) || taken.some((t) => overlaps(t, r))) continue
    taken.push(r)
    shown.add(i)
  }
  return shown
}

// ---- Card by the pin ----
const CARD_GAP = 8
type Side = 'right' | 'left' | 'above' | 'below'

/**
 * Where the card goes: beside the pin, on the first side where it is whole on screen and clear of the interface
 * (right, then left, above, below). Null = nowhere, or the pin itself is off screen or under a panel: the card docks.
 */
function placeCard(pin: Point, size: [number, number], vw: number, vh: number, blocked: Rect[]): { side: Side; at: Point } | null {
  const [x, y] = pin
  const [w, h] = size
  const head = y - 24 // centre of the pin's head
  const onScreen = (r: Rect) => r[0] >= CARD_GAP && r[1] >= CARD_GAP && r[2] <= vw - CARD_GAP && r[3] <= vh - CARD_GAP
  const pinBox: Rect = [x - 15, y - 38, x + 15, y]
  if (!onScreen(pinBox) || blocked.some((b) => overlaps(b, pinBox))) return null
  const candidates: { side: Side; at: Point }[] = [
    { side: 'right', at: [x + 24, head - h / 2] },
    { side: 'left', at: [x - 24 - w, head - h / 2] },
    { side: 'above', at: [x - w / 2, y - 48 - h] },
    { side: 'below', at: [x - w / 2, y + 12] },
  ]
  return (
    candidates.find(({ at: [l, t] }) => {
      const r: Rect = [l, t, l + w, t + h]
      return onScreen(r) && !blocked.some((b) => overlaps(b, r))
    }) ?? null
  )
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Map = base map + separate data layer (rule 11). No filter ever touches the data.
 * The base is a real vector map (MapLibre + OpenFreeMap), with real pan and zoom.
 * Data layer, in three levels of reading: the field interpolated from all stations (coloured like the Readout
 * scale, drawn under the place names), a dot for every station, and a value label where it rains, decluttered
 * (zooming in reveals more). Hovering a dot or a label shows the station's name and value, zero included.
 */
export function MapView({ mode, ramp, breaks, unit, patchy, layerName, stations, selected, onSelect, card, cardOpen = true, onZoomRange, ref }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const placeFilters = useRef(new Map<string, FilterSpecification | undefined>())
  const [ready, setReady] = useState(false)
  const [, setFrame] = useState(0) // re-render the overlay on every map move
  const [settled, setSettled] = useState(0) // re-run label placement when the map stops
  const [hover, setHover] = useState<number | null>(null)
  const [cardSize, setCardSize] = useState<[number, number]>([248, 120])
  const onZoomRangeRef = useRef(onZoomRange)
  onZoomRangeRef.current = onZoomRange

  const sel = Math.max(0, stations.findIndex((s) => s.name === selected))
  const pin = stations[sel]
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
    map.on('resize', () => {
      frame()
      setSettled((n) => n + 1)
    })
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
      // Invisible boxes where the value labels are, on top of every layer: they always take their place, so the
      // base map's place names that would end up under a label are not drawn (MapLibre's own label collision).
      map.addSource('label-boxes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'label-boxes',
        type: 'symbol',
        source: 'label-boxes',
        layout: {
          'text-field': ['get', 'text'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-anchor': 'bottom',
          'text-offset': [0, -0.5],
          'text-padding': 6,
          'text-allow-overlap': true,
          'text-ignore-placement': false,
        },
        paint: { 'text-opacity': 0 },
      })
      // The base map's place labels, with their own filters, so the selected place's name can be left out.
      for (const l of map.getStyle().layers) {
        if (l.type === 'symbol' && l['source-layer'] === 'place') placeFilters.current.set(l.id, l.filter)
      }
      setReady(true)
    })
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // The pin and its card already name the selected place: the base map doesn't write it a second time underneath.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    for (const [id, filter] of placeFilters.current) {
      const own = ['!=', ['get', 'name'], selected]
      map.setFilter(id, (filter ? ['all', filter, own] : own) as FilterSpecification)
    }
  }, [ready, selected])

  // The zoom buttons zoom around the selected point, which stays where it is (the wheel zooms around the pointer).
  const zoomBy = (d: number) => {
    const map = mapRef.current
    if (!map) return
    const z = Math.min(map.getMaxZoom(), Math.max(map.getMinZoom(), Math.round(map.getZoom()) + d))
    map.zoomTo(z, { around: lngLat(pinPos.current), animate: !reducedMotion() })
  }
  useImperativeHandle(ref, () => ({ zoomIn: () => zoomBy(1), zoomOut: () => zoomBy(-1) }))
  // Docked card: bring its point back into view, a little right of centre so the card fits beside it.
  const locate = () => mapRef.current?.easeTo({ center: lngLat(pinPos.current), offset: [-140, 40], animate: !reducedMotion() })

  const points = useMemo(() => stations.flatMap((s) => (s.value === null ? [] : [{ pos: s.pos, value: s.value }])), [stations])
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    ;(map.getSource('field') as ImageSource).updateImage({ image: fieldImage(points, ramp, breaks, patchy) })
    map.setPaintProperty('field', 'raster-opacity', patchy ? 0.8 : 0.5)
  }, [ready, points, ramp, breaks, patchy])

  // Overlay positions follow the map on every frame; label placement is redone when the map settles.
  const map = mapRef.current
  const project = (p: Point): Point => {
    if (!map) return [-100, -100]
    const { x, y } = map.project(lngLat(p))
    return [x, y]
  }
  const screen = stations.map((s) => project(s.pos))
  const pinAt = screen[sel]
  // Recomputed when the map settles (settled), the selection or the data change, not on every frame.
  const labelled = useMemo(
    () => (ready ? placeLabels(stations, screen, unit, breaks, patchy, pinAt, sel, containerRef.current!) : new Set<number>()),
    // screen and pinAt are read when the map settles, on purpose: placing labels on every frame would flicker.
    [ready, settled, stations, unit, breaks, patchy, sel, cardOpen],
  )
  useEffect(() => {
    const source = ready ? (mapRef.current?.getSource('label-boxes') as GeoJSONSource | undefined) : undefined
    source?.setData({
      type: 'FeatureCollection',
      features: [...labelled].map((i) => ({
        type: 'Feature',
        properties: { text: `${stations[i].value} ${unit}` },
        geometry: { type: 'Point', coordinates: lngLat(stations[i].pos) },
      })),
    })
  }, [ready, labelled, stations, unit])

  // The card: measured once rendered, then placed beside the pin on every frame, or docked at the top right.
  useLayoutEffect(() => {
    const el = cardRef.current?.firstElementChild as HTMLElement | null
    if (el && (el.offsetWidth !== cardSize[0] || el.offsetHeight !== cardSize[1])) setCardSize([el.offsetWidth, el.offsetHeight])
  })
  const container = containerRef.current
  const place =
    ready && container && cardOpen
      ? placeCard(pinAt, cardSize, container.clientWidth, container.clientHeight, obstacles(container, cardRef.current))
      : null
  const docked = cardOpen && place === null
  const legendBottom = (document.querySelector('[data-map-legend]')?.getBoundingClientRect().bottom ?? 160) - (container?.getBoundingClientRect().top ?? 0)
  // Labels avoid the card: place them again once the card has appeared, moved to another side or changed size.
  const cardKey = `${cardOpen}|${selected}|${place?.side ?? 'docked'}|${cardSize}`
  useEffect(() => setSettled((n) => n + 1), [cardKey])
  const cardStyle = place
    ? { left: place.at[0], top: place.at[1] }
    : { right: 28, top: legendBottom + 10 }

  // Stations as one keyboard stop: arrows walk them west to east, Enter selects (roving tabindex).
  const order = useMemo(() => stations.map((s, i) => ({ i, x: s.pos[0] })).sort((a, b) => a.x - b.x).map((o) => o.i), [stations])
  const [focusIndex, setFocusIndex] = useState(sel)
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([])
  const onDotKey = (e: KeyboardEvent, i: number) => {
    const k = order.indexOf(i)
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? order[(k + 1) % order.length]
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? order[(k - 1 + order.length) % order.length]
      : e.key === 'Home' ? order[0]
      : e.key === 'End' ? order[order.length - 1]
      : null
    if (next === null) return
    e.preventDefault()
    setFocusIndex(next)
    setHover(next)
    dotRefs.current[next]?.focus()
  }
  const valueText = (s: StationValue) => (s.value === null ? 'no data' : `${s.value} ${unit}`)
  const tip = hover === null || hover === sel ? null : stations[hover]
  const at = ([x, y]: Point) => ({ left: x, top: y })

  return (
    <div className={styles.viewport} data-mode={mode}>
      <div ref={containerRef} className={styles.map} />

      {ready && (
        <div className={styles.overlay} role="group" aria-label={`Stations, ${layerName}. Arrows move between them, Enter opens one`} onPointerLeave={() => setHover(null)}>
          {stations.map((s, i) => (
            <button
              key={s.name}
              ref={(el) => {
                dotRefs.current[i] = el
              }}
              type="button"
              className={styles.dot}
              data-selected={i === sel || undefined}
              style={at(screen[i])}
              tabIndex={i === focusIndex ? 0 : -1}
              aria-label={`${s.name}, ${valueText(s)}`}
              aria-pressed={i === sel}
              onPointerEnter={() => setHover(i)}
              onFocus={() => {
                setFocusIndex(i)
                setHover(i)
              }}
              onBlur={() => setHover(null)}
              onKeyDown={(e) => onDotKey(e, i)}
              onClick={() => onSelect(s.name)}
            />
          ))}
          {stations.map((s, i) =>
            labelled.has(i) ? (
              <span key={s.name} className={styles.label} style={at(screen[i])} aria-hidden="true" onPointerEnter={() => setHover(i)} onClick={() => onSelect(s.name)}>
                <ValueLabel value={s.value} unit={unit} ramp={ramp} level={classOf(s.value, breaks, patchy)} />
              </span>
            ) : null,
          )}
          {tip && (
            <span className={styles.tip} style={at(screen[hover!])} aria-hidden="true">
              <span className={styles.tipName}>{tip.name}</span>
              <span className={styles.tipValue}>{valueText(tip)}</span>
            </span>
          )}
        </div>
      )}

      {ready && (
        // The pin of the selected point; with the card closed it shows the name and a click opens the card again.
        <button
          type="button"
          className={styles.pin}
          style={at(pinAt)}
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => onSelect(pin.name)}
        >
          <MapPin label={cardOpen ? undefined : pin.name} />
        </button>
      )}

      {ready && cardOpen && card && (
        <div ref={cardRef} className={styles.card} data-side={place?.side ?? 'docked'} style={cardStyle} data-map-obstacle>
          {card(docked, locate)}
        </div>
      )}

      {/* Map data credits (ODbL and OpenMapTiles licences), required, one short line each. */}
      <p className={styles.attribution} data-map-obstacle>
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>
        <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
      </p>
    </div>
  )
}
