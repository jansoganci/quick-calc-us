import { cn } from '../../../lib/cn.ts'
import { REPORT_COPY } from '../labels.ts'

/**
 * The one way into the report.
 *
 * Outlined rather than filled: the filled accent belongs to Calculate, and
 * `DESIGN_DIRECTION` reserves the accent for the headline figure and focus
 * states. Two filled buttons on one screen would make the page argue with
 * itself about what the next step is.
 *
 * One component, two call sites — the foot of the summary pane on desktop,
 * the end of the results on mobile, which is where reading ends.
 */
export function ReportActionButton({ variant, canPrint, onOpen }: { variant: 'pane' | 'results'; canPrint: boolean; onOpen: () => void }) {
  const hint = canPrint ? (variant === 'pane' ? REPORT_COPY.actionHintDesktop : REPORT_COPY.actionHintMobile) : REPORT_COPY.printUnavailable

  return (
    <div className="qc-screen-only mt-[22px] border-t border-qc-rule pt-[18px]">
      <button
        type="button"
        onClick={onOpen}
        disabled={!canPrint}
        className={cn(
          'flex w-full items-center justify-center rounded border text-sm font-medium',
          variant === 'pane' ? 'h-[42px]' : 'h-12 text-[15px]',
          canPrint ? 'border-qc-rule-strong bg-qc-surface text-qc-ink hover:border-qc-ink' : 'border-qc-disabled-border bg-qc-disabled text-qc-subtle',
        )}
      >
        {REPORT_COPY.action}
      </button>
      <p className="mt-2 text-xs leading-relaxed text-qc-muted">{hint}</p>
    </div>
  )
}
