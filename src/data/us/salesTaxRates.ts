/**
 * State + DC planning sales-tax rates — the single source for this table.
 * Combined column = Tax Foundation population-weighted state + average local
 * general sales tax as of 1 January 2026, except NH and DC, which are
 * cafe-specific overrides (see docs/US_PRODUCT_SCOPE.md §5.1).
 *
 * These are planning defaults, not the user's legal rate. The engine and UI
 * both import this file; neither restates a second copy of the numbers.
 */

export type UsState =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'DC' | 'FL'
  | 'GA' | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME'
  | 'MD' | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH'
  | 'NJ' | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI'
  | 'SC' | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY';

export const US_STATE_NAMES: Record<UsState, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

/** Zero is a valid planning rate (DE, MT, OR) — not "these states have no tax". */
export const US_SALES_TAX_RATES: Record<UsState, number> = {
  AL: 0.0946, AK: 0.0182, AZ: 0.0852, AR: 0.0946, CA: 0.0899,
  CO: 0.0789, CT: 0.0635, DE: 0.0000, DC: 0.1000, FL: 0.0698,
  GA: 0.0749, HI: 0.0450, ID: 0.0603, IL: 0.0896, IN: 0.0700,
  IA: 0.0694, KS: 0.0869, KY: 0.0600, LA: 0.1011, ME: 0.0550,
  MD: 0.0600, MA: 0.0625, MI: 0.0600, MN: 0.0814, MS: 0.0706,
  MO: 0.0844, MT: 0.0000, NE: 0.0698, NV: 0.0824, NH: 0.0850,
  NJ: 0.0660, NM: 0.0767, NY: 0.0854, NC: 0.0700, ND: 0.0709,
  OH: 0.0729, OK: 0.0906, OR: 0.0000, PA: 0.0634, RI: 0.0700,
  SC: 0.0749, SD: 0.0611, TN: 0.0961, TX: 0.0820, UT: 0.0742,
  VT: 0.0639, VA: 0.0577, WA: 0.0951, WV: 0.0659, WI: 0.0572, WY: 0.0556,
};

export function isUsState(value: unknown): value is UsState {
  return typeof value === 'string' && Object.hasOwn(US_SALES_TAX_RATES, value);
}
