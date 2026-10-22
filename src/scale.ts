import type { Ramp } from './data'

// Data classes: every value falls in one of five bands, drawn with the colour family's tokens
// --data-<ramp>-1 … -5 (light to dark). Map field, value labels and the Readout legend use the same bands,
// so a colour always means the same amount.

export const CLASSES = 5

/**
 * Upper bounds of classes 1–4 (class 5 is everything above). Precipitation is skewed (most values are small):
 * 5 / 25 / 50 / 100 % of the scale, i.e. 1 / 5 / 10 / 20 mm for rain. Other quantities: equal steps.
 * Percentages stop at 100, so their top class starts at 75.
 */
export function breaksOf(max: number, unit: string, patchy: boolean): number[] {
  const steps = patchy ? (unit === '%' ? [0.05, 0.25, 0.5, 0.75] : [0.05, 0.25, 0.5, 1]) : [0.2, 0.4, 0.6, 0.8]
  return steps.map((f) => {
    const b = max * f
    return b >= 10 ? Math.round(b) : Number(b.toFixed(1))
  })
}

/** Class index 0–4 of a value; -1 when there is nothing to draw (no data, or 0 for precipitation). */
export function classOf(value: number | null, breaks: number[], patchy: boolean): number {
  if (value === null || (patchy && value <= 0)) return -1
  const k = breaks.findIndex((b) => value <= b)
  return k === -1 ? CLASSES - 1 : k
}

/** Position 0–1 of a value on the legend: five equal segments, linear inside each. */
export function legendPos(value: number, breaks: number[]): number {
  const k = classOf(value, breaks, false)
  const lo = k === 0 ? 0 : breaks[k - 1]
  const hi = k < CLASSES - 1 ? breaks[k] : breaks[k - 1] + (breaks[k - 1] - breaks[k - 2])
  return Math.min(1, (k + Math.max(0, Math.min(1, (value - lo) / (hi - lo)))) / CLASSES)
}

/** CSS custom property of a class colour. */
export const classVar = (ramp: Ramp, k: number) => `--data-${ramp}-${k + 1}`

/** Classes 4–5 are dark: their labels take white text (checked by npm run contrast). */
export const onDark = (k: number) => k >= 3
