import { NumberField } from '../../../components/NumberField.tsx'
import { COPY } from '../labels.ts'
import {
  assumptionRows,
  fieldNumberFormat,
  type FormErrorField,
  type QuickField,
  type QuickFormState,
} from '../viewModel.ts'

type AssumptionsStripProps = {
  form: QuickFormState
  errors: Partial<Record<FormErrorField, string>>
  dirty: Partial<Record<FormErrorField, boolean>>
  onChange: (field: QuickField, value: string) => void
  onBlur: (field: QuickField) => void
}

export function AssumptionsStrip({ form, errors, dirty, onChange, onBlur }: AssumptionsStripProps) {
  const rows = assumptionRows(form)

  return (
    <div className="collapse qc-assumptions">
      <input type="checkbox" aria-label="Show assumptions" />
      <div className="collapse-title">
        <span>{COPY.assumptions}</span>
        <span className="inline-flex items-center gap-[9px]">
          <span className="font-mono text-xs">
            {rows.map((row, index) => (
              <span key={row.field}>
                {index > 0 ? <span className="text-qc-muted"> · </span> : null}
                <span className={row.source === 'user' ? 'text-qc-ink' : 'text-qc-muted'}>
                  {row.valueFormatted}
                </span>
              </span>
            ))}
          </span>
          <span className="text-[10px] text-qc-muted" aria-hidden="true">
            ▾
          </span>
        </span>
      </div>
      <div className="collapse-content">
        <div className="grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
          {rows.map((row) => {
            const format = fieldNumberFormat(row.field)
            return (
              <NumberField
                key={row.field}
                id={row.field}
                label={row.label}
                value={form[row.field]}
                onChange={(value) => onChange(row.field, value)}
                onBlur={() => onBlur(row.field)}
                unit={row.unit}
                placeholder={row.placeholder}
                error={dirty[row.field] ? errors[row.field] ?? null : null}
                grouped={format.grouped}
                maxFractionDigits={format.maxFractionDigits}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
