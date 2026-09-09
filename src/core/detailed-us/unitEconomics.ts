/**
 * Per-unit, volume-free economics — docs/US_DETAILED_FINANCIAL_SPEC.md §6-7.
 *
 * Nothing in this module may involve quantity: it must never read
 * `product.dailyQuantity`, never apply `channelMix`, never touch
 * `operatingDaysPerMonth`, and never produce a monthly total. Quantity enters
 * exactly once, in `calculate.ts`.
 *
 * `product` is carried on each entry only so the monthly aggregation can
 * iterate a single array.
 */

import type { Channel, DetailedResolvedInput, ProductUnitEconomics, UnitEconomics, UnitEconomicsLine } from './types.ts'

export function buildUnitEconomics(
  input: DetailedResolvedInput,
  priceFactor: number,
  cogsFactor: number,
): UnitEconomics {
  // Cash carries no processing commission, so it contributes nothing here.
  // No meal-card term — that payment method doesn't exist in this product.
  const directFeeRate = input.paymentMix.card * input.posCommissionRate

  // Channel variable costs escalate with the Product COGS rate while
  // remaining a separate cost line from Product COGS. Own-courier payment is
  // already 0 under Mode 2 — validation zeroed it.
  const unitTakeawayVariable = input.packaging.takeawayPerOrder * cogsFactor
  const unitDeliveryVariable =
    (input.packaging.deliveryPerOrder + input.delivery.ownCourierCostPerDeliveryOrder) * cogsFactor

  const products: ProductUnitEconomics[] = input.products.map((product) => {
    const dineInPrice = product.normalPrice * priceFactor
    const takeawayPrice = product.normalPrice * priceFactor
    const deliveryPrice = product.onlinePrice * priceFactor
    const unitProductCost = product.unitProductCost * cogsFactor

    /** Dine-in and takeaway: pre-tax price, sales tax added on top (US-1), fee on the tax-inclusive gross. */
    function directChannelLine(netPerUnit: number, unitChannelVariableCost: number): UnitEconomicsLine {
      const salesTaxPerUnit = netPerUnit * input.salesTaxRate
      const grossPerUnit = netPerUnit + salesTaxPerUnit
      const unitPaymentPlatformFee = grossPerUnit * directFeeRate
      return {
        netPerUnit,
        salesTaxPerUnit,
        grossPerUnit,
        unitProductCost,
        unitChannelVariableCost,
        unitPaymentPlatformFee,
        unitContribution: netPerUnit - unitProductCost - unitChannelVariableCost - unitPaymentPlatformFee,
      }
    }

    /**
     * Delivery: no merchant sales tax at all (UD-1) — most states require the
     * marketplace to collect and remit it. `grossPerUnit` collapses to
     * `netPerUnit` by construction; the platform fee is on that same figure,
     * since there is no tax layer to strip out.
     */
    function deliveryLine(netPerUnit: number, unitChannelVariableCost: number): UnitEconomicsLine {
      const unitPaymentPlatformFee = netPerUnit * input.delivery.platformFeeRate
      return {
        netPerUnit,
        salesTaxPerUnit: 0,
        grossPerUnit: netPerUnit,
        unitProductCost,
        unitChannelVariableCost,
        unitPaymentPlatformFee,
        unitContribution: netPerUnit - unitProductCost - unitChannelVariableCost - unitPaymentPlatformFee,
      }
    }

    const byChannel: Record<Channel, UnitEconomicsLine> = {
      dineIn: directChannelLine(dineInPrice, 0),
      takeaway: directChannelLine(takeawayPrice, unitTakeawayVariable),
      delivery: deliveryLine(deliveryPrice, unitDeliveryVariable),
    }

    return { product, byChannel }
  })

  return { directFeeRate, products }
}
