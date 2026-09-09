import { describe, expect, it } from 'vitest'
import { calculateDetailed } from './calculate.ts'
import type { DetailedInput } from './types.ts'
import { validateDetailedInput } from './validate.ts'

const MINIMAL_RAW: DetailedInput = {
  usState: 'OR', // 0% planning rate
  products: [{ id: 'p1', name: 'Coffee', normalPrice: 4, onlinePrice: 5, dailyQuantity: 100, unitProductCost: 1 }],
  // Default channelMix has delivery > 0, which makes delivery.mode required.
  delivery: { mode: 'platformOnly' },
}

function resolve(overrides: DetailedInput = {}) {
  const result = validateDetailedInput({ ...MINIMAL_RAW, ...overrides })
  if (!result.ok) throw new Error(`must be valid: ${JSON.stringify(result.errors)}`)
  return result.input
}

describe('edge cases (US_DETAILED_FINANCIAL_SPEC §13)', () => {
  it('reports the zero-sales edge behavior when every product has dailyQuantity 0', () => {
    const input = resolve({
      products: [{ id: 'p1', name: 'Coffee', normalPrice: 4, onlinePrice: 5, dailyQuantity: 0, unitProductCost: 1 }],
    })
    const result = calculateDetailed(input)
    const base = result.scenarios.base.stabilizedMonth
    expect(base.netRevenue).toBe(0)
    expect(base.totalVariableCost).toBe(0)
    expect(base.monthlyOperatingResult).toBeCloseTo(-base.monthlyFixedCost, 9)
    expect(result.breakEven).toEqual({ available: false, reason: 'no_sales_volume' })
  })

  it('rejects an empty product list rather than computing a zero-product month', () => {
    const result = validateDetailedInput({ ...MINIMAL_RAW, products: [] })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toContainEqual({ path: ['products'], code: 'empty_products' })
  })

  it('reports non_positive_contribution when unit contribution is negative everywhere', () => {
    const input = resolve({
      products: [
        { id: 'p1', name: 'Loss leader', normalPrice: 1, onlinePrice: 1, dailyQuantity: 50, unitProductCost: 5 },
      ],
    })
    const result = calculateDetailed(input)
    expect(result.breakEven).toEqual({ available: false, reason: 'non_positive_contribution' })
  })

  it('returns payback { month: 0 } when totalInitialInvestment is 0', () => {
    const input = resolve({ capexItems: [] })
    const result = calculateDetailed(input)
    for (const scenario of Object.values(result.scenarios)) {
      expect(scenario.payback).toEqual({ available: true, month: 0, cumulativeAtPayback: 0 })
    }
  })

  it('resolves non_positive_operating_result when payback is never reached and the stabilized result is a loss', () => {
    const input = resolve({
      products: [
        { id: 'p1', name: 'Coffee', normalPrice: 4, onlinePrice: 5, dailyQuantity: 1, unitProductCost: 1 },
      ],
      capexItems: [{ id: 'c1', name: 'Build-out', amount: 500_000 }],
      occupancy: { monthlyRent: 5_000 },
    })
    const result = calculateDetailed(input)
    expect(result.scenarios.base.stabilizedMonth.monthlyOperatingResult).toBeLessThan(0)
    expect(result.scenarios.base.payback).toEqual({ available: false, reason: 'non_positive_operating_result' })
  })

  it('gives delivery zero platform fee when platformFeeRate is 0, but still charges COGS and channel variable cost', () => {
    const input = resolve({
      channelMix: { dineIn: 0, takeaway: 0, delivery: 1 },
      delivery: { mode: 'platformOnly', platformFeeRate: 0 },
      packaging: { deliveryPerOrder: 0.5 },
    })
    const result = calculateDetailed(input)
    const delivery = result.scenarios.base.stabilizedMonth.byChannel.delivery
    expect(delivery.paymentPlatformFee).toBe(0)
    expect(delivery.productCogs).toBeGreaterThan(0)
    expect(delivery.channelVariableCost).toBeGreaterThan(0)
  })

  it('forces ownCourierCostPerDeliveryOrder to exactly 0 under platformCourier', () => {
    const input = resolve({
      delivery: { mode: 'platformCourier', platformFeeRate: 0.3, ownCourierCostPerDeliveryOrder: 2 },
    })
    expect(input.delivery.ownCourierCostPerDeliveryOrder).toBe(0)
  })

  it('keeps rentCost at exactly 0 when monthlyRent is 0', () => {
    const input = resolve({ occupancy: { monthlyRent: 0, monthlyCAM: 200 } })
    const result = calculateDetailed(input)
    expect(result.scenarios.base.stabilizedMonth.rentCost).toBe(0)
  })

  it('contributes 0 everywhere for a channel mix component of 0, without dividing by it', () => {
    const input = resolve({ channelMix: { dineIn: 1, takeaway: 0, delivery: 0 } })
    const result = calculateDetailed(input)
    const takeaway = result.scenarios.base.stabilizedMonth.byChannel.takeaway
    expect(takeaway.units).toBe(0)
    expect(takeaway.netRevenue).toBe(0)
    expect(Number.isFinite(takeaway.contribution)).toBe(true)
  })

  it('makes delivery.mode inert at a 0 delivery share, without requiring it', () => {
    const noMode = validateDetailedInput({ ...MINIMAL_RAW, channelMix: { dineIn: 1, takeaway: 0, delivery: 0 } })
    const withMode = validateDetailedInput({
      ...MINIMAL_RAW,
      channelMix: { dineIn: 1, takeaway: 0, delivery: 0 },
      delivery: { mode: 'platformCourier' },
    })
    expect(noMode.ok).toBe(true)
    expect(withMode.ok).toBe(true)
    if (!noMode.ok || !withMode.ok) return

    expect(noMode.input.delivery.mode).toBe('platformOnly')

    const noModeResult = calculateDetailed(noMode.input)
    const withModeResult = calculateDetailed(withMode.input)
    expect(noModeResult.scenarios.base.stabilizedMonth.byChannel.delivery).toEqual(
      withModeResult.scenarios.base.stabilizedMonth.byChannel.delivery,
    )
  })

  it('requires delivery.mode when channelMix.delivery > 0', () => {
    const result = validateDetailedInput({
      ...MINIMAL_RAW,
      delivery: undefined,
      channelMix: { dineIn: 0.5, takeaway: 0, delivery: 0.5 },
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toContainEqual({ path: ['delivery', 'mode'], code: 'required' })
  })

  it('never returns NaN or Infinity across a spread of extreme inputs', () => {
    const samples = [
      resolve(),
      resolve({ products: [{ id: 'p1', name: 'X', normalPrice: 0.01, onlinePrice: 0.01, dailyQuantity: 0.1, unitProductCost: 0 }] }),
      resolve({
        products: [{ id: 'p1', name: 'X', normalPrice: 999, onlinePrice: 999, dailyQuantity: 99_999, unitProductCost: 999 }],
        occupancy: { monthlyRent: 499_999, monthlyCAM: 499_999 },
        positions: [{ id: 'x', name: 'X', headcount: 500, monthlyCostPerPerson: 49_999 }],
        capexItems: [{ id: 'c', name: 'X', amount: 4_999_999 }],
      }),
      resolve({ salesTaxRate: 0.5, posCommissionRate: 0.1, delivery: { mode: 'platformOnly', platformFeeRate: 0.6 } }),
    ]

    for (const input of samples) {
      const result = calculateDetailed(input)
      const numbers: number[] = []
      function collect(value: unknown) {
        if (typeof value === 'number') numbers.push(value)
        else if (value !== null && typeof value === 'object') Object.values(value).forEach(collect)
      }
      collect(result)
      expect(numbers.length).toBeGreaterThan(0)
      for (const n of numbers) expect(Number.isFinite(n)).toBe(true)
    }
  })

  it('never throws for valid resolved input', () => {
    const samples = [resolve(), resolve({ capexItems: [] }), resolve({ occupancy: { monthlyRent: 0 } })]
    for (const input of samples) {
      expect(() => calculateDetailed(input)).not.toThrow()
    }
  })

  it('is deterministic', () => {
    const input = resolve()
    expect(calculateDetailed(input)).toEqual(calculateDetailed(input))
  })
})
