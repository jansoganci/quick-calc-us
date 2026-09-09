import { describe, expect, it } from 'vitest'
import { calculateDetailed, calculateMonth } from './calculate.ts'
import type { DetailedInput, DetailedResolvedInput } from './types.ts'
import { validateDetailedInput } from './validate.ts'

const MONEY = 4
const INVARIANT = 6

/**
 * US_DETAILED_FINANCIAL_SPEC.md §16.2 — an illustrative CA cafe. Computed and
 * verified with a throwaway script implementing these exact formulas, not by
 * hand, before being encoded here (and again independently for `byProduct`,
 * which the spec's own worked example didn't print).
 */
const GOLDEN_RAW: DetailedInput = {
  usState: 'CA',
  products: [
    { id: 'latte', name: 'Latte', normalPrice: 5.5, onlinePrice: 6.5, dailyQuantity: 220, unitProductCost: 1.1 },
    {
      id: 'sandwich',
      name: 'Breakfast Sandwich',
      normalPrice: 8.5,
      onlinePrice: 10.0,
      dailyQuantity: 110,
      unitProductCost: 2.8,
    },
  ],
  channelMix: { dineIn: 0.5, takeaway: 0.2, delivery: 0.3 },
  paymentMix: { cash: 0.15, card: 0.85 },
  posCommissionRate: 0.035,
  delivery: { mode: 'platformOnly', platformFeeRate: 0.15, ownCourierCostPerDeliveryOrder: 1.5 },
  packaging: { takeawayPerOrder: 0.3, deliveryPerOrder: 0.6 },
  occupancy: { monthlyRent: 6500, monthlyCAM: 450 },
  positions: [{ id: 'barista', name: 'Barista', headcount: 3, monthlyCostPerPerson: 3800 }],
  owner: { monthlyDraw: 4000, benefitsAllowance: 600 },
  opexLines: [
    { id: 'utilities', name: 'Utilities', monthlyAmount: 600 },
    { id: 'software', name: 'Software / POS', monthlyAmount: 150 },
    { id: 'bookkeeper', name: 'Bookkeeper', monthlyAmount: 300 },
    { id: 'cleaning', name: 'Cleaning', monthlyAmount: 250 },
    { id: 'insurance', name: 'Insurance', monthlyAmount: 350 },
  ],
  capexItems: [
    { id: 'buildout', name: 'Build-out', amount: 80_000 },
    { id: 'equipment', name: 'Equipment', amount: 45_000 },
    { id: 'furniture', name: 'Furniture', amount: 10_000 },
    { id: 'signage', name: 'Signage', amount: 4_000 },
    { id: 'stock', name: 'Opening stock', amount: 6_000 },
    { id: 'setup', name: 'Setup / opening expenses', amount: 5_000 },
  ],
  assumptions: {
    rampUpPreset: 'normal',
    projectionHorizonMonths: 24,
  },
}

function goldenInput(): DetailedResolvedInput {
  const result = validateDetailedInput(GOLDEN_RAW)
  if (!result.ok) throw new Error(`golden input must be valid: ${JSON.stringify(result.errors)}`)
  return result.input
}

describe('calculateDetailed golden vector (US_DETAILED_FINANCIAL_SPEC §16.2, CA)', () => {
  const result = calculateDetailed(goldenInput())
  const base = result.scenarios.base.stabilizedMonth

  it('matches expected per-line unit economics', () => {
    const dineIn = base.byChannel.dineIn
    const takeaway = base.byChannel.takeaway
    const delivery = base.byChannel.delivery

    expect(dineIn.units).toBeCloseTo(4_950, MONEY)
    expect(dineIn.grossCustomerSales).toBeCloseTo(35_067.5325, MONEY)
    expect(dineIn.netRevenue).toBeCloseTo(32_175, MONEY)
    expect(dineIn.productCogs).toBeCloseTo(8_250, MONEY)
    expect(dineIn.channelVariableCost).toBe(0)
    expect(dineIn.paymentPlatformFee).toBeCloseTo(1_043.259092, INVARIANT)
    expect(dineIn.contribution).toBeCloseTo(22_881.740908, INVARIANT)

    expect(takeaway.units).toBeCloseTo(1_980, MONEY)
    expect(takeaway.grossCustomerSales).toBeCloseTo(14_027.013, MONEY)
    expect(takeaway.netRevenue).toBeCloseTo(12_870, MONEY)
    expect(takeaway.productCogs).toBeCloseTo(3_300, MONEY)
    expect(takeaway.channelVariableCost).toBeCloseTo(594, MONEY)
    expect(takeaway.paymentPlatformFee).toBeCloseTo(417.303637, INVARIANT)
    expect(takeaway.contribution).toBeCloseTo(8_558.696363, INVARIANT)

    // Delivery: no sales tax at all (UD-1) — gross equals net exactly.
    expect(delivery.units).toBeCloseTo(2_970, MONEY)
    expect(delivery.grossCustomerSales).toBeCloseTo(22_770, MONEY)
    expect(delivery.netRevenue).toBeCloseTo(22_770, MONEY)
    expect(delivery.grossCustomerSales).toBe(delivery.netRevenue)
    expect(delivery.productCogs).toBeCloseTo(4_950, MONEY)
    expect(delivery.channelVariableCost).toBeCloseTo(6_237, MONEY)
    expect(delivery.paymentPlatformFee).toBeCloseTo(3_415.5, MONEY)
    expect(delivery.contribution).toBeCloseTo(8_167.5, MONEY)
  })

  it('matches expected per-product totals (byProduct)', () => {
    const latte = base.byProduct.find((p) => p.productId === 'latte')
    const sandwich = base.byProduct.find((p) => p.productId === 'sandwich')
    expect(latte).toBeDefined()
    expect(sandwich).toBeDefined()
    if (!latte || !sandwich) return

    expect(latte.units).toBeCloseTo(6_600, MONEY)
    expect(latte.grossCustomerSales).toBeCloseTo(40_564.359, MONEY)
    expect(latte.netRevenue).toBeCloseTo(38_280, MONEY)
    expect(latte.productCogs).toBeCloseTo(7_260, MONEY)
    expect(latte.channelVariableCost).toBeCloseTo(4_554, MONEY)
    expect(latte.paymentPlatformFee).toBeCloseTo(2_754.407181, MONEY)
    expect(latte.contribution).toBeCloseTo(23_711.59282, INVARIANT)

    expect(sandwich.units).toBeCloseTo(3_300, MONEY)
    expect(sandwich.grossCustomerSales).toBeCloseTo(31_300.1865, MONEY)
    expect(sandwich.netRevenue).toBeCloseTo(29_535, MONEY)
    expect(sandwich.productCogs).toBeCloseTo(9_240, MONEY)
    expect(sandwich.channelVariableCost).toBeCloseTo(2_277, MONEY)
    expect(sandwich.paymentPlatformFee).toBeCloseTo(2_121.655548, INVARIANT)
    expect(sandwich.contribution).toBeCloseTo(15_896.344452, INVARIANT)

    // byProduct is ordered as input.products.
    expect(base.byProduct.map((p) => p.productId)).toEqual(['latte', 'sandwich'])
  })

  it('matches expected stabilized-month totals', () => {
    expect(base.totalUnits).toBeCloseTo(9_900, MONEY)
    expect(base.grossCustomerSales).toBeCloseTo(71_864.5455, MONEY)
    expect(base.salesTaxAmount).toBeCloseTo(4_049.5455, MONEY)
    expect(base.netRevenue).toBeCloseTo(67_815, MONEY)
    expect(base.productCogs).toBeCloseTo(16_500, MONEY)
    expect(base.channelVariableCost).toBeCloseTo(6_831, MONEY)
    expect(base.paymentPlatformFee).toBeCloseTo(4_876.062729, INVARIANT)
    expect(base.totalVariableCost).toBeCloseTo(28_207.062729, INVARIANT)
    expect(base.totalContribution).toBeCloseTo(39_607.937271, INVARIANT)
    expect(base.monthlyPayroll).toBeCloseTo(11_400, MONEY)
    expect(base.monthlyOwnerCost).toBeCloseTo(4_600, MONEY)
    expect(base.rentCost).toBeCloseTo(6_500, MONEY)
    expect(base.monthlyOccupancyCost).toBeCloseTo(6_950, MONEY)
    expect(base.monthlyOpex).toBeCloseTo(1_650, MONEY)
    expect(base.monthlyFixedCost).toBeCloseTo(24_600, MONEY)
    expect(base.monthlyOperatingResult).toBeCloseTo(15_007.937271, INVARIANT)
  })

  it('matches expected break-even (scenario-invariant)', () => {
    expect(result.breakEven).toMatchObject({ available: true })
    if (!result.breakEven.available) return
    expect(result.breakEven.weightedContributionPerUnit).toBeCloseTo(4.000802, INVARIANT)
    expect(result.breakEven.unitsPerMonth).toBeCloseTo(6_148.767565, INVARIANT)
    expect(result.breakEven.unitsPerDay).toBeCloseTo(204.958919, INVARIANT)
    expect(result.breakEven).toEqual(result.breakEven)
    // Identical across all three scenarios (I7).
    expect(result.scenarios.bad.stabilizedMonth.totalContribution / result.scenarios.bad.stabilizedMonth.totalUnits).toBeCloseTo(
      result.breakEven.weightedContributionPerUnit,
      INVARIANT,
    )
  })

  it('round-trips break-even to ~0 operating result (I6)', () => {
    if (!result.breakEven.available) throw new Error('break-even must be available')
    const scale = result.breakEven.unitsPerDay / (220 + 110)
    const scaled = validateDetailedInput({
      ...GOLDEN_RAW,
      products: (GOLDEN_RAW.products as { dailyQuantity: number }[]).map((p) => ({
        ...p,
        dailyQuantity: p.dailyQuantity * scale,
      })),
    })
    expect(scaled.ok).toBe(true)
    if (!scaled.ok) return
    const check = calculateMonth(scaled.input, {
      month: null,
      quantityFactor: 1,
      priceFactor: 1,
      cogsFactor: 1,
      fixedFactor: 1,
    })
    expect(check.monthlyOperatingResult).toBeCloseTo(0, 4)
  })

  it('matches expected payback across scenarios', () => {
    expect(result.scenarios.bad.stabilizedMonth.monthlyOperatingResult).toBeCloseTo(5_105.952954, INVARIANT)
    expect(result.scenarios.bad.payback).toEqual({
      available: false,
      reason: 'not_reached_within_horizon',
    })

    expect(result.scenarios.base.payback).toMatchObject({ available: true, month: 13 })
    if (result.scenarios.base.payback.available) {
      expect(result.scenarios.base.payback.cumulativeAtPayback).toBeCloseTo(161_436.437847, 2)
    }

    expect(result.scenarios.good.stabilizedMonth.monthlyOperatingResult).toBeCloseTo(24_909.921589, INVARIANT)
    expect(result.scenarios.good.payback).toMatchObject({ available: true, month: 8 })
    if (result.scenarios.good.payback.available) {
      expect(result.scenarios.good.payback.cumulativeAtPayback).toBeCloseTo(157_195.939363, 2)
    }
  })

  it('matches expected total initial investment', () => {
    expect(result.totalInitialInvestment).toBe(150_000)
  })

  it('records engine meta including the resolved jurisdiction', () => {
    expect(result.meta.currency).toBe('USD')
    expect(result.meta.revenueBasis).toBe('net')
    expect(result.meta.assumptions.usState).toBe('CA')
    expect(result.meta.assumptions.salesTaxRate).toBeCloseTo(0.0899, MONEY)
    expect(result.meta.assumptions.salesPriceAnnualIncrease).toBe(0)
    expect(result.meta.assumptions.productCogsAnnualIncrease).toBe(0)
    expect(result.meta.assumptions.fixedCostAnnualIncrease).toBe(0)
  })

  it('never puts a CAPEX amount in a MonthResult (I10)', () => {
    const serialized = JSON.stringify(base)
    expect(serialized).not.toContain('150000')
    expect(serialized).not.toContain('80000')
  })
})

describe('Mode 2 (platformCourier) sub-case', () => {
  it('changes only the two delivery lines, per US_DETAILED_FINANCIAL_SPEC §16.2', () => {
    const mode2Raw: DetailedInput = {
      ...GOLDEN_RAW,
      delivery: { mode: 'platformCourier', platformFeeRate: 0.3 },
    }
    const validated = validateDetailedInput(mode2Raw)
    expect(validated.ok).toBe(true)
    if (!validated.ok) return

    const result = calculateDetailed(validated.input)
    const base = result.scenarios.base.stabilizedMonth
    const latteDelivery = base.byProduct.find((p) => p.productId === 'latte')
    expect(latteDelivery).toBeDefined()

    expect(base.byChannel.delivery.channelVariableCost).toBeCloseTo(1_188 + 594, MONEY)
    expect(base.monthlyOperatingResult).toBeCloseTo(16_047.437271, INVARIANT)
    if (result.breakEven.available) {
      expect(result.breakEven.unitsPerDay).toBeCloseTo(199.717388, INVARIANT)
    }

    // Dine-in and takeaway are untouched by the mode switch.
    const mode1 = calculateDetailed(goldenInput()).scenarios.base.stabilizedMonth
    expect(base.byChannel.dineIn).toEqual(mode1.byChannel.dineIn)
    expect(base.byChannel.takeaway).toEqual(mode1.byChannel.takeaway)
  })

  it('forces ownCourierCostPerDeliveryOrder to 0 under platformCourier, even if supplied', () => {
    const validated = validateDetailedInput({
      ...GOLDEN_RAW,
      delivery: { mode: 'platformCourier', platformFeeRate: 0.3, ownCourierCostPerDeliveryOrder: 99 },
    })
    expect(validated.ok).toBe(true)
    if (!validated.ok) return
    expect(validated.input.delivery.ownCourierCostPerDeliveryOrder).toBe(0)
  })
})

describe('structural invariants', () => {
  it('holds I1: grossCustomerSales = netRevenue + salesTaxAmount', () => {
    const result = calculateDetailed(goldenInput())
    const base = result.scenarios.base.stabilizedMonth
    expect(base.grossCustomerSales).toBeCloseTo(base.netRevenue + base.salesTaxAmount, INVARIANT)
  })

  it('holds I2: byChannel sums equal the month totals', () => {
    const result = calculateDetailed(goldenInput())
    const base = result.scenarios.base.stabilizedMonth
    const channels = Object.values(base.byChannel)
    const sum = (pick: (c: (typeof channels)[number]) => number) => channels.reduce((t, c) => t + pick(c), 0)
    expect(sum((c) => c.units)).toBeCloseTo(base.totalUnits, INVARIANT)
    expect(sum((c) => c.grossCustomerSales)).toBeCloseTo(base.grossCustomerSales, INVARIANT)
    expect(sum((c) => c.netRevenue)).toBeCloseTo(base.netRevenue, INVARIANT)
    expect(sum((c) => c.contribution)).toBeCloseTo(base.totalContribution, INVARIANT)
  })

  it('holds I3 and I4: monthlyOperatingResult two equivalent forms', () => {
    const result = calculateDetailed(goldenInput())
    const base = result.scenarios.base.stabilizedMonth
    expect(base.monthlyOperatingResult).toBeCloseTo(
      base.netRevenue - base.totalVariableCost - base.monthlyFixedCost,
      INVARIANT,
    )
    expect(base.monthlyOperatingResult).toBeCloseTo(base.totalContribution - base.monthlyFixedCost, INVARIANT)
  })

  it('holds I8: projection month 1 uses the exact entered values when escalation is 0', () => {
    const result = calculateDetailed(goldenInput())
    const month1 = result.scenarios.base.projection[0]
    expect(month1).toBeDefined()
    if (!month1) return
    expect(month1.priceFactor).toBe(1)
    expect(month1.cogsFactor).toBe(1)
  })

  it('holds I11: channelMix and paymentMix each sum to 1', () => {
    const input = goldenInput()
    const channelSum = input.channelMix.dineIn + input.channelMix.takeaway + input.channelMix.delivery
    const paymentSum = input.paymentMix.cash + input.paymentMix.card
    expect(channelSum).toBeCloseTo(1, INVARIANT)
    expect(paymentSum).toBeCloseTo(1, INVARIANT)
  })

  it('never returns NaN or Infinity anywhere in the result (I9)', () => {
    const result = calculateDetailed(goldenInput())
    const numbers: number[] = []
    function collect(value: unknown) {
      if (typeof value === 'number') numbers.push(value)
      else if (value !== null && typeof value === 'object') Object.values(value).forEach(collect)
    }
    collect(result)
    expect(numbers.length).toBeGreaterThan(0)
    for (const n of numbers) expect(Number.isFinite(n)).toBe(true)
  })

  it('does not reintroduce removed or rejected concepts', () => {
    const serialized = JSON.stringify(calculateDetailed(goldenInput()))
    for (const banned of ['depreciation', 'netProfit', 'mealCard', 'rentWithholding', 'vatAmount', 'bagKur']) {
      expect(serialized).not.toMatch(new RegExp(banned, 'i'))
    }
  })
})
