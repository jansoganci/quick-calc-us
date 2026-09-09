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
  totalInitialInvestment: 'Total initial investment',
  earningsFootnote:
    'The monthly operating result is a simplified estimate; it is not net profit or owner take-home pay. Federal and state income tax, corporate/franchise tax, financing, owner distributions, and other financial obligations are not included.',
  assumptionsFootnote:
    'The simulation assumes prices, mixes and unit costs stay fixed within a scenario; only sales volume changes with the scenario and the ramp-up curve.',
  stateHint: 'US state or DC. No city lookup — this sets a planning rate you can edit below.',
  guardrailEmployerCost: (name: string, headcount: string) =>
    `${headcount} ${name} position(s) have no monthly cost entered yet. The calculation continues at $0.`,
  guardrailOwnerNotEmployee: 'If the owner is already counted as a position, remove the separate owner entry below.',
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
