/**
 * Detailed (US) engine defaults — docs/US_DETAILED_FINANCIAL_SPEC.md §4, §4.1.
 *
 * One home for every default and locked constant (architecture U2). The later
 * form imports these; it never restates them. `salesTaxRate` has no static
 * default here — it resolves from `usState` via `data/us/salesTaxRates.ts`,
 * same as Quick.
 */

import type {
  ChannelMix,
  DeliveryMode,
  PaymentMix,
  ProjectionHorizonMonths,
  RampUpPreset,
  ScenarioKey,
  ScenarioVolumeDeltas,
} from './types.ts'

export const DETAILED_US_DEFAULTS = {
  operatingDaysPerMonth: 30,
  /** Same default as Quick — one POS number across both modes. */
  posCommissionRate: 0.035,
  /** UD-4 — no invented DoorDash/Uber Eats/Grubhub market rate. One default for both delivery modes. */
  platformFeeRate: 0,
  deliveryMode: 'platformOnly' as DeliveryMode,
  ownCourierCostPerDeliveryOrder: 0,
  packagingTakeawayPerOrder: 0,
  packagingDeliveryPerOrder: 0,
  /** Illustrative starting split, carried over from the TR sibling app unchanged — not US-specific research. */
  channelMix: { dineIn: 0.5, takeaway: 0.2, delivery: 0.3 } satisfies ChannelMix,
  /** US cafes are card-dominant; a planning default, not a researched market figure. */
  paymentMix: { cash: 0.15, card: 0.85 } satisfies PaymentMix,
  projectionHorizonMonths: 24 as ProjectionHorizonMonths,
  rampUpPreset: 'normal' as RampUpPreset,
  scenarioVolumeDeltas: { bad: -0.25, base: 0, good: 0.25 } satisfies ScenarioVolumeDeltas,
  /** Never invent a default annual rate — 0 is the neutral identity. */
  salesPriceAnnualIncrease: 0,
  productCogsAnnualIncrease: 0,
  fixedCostAnnualIncrease: 0,
  monthlyRent: 0,
  monthlyCAM: 0,
  ownerMonthlyDraw: 0,
  ownerBenefitsAllowance: 0,
  currency: 'USD' as const,
  detailedEngineVersion: '1.0.0',
}

/**
 * Ramp-up presets. Percentage of the scenario-adjusted stabilized quantity,
 * by projection month. Months past a table's end are 100%. Country-neutral —
 * ported unchanged from the TR sibling app.
 */
export const RAMP_UP_TABLES = {
  slow: [0.4, 0.55, 0.7, 0.8, 0.9],
  normal: [0.6, 0.75, 0.85, 0.95],
  fast: [0.8, 0.9],
} as const satisfies Record<RampUpPreset, readonly number[]>

export const SCENARIO_KEYS = ['bad', 'base', 'good'] as const satisfies readonly ScenarioKey[]

export const PROJECTION_HORIZONS = [12, 24, 36] as const satisfies readonly ProjectionHorizonMonths[]

export const CHANNELS = ['dineIn', 'takeaway', 'delivery'] as const

export const RAMP_UP_PRESETS = ['slow', 'normal', 'fast'] as const satisfies readonly RampUpPreset[]

export const DELIVERY_MODES = ['platformOnly', 'platformCourier'] as const satisfies readonly DeliveryMode[]
