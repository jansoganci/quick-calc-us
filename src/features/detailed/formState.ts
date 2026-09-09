import { DETAILED_US_DEFAULTS, type DeliveryMode, type ProjectionHorizonMonths, type RampUpPreset } from '../../core/detailed-us/index.ts'
import type { UsState } from '../../data/us/salesTaxRates.ts'
import { formatDecimal } from '../../lib/number.ts'

/**
 * The form holds raw strings, exactly as typed. Nothing here interprets
 * them — `toInput.ts` turns them into a `DetailedInput` and the engine's own
 * validation is the only thing allowed to narrow them.
 *
 * Rates are entered and stored as percentages (`'8.99'`), because that is
 * the unit an owner knows. The conversion to the engine's 0-1 fraction
 * happens in one place (`toInput.ts`).
 */

export type ProductRow = {
  id: string
  name: string
  normalPrice: string
  onlinePrice: string
  dailyQuantity: string
  unitProductCost: string
}

export type PositionRow = {
  id: string
  name: string
  headcount: string
  monthlyCostPerPerson: string
}

export type LineRow = {
  id: string
  name: string
  amount: string
}

export type DetailedFormState = {
  usState: UsState | ''
  salesTaxRate: string
  products: ProductRow[]
  channelMix: { dineIn: string; takeaway: string; delivery: string }
  packaging: { takeawayPerOrder: string; deliveryPerOrder: string }
  paymentMix: { cash: string; card: string }
  posCommissionRate: string
  delivery: {
    mode: DeliveryMode | null
    platformFeeRate: string
    ownCourierCostPerDeliveryOrder: string
  }
  positions: PositionRow[]
  owner: { monthlyDraw: string; benefitsAllowance: string }
  occupancy: { monthlyRent: string; monthlyCAM: string }
  opexLines: LineRow[]
  capexItems: LineRow[]
  assumptions: {
    projectionHorizonMonths: ProjectionHorizonMonths
    rampUpPreset: RampUpPreset
    scenarioVolumeDeltas: { bad: string; base: string; good: string }
    salesPriceAnnualIncrease: string
    productCogsAnnualIncrease: string
    fixedCostAnnualIncrease: string
  }
}

let nextId = 0

function makeId(prefix: string): string {
  nextId += 1
  return `${prefix}-${nextId}`
}

/** A 0-1 rate rendered as the percentage string the field shows. */
export function rateToPercentInput(rate: number): string {
  return formatDecimal(rate * 100, 2)
}

export function emptyProduct(): ProductRow {
  return { id: makeId('product'), name: '', normalPrice: '', onlinePrice: '', dailyQuantity: '', unitProductCost: '' }
}

export function emptyPosition(): PositionRow {
  return { id: makeId('position'), name: '', headcount: '', monthlyCostPerPerson: '' }
}

export function emptyLine(prefix: 'opex' | 'capex', name = ''): LineRow {
  return { id: makeId(prefix), name, amount: '' }
}

/**
 * The starting form. Every editable default from `core/detailed-us/defaults.ts`
 * is pre-filled so the user sees what the calculation would otherwise assume
 * silently; every money field starts empty, and an empty optional money
 * field resolves to 0.
 *
 * Products open with one blank row — products are the only thing the model
 * cannot proceed without. `usState` starts unselected, same as Quick: never
 * an implicit rate.
 */
export function initialForm(): DetailedFormState {
  return {
    usState: '',
    salesTaxRate: '',
    products: [emptyProduct()],
    channelMix: {
      dineIn: rateToPercentInput(DETAILED_US_DEFAULTS.channelMix.dineIn),
      takeaway: rateToPercentInput(DETAILED_US_DEFAULTS.channelMix.takeaway),
      delivery: rateToPercentInput(DETAILED_US_DEFAULTS.channelMix.delivery),
    },
    packaging: { takeawayPerOrder: '', deliveryPerOrder: '' },
    paymentMix: {
      cash: rateToPercentInput(DETAILED_US_DEFAULTS.paymentMix.cash),
      card: rateToPercentInput(DETAILED_US_DEFAULTS.paymentMix.card),
    },
    posCommissionRate: rateToPercentInput(DETAILED_US_DEFAULTS.posCommissionRate),
    delivery: {
      // Never pre-selected: the owner knows this better than any default, and
      // it's required as soon as the delivery share is above zero.
      mode: null,
      platformFeeRate: rateToPercentInput(DETAILED_US_DEFAULTS.platformFeeRate),
      ownCourierCostPerDeliveryOrder: '',
    },
    positions: [],
    owner: { monthlyDraw: '', benefitsAllowance: '' },
    occupancy: { monthlyRent: '', monthlyCAM: '' },
    opexLines: [],
    capexItems: [],
    assumptions: {
      projectionHorizonMonths: DETAILED_US_DEFAULTS.projectionHorizonMonths,
      rampUpPreset: DETAILED_US_DEFAULTS.rampUpPreset,
      scenarioVolumeDeltas: {
        bad: rateToPercentInput(DETAILED_US_DEFAULTS.scenarioVolumeDeltas.bad),
        base: rateToPercentInput(DETAILED_US_DEFAULTS.scenarioVolumeDeltas.base),
        good: rateToPercentInput(DETAILED_US_DEFAULTS.scenarioVolumeDeltas.good),
      },
      salesPriceAnnualIncrease: rateToPercentInput(DETAILED_US_DEFAULTS.salesPriceAnnualIncrease),
      productCogsAnnualIncrease: rateToPercentInput(DETAILED_US_DEFAULTS.productCogsAnnualIncrease),
      fixedCostAnnualIncrease: rateToPercentInput(DETAILED_US_DEFAULTS.fixedCostAnnualIncrease),
    },
  }
}
