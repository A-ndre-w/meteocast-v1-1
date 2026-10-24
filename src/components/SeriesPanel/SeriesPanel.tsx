import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from 'react'
import { isPatchy, stationSeries, type Layer, type SeriesPoint } from '../../data'
import { Icon } from '../../icons/Icon'
import { breaksOf, classOf, classVar } from '../../scale'
import { dayWindow, fmtDayShort, fmtOffset, fmtTime, isSame, modeOf, NOW, shiftMinutes, snapTo, type TimeSel } from '../../time'
import { modeLabel } from '../../types'
import styles from './SeriesPanel.module.css'

type Range = { id: string; label: string; hours: number; dir: -1 | 1 }

/** Ranges around the selected time, in the timeline's relative notation (−24h, +5d). The prototype's data start
 *  two days back, so nothing reaches further into the past. */
const RANGES: Range[] = [
  { id: '-24h', label: '−24 h', hours: 24, dir: -1 },
  { id: '-48h', label: '−48 h', hours: 48, dir: -1 },
  { id: '+24h', label: '+24 h', hours: 24, dir: 1 },
  { id: '+48h', label: '+48 h', hours: 48, dir: 1 },
  { id: '+5d', label: '+5 days', hours: 120, dir: 1 },
]

/** Totals make sense for amounts (rain, snowfall, strikes); levels and rates get min / max / mean. */
const isAmount = (layer: Layer) => ['mm', 'strikes'].includes(layer.unit)

const fmtPoint = (p: SeriesPoint, daily: boolean) => (daily ? fmtDayShort(p.sel.day) : `${fmtDayShort(p.sel.day)}, ${fmtTime(p.sel)}`)
const round = (v: number, d = 1) => Number(v.toFixed(d))

/** A round top for the y axis: 1, 2, 2.5, 5 × 10^k. */
function niceMax(v: number) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10) * p
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export type SeriesPanelProps = {
  layer: Layer
  /** Station on the map; null = nothing pinned. */
  station: string | null
  /** The timeline's instant: the ranges are counted from here, and its bar is outlined. */
  sel: TimeSel
  /** A bar or a row was picked: move the timeline there. */
  onPick?: (sel: TimeSel) => void
  onClose?: () => void
}

/**
 * The selected station's data over a time range, as a chart or a table (designer, 2026-10-24: "rain at Belluno in
 * the last 24 hours, hour by hour"). Bars for amounts that come in patches (rain, snow), a line for continuous
 * quantities; class colours as on the map; forecast lighter, after NOW. A bar or a row moves the timeline there.
 * Download as CSV. The original platform's TABLE button and start / end dates, in one place.
 */
export function SeriesPanel({ layer, station, sel, onPick, onClose }: SeriesPanelProps) {
  const titleId = useId()
  const [rangeId, setRangeId] = useState('-24h')
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const daily = layer.interval === 'day'
  const range = RANGES.find((r) => r.id === rangeId)!
  const patchy = isPatchy(layer)
  const breaks = useMemo(() => breaksOf(layer.scale.max, layer.unit, patchy), [layer, patchy])

  // Hourly points (daily data: one per day of the timeline). 5-minute data are shown hour by hour.
  const points = useMemo(() => {
    if (!station) return []
    if (daily) {
      const days = dayWindow()
      return stationSeries(layer, station, { day: days[0].day, hour: NOW.hour }, days.length, 1440)
    }
    const at = snapTo(sel, 60)
    const from = range.dir < 0 ? shiftMinutes(at, -(range.hours - 1) * 60) : at
    return stationSeries(layer, station, from, range.hours, 60)
  }, [layer, station, sel, range, daily])

  const values = points.map((p) => p.value).filter((v): v is number => v !== null)
  const max = values.length ? points.reduce((a, b) => ((b.value ?? -Infinity) > (a.value ?? -Infinity) ? b : a)) : undefined
  const summary = !values.length
    ? 'No data in this range'
    : isAmount(layer)
      ? `Total ${round(values.reduce((a, b) => a + b, 0))} ${layer.unit} · max ${max!.value} ${layer.unit} at ${fmtPoint(max!, daily)}`
      : `Min ${Math.min(...values)} · max ${Math.max(...values)} · mean ${round(values.reduce((a, b) => a + b, 0) / values.length)} ${layer.unit}`

  const download = () => {
    const rows = points.map((p) => [`${p.sel.day} ${fmtTime(p.sel)}`, p.value ?? '', layer.unit, modeLabel[modeOf(p.sel)], p.layer?.source ?? ''])
    const csv = [['time', 'value', 'unit', 'mode', 'source'], ...rows].map((r) => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `${station}-${layer.name}-${points[0]?.sel.day ?? ''}.csv`.replace(/[^\w.-]+/g, '-').toLowerCase()
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <section
      className={styles.root}
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.()
      }}
    >
      <div className={styles.head}>
        <h2 id={titleId} className={styles.title}>
          {station ?? 'No station'} <span className={styles.what}>· {layer.name} · {layer.unit}</span>
        </h2>
        <div className={styles.tools}>
          <div className={styles.segmented} role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'chart'} onClick={() => setView('chart')}>
              <Icon name="chart" size={16} aria-hidden="true" />
              Chart
            </button>
            <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>
              <Icon name="table" size={16} aria-hidden="true" />
              Table
            </button>
          </div>
          <button type="button" className={styles.icon} aria-label="Download CSV" title="Download CSV" disabled={!points.length} onClick={download}>
            <Icon name="download" size={16} />
          </button>
          <button type="button" className={styles.icon} aria-label="Close chart and table" title="Close" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>

      {station ? (
        <>
          <div className={styles.bar}>
            {daily ? (
              <span className={styles.rangeNote}>Every day of the timeline</span>
            ) : (
              <div className={styles.ranges} role="group" aria-label={`Range from ${fmtDayShort(sel.day)}, ${fmtTime(snapTo(sel, 60))}`}>
                {RANGES.map((r) => (
                  <button key={r.id} type="button" className={styles.range} aria-pressed={r.id === rangeId} onClick={() => setRangeId(r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}
            <p className={styles.summary}>{summary}</p>
          </div>
          {view === 'chart' ? (
            <SeriesChart points={points} layer={layer} breaks={breaks} patchy={patchy} sel={sel} daily={daily} summary={summary} onPick={onPick} />
          ) : (
            <SeriesTable points={points} layer={layer} sel={sel} daily={daily} onPick={onPick} />
          )}
        </>
      ) : (
        <p className={styles.empty}>Click a station on the map to see its data over time.</p>
      )}
    </section>
  )
}

type ChartProps = {
  points: SeriesPoint[]
  layer: Layer
  breaks: number[]
  patchy: boolean
  sel: TimeSel
  daily: boolean
  summary: string
  onPick?: (sel: TimeSel) => void
}

const H = 150
const PAD = { left: 40, right: 10, top: 18, bottom: 22 }

function SeriesChart({ points, layer, breaks, patchy, sel, daily, summary, onPick }: ChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const n = points.length
  const values = points.map((p) => p.value).filter((v): v is number => v !== null)
  // Bars for amounts that come in patches, from 0; a line for continuous quantities, on round steps around the data.
  const bars = patchy
  const lo = values.length ? Math.min(...values) : 0
  const hi = values.length ? Math.max(...values) : 1
  const step = bars ? (layer.unit === '%' ? 25 : niceMax(Math.max(breaks[0], hi)) / 4) : niceMax((hi - lo) / 4 || 1)
  const bottom = bars ? 0 : Math.floor(lo / step) * step
  const ticks = Math.max(2, Math.ceil((hi - bottom) / step))
  const top = bars ? step * 4 : bottom + step * ticks
  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const band = n ? plotW / n : 0
  const x = (i: number) => PAD.left + band * (i + 0.5)
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - (v - bottom) / (top - bottom || 1))
  const at = snapTo(sel, daily ? 1440 : 60)
  const selIndex = points.findIndex((p) => (daily ? p.sel.day === sel.day : isSame(p.sel, at)))
  const nowIndex = points.findIndex((p) => (daily ? p.sel.day === NOW.day : isSame(p.sel, NOW)))
  const stride = daily ? 1 : n <= 24 ? 3 : n <= 48 ? 6 : 24
  const grid = Array.from({ length: Math.round((top - bottom) / step) + 1 }, (_, k) => bottom + step * k)
  const fmtTick = (v: number) => (v >= 100 ? Math.round(v) : Number(v.toFixed(1)))

  const indexAt = (e: MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.floor((e.clientX - r.left - PAD.left) / band)
    return i >= 0 && i < n ? i : null
  }
  const line = points
    .map((p, i) => (p.value === null ? null : `${x(i)},${y(p.value)}`))
    .reduce<string[][]>((segs, pt) => {
      if (pt === null) segs.push([])
      else segs[segs.length - 1].push(pt)
      return segs
    }, [[]])
    .filter((s) => s.length)
  const hovered = hover !== null ? points[hover] : null

  return (
    <div className={styles.chart} ref={ref}>
      {width > 0 && (
        <svg
          width={width}
          height={H}
          role="img"
          aria-label={`${layer.name}, ${n} ${daily ? 'days' : 'hours'}. ${summary}. The table view lists every value.`}
          onMouseMove={(e) => setHover(indexAt(e))}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => {
            const i = indexAt(e)
            if (i !== null && points[i].layer) onPick?.(points[i].sel)
          }}
        >
          {grid.map((v) => (
            <g key={v}>
              <line className={styles.grid} x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} />
              <text className={styles.yTick} x={PAD.left - 6} y={y(v)} dy="0.32em">
                {fmtTick(v)}
              </text>
            </g>
          ))}
          {/* Forecast: lighter, after NOW. */}
          {nowIndex >= 0 && nowIndex < n - 1 && (
            <rect className={styles.forecastBand} x={x(nowIndex) + band / 2} y={PAD.top} width={width - PAD.right - x(nowIndex) - band / 2} height={H - PAD.top - PAD.bottom} />
          )}
          {bars
            ? points.map((p, i) => {
                if (p.value === null) return null
                const k = classOf(p.value, breaks, patchy)
                const w = Math.max(2, band * 0.7)
                return (
                  <rect
                    key={i}
                    className={styles.barRect}
                    data-forecast={modeOf(p.sel) === 'forecast' || undefined}
                    data-selected={i === selIndex || undefined}
                    data-hover={i === hover || undefined}
                    x={x(i) - w / 2}
                    y={y(p.value)}
                    width={w}
                    height={Math.max(0, y(bottom) - y(p.value))}
                    rx={Math.min(2, w / 4)}
                    style={{ fill: k < 0 ? 'var(--border-strong)' : `var(${classVar(layer.scale.ramp, k)})` }}
                  />
                )
              })
            : line.map((seg, s) => <polyline key={s} className={styles.line} points={seg.join(' ')} />)}
          {!bars &&
            points.map((p, i) =>
              p.value === null || (i !== selIndex && i !== hover) ? null : (
                <circle key={i} className={styles.dot} data-selected={i === selIndex || undefined} cx={x(i)} cy={y(p.value)} r={i === selIndex ? 4.5 : 3.5} />
              ),
            )}
          {nowIndex >= 0 && (
            <g>
              <line className={styles.now} x1={x(nowIndex)} x2={x(nowIndex)} y1={PAD.top - 4} y2={H - PAD.bottom} />
              <text className={styles.nowTag} x={x(nowIndex)} y={PAD.top - 7}>
                NOW
              </text>
            </g>
          )}
          {points.map((p, i) =>
            (daily || (p.sel.hour % stride === 0 && (stride < 24 || p.sel.hour === 0))) && i < n ? (
              <text key={i} className={styles.xTick} x={x(i)} y={H - 6}>
                {daily || stride === 24 ? fmtDayShort(p.sel.day) : fmtTime(p.sel)}
              </text>
            ) : null,
          )}
        </svg>
      )}
      {hovered && hover !== null && (
        <div className={styles.tip} style={{ left: Math.min(Math.max(x(hover), 70), width - 70), top: hovered.value === null ? PAD.top : y(hovered.value) - 8 }}>
          {fmtPoint(hovered, daily)} · {hovered.value === null ? 'no data' : `${hovered.value} ${layer.unit}`}
        </div>
      )}
    </div>
  )
}

type TableProps = { points: SeriesPoint[]; layer: Layer; sel: TimeSel; daily: boolean; onPick?: (sel: TimeSel) => void }

function SeriesTable({ points, layer, sel, daily, onPick }: TableProps) {
  const at = snapTo(sel, daily ? 1440 : 60)
  const wrapRef = useRef<HTMLDivElement>(null)
  // The selected hour's row in view, as the selected bar is in the chart.
  useEffect(() => {
    const row = wrapRef.current?.querySelector<HTMLElement>('tr[data-selected]')
    const wrap = wrapRef.current
    if (row && wrap) wrap.scrollTop = row.offsetTop - wrap.clientHeight / 2
  }, [sel, points])
  return (
    <div className={styles.tableWrap} ref={wrapRef}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{daily ? 'Day' : 'Time'}</th>
            <th scope="col">
              {layer.name} ({layer.unit})
            </th>
            <th scope="col">Mode</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => {
            const selected = daily ? p.sel.day === sel.day : isSame(p.sel, at)
            const mode = modeOf(p.sel)
            return (
              <tr key={`${p.sel.day}-${p.sel.hour}`} data-selected={selected || undefined} data-forecast={mode === 'forecast' || undefined}>
                <th scope="row">
                  <button type="button" className={styles.rowPick} aria-current={selected ? 'time' : undefined} disabled={!p.layer} onClick={() => onPick?.(p.sel)}>
                    {fmtPoint(p, daily)}
                  </button>
                </th>
                <td className={styles.num}>{p.value === null ? '—' : p.value}</td>
                <td data-mode={mode} className={styles.mode}>
                  {modeLabel[mode]}
                  {mode !== 'live' && <span className={styles.offset}> {fmtOffset(p.sel)}</span>}
                </td>
                <td className={styles.source}>{p.layer?.source ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
