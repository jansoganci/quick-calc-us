export interface FieldLimit {
  min: number;
  max: number;
  exclusiveMin?: boolean;
}

/**
 * Currency-denominated ceilings are USD-scaled sanity caps, not researched
 * market limits (same open, non-blocking status as US-7 in
 * docs/US_PRODUCT_SCOPE.md §9). `salesTaxRate`'s range matches §5.1 exactly —
 * not restated as a second, possibly-drifting number.
 */
export const QUICK_US_LIMITS = {
  monthlyRent: { min: 0, max: 500_000 },
  employeeCount: { min: 0, max: 500 },
  averageEmployeeMonthlyCost: { min: 0, max: 50_000 },
  otherMonthlyOpex: { min: 0, max: 500_000 },
  initialCapex: { min: 0, max: 5_000_000 },
  averageTicket: { min: 0, max: 1_000, exclusiveMin: true },
  dailySalesVolume: { min: 0, max: 100_000 },
  variableCostPerSale: { min: 0, max: 1_000 },
  salesTaxRate: { min: 0, max: 0.50 },
  operatingDaysPerMonth: { min: 1, max: 31 },
  capexRecoveryPeriodMonths: { min: 1, max: 240 },
  cardPaymentShare: { min: 0, max: 1 },
  posCommissionRate: { min: 0, max: 0.1 },
} as const satisfies Record<string, FieldLimit>;
