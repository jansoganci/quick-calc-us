/**
 * Detailed Feasibility (US) engine types.
 *
 * Authority: docs/US_DETAILED_FINANCIAL_SPEC.md §2-3, §14.
 * This file imports nothing but the shared state-tax type, which keeps the
 * module graph acyclic by construction. Types only — no values, no functions.
 */

import type { UsState } from '../../data/us/salesTaxRates.ts'

/* ------------------------------------------------------------------ *
 * Enumerations
 * ------------------------------------------------------------------ */

export type Channel = 'dineIn' | 'takeaway' | 'delivery'

export type PaymentMethod = 'cash' | 'card'

/** `platformOnly` = merchant courier, platform only takes the order. `platformCourier` = the platform's own rider delivers. */
export type DeliveryMode = 'platformOnly' | 'platformCourier'

export type RampUpPreset = 'slow' | 'normal' | 'fast'

export type ScenarioKey = 'bad' | 'base' | 'good'

/** Presets only — no free numeric horizon. */
export type ProjectionHorizonMonths = 12 | 24 | 36

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

export type ValidationErrorCode =
  | 'required'
  | 'not_a_number'
  | 'below_min'
  | 'above_max'
  | 'invalid_value'
  | 'mix_not_100'
  | 'empty_products'

export type ValidationPathSegment = string | number

export interface ValidationError {
  path: ValidationPathSegment[]
  code: ValidationErrorCode
  limit?: number
}

export type ValidateDetailedResult =
  | { ok: true; input: DetailedResolvedInput }
  | { ok: false; errors: ValidationError[] }

/* ------------------------------------------------------------------ *
 * Raw input
 *
 * Every leaf is `unknown`: the shape arriving from the UI is untrusted and
 * validation is the only thing allowed to narrow it.
 * ------------------------------------------------------------------ */

export interface DetailedInput {
  usState?: unknown
  salesTaxRate?: unknown
  products?: unknown
  channelMix?: unknown
  paymentMix?: unknown
  posCommissionRate?: unknown
  delivery?: unknown
  packaging?: unknown
  occupancy?: unknown
  positions?: unknown
  owner?: unknown
  opexLines?: unknown
  capexItems?: unknown
  assumptions?: unknown
}

/* ------------------------------------------------------------------ *
 * Resolved input
 * ------------------------------------------------------------------ */

/** Prices are pre-tax as entered (US-1). Quantity is daily and stabilized. */
export interface ResolvedProduct {
  id: string
  name: string
  normalPrice: number
  onlinePrice: number
  dailyQuantity: number
  unitProductCost: number
}

/** One business-level split, must total 1. */
export interface ChannelMix {
  dineIn: number
  takeaway: number
  delivery: number
}

/** Direct store sales only — dine-in and takeaway. Must total 1. */
export interface PaymentMix {
  cash: number
  card: number
}

export interface ResolvedDelivery {
  mode: DeliveryMode
  /** May be 0 — the supported way to model own-phone/website delivery (UD-4 ships this at 0 by default). */
  platformFeeRate: number
  /** `platformOnly` only; validation forces this to 0 under `platformCourier`. */
  ownCourierCostPerDeliveryOrder: number
}

/** Business-level amounts, not per product. */
export interface ResolvedPackaging {
  takeawayPerOrder: number
  deliveryPerOrder: number
}

/** No rent basis, no withholding (US-2) — the field simply doesn't exist. */
export interface ResolvedOccupancy {
  monthlyRent: number
  monthlyCAM: number
}

/** One fully-loaded cost per position (UD-2) — not TR's employer/meal/transport/bonus breakdown. */
export interface ResolvedPosition {
  id: string
  name: string
  headcount: number
  monthlyCostPerPerson: number
}

/** Two allowances (UD-3), not a computed self-employment tax. */
export interface ResolvedOwner {
  monthlyDraw: number
  benefitsAllowance: number
}

export interface ResolvedOpexLine {
  id: string
  name: string
  monthlyAmount: number
}

export interface ResolvedCapexItem {
  id: string
  name: string
  amount: number
}

export interface ScenarioVolumeDeltas {
  bad: number
  base: number
  good: number
}

export interface ResolvedAssumptions {
  operatingDaysPerMonth: number
  projectionHorizonMonths: ProjectionHorizonMonths
  rampUpPreset: RampUpPreset
  scenarioVolumeDeltas: ScenarioVolumeDeltas
  salesPriceAnnualIncrease: number
  productCogsAnnualIncrease: number
  fixedCostAnnualIncrease: number
}

export interface DetailedResolvedInput {
  usState: UsState
  salesTaxRate: number
  products: ResolvedProduct[]
  channelMix: ChannelMix
  paymentMix: PaymentMix
  posCommissionRate: number
  delivery: ResolvedDelivery
  packaging: ResolvedPackaging
  occupancy: ResolvedOccupancy
  positions: ResolvedPosition[]
  owner: ResolvedOwner
  opexLines: ResolvedOpexLine[]
  capexItems: ResolvedCapexItem[]
  assumptions: ResolvedAssumptions
}

/* ------------------------------------------------------------------ *
 * Internal intermediates — not exported from index.ts
 * ------------------------------------------------------------------ */

/** Per unit and volume-free. */
export interface UnitEconomicsLine {
  netPerUnit: number
  /** 0 for delivery, always (UD-1) — the platform collects and remits it, not the merchant. */
  salesTaxPerUnit: number
  grossPerUnit: number
  unitProductCost: number
  unitChannelVariableCost: number
  unitPaymentPlatformFee: number
  unitContribution: number
}

/**
 * `product` is carried for pairing only, so the monthly aggregation can iterate a
 * single array. `unitEconomics.ts` must never read `product.dailyQuantity`.
 */
export interface ProductUnitEconomics {
  product: ResolvedProduct
  byChannel: Record<Channel, UnitEconomicsLine>
}

export interface UnitEconomics {
  directFeeRate: number
  products: ProductUnitEconomics[]
}

/** Volume-independent monthly costs. CAPEX is deliberately absent. */
export interface MonthlyFixedCosts {
  monthlyPayroll: number
  monthlyOwnerCost: number
  monthlyOccupancyCost: number
  monthlyOpex: number
  rentCost: number
  monthlyFixedCost: number
}

/** The four multipliers that are the only way scenarios, ramp-up and escalation act. */
export interface MonthFactors {
  month: number | null
  quantityFactor: number
  priceFactor: number
  cogsFactor: number
  fixedFactor: number
}

export interface BreakEvenBasis {
  totalContribution: number
  totalUnits: number
  monthlyFixedCost: number
  operatingDaysPerMonth: number
}

/* ------------------------------------------------------------------ *
 * Output contract
 * ------------------------------------------------------------------ */

export interface ChannelLine {
  units: number
  grossCustomerSales: number
  netRevenue: number
  productCogs: number
  channelVariableCost: number
  paymentPlatformFee: number
  contribution: number
}

/** Same six figures as `ChannelLine`, summed across channels instead of across products. */
export interface ProductLine {
  productId: string
  name: string
  units: number
  grossCustomerSales: number
  netRevenue: number
  productCogs: number
  channelVariableCost: number
  paymentPlatformFee: number
  contribution: number
}

export interface MonthResult {
  /** `null` for a stabilized month; 1-based for a projection row. */
  month: number | null
  quantityFactor: number
  priceFactor: number
  cogsFactor: number
  fixedFactor: number
  totalUnits: number
  grossCustomerSales: number
  salesTaxAmount: number
  netRevenue: number
  productCogs: number
  channelVariableCost: number
  paymentPlatformFee: number
  totalVariableCost: number
  totalContribution: number
  monthlyPayroll: number
  monthlyOwnerCost: number
  monthlyOccupancyCost: number
  monthlyOpex: number
  rentCost: number
  monthlyFixedCost: number
  monthlyOperatingResult: number
  byChannel: Record<Channel, ChannelLine>
  byProduct: ProductLine[]
}

export type BreakEvenUnavailableReason = 'no_sales_volume' | 'non_positive_contribution'

export type BreakEvenResult =
  | {
      available: true
      weightedContributionPerUnit: number
      unitsPerMonth: number
      unitsPerDay: number
    }
  | { available: false; reason: BreakEvenUnavailableReason }

export type PaybackUnavailableReason = 'not_reached_within_horizon' | 'non_positive_operating_result'

export type PaybackResult =
  | { available: true; month: number; cumulativeAtPayback: number }
  | { available: false; reason: PaybackUnavailableReason }

export interface ScenarioResult {
  scenarioMultiplier: number
  stabilizedMonth: MonthResult
  projection: MonthResult[]
  payback: PaybackResult
}

/**
 * Mandatory assumption transparency. The later UI must display the three
 * annual escalation rates even when they are 0.
 */
export interface ResultAssumptions {
  usState: UsState
  salesTaxRate: number
  operatingDaysPerMonth: number
  projectionHorizonMonths: ProjectionHorizonMonths
  rampUpPreset: RampUpPreset
  scenarioVolumeDeltas: ScenarioVolumeDeltas
  deliveryMode: DeliveryMode
  platformFeeRate: number
  posCommissionRate: number
  salesPriceAnnualIncrease: number
  productCogsAnnualIncrease: number
  fixedCostAnnualIncrease: number
}

export interface ResultMeta {
  detailedEngineVersion: string
  currency: 'USD'
  revenueBasis: 'net'
  assumptions: ResultAssumptions
}

export interface DetailedResult {
  totalInitialInvestment: number
  breakEven: BreakEvenResult
  scenarios: Record<ScenarioKey, ScenarioResult>
  meta: ResultMeta
}
