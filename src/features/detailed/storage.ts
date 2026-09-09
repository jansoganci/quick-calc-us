import type { DetailedFormState } from './formState.ts'

/**
 * Draft persistence for Detailed Feasibility, per
 * `docs/TECH_STACK_AND_CONSTRAINTS.md` §4.2. This module is the codec only:
 * it turns a form into a string and a string back into a form, and it never
 * touches `localStorage`.
 *
 * The split is not stylistic. `tsconfig.json` excludes `features/**\/hooks/**`
 * and compiles everything else without the DOM lib, so a `localStorage`
 * reference here fails `typecheck`. Every browser call lives in
 * `hooks/draftStorage.ts`, which `tsconfig.app.json` compiles with the DOM
 * lib. Keeping the codec pure also lets it be tested in the `node`
 * environment Vitest already runs, with no new dependency.
 */

export const STORAGE_KEY = 'quickcalc.detailed.draft.v1'

const DRAFT_VERSION = 1

/**
 * What a session is worth keeping: the inputs, plus the business name the
 * report is titled with.
 *
 * The calculated result is deliberately absent. DESIGN_DIRECTION V6 is
 * locked — no result appears before Calculate — and the result has exactly
 * one source of truth in `core/detailed-us`, so storing it would create a
 * second, unverifiable copy of a figure that is cheap to recompute.
 *
 * `businessName` sits BESIDE `form`, never inside it: `DetailedFormState` is
 * what `toInput.ts` hands the engine, and the name changes no figure —
 * letting it into that shape would put document metadata on the calculation
 * path. It is optional in the stored payload, so a draft written before the
 * report existed still decodes, with an empty name and no version bump.
 */
export type Draft = {
  form: DetailedFormState
  businessName: string
}

type StoredDraft = {
  version: typeof DRAFT_VERSION
  form: DetailedFormState
  businessName: string
}

const PRODUCT_KEYS = ['id', 'name', 'normalPrice', 'onlinePrice', 'dailyQuantity', 'unitProductCost'] as const
const POSITION_KEYS = ['id', 'name', 'headcount', 'monthlyCostPerPerson'] as const
const LINE_KEYS = ['id', 'name', 'amount'] as const
const DELIVERY_MODES = ['platformOnly', 'platformCourier'] as const
const RAMP_UP_PRESETS = ['slow', 'normal', 'fast'] as const
const PROJECTION_HORIZONS = [12, 24, 36] as const

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Every listed key present on `value` and holding a string. */
function hasStrings(value: unknown, keys: readonly string[]): boolean {
  return isObject(value) && keys.every((key) => typeof value[key] === 'string')
}

function isRowArray(value: unknown, keys: readonly string[]): boolean {
  return Array.isArray(value) && value.every((row) => hasStrings(row, keys))
}

function isOneOf(list: readonly unknown[], value: unknown): boolean {
  return list.includes(value)
}

/**
 * A whole-payload check. Anything unexpected rejects the entire draft rather
 * than being repaired: a half-recovered form is harder for the owner to
 * trust than a clean one, and the fields here are their own financial
 * inputs.
 */
function isFormShape(value: unknown): value is DetailedFormState {
  if (!isObject(value)) return false

  if (typeof value.usState !== 'string') return false
  if (typeof value.salesTaxRate !== 'string') return false
  if (!isRowArray(value.products, PRODUCT_KEYS)) return false
  if (!isRowArray(value.positions, POSITION_KEYS)) return false
  if (!isRowArray(value.opexLines, LINE_KEYS)) return false
  if (!isRowArray(value.capexItems, LINE_KEYS)) return false

  if (!hasStrings(value.channelMix, ['dineIn', 'takeaway', 'delivery'])) return false
  if (!hasStrings(value.packaging, ['takeawayPerOrder', 'deliveryPerOrder'])) return false
  if (!hasStrings(value.paymentMix, ['cash', 'card'])) return false
  if (typeof value.posCommissionRate !== 'string') return false

  const delivery = value.delivery
  if (!isObject(delivery)) return false
  if (!hasStrings(delivery, ['platformFeeRate', 'ownCourierCostPerDeliveryOrder'])) return false
  if (delivery.mode !== null && !isOneOf(DELIVERY_MODES, delivery.mode)) return false

  if (!hasStrings(value.owner, ['monthlyDraw', 'benefitsAllowance'])) return false
  if (!hasStrings(value.occupancy, ['monthlyRent', 'monthlyCAM'])) return false

  const assumptions = value.assumptions
  if (!isObject(assumptions)) return false
  if (
    !hasStrings(assumptions, ['salesPriceAnnualIncrease', 'productCogsAnnualIncrease', 'fixedCostAnnualIncrease'])
  ) {
    return false
  }
  if (!isOneOf(PROJECTION_HORIZONS, assumptions.projectionHorizonMonths)) return false
  if (!isOneOf(RAMP_UP_PRESETS, assumptions.rampUpPreset)) return false
  if (!hasStrings(assumptions.scenarioVolumeDeltas, ['bad', 'base', 'good'])) return false

  return true
}

export function encodeDraft(draft: Draft): string {
  const stored: StoredDraft = { version: DRAFT_VERSION, form: draft.form, businessName: draft.businessName }
  return JSON.stringify(stored)
}

/**
 * `null` for anything that is not a draft this version wrote — absent,
 * unparseable, from a future or past shape, or corrupt. The caller falls
 * back to a fresh form, so a bad draft costs the user a blank page, never a
 * crash or a wrong figure.
 */
export function decodeDraft(raw: string | null): Draft | null {
  if (raw === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!isObject(parsed)) return null
  if (parsed.version !== DRAFT_VERSION) return null
  if (!isFormShape(parsed.form)) return null

  // A missing name is the normal case for a draft written before the report
  // existed, and a corrupt one is metadata — neither may sink the financial
  // inputs, which is the one thing this codec exists to protect.
  const businessName = typeof parsed.businessName === 'string' ? parsed.businessName : ''
  return { form: parsed.form, businessName }
}
