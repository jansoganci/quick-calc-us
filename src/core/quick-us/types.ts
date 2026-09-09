import type { UsState } from '../../data/us/salesTaxRates.ts';

export type CostLine =
  | 'salesTax'
  | 'variable'
  | 'payroll'
  | 'rent'
  | 'otherOpex'
  | 'pos'
  | 'investmentRecovery';

export type SimulationLabel = '-50%' | '-25%' | 'current' | '+25%' | '+50%';

export type ValidationErrorCode =
  | 'required'
  | 'not_a_number'
  | 'below_min'
  | 'above_max'
  | 'invalid_value';

export type PrimaryInputField =
  | 'monthlyRent'
  | 'employeeCount'
  | 'averageEmployeeMonthlyCost'
  | 'otherMonthlyOpex'
  | 'initialCapex'
  | 'averageTicket'
  | 'dailySalesVolume'
  | 'variableCostPerSale';

export type SecondaryInputField =
  | 'operatingDaysPerMonth'
  | 'capexRecoveryPeriodMonths'
  | 'cardPaymentShare'
  | 'posCommissionRate';

/** `usState` is required with no implicit default; `salesTaxRate` defaults from it. */
export type JurisdictionInputField = 'usState' | 'salesTaxRate';

export type QuickInputField = PrimaryInputField | SecondaryInputField | JurisdictionInputField;

export interface QuickCalculationInput {
  monthlyRent?: unknown;
  employeeCount?: unknown;
  averageEmployeeMonthlyCost?: unknown;
  otherMonthlyOpex?: unknown;
  initialCapex?: unknown;
  averageTicket?: unknown;
  dailySalesVolume?: unknown;
  variableCostPerSale?: unknown;
  usState?: unknown;
  salesTaxRate?: unknown;
  operatingDaysPerMonth?: unknown;
  capexRecoveryPeriodMonths?: unknown;
  cardPaymentShare?: unknown;
  posCommissionRate?: unknown;
}

export interface QuickResolvedInput {
  monthlyRent: number;
  employeeCount: number;
  averageEmployeeMonthlyCost: number;
  otherMonthlyOpex: number;
  initialCapex: number;
  averageTicket: number;
  dailySalesVolume: number;
  variableCostPerSale: number;
  usState: UsState;
  salesTaxRate: number;
  operatingDaysPerMonth: number;
  capexRecoveryPeriodMonths: number;
  cardPaymentShare: number;
  posCommissionRate: number;
}

export interface ValidationError {
  field: QuickInputField;
  code: ValidationErrorCode;
  limit?: number;
}

export type ValidateQuickResult =
  | { ok: true; input: QuickResolvedInput }
  | { ok: false; errors: ValidationError[] };

export interface Unavailable {
  available: false;
  reason: string;
}

export interface PaybackAvailable {
  months: number;
  exceedsRecoveryPeriod: boolean;
}

export type PaybackResult = PaybackAvailable | Unavailable;

export interface MonthlyResult {
  salesVolume: number;
  grossCollections: number;
  salesTax: number;
  netRevenue: number;
  payroll: number;
  rentCost: number;
  variableCost: number;
  transactionCost: number;
  capexRecoveryAllocation: number;
  fixedCost: number;
  totalCost: number;
  operatingEarnings: number;
  operatingEarningsBeforeCapexRecoveryAllocation: number;
}

export interface PerSaleResult {
  netAverageTicket: number;
  customerPaymentPerSale: number;
  salesTax: number;
  variable: number;
  pos: number;
  fixed: number;
  estimatedTotalCost: number;
  remainingProfit: number;
}

export interface BreakdownLine {
  line: CostLine;
  amount: number;
}

export interface BreakdownPerSale {
  averageSale: number;
  lines: BreakdownLine[];
  remainingProfit: number;
}

export interface QuickCalculationResult {
  monthly: MonthlyResult;
  perSale: PerSaleResult | null;
  breakdownPerSale: BreakdownPerSale | null;
  grossProfitMargin: number | null;
  operatingProfitMargin: number | null;
  payback: PaybackResult;
  meta: {
    quickEngineVersion: string;
    currency: 'USD';
    usState: UsState;
    salesTaxRate: number;
    revenueBasis: 'net';
  };
}

export interface QuickSimulationRow {
  label: SimulationLabel;
  dailySales: number;
  estimatedTotalCostPerSale: number | null;
  monthlyOperatingEarnings: number;
  isCurrent: boolean;
}
