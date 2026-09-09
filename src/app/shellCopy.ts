/**
 * Copy owned by the application shell — the masthead and the colophon.
 *
 * Placeholder values only. Product name, domain and final English copy are not
 * decided (US-8 in `docs/US_PRODUCT_SCOPE.md` §9 blocks *UI* copy, not the
 * engine). Update this file once the product owner locks the real wording —
 * it stays the single home for shell copy either way (U4).
 */

export type CalculationMode = 'quick' | 'detailed'

export const SHELL_COPY = {
  productName: 'Quick Calc (US)',
  slogan: "What's left after a sale?",
  /** Set once the domain is confirmed; wrangler.jsonc routes stay unset until then. */
  domain: null as string | null,
  metaDescription:
    'A simple cost and feasibility calculator for US coffee shops and cafes. No accounting background required.',
  footerScope: 'USD · United States',
  footerNature: 'A simplified preliminary estimate.',
  modeNavigation: 'Calculation mode',
  quickMode: 'Quick Calculation',
  detailedMode: 'Detailed Feasibility',
  quickModeSummary: 'A preview from 8 questions',
  detailedModeSummary: 'Products, channels, staff, scenarios',
  /**
   * Colophon attribution. `null` renders no attribution at all, which is the
   * safe default: a wrong handle would send visitors to somebody else's profile.
   */
  authorHandle: null as string | null,
  authorUrl: null as string | null,
} as const

/** The anchor each mode owns, so the mode row entries stay real links. */
export const MODE_ANCHORS = {
  quick: 'quick-calculation',
  detailed: 'detailed-feasibility',
} as const satisfies Record<CalculationMode, string>

export const MODE_LABELS = {
  quick: SHELL_COPY.quickMode,
  detailed: SHELL_COPY.detailedMode,
} as const satisfies Record<CalculationMode, string>

export const MODE_DESCRIPTIONS = {
  quick: SHELL_COPY.quickModeSummary,
  detailed: SHELL_COPY.detailedModeSummary,
} as const satisfies Record<CalculationMode, string>

export const MODES = ['quick', 'detailed'] as const satisfies readonly CalculationMode[]

/** Browser tab, bookmarks and share previews. */
export const DOCUMENT_TITLE = `${SHELL_COPY.productName} — ${SHELL_COPY.slogan}`
