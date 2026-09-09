/**
 * Detailed (US) input validation and default resolution.
 *
 * Authority: docs/US_DETAILED_FINANCIAL_SPEC.md §3, §5.
 *
 * Errors are accumulated and returned; nothing is ever thrown. The calculator
 * only accepts `DetailedResolvedInput`, so unresolved input cannot reach a
 * formula. This module resolves and range-checks — it never computes a
 * financial value.
 */

import { isUsState, US_SALES_TAX_RATES, type UsState } from '../../data/us/salesTaxRates.ts'
import { DELIVERY_MODES, DETAILED_US_DEFAULTS, PROJECTION_HORIZONS, RAMP_UP_PRESETS } from './defaults.ts'
import { DETAILED_US_LIMITS, MIX_TOLERANCE, type FieldLimit } from './limits.ts'
import type {
  DeliveryMode,
  DetailedInput,
  DetailedResolvedInput,
  ProjectionHorizonMonths,
  RampUpPreset,
  ResolvedAssumptions,
  ResolvedCapexItem,
  ResolvedDelivery,
  ResolvedOccupancy,
  ResolvedOpexLine,
  ResolvedOwner,
  ResolvedPackaging,
  ResolvedPosition,
  ResolvedProduct,
  ScenarioVolumeDeltas,
  ValidateDetailedResult,
  ValidationError,
  ValidationErrorCode,
  ValidationPathSegment,
} from './types.ts'

const CHANNEL_MIX_KEYS = ['dineIn', 'takeaway', 'delivery'] as const
const PAYMENT_MIX_KEYS = ['cash', 'card'] as const

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function fail(
  errors: ValidationError[],
  path: ValidationPathSegment[],
  code: ValidationErrorCode,
  limit?: number,
): void {
  errors.push(limit === undefined ? { path, code } : { path, code, limit })
}

/** Present but not an object is an error; absent is not. Either way callers get defaults. */
function section(errors: ValidationError[], path: ValidationPathSegment[], value: unknown): Record<string, unknown> {
  if (isAbsent(value)) return {}
  const object = asObject(value)
  if (object === null) {
    fail(errors, path, 'invalid_value')
    return {}
  }
  return object
}

/** Absent → `[]`. Present but not an array is an error. */
function optionalArray(errors: ValidationError[], path: ValidationPathSegment[], value: unknown): unknown[] {
  if (isAbsent(value)) return []
  if (!Array.isArray(value)) {
    fail(errors, path, 'invalid_value')
    return []
  }
  return value
}

/* ------------------------------------------------------------------ *
 * Field reader
 *
 * Binds the error list, the path prefix and the raw object once per section so
 * a field rule reads as one line. A readability helper over the primitives
 * above, not an abstraction layer.
 * ------------------------------------------------------------------ */

interface FieldReader {
  required(key: string, limit: FieldLimit): number
  optional(key: string, limit: FieldLimit, fallback: number): number
  text(key: string): string
  choice<T extends string | number>(key: string, allowed: readonly T[], fallback: T): T
  raw(key: string): unknown
}

function fieldsOf(errors: ValidationError[], base: ValidationPathSegment[], raw: Record<string, unknown>): FieldReader {
  const check = (key: string, value: unknown, limit: FieldLimit): number | undefined => {
    const path = [...base, key]
    if (!isFiniteNumber(value)) {
      fail(errors, path, 'not_a_number')
      return undefined
    }
    if (limit.exclusiveMin === true ? value <= limit.min : value < limit.min) {
      fail(errors, path, 'below_min', limit.min)
      return undefined
    }
    if (value > limit.max) {
      fail(errors, path, 'above_max', limit.max)
      return undefined
    }
    return value
  }

  return {
    required(key, limit) {
      const value = raw[key]
      if (isAbsent(value)) {
        fail(errors, [...base, key], 'required')
        return limit.min
      }
      return check(key, value, limit) ?? limit.min
    },
    optional(key, limit, fallback) {
      const value = raw[key]
      if (isAbsent(value)) return fallback
      return check(key, value, limit) ?? fallback
    },
    text(key) {
      const value = raw[key]
      if (isAbsent(value)) {
        fail(errors, [...base, key], 'required')
        return ''
      }
      if (typeof value !== 'string') {
        fail(errors, [...base, key], 'invalid_value')
        return ''
      }
      return value
    },
    choice(key, allowed, fallback) {
      const value = raw[key]
      if (isAbsent(value)) return fallback
      if (allowed.includes(value as never)) return value as typeof fallback
      fail(errors, [...base, key], 'invalid_value')
      return fallback
    },
    raw(key) {
      return raw[key]
    },
  }
}

/* ------------------------------------------------------------------ *
 * Mixes — must sum to 1; never silently normalized.
 * ------------------------------------------------------------------ */

function resolveMix<K extends string>(
  errors: ValidationError[],
  key: string,
  value: unknown,
  componentKeys: readonly K[],
  fallback: Record<K, number>,
): Record<K, number> {
  if (isAbsent(value)) return fallback

  const object = asObject(value)
  if (object === null) {
    fail(errors, [key], 'invalid_value')
    return fallback
  }

  const fields = fieldsOf(errors, [key], object)
  const resolved = {} as Record<K, number>
  let sum = 0
  for (const component of componentKeys) {
    const share = fields.required(component, DETAILED_US_LIMITS.mixComponent)
    resolved[component] = share
    sum += share
  }

  if (Math.abs(sum - 1) > MIX_TOLERANCE) {
    fail(errors, [key], 'mix_not_100')
  }
  return resolved
}

/* ------------------------------------------------------------------ *
 * Jurisdiction — usState is required with no implicit default; salesTaxRate
 * defaults from the resolved state (same rule as Quick).
 * ------------------------------------------------------------------ */

function resolveUsState(errors: ValidationError[], value: unknown): UsState | undefined {
  if (isAbsent(value)) {
    fail(errors, ['usState'], 'required')
    return undefined
  }
  if (!isUsState(value)) {
    fail(errors, ['usState'], 'invalid_value')
    return undefined
  }
  return value
}

function resolveSalesTaxRate(errors: ValidationError[], value: unknown, usState: UsState | undefined): number {
  if (isAbsent(value)) {
    return usState !== undefined ? US_SALES_TAX_RATES[usState] : 0
  }
  const limit = DETAILED_US_LIMITS.salesTaxRate
  if (!isFiniteNumber(value)) {
    fail(errors, ['salesTaxRate'], 'not_a_number')
    return 0
  }
  if (value < limit.min) {
    fail(errors, ['salesTaxRate'], 'below_min', limit.min)
    return 0
  }
  if (value > limit.max) {
    fail(errors, ['salesTaxRate'], 'above_max', limit.max)
    return 0
  }
  return value
}

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

function resolveProducts(errors: ValidationError[], value: unknown): ResolvedProduct[] {
  // An empty or absent list is rejected here, so no engine path handles zero
  // products. Zero daily quantity is a different, valid case.
  if (!Array.isArray(value) || value.length === 0) {
    fail(errors, ['products'], 'empty_products')
    return []
  }

  return value.map((entry, index) => {
    const path = ['products', index]
    const f = fieldsOf(errors, path, section(errors, path, entry))
    return {
      id: f.text('id'),
      name: f.text('name'),
      normalPrice: f.required('normalPrice', DETAILED_US_LIMITS.normalPrice),
      onlinePrice: f.required('onlinePrice', DETAILED_US_LIMITS.onlinePrice),
      dailyQuantity: f.required('dailyQuantity', DETAILED_US_LIMITS.dailyQuantity),
      unitProductCost: f.required('unitProductCost', DETAILED_US_LIMITS.unitProductCost),
    }
  })
}

function resolvePositions(errors: ValidationError[], value: unknown): ResolvedPosition[] {
  return optionalArray(errors, ['positions'], value).map((entry, index) => {
    const path = ['positions', index]
    const f = fieldsOf(errors, path, section(errors, path, entry))
    return {
      id: f.text('id'),
      name: f.text('name'),
      headcount: f.required('headcount', DETAILED_US_LIMITS.headcount),
      monthlyCostPerPerson: f.optional('monthlyCostPerPerson', DETAILED_US_LIMITS.monthlyCostPerPerson, 0),
    }
  })
}

function resolveOpexLines(errors: ValidationError[], value: unknown): ResolvedOpexLine[] {
  return optionalArray(errors, ['opexLines'], value).map((entry, index) => {
    const path = ['opexLines', index]
    const f = fieldsOf(errors, path, section(errors, path, entry))
    return {
      id: f.text('id'),
      name: f.text('name'),
      monthlyAmount: f.required('monthlyAmount', DETAILED_US_LIMITS.opexMonthlyAmount),
    }
  })
}

function resolveCapexItems(errors: ValidationError[], value: unknown): ResolvedCapexItem[] {
  return optionalArray(errors, ['capexItems'], value).map((entry, index) => {
    const path = ['capexItems', index]
    const f = fieldsOf(errors, path, section(errors, path, entry))
    return {
      id: f.text('id'),
      name: f.text('name'),
      amount: f.required('amount', DETAILED_US_LIMITS.capexAmount),
    }
  })
}

/**
 * `hasDeliveryVolume` is `channelMix.delivery > 0`.
 *
 * The mode selects whether own-courier payment applies at all, so it is
 * never silently defaulted for a business that actually delivers: the user
 * must choose. When the delivery share is 0 the mode reaches no figure, and
 * an inert value is resolved so the caller still gets a complete input.
 */
function resolveDelivery(errors: ValidationError[], value: unknown, hasDeliveryVolume: boolean): ResolvedDelivery {
  const f = fieldsOf(errors, ['delivery'], section(errors, ['delivery'], value))

  if (hasDeliveryVolume && isAbsent(f.raw('mode'))) {
    fail(errors, ['delivery', 'mode'], 'required')
  }
  const mode = f.choice<DeliveryMode>('mode', DELIVERY_MODES, DETAILED_US_DEFAULTS.deliveryMode)
  const platformFeeRate = f.optional(
    'platformFeeRate',
    DETAILED_US_LIMITS.platformFeeRate,
    DETAILED_US_DEFAULTS.platformFeeRate,
  )
  const ownCourier = f.optional(
    'ownCourierCostPerDeliveryOrder',
    DETAILED_US_LIMITS.ownCourierCostPerDeliveryOrder,
    DETAILED_US_DEFAULTS.ownCourierCostPerDeliveryOrder,
  )

  return {
    mode,
    platformFeeRate,
    // Own-courier payment is Mode 1 only. Supplying it under Mode 2 is not an
    // error; it is discarded.
    ownCourierCostPerDeliveryOrder: mode === 'platformCourier' ? 0 : ownCourier,
  }
}

function resolvePackaging(errors: ValidationError[], value: unknown): ResolvedPackaging {
  const f = fieldsOf(errors, ['packaging'], section(errors, ['packaging'], value))
  return {
    takeawayPerOrder: f.optional(
      'takeawayPerOrder',
      DETAILED_US_LIMITS.packagingTakeawayPerOrder,
      DETAILED_US_DEFAULTS.packagingTakeawayPerOrder,
    ),
    deliveryPerOrder: f.optional(
      'deliveryPerOrder',
      DETAILED_US_LIMITS.packagingDeliveryPerOrder,
      DETAILED_US_DEFAULTS.packagingDeliveryPerOrder,
    ),
  }
}

function resolveOccupancy(errors: ValidationError[], value: unknown): ResolvedOccupancy {
  const f = fieldsOf(errors, ['occupancy'], section(errors, ['occupancy'], value))
  return {
    monthlyRent: f.optional('monthlyRent', DETAILED_US_LIMITS.monthlyRent, DETAILED_US_DEFAULTS.monthlyRent),
    monthlyCAM: f.optional('monthlyCAM', DETAILED_US_LIMITS.monthlyCAM, DETAILED_US_DEFAULTS.monthlyCAM),
  }
}

function resolveOwner(errors: ValidationError[], value: unknown): ResolvedOwner {
  const f = fieldsOf(errors, ['owner'], section(errors, ['owner'], value))
  return {
    monthlyDraw: f.optional('monthlyDraw', DETAILED_US_LIMITS.ownerMonthlyDraw, DETAILED_US_DEFAULTS.ownerMonthlyDraw),
    benefitsAllowance: f.optional(
      'benefitsAllowance',
      DETAILED_US_LIMITS.ownerBenefitsAllowance,
      DETAILED_US_DEFAULTS.ownerBenefitsAllowance,
    ),
  }
}

function resolveScenarioDeltas(errors: ValidationError[], value: unknown): ScenarioVolumeDeltas {
  const path = ['assumptions', 'scenarioVolumeDeltas']
  const f = fieldsOf(errors, path, section(errors, path, value))
  const limit = DETAILED_US_LIMITS.scenarioVolumeDelta
  const fallback = DETAILED_US_DEFAULTS.scenarioVolumeDeltas
  return {
    bad: f.optional('bad', limit, fallback.bad),
    base: f.optional('base', limit, fallback.base),
    good: f.optional('good', limit, fallback.good),
  }
}

function resolveAssumptions(errors: ValidationError[], value: unknown): ResolvedAssumptions {
  const raw = section(errors, ['assumptions'], value)
  const f = fieldsOf(errors, ['assumptions'], raw)
  const increase = DETAILED_US_LIMITS.annualIncrease
  return {
    operatingDaysPerMonth: f.optional(
      'operatingDaysPerMonth',
      DETAILED_US_LIMITS.operatingDaysPerMonth,
      DETAILED_US_DEFAULTS.operatingDaysPerMonth,
    ),
    projectionHorizonMonths: f.choice<ProjectionHorizonMonths>(
      'projectionHorizonMonths',
      PROJECTION_HORIZONS,
      DETAILED_US_DEFAULTS.projectionHorizonMonths,
    ),
    rampUpPreset: f.choice<RampUpPreset>('rampUpPreset', RAMP_UP_PRESETS, DETAILED_US_DEFAULTS.rampUpPreset),
    scenarioVolumeDeltas: resolveScenarioDeltas(errors, f.raw('scenarioVolumeDeltas')),
    salesPriceAnnualIncrease: f.optional(
      'salesPriceAnnualIncrease',
      increase,
      DETAILED_US_DEFAULTS.salesPriceAnnualIncrease,
    ),
    productCogsAnnualIncrease: f.optional(
      'productCogsAnnualIncrease',
      increase,
      DETAILED_US_DEFAULTS.productCogsAnnualIncrease,
    ),
    fixedCostAnnualIncrease: f.optional(
      'fixedCostAnnualIncrease',
      increase,
      DETAILED_US_DEFAULTS.fixedCostAnnualIncrease,
    ),
  }
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

export function validateDetailedInput(raw: DetailedInput): ValidateDetailedResult {
  const errors: ValidationError[] = []
  const top = fieldsOf(errors, [], raw as Record<string, unknown>)

  // Resolved before the object literal below: whether delivery mode is
  // required depends on the delivery share, and salesTaxRate's default
  // depends on usState, so the ordering must be explicit.
  const usState = resolveUsState(errors, raw.usState)
  const salesTaxRate = resolveSalesTaxRate(errors, raw.salesTaxRate, usState)
  const channelMix = resolveMix(errors, 'channelMix', raw.channelMix, CHANNEL_MIX_KEYS, DETAILED_US_DEFAULTS.channelMix)

  const input: DetailedResolvedInput = {
    // A valid placeholder, never read: `errors` is non-empty here whenever
    // `usState` was not resolved, so the caller always sees `ok: false` first.
    usState: usState ?? 'CA',
    salesTaxRate,
    products: resolveProducts(errors, raw.products),
    channelMix,
    paymentMix: resolveMix(errors, 'paymentMix', raw.paymentMix, PAYMENT_MIX_KEYS, DETAILED_US_DEFAULTS.paymentMix),
    posCommissionRate: top.optional(
      'posCommissionRate',
      DETAILED_US_LIMITS.posCommissionRate,
      DETAILED_US_DEFAULTS.posCommissionRate,
    ),
    delivery: resolveDelivery(errors, raw.delivery, channelMix.delivery > 0),
    packaging: resolvePackaging(errors, raw.packaging),
    occupancy: resolveOccupancy(errors, raw.occupancy),
    positions: resolvePositions(errors, raw.positions),
    owner: resolveOwner(errors, raw.owner),
    opexLines: resolveOpexLines(errors, raw.opexLines),
    capexItems: resolveCapexItems(errors, raw.capexItems),
    assumptions: resolveAssumptions(errors, raw.assumptions),
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }
  return { ok: true, input }
}
