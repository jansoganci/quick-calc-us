/**
 * Pixel arithmetic for the two line charts. This is visual-only: it maps
 * engine values onto a viewBox and computes nothing financial.
 */

/**
 * `smPayback` is the payback chart's own mobile frame — the two mobile
 * charts keep different heights (200px / 180px), not one shared `sm` frame.
 * `print`/`printPayback` are sized to the ~704px page area the forced `lg`
 * breakpoint prints into, with a larger `labelSize` than `lg`'s own frame
 * would render at that scale.
 */
export type ChartSize = 'sm' | 'smPayback' | 'lg' | 'print' | 'printPayback'

export type ChartFrame = {
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
  labelSize: number
  axisGap: number
}

export const CHART_FRAMES: Record<ChartSize, ChartFrame> = {
  sm: { width: 354, height: 200, left: 30, right: 348, top: 20, bottom: 168, labelSize: 10, axisGap: 6 },
  smPayback: { width: 354, height: 180, left: 30, right: 348, top: 20, bottom: 148, labelSize: 10, axisGap: 6 },
  lg: { width: 1092, height: 292, left: 76, right: 1080, top: 20, bottom: 258, labelSize: 11, axisGap: 8 },
  print: { width: 704, height: 236, left: 68, right: 692, top: 16, bottom: 196, labelSize: 11, axisGap: 8 },
  printPayback: { width: 704, height: 212, left: 68, right: 692, top: 16, bottom: 172, labelSize: 11, axisGap: 8 },
}

export function makeScales(frame: ChartFrame, min: number, max: number, months: number) {
  const span = max - min
  const y = (value: number) => (span === 0 ? frame.bottom : frame.top + ((max - value) * (frame.bottom - frame.top)) / span)
  const x = (index: number) => (months <= 1 ? frame.left : frame.left + (index * (frame.right - frame.left)) / (months - 1))
  return { x, y }
}

export function polyline(values: readonly number[], x: (index: number) => number, y: (value: number) => number): string {
  return values.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ')
}

/** The last tick sits on the right edge, so it is anchored inwards or it clips. */
export function tickAnchor(index: number, months: number): 'start' | 'middle' | 'end' {
  if (index === months - 1) return 'end'
  if (index === 0) return 'start'
  return 'middle'
}

/**
 * Drops a y-axis label that would land on top of one already drawn — which
 * happens whenever the series minimum sits close to zero.
 */
export function spacedValues(values: readonly number[], y: (value: number) => number, minGap = 14): number[] {
  const kept: number[] = []
  for (const value of values) {
    if (kept.every((other) => Math.abs(y(other) - y(value)) >= minGap)) kept.push(value)
  }
  return kept
}

/** Month ticks that stay legible: first, last, and a few evenly spaced inside. */
export function monthTicks(months: number): number[] {
  const step = months >= 18 ? 6 : 3
  const ticks = new Set<number>([0, months - 1])
  for (let month = step; month < months - 1; month += step) ticks.add(month - 1)
  return [...ticks].sort((first, second) => first - second)
}
