/**
 * Public entry point for the Detailed Feasibility (US) engine.
 *
 * The later feature layer imports from here and from nowhere else inside the
 * module. Internal helpers — `calculateMonth`, the two builders, the ramp-up
 * and escalation functions, the payback scan and `calculateBreakEven` — stay
 * private; tests reach them directly as siblings (architecture R7).
 */

export { calculateDetailed } from './calculate.ts'
export { DELIVERY_MODES, DETAILED_US_DEFAULTS, PROJECTION_HORIZONS, RAMP_UP_PRESETS, RAMP_UP_TABLES } from './defaults.ts'
export { DETAILED_US_LIMITS, MIX_TOLERANCE } from './limits.ts'
export type { FieldLimit } from './limits.ts'
export { validateDetailedInput } from './validate.ts'

export type {
  BreakEvenResult,
  BreakEvenUnavailableReason,
  Channel,
  ChannelLine,
  ChannelMix,
  DeliveryMode,
  DetailedInput,
  DetailedResolvedInput,
  DetailedResult,
  MonthResult,
  PaybackResult,
  PaybackUnavailableReason,
  PaymentMethod,
  PaymentMix,
  ProductLine,
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
  ResultAssumptions,
  ResultMeta,
  ScenarioKey,
  ScenarioResult,
  ScenarioVolumeDeltas,
  ValidateDetailedResult,
  ValidationError,
  ValidationErrorCode,
  ValidationPathSegment,
} from './types.ts'
