import { SHELL_COPY } from '../../app/shellCopy.ts'

export type FieldUnit = 'USD' | 'sales' | 'people' | 'days' | 'months' | '%'

export const FIELD_LABELS = {
  monthlyRent: 'Monthly rent',
  employeeCount: 'Employee count',
  averageEmployeeMonthlyCost: 'Cost per employee / month',
  otherMonthlyOpex: 'Other monthly expenses',
  initialCapex: 'Initial investment',
  averageTicket: 'Average ticket',
  dailySalesVolume: 'Daily sales volume',
  variableCostPerSale: 'Product cost per sale',
  operatingDaysPerMonth: 'Operating days / month',
  capexRecoveryPeriodMonths: 'Investment recovery period',
  cardPaymentShare: 'Card payment share',
  posCommissionRate: 'POS commission rate',
  salesTaxRate: 'Sales tax rate',
} as const

export const FIELD_UNITS: Record<keyof typeof FIELD_LABELS, FieldUnit> = {
  monthlyRent: 'USD',
  employeeCount: 'people',
  averageEmployeeMonthlyCost: 'USD',
  otherMonthlyOpex: 'USD',
  initialCapex: 'USD',
  averageTicket: 'USD',
  dailySalesVolume: 'sales',
  variableCostPerSale: 'USD',
  operatingDaysPerMonth: 'days',
  capexRecoveryPeriodMonths: 'months',
  cardPaymentShare: '%',
  posCommissionRate: '%',
  salesTaxRate: '%',
}

export const FIELD_HINTS: Partial<Record<keyof typeof FIELD_LABELS, string>> = {
  averageTicket: 'Before sales tax, before tip',
}

export const BREAKDOWN_LABELS: Record<
  | 'salesTax'
  | 'variable'
  | 'payroll'
  | 'rent'
  | 'otherOpex'
  | 'pos'
  | 'investmentRecovery'
  | 'remaining',
  string
> = {
  salesTax: 'Sales tax',
  variable: 'Product cost',
  payroll: 'Payroll',
  rent: 'Rent',
  otherOpex: 'Other expenses',
  pos: 'POS / payment cost',
  investmentRecovery: 'Investment recovery',
  remaining: 'Remaining profit',
}

export const SIM_LABELS = {
  '-50%': '−50%',
  '-25%': '−25%',
  current: 'Current',
  '+25%': '+25%',
  '+50%': '+50%',
} as const

/** A run of the summary sentence. `amount` renders in Mono 500, `accent` adds the ink accent. */
export type HeadlineTone = 'text' | 'amount' | 'accent'
export type HeadlineSegment = { text: string; tone: HeadlineTone }

export const COPY = {
  // Masthead and colophon copy is owned by the shell, which renders it. Re-exported
  // here so this module keeps one import surface (U4).
  ...SHELL_COPY,
  stateGroup: 'Location',
  salesGroup: 'Sales',
  monthlyCostsGroup: 'Monthly expenses',
  capexGroup: 'Initial investment',
  /** Shown beside a group heading when its subtotal cannot be derived yet. */
  noValue: '—',
  stateLabel: 'State',
  statePlaceholder: 'Select a state',
  stateHint: 'US state or DC. No city lookup — this sets a planning rate you can edit below.',
  /**
   * The derived line under the two payroll inputs. It borrows the result
   * table's own "Payroll" label rather than restating the word, so the form
   * line and the breakdown row it corresponds to can never drift apart.
   */
  payrollHint: (count: string, perEmployee: string, total: string) =>
    `${BREAKDOWN_LABELS.payroll}: ${count} × ${perEmployee} = ${total}`,
  assumptions: 'Assumptions',
  calculate: 'Calculate',
  calculateDisabled: 'Fill in every field to see the result',
  calculateInvalid: 'Check the highlighted fields',
  copySummary: 'Copy summary',
  copied: 'Copied',
  resultSection: 'Result',
  headlineCost: 'Estimated total cost per sale',
  headlineTicket: 'Average sale',
  monthlyEarnings: 'Monthly operating earnings',
  grossMargin: 'Gross profit margin',
  operatingMargin: 'Operating profit margin',
  payback: 'Investment payback',
  simTitle: 'Volume simulation',
  simScenario: 'Scenario',
  simVolume: 'Daily sales',
  simCost: 'Cost per sale',
  simEarnings: 'Monthly earnings',
  earningsFootnote:
    'Monthly operating earnings is a simplified estimate; it is not net profit or owner take-home pay. Federal and state income tax, corporate/franchise tax, financing, owner salary/drawings/distributions, and other financial obligations are not included. The investment recovery allocation is included as a cost.',
  simFootnote:
    'The simulation assumes rent, payroll and other fixed costs stay unchanged. That is why cost per sale falls as volume rises.',
  emptyResult:
    'No figures appear before Calculate. Fill in every field and press Calculate to see cost per sale, remaining profit, and monthly earnings here.',
  total: 'Total',
  headlineSentence: (ticket: string, cost: string, remaining: string): HeadlineSegment[] => [
    { text: 'Of an average ', tone: 'text' },
    { text: ticket, tone: 'amount' },
    { text: ' sale, about ', tone: 'text' },
    { text: cost, tone: 'amount' },
    { text: ' goes to cost, and ', tone: 'text' },
    { text: remaining, tone: 'accent' },
    { text: ' stays in the business.', tone: 'text' },
  ],
  // A deficit is not "the remaining amount", so it stays a plain Mono figure:
  // negative values carry no colour treatment.
  headlineLossSentence: (ticket: string, deficit: string): HeadlineSegment[] => [
    { text: 'Of an average ', tone: 'text' },
    { text: ticket, tone: 'amount' },
    { text: ' sale, all of it goes to cost; every sale runs a ', tone: 'text' },
    { text: deficit, tone: 'amount' },
    { text: ' deficit.', tone: 'text' },
  ],
  simVolumeShort: 'Daily',
  simCostShort: 'Cost/sale',
  paybackUnavailable: 'Payback cannot be estimated at this sales volume.',
  paybackExceeds: (months: string) =>
    `Payback exceeds the ${months}-month recovery period used for planning.`,
  zeroVolume: 'Cost per sale cannot be shown because daily sales volume is zero.',
} as const

export const ERROR_COPY = {
  required: 'This field is required.',
  notANumber: 'Enter a number.',
  aboveMax: (formatted: string) => `Enter at most ${formatted}.`,
  belowMin: (formatted: string) => `Enter at least ${formatted}.`,
  exclusiveZero: 'Enter a value greater than 0.',
  invalidValue: 'Choose a valid option.',
} as const
