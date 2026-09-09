import type {
  Channel,
  ChannelLine,
  DetailedResult,
  MonthResult,
  ProductLine,
  ScenarioKey,
  ScenarioResult,
} from '../../core/detailed-us/index.ts'
import { formatUsd, formatUsdExact } from '../../lib/money.ts'
import { formatCount } from '../../lib/number.ts'
import { formatPercentValue } from '../../lib/percent.ts'
import { US_STATE_NAMES } from '../../data/us/salesTaxRates.ts'
import { CHANNEL_LABELS, COPY, DELIVERY_MODE_LABELS, RAMP_UP_LABELS, SCENARIO_LABELS } from './labels.ts'

const CHANNEL_ORDER: Channel[] = ['dineIn', 'takeaway', 'delivery']
const SCENARIO_ORDER: ScenarioKey[] = ['bad', 'base', 'good']

export type ChannelRowView = {
  key: Channel
  label: string
  units: string
  grossCustomerSales: string
  netRevenue: string
  productCogs: string
  channelVariableCost: string
  paymentPlatformFee: string
  contribution: string
}

export type ProductRowView = {
  productId: string
  name: string
  units: string
  grossCustomerSales: string
  netRevenue: string
  productCogs: string
  channelVariableCost: string
  paymentPlatformFee: string
  contribution: string
}

export type PaybackView =
  | { status: 'available'; monthLabel: string; cumulativeAtPayback: string }
  | { status: 'unavailable'; reason: string }

export type ScenarioView = {
  key: ScenarioKey
  label: string
  monthlyOperatingResult: string
  isLoss: boolean
  netRevenue: string
  totalVariableCost: string
  monthlyFixedCost: string
  byChannel: ChannelRowView[]
  byProduct: ProductRowView[]
  payback: PaybackView
}

export type BreakEvenView =
  | { status: 'available'; unitsPerDay: string; unitsPerMonth: string; weightedContributionPerUnit: string }
  | { status: 'unavailable'; reason: string }

export type DetailedView = {
  headline: string
  copyText: string
  totalInitialInvestment: string
  breakEven: BreakEvenView
  scenarios: Record<ScenarioKey, ScenarioView>
  assumptions: {
    stateLabel: string
    salesTaxRate: string
    rampUpLabel: string
    projectionHorizonMonths: number
    deliveryMode: string
    platformFeeRate: string
    posCommissionRate: string
    salesPriceAnnualIncrease: string
    productCogsAnnualIncrease: string
    fixedCostAnnualIncrease: string
  }
}

function channelRow(key: Channel, line: ChannelLine): ChannelRowView {
  return {
    key,
    label: CHANNEL_LABELS[key],
    units: formatCount(line.units),
    grossCustomerSales: formatUsd(line.grossCustomerSales),
    netRevenue: formatUsd(line.netRevenue),
    productCogs: formatUsd(line.productCogs),
    channelVariableCost: formatUsd(line.channelVariableCost),
    paymentPlatformFee: formatUsd(line.paymentPlatformFee),
    contribution: formatUsd(line.contribution),
  }
}

function productRow(line: ProductLine): ProductRowView {
  return {
    productId: line.productId,
    name: line.name,
    units: formatCount(line.units),
    grossCustomerSales: formatUsd(line.grossCustomerSales),
    netRevenue: formatUsd(line.netRevenue),
    productCogs: formatUsd(line.productCogs),
    channelVariableCost: formatUsd(line.channelVariableCost),
    paymentPlatformFee: formatUsd(line.paymentPlatformFee),
    contribution: formatUsd(line.contribution),
  }
}

function paybackView(scenario: ScenarioResult): PaybackView {
  const { payback } = scenario
  if (payback.available) {
    return {
      status: 'available',
      monthLabel: payback.month === 0 ? 'Immediate (no investment to recover)' : COPY.paybackMonth(payback.month),
      cumulativeAtPayback: formatUsd(payback.cumulativeAtPayback),
    }
  }
  return {
    status: 'unavailable',
    reason: payback.reason === 'not_reached_within_horizon' ? COPY.paybackNotReached : COPY.paybackNonPositiveResult,
  }
}

function scenarioView(key: ScenarioKey, scenario: ScenarioResult): ScenarioView {
  const month: MonthResult = scenario.stabilizedMonth
  return {
    key,
    label: SCENARIO_LABELS[key],
    monthlyOperatingResult: formatUsd(month.monthlyOperatingResult),
    isLoss: month.monthlyOperatingResult < 0,
    netRevenue: formatUsd(month.netRevenue),
    totalVariableCost: formatUsd(month.totalVariableCost),
    monthlyFixedCost: formatUsd(month.monthlyFixedCost),
    byChannel: CHANNEL_ORDER.map((channel) => channelRow(channel, month.byChannel[channel])),
    byProduct: month.byProduct.map(productRow),
    payback: paybackView(scenario),
  }
}

export function buildDetailedView(result: DetailedResult): DetailedView {
  const scenarios = {} as Record<ScenarioKey, ScenarioView>
  for (const key of SCENARIO_ORDER) {
    scenarios[key] = scenarioView(key, result.scenarios[key])
  }

  const base = scenarios.base
  const headline = base.isLoss
    ? `At the base scenario, this business runs a ${formatUsdExact(Math.abs(result.scenarios.base.stabilizedMonth.monthlyOperatingResult), 0)} monthly deficit.`
    : `At the base scenario, this business keeps ${base.monthlyOperatingResult} a month.`

  const breakEven: BreakEvenView = result.breakEven.available
    ? {
        status: 'available',
        unitsPerDay: formatCount(result.breakEven.unitsPerDay),
        unitsPerMonth: formatCount(result.breakEven.unitsPerMonth),
        weightedContributionPerUnit: formatUsdExact(result.breakEven.weightedContributionPerUnit, 2),
      }
    : {
        status: 'unavailable',
        reason: result.breakEven.reason === 'no_sales_volume' ? COPY.paybackUnavailableNoSales : COPY.paybackUnavailableNonPositive,
      }

  const { assumptions } = result.meta
  const copyText = [
    `${COPY.monthlyOperatingResult} (base): ${base.monthlyOperatingResult}`,
    `${COPY.breakEven}: ${breakEven.status === 'available' ? `${breakEven.unitsPerDay} ${COPY.breakEvenUnitsPerDay}` : breakEven.reason}`,
    `${COPY.payback} (base): ${base.payback.status === 'available' ? base.payback.monthLabel : base.payback.reason}`,
    `${COPY.totalInitialInvestment}: ${formatUsd(result.totalInitialInvestment)}`,
  ].join('\n')

  return {
    headline,
    copyText,
    totalInitialInvestment: formatUsd(result.totalInitialInvestment),
    breakEven,
    scenarios,
    assumptions: {
      stateLabel: US_STATE_NAMES[assumptions.usState],
      salesTaxRate: formatPercentValue(assumptions.salesTaxRate * 100),
      rampUpLabel: RAMP_UP_LABELS[assumptions.rampUpPreset],
      projectionHorizonMonths: assumptions.projectionHorizonMonths,
      deliveryMode: DELIVERY_MODE_LABELS[assumptions.deliveryMode],
      platformFeeRate: formatPercentValue(assumptions.platformFeeRate * 100),
      posCommissionRate: formatPercentValue(assumptions.posCommissionRate * 100),
      salesPriceAnnualIncrease: formatPercentValue(assumptions.salesPriceAnnualIncrease * 100),
      productCogsAnnualIncrease: formatPercentValue(assumptions.productCogsAnnualIncrease * 100),
      fixedCostAnnualIncrease: formatPercentValue(assumptions.fixedCostAnnualIncrease * 100),
    },
  }
}
