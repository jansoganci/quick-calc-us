/**
 * Operating break-even — docs/US_DETAILED_FINANCIAL_SPEC.md §12.3.
 *
 * This module contains no contribution formula. It consumes totals already
 * produced by the monthly aggregation, which is what guarantees break-even
 * and `calculateMonth` share one definition.
 *
 * Do not restate the weighted contribution as a mix-weighted average of
 * `unitContribution`: it is algebraically identical to the division below and
 * would be a second expression for one quantity.
 *
 * CAPEX is excluded. Break-even answers the operating question only, and is
 * expressed in product units — never customers, seats or tickets.
 */

import type { BreakEvenBasis, BreakEvenResult } from './types.ts'

export function calculateBreakEven(basis: BreakEvenBasis): BreakEvenResult {
  if (basis.totalUnits === 0) {
    return { available: false, reason: 'no_sales_volume' }
  }

  const weightedContributionPerUnit = basis.totalContribution / basis.totalUnits
  if (weightedContributionPerUnit <= 0) {
    return { available: false, reason: 'non_positive_contribution' }
  }

  const unitsPerMonth = basis.monthlyFixedCost / weightedContributionPerUnit
  return {
    available: true,
    weightedContributionPerUnit,
    unitsPerMonth,
    unitsPerDay: unitsPerMonth / basis.operatingDaysPerMonth,
  }
}
