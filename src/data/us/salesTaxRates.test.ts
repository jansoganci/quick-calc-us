import { describe, expect, it } from 'vitest';
import { isUsState, US_SALES_TAX_RATES, US_STATE_NAMES } from './salesTaxRates.ts';

describe('US_SALES_TAX_RATES', () => {
  it('has exactly 50 states plus DC', () => {
    expect(Object.keys(US_SALES_TAX_RATES)).toHaveLength(51);
    expect(Object.keys(US_STATE_NAMES)).toHaveLength(51);
  });

  it('keeps every rate within the valid range (US_PRODUCT_SCOPE §5.1)', () => {
    for (const rate of Object.values(US_SALES_TAX_RATES)) {
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(0.50);
    }
  });

  it('treats DE, MT and OR as a valid 0% planning rate', () => {
    expect(US_SALES_TAX_RATES.DE).toBe(0);
    expect(US_SALES_TAX_RATES.MT).toBe(0);
    expect(US_SALES_TAX_RATES.OR).toBe(0);
  });

  it('applies the NH meals-tax override, not 0%', () => {
    expect(US_SALES_TAX_RATES.NH).toBe(0.085);
  });

  it('applies the DC prepared-food override, not the 6% general rate', () => {
    expect(US_SALES_TAX_RATES.DC).toBe(0.10);
  });

  it('gives every state a non-empty display name', () => {
    for (const name of Object.values(US_STATE_NAMES)) {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

describe('isUsState', () => {
  it('accepts every table key', () => {
    for (const code of Object.keys(US_SALES_TAX_RATES)) {
      expect(isUsState(code)).toBe(true);
    }
  });

  it('rejects unknown codes and non-strings', () => {
    expect(isUsState('ZZ')).toBe(false);
    expect(isUsState('')).toBe(false);
    expect(isUsState(null)).toBe(false);
    expect(isUsState(undefined)).toBe(false);
    expect(isUsState(1)).toBe(false);
  });
});
