/** Plain number formatting for non-money values: counts, days, months, periods. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

export function formatDecimal(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value)
}

export type ParsedNumber =
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'ok'; value: number }

/** A pure grouped integer using US thousands commas, e.g. `1,500,000`. */
const THOUSANDS_ONLY = /^\d{1,3}(,\d{3})+$/

/**
 * US number format only: `.` is the decimal separator, `,` is the thousands
 * separator. Paste of `1500000`, `1,500,000`, or `1500000.50` all parse to
 * the expected value; JS's own `.`-decimal convention means a plain typed
 * decimal like `9.50` already needs no translation.
 */
export function parseNumber(raw: string): ParsedNumber {
  const trimmed = raw.trim()
  if (trimmed === '') return { status: 'empty' }

  let sign = 1
  let unsigned = trimmed
  if (unsigned.startsWith('+')) unsigned = unsigned.slice(1)
  else if (unsigned.startsWith('-')) {
    sign = -1
    unsigned = unsigned.slice(1)
  }
  unsigned = unsigned.trim()
  if (unsigned === '') return { status: 'invalid' }

  let normalized: string
  if (unsigned.includes('.') || THOUSANDS_ONLY.test(unsigned)) {
    normalized = unsigned.replaceAll(',', '')
  } else {
    normalized = unsigned
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) return { status: 'invalid' }

  const value = Number(normalized)
  if (!Number.isFinite(value)) return { status: 'invalid' }
  return { status: 'ok', value: sign * value }
}

function stripLeadingZeros(digits: string): string {
  const stripped = digits.replace(/^0+/, '')
  return stripped === '' ? '0' : stripped
}

function formatIntegerDigits(digits: string): string {
  const stripped = stripLeadingZeros(digits)
  const numeric = Number(stripped)
  if (Number.isSafeInteger(numeric)) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(numeric)
  }
  const parts: string[] = []
  for (let index = stripped.length; index > 0; index -= 3) {
    parts.unshift(stripped.slice(Math.max(0, index - 3), index))
  }
  return parts.join(',')
}

/**
 * Presentation grouping for a value the user is still typing.
 * Does not round. An incomplete trailing decimal point is kept.
 */
export function formatTypedNumber(
  raw: string,
  options: { maxFractionDigits: number },
): string {
  const trimmed = raw.trim()
  if (trimmed === '') return ''

  let sign = ''
  let body = trimmed
  if (body.startsWith('+')) body = body.slice(1).trim()
  else if (body.startsWith('-')) {
    sign = '-'
    body = body.slice(1).trim()
  }

  if (body === '') return sign
  if (/[^0-9.,\s]/.test(body)) return raw

  const compact = body.replace(/\s/g, '')
  let intDigits: string
  let fracDigits: string | null = null
  let trailingDecimal = false

  if (compact.includes('.')) {
    const dotIndex = compact.indexOf('.')
    const intPart = compact.slice(0, dotIndex)
    const fracPart = compact.slice(dotIndex + 1)
    if (fracPart.includes('.')) return raw
    intDigits = intPart.replace(/\D/g, '')
    const fracClean = fracPart.replace(/\D/g, '')
    trailingDecimal = fracClean.length === 0
    if (options.maxFractionDigits === 0) {
      fracDigits = null
      trailingDecimal = false
    } else {
      fracDigits = fracClean.slice(0, options.maxFractionDigits)
    }
  } else {
    intDigits = compact.replace(/\D/g, '')
  }

  if (intDigits === '' && fracDigits === null && !trailingDecimal) return sign

  const intDisplay = formatIntegerDigits(intDigits === '' ? '0' : intDigits)
  let result = `${sign}${intDisplay}`
  if (trailingDecimal && (fracDigits === null || fracDigits === '')) {
    result += '.'
  } else if (fracDigits !== null && fracDigits.length > 0) {
    result += `.${fracDigits}`
  }
  return result
}

export function caretAfterFormat(previous: string, caret: number, next: string): number {
  const before = previous.slice(0, Math.max(0, caret))
  const digitCount = before.match(/\d/g)?.length ?? 0
  const endedOnDecimalPoint = before.replaceAll(',', '').endsWith('.')

  if (endedOnDecimalPoint) {
    const dotAt = next.indexOf('.')
    return dotAt === -1 ? next.length : dotAt + 1
  }

  let seen = 0
  for (let index = 0; index < next.length; index += 1) {
    const character = next[index]
    if (character !== undefined && /\d/.test(character)) {
      seen += 1
      if (seen === digitCount) return index + 1
    }
  }
  return next.length
}
