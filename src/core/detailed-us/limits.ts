/**
 * Detailed (US) input ranges — docs/US_DETAILED_FINANCIAL_SPEC.md §5.
 *
 * These are part of the calculation contract, not UI preferences. An upper
 * bound is a validity ceiling, not a suggestion. Currency-denominated
 * ceilings are USD-scaled sanity caps, not researched market limits (US-7 in
 * docs/US_PRODUCT_SCOPE.md §9 already flags this as open and non-blocking).
 * Non-currency fields (counts, fractions, day counts) don't depend on
 * currency and are unchanged from the TR sibling app.
 */

export interface FieldLimit {
  min: number
  max: number
  exclusiveMin?: boolean
}

export const DETAILED_US_LIMITS = {
  normalPrice: { min: 0, max: 1_000, exclusiveMin: true },
  onlinePrice: { min: 0, max: 1_000, exclusiveMin: true },
  dailyQuantity: { min: 0, max: 100_000 },
  unitProductCost: { min: 0, max: 1_000 },

  packagingTakeawayPerOrder: { min: 0, max: 1_000 },
  packagingDeliveryPerOrder: { min: 0, max: 1_000 },
  ownCourierCostPerDeliveryOrder: { min: 0, max: 1_000 },

  posCommissionRate: { min: 0, max: 0.1 },
  platformFeeRate: { min: 0, max: 0.6 },

  /** Same range as Quick (US_PRODUCT_SCOPE.md §5.1) — not restated as a second number. */
  salesTaxRate: { min: 0, max: 0.5 },
  operatingDaysPerMonth: { min: 1, max: 31 },

  monthlyRent: { min: 0, max: 500_000 },
  monthlyCAM: { min: 0, max: 500_000 },
  opexMonthlyAmount: { min: 0, max: 500_000 },

  headcount: { min: 0, max: 500 },
  monthlyCostPerPerson: { min: 0, max: 50_000 },

  ownerMonthlyDraw: { min: 0, max: 50_000 },
  ownerBenefitsAllowance: { min: 0, max: 50_000 },

  capexAmount: { min: 0, max: 5_000_000 },

  scenarioVolumeDelta: { min: -0.9, max: 5 },
  annualIncrease: { min: -0.5, max: 2 },
  mixComponent: { min: 0, max: 1 },
} as const satisfies Record<string, FieldLimit>

/** Both mixes must sum to 1 within this tolerance. Never normalized. */
export const MIX_TOLERANCE = 1e-6
