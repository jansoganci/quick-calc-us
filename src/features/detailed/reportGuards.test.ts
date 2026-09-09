/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'

/**
 * Structural guards for the report, which exist because the two rules they
 * enforce are invisible at a call site and expensive to discover on paper.
 *
 * 1. **One formatting system.** Every figure in the report is `en-US`/USD
 *    formatted by `lib/money.ts`, `lib/number.ts` and `lib/percent.ts`, the
 *    same helpers the screen uses. A component that reached for
 *    `Intl.NumberFormat` itself would produce a figure that is correct today
 *    and drifts tomorrow.
 * 2. **No recomputation.** The report presents `DetailedView`; it never calls
 *    the engine, because a figure computed twice has two sources of truth
 *    (CLAUDE.md §3).
 *
 * The third guard is about the print breakpoint: `tailwind.config.ts`
 * redefines `lg` as a `raw` screen so it also matches print, and Tailwind
 * generates no `max-lg:` variant for a raw screen. Nothing uses one; this
 * keeps it that way.
 */

const sources = import.meta.glob('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const appSources = import.meta.glob('../../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const REPORT_MODULES = [
  './reportView.ts',
  './components/ReportCover.tsx',
  './components/ReportAppendix.tsx',
  './components/ReportActionButton.tsx',
  './components/ReportNameDialog.tsx',
  './hooks/useReportPrint.ts',
]

function sourceOf(path: string): string {
  const source = sources[path]
  if (source === undefined) throw new Error(`report module not found: ${path}`)
  return source
}

/** Comments explain the rules; only code may break them. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

describe('the report has one formatting system', () => {
  it('never formats a number itself', () => {
    for (const path of REPORT_MODULES) {
      const body = code(sourceOf(path))
      expect(body, `${path} must format through lib/`).not.toContain('Intl.NumberFormat')
      expect(body, `${path} must format through lib/`).not.toContain('toFixed')
      expect(body, `${path} must format through lib/`).not.toContain('toLocaleString')
    }
  })

  it('formats money, counts and percentages only through lib/', () => {
    const body = code(sourceOf('./reportView.ts'))
    expect(body).toContain("from '../../lib/money.ts'")
    expect(body).toContain("from '../../lib/number.ts'")
    expect(body).toContain("from '../../lib/percent.ts'")
  })
})

describe('the report recomputes nothing', () => {
  it('calls no engine function', () => {
    for (const path of REPORT_MODULES) {
      const body = code(sourceOf(path))
      expect(body, `${path} must not reach the engine`).not.toContain('calculateDetailed')
      expect(body, `${path} must not reach the engine`).not.toContain('validateDetailedInput')
    }
  })

  it('keeps the business name off the calculation path', () => {
    // `toInput.ts` is the only door into the engine, and report metadata is
    // not an input: the name must not appear in the form state or its
    // conversion.
    expect(code(sourceOf('./toInput.ts'))).not.toContain('businessName')
    expect(code(sourceOf('./formState.ts'))).not.toContain('businessName')
  })
})

describe('the print breakpoint stays usable', () => {
  it('uses no max-lg: variant, which a raw screen cannot generate', () => {
    for (const [path, source] of Object.entries(appSources)) {
      expect(source, `${path} uses max-lg:, which the print breakpoint cannot emit`).not.toContain('max-lg:')
    }
  })
})
