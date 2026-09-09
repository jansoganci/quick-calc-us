import type {
  DetailedResolvedInput,
  DetailedResult,
  ResolvedCapexItem,
  ResolvedOpexLine,
  ResolvedPosition,
  ResolvedProduct,
} from '../../core/detailed-us/index.ts'
import { US_STATE_NAMES } from '../../data/us/salesTaxRates.ts'
import { formatUsd, formatUsdExact } from '../../lib/money.ts'
import { formatCount } from '../../lib/number.ts'
import { formatPercent } from '../../lib/percent.ts'
import {
  CHANNEL_LABELS,
  COPY,
  DELIVERY_MODE_LABELS,
  PAYMENT_LABELS,
  SECTION_LABELS,
  type SectionId,
} from './labels.ts'

const CHANNEL_ORDER = ['dineIn', 'takeaway', 'delivery'] as const
const PAYMENT_ORDER = ['cash', 'card'] as const

/**
 * The report's input appendix, and the two rules that keep it honest:
 *
 * 1. **Values are the engine's resolved input**, not the raw strings the user
 *    typed. What the calculation used is what an auditor needs, and a
 *    default applied to a blank field becomes visible rather than staying
 *    silent.
 * 2. **Nothing here derives a figure.** Group totals are engine outputs read
 *    off the base stabilized month, never sums computed in this file —
 *    summing the lines would be a second source of truth for a financial
 *    figure (CLAUDE.md §3).
 *
 * Formatting is entirely `lib/` — the same `en-US`/USD helpers the screen
 * uses. DOM-free, so it type-checks and tests in the same `node` environment
 * as the rest of `core/detailed-us` and `features/detailed`.
 */

export type ReportInputRow = { label: string; value: string }
export type ReportInputTable = { columns: readonly string[]; rows: readonly (readonly string[])[] }

export type ReportInputContent =
  | { kind: 'rows'; rows: readonly ReportInputRow[] }
  | { kind: 'table'; table: ReportInputTable }

export type ReportInputGroup = {
  section: SectionId
  index: number
  title: string
  content: ReportInputContent
  /** An engine-published total, or `null` where the engine publishes none. */
  total: ReportInputRow | null
}

/** Monthly and total amounts follow the results: whole dollars. */
function money(value: number): string {
  return formatUsd(value)
}

/** Per-unit and per-order amounts keep their cents. */
function unitMoney(value: number): string {
  return formatUsdExact(value, 2)
}

function productTable(products: readonly ResolvedProduct[], hasDelivery: boolean): ReportInputTable {
  const columns = hasDelivery
    ? ['Product', 'Dine-in / takeout price', 'Delivery price', 'Daily quantity', 'Unit cost (COGS)']
    : ['Product', 'Price', 'Daily quantity', 'Unit cost (COGS)']

  const rows = products.map((product) =>
    hasDelivery
      ? [
          product.name,
          unitMoney(product.normalPrice),
          unitMoney(product.onlinePrice),
          formatCount(product.dailyQuantity),
          unitMoney(product.unitProductCost),
        ]
      : [product.name, unitMoney(product.normalPrice), formatCount(product.dailyQuantity), unitMoney(product.unitProductCost)],
  )

  return { columns, rows }
}

function positionTable(positions: readonly ResolvedPosition[]): ReportInputTable {
  return {
    columns: ['Position', 'Headcount', 'Monthly cost / person'],
    rows: positions.map((position) => [position.name, formatCount(position.headcount), money(position.monthlyCostPerPerson)]),
  }
}

function lineTable(
  nameColumn: string,
  amountColumn: string,
  lines: readonly (ResolvedOpexLine | ResolvedCapexItem)[],
): ReportInputTable {
  return {
    columns: [nameColumn, amountColumn],
    rows: lines.map((line) => [line.name, money('monthlyAmount' in line ? line.monthlyAmount : line.amount)]),
  }
}

/**
 * The appendix, following the same section order the form uses, so it can be
 * read beside the form that produced it. `assumptions` is deliberately
 * absent — every assumption is already rendered, in full and
 * unconditionally, by the mandatory assumptions block (`buildAssumptionRows`).
 */
export function buildReportInputGroups(input: DetailedResolvedInput, result: DetailedResult): ReportInputGroup[] {
  const base = result.scenarios.base.stabilizedMonth
  const hasDelivery = input.channelMix.delivery > 0
  const groups: ReportInputGroup[] = []

  const push = (section: SectionId, content: ReportInputContent, total: ReportInputRow | null = null) => {
    groups.push({ section, index: groups.length + 1, title: SECTION_LABELS[section], content, total })
  }

  push('jurisdiction', {
    kind: 'rows',
    rows: [
      { label: COPY.stateLabel, value: US_STATE_NAMES[input.usState] },
      { label: COPY.salesTaxRateLabel, value: formatPercent(input.salesTaxRate) },
    ],
  })

  if (input.products.length > 0) {
    push('products', { kind: 'table', table: productTable(input.products, hasDelivery) })
  }

  push('channels', {
    kind: 'table',
    table: {
      columns: [COPY.channelColumn, COPY.mixShare, 'Packaging / order'],
      rows: CHANNEL_ORDER.map((channel) => [
        CHANNEL_LABELS[channel],
        formatPercent(input.channelMix[channel]),
        channel === 'dineIn'
          ? COPY.none
          : unitMoney(channel === 'takeaway' ? input.packaging.takeawayPerOrder : input.packaging.deliveryPerOrder),
      ]),
    },
  })

  push('payments', {
    kind: 'table',
    table: {
      columns: ['Payment method', COPY.mixShare, 'Commission'],
      rows: PAYMENT_ORDER.map((method) => [
        PAYMENT_LABELS[method],
        formatPercent(input.paymentMix[method]),
        method === 'cash' ? COPY.none : formatPercent(input.posCommissionRate),
      ]),
    },
  })

  if (hasDelivery) {
    push('delivery', {
      kind: 'rows',
      rows: [
        { label: COPY.deliveryModeLabel, value: DELIVERY_MODE_LABELS[input.delivery.mode] },
        { label: COPY.platformFeeRate, value: formatPercent(input.delivery.platformFeeRate) },
        { label: 'Own courier cost / order', value: unitMoney(input.delivery.ownCourierCostPerDeliveryOrder) },
      ],
    })
  }

  if (input.positions.length > 0) {
    push(
      'positions',
      { kind: 'table', table: positionTable(input.positions) },
      { label: SECTION_LABELS.positions, value: money(base.monthlyPayroll) },
    )
  }

  push(
    'owner',
    {
      kind: 'rows',
      rows: [
        { label: 'Owner monthly draw', value: money(input.owner.monthlyDraw) },
        { label: 'Owner benefits allowance', value: money(input.owner.benefitsAllowance) },
      ],
    },
    { label: SECTION_LABELS.owner, value: money(base.monthlyOwnerCost) },
  )

  push(
    'occupancy',
    {
      kind: 'rows',
      rows: [
        { label: 'Monthly rent', value: money(input.occupancy.monthlyRent) },
        { label: 'Monthly CAM', value: money(input.occupancy.monthlyCAM) },
      ],
    },
    { label: SECTION_LABELS.occupancy, value: money(base.monthlyOccupancyCost) },
  )

  if (input.opexLines.length > 0) {
    push(
      'opex',
      { kind: 'table', table: lineTable('Expense', 'Monthly amount', input.opexLines) },
      { label: SECTION_LABELS.opex, value: money(base.monthlyOpex) },
    )
  }

  if (input.capexItems.length > 0) {
    push(
      'capex',
      { kind: 'table', table: lineTable('Item', 'Amount', input.capexItems) },
      { label: SECTION_LABELS.capex, value: money(result.totalInitialInvestment) },
    )
  }

  return groups
}

/** `September 9, 2026` — the date on the cover. */
export function formatReportDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

/** `2026-09-09` — the date inside the filename, where a long month would be noise. */
export function formatReportFileDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(date)
}

/** Every character a file system refuses is removed; everything else is kept. */
export function sanitizeBusinessName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

/**
 * The browser takes its suggested "Save as PDF" filename from
 * `document.title`, which is the whole of the filename mechanism — no
 * dependency, no download shim.
 */
export function reportDocumentTitle(businessName: string, date: Date): string {
  const name = sanitizeBusinessName(businessName)
  const stamp = formatReportFileDate(date)
  return name === '' ? `Feasibility Report — ${stamp}` : `Feasibility Report — ${name} — ${stamp}`
}

/** The dialog's gate: a name of only whitespace is not a name. */
export function isValidBusinessName(name: string): boolean {
  return name.trim().length > 0
}
