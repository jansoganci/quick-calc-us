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

/**
 * Advances the id counter past every id already in a restored form, so a
 * freshly minted row (e.g. `product-2`) never collides with a restored one
 * sharing the same id — which would otherwise give two rows the same React
 * key. Called once, right after a draft is loaded from storage.
 */
export function syncIdCounter(form: DetailedFormState): void {
  const ids = [
    ...form.products.map((row) => row.id),
    ...form.positions.map((row) => row.id),
    ...form.opexLines.map((row) => row.id),
    ...form.capexItems.map((row) => row.id),
  ]
  for (const id of ids) {
    const match = /-(\d+)$/.exec(id)
    if (match?.[1] === undefined) continue
    const value = Number(match[1])
    if (value > nextId) nextId = value
  }
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

/**
 * A realistic filled example — a small California coffee shop — for the
 * "Fill with example" onboarding control. Every figure is a plausible
 * planning number, not a golden vector: nothing here is asserted against by
 * a test.
 */
export function sampleCafeForm(): DetailedFormState {
  return {
    usState: 'CA',
    salesTaxRate: '8.99',
    products: [
      { id: makeId('product'), name: 'Latte', normalPrice: '5.50', onlinePrice: '6.15', dailyQuantity: '220', unitProductCost: '1.10' },
      { id: makeId('product'), name: 'Breakfast Sandwich', normalPrice: '6.50', onlinePrice: '7.25', dailyQuantity: '110', unitProductCost: '2.80' },
    ],
    channelMix: { dineIn: '50.00', takeaway: '20.00', delivery: '30.00' },
    packaging: { takeawayPerOrder: '0.35', deliveryPerOrder: '0.75' },
    paymentMix: { cash: '15.00', card: '85.00' },
    posCommissionRate: '3.50',
    delivery: { mode: 'platformOnly', platformFeeRate: '0.00', ownCourierCostPerDeliveryOrder: '3.50' },
    positions: [
      { id: makeId('position'), name: 'Barista', headcount: '2', monthlyCostPerPerson: '3200' },
      { id: makeId('position'), name: 'Shift lead', headcount: '1', monthlyCostPerPerson: '3800' },
    ],
    owner: { monthlyDraw: '4000', benefitsAllowance: '500' },
    occupancy: { monthlyRent: '4500', monthlyCAM: '350' },
    opexLines: [
      { id: makeId('opex'), name: 'Utilities', amount: '450' },
      { id: makeId('opex'), name: 'Software & POS fees', amount: '120' },
    ],
    capexItems: [
      { id: makeId('capex'), name: 'Espresso machine', amount: '18000' },
      { id: makeId('capex'), name: 'Buildout & furniture', amount: '35000' },
    ],
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
