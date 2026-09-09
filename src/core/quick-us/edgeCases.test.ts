import { describe, expect, it } from 'vitest';
import { calculateQuick } from './calculate.ts';
import type { QuickResolvedInput } from './types.ts';
import { validateQuickInput } from './validate.ts';

const GOLDEN_RAW = {
  monthlyRent: 8_000,
  employeeCount: 8,
  averageEmployeeMonthlyCost: 4_500,
  otherMonthlyOpex: 3_000,
  initialCapex: 250_000,
  averageTicket: 9.50,
  dailySalesVolume: 250,
  variableCostPerSale: 2.80,
  usState: 'CA',
};

function goldenInput(): QuickResolvedInput {
  const result = validateQuickInput(GOLDEN_RAW);
  if (!result.ok) {
    throw new Error('golden input must be valid');
  }
  return result.input;
}

function resolve(overrides: Partial<QuickResolvedInput> = {}): QuickResolvedInput {
  return { ...goldenInput(), ...overrides };
}

function collectNumbers(value: unknown, found: number[]): void {
  if (typeof value === 'number') {
    found.push(value);
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      collectNumbers(nested, found);
    }
  }
}

describe('edge cases', () => {
  it('nulls per-sale outputs and margins when dailySalesVolume is 0', () => {
    const input = resolve({ dailySalesVolume: 0 });
    const result = calculateQuick(input);
    expect(result.perSale).toBeNull();
    expect(result.breakdownPerSale).toBeNull();
    expect(result.grossProfitMargin).toBeNull();
    expect(result.operatingProfitMargin).toBeNull();
    expect(result.monthly.fixedCost).toBeGreaterThan(0);
    expect(result.monthly.operatingEarnings).toBeCloseTo(-result.monthly.fixedCost, 9);
  });

  it('returns null margins, not 0, when monthlyNetRevenue is 0', () => {
    const result = calculateQuick(resolve({ dailySalesVolume: 0 }));
    expect(result.monthly.netRevenue).toBe(0);
    expect(result.grossProfitMargin).toBeNull();
    expect(result.operatingProfitMargin).toBeNull();
  });

  it('marks payback unavailable when before-allocation earnings are not positive and CAPEX is positive', () => {
    const result = calculateQuick(resolve({ dailySalesVolume: 0 }));
    expect(result.monthly.operatingEarningsBeforeCapexRecoveryAllocation).toBeLessThanOrEqual(0);
    expect(result.payback).toEqual({
      available: false,
      reason: 'non_positive_earnings_before_recovery',
    });
  });

  it('returns payback 0 and recovery allocation 0 when initialCapex is 0', () => {
    const result = calculateQuick(resolve({ initialCapex: 0 }));
    expect(result.monthly.capexRecoveryAllocation).toBe(0);
    expect(result.payback).toEqual({ months: 0, exceedsRecoveryPeriod: false });
  });

  it('evaluates the CAPEX guard first when initialCapex is 0 and earnings are negative', () => {
    const result = calculateQuick(resolve({ initialCapex: 0, dailySalesVolume: 0 }));
    expect(result.monthly.operatingEarnings).toBeLessThan(0);
    expect(result.payback).toEqual({ months: 0, exceedsRecoveryPeriod: false });
  });

  it('still returns a payback number when it exceeds the recovery period', () => {
    // The golden vector itself already exceeds the recovery period (a loss
    // at this volume) — this covers a case with positive before-allocation
    // earnings that still overshoots the window.
    const result = calculateQuick(resolve({ initialCapex: 2_000_000 }));
    expect(result.payback).toMatchObject({ exceedsRecoveryPeriod: true });
    if ('months' in result.payback) {
      expect(result.payback.months).toBeGreaterThan(60);
      expect(Number.isFinite(result.payback.months)).toBe(true);
    }
  });

  it('computes negative earnings when variableCostPerSale exceeds the net ticket', () => {
    expect(() => calculateQuick(resolve({ variableCostPerSale: 50 }))).not.toThrow();
    const result = calculateQuick(resolve({ variableCostPerSale: 50 }));
    expect(result.monthly.operatingEarnings).toBeLessThan(0);
  });

  it('never returns NaN or Infinity across a spread of inputs', () => {
    const samples: QuickResolvedInput[] = [
      goldenInput(),
      resolve({ dailySalesVolume: 0 }),
      resolve({ initialCapex: 0 }),
      resolve({ employeeCount: 0, monthlyRent: 0, otherMonthlyOpex: 0, initialCapex: 0 }),
      resolve({
        monthlyRent: 500_000,
        employeeCount: 500,
        averageEmployeeMonthlyCost: 50_000,
        otherMonthlyOpex: 500_000,
        initialCapex: 5_000_000,
        averageTicket: 1_000,
        dailySalesVolume: 100_000,
        variableCostPerSale: 1_000,
      }),
      resolve({
        monthlyRent: 0,
        employeeCount: 0.5,
        averageEmployeeMonthlyCost: 0,
        otherMonthlyOpex: 0,
        initialCapex: 1,
        averageTicket: 0.01,
        dailySalesVolume: 0.1,
        variableCostPerSale: 0,
        salesTaxRate: 0,
        operatingDaysPerMonth: 1,
        capexRecoveryPeriodMonths: 1,
        cardPaymentShare: 0,
        posCommissionRate: 0,
      }),
      resolve({ cardPaymentShare: 1, posCommissionRate: 0.1, operatingDaysPerMonth: 31, salesTaxRate: 0.50 }),
    ];

    for (const input of samples) {
      const result = calculateQuick(input);
      const numbers: number[] = [];
      collectNumbers(result, numbers);
      expect(numbers.length).toBeGreaterThan(0);
      for (const value of numbers) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  it('never throws for valid resolved input', () => {
    const samples = [
      goldenInput(),
      resolve({ dailySalesVolume: 0 }),
      resolve({ initialCapex: 0, dailySalesVolume: 0 }),
      resolve({ variableCostPerSale: 50 }),
    ];
    for (const input of samples) {
      expect(() => calculateQuick(input)).not.toThrow();
    }
  });

  it('is deterministic', () => {
    const input = goldenInput();
    expect(calculateQuick(input)).toEqual(calculateQuick(input));
  });

  it('does not reintroduce removed or rejected concepts in the result', () => {
    const serialized = JSON.stringify(calculateQuick(goldenInput()));
    for (const banned of [
      'breakEven',
      'contribution',
      'netProfit',
      'depreciation',
      'waste',
      'provenance',
      'volumeSimulation',
      'vat',
      'rentWithholding',
      'rentPaidToLandlord',
      'mealCard',
    ]) {
      expect(serialized).not.toMatch(new RegExp(banned, 'i'));
    }
  });
});
