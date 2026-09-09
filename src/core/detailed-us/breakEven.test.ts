import { describe, expect, it } from 'vitest'
import { calculateBreakEven } from './breakEven.ts'

describe('calculateBreakEven', () => {
  it('computes weighted contribution and units per month/day', () => {
    const result = calculateBreakEven({
      totalContribution: 39_607.937271,
      totalUnits: 9_900,
      monthlyFixedCost: 24_600,
      operatingDaysPerMonth: 30,
    })
    expect(result).toMatchObject({ available: true })
    if (!result.available) return
    expect(result.weightedContributionPerUnit).toBeCloseTo(4.000802, 6)
    expect(result.unitsPerMonth).toBeCloseTo(6_148.767565, 6)
    expect(result.unitsPerDay).toBeCloseTo(204.958919, 6)
  })

  it('is unavailable with no_sales_volume when totalUnits is 0', () => {
    expect(
      calculateBreakEven({ totalContribution: 0, totalUnits: 0, monthlyFixedCost: 1_000, operatingDaysPerMonth: 30 }),
    ).toEqual({ available: false, reason: 'no_sales_volume' })
  })

  it('is unavailable with non_positive_contribution when weighted contribution is 0 or negative', () => {
    expect(
      calculateBreakEven({ totalContribution: 0, totalUnits: 100, monthlyFixedCost: 1_000, operatingDaysPerMonth: 30 }),
    ).toEqual({ available: false, reason: 'non_positive_contribution' })
    expect(
      calculateBreakEven({ totalContribution: -50, totalUnits: 100, monthlyFixedCost: 1_000, operatingDaysPerMonth: 30 }),
    ).toEqual({ available: false, reason: 'non_positive_contribution' })
  })

  it('never divides by a zero operatingDaysPerMonth in practice (guarded upstream by limits)', () => {
    const result = calculateBreakEven({
      totalContribution: 100,
      totalUnits: 10,
      monthlyFixedCost: 50,
      operatingDaysPerMonth: 30,
    })
    expect(result).toMatchObject({ available: true })
  })
})
