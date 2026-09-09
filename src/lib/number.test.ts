import { describe, expect, it } from 'vitest'
import { caretAfterFormat, formatTypedNumber, parseNumber } from './number.ts'

describe('formatTypedNumber', () => {
  const money = { maxFractionDigits: 2 }

  it('groups thousands with a US comma', () => {
    expect(formatTypedNumber('1000', money)).toBe('1,000')
    expect(formatTypedNumber('10000', money)).toBe('10,000')
    expect(formatTypedNumber('450000', money)).toBe('450,000')
    expect(formatTypedNumber('1500000', money)).toBe('1,500,000')
  })

  it('displays supported decimals with a US decimal point', () => {
    expect(formatTypedNumber('1500000.50', money)).toBe('1,500,000.50')
    expect(formatTypedNumber('1,500,000.50', money)).toBe('1,500,000.50')
    expect(formatTypedNumber('14.5', money)).toBe('14.5')
  })

  it('keeps a trailing decimal point while the user is typing decimals', () => {
    expect(formatTypedNumber('14.', money)).toBe('14.')
    expect(formatTypedNumber('1500.', money)).toBe('1,500.')
  })

  it('leaves invalid keystrokes alone', () => {
    expect(formatTypedNumber('12a', money)).toBe('12a')
  })

  it('does not change the numeric value of a completed number', () => {
    const samples = ['1000', '1,000', '450000', '1,500,000.50', '1500000.50', '14.50']
    for (const sample of samples) {
      const formatted = formatTypedNumber(sample, money)
      const before = parseNumber(sample)
      const after = parseNumber(formatted)
      expect(before.status).toBe('ok')
      expect(after.status).toBe('ok')
      if (before.status !== 'ok' || after.status !== 'ok') return
      expect(after.value).toBe(before.value)
    }
  })
})

describe('parseNumber', () => {
  it('parses plain and grouped integers', () => {
    expect(parseNumber('1500000')).toEqual({ status: 'ok', value: 1_500_000 })
    expect(parseNumber('1,500,000')).toEqual({ status: 'ok', value: 1_500_000 })
  })

  it('parses a US-format decimal', () => {
    expect(parseNumber('9.50')).toEqual({ status: 'ok', value: 9.5 })
    expect(parseNumber('1,500,000.50')).toEqual({ status: 'ok', value: 1_500_000.5 })
  })

  it('parses a negative number', () => {
    expect(parseNumber('-3362.81')).toEqual({ status: 'ok', value: -3362.81 })
  })

  it('is empty for blank input and invalid for garbage', () => {
    expect(parseNumber('')).toEqual({ status: 'empty' })
    expect(parseNumber('   ')).toEqual({ status: 'empty' })
    expect(parseNumber('abc')).toEqual({ status: 'invalid' })
    expect(parseNumber('1,50')).toEqual({ status: 'invalid' })
  })
})

describe('caretAfterFormat', () => {
  it('stays after the last typed digit when grouping commas are inserted', () => {
    expect(caretAfterFormat('1000', 4, '1,000')).toBe(5)
    expect(caretAfterFormat('1,0000', 6, '10,000')).toBe(6)
  })

  it('stays after a trailing decimal point', () => {
    expect(caretAfterFormat('14.', 3, '14.')).toBe(3)
  })
})
