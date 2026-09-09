import { formatUsd } from '../../../lib/money.ts'
import { COPY } from '../labels.ts'
import type { PaybackData } from '../resultView.ts'
import { CHART_FRAMES, makeScales, monthTicks, polyline, tickAnchor, type ChartSize } from './chartGeometry.ts'

/**
 * Payback is defined as a crossing, so it is drawn as one. When it never
 * crosses, the chart still shows how far short the horizon left it — which
 * the sentence "not reached" cannot say on its own.
 */
export function PaybackChart({ data, size }: { data: PaybackData; size: ChartSize }) {
  const frame = CHART_FRAMES[size]
  const { x, y } = makeScales(frame, data.min, data.max, data.months)
  const markerIndex = data.paybackMonth === null ? null : data.paybackMonth - 1
  const markerValue = markerIndex === null ? undefined : data.cumulative[markerIndex]

  return (
    <svg viewBox={`0 0 ${frame.width} ${frame.height}`} className="block h-auto w-full" role="img" aria-label="Cumulative operating result and the initial investment line">
      <line x1={frame.left} y1={y(0)} x2={frame.right} y2={y(0)} stroke="#C3C8CE" strokeWidth="1" />
      <line x1={frame.left} y1={y(data.target)} x2={frame.right} y2={y(data.target)} stroke="#D6D9DD" strokeWidth="1" strokeDasharray="4 4" />
      <text x={frame.left} y={y(data.target) - frame.axisGap} fontFamily="IBM Plex Sans, sans-serif" fontSize={frame.labelSize + 1} fill="#8A9199">
        {`${COPY.totalInitialInvestment} ${formatUsd(data.target)}`}
      </text>

      <polyline points={polyline(data.cumulative, x, y)} fill="none" stroke="#1D3A5F" strokeWidth="2.25" />

      {markerIndex !== null && markerValue !== undefined ? (
        <>
          <circle cx={x(markerIndex)} cy={y(markerValue)} r="4" fill="#1D3A5F" />
          <text x={x(markerIndex)} y={y(markerValue) - frame.axisGap - 4} textAnchor="middle" fontFamily="IBM Plex Sans, sans-serif" fontSize={frame.labelSize + 1} fontWeight={600} fill="#1D3A5F">
            {`Month ${data.paybackMonth}`}
          </text>
        </>
      ) : null}

      <text x={frame.left - frame.axisGap} y={y(0) + 4} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize={frame.labelSize} fill="#8A9199">
        $0
      </text>

      {monthTicks(data.months).map((month) => (
        <text key={`x-${month}`} x={x(month)} y={frame.height - 4} textAnchor={tickAnchor(month, data.months)} fontFamily="IBM Plex Mono, monospace" fontSize={frame.labelSize} fill="#8A9199">
          {month === data.months - 1 ? `Mo. ${month + 1}` : month + 1}
        </text>
      ))}
    </svg>
  )
}
