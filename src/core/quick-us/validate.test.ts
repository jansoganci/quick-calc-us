import { describe, expect, it } from 'vitest';
import { QUICK_US_DEFAULTS } from './defaults.ts';
import { QUICK_US_LIMITS } from './limits.ts';
import type { PrimaryInputField, QuickCalculationInput } from './types.ts';
import { validateQuickInput } from './validate.ts';

const VALID_PRIMARY: QuickCalculationInput = {
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

const PRIMARY_FIELDS: PrimaryInputField[] = [
  'monthlyRent',
  'employeeCount',
  'averageEmployeeMonthlyCost',
  'otherMonthlyOpex',
  'initialCapex',
  'averageTicket',
  'dailySalesVolume',
  'variableCostPerSale',
];

describe('validateQuickInput', () => {
  it('accepts a valid full input and returns a resolved input', () => {
    const result = validateQuickInput(VALID_PRIMARY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.monthlyRent).toBe(8_000);
    expect(result.input.usState).toBe('CA');
    expect(result.input.salesTaxRate).toBeCloseTo(0.0899, 4);
    expect(result.input.operatingDaysPerMonth).toBe(QUICK_US_DEFAULTS.operatingDaysPerMonth);
    expect(result.input.capexRecoveryPeriodMonths).toBe(QUICK_US_DEFAULTS.capexRecoveryPeriodMonths);
    expect(result.input.cardPaymentShare).toBe(QUICK_US_DEFAULTS.cardPaymentShare);
    expect(result.input.posCommissionRate).toBe(QUICK_US_DEFAULTS.posCommissionRate);
  });

  it.each(PRIMARY_FIELDS)('returns required when %s is missing', (field) => {
    const raw = { ...VALID_PRIMARY };
    delete raw[field];
    const result = validateQuickInput(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({ field, code: 'required' });
  });

  it.each(['', null, undefined] as const)(
    'returns required for empty-like value %s',
    (empty) => {
      const result = validateQuickInput({ ...VALID_PRIMARY, monthlyRent: empty });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toContainEqual({ field: 'monthlyRent', code: 'required' });
    },
  );

  it.each([NaN, Infinity, -Infinity, '9.50', true, {}, []] as const)(
    'returns not_a_number for %s',
    (value) => {
      const result = validateQuickInput({ ...VALID_PRIMARY, averageTicket: value });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toContainEqual({ field: 'averageTicket', code: 'not_a_number' });
    },
  );

  it('returns below_min for negative money', () => {
    const result = validateQuickInput({ ...VALID_PRIMARY, monthlyRent: -1 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({
      field: 'monthlyRent',
      code: 'below_min',
      limit: QUICK_US_LIMITS.monthlyRent.min,
    });
  });

  it('returns below_min when averageTicket is 0', () => {
    const result = validateQuickInput({ ...VALID_PRIMARY, averageTicket: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({
      field: 'averageTicket',
      code: 'below_min',
      limit: QUICK_US_LIMITS.averageTicket.min,
    });
  });

  it.each(PRIMARY_FIELDS)('returns above_max when %s exceeds its maximum', (field) => {
    const result = validateQuickInput({
      ...VALID_PRIMARY,
      [field]: QUICK_US_LIMITS[field].max + 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({
      field,
      code: 'above_max',
      limit: QUICK_US_LIMITS[field].max,
    });
  });

  it('applies secondary defaults when they are omitted', () => {
    const result = validateQuickInput(VALID_PRIMARY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.operatingDaysPerMonth).toBe(30);
    expect(result.input.capexRecoveryPeriodMonths).toBe(60);
    expect(result.input.cardPaymentShare).toBe(0.90);
    expect(result.input.posCommissionRate).toBe(0.035);
  });

  describe('usState and salesTaxRate (US_PRODUCT_SCOPE §3.2)', () => {
    it('returns required when usState is missing — never an implicit rate', () => {
      const raw = { ...VALID_PRIMARY };
      delete raw.usState;
      const result = validateQuickInput(raw);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toContainEqual({ field: 'usState', code: 'required' });
    });

    it('rejects an unknown state code', () => {
      const result = validateQuickInput({ ...VALID_PRIMARY, usState: 'ZZ' });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toContainEqual({ field: 'usState', code: 'invalid_value' });
    });

    it('defaults salesTaxRate from the state table when omitted', () => {
      const result = validateQuickInput({ ...VALID_PRIMARY, usState: 'TX' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.input.salesTaxRate).toBeCloseTo(0.0820, 4);
    });

    it('accepts an explicit user override of salesTaxRate', () => {
      const result = validateQuickInput({ ...VALID_PRIMARY, usState: 'CA', salesTaxRate: 0.05 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.input.salesTaxRate).toBe(0.05);
    });

    it('accepts 0 as a valid explicit salesTaxRate override', () => {
      const result = validateQuickInput({ ...VALID_PRIMARY, usState: 'CA', salesTaxRate: 0 });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.input.salesTaxRate).toBe(0);
    });

    it('rejects salesTaxRate above 0.50', () => {
      const result = validateQuickInput({ ...VALID_PRIMARY, salesTaxRate: 0.51 });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toContainEqual({ field: 'salesTaxRate', code: 'above_max', limit: 0.50 });
    });

    it.each(['DE', 'MT', 'OR'] as const)('defaults %s to a 0%% planning rate', (usState) => {
      const result = validateQuickInput({ ...VALID_PRIMARY, usState });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.input.salesTaxRate).toBe(0);
    });

    it('defaults NH to the 8.5% meals-tax override, not 0%', () => {
      const result = validateQuickInput({ ...VALID_PRIMARY, usState: 'NH' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.input.salesTaxRate).toBeCloseTo(0.085, 4);
    });

    it('defaults DC to the 10% prepared-food override, not the 6% general rate', () => {
      const result = validateQuickInput({ ...VALID_PRIMARY, usState: 'DC' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.input.salesTaxRate).toBeCloseTo(0.10, 4);
    });
  });

  it('rejects operatingDaysPerMonth 0 and 32', () => {
    const tooLow = validateQuickInput({ ...VALID_PRIMARY, operatingDaysPerMonth: 0 });
    expect(tooLow.ok).toBe(false);
    if (!tooLow.ok) {
      expect(tooLow.errors).toContainEqual({
        field: 'operatingDaysPerMonth',
        code: 'below_min',
        limit: 1,
      });
    }
    const tooHigh = validateQuickInput({ ...VALID_PRIMARY, operatingDaysPerMonth: 32 });
    expect(tooHigh.ok).toBe(false);
    if (!tooHigh.ok) {
      expect(tooHigh.errors).toContainEqual({
        field: 'operatingDaysPerMonth',
        code: 'above_max',
        limit: 31,
      });
    }
  });

  it('rejects capexRecoveryPeriodMonths 0 and 241', () => {
    const tooLow = validateQuickInput({ ...VALID_PRIMARY, capexRecoveryPeriodMonths: 0 });
    expect(tooLow.ok).toBe(false);
    if (!tooLow.ok) {
      expect(tooLow.errors).toContainEqual({
        field: 'capexRecoveryPeriodMonths',
        code: 'below_min',
        limit: 1,
      });
    }
    const tooHigh = validateQuickInput({ ...VALID_PRIMARY, capexRecoveryPeriodMonths: 241 });
    expect(tooHigh.ok).toBe(false);
    if (!tooHigh.ok) {
      expect(tooHigh.errors).toContainEqual({
        field: 'capexRecoveryPeriodMonths',
        code: 'above_max',
        limit: 240,
      });
    }
  });

  it('rejects cardPaymentShare -0.1 and 1.1', () => {
    const tooLow = validateQuickInput({ ...VALID_PRIMARY, cardPaymentShare: -0.1 });
    expect(tooLow.ok).toBe(false);
    if (!tooLow.ok) {
      expect(tooLow.errors).toContainEqual({
        field: 'cardPaymentShare',
        code: 'below_min',
        limit: 0,
      });
    }
    const tooHigh = validateQuickInput({ ...VALID_PRIMARY, cardPaymentShare: 1.1 });
    expect(tooHigh.ok).toBe(false);
    if (!tooHigh.ok) {
      expect(tooHigh.errors).toContainEqual({
        field: 'cardPaymentShare',
        code: 'above_max',
        limit: 1,
      });
    }
  });

  it('rejects posCommissionRate -0.01 and 0.11', () => {
    const tooLow = validateQuickInput({ ...VALID_PRIMARY, posCommissionRate: -0.01 });
    expect(tooLow.ok).toBe(false);
    if (!tooLow.ok) {
      expect(tooLow.errors).toContainEqual({
        field: 'posCommissionRate',
        code: 'below_min',
        limit: 0,
      });
    }
    const tooHigh = validateQuickInput({ ...VALID_PRIMARY, posCommissionRate: 0.11 });
    expect(tooHigh.ok).toBe(false);
    if (!tooHigh.ok) {
      expect(tooHigh.errors).toContainEqual({
        field: 'posCommissionRate',
        code: 'above_max',
        limit: 0.1,
      });
    }
  });

  it('returns all errors together for multiple invalid fields', () => {
    const result = validateQuickInput({
      ...VALID_PRIMARY,
      monthlyRent: undefined,
      averageTicket: 0,
      employeeCount: 501,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        { field: 'monthlyRent', code: 'required' },
        { field: 'averageTicket', code: 'below_min', limit: 0 },
        { field: 'employeeCount', code: 'above_max', limit: 500 },
      ]),
    );
    expect(result.errors).toHaveLength(3);
  });

  it('accepts variableCostPerSale greater than the net average ticket', () => {
    const result = validateQuickInput({ ...VALID_PRIMARY, variableCostPerSale: 50 });
    expect(result.ok).toBe(true);
  });

  it('accepts initialCapex 0 and dailySalesVolume 0', () => {
    const result = validateQuickInput({
      ...VALID_PRIMARY,
      initialCapex: 0,
      dailySalesVolume: 0,
    });
    expect(result.ok).toBe(true);
  });

  it('accepts fractional employeeCount 9.5', () => {
    const result = validateQuickInput({ ...VALID_PRIMARY, employeeCount: 9.5 });
    expect(result.ok).toBe(true);
  });

  it('never throws', () => {
    const samples: QuickCalculationInput[] = [
      {},
      VALID_PRIMARY,
      { monthlyRent: 'x' },
      { averageTicket: Number.POSITIVE_INFINITY },
    ];
    for (const sample of samples) {
      expect(() => validateQuickInput(sample)).not.toThrow();
    }
  });
});
