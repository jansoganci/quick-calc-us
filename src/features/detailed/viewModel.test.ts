import { describe, expect, it } from 'vitest'
import { emptyProduct, initialForm, type DetailedFormState } from './formState.ts'
import { COPY } from './labels.ts'
import { evaluateDetailed } from './viewModel.ts'

/**
 * `evaluateDetailed` plumbing tests: form strings in, a formatted
 * `DetailedView` out. `core/detailed-us/**` owns formula correctness (its
 * own golden vector); this file owns the form layer — percentage-string
 * conversion, required-section gating, and the view's structural shape.
 */

function formWith(mutate: (draft: DetailedFormState) => void): DetailedFormState {
  const form = initialForm()
  mutate(form)
  return form
}

/** One product, priced so the base scenario is comfortably profitable. */
function viableForm(mutate: (draft: DetailedFormState) => void = () => {}): DetailedFormState {
  return formWith((draft) => {
    draft.usState = 'CA'
    draft.salesTaxRate = '8.99'
    draft.products = [{ ...emptyProduct(), name: 'Latte', normalPrice: '5.50', onlinePrice: '6.15', dailyQuantity: '220', unitProductCost: '1.10' }]
    draft.delivery.mode = 'platformOnly'
    draft.occupancy.monthlyRent = '4500'
    draft.capexItems = [{ id: 'c1', name: 'Espresso machine', amount: '18000' }]
    mutate(draft)
  })
}

describe('evaluateDetailed', () => {
  it('produces a view for a complete, viable form', () => {
    const result = evaluateDetailed(viableForm())
    expect(result.ok).toBe(true)
  })

  it('refuses the empty starting form, because products are required', () => {
    const result = evaluateDetailed(initialForm())
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errorSections).toContain('products')
  })

  it('refuses a form with no state selected', () => {
    const result = evaluateDetailed(viableForm((draft) => (draft.usState = '')))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errorSections).toContain('jurisdiction')
  })
})

describe('percentage inputs reach the engine as fractions', () => {
  it('converts a typed POS commission of 3.59 to a 3.6% assumption row', () => {
    const result = evaluateDetailed(viableForm((draft) => (draft.posCommissionRate = '3.59')))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const posRow = result.view.assumptions.find((row) => row.label === COPY.posCommission)
    expect(posRow?.value).toBe('3.6%')
  })

  it('keeps the three annual rates in the assumptions block even when they are 0%', () => {
    const result = evaluateDetailed(viableForm())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    for (const label of [COPY.salesPriceAnnualIncrease, COPY.productCogsAnnualIncrease, COPY.fixedCostAnnualIncrease]) {
      const row = result.view.assumptions.find((entry) => entry.label === label)
      expect(row, `${label} missing from the assumptions block`).toBeDefined()
      expect(row?.value).toBe('0.0%')
    }
  })
})

describe('the reconciliation bar closes exactly', () => {
  it('sums its segment widths to 100%', () => {
    const result = evaluateDetailed(viableForm())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const total = result.view.breakdown.rows.reduce((sum, row) => sum + row.widthPercent, 0)
    expect(total).toBeCloseTo(100, 8)
  })

  it('drops the closing segment and captions the overrun when the result is negative', () => {
    const result = evaluateDetailed(
      viableForm((draft) => {
        draft.products[0]!.dailyQuantity = '2'
        draft.occupancy.monthlyRent = '50000'
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.breakdown.isDeficit).toBe(true)
    expect(result.view.breakdown.deficitCaption).toBeTruthy()
    const resultRow = result.view.breakdown.rows.find((row) => row.key === 'operatingResult')
    expect(resultRow?.widthPercent).toBe(0)
    expect(resultRow?.amount.startsWith('-')).toBe(true)
  })
})

describe('guardrails', () => {
  it('warns when the owner is drawn a salary alongside staffed positions', () => {
    const result = evaluateDetailed(
      viableForm((draft) => {
        draft.owner.monthlyDraw = '4000'
        draft.positions = [{ id: 'p1', name: 'Barista', headcount: '2', monthlyCostPerPerson: '3200' }]
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.guardrails.some((guardrail) => guardrail.id === 'owner-not-an-employee')).toBe(true)
  })

  it('carries no guardrails for a form with no staff and no owner draw', () => {
    const result = evaluateDetailed(viableForm())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.guardrails).toHaveLength(0)
  })
})

describe('report and copy text', () => {
  it('rides the same reportInputs the printed appendix reads', () => {
    const result = evaluateDetailed(viableForm())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.reportInputs.some((group) => group.section === 'products')).toBe(true)
    expect(result.view.reportInputs.some((group) => group.section === 'assumptions')).toBe(false)
  })

  it('builds a copy-summary string carrying the headline figures', () => {
    const result = evaluateDetailed(viableForm())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.copyText).toContain(COPY.monthlyOperatingResult)
    expect(result.view.copyText).toContain(COPY.totalInitialInvestment)
  })
})
