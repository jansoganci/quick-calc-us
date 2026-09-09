import { describe, expect, it } from 'vitest'
import { formatUsd, formatUsdExact } from './money.ts'

describe('formatUsd', () => {
  it('formats monthly money with thousand separators, no decimals, and a $ prefix', () => {
    expect(formatUsd(1_945_947)).toBe('$1,945,947')
    expect(formatUsd(100_000)).toBe('$100,000')
  })

  it('formats a negative amount with the sign before the $', () => {
    expect(formatUsd(-3_363)).toBe('-$3,363')
  })
})

describe('formatUsdExact', () => {
  it('formats per-sale money with two decimals', () => {
    expect(formatUsdExact(10.35, 2)).toBe('$10.35')
    expect(formatUsdExact(0.4484, 2)).toBe('$0.45')
  })

  it('formats payback with one decimal', () => {
    expect(formatUsdExact(7.7, 1)).toBe('$7.7')
    expect(formatUsdExact(4.73, 1)).toBe('$4.7')
  })

  it('formats a negative amount with the sign before the $', () => {
    expect(formatUsdExact(-0.4484, 2)).toBe('-$0.45')
  })
})
