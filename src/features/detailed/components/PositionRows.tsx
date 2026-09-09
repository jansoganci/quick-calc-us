import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import type { PositionRow } from '../formState.ts'
import { COPY } from '../labels.ts'

type PositionRowsProps = {
  positions: PositionRow[]
  errorFor: (path: string) => string | null
  onFieldChange: (index: number, field: keyof Omit<PositionRow, 'id'>, value: string) => void
  onBlur: (path: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

/** UD-2: one fully-loaded monthly cost per position, not TR's four-field breakdown. */
export function PositionRows({ positions, errorFor, onFieldChange, onBlur, onAdd, onRemove }: PositionRowsProps) {
  return (
    <div className="space-y-3">
      {positions.map((position, index) => (
        <div key={position.id} className="grid grid-cols-[1fr_100px_140px_auto] items-end gap-2.5">
          <TextField
            id={`positions.${index}.name`}
            label="Position"
            value={position.name}
            onChange={(value) => onFieldChange(index, 'name', value)}
            onBlur={() => onBlur(`positions.${index}.name`)}
            error={errorFor(`positions.${index}.name`)}
          />
          <NumberField
            id={`positions.${index}.headcount`}
            label="Headcount"
            value={position.headcount}
            onChange={(value) => onFieldChange(index, 'headcount', value)}
            onBlur={() => onBlur(`positions.${index}.headcount`)}
            unit="people"
            error={errorFor(`positions.${index}.headcount`)}
          />
          <NumberField
            id={`positions.${index}.monthlyCostPerPerson`}
            label="Monthly cost / person"
            value={position.monthlyCostPerPerson}
            onChange={(value) => onFieldChange(index, 'monthlyCostPerPerson', value)}
            onBlur={() => onBlur(`positions.${index}.monthlyCostPerPerson`)}
            unit="$"
            error={errorFor(`positions.${index}.monthlyCostPerPerson`)}
            grouped
          />
          <button type="button" onClick={() => onRemove(index)} className="qc-text-btn mb-2.5">
            {COPY.removeRow}
          </button>
        </div>
      ))}
      <button type="button" onClick={onAdd} className="qc-text-btn is-accent text-sm">
        {COPY.addPosition}
      </button>
    </div>
  )
}
