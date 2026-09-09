/**
 * The Detailed (US) monthly aggregation and top-level assembly.
 *
 * Authority: docs/US_DETAILED_FINANCIAL_SPEC.md §6.1, §8, §11, §12.1, §14.
 *
 * `calculateMonth` is the ONLY monthly aggregation in the engine. Scenarios,
 * the projection loop and break-even all consume it; none of them re-derives
 * revenue or cost.
 */

import { CHANNELS, DETAILED_US_DEFAULTS, SCENARIO_KEYS } from './defaults.ts'
import { calculateBreakEven } from './breakEven.ts'
import { buildMonthlyFixedCosts, calculateTotalInitialInvestment } from './monthlyCosts.ts'
import { escalationFactor, paybackFromProjection, rampUpMultiplier } from './projection.ts'
import { buildUnitEconomics } from './unitEconomics.ts'
import type {
  Channel,
  ChannelLine,
  DetailedResolvedInput,
  DetailedResult,
  MonthFactors,
  MonthResult,
  ProductLine,
  ScenarioKey,
  ScenarioResult,
} from './types.ts'

function emptyChannelLine(): ChannelLine {
  return {
    units: 0,
    grossCustomerSales: 0,
    netRevenue: 0,
    productCogs: 0,
    channelVariableCost: 0,
    paymentPlatformFee: 0,
    contribution: 0,
  }
}

function emptyProductLine(productId: string, name: string): ProductLine {
  return {
    productId,
    name,
    units: 0,
    grossCustomerSales: 0,
    netRevenue: 0,
    productCogs: 0,
    channelVariableCost: 0,
    paymentPlatformFee: 0,
    contribution: 0,
  }
}

/**
 * One month of the business.
 *
 * Everything that varies between a stabilized month, a scenario and a
 * projection row arrives through `factors` — there is no other lever.
 */
export function calculateMonth(input: DetailedResolvedInput, factors: MonthFactors): MonthResult {
  const unitEconomics = buildUnitEconomics(input, factors.priceFactor, factors.cogsFactor)
  const fixed = buildMonthlyFixedCosts(input, factors.fixedFactor)

  const byChannel: Record<Channel, ChannelLine> = {
    dineIn: emptyChannelLine(),
    takeaway: emptyChannelLine(),
    delivery: emptyChannelLine(),
  }

  // Ordered as `input.products` — one pass per product, mirroring the channel loop.
  const byProduct: ProductLine[] = unitEconomics.products.map((entry) => {
    // Scenario and ramp-up are already combined into `quantityFactor`;
    // operating days are applied after both multipliers.
    const monthlyQuantity = entry.product.dailyQuantity * factors.quantityFactor * input.assumptions.operatingDaysPerMonth
    const productLine = emptyProductLine(entry.product.id, entry.product.name)

    for (const channel of CHANNELS) {
      // The single place volume meets unit economics.
      const channelQuantity = monthlyQuantity * input.channelMix[channel]
      const unit = entry.byChannel[channel]
      const line = byChannel[channel]

      line.units += channelQuantity
      line.grossCustomerSales += channelQuantity * unit.grossPerUnit
      line.netRevenue += channelQuantity * unit.netPerUnit
      line.productCogs += channelQuantity * unit.unitProductCost
      line.channelVariableCost += channelQuantity * unit.unitChannelVariableCost
      line.paymentPlatformFee += channelQuantity * unit.unitPaymentPlatformFee
      line.contribution += channelQuantity * unit.unitContribution

      // Same six figures, summed across channels instead of across products.
      productLine.units += channelQuantity
      productLine.grossCustomerSales += channelQuantity * unit.grossPerUnit
      productLine.netRevenue += channelQuantity * unit.netPerUnit
      productLine.productCogs += channelQuantity * unit.unitProductCost
      productLine.channelVariableCost += channelQuantity * unit.unitChannelVariableCost
      productLine.paymentPlatformFee += channelQuantity * unit.unitPaymentPlatformFee
      productLine.contribution += channelQuantity * unit.unitContribution
    }

    return productLine
  })

  const lines = CHANNELS.map((channel) => byChannel[channel])
  const sum = (pick: (line: ChannelLine) => number): number => lines.reduce((total, line) => total + pick(line), 0)

  const grossCustomerSales = sum((line) => line.grossCustomerSales)
  const netRevenue = sum((line) => line.netRevenue)
  const productCogs = sum((line) => line.productCogs)
  const channelVariableCost = sum((line) => line.channelVariableCost)
  const paymentPlatformFee = sum((line) => line.paymentPlatformFee)
  const totalVariableCost = productCogs + channelVariableCost + paymentPlatformFee

  return {
    month: factors.month,
    quantityFactor: factors.quantityFactor,
    priceFactor: factors.priceFactor,
    cogsFactor: factors.cogsFactor,
    fixedFactor: factors.fixedFactor,
    totalUnits: sum((line) => line.units),
    grossCustomerSales,
    // Delivery contributes 0 to this gap by construction (grossPerUnit ===
    // netPerUnit there — UD-1), so the aggregate still isolates exactly the
    // dine-in/takeaway sales tax, with no separate accumulator needed.
    salesTaxAmount: grossCustomerSales - netRevenue,
    netRevenue,
    productCogs,
    channelVariableCost,
    paymentPlatformFee,
    totalVariableCost,
    totalContribution: sum((line) => line.contribution),
    monthlyPayroll: fixed.monthlyPayroll,
    monthlyOwnerCost: fixed.monthlyOwnerCost,
    monthlyOccupancyCost: fixed.monthlyOccupancyCost,
    monthlyOpex: fixed.monthlyOpex,
    rentCost: fixed.rentCost,
    monthlyFixedCost: fixed.monthlyFixedCost,
    monthlyOperatingResult: netRevenue - totalVariableCost - fixed.monthlyFixedCost,
    byChannel,
    byProduct,
  }
}

function buildScenario(input: DetailedResolvedInput, key: ScenarioKey, totalInitialInvestment: number): ScenarioResult {
  const { assumptions } = input
  const scenarioMultiplier = 1 + assumptions.scenarioVolumeDeltas[key]

  // Steady state: no ramp-up, no escalation.
  const stabilizedMonth = calculateMonth(input, {
    month: null,
    quantityFactor: scenarioMultiplier,
    priceFactor: 1,
    cogsFactor: 1,
    fixedFactor: 1,
  })

  const projection: MonthResult[] = []
  for (let month = 1; month <= assumptions.projectionHorizonMonths; month += 1) {
    projection.push(
      calculateMonth(input, {
        month,
        quantityFactor: scenarioMultiplier * rampUpMultiplier(assumptions.rampUpPreset, month),
        priceFactor: escalationFactor(assumptions.salesPriceAnnualIncrease, month),
        cogsFactor: escalationFactor(assumptions.productCogsAnnualIncrease, month),
        fixedFactor: escalationFactor(assumptions.fixedCostAnnualIncrease, month),
      }),
    )
  }

  return {
    scenarioMultiplier,
    stabilizedMonth,
    projection,
    payback: paybackFromProjection(projection, totalInitialInvestment, stabilizedMonth.monthlyOperatingResult),
  }
}

export function calculateDetailed(input: DetailedResolvedInput): DetailedResult {
  const totalInitialInvestment = calculateTotalInitialInvestment(input)
  const { assumptions } = input

  const scenarios = {} as Record<ScenarioKey, ScenarioResult>
  for (const key of SCENARIO_KEYS) {
    scenarios[key] = buildScenario(input, key, totalInitialInvestment)
  }

  // Break-even is scenario-invariant (the mix does not change), so it is
  // computed once, from the base stabilized month.
  const base = scenarios.base.stabilizedMonth

  return {
    totalInitialInvestment,
    breakEven: calculateBreakEven({
      totalContribution: base.totalContribution,
      totalUnits: base.totalUnits,
      monthlyFixedCost: base.monthlyFixedCost,
      operatingDaysPerMonth: assumptions.operatingDaysPerMonth,
    }),
    scenarios,
    meta: {
      detailedEngineVersion: DETAILED_US_DEFAULTS.detailedEngineVersion,
      currency: DETAILED_US_DEFAULTS.currency,
      revenueBasis: 'net',
      // Mandatory assumption transparency: the escalation rates travel with
      // the result so a 0% default is never hidden.
      assumptions: {
        usState: input.usState,
        salesTaxRate: input.salesTaxRate,
        operatingDaysPerMonth: assumptions.operatingDaysPerMonth,
        projectionHorizonMonths: assumptions.projectionHorizonMonths,
        rampUpPreset: assumptions.rampUpPreset,
        scenarioVolumeDeltas: assumptions.scenarioVolumeDeltas,
        deliveryMode: input.delivery.mode,
        platformFeeRate: input.delivery.platformFeeRate,
        posCommissionRate: input.posCommissionRate,
        salesPriceAnnualIncrease: assumptions.salesPriceAnnualIncrease,
        productCogsAnnualIncrease: assumptions.productCogsAnnualIncrease,
        fixedCostAnnualIncrease: assumptions.fixedCostAnnualIncrease,
      },
    },
  }
}
