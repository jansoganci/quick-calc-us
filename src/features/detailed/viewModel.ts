import {
  calculateDetailed,
  validateDetailedInput,
  type DetailedResolvedInput,
  type DetailedResult,
  type ScenarioKey,
} from '../../core/detailed-us/index.ts'
import { formatCount } from '../../lib/number.ts'
import { formatUsd } from '../../lib/money.ts'
import type { DetailedFormState } from './formState.ts'
import { buildErrorMap, type ErrorMap } from './errors.ts'
import { buildReportInputGroups, type ReportInputGroup } from './reportView.ts'
import { collectGuardrails, type Guardrail } from './guardrails.ts'
import { COPY, SCENARIO_LABELS, VERDICT, type SectionId, type VerdictSegment } from './labels.ts'
import {
  buildAssumptionRows,
  buildBreakdown,
  buildChannelRows,
  buildChannelTotals,
  buildMonthRows,
  buildPaybackChart,
  buildProductRows,
  buildProductTotals,
  buildProjection,
  type AssumptionRow,
  type BreakdownView,
  type ChannelRow,
  type MonthRow,
  type PaybackData,
  type ProductRow,
  type ProjectionData,
} from './resultView.ts'
import { toDetailedInput } from './toInput.ts'

/**
 * The single boundary between the Detailed engine and the Detailed UI.
 * Components receive formatted strings and never touch `DetailedResult`
 * themselves.
 */

const SCENARIO_ORDER: ScenarioKey[] = ['bad', 'base', 'good']

export type AvailableFigure = { available: true; value: string } | { available: false; message: string }

export type ScenarioRow = {
  key: ScenarioKey
  label: string
  isBase: boolean
  operatingResult: string
  netRevenue: string
  contribution: string
  payback: string
}

export type DetailedView = {
  verdict: VerdictSegment[]
  copyText: string
  monthlyOperatingResult: string
  breakEvenPerDay: AvailableFigure
  breakEvenUnitsPerDay: string | null
  breakEvenUnitsPerMonth: string | null
  payback: AvailableFigure
  initialInvestment: string
  plannedUnitsPerDay: string
  horizonMonths: string
  scenarios: ScenarioRow[]
  breakdown: BreakdownView
  channels: ChannelRow[]
  channelTotals: Omit<ChannelRow, 'channel' | 'label'>
  products: ProductRow[]
  productTotals: Omit<ProductRow, 'productId' | 'name'>
  projection: ProjectionData
  paybackChart: PaybackData
  monthRows: MonthRow[]
  assumptions: AssumptionRow[]
  guardrails: Guardrail[]
  hasDelivery: boolean
  /** `meta.detailedEngineVersion`, which the report's colophon states. */
  engineVersion: string
  /**
   * The report's input appendix. It rides on the view because the report is
   * a presentation of this same view model — the figures a reader audits
   * are the figures the screen shows, formatted once.
   */
  reportInputs: ReportInputGroup[]
}

export type EvaluateDetailedResult =
  | { ok: true; view: DetailedView }
  | { ok: false; errors: ErrorMap; errorSections: SectionId[] }

function paybackText(result: DetailedResult, scenario: ScenarioKey): AvailableFigure {
  const payback = result.scenarios[scenario].payback

  if (payback.available) {
    return payback.month === 0
      ? { available: false, message: 'Immediate — no investment to recover.' }
      : { available: true, value: COPY.paybackMonth(payback.month) }
  }

  return {
    available: false,
    message: payback.reason === 'not_reached_within_horizon' ? COPY.paybackNotReached : COPY.paybackNonPositiveResult,
  }
}

function buildVerdict(result: DetailedResult): VerdictSegment[] {
  const base = result.scenarios.base.stabilizedMonth
  const operatingResult = base.monthlyOperatingResult
  const payback = result.scenarios.base.payback

  if (base.totalUnits === 0) {
    return VERDICT.zeroVolume(formatUsd(base.monthlyFixedCost))
  }
  if (operatingResult < 0) {
    return VERDICT.deficit(formatUsd(Math.abs(operatingResult)))
  }
  if (operatingResult === 0) {
    return VERDICT.breakEvenResult()
  }

  const resultText = formatUsd(operatingResult)
  if (payback.available) {
    return payback.month === 0
      ? VERDICT.profitNoInvestment(resultText)
      : VERDICT.profitWithPayback(resultText, formatUsd(result.totalInitialInvestment), formatCount(payback.month))
  }
  return VERDICT.profitNoPayback(resultText, formatCount(result.meta.assumptions.projectionHorizonMonths))
}

function buildScenarioRows(result: DetailedResult): ScenarioRow[] {
  return SCENARIO_ORDER.map((key) => {
    const month = result.scenarios[key].stabilizedMonth
    const payback = paybackText(result, key)
    return {
      key,
      label: SCENARIO_LABELS[key],
      isBase: key === 'base',
      operatingResult: formatUsd(month.monthlyOperatingResult),
      netRevenue: formatUsd(month.netRevenue),
      contribution: formatUsd(month.totalContribution),
      payback: payback.available ? payback.value : payback.message,
    }
  })
}

function buildCopyText(result: DetailedResult, view: Omit<DetailedView, 'copyText'>): string {
  const lines = [
    `${COPY.monthlyOperatingResult}: ${view.monthlyOperatingResult}`,
    `${COPY.breakEven}: ${view.breakEvenPerDay.available ? view.breakEvenPerDay.value : view.breakEvenPerDay.message}`,
    `${COPY.payback}: ${view.payback.available ? view.payback.value : view.payback.message}`,
    `${COPY.totalInitialInvestment}: ${view.initialInvestment}`,
  ]
  for (const scenario of view.scenarios) {
    lines.push(`${scenario.label}: ${scenario.operatingResult}`)
  }
  lines.push(`${COPY.engineVersion}: ${result.meta.detailedEngineVersion}`)
  return lines.join('\n')
}

function buildView(result: DetailedResult, input: DetailedResolvedInput): DetailedView {
  const base = result.scenarios.base.stabilizedMonth
  const hasDelivery = input.channelMix.delivery > 0

  const breakEvenPerDay: AvailableFigure = result.breakEven.available
    ? { available: true, value: `${formatCount(result.breakEven.unitsPerDay)} ${COPY.breakEvenUnitsPerDay}` }
    : {
        available: false,
        message: result.breakEven.reason === 'no_sales_volume' ? COPY.paybackUnavailableNoSales : COPY.paybackUnavailableNonPositive,
      }

  const withoutCopy: Omit<DetailedView, 'copyText'> = {
    verdict: buildVerdict(result),
    monthlyOperatingResult: formatUsd(base.monthlyOperatingResult),
    breakEvenPerDay,
    breakEvenUnitsPerDay: result.breakEven.available ? `${formatCount(result.breakEven.unitsPerDay)} units` : null,
    breakEvenUnitsPerMonth: result.breakEven.available ? `${formatCount(result.breakEven.unitsPerMonth)} units` : null,
    payback: paybackText(result, 'base'),
    initialInvestment: formatUsd(result.totalInitialInvestment),
    plannedUnitsPerDay: `${formatCount(base.totalUnits / input.assumptions.operatingDaysPerMonth)} units/day`,
    horizonMonths: formatCount(result.meta.assumptions.projectionHorizonMonths),
    scenarios: buildScenarioRows(result),
    breakdown: buildBreakdown(base),
    channels: buildChannelRows(base),
    channelTotals: buildChannelTotals(base),
    products: buildProductRows(base),
    productTotals: buildProductTotals(base),
    projection: buildProjection(result),
    paybackChart: buildPaybackChart(result),
    monthRows: buildMonthRows(result),
    assumptions: buildAssumptionRows(result, hasDelivery),
    guardrails: collectGuardrails(input),
    hasDelivery,
    engineVersion: result.meta.detailedEngineVersion,
    reportInputs: buildReportInputGroups(input, result),
  }

  return { ...withoutCopy, copyText: buildCopyText(result, withoutCopy) }
}

export function evaluateDetailed(form: DetailedFormState): EvaluateDetailedResult {
  const validated = validateDetailedInput(toDetailedInput(form))
  if (!validated.ok) {
    const { byPath, sections } = buildErrorMap(validated.errors, form)
    return { ok: false, errors: byPath, errorSections: sections }
  }

  const result = calculateDetailed(validated.input)
  return { ok: true, view: buildView(result, validated.input) }
}
