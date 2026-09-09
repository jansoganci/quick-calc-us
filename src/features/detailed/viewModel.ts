import { calculateDetailed, validateDetailedInput } from '../../core/detailed-us/index.ts'
import type { DetailedFormState } from './formState.ts'
import { buildErrorMap } from './errors.ts'
import { collectGuardrails, type Guardrail } from './guardrails.ts'
import type { SectionId } from './labels.ts'
import { buildDetailedView, type DetailedView } from './resultView.ts'
import { toDetailedInput } from './toInput.ts'

/**
 * Form → engine → view, in one place. `useDetailedCalc` calls this on every
 * Calculate press and every live recalculation; it never talks to the engine
 * directly.
 */

export type EvaluateDetailedResult =
  | { ok: true; view: DetailedView; guardrails: Guardrail[] }
  | { ok: false; errors: Record<string, string>; errorSections: SectionId[] }

export function evaluateDetailed(form: DetailedFormState): EvaluateDetailedResult {
  const validated = validateDetailedInput(toDetailedInput(form))
  if (!validated.ok) {
    const { byPath, sections } = buildErrorMap(validated.errors, form)
    return { ok: false, errors: byPath, errorSections: sections }
  }

  const result = calculateDetailed(validated.input)
  const guardrails = collectGuardrails(validated.input)
  return { ok: true, view: buildDetailedView(result), guardrails }
}
