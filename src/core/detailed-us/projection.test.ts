import { describe, expect, it } from 'vitest'
import { escalationFactor, paybackFromProjection, rampUpMultiplier } from './projection.ts'
import type { MonthResult } from './types.ts'

describe('rampUpMultiplier', () => {
  it('follows the normal preset table', () => {
    expect(rampUpMultiplier('normal', 1)).toBe(0.6)
    expect(rampUpMultiplier('normal', 2)).toBe(0.75)
    expect(rampUpMultiplier('normal', 4)).toBe(0.95)
  })

  it('is 100% past the end of the table', () => {
    expect(rampUpMultiplier('normal', 5)).toBe(1)
    expect(rampUpMultiplier('normal', 24)).toBe(1)
    expect(rampUpMultiplier('fast', 3)).toBe(1)
  })

  it('combines with a scenario multiplier by simple multiplication', () => {
    const scenarioMultiplier = 0.75 // bad scenario
    expect(scenarioMultiplier * rampUpMultiplier('normal', 6)).toBeCloseTo(0.75, 9)
  })
})

describe('escalationFactor', () => {
  it('is exactly 1 at month 1 regardless of rate', () => {
    expect(escalationFactor(0.1, 1)).toBe(1)
    expect(escalationFactor(-0.2, 1)).toBe(1)
    expect(escalationFactor(0, 1)).toBe(1)
  })

  it('reproduces the annual rate at month 13', () => {
    expect(escalationFactor(0.1, 13)).toBeCloseTo(1.1, 9)
  })

  it('is exactly 1 at every month when the rate is 0', () => {
    expect(escalationFactor(0, 24)).toBe(1)
  })
})

function row(month: number, monthlyOperatingResult: number): MonthResult {
  return {
    month,
    quantityFactor: 1,
    priceFactor: 1,
    cogsFactor: 1,
    fixedFactor: 1,
    totalUnits: 0,
    grossCustomerSales: 0,
    salesTaxAmount: 0,
    netRevenue: 0,
    productCogs: 0,
    channelVariableCost: 0,
    paymentPlatformFee: 0,
    totalVariableCost: 0,
    totalContribution: 0,
    monthlyPayroll: 0,
    monthlyOwnerCost: 0,
    monthlyOccupancyCost: 0,
    monthlyOpex: 0,
    rentCost: 0,
    monthlyFixedCost: 0,
    monthlyOperatingResult,
    byChannel: {
      dineIn: { units: 0, grossCustomerSales: 0, netRevenue: 0, productCogs: 0, channelVariableCost: 0, paymentPlatformFee: 0, contribution: 0 },
      takeaway: { units: 0, grossCustomerSales: 0, netRevenue: 0, productCogs: 0, channelVariableCost: 0, paymentPlatformFee: 0, contribution: 0 },
      delivery: { units: 0, grossCustomerSales: 0, netRevenue: 0, productCogs: 0, channelVariableCost: 0, paymentPlatformFee: 0, contribution: 0 },
    },
    byProduct: [],
  }
}

describe('paybackFromProjection', () => {
  it('returns month 0 when there is no investment to recover', () => {
    expect(paybackFromProjection([row(1, 100)], 0, 100)).toEqual({
      available: true,
      month: 0,
      cumulativeAtPayback: 0,
    })
  })

  it('finds the first month cumulative result meets the investment', () => {
    const projection = [row(1, 40), row(2, 40), row(3, 40)]
    expect(paybackFromProjection(projection, 100, 40)).toEqual({
      available: true,
      month: 3,
      cumulativeAtPayback: 120,
    })
  })

  it('is not_reached_within_horizon when cumulative never catches up but the steady state is positive', () => {
    const projection = [row(1, 10), row(2, 10)]
    expect(paybackFromProjection(projection, 1_000, 10)).toEqual({
      available: false,
      reason: 'not_reached_within_horizon',
    })
  })

  it('is non_positive_operating_result when the stabilized result is not positive', () => {
    const projection = [row(1, -5), row(2, -5)]
    expect(paybackFromProjection(projection, 1_000, -5)).toEqual({
      available: false,
      reason: 'non_positive_operating_result',
    })
  })
})
