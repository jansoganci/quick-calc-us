import {
  type Channel,
  type DetailedResult,
  type MonthResult,
  type ScenarioKey,
} from '../../core/detailed-us/index.ts'
import { formatUsd } from '../../lib/money.ts'
import { formatCount } from '../../lib/number.ts'
import { formatPercent } from '../../lib/percent.ts'
import { US_STATE_NAMES } from '../../data/us/salesTaxRates.ts'
import {
  BREAKDOWN_LABELS,
  CHANNEL_LABELS,
  COPY,
  DELIVERY_MODE_LABELS,
  RAMP_UP_LABELS,
  SCENARIO_LABELS,
  type BreakdownKey,
} from './labels.ts'

/**
 * Shapes `DetailedResult` into rows, segments and numeric series for the
 * result components. It reads engine figures and formats them; it derives no
 * new financial quantity. Charts receive raw numeric series and do their own
 * pixel arithmetic, which is visual-only and stays in the chart component.
 */

const CHANNEL_ORDER: Channel[] = ['dineIn', 'takeaway', 'delivery']
const SCENARIO_ORDER: ScenarioKey[] = ['bad', 'base', 'good']

export type BreakdownRow = {
  key: BreakdownKey
  label: string
  amount: string
  share: string
  widthPercent: number
  colorClass: string
  /** Same token as `colorClass`, as a CSS custom property — SVG `fill` cannot read a `bg-*` class (SankeyBreakdown). */
  fillVar: string
}

/**
 * Nine stops of one monotone ramp, in the order the money leaves the gross
 * figure. `tailwind.config.ts` carries all nine tokens (seven shared with
 * Quick's own breakdown ramp, plus `bar-channel` / `bar-owner` added for
 * Detailed). Both maps below MUST stay fully literal, one string per entry —
 * Tailwind's JIT finds class names by scanning source text for literal
 * substrings, not by evaluating code, so a computed class name is invisible
 * to that scan and silently generates no CSS.
 */
const BREAKDOWN_COLORS: Record<BreakdownKey, string> = {
  salesTax: 'bg-qc-bar-vat',
  productCogs: 'bg-qc-bar-variable',
  channelVariableCost: 'bg-qc-bar-channel',
  paymentPlatformFee: 'bg-qc-bar-payroll',
  payroll: 'bg-qc-bar-rent',
  owner: 'bg-qc-bar-owner',
  occupancy: 'bg-qc-bar-other-opex',
  opex: 'bg-qc-bar-pos',
  operatingResult: 'bg-qc-bar-remaining',
}

const BREAKDOWN_FILL_VARS: Record<BreakdownKey, string> = {
  salesTax: 'var(--qc-bar-vat)',
  productCogs: 'var(--qc-bar-variable)',
  channelVariableCost: 'var(--qc-bar-channel)',
  paymentPlatformFee: 'var(--qc-bar-payroll)',
  payroll: 'var(--qc-bar-rent)',
  owner: 'var(--qc-bar-owner)',
  occupancy: 'var(--qc-bar-other-opex)',
  opex: 'var(--qc-bar-pos)',
  operatingResult: 'var(--qc-bar-remaining)',
}

const BREAKDOWN_ORDER: readonly BreakdownKey[] = [
  'salesTax',
  'productCogs',
  'channelVariableCost',
  'paymentPlatformFee',
  'payroll',
  'owner',
  'occupancy',
  'opex',
  'operatingResult',
]

function breakdownAmount(month: MonthResult, key: BreakdownKey): number {
  switch (key) {
    case 'salesTax':
      return month.salesTaxAmount
    case 'productCogs':
      return month.productCogs
    case 'channelVariableCost':
      return month.channelVariableCost
    case 'paymentPlatformFee':
      return month.paymentPlatformFee
    case 'payroll':
      return month.monthlyPayroll
    case 'owner':
      return month.monthlyOwnerCost
    case 'occupancy':
      return month.monthlyOccupancyCost
    case 'opex':
      return month.monthlyOpex
    case 'operatingResult':
      return month.monthlyOperatingResult
  }
}

export type BreakdownView = {
  rows: BreakdownRow[]
  total: string
  /** True when the operating result is negative, so the bar cannot close at 100%. */
  isDeficit: boolean
  deficitCaption: string | null
}

/**
 * The bar reconciles exactly, because the engine's own identity says so:
 * gross customer sales = sales tax + variable costs + fixed costs + operating
 * result. When the result is negative the bar cannot draw the closing
 * segment, so the cost segments are shown as shares of total cost and a
 * caption states the overrun.
 */
export function buildBreakdown(month: MonthResult): BreakdownView {
  const gross = month.grossCustomerSales
  const isDeficit = month.monthlyOperatingResult < 0
  const visibleKeys = isDeficit
    ? BREAKDOWN_ORDER.filter((key) => key !== 'operatingResult')
    : BREAKDOWN_ORDER

  const basis = isDeficit
    ? visibleKeys.reduce((sum, key) => sum + breakdownAmount(month, key), 0)
    : gross

  const rows: BreakdownRow[] = visibleKeys.map((key) => {
    const amount = breakdownAmount(month, key)
    const fraction = basis === 0 ? 0 : amount / basis
    return {
      key,
      label: BREAKDOWN_LABELS[key],
      amount: formatUsd(amount),
      share: formatPercent(gross === 0 ? 0 : amount / gross),
      widthPercent: fraction * 100,
      colorClass: BREAKDOWN_COLORS[key],
      fillVar: BREAKDOWN_FILL_VARS[key],
    }
  })

  // The last segment absorbs the rounding remainder so the row totals exactly 100%.
  const last = rows[rows.length - 1]
  if (last !== undefined) {
    const drawn = rows.slice(0, -1).reduce((sum, row) => sum + row.widthPercent, 0)
    last.widthPercent = Math.max(0, 100 - drawn)
  }

  if (isDeficit) {
    return {
      rows: [
        ...rows,
        {
          key: 'operatingResult',
          label: BREAKDOWN_LABELS.operatingResult,
          amount: formatUsd(month.monthlyOperatingResult),
          share: formatPercent(gross === 0 ? 0 : month.monthlyOperatingResult / gross),
          widthPercent: 0,
          colorClass: BREAKDOWN_COLORS.operatingResult,
          fillVar: BREAKDOWN_FILL_VARS.operatingResult,
        },
      ],
      total: formatUsd(gross),
      isDeficit,
      deficitCaption: gross === 0 ? null : `Total cost is ${formatPercent(basis / gross)} of monthly revenue.`,
    }
  }

  return { rows, total: formatUsd(gross), isDeficit, deficitCaption: null }
}

export type ChannelRow = {
  channel: Channel
  label: string
  units: string
  gross: string
  net: string
  cogs: string
  variable: string
  fee: string
  contribution: string
}

export function buildChannelRows(month: MonthResult): ChannelRow[] {
  return CHANNEL_ORDER.map((channel) => {
    const line = month.byChannel[channel]
    return {
      channel,
      label: CHANNEL_LABELS[channel],
      units: formatCount(line.units),
      gross: formatUsd(line.grossCustomerSales),
      net: formatUsd(line.netRevenue),
      cogs: formatUsd(line.productCogs),
      variable: line.channelVariableCost === 0 ? COPY.none : formatUsd(line.channelVariableCost),
      fee: formatUsd(line.paymentPlatformFee),
      contribution: formatUsd(line.contribution),
    }
  })
}

export function buildChannelTotals(month: MonthResult): Omit<ChannelRow, 'channel' | 'label'> {
  return {
    units: formatCount(month.totalUnits),
    gross: formatUsd(month.grossCustomerSales),
    net: formatUsd(month.netRevenue),
    cogs: formatUsd(month.productCogs),
    variable: formatUsd(month.channelVariableCost),
    fee: formatUsd(month.paymentPlatformFee),
    contribution: formatUsd(month.totalContribution),
  }
}

/** Same shape as `ChannelRow` — one row per product instead of per channel (DF-84). */
export type ProductRow = {
  productId: string
  name: string
  units: string
  gross: string
  net: string
  cogs: string
  variable: string
  fee: string
  contribution: string
}

export function buildProductRows(month: MonthResult): ProductRow[] {
  return month.byProduct.map((line) => ({
    productId: line.productId,
    name: line.name,
    units: formatCount(line.units),
    gross: formatUsd(line.grossCustomerSales),
    net: formatUsd(line.netRevenue),
    cogs: formatUsd(line.productCogs),
    variable: line.channelVariableCost === 0 ? COPY.none : formatUsd(line.channelVariableCost),
    fee: formatUsd(line.paymentPlatformFee),
    contribution: formatUsd(line.contribution),
  }))
}

export function buildProductTotals(month: MonthResult): Omit<ProductRow, 'productId' | 'name'> {
  return buildChannelTotals(month)
}

export type ProjectionSeries = { key: ScenarioKey; label: string; values: number[] }

export type ProjectionData = {
  series: ProjectionSeries[]
  min: number
  max: number
  months: number
}

export function buildProjection(result: DetailedResult): ProjectionData {
  const series = SCENARIO_ORDER.map((key) => ({
    key,
    label: SCENARIO_LABELS[key],
    values: result.scenarios[key].projection.map((month) => month.monthlyOperatingResult),
  }))

  const all = series.flatMap((entry) => entry.values)
  return {
    series,
    min: Math.min(0, ...all),
    max: Math.max(0, ...all),
    months: result.meta.assumptions.projectionHorizonMonths,
  }
}

export type PaybackData = {
  cumulative: number[]
  target: number
  paybackMonth: number | null
  min: number
  max: number
  months: number
}

/**
 * Cumulative base-scenario operating result against the investment line. The
 * running sum is the same quantity payback is defined on — it is not a
 * second definition.
 */
export function buildPaybackChart(result: DetailedResult): PaybackData {
  const base = result.scenarios.base
  const cumulative: number[] = []
  let running = 0
  for (const month of base.projection) {
    running += month.monthlyOperatingResult
    cumulative.push(running)
  }

  const target = result.totalInitialInvestment
  return {
    cumulative,
    target,
    paybackMonth: base.payback.available ? base.payback.month : null,
    min: Math.min(0, ...cumulative),
    max: Math.max(target, ...cumulative),
    months: result.meta.assumptions.projectionHorizonMonths,
  }
}

export type MonthRow = {
  month: string
  units: string
  netRevenue: string
  contribution: string
  fixedCost: string
  operatingResult: string
}

export function buildMonthRows(result: DetailedResult): MonthRow[] {
  return result.scenarios.base.projection.map((month) => ({
    month: `${formatCount(month.month ?? 0)}`,
    units: formatCount(month.totalUnits),
    netRevenue: formatUsd(month.netRevenue),
    contribution: formatUsd(month.totalContribution),
    fixedCost: formatUsd(month.monthlyFixedCost),
    operatingResult: formatUsd(month.monthlyOperatingResult),
  }))
}

export type AssumptionRow = { label: string; value: string }

/**
 * Mandatory assumption transparency, including the three annual rates even
 * at 0% — a hidden 0% would mislead. Delivery rows are the only conditional
 * ones: with no delivery share they reach no figure.
 */
export function buildAssumptionRows(result: DetailedResult, hasDelivery: boolean): AssumptionRow[] {
  const assumptions = result.meta.assumptions
  const rows: AssumptionRow[] = [
    { label: COPY.stateLabel, value: US_STATE_NAMES[assumptions.usState] },
    { label: COPY.salesTaxRateLabel, value: formatPercent(assumptions.salesTaxRate) },
    { label: COPY.operatingDays, value: formatCount(assumptions.operatingDaysPerMonth) },
    { label: COPY.projectionHorizon, value: `${formatCount(assumptions.projectionHorizonMonths)} months` },
    { label: COPY.rampUp, value: RAMP_UP_LABELS[assumptions.rampUpPreset] },
    {
      label: COPY.scenarioDeltas,
      value: SCENARIO_ORDER.map((key) => formatPercent(assumptions.scenarioVolumeDeltas[key])).join(' · '),
    },
  ]

  if (hasDelivery) {
    rows.push(
      { label: COPY.deliveryModeLabel, value: DELIVERY_MODE_LABELS[assumptions.deliveryMode] },
      { label: COPY.platformFeeRate, value: formatPercent(assumptions.platformFeeRate) },
    )
  }

  rows.push(
    { label: COPY.posCommission, value: formatPercent(assumptions.posCommissionRate) },
    { label: COPY.salesPriceAnnualIncrease, value: formatPercent(assumptions.salesPriceAnnualIncrease) },
    { label: COPY.productCogsAnnualIncrease, value: formatPercent(assumptions.productCogsAnnualIncrease) },
    { label: COPY.fixedCostAnnualIncrease, value: formatPercent(assumptions.fixedCostAnnualIncrease) },
    { label: COPY.engineVersion, value: result.meta.detailedEngineVersion },
  )

  return rows
}
