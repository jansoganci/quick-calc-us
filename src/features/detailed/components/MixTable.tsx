import { NumberField } from '../../../components/NumberField.tsx'
import { cn } from '../../../lib/cn.ts'
import { COPY } from '../labels.ts'

export type MixRow = {
  key: string
  label: string
  sharePath: string
  shareValue: string
  onShareChange: (value: string) => void
  /** The per-row second field: packaging cost for a channel, commission for a payment method. */
  extra: {
    path: string
    value: string
    unit: string
    label: string
    onChange: (value: string) => void
  } | null
}

type MixTableProps = {
  firstColumnLabel: string
  extraColumnLabel: string
  rows: MixRow[]
  total: string
  totalError: string | null
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
}

/**
 * A mix's rows plus a reconciling total. The mix is never auto-normalized
 * (US_DETAILED_FEASIBILITY_SCOPE §6.2-equivalent) — the total row is both the
 * reconciliation and the error surface.
 */
export function MixTable({ firstColumnLabel, extraColumnLabel, rows, total, totalError, errorFor, onBlur }: MixTableProps) {
  return (
    <div className="max-w-[600px]">
      <div className="hidden grid-cols-[1fr_120px_160px] gap-2.5 pb-2 lg:grid">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">{firstColumnLabel}</span>
        <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">{COPY.mixShare}</span>
        <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">{extraColumnLabel}</span>
      </div>

      {rows.map((row, index) => (
        <div
          key={row.key}
          className={cn(
            'grid grid-cols-[1fr_96px] items-center gap-2.5 border-t border-qc-rule-row py-2 lg:grid-cols-[1fr_120px_160px] lg:py-[9px]',
            index === rows.length - 1 && 'border-b border-qc-rule-mid',
          )}
        >
          <span className="text-sm text-qc-ink">{row.label}</span>
          <NumberField
            id={row.sharePath}
            label={`${row.label} — ${COPY.mixShare}`}
            labelHidden
            value={row.shareValue}
            onChange={row.onShareChange}
            onBlur={() => onBlur(row.sharePath)}
            unit="%"
            error={errorFor(row.sharePath)}
          />
          {row.extra ? (
            <div className="col-span-2 lg:col-span-1">
              <NumberField
                id={row.extra.path}
                label={row.extra.label}
                labelHidden="from-lg"
                value={row.extra.value}
                onChange={row.extra.onChange}
                onBlur={() => onBlur(row.extra!.path)}
                unit={row.extra.unit}
                error={errorFor(row.extra.path)}
                grouped
              />
            </div>
          ) : (
            <span className="hidden text-right text-[13px] text-qc-subtle lg:block">{COPY.none}</span>
          )}
        </div>
      ))}

      <div className="grid grid-cols-[1fr_96px] gap-2.5 pt-2.5 lg:grid-cols-[1fr_120px_160px]">
        <span className={cn('text-[13px]', totalError ? 'text-qc-error' : 'text-qc-secondary')}>{COPY.mixTotal}</span>
        <span className={cn('pr-2.5 text-right font-mono text-sm font-medium tabular-nums', totalError ? 'text-qc-error' : 'text-qc-ink')}>
          {total}
        </span>
      </div>
      {totalError ? (
        <p className="qc-error mt-1.5" role="alert">
          {totalError}
        </p>
      ) : null}
    </div>
  )
}
