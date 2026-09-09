import { US_STATE_NAMES } from '../../data/us/salesTaxRates.ts'
import { formatDecimal, parseNumber } from '../../lib/number.ts'
import { mixTotalPercent } from './errors.ts'
import { initialForm, type DetailedFormState } from './formState.ts'
import { COPY, DELIVERY_MODE_LABELS, SECTION_IDS, type SectionId } from './labels.ts'

/**
 * The stand-in a section header shows before the first calculation: a
 * count, a mix total, or `—`. It is never a money figure — money comes from
 * the engine, and before Calculate there is no engine output (DESIGN_DIRECTION V6).
 */

/** Sum of the typed percentages, formatted, or an em dash when any component is unreadable. */
export function mixTotalDisplay(parts: readonly string[]): string {
  const total = mixTotalPercent(parts)
  return total === null ? COPY.none : `${formatDecimal(total, 2)}%`
}

function filledOrNone(values: readonly string[]): string {
  return values.some((value) => value.trim() !== '') ? 'Entered' : COPY.none
}

function countOrNone(count: number): string {
  return count === 0 ? COPY.none : COPY.lineCount(count)
}

export function sectionSummary(form: DetailedFormState, section: SectionId): string {
  switch (section) {
    case 'jurisdiction':
      return form.usState === '' ? COPY.none : US_STATE_NAMES[form.usState]
    case 'products':
      return COPY.productCount(form.products.length)
    case 'channels':
      return mixTotalDisplay([form.channelMix.dineIn, form.channelMix.takeaway, form.channelMix.delivery])
    case 'payments':
      return mixTotalDisplay([form.paymentMix.cash, form.paymentMix.card])
    case 'delivery':
      return form.delivery.mode === null ? COPY.none : DELIVERY_MODE_LABELS[form.delivery.mode]
    case 'positions':
      return form.positions.length === 0 ? COPY.none : COPY.positionCount(form.positions.length)
    case 'owner':
      return filledOrNone([form.owner.monthlyDraw, form.owner.benefitsAllowance])
    case 'occupancy':
      return filledOrNone([form.occupancy.monthlyRent, form.occupancy.monthlyCAM])
    case 'opex':
      return countOrNone(form.opexLines.length)
    case 'capex':
      return countOrNone(form.capexItems.length)
    case 'assumptions':
      return assumptionsChanged(form) ? 'Edited' : COPY.defaultsUnchanged
  }
}

function assumptionsChanged(form: DetailedFormState): boolean {
  return JSON.stringify(form.assumptions) !== JSON.stringify(initialForm().assumptions)
}

/** The ordered sections actually shown: delivery exists only when there is a delivery share. */
export function visibleSections(form: DetailedFormState): SectionId[] {
  const deliveryShare = parseNumber(form.channelMix.delivery)
  const hasDelivery = deliveryShare.status === 'ok' && deliveryShare.value > 0
  return SECTION_IDS.filter((section) => section !== 'delivery' || hasDelivery)
}
