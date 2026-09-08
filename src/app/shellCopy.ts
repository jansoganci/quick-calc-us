/**
 * Copy owned by the application shell — the masthead and the colophon.
 *
 * Placeholder values only. Product name, domain and final English copy are not
 * decided (US-8 in `docs/US_PRODUCT_SCOPE.md` §9 blocks *UI* copy, not the
 * engine). Update this file once the product owner locks the real wording —
 * it stays the single home for shell copy either way (U4).
 */

export const SHELL_COPY = {
  productName: 'Quick Calc (US)',
  slogan: "What's left after a sale?",
  /** Set once the domain is confirmed; wrangler.jsonc routes stay unset until then. */
  domain: null as string | null,
  metaDescription:
    'A simple cost and feasibility calculator for US coffee shops and cafes. No accounting background required.',
  footerScope: 'USD · United States',
  footerNature: 'A simplified preliminary estimate.',
  /**
   * Colophon attribution. `null` renders no attribution at all, which is the
   * safe default: a wrong handle would send visitors to somebody else's profile.
   */
  authorHandle: null as string | null,
  authorUrl: null as string | null,
} as const

/** Browser tab, bookmarks and share previews. */
export const DOCUMENT_TITLE = `${SHELL_COPY.productName} — ${SHELL_COPY.slogan}`
