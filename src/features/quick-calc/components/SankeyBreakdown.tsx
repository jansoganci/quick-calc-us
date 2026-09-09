import type { QuickView } from '../viewModel.ts'

type SankeyBreakdownProps = {
  bar: QuickView['bar']
  ticketFormatted: string
}

type Segment = { y0: number; y1: number }

/**
 * Pixel arithmetic for the supplementary Sankey. Visual proportion only —
 * every value it touches is already computed by `buildQuickView`.
 *
 * `GAP` between target nodes is a fixed constant rather than derived from
 * node height on purpose: it is what keeps adjacent labels legible even when
 * a category is genuinely 0 (e.g. `initialCapex = 0`, so two neighbouring
 * zero-height nodes still land `GAP` apart).
 */
const WIDTH = 620
const FLOW_HEIGHT = 180
const GAP = 22
const TOP_PAD = 20
const NODE_WIDTH = 10
const SOURCE_X = 0
const TARGET_X = 330
const LABEL_X = 354
const CONTROL_X = (SOURCE_X + NODE_WIDTH + TARGET_X) / 2

function buildSegments(bar: QuickView['bar']): { source: Segment[]; target: Segment[]; height: number } {
  const source: Segment[] = []
  const target: Segment[] = []
  let sourceY = TOP_PAD
  let targetY = TOP_PAD
  for (const segment of bar) {
    const h = (Math.max(0, segment.width) / 100) * FLOW_HEIGHT
    source.push({ y0: sourceY, y1: sourceY + h })
    target.push({ y0: targetY, y1: targetY + h })
    sourceY += h
    targetY += h + GAP
  }
  return { source, target, height: Math.max(sourceY, targetY - GAP) + TOP_PAD }
}

function ribbonPath(sourceSeg: Segment, targetSeg: Segment): string {
  const x0 = SOURCE_X + NODE_WIDTH
  const x1 = TARGET_X
  return [
    `M${x0},${sourceSeg.y0}`,
    `C${CONTROL_X},${sourceSeg.y0} ${CONTROL_X},${targetSeg.y0} ${x1},${targetSeg.y0}`,
    `L${x1},${targetSeg.y1}`,
    `C${CONTROL_X},${targetSeg.y1} ${CONTROL_X},${sourceSeg.y1} ${x0},${sourceSeg.y1}`,
    'Z',
  ].join(' ')
}

/**
 * Supplementary to the stacked bar (`StackedBar`), never a replacement.
 * Renders the same `breakdownPerSale` categories, in the same locked order
 * and the same colours, as a single-source Sankey fan-out.
 */
export function SankeyBreakdown({ bar, ticketFormatted }: SankeyBreakdownProps) {
  if (bar.length === 0) return null

  const { source, target, height } = buildSegments(bar)
  const sourceTop = source[0]?.y0 ?? TOP_PAD
  const sourceBottom = source[source.length - 1]?.y1 ?? TOP_PAD

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="mt-6 block h-auto w-full lg:mt-7" role="img" aria-label="Average sale broken down by category">
      {bar.map((segment, index) => {
        const sourceSeg = source[index]
        const targetSeg = target[index]
        if (!sourceSeg || !targetSeg) return null
        return <path key={segment.key} d={ribbonPath(sourceSeg, targetSeg)} style={{ fill: segment.color, fillOpacity: 0.38 }} stroke="var(--qc-rule-mid)" strokeWidth="1" />
      })}

      <rect x={SOURCE_X} y={sourceTop} width={NODE_WIDTH} height={sourceBottom - sourceTop} style={{ fill: 'var(--qc-ink)' }} />
      <text x={SOURCE_X} y={sourceTop - 8} fontSize="12">
        <tspan className="font-sans" style={{ fill: 'var(--qc-ink)' }}>
          Average Sale
        </tspan>
        <tspan className="font-mono" style={{ fill: 'var(--qc-muted)' }} dx="8">
          {ticketFormatted}
        </tspan>
      </text>

      {bar.map((segment, index) => {
        const targetSeg = target[index]
        if (!targetSeg) return null
        return <rect key={segment.key} x={TARGET_X} y={targetSeg.y0} width={NODE_WIDTH} height={targetSeg.y1 - targetSeg.y0} style={{ fill: segment.color }} />
      })}

      {bar.map((segment, index) => {
        const targetSeg = target[index]
        if (!targetSeg) return null
        const center = (targetSeg.y0 + targetSeg.y1) / 2
        return (
          <text key={segment.key} x={LABEL_X} y={center} dominantBaseline="middle" fontSize="12">
            <tspan className="font-sans" style={{ fill: 'var(--qc-ink)', fontWeight: segment.key === 'remaining' ? 600 : 400 }}>
              {segment.label}
            </tspan>
            <tspan className="font-mono" style={{ fill: 'var(--qc-muted)' }} dx="8">
              {segment.amountFormatted}
            </tspan>
          </text>
        )
      })}
    </svg>
  )
}
