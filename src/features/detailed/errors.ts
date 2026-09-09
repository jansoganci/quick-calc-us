import type { ValidationError, ValidationPathSegment } from '../../core/detailed-us/index.ts'
import { formatCount, formatDecimal, parseNumber } from '../../lib/number.ts'
import type { DetailedFormState } from './formState.ts'
import { ERROR_COPY, type SectionId } from './labels.ts'

/**
 * `ValidationError[]` → messages keyed by path, plus the set of sections
 * holding an error. The engine owns which inputs are invalid; this file
 * only says it in English.
 */

export type ErrorMap = Record<string, string>

export function pathKey(path: readonly ValidationPathSegment[]): string {
  return path.join('.')
}

/** Fields whose limits are 0-1 fractions and must be shown as percentages. */
const RATE_LEAVES = new Set([
  'salesTaxRate',
  'posCommissionRate',
  'platformFeeRate',
  'salesPriceAnnualIncrease',
  'productCogsAnnualIncrease',
  'fixedCostAnnualIncrease',
  'dineIn',
  'takeaway',
  'delivery',
  'cash',
  'card',
  'bad',
  'base',
  'good',
])

function isRatePath(path: readonly ValidationPathSegment[]): boolean {
  const leaf = path[path.length - 1]
  return typeof leaf === 'string' && RATE_LEAVES.has(leaf)
}

function formatLimit(path: readonly ValidationPathSegment[], limit: number): string {
  if (!isRatePath(path)) return formatCount(limit)
  const percent = limit * 100
  const magnitude = formatDecimal(Math.abs(percent), 2)
  return percent < 0 ? `-${magnitude}%` : `${magnitude}%`
}

const SECTION_BY_ROOT: Record<string, SectionId> = {
  usState: 'jurisdiction',
  salesTaxRate: 'jurisdiction',
  products: 'products',
  channelMix: 'channels',
  packaging: 'channels',
  paymentMix: 'payments',
  posCommissionRate: 'payments',
  delivery: 'delivery',
  positions: 'positions',
  owner: 'owner',
  occupancy: 'occupancy',
  opexLines: 'opex',
  capexItems: 'capex',
  assumptions: 'assumptions',
}

export function sectionForPath(path: readonly ValidationPathSegment[]): SectionId | null {
  const root = path[0]
  if (typeof root !== 'string') return null
  return SECTION_BY_ROOT[root] ?? null
}

/** Sum of the typed percentages, or `null` when any of them is unreadable. */
export function mixTotalPercent(parts: readonly string[]): number | null {
  let total = 0
  for (const part of parts) {
    const parsed = parseNumber(part)
    if (parsed.status !== 'ok') return null
    total += parsed.value
  }
  return total
}

function mixMessage(which: 'channelMix' | 'paymentMix', form: DetailedFormState): string {
  const parts =
    which === 'channelMix'
      ? [form.channelMix.dineIn, form.channelMix.takeaway, form.channelMix.delivery]
      : [form.paymentMix.cash, form.paymentMix.card]

  const total = mixTotalPercent(parts)
  const short = which === 'channelMix' ? ERROR_COPY.channelMixShort : ERROR_COPY.paymentMixShort
  const over = which === 'channelMix' ? ERROR_COPY.channelMixOver : ERROR_COPY.paymentMixOver

  // An unreadable component already carries its own `not_a_number`; say the
  // rule without inventing a difference we cannot compute.
  if (total === null) return short('0%')

  const difference = `${formatDecimal(Math.abs(100 - total), 2)}%`
  return total < 100 ? short(difference) : over(difference)
}

export function messageFor(error: ValidationError, form: DetailedFormState): string {
  switch (error.code) {
    case 'required':
      return pathKey(error.path) === 'delivery.mode' ? ERROR_COPY.deliveryModeRequired : ERROR_COPY.required
    case 'not_a_number':
      return ERROR_COPY.not_a_number
    case 'below_min':
      return ERROR_COPY.below_min(formatLimit(error.path, error.limit ?? 0))
    case 'above_max':
      return ERROR_COPY.above_max(formatLimit(error.path, error.limit ?? 0))
    case 'invalid_value':
      return ERROR_COPY.invalid_value
    case 'empty_products':
      return ERROR_COPY.empty_products
    case 'mix_not_100':
      return mixMessage(pathKey(error.path) === 'paymentMix' ? 'paymentMix' : 'channelMix', form)
  }
}

export function buildErrorMap(
  errors: readonly ValidationError[],
  form: DetailedFormState,
): { byPath: ErrorMap; sections: SectionId[] } {
  const byPath: ErrorMap = {}
  const sections = new Set<SectionId>()

  for (const error of errors) {
    const key = pathKey(error.path)
    // First error per field wins, so a field never stacks two messages.
    byPath[key] ??= messageFor(error, form)
    const section = sectionForPath(error.path)
    if (section !== null) sections.add(section)
  }

  return { byPath, sections: [...sections] }
}
