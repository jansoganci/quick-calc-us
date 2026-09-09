/**
 * Pure time-and-money helpers for the projection.
 *
 * Authority: docs/US_DETAILED_FINANCIAL_SPEC.md §4.1, §9.5, §12.
 *
 * This module must not import `calculate.ts`: it owns the multipliers and the
 * payback scan, while the month loop that calls the calculator lives in
 * `calculate.ts`. That keeps the module graph acyclic.
 */

import { RAMP_UP_TABLES } from './defaults.ts'
import type { MonthResult, PaybackResult, RampUpPreset } from './types.ts'

/**
 * Percentage of the scenario-adjusted stabilized quantity for a projection
 * month. Months past the end of a preset's table are at 100%.
 */
export function rampUpMultiplier(preset: RampUpPreset, month: number): number {
  return RAMP_UP_TABLES[preset][month - 1] ?? 1
}

/**
 * Annual escalation applied at a projection month.
 *
 * The month-1 exponent is 0, so month 1 always reproduces the exact values
 * the user entered. Escalation begins after month 1.
 */
export function escalationFactor(annualRate: number, month: number): number {
  return (1 + annualRate) ** ((month - 1) / 12)
}

/**
 * Investment payback. Scans rows that have already been computed; it never
 * recalculates an operating result, and CAPEX is never spread across months
 * as a charge.
 */
export function paybackFromProjection(
  projection: MonthResult[],
  totalInitialInvestment: number,
  stabilizedOperatingResult: number,
): PaybackResult {
  if (totalInitialInvestment === 0) {
    return { available: true, month: 0, cumulativeAtPayback: 0 }
  }

  let cumulative = 0
  for (const row of projection) {
    cumulative += row.monthlyOperatingResult
    if (cumulative >= totalInitialInvestment) {
      return { available: true, month: row.month ?? 0, cumulativeAtPayback: cumulative }
    }
  }

  if (stabilizedOperatingResult <= 0) {
    return { available: false, reason: 'non_positive_operating_result' }
  }
  return { available: false, reason: 'not_reached_within_horizon' }
}
