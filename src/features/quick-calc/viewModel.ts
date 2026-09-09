import {
  calculateQuick,
  QUICK_US_DEFAULTS,
  QUICK_US_LIMITS,
  resolveMonthlyPayroll,
  simulateQuick,
  validateQuickInput,
  type PrimaryInputField,
  type QuickCalculationInput,
  type SecondaryInputField,
  type ValidationError,
} from '../../core/quick-us/index.ts'
import { US_SALES_TAX_RATES, US_STATE_NAMES, type UsState } from '../../data/us/salesTaxRates.ts'

import { formatPercent, formatPercentValue } from '../../lib/percent.ts'
import { formatUsd } from '../../lib/money.ts'
import { formatCount } from '../../lib/number.ts'

import { parseNumber } from './parse.ts'
import { buildQuickView } from './resultView.ts'
import type { QuickView } from './resultView.ts'

import { COPY, ERROR_COPY, FIELD_LABELS, FIELD_UNITS, type FieldUnit } from './labels.ts'

export type QuickField = PrimaryInputField | SecondaryInputField | 'salesTaxRate'
export type FormErrorField = QuickField | 'usState'

export { QUICK_US_DEFAULTS }

export const PRIMARY_FIELDS: readonly PrimaryInputField[] = [
  'averageTicket',
  'dailySalesVolume',
  'variableCostPerSale',
  'monthlyRent',
  'otherMonthlyOpex',
  'employeeCount',
  'averageEmployeeMonthlyCost',
  'initialCapex',
] as const

export const SECONDARY_FIELDS: readonly SecondaryInputField[] = [
  'operatingDaysPerMonth',
  'capexRecoveryPeriodMonths',
  'cardPaymentShare',
  'posCommissionRate',
] as const

const PERCENT_FIELDS: ReadonlySet<QuickField> = new Set([
  'cardPaymentShare',
  'posCommissionRate',
  'salesTaxRate',
])

export type {
  BarSegment,
  BreakdownRow,
  OutputItem,
  QuickView,
  SimulationDisplayRow,
} from './resultView.ts'
export { buildQuickView } from './resultView.ts'

export type FormValues = Record<QuickField, string>

export type QuickFormState = FormValues & { usState: UsState | '' }

export const EMPTY_FORM: QuickFormState = {
  monthlyRent: '',
  employeeCount: '',
  averageEmployeeMonthlyCost: '',
  otherMonthlyOpex: '',
  initialCapex: '',
  averageTicket: '',
  dailySalesVolume: '',
  variableCostPerSale: '',
  operatingDaysPerMonth: '',
  capexRecoveryPeriodMonths: '',
  cardPaymentShare: '',
  posCommissionRate: '',
  salesTaxRate: '',
  usState: '',
}

/**
 * The form a first-time visitor lands on: a plausible small US cafe (same
 * business US_PRODUCT_SCOPE.md §6 uses to illustrate the formulas, at a
 * slightly higher volume so the seeded example is profitable rather than a
 * loss — a first screen should read as a working example, not a warning).
 *
 * The secondary fields and `salesTaxRate` stay empty on purpose: `toRawInput`
 * skips empty assumptions so the engine applies `QUICK_US_DEFAULTS` / the
 * state table, which keeps each default stated exactly once (U4).
 */
const EXAMPLE_STATE: UsState = 'CA'

export const EXAMPLE_FORM: QuickFormState = {
  averageTicket: '9.50',
  dailySalesVolume: '320',
  variableCostPerSale: '2.80',
  monthlyRent: '8,000',
  otherMonthlyOpex: '3,000',
  employeeCount: '8',
  averageEmployeeMonthlyCost: '4,500',
  initialCapex: '250,000',
  operatingDaysPerMonth: '',
  capexRecoveryPeriodMonths: '',
  cardPaymentShare: '',
  posCommissionRate: '',
  // Filled from the table, not hardcoded, so this can never drift from the
  // state it's paired with — same reasoning as selecting a state in the UI.
  salesTaxRate: stateTaxRatePercent(EXAMPLE_STATE),
  usState: EXAMPLE_STATE,
}

export type FieldSpan = 'half' | 'full'

export type FieldGroupId = 'sales' | 'monthlyCosts' | 'capex'

/**
 * A row inside a group. `payroll` is the one row that is not a single field:
 * headcount and per-employee cost are two of the eight locked inputs, but one
 * cost to the business, so they share a row and a label. `state` is the
 * required jurisdiction row — a select plus its linked, editable sales-tax
 * rate — and always leads the sales group.
 */
export type FieldRow =
  | { kind: 'field'; field: PrimaryInputField; span: FieldSpan }
  | { kind: 'payroll' }
  | { kind: 'state' }

export type FieldGroup = { id: FieldGroupId; rows: readonly FieldRow[] }

/**
 * The eight primary inputs plus the required state, grouped. Sales leads: a
 * visitor describes what they sell (and where) before what they pay. Initial
 * investment is its own group because it is not a monthly cost.
 */
export const FIELD_GROUPS: readonly FieldGroup[] = [
  {
    id: 'sales',
    rows: [
      { kind: 'state' },
      { kind: 'field', field: 'averageTicket', span: 'half' },
      { kind: 'field', field: 'dailySalesVolume', span: 'half' },
      { kind: 'field', field: 'variableCostPerSale', span: 'full' },
    ],
  },
  {
    id: 'monthlyCosts',
    rows: [
      { kind: 'field', field: 'monthlyRent', span: 'full' },
      { kind: 'payroll' },
      { kind: 'field', field: 'otherMonthlyOpex', span: 'full' },
    ],
  },
  {
    id: 'capex',
    rows: [{ kind: 'field', field: 'initialCapex', span: 'full' }],
  },
]

export const STATE_OPTIONS: ReadonlyArray<{ code: UsState; name: string }> = Object.entries(
  US_STATE_NAMES,
)
  .map(([code, name]) => ({ code: code as UsState, name }))
  .sort((a, b) => a.name.localeCompare(b.name))

/** The table rate for a state, formatted as the percentage the field shows (e.g. `8.99`). */
export function stateTaxRatePercent(state: UsState): string {
  return (US_SALES_TAX_RATES[state] * 100).toString()
}

/**
 * `8 people × $4,500 = $36,000` beneath the payroll row. The result table
 * shows "Payroll" as one line; without this the form is the only place the
 * user has to do that multiplication in their head.
 */
export function payrollHint(form: FormValues): string | null {
  const count = parseNumber(form.employeeCount)
  const perEmployee = parseNumber(form.averageEmployeeMonthlyCost)
  if (count.status !== 'ok' || perEmployee.status !== 'ok') return null
  const payroll = resolveMonthlyPayroll({
    employeeCount: count.value,
    averageEmployeeMonthlyCost: perEmployee.value,
  })
  return COPY.payrollHint(
    `${formatCount(count.value)} ${FIELD_UNITS.employeeCount}`,
    formatUsd(perEmployee.value),
    formatUsd(payroll),
  )
}

/**
 * Rent + payroll + other monthly opex, as a number.
 *
 * **Deliberately not the engine's `fixedCost`**, which also carries the CAPEX
 * recovery allocation. Initial investment is its own input group and must not
 * inflate a figure labelled "monthly expenses".
 */
export function monthlyCostsTotalValue(form: QuickFormState): number | null {
  const rent = parseNumber(form.monthlyRent)
  const count = parseNumber(form.employeeCount)
  const perEmployee = parseNumber(form.averageEmployeeMonthlyCost)
  const otherOpex = parseNumber(form.otherMonthlyOpex)
  if (
    rent.status !== 'ok' ||
    count.status !== 'ok' ||
    perEmployee.status !== 'ok' ||
    otherOpex.status !== 'ok'
  ) {
    return null
  }
  const payroll = resolveMonthlyPayroll({
    employeeCount: count.value,
    averageEmployeeMonthlyCost: perEmployee.value,
  })
  return rent.value + payroll + otherOpex.value
}

export function monthlyCostsTotal(form: QuickFormState): string | null {
  const total = monthlyCostsTotalValue(form)
  return total === null ? null : formatUsd(total)
}

export type EvaluateFormResult =
  | { ok: true; view: QuickView }
  | { ok: false; errors: Partial<Record<FormErrorField, string>> }

function toRawInput(form: QuickFormState): QuickCalculationInput {
  const raw: QuickCalculationInput = {}
  for (const field of PRIMARY_FIELDS) {
    const parsed = parseNumber(form[field])
    if (parsed.status === 'empty') raw[field] = undefined
    else if (parsed.status === 'invalid') raw[field] = Number.NaN
    else raw[field] = parsed.value
  }
  for (const field of SECONDARY_FIELDS) {
    const parsed = parseNumber(form[field])
    if (parsed.status === 'empty') continue
    if (parsed.status === 'invalid') raw[field] = Number.NaN
    else raw[field] = PERCENT_FIELDS.has(field) ? parsed.value / 100 : parsed.value
  }
  raw.usState = form.usState === '' ? undefined : form.usState
  const taxParsed = parseNumber(form.salesTaxRate)
  if (taxParsed.status === 'ok') raw.salesTaxRate = taxParsed.value / 100
  else if (taxParsed.status === 'invalid') raw.salesTaxRate = Number.NaN
  return raw
}

function formatLimit(field: keyof typeof FIELD_UNITS, limit: number): string {
  const unit = FIELD_UNITS[field]
  if (unit === 'USD') return formatUsd(limit)
  if (unit === '%') return formatPercent(limit)
  return `${formatCount(limit)} ${unit}`
}

export function errorMessage(error: ValidationError): string {
  if (error.code === 'required') return ERROR_COPY.required
  if (error.code === 'not_a_number') return ERROR_COPY.notANumber
  if (error.code === 'invalid_value' || error.field === 'usState') return ERROR_COPY.invalidValue
  if (error.limit === undefined) return ERROR_COPY.notANumber
  if (error.code === 'below_min') {
    if (error.limit === 0) return ERROR_COPY.exclusiveZero
    return ERROR_COPY.belowMin(formatLimit(error.field, error.limit))
  }
  return ERROR_COPY.aboveMax(formatLimit(error.field, error.limit))
}

export { FIELD_UNITS }

export type { FieldUnit }

export function evaluateForm(form: QuickFormState): EvaluateFormResult {
  const validated = validateQuickInput(toRawInput(form))
  if (!validated.ok) {
    const errors: Partial<Record<FormErrorField, string>> = {}
    for (const error of validated.errors) {
      if (errors[error.field] === undefined) errors[error.field] = errorMessage(error)
    }
    return { ok: false, errors }
  }

  const result = calculateQuick(validated.input)
  const simulation = simulateQuick(validated.input)
  return {
    ok: true,
    view: buildQuickView(result, simulation, validated.input.capexRecoveryPeriodMonths),
  }
}

export function allRequiredFilled(form: QuickFormState): boolean {
  return PRIMARY_FIELDS.every((field) => form[field].trim() !== '') && form.usState !== ''
}

const GROUP_HEADINGS: Record<FieldGroupId, string> = {
  sales: COPY.salesGroup,
  monthlyCosts: COPY.monthlyCostsGroup,
  capex: COPY.capexGroup,
}

export function groupHeading(id: FieldGroupId): string {
  return GROUP_HEADINGS[id]
}

/**
 * The figure beside a group heading. Only the monthly-cost group has one —
 * sales inputs do not sum to anything meaningful, and the capex group is a
 * single field that would only repeat itself.
 */
export function groupSummary(form: QuickFormState, id: FieldGroupId): string | null {
  if (id !== 'monthlyCosts') return null
  return monthlyCostsTotal(form) ?? COPY.noValue
}

export function fieldLabel(field: QuickField): string {
  return FIELD_LABELS[field]
}

export function fieldUnit(field: QuickField): FieldUnit {
  return FIELD_UNITS[field]
}

export function fieldHint(field: QuickField): string | undefined {
  if (field === 'averageTicket') return 'Before sales tax, before tip'
  return undefined
}

export function fieldNumberFormat(field: QuickField): {
  grouped: boolean
  maxFractionDigits: number
} {
  if (PERCENT_FIELDS.has(field)) return { grouped: false, maxFractionDigits: 4 }
  if (field === 'operatingDaysPerMonth' || field === 'capexRecoveryPeriodMonths') {
    return { grouped: true, maxFractionDigits: 0 }
  }
  return { grouped: true, maxFractionDigits: 2 }
}

export function fieldLimitHint(field: QuickField): string | undefined {
  const spec = QUICK_US_LIMITS[field]
  if (spec.max !== undefined && (field === 'averageTicket' || field === 'variableCostPerSale')) {
    return ERROR_COPY.aboveMax(formatLimit(field, spec.max))
  }
  return undefined
}

export type AssumptionRow = {
  field: SecondaryInputField
  label: string
  unit: FieldUnit
  placeholder: string
  valueFormatted: string
  source: 'user' | 'default'
}

export function assumptionPlaceholder(field: SecondaryInputField): string {
  const stored = QUICK_US_DEFAULTS[field]
  return (PERCENT_FIELDS.has(field) ? stored * 100 : stored).toString()
}

export function assumptionRows(form: FormValues): AssumptionRow[] {
  return SECONDARY_FIELDS.map((field) => {
    const parsed = parseNumber(form[field])
    const source = parsed.status === 'ok' ? 'user' : 'default'
    const stored =
      parsed.status === 'ok'
        ? PERCENT_FIELDS.has(field)
          ? parsed.value / 100
          : parsed.value
        : QUICK_US_DEFAULTS[field]
    const unit = FIELD_UNITS[field]
    return {
      field,
      label: FIELD_LABELS[field],
      unit,
      placeholder: assumptionPlaceholder(field),
      valueFormatted: PERCENT_FIELDS.has(field)
        ? formatPercentValue(stored * 100)
        : `${formatCount(stored)} ${unit}`,
      source,
    }
  })
}
