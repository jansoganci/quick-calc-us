import { QUICK_US_DEFAULTS } from './defaults.ts';
import type {
  BreakdownPerSale,
  PaybackResult,
  PerSaleResult,
  QuickCalculationResult,
  QuickResolvedInput,
} from './types.ts';

/**
 * Monthly payroll: headcount times the fully-loaded per-employee employer
 * cost (US_PRODUCT_SCOPE §3.1 #3). Extracted so the form can show the same
 * product beneath its two payroll inputs without restating the multiplication.
 */
export function resolveMonthlyPayroll(input: {
  employeeCount: number;
  averageEmployeeMonthlyCost: number;
}): number {
  return input.employeeCount * input.averageEmployeeMonthlyCost;
}

export function calculateQuick(input: QuickResolvedInput): QuickCalculationResult {
  const monthlySalesVolume = input.dailySalesVolume * input.operatingDaysPerMonth;

  // US-1: averageTicket is entered pre-tax. Tax is added on top, never netted
  // out of it. Never `averageTicket / (1 + salesTaxRate)` — that is TR VAT
  // math and is wrong here.
  const netAverageTicket = input.averageTicket;
  const salesTaxPerSale = input.averageTicket * input.salesTaxRate;
  const customerPaymentPerSale = input.averageTicket + salesTaxPerSale;

  const monthlyNetRevenue = monthlySalesVolume * netAverageTicket;
  const monthlySalesTax = monthlySalesVolume * salesTaxPerSale;
  const monthlyGrossCollections = monthlySalesVolume * customerPaymentPerSale;

  const monthlyPayroll = resolveMonthlyPayroll(input);
  const monthlyVariableCost = monthlySalesVolume * input.variableCostPerSale;

  // POS applies to the customer's full payment (ticket + tax, excluding
  // tips) — never to averageTicket alone, which would omit tax from the fee
  // base (US_PRODUCT_SCOPE §4.2).
  const posCostPerSale = customerPaymentPerSale * input.cardPaymentShare * input.posCommissionRate;
  const monthlyTransactionCost = monthlySalesVolume * posCostPerSale;

  const monthlyCapexRecoveryAllocation = input.initialCapex / input.capexRecoveryPeriodMonths;

  // US-2: no withholding. The cash cost is exactly what was entered.
  const rentCost = input.monthlyRent;

  const monthlyFixedCost =
    rentCost + monthlyPayroll + input.otherMonthlyOpex + monthlyCapexRecoveryAllocation;

  const monthlyTotalCost = monthlyFixedCost + monthlyVariableCost + monthlyTransactionCost;

  const monthlyOperatingEarnings = monthlyNetRevenue - monthlyTotalCost;
  const monthlyOperatingEarningsBeforeCapexRecoveryAllocation =
    monthlyOperatingEarnings + monthlyCapexRecoveryAllocation;

  let perSale: PerSaleResult | null = null;
  let breakdownPerSale: BreakdownPerSale | null = null;

  if (monthlySalesVolume !== 0) {
    const fixedCostPerSale = monthlyFixedCost / monthlySalesVolume;
    const payrollPerSale = monthlyPayroll / monthlySalesVolume;
    const rentPerSale = rentCost / monthlySalesVolume;
    const otherOpexPerSale = input.otherMonthlyOpex / monthlySalesVolume;
    const investmentRecoveryPerSale = monthlyCapexRecoveryAllocation / monthlySalesVolume;
    const estimatedTotalCostPerSale =
      salesTaxPerSale + input.variableCostPerSale + posCostPerSale + fixedCostPerSale;
    // The eight-row breakdown sums to customerPaymentPerSale — what the
    // customer pays, not the pre-tax ticket (US_PRODUCT_SCOPE §4.5).
    const remainingProfitPerSale =
      customerPaymentPerSale -
      (salesTaxPerSale +
        input.variableCostPerSale +
        payrollPerSale +
        rentPerSale +
        otherOpexPerSale +
        posCostPerSale +
        investmentRecoveryPerSale);

    perSale = {
      netAverageTicket,
      customerPaymentPerSale,
      salesTax: salesTaxPerSale,
      variable: input.variableCostPerSale,
      pos: posCostPerSale,
      fixed: fixedCostPerSale,
      estimatedTotalCost: estimatedTotalCostPerSale,
      remainingProfit: remainingProfitPerSale,
    };

    breakdownPerSale = {
      averageSale: customerPaymentPerSale,
      lines: [
        { line: 'salesTax', amount: salesTaxPerSale },
        { line: 'variable', amount: input.variableCostPerSale },
        { line: 'payroll', amount: payrollPerSale },
        { line: 'rent', amount: rentPerSale },
        { line: 'otherOpex', amount: otherOpexPerSale },
        { line: 'pos', amount: posCostPerSale },
        { line: 'investmentRecovery', amount: investmentRecoveryPerSale },
      ],
      remainingProfit: remainingProfitPerSale,
    };
  }

  const grossProfitMargin =
    monthlyNetRevenue === 0 ? null : (monthlyNetRevenue - monthlyVariableCost) / monthlyNetRevenue;
  const operatingProfitMargin =
    monthlyNetRevenue === 0 ? null : monthlyOperatingEarnings / monthlyNetRevenue;

  let payback: PaybackResult;
  if (input.initialCapex === 0) {
    payback = { months: 0, exceedsRecoveryPeriod: false };
  } else if (monthlyOperatingEarningsBeforeCapexRecoveryAllocation <= 0) {
    payback = { available: false, reason: 'non_positive_earnings_before_recovery' };
  } else {
    const paybackMonths = input.initialCapex / monthlyOperatingEarningsBeforeCapexRecoveryAllocation;
    payback = {
      months: paybackMonths,
      exceedsRecoveryPeriod: paybackMonths > input.capexRecoveryPeriodMonths,
    };
  }

  return {
    monthly: {
      salesVolume: monthlySalesVolume,
      grossCollections: monthlyGrossCollections,
      salesTax: monthlySalesTax,
      netRevenue: monthlyNetRevenue,
      payroll: monthlyPayroll,
      rentCost,
      variableCost: monthlyVariableCost,
      transactionCost: monthlyTransactionCost,
      capexRecoveryAllocation: monthlyCapexRecoveryAllocation,
      fixedCost: monthlyFixedCost,
      totalCost: monthlyTotalCost,
      operatingEarnings: monthlyOperatingEarnings,
      operatingEarningsBeforeCapexRecoveryAllocation:
        monthlyOperatingEarningsBeforeCapexRecoveryAllocation,
    },
    perSale,
    breakdownPerSale,
    grossProfitMargin,
    operatingProfitMargin,
    payback,
    meta: {
      quickEngineVersion: QUICK_US_DEFAULTS.quickEngineVersion,
      currency: QUICK_US_DEFAULTS.currency,
      usState: input.usState,
      salesTaxRate: input.salesTaxRate,
      revenueBasis: 'net',
    },
  };
}
