import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { cn } from '../../../lib/cn.ts'
import type { PositionRow } from '../formState.ts'
import { COPY } from '../labels.ts'
import { useNewestRowOpen } from '../hooks/useNewestRowOpen.ts'

type PositionRowsProps = {
  positions: PositionRow[]
  errorFor: (path: string) => string | null
  onFieldChange: (index: number, field: keyof Omit<PositionRow, 'id'>, value: string) => void
  onBlur: (path: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

/**
 * UD-2: one fully-loaded monthly cost per position, not TR's four-field
 * breakdown. Below `lg` each row collapses to name + headcount, opening in
 * place; a row just added opens itself and scrolls into view
 * (`useNewestRowOpen`).
 */
export function PositionRows({ positions, errorFor, onFieldChange, onBlur, onAdd, onRemove }: PositionRowsProps) {
  const rows = useNewestRowOpen(positions.map((position) => position.id))

  return (
    <div className="space-y-3">
      {positions.map((position, index) => {
        const open = rows.isOpen(position.id)

        return (
          <div key={position.id} ref={rows.rowRef(position.id)} className="border-t border-qc-rule-row pt-3 first:border-t-0 first:pt-0 lg:border-t-0 lg:pt-0">
            <button type="button" onClick={() => rows.toggle(position.id)} aria-expanded={open} className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left lg:hidden">
              <span className="text-[15px] text-qc-ink">{position.name.trim() === '' ? `Position ${index + 1}` : position.name}</span>
              <span className="flex items-center gap-2.5">
                <span className="font-mono text-xs tabular-nums text-qc-muted">{position.headcount === '' ? '' : `${position.headcount} people`}</span>
                <span
                  aria-hidden="true"
                  className={cn('inline-block h-[7px] w-[7px] border-b-[1.5px] border-r-[1.5px] border-qc-muted', open ? '-translate-y-1 rotate-[-135deg]' : '-translate-y-0.5 rotate-45')}
                />
              </span>
            </button>

            <div className={cn('grid grid-cols-[1fr_100px_140px_auto] items-end gap-2.5 pt-3 lg:pt-0', open ? 'grid' : 'hidden lg:grid')}>
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
          </div>
        )
      })}
      <button type="button" onClick={onAdd} className="qc-text-btn is-accent text-sm">
        {COPY.addPosition}
      </button>
    </div>
  )
}
