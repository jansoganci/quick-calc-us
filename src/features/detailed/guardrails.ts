import type { DetailedResolvedInput } from '../../core/detailed-us/index.ts'
import { formatCount } from '../../lib/number.ts'
import { GUARDRAIL_COPY, type SectionId } from './labels.ts'

/**
 * Guardrails are notes, not errors: they never block Calculate and never use
 * the error token. They are derived here from the resolved input and
 * require nothing from the engine.
 *
 * The owner rule is static guidance, not detection — there is no way to
 * tell whether a named position actually is the owner.
 */

export type Guardrail = {
  id: string
  section: SectionId
  message: string
}

export function collectGuardrails(input: DetailedResolvedInput): Guardrail[] {
  const guardrails: Guardrail[] = []

  // Payroll is usually the largest fixed cost, so a staffed position with no
  // cost silently removes the model's biggest expense. A position with zero
  // headcount is a deliberate not-yet-hiring entry and must not warn.
  for (const position of input.positions) {
    if (position.headcount > 0 && position.monthlyCostPerPerson === 0) {
      guardrails.push({
        id: `employer-cost-${position.id}`,
        section: 'positions',
        message: GUARDRAIL_COPY.employerCostMissing(position.name, formatCount(position.headcount)),
      })
    }
  }

  // Do not count the owner twice.
  if (input.owner.monthlyDraw > 0 && input.positions.length > 0) {
    guardrails.push({
      id: 'owner-not-an-employee',
      section: 'positions',
      message: GUARDRAIL_COPY.ownerNotAnEmployee,
    })
  }

  return guardrails
}
