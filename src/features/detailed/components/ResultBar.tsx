import { cn } from '../../../lib/cn.ts'
import { COPY } from '../labels.ts'
import type { BreakdownView } from '../resultView.ts'

const IN_BAR_LABEL_THRESHOLD = 15

/**
 * The reconciliation bar: the segments reconcile exactly to gross customer
 * sales, because the engine's own identity says so (gross = sales tax +
 * variable costs + fixed costs + operating result).
 */
export function ResultBar({ breakdown, gross }: { breakdown: BreakdownView; gross: string }) {
  const segments = breakdown.rows.filter((row) => row.widthPercent > 0)

  return (
    <div>
      {/* `qc-print-ink` opts this bar — and only this bar — out of the browser's
          drop-the-backgrounds print rule. Without it the segments print white
          on white, taking the in-bar labels with them. */}
      <div className="qc-print-ink flex h-[38px] border border-qc-rule-mid lg:h-11">
        {segments.map((row) => (
          <div key={row.key} className={cn('flex items-center overflow-hidden', row.colorClass)} style={{ width: `${row.widthPercent}%` }}>
            {row.widthPercent >= IN_BAR_LABEL_THRESHOLD ? (
              <span className="hidden whitespace-nowrap pl-2.5 text-xs text-qc-on-accent lg:inline">
                {row.key === 'operatingResult' ? COPY.remainingLabel : row.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-[5px] flex justify-between">
        <span className="font-mono text-[11px] tabular-nums text-qc-muted">$0</span>
        <span className="font-mono text-[11px] tabular-nums text-qc-muted">{gross}</span>
      </div>

      {breakdown.deficitCaption ? <p className="mt-2.5 text-xs leading-relaxed text-qc-muted">{breakdown.deficitCaption}</p> : null}

      <div className="mt-5 max-w-[720px]">
        {breakdown.rows.map((row, index) => {
          const isResult = row.key === 'operatingResult'
          return (
            <div
              key={row.key}
              className={cn(
                'grid grid-cols-[9px_1fr_auto_48px] items-center gap-2.5 lg:grid-cols-[10px_1fr_auto_72px] lg:gap-3',
                isResult ? 'min-h-[44px] border-y border-qc-ink lg:py-[11px]' : 'min-h-[40px] border-b border-qc-rule-row lg:py-[9px]',
                !isResult && index === breakdown.rows.length - 2 && 'border-b-qc-rule-mid',
              )}
            >
              <span className={cn('qc-print-ink h-[13px] lg:h-3.5', row.colorClass)} aria-hidden="true" />
              <span className={cn('text-[13px] lg:text-sm', isResult ? 'font-semibold text-qc-ink' : 'text-qc-secondary')}>{row.label}</span>
              <span className={cn('font-mono text-[13px] tabular-nums text-qc-ink lg:text-sm', isResult && 'font-semibold')}>{row.amount}</span>
              <span className={cn('text-right font-mono text-xs tabular-nums lg:text-[13px]', isResult ? 'text-qc-secondary' : 'text-qc-muted')}>
                {row.share}
              </span>
            </div>
          )
        })}
        <div className="grid grid-cols-[9px_1fr_auto_48px] gap-2.5 py-2 lg:grid-cols-[10px_1fr_auto_72px] lg:gap-3 lg:py-[9px]">
          <span />
          <span className="text-xs text-qc-muted lg:text-[13px]">{COPY.total}</span>
          <span className="font-mono text-xs tabular-nums text-qc-muted lg:text-[13px]">{breakdown.total}</span>
          <span className="text-right font-mono text-xs tabular-nums text-qc-muted lg:text-[13px]">100%</span>
        </div>
      </div>
    </div>
  )
}
