import { describe, expect, it } from 'vitest';
import { calculateQuick, resolveMonthlyPayroll } from './calculate.ts';
import { QUICK_US_DEFAULTS } from './defaults.ts';
import type { CostLine, QuickResolvedInput } from './types.ts';
import { validateQuickInput } from './validate.ts';

const MONEY = 4;
const RATIO = 5;
const INVARIANT = 9;

/** US_PRODUCT_SCOPE.md §6 — illustrative CA cafe. Not given as a golden
 * vector there; computed and verified with a throwaway script before being
 * encoded here (see the session's implementation notes). */
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

function assertInvariants(input: QuickResolvedInput): void {
  const result = calculateQuick(input);

  if (result.breakdownPerSale !== null) {
    const lineSum = result.breakdownPerSale.lines.reduce((sum, line) => sum + line.amount, 0);
    expect(lineSum + result.breakdownPerSale.remainingProfit).toBeCloseTo(
      result.breakdownPerSale.averageSale,
      INVARIANT,
    );
    // The breakdown sums to the customer payment (ticket + tax), never the
    // pre-tax ticket alone (US_PRODUCT_SCOPE §4.5).
    expect(result.breakdownPerSale.averageSale).toBeCloseTo(
      result.perSale?.customerPaymentPerSale ?? Number.NaN,
      INVARIANT,
    );
  }

  if (result.perSale !== null) {
    expect(result.monthly.operatingEarnings).toBeCloseTo(
      result.perSale.remainingProfit * result.monthly.salesVolume,
      INVARIANT,
    );
  }

  expect(result.monthly.operatingEarnings).toBeCloseTo(
    result.monthly.netRevenue - result.monthly.totalCost,
    INVARIANT,
  );

  expect(result.monthly.operatingEarningsBeforeCapexRecoveryAllocation).toBeCloseTo(
    result.monthly.operatingEarnings + result.monthly.capexRecoveryAllocation,
    INVARIANT,
  );
}

describe('calculateQuick golden vector (US_PRODUCT_SCOPE §6, CA)', () => {
  const result = calculateQuick(goldenInput());

  it('matches expected monthly values', () => {
    expect(result.monthly.salesVolume).toBeCloseTo(7_500, MONEY);
    expect(result.monthly.grossCollections).toBeCloseTo(77_655.375, MONEY);
    expect(result.monthly.salesTax).toBeCloseTo(6_405.375, MONEY);
    expect(result.monthly.netRevenue).toBeCloseTo(71_250, MONEY);
    expect(result.monthly.payroll).toBeCloseTo(36_000, MONEY);
    expect(result.monthly.rentCost).toBeCloseTo(8_000, MONEY);
    expect(result.monthly.variableCost).toBeCloseTo(21_000, MONEY);
    expect(result.monthly.transactionCost).toBeCloseTo(2_446.1443, MONEY);
    expect(result.monthly.capexRecoveryAllocation).toBeCloseTo(4_166.6667, MONEY);
    expect(result.monthly.fixedCost).toBeCloseTo(51_166.6667, MONEY);
    expect(result.monthly.totalCost).toBeCloseTo(74_612.811, MONEY);
    expect(result.monthly.operatingEarnings).toBeCloseTo(-3_362.811, MONEY);
    expect(result.monthly.operatingEarningsBeforeCapexRecoveryAllocation).toBeCloseTo(
      803.8557,
      MONEY,
    );
  });

  it('matches expected per-sale values', () => {
    expect(result.perSale).not.toBeNull();
    if (result.perSale === null) return;
    expect(result.perSale.netAverageTicket).toBeCloseTo(9.50, MONEY);
    expect(result.perSale.customerPaymentPerSale).toBeCloseTo(10.35405, MONEY);
    expect(result.perSale.salesTax).toBeCloseTo(0.85405, MONEY);
    expect(result.perSale.variable).toBeCloseTo(2.80, MONEY);
    expect(result.perSale.pos).toBeCloseTo(0.3262, MONEY);
    expect(result.perSale.fixed).toBeCloseTo(6.8222, MONEY);
    expect(result.perSale.estimatedTotalCost).toBeCloseTo(10.8024, MONEY);
    expect(result.perSale.remainingProfit).toBeCloseTo(-0.4484, MONEY);
  });

  it('matches the approved breakdown order and residual (a loss at this volume)', () => {
    expect(result.breakdownPerSale).not.toBeNull();
    if (result.breakdownPerSale === null) return;
    const expected: Array<{ line: CostLine; amount: number }> = [
      { line: 'salesTax', amount: 0.85405 },
      { line: 'variable', amount: 2.80 },
      { line: 'payroll', amount: 4.80 },
      { line: 'rent', amount: 1.0667 },
      { line: 'otherOpex', amount: 0.40 },
      { line: 'pos', amount: 0.3262 },
      { line: 'investmentRecovery', amount: 0.5556 },
    ];
    expect(result.breakdownPerSale.lines.map((entry) => entry.line)).toEqual(
      expected.map((entry) => entry.line),
    );
    for (const [index, line] of result.breakdownPerSale.lines.entries()) {
      const amount = expected[index]?.amount;
      expect(amount).toBeDefined();
      if (amount === undefined) return;
      expect(line.amount).toBeCloseTo(amount, MONEY);
    }
    expect(result.breakdownPerSale.remainingProfit).toBeCloseTo(-0.4484, MONEY);
  });

  it('matches expected headline outputs', () => {
    expect(result.grossProfitMargin).toBeCloseTo(0.70526, RATIO);
    expect(result.operatingProfitMargin).toBeCloseTo(-0.04720, RATIO);
    expect(result.payback).toMatchObject({ exceedsRecoveryPeriod: true });
    if ('months' in result.payback) {
      expect(result.payback.months).toBeCloseTo(311.0011, MONEY);
    }
  });

  it('records engine meta from the resolved jurisdiction', () => {
    expect(result.meta).toEqual({
      quickEngineVersion: QUICK_US_DEFAULTS.quickEngineVersion,
      currency: 'USD',
      usState: 'CA',
      salesTaxRate: 0.0899,
      revenueBasis: 'net',
    });
  });
});

describe('resolveMonthlyPayroll', () => {
  it('multiplies headcount by the fully-loaded per-employee cost', () => {
    expect(resolveMonthlyPayroll({ employeeCount: 8, averageEmployeeMonthlyCost: 4_500 })).toBe(
      36_000,
    );
  });

  it('is zero when there are no employees', () => {
    expect(resolveMonthlyPayroll({ employeeCount: 0, averageEmployeeMonthlyCost: 4_500 })).toBe(0);
  });

  it('is the value calculateQuick reports as monthly payroll', () => {
    const validated = validateQuickInput(GOLDEN_RAW);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(calculateQuick(validated.input).monthly.payroll).toBe(
      resolveMonthlyPayroll(validated.input),
    );
  });
});

describe('calculateQuick structural invariants', () => {
  it.each([
    goldenInput(),
    resolve({ dailySalesVolume: 100, employeeCount: 3, initialCapex: 100_000 }),
    resolve({ averageTicket: 15, variableCostPerSale: 5, monthlyRent: 4_000 }),
    resolve({ dailySalesVolume: 0.25, operatingDaysPerMonth: 1 }),
    resolve({ usState: 'OR', salesTaxRate: 0 }),
    resolve({ usState: 'NH' }),
  ])('holds for varied inputs %#', (input) => {
    assertInvariants(input);
  });

  it('does not include a volumeSimulation field', () => {
    const result = calculateQuick(goldenInput());
    expect(result).not.toHaveProperty('volumeSimulation');
    expect(Object.keys(result).sort()).toEqual(
      [
        'breakdownPerSale',
        'grossProfitMargin',
        'meta',
        'monthly',
        'operatingProfitMargin',
        'payback',
        'perSale',
      ].sort(),
    );
  });
});

describe('calculateQuick sales tax (US-1) — never TR VAT-netting math', () => {
  it('adds tax on top of the entered ticket, never divides it back out', () => {
    const result = calculateQuick(resolve({ averageTicket: 9.50, usState: 'CA', salesTaxRate: 0.0899 }));
    expect(result.perSale?.netAverageTicket).toBe(9.50);
    expect(result.perSale?.customerPaymentPerSale).toBeCloseTo(10.35405, MONEY);
    expect(result.perSale?.customerPaymentPerSale).not.toBeCloseTo(9.50 / 1.0899, MONEY);
  });

  it('applies POS to the customer payment (ticket + tax), never the ticket alone', () => {
    const withTax = calculateQuick(resolve({ usState: 'CA', salesTaxRate: 0.0899 }));
    const zeroTax = calculateQuick(resolve({ usState: 'OR', salesTaxRate: 0 }));
    expect(withTax.perSale?.pos).toBeGreaterThan(zeroTax.perSale?.pos ?? 0);
    // Never averageTicket alone as the POS base — that would omit tax.
    const wrongBase = 9.50 * 0.90 * 0.035;
    expect(withTax.perSale?.pos).not.toBeCloseTo(wrongBase, MONEY);
  });

  it('has no rent withholding — rentCost is exactly monthlyRent', () => {
    const result = calculateQuick(resolve({ monthlyRent: 6_500 }));
    expect(result.monthly.rentCost).toBe(6_500);
    expect(result.breakdownPerSale?.lines.find((line) => line.line === 'rent')?.amount).toBeCloseTo(
      6_500 / result.monthly.salesVolume,
      INVARIANT,
    );
  });

  it('keeps zero rent at zero', () => {
    const result = calculateQuick(resolve({ monthlyRent: 0 }));
    expect(result.monthly.rentCost).toBe(0);
    expect(result.breakdownPerSale?.lines.find((line) => line.line === 'rent')?.amount).toBe(0);
  });
});

describe('calculateQuick zero and override states (US_PRODUCT_SCOPE §5)', () => {
  it.each(['DE', 'MT', 'OR'] as const)('treats %s as a valid 0%% planning rate, not skipped tax', (usState) => {
    const result = calculateQuick(resolve({ usState, salesTaxRate: 0 }));
    expect(result.perSale?.salesTax).toBe(0);
    expect(result.perSale?.customerPaymentPerSale).toBe(result.perSale?.netAverageTicket);
    expect(result.breakdownPerSale?.lines.find((line) => line.line === 'salesTax')?.amount).toBe(0);
  });

  it('applies the NH meals-tax override (0.085), not a 0% "no sales tax state" assumption', () => {
    const result = calculateQuick(resolve({ usState: 'NH', salesTaxRate: 0.085 }));
    expect(result.perSale?.salesTax).toBeCloseTo(9.50 * 0.085, MONEY);
  });

  it('applies the DC prepared-food override (0.10), not the 6% general rate', () => {
    const result = calculateQuick(resolve({ usState: 'DC', salesTaxRate: 0.10 }));
    expect(result.perSale?.salesTax).toBeCloseTo(9.50 * 0.10, MONEY);
  });
});
