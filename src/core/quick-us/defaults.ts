/**
 * No static `salesTaxRate` default here — it resolves from `usState` via
 * `data/us/salesTaxRates.ts` (US_PRODUCT_SCOPE.md §3.2). `usState` itself has
 * no default at all: it's required, and an empty selection is a validation
 * error, never an implicit rate.
 */
export const QUICK_US_DEFAULTS = {
  operatingDaysPerMonth: 30,
  capexRecoveryPeriodMonths: 60,
  cardPaymentShare: 0.90,
  posCommissionRate: 0.035,
  currency: 'USD' as const,
  quickEngineVersion: '1.0.0',
};
