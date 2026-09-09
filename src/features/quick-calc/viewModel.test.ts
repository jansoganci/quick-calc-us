import { describe, expect, it } from 'vitest'
import { calculateQuick, simulateQuick, validateQuickInput, type ValidationError } from '../../core/quick-us/index.ts'
import { BREAKDOWN_LABELS, COPY, ERROR_COPY } from './labels.ts'
import {
  EMPTY_FORM,
  EXAMPLE_FORM,
  allRequiredFilled,
  assumptionRows,
  buildQuickView,
  errorMessage,
  evaluateForm,
  groupSummary,
  monthlyCostsTotal,
  monthlyCostsTotalValue,
  payrollHint,
  type QuickFormState,
} from './viewModel.ts'

/**
 * `evaluateForm`/`buildQuickView` plumbing tests: form strings in, a
 * formatted `QuickView` out. `core/quick-us/**` owns formula correctness
 * (its own golden vector); this file owns the form layer — parsing,
 * required-field gating, error messages, and the view's structural shape.
 */

const GOLDEN: QuickFormState = {
  ...EMPTY_FORM,
  usState: 'CA',
  averageTicket: '9.50',
  dailySalesVolume: '450',
  variableCostPerSale: '2.80',
  monthlyRent: '6,500',
  otherMonthlyOpex: '2,200',
  employeeCount: '6',
  averageEmployeeMonthlyCost: '3,800',
  initialCapex: '180,000',
}

function referenceView() {
  const validated = validateQuickInput({
    usState: 'CA',
    averageTicket: 9.5,
    dailySalesVolume: 450,
    variableCostPerSale: 2.8,
    monthlyRent: 6_500,
    otherMonthlyOpex: 2_200,
    employeeCount: 6,
    averageEmployeeMonthlyCost: 3_800,
    initialCapex: 180_000,
  })
  if (!validated.ok) throw new Error(`GOLDEN must validate: ${JSON.stringify(validated.errors)}`)
  const result = calculateQuick(validated.input)
  const simulation = simulateQuick(validated.input)
  return buildQuickView(result, simulation, validated.input.capexRecoveryPeriodMonths)
}

describe('EXAMPLE_FORM', () => {
  it('fills every required field so Calculate is enabled on load', () => {
    expect(allRequiredFilled(EXAMPLE_FORM)).toBe(true)
  })

  it('leaves the secondary assumptions empty so the engine defaults apply', () => {
    expect(EXAMPLE_FORM.operatingDaysPerMonth).toBe('')
    expect(EXAMPLE_FORM.capexRecoveryPeriodMonths).toBe('')
    expect(EXAMPLE_FORM.cardPaymentShare).toBe('')
    expect(EXAMPLE_FORM.posCommissionRate).toBe('')
  })

  it('carries a sales tax rate consistent with its seeded state', () => {
    expect(EXAMPLE_FORM.usState).toBe('CA')
    expect(EXAMPLE_FORM.salesTaxRate).not.toBe('')
  })
})

describe('monthly cost group', () => {
  it('withholds the total until every input parses', () => {
    expect(monthlyCostsTotal({ ...GOLDEN, otherMonthlyOpex: '' })).toBeNull()
    expect(monthlyCostsTotal({ ...GOLDEN, monthlyRent: 'abc' })).toBeNull()
    expect(payrollHint({ ...GOLDEN, employeeCount: '' })).toBeNull()
  })

  it('sums rent, payroll and other opex — not the engine fixed cost, which also carries capex recovery', () => {
    // 6,500 rent + 6 × 3,800 payroll + 2,200 other = 31,500.
    expect(monthlyCostsTotalValue(GOLDEN)).toBe(31_500)

    const validated = validateQuickInput({
      usState: 'CA',
      averageTicket: 9.5,
      dailySalesVolume: 450,
      variableCostPerSale: 2.8,
      monthlyRent: 6_500,
      otherMonthlyOpex: 2_200,
      employeeCount: 6,
      averageEmployeeMonthlyCost: 3_800,
      initialCapex: 180_000,
    })
    expect(validated.ok).toBe(true)
    if (!validated.ok) return
    const { monthly } = calculateQuick(validated.input)
    expect(monthlyCostsTotalValue(GOLDEN)).toBeLessThan(monthly.fixedCost)
  })

  it('states the payroll product beneath the two payroll inputs', () => {
    expect(payrollHint(GOLDEN)).toContain('$22,800')
  })
})

describe('evaluateForm', () => {
  it('returns field errors for the empty form', () => {
    const result = evaluateForm(EMPTY_FORM)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.averageTicket).toBe(ERROR_COPY.required)
    expect(result.errors.dailySalesVolume).toBe(ERROR_COPY.required)
    expect(result.errors.usState).toBe(ERROR_COPY.required)
  })

  it('builds the same view the engine would, for the golden form', () => {
    const result = evaluateForm(GOLDEN)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const expected = referenceView()

    expect(result.view.headline).toBe(expected.headline)
    expect(result.view.bar).toHaveLength(8)
    expect(result.view.bar.reduce((sum, segment) => sum + segment.width, 0)).toBeCloseTo(100, 5)
    expect(result.view.outputs).toHaveLength(4)
    expect(result.view.simulation).toHaveLength(5)
  })

  it('accepts a comma-grouped amount as the same number as its plain form', () => {
    const grouped = evaluateForm(GOLDEN)
    const plain = evaluateForm({ ...GOLDEN, monthlyRent: '6500' })
    expect(grouped.ok && plain.ok).toBe(true)
    if (!grouped.ok || !plain.ok) return
    expect(grouped.view.headline).toBe(plain.view.headline)
  })

  it('keeps the bar at 100% width even when the remaining segment is a loss', () => {
    const result = evaluateForm({ ...GOLDEN, averageTicket: '3' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const remaining = result.view.bar.find((segment) => segment.key === 'remaining')
    expect(remaining?.width).toBe(0)
    expect(result.view.bar.reduce((sum, segment) => sum + segment.width, 0)).toBeCloseTo(100, 5)
  })
})

describe('errorMessage', () => {
  it('uses the exclusive-zero copy for below_min at the limit 0', () => {
    const error: ValidationError = { field: 'averageTicket', code: 'below_min', limit: 0 }
    expect(errorMessage(error)).toBe(ERROR_COPY.exclusiveZero)
  })

  it('formats above_max with the engine limit', () => {
    const error: ValidationError = { field: 'averageTicket', code: 'above_max', limit: 1_000 }
    expect(errorMessage(error)).toBe(ERROR_COPY.aboveMax('$1,000'))
  })
})

describe('assumptionRows', () => {
  it('defaults every secondary assumption when the fields are blank', () => {
    const rows = assumptionRows(GOLDEN)
    expect(rows.every((row) => row.source === 'default')).toBe(true)
  })

  it('marks an edited assumption as user-sourced', () => {
    const rows = assumptionRows({ ...GOLDEN, posCommissionRate: '5' })
    const pos = rows.find((row) => row.field === 'posCommissionRate')
    expect(pos?.source).toBe('user')
    expect(pos?.valueFormatted).toBe('5.0%')
    expect(rows.find((row) => row.field === 'cardPaymentShare')?.source).toBe('default')
  })

  it('feeds an edited operating-days assumption into the monthly figures', () => {
    const base = evaluateForm(GOLDEN)
    const edited = evaluateForm({ ...GOLDEN, operatingDaysPerMonth: '25' })
    expect(base.ok && edited.ok).toBe(true)
    if (!base.ok || !edited.ok) return
    expect(edited.view.outputs[0]?.value).not.toBe(base.view.outputs[0]?.value)
  })
})

describe('groupSummary', () => {
  it('shows the monthly-cost total beside its group heading, and nothing for the others', () => {
    expect(groupSummary(GOLDEN, 'monthlyCosts')).toBe(monthlyCostsTotal(GOLDEN))
    expect(groupSummary(GOLDEN, 'sales')).toBeNull()
    expect(groupSummary(GOLDEN, 'capex')).toBeNull()
  })
})

describe('headline segment typography', () => {
  it('splits the headline into runs that rejoin to the plain string', () => {
    const result = evaluateForm(GOLDEN)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const joined = result.view.headlineSegments.map((segment) => segment.text).join('')
    expect(joined).toBe(result.view.headline)
  })

  it('gives a loss no accent run, since negatives stay free of colour', () => {
    const result = evaluateForm({ ...GOLDEN, averageTicket: '3' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.headlineSegments.some((segment) => segment.tone === 'accent')).toBe(false)
  })
})

describe('breakdown labels', () => {
  it('carries a label for every cost line the bar renders', () => {
    const result = evaluateForm(GOLDEN)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    for (const segment of result.view.bar) {
      expect(segment.label).toBe(BREAKDOWN_LABELS[segment.key])
    }
  })
})

describe('masthead copy', () => {
  it('names the product', () => {
    expect(COPY.productName).toBeTruthy()
  })
})
