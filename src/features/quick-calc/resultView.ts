import type {
  CostLine,
  QuickCalculationResult,
  QuickSimulationRow,
} from '../../core/quick-us/index.ts'
import { formatUsd, formatUsdExact } from '../../lib/money.ts'
import { formatCount } from '../../lib/number.ts'
import { formatPercentValue } from '../../lib/percent.ts'
import { BREAKDOWN_LABELS, COPY, SIM_LABELS, type HeadlineSegment } from './labels.ts'

const COST_ORDER: CostLine[] = [
  'salesTax',
  'variable',
  'payroll',
  'rent',
  'otherOpex',
  'pos',
  'investmentRecovery',
]

const BAR_COLORS: Record<CostLine | 'remaining', string> = {
  salesTax: 'var(--qc-bar-vat)',
  variable: 'var(--qc-bar-variable)',
  payroll: 'var(--qc-bar-payroll)',
  rent: 'var(--qc-bar-rent)',
  otherOpex: 'var(--qc-bar-other-opex)',
  pos: 'var(--qc-bar-pos)',
  investmentRecovery: 'var(--qc-bar-investment-recovery)',
  remaining: 'var(--qc-bar-remaining)',
}

const RULE_COLORS = {
  row: 'var(--qc-rule-row)',
  group: 'var(--qc-rule-mid)',
  total: 'var(--qc-ink)',
} as const

export type BarSegment = {
  key: CostLine | 'remaining'
  label: string
  color: string
  width: number
  showLabel: boolean
  amountFormatted: string
}

export type BreakdownRow = {
  key: CostLine | 'remaining'
  label: string
  amountFormatted: string
  shareFormatted: string
  color: string
  emphasis: boolean
  rule: string
}

export type OutputItem = {
  key: string
  label: string
  value: string
  unit: string
}

export type SimulationDisplayRow = {
  label: QuickSimulationRow['label']
  scenario: string
  volume: string
  cost: string
  earnings: string
  isCurrent: boolean
  rule: string
}

export type QuickView = {
  headline: string
  headlineSegments: HeadlineSegment[]
  copyText: string
  headlineCost: string
  ticketFormatted: string
  /**
   * The figure the bar actually ends at. In a loss the segments are scaled to
   * total cost rather than to the sale, so labelling that end with the sale
   * would read as "costs equal the sale price" — the opposite of what
   * happened. Both strings are already displayed elsewhere; this only
   * chooses between them.
   */
  barEndLabel: string
  bar: BarSegment[]
  breakdown: BreakdownRow[]
  outputs: OutputItem[]
  simulation: SimulationDisplayRow[]
  paybackNote: string | null
}

function shareOf(amount: number, ticket: number): string {
  if (ticket <= 0) return '—'
  return formatPercentValue((amount / ticket) * 100)
}

function toPercents(shares: number[]): number[] {
  if (shares.length === 0) return []
  const rounded = shares.map((share) => Math.round(share * 1000) / 10)
  const total = rounded.reduce((sum, value) => sum + value, 0)
  const lastIndex = rounded.length - 1
  const last = rounded[lastIndex]
  if (last === undefined) return rounded
  rounded[lastIndex] = Math.round((last + (100 - total)) * 10) / 10
  return rounded
}

function paybackDisplay(
  payback: QuickCalculationResult['payback'],
  recoveryPeriodMonths: number,
): { value: string; unit: string; note: string | null } {
  if ('months' in payback) {
    return {
      value: formatUsdExact(payback.months, 1).replace('$', ''),
      unit: 'months',
      note: payback.exceedsRecoveryPeriod
        ? COPY.paybackExceeds(formatCount(recoveryPeriodMonths))
        : null,
    }
  }
  return { value: '—', unit: '', note: COPY.paybackUnavailable }
}

function buildSimulationRows(simulation: QuickSimulationRow[]): SimulationDisplayRow[] {
  return simulation.map((row, index) => {
    const isLast = index === simulation.length - 1
    const nextIsCurrent = simulation[index + 1]?.isCurrent === true
    return {
      label: row.label,
      scenario: SIM_LABELS[row.label],
      volume: formatCount(row.dailySales),
      cost:
        row.estimatedTotalCostPerSale === null
          ? '—'
          : formatUsdExact(row.estimatedTotalCostPerSale, 2),
      earnings: formatUsd(row.monthlyOperatingEarnings),
      isCurrent: row.isCurrent,
      rule: isLast
        ? RULE_COLORS.total
        : row.isCurrent || nextIsCurrent
          ? RULE_COLORS.group
          : RULE_COLORS.row,
    }
  })
}

export function buildQuickView(
  result: QuickCalculationResult,
  simulation: QuickSimulationRow[],
  recoveryPeriodMonths: number,
): QuickView {
  const perSale = result.perSale
  const breakdown = result.breakdownPerSale
  const ticket = breakdown?.averageSale ?? perSale?.customerPaymentPerSale ?? 0

  if (perSale === null || breakdown === null) {
    const payback = paybackDisplay(result.payback, recoveryPeriodMonths)
    return {
      headline: COPY.zeroVolume,
      headlineSegments: [{ text: COPY.zeroVolume, tone: 'text' }],
      copyText: [
        `${COPY.headlineTicket}: ${formatUsdExact(ticket, 2)}`,
        `${COPY.simCost}: —`,
        `${BREAKDOWN_LABELS.remaining}: —`,
        `${COPY.monthlyEarnings}: ${formatUsd(result.monthly.operatingEarnings)}`,
        `${COPY.payback}: ${payback.unit ? `${payback.value} ${payback.unit}` : payback.value}`,
      ].join('\n'),
      headlineCost: '',
      ticketFormatted: formatUsdExact(ticket, 2),
      barEndLabel: formatUsdExact(ticket, 2),
      bar: [],
      breakdown: [],
      outputs: [
        {
          key: 'earnings',
          label: COPY.monthlyEarnings,
          value: formatUsd(result.monthly.operatingEarnings),
          unit: '',
        },
        {
          key: 'gross',
          label: COPY.grossMargin,
          value:
            result.grossProfitMargin === null
              ? '—'
              : formatPercentValue(result.grossProfitMargin * 100),
          unit: '',
        },
        {
          key: 'operating',
          label: COPY.operatingMargin,
          value:
            result.operatingProfitMargin === null
              ? '—'
              : formatPercentValue(result.operatingProfitMargin * 100),
          unit: '',
        },
        {
          key: 'payback',
          label: COPY.payback,
          value: payback.value,
          unit: payback.unit,
        },
      ],
      simulation: buildSimulationRows(simulation),
      paybackNote: payback.note,
    }
  }

  const remaining = perSale.remainingProfit
  const costAmounts = COST_ORDER.map(
    (line) => breakdown.lines.find((entry) => entry.line === line)?.amount ?? 0,
  )
  const remainingAmount = remaining < 0 ? 0 : remaining
  const costTotal = costAmounts.reduce((sum, amount) => sum + amount, 0)

  let shares: number[]
  if (remaining < 0) {
    const scale = costTotal > 0 ? 1 / costTotal : 0
    shares = [...costAmounts.map((amount) => amount * scale), 0]
  } else {
    const denom = ticket > 0 ? ticket : 1
    shares = [...costAmounts.map((amount) => amount / denom), remainingAmount / denom]
  }

  const widths = toPercents(shares)
  const keys: Array<CostLine | 'remaining'> = [...COST_ORDER, 'remaining']
  const segmentAmounts = [...costAmounts, remaining]
  const bar: BarSegment[] = keys.map((key, index) => ({
    key,
    label: BREAKDOWN_LABELS[key],
    color: BAR_COLORS[key],
    width: Math.max(0, widths[index] ?? 0),
    showLabel: (widths[index] ?? 0) >= 15,
    amountFormatted: formatUsdExact(segmentAmounts[index] ?? 0, 2),
  }))

  const breakdownRows: BreakdownRow[] = keys.map((key, index) => {
    const amount = key === 'remaining' ? remaining : (costAmounts[index] ?? 0)
    const isLastCost = key === 'investmentRecovery'
    const isRemaining = key === 'remaining'
    return {
      key,
      label: BREAKDOWN_LABELS[key],
      amountFormatted: formatUsdExact(amount, 2),
      shareFormatted: shareOf(amount, ticket),
      color: BAR_COLORS[key],
      emphasis: isRemaining,
      rule: isRemaining ? RULE_COLORS.total : isLastCost ? RULE_COLORS.group : RULE_COLORS.row,
    }
  })

  const payback = paybackDisplay(result.payback, recoveryPeriodMonths)
  const costText = formatUsdExact(perSale.estimatedTotalCost, 2)
  const remainingText = formatUsdExact(remaining, 2)
  const ticketText = formatUsdExact(ticket, 2)
  const headlineSegments =
    remaining < 0
      ? COPY.headlineLossSentence(ticketText, formatUsdExact(Math.abs(remaining), 2))
      : COPY.headlineSentence(ticketText, costText, remainingText)

  return {
    headline: headlineSegments.map((segment) => segment.text).join(''),
    headlineSegments,
    copyText: [
      `${COPY.headlineTicket}: ${ticketText}`,
      `${COPY.simCost}: ${costText}`,
      `${BREAKDOWN_LABELS.remaining}: ${remainingText}`,
      `${COPY.monthlyEarnings}: ${formatUsd(result.monthly.operatingEarnings)}`,
      `${COPY.payback}: ${payback.unit ? `${payback.value} ${payback.unit}` : payback.value}`,
    ].join('\n'),
    headlineCost: costText,
    ticketFormatted: ticketText,
    barEndLabel: remaining < 0 ? costText : ticketText,
    bar,
    breakdown: breakdownRows,
    outputs: [
      {
        key: 'earnings',
        label: COPY.monthlyEarnings,
        value: formatUsd(result.monthly.operatingEarnings),
        unit: '',
      },
      {
        key: 'gross',
        label: COPY.grossMargin,
        value:
          result.grossProfitMargin === null
            ? '—'
            : formatPercentValue(result.grossProfitMargin * 100),
        unit: '',
      },
      {
        key: 'operating',
        label: COPY.operatingMargin,
        value:
          result.operatingProfitMargin === null
            ? '—'
            : formatPercentValue(result.operatingProfitMargin * 100),
        unit: '',
      },
      {
        key: 'payback',
        label: COPY.payback,
        value: payback.value,
        unit: payback.unit,
      },
    ],
    simulation: buildSimulationRows(simulation),
    paybackNote: payback.note,
  }
}
