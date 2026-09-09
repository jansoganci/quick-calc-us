import { isUsState, US_SALES_TAX_RATES } from '../../data/us/salesTaxRates.ts';
import { QUICK_US_DEFAULTS } from './defaults.ts';
import { QUICK_US_LIMITS, type FieldLimit } from './limits.ts';
import type {
  PrimaryInputField,
  QuickCalculationInput,
  QuickInputField,
  QuickResolvedInput,
  SecondaryInputField,
  ValidateQuickResult,
  ValidationError,
} from './types.ts';

const PRIMARY_FIELDS: PrimaryInputField[] = [
  'monthlyRent',
  'employeeCount',
  'averageEmployeeMonthlyCost',
  'otherMonthlyOpex',
  'initialCapex',
  'averageTicket',
  'dailySalesVolume',
  'variableCostPerSale',
];

const SECONDARY_FIELDS: SecondaryInputField[] = [
  'operatingDaysPerMonth',
  'capexRecoveryPeriodMonths',
  'cardPaymentShare',
  'posCommissionRate',
];

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function checkPresentNumber(
  field: QuickInputField,
  value: unknown,
  limit: FieldLimit,
  errors: ValidationError[],
): number | undefined {
  if (!isFiniteNumber(value)) {
    errors.push({ field, code: 'not_a_number' });
    return undefined;
  }
  if (limit.exclusiveMin === true ? value <= limit.min : value < limit.min) {
    errors.push({ field, code: 'below_min', limit: limit.min });
    return undefined;
  }
  if (value > limit.max) {
    errors.push({ field, code: 'above_max', limit: limit.max });
    return undefined;
  }
  return value;
}

export function validateQuickInput(raw: QuickCalculationInput): ValidateQuickResult {
  const errors: ValidationError[] = [];
  const resolved = {} as QuickResolvedInput;

  for (const field of PRIMARY_FIELDS) {
    const value = raw[field];
    if (isAbsent(value)) {
      errors.push({ field, code: 'required' });
      continue;
    }
    const parsed = checkPresentNumber(field, value, QUICK_US_LIMITS[field], errors);
    if (parsed !== undefined) {
      resolved[field] = parsed;
    }
  }

  // `usState` is required with no implicit default (US-3). It must resolve
  // before `salesTaxRate` can fall back to the table.
  const stateValue = raw.usState;
  if (isAbsent(stateValue)) {
    errors.push({ field: 'usState', code: 'required' });
  } else if (!isUsState(stateValue)) {
    errors.push({ field: 'usState', code: 'invalid_value' });
  } else {
    resolved.usState = stateValue;
  }

  // `salesTaxRate` defaults from the resolved state; an explicit value is a
  // user override and is validated like any other rate (US_PRODUCT_SCOPE §5.1).
  const taxValue = raw.salesTaxRate;
  if (isAbsent(taxValue)) {
    if (resolved.usState !== undefined) {
      resolved.salesTaxRate = US_SALES_TAX_RATES[resolved.usState];
    }
  } else {
    const parsed = checkPresentNumber('salesTaxRate', taxValue, QUICK_US_LIMITS.salesTaxRate, errors);
    if (parsed !== undefined) {
      resolved.salesTaxRate = parsed;
    }
  }

  for (const field of SECONDARY_FIELDS) {
    const value = raw[field];
    if (isAbsent(value)) {
      resolved[field] = QUICK_US_DEFAULTS[field];
      continue;
    }
    const parsed = checkPresentNumber(field, value, QUICK_US_LIMITS[field], errors);
    if (parsed !== undefined) {
      resolved[field] = parsed;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, input: resolved };
}
