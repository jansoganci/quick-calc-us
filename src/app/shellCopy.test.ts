import { describe, expect, it } from 'vitest'
import { DOCUMENT_TITLE, SHELL_COPY } from './shellCopy.ts'

/**
 * The shell owns the product's name and slogan. `main.tsx` applies
 * `DOCUMENT_TITLE` at startup, so the static title in `index.html` is only a
 * first-paint fallback and this module stays the source of truth.
 */

describe('brand', () => {
  it('keeps the slogan short enough to sit beside the product name', () => {
    expect(SHELL_COPY.slogan.length).toBeLessThanOrEqual(40)
  })

  it('promises nothing the model cannot deliver', () => {
    const brandCopy = [SHELL_COPY.slogan, SHELL_COPY.metaDescription].join(' ').toLowerCase()
    for (const banned of ['guarantee', 'guaranteed', ' ai ', 'profit guaranteed']) {
      expect(brandCopy, `brand copy contains "${banned}"`).not.toContain(banned)
    }
  })
})

describe('document title', () => {
  it('is built from the product name and slogan', () => {
    expect(DOCUMENT_TITLE).toBe(`${SHELL_COPY.productName} — ${SHELL_COPY.slogan}`)
  })
})
