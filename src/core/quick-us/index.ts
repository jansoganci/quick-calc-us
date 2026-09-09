export { calculateQuick, resolveMonthlyPayroll } from './calculate.ts';
export { QUICK_US_DEFAULTS } from './defaults.ts';
export { QUICK_US_LIMITS } from './limits.ts';
export { simulateQuick } from './simulate.ts';
export { validateQuickInput } from './validate.ts';

export type {
  BreakdownLine,
  BreakdownPerSale,
  CostLine,
  JurisdictionInputField,
  MonthlyResult,
  PaybackAvailable,
  PaybackResult,
  PerSaleResult,
  PrimaryInputField,
  QuickCalculationInput,
  QuickCalculationResult,
  QuickInputField,
  QuickResolvedInput,
  QuickSimulationRow,
  SecondaryInputField,
  SimulationLabel,
  Unavailable,
  ValidateQuickResult,
  ValidationError,
  ValidationErrorCode,
} from './types.ts';
