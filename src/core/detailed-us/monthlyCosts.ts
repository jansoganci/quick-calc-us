/**
 * Volume-independent monthly costs and total initial investment.
 *
 * Authority: docs/US_DETAILED_FINANCIAL_SPEC.md §9, §10.
 *
 * Nothing here depends on sales volume. CAPEX is summed here but is returned
 * separately and is never added to `monthlyFixedCost`: there is no monthly
 * recovery allocation in Detailed.
 */

import type { DetailedResolvedInput, MonthlyFixedCosts } from './types.ts'

export function buildMonthlyFixedCosts(input: DetailedResolvedInput, fixedFactor: number): MonthlyFixedCosts {
  // One fully-loaded cost per position (UD-2) — the user enters it directly;
  // there is no gross-to-net payroll engine.
  const basePayroll = input.positions.reduce(
    (total, position) => total + position.headcount * position.monthlyCostPerPerson,
    0,
  )

  // Draw + benefits allowance are ordinary monthly operating costs (UD-3),
  // not a computed self-employment tax.
  const baseOwnerCost = input.owner.monthlyDraw + input.owner.benefitsAllowance

  // No withholding, no basis control (US-2) — the cash cost is exactly what was entered.
  const baseOccupancyCost = input.occupancy.monthlyRent + input.occupancy.monthlyCAM

  const baseOpex = input.opexLines.reduce((total, line) => total + line.monthlyAmount, 0)

  const monthlyPayroll = basePayroll * fixedFactor
  const monthlyOwnerCost = baseOwnerCost * fixedFactor
  const monthlyOccupancyCost = baseOccupancyCost * fixedFactor
  const monthlyOpex = baseOpex * fixedFactor

  return {
    monthlyPayroll,
    monthlyOwnerCost,
    monthlyOccupancyCost,
    monthlyOpex,
    rentCost: input.occupancy.monthlyRent * fixedFactor,
    monthlyFixedCost: monthlyPayroll + monthlyOwnerCost + monthlyOccupancyCost + monthlyOpex,
  }
}

/** Opening stock is included (part of capexItems). Takes no escalation factor, so CAPEX cannot escalate. */
export function calculateTotalInitialInvestment(input: DetailedResolvedInput): number {
  return input.capexItems.reduce((total, item) => total + item.amount, 0)
}
