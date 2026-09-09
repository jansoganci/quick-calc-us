import { cn } from '../../../lib/cn.ts'
import { COPY } from '../labels.ts'
import type { DetailedView } from '../viewModel.ts'

type MobileSummaryBarProps = {
  view: DetailedView | null
  canSubmit: boolean
  submitHint: string | null
  onCalculate: () => void
  onGoToInputs: () => void
  onGoToResults: () => void
}

/**
 * The mobile re-expression of the desktop sticky column. Before the first
 * calculation it is the Calculate control; afterwards it carries the answer
 * and the way back to it.
 */
export function MobileSummaryBar({ view, canSubmit, submitHint, onCalculate, onGoToInputs, onGoToResults }: MobileSummaryBarProps) {
  if (view === null) {
    return (
      <div className="qc-screen-only fixed inset-x-0 bottom-0 z-20 border-t border-qc-rule bg-qc-surface px-[18px] pb-3.5 pt-2.5 lg:hidden">
        {submitHint ? <p className="mb-1.5 text-center text-xs leading-relaxed text-qc-muted">{submitHint}</p> : null}
        <button
          type="button"
          onClick={onCalculate}
          disabled={!canSubmit}
          className={cn('flex h-12 w-full items-center justify-center rounded text-[15px] font-medium', canSubmit ? 'bg-qc-accent text-qc-on-accent' : 'border border-qc-disabled-border bg-qc-disabled text-qc-subtle')}
        >
          {COPY.calculate}
        </button>
      </div>
    )
  }

  return (
    <div className="qc-screen-only fixed inset-x-0 bottom-0 z-20 flex h-[60px] items-center justify-between gap-3 border-t border-qc-rule bg-qc-surface px-[18px] lg:hidden">
      <span className="flex flex-col">
        <span className="text-[11px] text-qc-muted">{COPY.monthlyOperatingResult}</span>
        <span className="font-mono text-base font-medium tabular-nums text-qc-accent">{view.monthlyOperatingResult}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <button type="button" className="qc-text-btn" onClick={onGoToInputs}>
          {COPY.backToInputs}
        </button>
        <button type="button" className="qc-text-btn is-accent" onClick={onGoToResults}>
          {COPY.results}
        </button>
      </span>
    </div>
  )
}
