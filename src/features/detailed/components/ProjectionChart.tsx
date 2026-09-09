import { formatUsd } from '../../../lib/money.ts'
import type { ProjectionData } from '../resultView.ts'
import { CHART_FRAMES, makeScales, monthTicks, polyline, spacedValues, tickAnchor, type ChartSize } from './chartGeometry.ts'

/**
 * The one chart that earns its place on shape alone: ramp-up makes the first
 * months materially different from the stabilized month, and "it loses
 * money for a while, then turns" is a line, not a column of numbers. Base is
 * the only emphasized series.
 */
export function ProjectionChart({ data, size }: { data: ProjectionData; size: ChartSize }) {
  const frame = CHART_FRAMES[size]
  const { x, y } = makeScales(frame, data.min, data.max, data.months)
  const base = data.series.find((series) => series.key === 'base')
  const others = data.series.filter((series) => series.key !== 'base')
  const lastIndex = data.months - 1

  return (
    <svg viewBox={`0 0 ${frame.width} ${frame.height}`} className="block h-auto w-full" role="img" aria-label="Monthly operating result projection — bad, base and good scenarios">
      <line x1={frame.left} y1={y(0)} x2={frame.right} y2={y(0)} stroke="#C3C8CE" strokeWidth="1" />

      {others.map((series) => (
        <polyline key={series.key} points={polyline(series.values, x, y)} fill="none" stroke="#A8AEB6" strokeWidth="1.5" />
      ))}
      {base ? <polyline points={polyline(base.values, x, y)} fill="none" stroke="#1D3A5F" strokeWidth="2.25" /> : null}

      {data.series.map((series) => {
        const value = series.values[lastIndex]
        if (value === undefined) return null
        const isBase = series.key === 'base'
        return (
          <text
            key={`label-${series.key}`}
            x={frame.right}
            y={y(value) - frame.axisGap}
            textAnchor="end"
            fontFamily="IBM Plex Sans, sans-serif"
            fontSize={frame.labelSize + 1}
            fontWeight={isBase ? 600 : 400}
            fill={isBase ? '#1D3A5F' : '#8A9199'}
          >
            {series.label}
          </text>
        )
      })}

      {spacedValues([0, data.max, data.min], y).map((value, index) => (
        <text key={`y-${index}`} x={frame.left - frame.axisGap} y={y(value) + 4} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize={frame.labelSize} fill="#8A9199">
          {formatUsd(value)}
        </text>
      ))}

      {monthTicks(data.months).map((month) => (
        <text key={`x-${month}`} x={x(month)} y={frame.height - 4} textAnchor={tickAnchor(month, data.months)} fontFamily="IBM Plex Mono, monospace" fontSize={frame.labelSize} fill="#8A9199">
          {month === data.months - 1 ? `Mo. ${month + 1}` : month + 1}
        </text>
      ))}
    </svg>
  )
}
