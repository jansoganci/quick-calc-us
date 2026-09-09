import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import type { LineRow } from '../formState.ts'
import { COPY } from '../labels.ts'
import { useNewestRowOpen } from '../hooks/useNewestRowOpen.ts'

type LineRowsProps = {
  collection: 'opexLines' | 'capexItems'
  lines: LineRow[]
  amountUnit: string
  amountLabel: string
  addLabel: string
  errorFor: (path: string) => string | null
  onFieldChange: (collection: 'opexLines' | 'capexItems', index: number, field: keyof Omit<LineRow, 'id'>, value: string) => void
  onBlur: (path: string) => void
  onAdd: (collection: 'opexLines' | 'capexItems') => void
  onRemove: (collection: 'opexLines' | 'capexItems', index: number) => void
}

/** A named amount, repeated. Used for both other-OPEX lines and CAPEX items — same shape, different unit. */
export function LineRows({ collection, lines, amountUnit, amountLabel, addLabel, errorFor, onFieldChange, onBlur, onAdd, onRemove }: LineRowsProps) {
  const rows = useNewestRowOpen(lines.map((line) => line.id))

  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <div key={line.id} ref={rows.rowRef(line.id)} className="grid grid-cols-[1fr_160px_auto] items-end gap-2.5">
          <TextField
            id={`${collection}.${index}.name`}
            label="Name"
            value={line.name}
            onChange={(value) => onFieldChange(collection, index, 'name', value)}
            onBlur={() => onBlur(`${collection}.${index}.name`)}
            error={errorFor(`${collection}.${index}.name`)}
          />
          <NumberField
            id={`${collection}.${index}.amount`}
            label={amountLabel}
            value={line.amount}
            onChange={(value) => onFieldChange(collection, index, 'amount', value)}
            onBlur={() => onBlur(`${collection}.${index}.amount`)}
            unit={amountUnit}
            error={errorFor(`${collection}.${index}.amount`)}
            grouped
          />
          <button type="button" onClick={() => onRemove(collection, index)} className="qc-text-btn mb-2.5">
            {COPY.removeRow}
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onAdd(collection)} className="qc-text-btn is-accent text-sm">
        {addLabel}
      </button>
    </div>
  )
}
