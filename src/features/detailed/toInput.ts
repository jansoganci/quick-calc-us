import type { DetailedInput } from '../../core/detailed-us/index.ts'
import { parseNumber } from '../../lib/number.ts'
import type { DetailedFormState } from './formState.ts'

/**
 * Form strings → the engine's raw `DetailedInput`. This file interprets
 * nothing: it parses, and where a string is not a number it hands the
 * string straight through so the engine's own validation produces
 * `not_a_number`. Absent optional values are omitted so the engine applies
 * its own defaults.
 */

/** `undefined` when empty (→ default or `required`), the raw string when unparseable. */
function amount(raw: string): unknown {
  const parsed = parseNumber(raw)
  if (parsed.status === 'empty') return undefined
  if (parsed.status === 'invalid') return raw
  return parsed.value
}

/** The same, converting a typed percentage to the engine's 0-1 fraction. */
function rate(raw: string): unknown {
  const parsed = parseNumber(raw)
  if (parsed.status === 'empty') return undefined
  if (parsed.status === 'invalid') return raw
  return parsed.value / 100
}

function text(raw: string): unknown {
  const trimmed = raw.trim()
  return trimmed === '' ? undefined : trimmed
}

export function toDetailedInput(form: DetailedFormState): DetailedInput {
  return {
    usState: form.usState === '' ? undefined : form.usState,
    salesTaxRate: rate(form.salesTaxRate),
    products: form.products.map((product) => ({
      id: product.id,
      name: text(product.name),
      normalPrice: amount(product.normalPrice),
      onlinePrice: amount(product.onlinePrice),
      dailyQuantity: amount(product.dailyQuantity),
      unitProductCost: amount(product.unitProductCost),
    })),
    channelMix: {
      dineIn: rate(form.channelMix.dineIn),
      takeaway: rate(form.channelMix.takeaway),
      delivery: rate(form.channelMix.delivery),
    },
    paymentMix: {
      cash: rate(form.paymentMix.cash),
      card: rate(form.paymentMix.card),
    },
    posCommissionRate: rate(form.posCommissionRate),
    delivery: {
      mode: form.delivery.mode ?? undefined,
      platformFeeRate: rate(form.delivery.platformFeeRate),
      ownCourierCostPerDeliveryOrder: amount(form.delivery.ownCourierCostPerDeliveryOrder),
    },
    packaging: {
      takeawayPerOrder: amount(form.packaging.takeawayPerOrder),
      deliveryPerOrder: amount(form.packaging.deliveryPerOrder),
    },
    occupancy: {
      monthlyRent: amount(form.occupancy.monthlyRent),
      monthlyCAM: amount(form.occupancy.monthlyCAM),
    },
    positions: form.positions.map((position) => ({
      id: position.id,
      name: text(position.name),
      headcount: amount(position.headcount),
      monthlyCostPerPerson: amount(position.monthlyCostPerPerson),
    })),
    owner: {
      monthlyDraw: amount(form.owner.monthlyDraw),
      benefitsAllowance: amount(form.owner.benefitsAllowance),
    },
    opexLines: form.opexLines.map((line) => ({
      id: line.id,
      name: text(line.name),
      monthlyAmount: amount(line.amount),
    })),
    capexItems: form.capexItems.map((item) => ({
      id: item.id,
      name: text(item.name),
      amount: amount(item.amount),
    })),
    assumptions: {
      projectionHorizonMonths: form.assumptions.projectionHorizonMonths,
      rampUpPreset: form.assumptions.rampUpPreset,
      scenarioVolumeDeltas: {
        bad: rate(form.assumptions.scenarioVolumeDeltas.bad),
        base: rate(form.assumptions.scenarioVolumeDeltas.base),
        good: rate(form.assumptions.scenarioVolumeDeltas.good),
      },
      salesPriceAnnualIncrease: rate(form.assumptions.salesPriceAnnualIncrease),
      productCogsAnnualIncrease: rate(form.assumptions.productCogsAnnualIncrease),
      fixedCostAnnualIncrease: rate(form.assumptions.fixedCostAnnualIncrease),
    },
  }
}
