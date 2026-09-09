import { cn } from '../../../lib/cn.ts'
import type { UsState } from '../../../data/us/salesTaxRates.ts'
import { NumberField } from '../../../components/NumberField.tsx'
import { COPY } from '../labels.ts'
import { STATE_OPTIONS, fieldLabel, fieldNumberFormat, fieldUnit } from '../viewModel.ts'

type StateSelectProps = {
  usState: UsState | ''
  salesTaxRate: string
  usStateError: string | null
  salesTaxRateError: string | null
  onStateChange: (value: UsState) => void
  onRateChange: (value: string) => void
  onRateBlur: () => void
}

/**
 * The required jurisdiction row: a state select plus its linked, editable
 * sales-tax rate (US_PRODUCT_SCOPE §3.2). Selecting a state always resets the
 * rate to the table value; the rate then stays independently editable until
 * the state changes again.
 */
export function StateSelect({
  usState,
  salesTaxRate,
  usStateError,
  salesTaxRateError,
  onStateChange,
  onRateChange,
  onRateBlur,
}: StateSelectProps) {
  const rateFormat = fieldNumberFormat('salesTaxRate')

  return (
    <div className="col-span-full grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
      <label className="qc-field col-span-full" htmlFor="usState">
        <span>{COPY.stateLabel}</span>
        <span className={cn('qc-input-wrap', usStateError && 'is-error')}>
          <select
            id="usState"
            className="qc-input is-text"
            value={usState}
            onChange={(event) => onStateChange(event.target.value as UsState)}
            aria-invalid={Boolean(usStateError)}
            aria-describedby={usStateError ? 'usState-error' : 'usState-hint'}
          >
            <option value="" disabled>
              {COPY.statePlaceholder}
            </option>
            {STATE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </span>
        {usStateError ? (
          <span id="usState-error" className="qc-error" role="alert">
            {usStateError}
          </span>
        ) : (
          <span id="usState-hint" className="qc-hint">
            {COPY.stateHint}
          </span>
        )}
      </label>

      <NumberField
        id="salesTaxRate"
        label={fieldLabel('salesTaxRate')}
        value={salesTaxRate}
        onChange={onRateChange}
        onBlur={onRateBlur}
        unit={fieldUnit('salesTaxRate')}
        error={salesTaxRateError}
        span="full"
        grouped={rateFormat.grouped}
        maxFractionDigits={rateFormat.maxFractionDigits}
      />
    </div>
  )
}
