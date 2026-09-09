import { SHELL_COPY } from '../../app/shellCopy.ts'

export type SectionId =
  | 'jurisdiction'
  | 'products'
  | 'channels'
  | 'payments'
  | 'delivery'
  | 'positions'
  | 'owner'
  | 'occupancy'
  | 'opex'
  | 'capex'
  | 'assumptions'

export const SECTION_IDS: readonly SectionId[] = [
  'jurisdiction',
  'products',
  'channels',
  'payments',
  'delivery',
  'positions',
  'owner',
  'occupancy',
  'opex',
  'capex',
  'assumptions',
]

export const SECTION_LABELS: Record<SectionId, string> = {
  jurisdiction: 'Location',
  products: 'Products',
  channels: 'Channel mix',
  payments: 'Payment mix',
  delivery: 'Delivery',
  positions: 'Staff',
  owner: 'Owner',
  occupancy: 'Rent & occupancy',
  opex: 'Other operating expenses',
  capex: 'Initial investment',
  assumptions: 'Projection & scenarios',
}

export const CHANNEL_LABELS = {
  dineIn: 'Dine-in',
  takeaway: 'Takeout',
  delivery: 'Delivery',
} as const

export const PAYMENT_LABELS = {
  cash: 'Cash',
  card: 'Card',
} as const

export const DELIVERY_MODE_LABELS = {
  platformOnly: 'Merchant courier (platform only takes the order)',
  platformCourier: "Platform's own courier delivers",
} as const

export const RAMP_UP_LABELS = {
  slow: 'Slow',
  normal: 'Normal',
  fast: 'Fast',
} as const

export const SCENARIO_LABELS = {
  bad: 'Bad',
  base: 'Base',
  good: 'Good',
} as const

/**
 * The nine categories the reconciliation bar, the Sankey and the appendix all
 * read off the same stabilized month, in the order the money leaves the
 * gross figure (docs/US_DETAILED_FEASIBILITY_PHASE5_PLAN.md §7.2).
 */
export type BreakdownKey =
  | 'salesTax'
  | 'productCogs'
  | 'channelVariableCost'
  | 'paymentPlatformFee'
  | 'payroll'
  | 'owner'
  | 'occupancy'
  | 'opex'
  | 'operatingResult'

export const BREAKDOWN_LABELS: Record<BreakdownKey, string> = {
  salesTax: 'Sales tax',
  productCogs: 'Product cost',
  channelVariableCost: 'Channel variable cost',
  paymentPlatformFee: 'POS / platform fee',
  payroll: 'Payroll',
  owner: 'Owner',
  occupancy: 'Rent & occupancy',
  opex: 'Other opex',
  operatingResult: 'Operating result',
}

/** Same anatomy as Quick's `HeadlineSegment` — a sentence with inline figures. */
export type VerdictTone = 'text' | 'amount' | 'accent'
export type VerdictSegment = { text: string; tone: VerdictTone }

export const VERDICT = {
  zeroVolume: (fixedCost: string): VerdictSegment[] => [
    { text: 'At the base scenario, this business has zero sales volume; monthly fixed costs alone are ', tone: 'text' },
    { text: fixedCost, tone: 'amount' },
    { text: '.', tone: 'text' },
  ],
  deficit: (deficit: string): VerdictSegment[] => [
    { text: 'At the base scenario, this business runs a ', tone: 'text' },
    { text: deficit, tone: 'amount' },
    { text: ' monthly deficit.', tone: 'text' },
  ],
  breakEvenResult: (): VerdictSegment[] => [
    { text: 'At the base scenario, this business exactly breaks even each month.', tone: 'text' },
  ],
  profitNoInvestment: (result: string): VerdictSegment[] => [
    { text: 'At the base scenario, this business keeps ', tone: 'text' },
    { text: result, tone: 'accent' },
    { text: ' a month, with no investment to recover.', tone: 'text' },
  ],
  profitWithPayback: (result: string, investment: string, month: string): VerdictSegment[] => [
    { text: 'At the base scenario, this business keeps ', tone: 'text' },
    { text: result, tone: 'accent' },
    { text: ' a month and recovers its ', tone: 'text' },
    { text: investment, tone: 'amount' },
    { text: ' initial investment by month ', tone: 'text' },
    { text: month, tone: 'amount' },
    { text: '.', tone: 'text' },
  ],
  profitNoPayback: (result: string, horizon: string): VerdictSegment[] => [
    { text: 'At the base scenario, this business keeps ', tone: 'text' },
    { text: result, tone: 'accent' },
    { text: ' a month but does not recover its initial investment within the ', tone: 'text' },
    { text: `${horizon}-month`, tone: 'amount' },
    { text: ' projection.', tone: 'text' },
  ],
} as const

/** Same six figures as the breakdown table, ordered dine-in / takeout / delivery. */
export const BREAKDOWN_COLUMNS = {
  units: 'Units',
  grossCustomerSales: 'Customer payment',
  netRevenue: 'Revenue',
  productCogs: 'Product cost',
  channelVariableCost: 'Channel variable cost',
  paymentPlatformFee: 'POS / platform fee',
  contribution: 'Contribution',
} as const

export const COPY = {
  ...SHELL_COPY,
  calculate: 'Calculate',
  calculateLive: 'Every valid change now updates the result live.',
  calculateInvalid: (count: number, sections: string) =>
    count === 1 ? `Check the ${sections} section.` : `Check these sections: ${sections}.`,
  calculateNoProducts: 'Add at least one product to see a result.',
  copySummary: 'Copy summary',
  copied: 'Copied',
  emptyResult:
    'No figures appear before Calculate. Fill in the sections on the left and press Calculate to see the breakdown, break-even and payback here.',
  resultSection: 'Result',
  addProduct: '+ Add product',
  removeRow: 'Remove',
  addPosition: '+ Add position',
  addOpexLine: '+ Add expense',
  addCapexItem: '+ Add item',
  mixShare: 'Share',
  mixTotal: 'Total',
  none: '—',
  scenario: 'Scenario',
  stabilizedMonth: 'Stabilized month',
  monthlyOperatingResult: 'Monthly operating result',
  breakEven: 'Break-even',
  breakEvenUnitsPerDay: 'units / day',
  breakEvenUnitsPerMonth: 'units / month',
  payback: 'Investment payback',
  paybackMonth: (month: number) => `Month ${month}`,
  paybackUnavailableNoSales: 'No sales volume — break-even cannot be computed.',
  paybackUnavailableNonPositive: 'Contribution is not positive at this mix — break-even cannot be computed.',
  paybackNotReached: 'Not reached within the projection horizon.',
  paybackNonPositiveResult: 'Not reached — the stabilized result is not positive.',
  byChannelTitle: 'By channel',
  byProductTitle: 'By product',
  moneyFlowTitle: 'Money flow',
  monthlyResultTitle: 'Monthly operating result',
  assumptionsTitle: 'Assumptions',
  totalInitialInvestment: 'Total initial investment',
  earningsFootnote:
    'The monthly operating result is a simplified estimate; it is not net profit or owner take-home pay. Federal and state income tax, corporate/franchise tax, financing, owner distributions, and other financial obligations are not included.',
  assumptionsFootnote:
    'The simulation assumes prices, mixes and unit costs stay fixed within a scenario; only sales volume changes with the scenario and the ramp-up curve.',
  stateHint: 'US state or DC. No city lookup — this sets a planning rate you can edit below.',
  guardrailEmployerCost: (name: string, headcount: string) =>
    `${headcount} ${name} position(s) have no monthly cost entered yet. The calculation continues at $0.`,
  guardrailOwnerNotEmployee: 'If the owner is already counted as a position, remove the separate owner entry below.',

  // Assumptions block (mandatory transparency, `AssumptionsList`)
  stateLabel: 'State',
  salesTaxRateLabel: 'Sales tax rate',
  operatingDays: 'Operating days / month',
  projectionHorizon: 'Projection horizon',
  rampUp: 'Ramp-up',
  scenarioDeltas: 'Scenario volume deltas',
  deliveryModeLabel: 'Delivery mode',
  platformFeeRate: 'Platform fee',
  posCommission: 'POS commission',
  salesPriceAnnualIncrease: 'Sales price annual increase',
  productCogsAnnualIncrease: 'Product cost annual increase',
  fixedCostAnnualIncrease: 'Fixed cost annual increase',
  engineVersion: 'Engine version',
  assumptionRowCount: (count: number) => (count === 1 ? '1 row' : `${count} rows`),
  advancedAssumptions: 'Advanced assumptions — annual increases',
  advancedAssumptionsNote:
    'Sales price, product cost, and fixed cost annual increases. Default 0% — figures you enter stay the same throughout the projection. Always visible on the result screen.',

  // Result tables (`ScenarioTable`, `ChannelTable`, `ProductContributionTable`, `MonthTable`)
  netRevenue: 'Revenue',
  contribution: 'Contribution',
  total: 'Total',
  channelColumn: 'Channel',
  channelUnits: 'Units',
  channelGross: 'Customer payment',
  channelNet: 'Revenue',
  channelCogs: 'Product cost',
  channelVariable: 'Channel variable cost',
  channelFee: 'POS / platform fee',
  channelContribution: 'Contribution',
  monthColumn: 'Month',
  unitsColumn: 'Units',
  fixedCostColumn: 'Fixed cost',
  scenariosInvariantNote:
    'Break-even is computed once from the base scenario and does not change with volume — see Break-even above.',
  remainingLabel: 'Remaining',

  // `SummaryPane` / `MobileSummaryBar`
  baseScenario: 'Base scenario',
  preparation: 'Preparation',
  allResults: 'All results ↓',
  backToInputs: '← Inputs',
  results: 'Results →',
  optionalSectionsNote:
    'Staff, rent, other expenses and initial investment are optional — the calculation runs at $0 for anything left blank.',
  scenariosMonthlyResult: 'Scenarios — monthly result',
  warningsTitle: 'Notes',
  warningCount: (count: number) => `${count}`,
  goToSection: (label: string) => `Go to ${label} →`,

  // `sectionSummary.ts` — the collapsed-state stand-in a section header shows before Calculate
  productCount: (count: number) => (count === 1 ? '1 product' : `${count} products`),
  positionCount: (count: number) => (count === 1 ? '1 position' : `${count} positions`),
  lineCount: (count: number) => (count === 1 ? '1 line' : `${count} lines`),
  defaultsUnchanged: 'Defaults',

  // `SampleFillControl`
  loadSample: '+ Fill with example',
  loadSampleConfirm: 'This replaces your saved draft with example data.',
  loadSampleYes: 'Fill with example',
  loadSampleCancel: 'Cancel',

  // Autosave (`DraftNotice`)
  draftSaved: 'Saved on this device',
  draftReset: 'Start over',
  draftResetConfirm: 'This clears the saved draft on this device.',
  draftResetYes: 'Clear it',
  draftResetCancel: 'Cancel',
  draftScope: 'Saved only in this browser, on this device — nothing is sent anywhere.',
} as const

export const REPORT_COPY = {
  documentTitle: 'Feasibility Report',
  action: 'Download feasibility report',
  actionHintDesktop: 'Opens your browser’s print dialog — choose "Save as PDF".',
  actionHintMobile: 'Opens your device’s print sheet — choose "Save as PDF" or "Save to Files".',
  printUnavailable: 'Printing is not available in this browser view. Try opening this page in Safari or Chrome.',
  dialogTitle: 'Download feasibility report',
  dialogLede: 'The business name titles the report and its saved file. It is never used in any calculation.',
  businessName: 'Business name',
  businessNamePlaceholder: 'e.g. Riverside Coffee Co.',
  businessNameHint: 'Enter a name to enable the download.',
  submit: 'Download report',
  cancel: 'Cancel',
  coverHeadline: 'Monthly operating result',
  coverWarnings: 'Notes',
  disclaimerShort:
    'This report is a preliminary feasibility estimate based on the data entered and the assumptions listed in this report. Projections are estimates and carry no guarantee of realization; this report is not accounting, tax, investment, or legal advice. See Appendix B — Scope and limitations for the full statement.',
  disclaimerFull: [
    'This document is a preliminary feasibility estimate; it is not an audited financial statement, a valuation report, or an independent audit report.',
    'Every calculation is based on the data the user entered and the assumptions listed in this report’s "Assumptions" section. Results change when the inputs change.',
    'Projections, scenarios, and charts are estimates; they carry no commitment of realization.',
    'Actual commercial, tax, operational, and financial outcomes may differ from those shown here, depending on demand, cost, regulatory, and market conditions.',
    'This report is not accounting, tax, investment, legal, or financial advisory services and does not substitute for them. Consulting the relevant professionals before a decision is recommended.',
    'This product’s provider cannot be held responsible for the outcomes of decisions made based solely on this report.',
  ],
  appendixTitle: 'Appendix A — Inputs',
  appendixNote: 'Every input the calculation used, exactly as resolved by the engine.',
  limitsTitle: 'Appendix B — Scope and limitations',
  meta: (version: string, date: string) => `Calculation engine ${version} · Report date ${date} · USD · United States`,
  runningHead: (name: string) => `Feasibility Report · ${name}`,
} as const

export const ERROR_COPY = {
  required: 'This field is required.',
  not_a_number: 'Enter a number.',
  below_min: (formatted: string) => `Enter at least ${formatted}.`,
  above_max: (formatted: string) => `Enter at most ${formatted}.`,
  invalid_value: 'Choose a valid option.',
  empty_products: 'Add at least one product.',
  deliveryModeRequired: 'Choose how delivery orders are fulfilled.',
  channelMixShort: (deficit: string) => `Channel mix is short by ${deficit}.`,
  channelMixOver: (excess: string) => `Channel mix is over by ${excess}.`,
  paymentMixShort: (deficit: string) => `Payment mix is short by ${deficit}.`,
  paymentMixOver: (excess: string) => `Payment mix is over by ${excess}.`,
} as const

export const GUARDRAIL_COPY = {
  employerCostMissing: (name: string, headcount: string) => COPY.guardrailEmployerCost(name, headcount),
  ownerNotAnEmployee: COPY.guardrailOwnerNotEmployee,
} as const
