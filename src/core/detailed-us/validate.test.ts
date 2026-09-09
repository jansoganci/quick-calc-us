import { describe, expect, it } from 'vitest'
import { DETAILED_US_DEFAULTS } from './defaults.ts'
import { DETAILED_US_LIMITS } from './limits.ts'
import type { DetailedInput } from './types.ts'
import { validateDetailedInput } from './validate.ts'

const VALID: DetailedInput = {
  usState: 'CA',
  products: [{ id: 'p1', name: 'Latte', normalPrice: 5.5, onlinePrice: 6.5, dailyQuantity: 100, unitProductCost: 1.1 }],
  delivery: { mode: 'platformOnly' },
}

describe('validateDetailedInput', () => {
  it('accepts a minimal valid input and applies defaults', () => {
    const result = validateDetailedInput(VALID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.input.usState).toBe('CA')
    expect(result.input.salesTaxRate).toBeCloseTo(0.0899, 4)
    expect(result.input.channelMix).toEqual(DETAILED_US_DEFAULTS.channelMix)
    expect(result.input.paymentMix).toEqual(DETAILED_US_DEFAULTS.paymentMix)
    expect(result.input.posCommissionRate).toBe(DETAILED_US_DEFAULTS.posCommissionRate)
    expect(result.input.positions).toEqual([])
    expect(result.input.opexLines).toEqual([])
    expect(result.input.capexItems).toEqual([])
    expect(result.input.owner).toEqual({ monthlyDraw: 0, benefitsAllowance: 0 })
    expect(result.input.occupancy).toEqual({ monthlyRent: 0, monthlyCAM: 0 })
  })

  describe('usState and salesTaxRate', () => {
    it('returns required when usState is missing', () => {
      const raw = { ...VALID }
      delete raw.usState
      const result = validateDetailedInput(raw)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toContainEqual({ path: ['usState'], code: 'required' })
    })

    it('rejects an unknown state code', () => {
      const result = validateDetailedInput({ ...VALID, usState: 'ZZ' })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toContainEqual({ path: ['usState'], code: 'invalid_value' })
    })

    it('defaults salesTaxRate from the state table when omitted', () => {
      const result = validateDetailedInput({ ...VALID, usState: 'TX' })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.input.salesTaxRate).toBeCloseTo(0.082, 4)
    })

    it('accepts an explicit override, including 0', () => {
      const result = validateDetailedInput({ ...VALID, salesTaxRate: 0 })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.input.salesTaxRate).toBe(0)
    })

    it('rejects salesTaxRate above 0.50', () => {
      const result = validateDetailedInput({ ...VALID, salesTaxRate: 0.51 })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toContainEqual({ path: ['salesTaxRate'], code: 'above_max', limit: 0.5 })
    })
  })

  describe('products', () => {
    it('rejects an empty product list', () => {
      const result = validateDetailedInput({ ...VALID, products: [] })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toContainEqual({ path: ['products'], code: 'empty_products' })
    })

    it('rejects a missing products field the same way', () => {
      const raw = { ...VALID }
      delete raw.products
      const result = validateDetailedInput(raw)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toContainEqual({ path: ['products'], code: 'empty_products' })
    })

    it('reports below_min with a path into the array for an invalid product field', () => {
      const result = validateDetailedInput({
        ...VALID,
        products: [{ id: 'p1', name: 'Latte', normalPrice: 0, onlinePrice: 6.5, dailyQuantity: 100, unitProductCost: 1 }],
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toContainEqual({ path: ['products', 0, 'normalPrice'], code: 'below_min', limit: 0 })
    })

    it('accepts dailyQuantity 0 as a valid, non-empty product', () => {
      const result = validateDetailedInput({
        ...VALID,
        products: [{ id: 'p1', name: 'Latte', normalPrice: 5, onlinePrice: 6, dailyQuantity: 0, unitProductCost: 1 }],
      })
      expect(result.ok).toBe(true)
    })
  })

  describe('mixes', () => {
    it('rejects a channelMix that does not sum to 1', () => {
      const result = validateDetailedInput({
        ...VALID,
        channelMix: { dineIn: 0.5, takeaway: 0.2, delivery: 0.2 },
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toContainEqual({ path: ['channelMix'], code: 'mix_not_100' })
    })

    it('rejects a paymentMix that does not sum to 1', () => {
      const result = validateDetailedInput({ ...VALID, paymentMix: { cash: 0.5, card: 0.4 } })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toContainEqual({ path: ['paymentMix'], code: 'mix_not_100' })
    })

    it('accepts a mix within tolerance', () => {
      const result = validateDetailedInput({
        ...VALID,
        channelMix: { dineIn: 0.500_0001, takeaway: 0.2, delivery: 0.3 },
      })
      expect(result.ok).toBe(true)
    })

    it('never normalizes a mix — it either accepts or rejects the entered values', () => {
      const result = validateDetailedInput({ ...VALID, paymentMix: { cash: 0.1, card: 0.1 } })
      expect(result.ok).toBe(false)
    })
  })

  describe('delivery', () => {
    it('requires mode when channelMix.delivery > 0', () => {
      const result = validateDetailedInput({ ...VALID, delivery: undefined })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toContainEqual({ path: ['delivery', 'mode'], code: 'required' })
    })

    it('does not require mode when channelMix.delivery is 0', () => {
      const result = validateDetailedInput({
        ...VALID,
        delivery: undefined,
        channelMix: { dineIn: 1, takeaway: 0, delivery: 0 },
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.input.delivery.mode).toBe('platformOnly')
    })

    it('discards ownCourierCostPerDeliveryOrder under platformCourier without erroring', () => {
      const result = validateDetailedInput({
        ...VALID,
        delivery: { mode: 'platformCourier', ownCourierCostPerDeliveryOrder: 5 },
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.input.delivery.ownCourierCostPerDeliveryOrder).toBe(0)
    })

    it('defaults platformFeeRate to 0 (UD-4) regardless of mode', () => {
      const platformOnly = validateDetailedInput({ ...VALID, delivery: { mode: 'platformOnly' } })
      const platformCourier = validateDetailedInput({ ...VALID, delivery: { mode: 'platformCourier' } })
      expect(platformOnly.ok).toBe(true)
      expect(platformCourier.ok).toBe(true)
      if (!platformOnly.ok || !platformCourier.ok) return
      expect(platformOnly.input.delivery.platformFeeRate).toBe(0)
      expect(platformCourier.input.delivery.platformFeeRate).toBe(0)
    })
  })

  describe('positions', () => {
    it('resolves an empty monthlyCostPerPerson to 0 without blocking', () => {
      const result = validateDetailedInput({
        ...VALID,
        positions: [{ id: 'x', name: 'Barista', headcount: 2 }],
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.input.positions[0]?.monthlyCostPerPerson).toBe(0)
    })

    it('requires headcount when a position entry exists', () => {
      const result = validateDetailedInput({
        ...VALID,
        positions: [{ id: 'x', name: 'Barista' }],
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toContainEqual({ path: ['positions', 0, 'headcount'], code: 'required' })
    })
  })

  it('returns all errors together for multiple invalid fields', () => {
    const result = validateDetailedInput({
      usState: undefined,
      products: [],
      posCommissionRate: 5,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual(
      expect.arrayContaining([
        { path: ['usState'], code: 'required' },
        { path: ['products'], code: 'empty_products' },
        { path: ['posCommissionRate'], code: 'above_max', limit: DETAILED_US_LIMITS.posCommissionRate.max },
      ]),
    )
  })

  it('never throws', () => {
    const samples: DetailedInput[] = [
      {},
      VALID,
      { usState: 'CA', products: 'not-an-array' as unknown as DetailedInput['products'] },
      { usState: 'CA', products: [null] as unknown as DetailedInput['products'] },
    ]
    for (const sample of samples) {
      expect(() => validateDetailedInput(sample)).not.toThrow()
    }
  })
})
