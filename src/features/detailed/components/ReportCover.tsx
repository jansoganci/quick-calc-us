import { cn } from '../../../lib/cn.ts'
import { COPY, REPORT_COPY } from '../labels.ts'
import { formatReportDate } from '../reportView.ts'
import type { DetailedView } from '../viewModel.ts'

/**
 * Page one of the report, and the only part of it that exists nowhere on
 * screen.
 *
 * It answers the four questions a reader opens a feasibility document with —
 * whose business, as of when, what is the verdict, and what is the number —
 * and then stops. No KPI tiles, no cards, no icons, no second colour: the
 * figures separate by typography alone.
 *
 * Every figure is the view model's, already formatted; nothing here
 * computes or reformats. The date is the only value the cover makes itself.
 */
export function ReportCover({ view, businessName }: { view: DetailedView; businessName: string }) {
  return (
    <div className="qc-print-only qc-report-cover px-[18px] pb-8 pt-5 lg:px-[30px]">
      <div className="flex items-baseline justify-between border-b border-qc-rule pb-2.5">
        <span className="text-sm font-semibold text-qc-ink">{COPY.productName}</span>
        <span className="font-mono text-[10px] text-qc-subtle">{COPY.domain ?? 'domain TBD'}</span>
      </div>

      <div className="mt-[86px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">{REPORT_COPY.documentTitle}</span>
        <h1 className="m-0 mt-3.5 text-[32px] font-medium leading-tight tracking-[-0.02em] text-qc-ink">{businessName}</h1>
        <div className="mt-2.5 font-mono text-xs text-qc-secondary">{formatReportDate(new Date())}</div>
      </div>

      <div className="mt-10 border-t border-qc-rule pt-[26px]">
        <p className="m-0 text-[17px] leading-[1.55] text-qc-ink text-pretty">
          {view.verdict.map((segment, index) =>
            segment.tone === 'text' ? (
              <span key={index}>{segment.text}</span>
            ) : (
              <span key={index} className={cn('font-mono font-medium tabular-nums', segment.tone === 'accent' && 'text-qc-accent')}>
                {segment.text}
              </span>
            ),
          )}
        </p>
      </div>

      <div className="mt-8">
        <div className="text-[13px] text-qc-muted">{REPORT_COPY.coverHeadline}</div>
        <div className="mt-1.5 font-mono text-[40px] font-medium leading-tight tracking-[-0.02em] tabular-nums text-qc-accent">{view.monthlyOperatingResult}</div>
      </div>

      <div className="mt-8 grid grid-cols-3">
        <CoverFigure label={COPY.breakEven} value={view.breakEvenPerDay.available ? view.breakEvenPerDay.value : view.breakEvenPerDay.message} isNumeric={view.breakEvenPerDay.available} />
        <CoverFigure label={COPY.payback} value={view.payback.available ? view.payback.value : view.payback.message} isNumeric={view.payback.available} />
        <CoverFigure label={COPY.totalInitialInvestment} value={view.initialInvestment} isNumeric isLast />
      </div>

      {view.guardrails.length > 0 ? (
        <div className="mt-9 border-t border-qc-rule pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-qc-secondary">{REPORT_COPY.coverWarnings}</span>
            <span className="font-mono text-xs tabular-nums text-qc-muted">{view.guardrails.length}</span>
          </div>
          <div className="mt-2.5 flex flex-col gap-2">
            {view.guardrails.map((guardrail) => (
              <p key={guardrail.id} className="m-0 text-xs leading-relaxed text-qc-muted">
                {guardrail.message}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {/* `qc-report-cover-footer`: print CSS pins this block to the bottom of
          the page (the cover is a fixed-height flex column on paper), so the
          disclaimer and colophon read as the foot of a printed page rather
          than landing wherever the content above happens to end. */}
      <div className="qc-report-cover-footer mt-10 border-t border-qc-rule pt-4">
        <p className="m-0 max-w-[620px] text-xs leading-relaxed text-qc-muted">{REPORT_COPY.disclaimerShort}</p>
        <div className="mt-3.5 flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-qc-subtle">{REPORT_COPY.runningHead(businessName)}</span>
          <span className="font-mono text-[10px] text-qc-subtle">{COPY.footerScope}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Three figures in a hairline-divided row — the same anatomy the break-even
 * section already uses, so the cover introduces no new component
 * vocabulary.
 */
function CoverFigure({ label, value, isNumeric, isLast = false }: { label: string; value: string; isNumeric: boolean; isLast?: boolean }) {
  return (
    <div className={cn('border-t border-qc-rule px-5 py-3 first:pl-0', !isLast && 'border-r border-r-qc-rule')}>
      <div className="text-xs text-qc-muted">{label}</div>
      <div className={cn('mt-1.5 text-qc-ink', isNumeric ? 'font-mono text-[20px] tabular-nums' : 'text-[13px] leading-snug')}>{value}</div>
    </div>
  )
}
