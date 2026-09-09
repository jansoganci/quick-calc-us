import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn.ts'
import { COPY, SECTION_LABELS, type SectionId } from '../labels.ts'
import type { DetailedView } from '../viewModel.ts'
import { ReportActionButton } from './ReportActionButton.tsx'

export type SectionSummary = { section: SectionId; index: number; summary: string }

type SummaryPaneProps = {
  view: DetailedView | null
  sections: SectionSummary[]
  canSubmit: boolean
  submitHint: string | null
  copied: boolean
  onCopy: () => void
  onCalculate: () => void
  onGoToSection: (section: SectionId) => void
  onGoToResults: () => void
  canPrintReport: boolean
  onOpenReport: () => void
}

/**
 * The one persistent surface on desktop. Before the first calculation it is
 * a preparation checklist that doubles as navigation; afterwards it is the
 * base scenario's answer. It never becomes a second dashboard: a handful of
 * blocks, no charts.
 */
export function SummaryPane({ view, sections, canSubmit, submitHint, copied, onCopy, onCalculate, onGoToSection, onGoToResults, canPrintReport, onOpenReport }: SummaryPaneProps) {
  if (view === null) {
    return (
      <div className="px-[18px] py-5 lg:px-7 lg:py-[26px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">{COPY.preparation}</span>
        <p className="mb-5 mt-3 text-xs leading-relaxed text-qc-muted">{COPY.emptyResult}</p>

        <div className="hidden lg:block">
          {sections.map((entry, index) => (
            <button
              key={entry.section}
              type="button"
              onClick={() => onGoToSection(entry.section)}
              className={cn('flex w-full items-center justify-between gap-3 border-t border-qc-rule-row py-[9px] text-left', index === sections.length - 1 && 'border-b border-qc-rule-row')}
            >
              <span className="text-[13px] text-qc-ink">
                {String(entry.index).padStart(2, '0')} {SECTION_LABELS[entry.section]}
              </span>
              <span className={cn('font-mono text-xs tabular-nums', entry.summary === COPY.none ? 'text-qc-subtle' : 'text-qc-secondary')}>{entry.summary}</span>
            </button>
          ))}
          <p className="mt-4 text-xs leading-relaxed text-qc-muted">{COPY.optionalSectionsNote}</p>
        </div>

        <div className="mt-[22px] hidden lg:block">
          <CalculateButton canSubmit={canSubmit} submitHint={submitHint} onCalculate={onCalculate} />
        </div>
      </div>
    )
  }

  return (
    <div className="px-[18px] py-5 lg:px-7 lg:py-[26px]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">{COPY.baseScenario}</span>

      <p className="mt-3 text-lg leading-normal text-qc-ink text-pretty">
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
      <button type="button" className="qc-text-btn mt-2.5" onClick={onCopy}>
        {copied ? <span className="text-qc-muted">{COPY.copied}</span> : COPY.copySummary}
      </button>

      <div className="mt-5 border-t border-qc-rule pt-5">
        <span className="text-[13px] text-qc-muted">{COPY.monthlyOperatingResult}</span>
        <div className="mt-1 font-mono text-4xl font-medium leading-tight tracking-[-0.02em] tabular-nums text-qc-accent">{view.monthlyOperatingResult}</div>
      </div>

      <div className="mt-[18px]">
        <PaneRow label={COPY.breakEven}>
          {view.breakEvenPerDay.available ? (
            <span className="font-mono text-sm tabular-nums text-qc-ink">{view.breakEvenPerDay.value}</span>
          ) : (
            <span className="text-right text-[13px] text-qc-ink">{view.breakEvenPerDay.message}</span>
          )}
        </PaneRow>
        <PaneRow label={COPY.payback}>
          {view.payback.available ? <span className="font-mono text-sm tabular-nums text-qc-ink">{view.payback.value}</span> : <span className="text-right text-[13px] text-qc-ink">{view.payback.message}</span>}
        </PaneRow>
        <PaneRow label={COPY.totalInitialInvestment} isLast>
          <span className="font-mono text-sm tabular-nums text-qc-ink">{view.initialInvestment}</span>
        </PaneRow>
      </div>

      <div className="mt-[22px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">{COPY.scenariosMonthlyResult}</span>
        <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-qc-rule-row pt-2.5">
          {view.scenarios.map((scenario) => (
            <div key={scenario.key}>
              <div className={cn('text-xs', scenario.isBase ? 'text-qc-ink' : 'text-qc-muted')}>{scenario.label}</div>
              <div className={cn('mt-1 font-mono text-sm tabular-nums', scenario.isBase ? 'font-medium text-qc-ink' : 'text-qc-secondary')}>{scenario.operatingResult}</div>
            </div>
          ))}
        </div>
      </div>

      {view.guardrails.length > 0 ? (
        <div className="mt-[22px] border-t border-qc-rule pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-qc-secondary">{COPY.warningsTitle}</span>
            <span className="font-mono text-[13px] tabular-nums text-qc-muted">{COPY.warningCount(view.guardrails.length)}</span>
          </div>
          <div className="mt-3">
            {view.guardrails.map((guardrail, index) => (
              <div key={guardrail.id} className={cn('border-t border-qc-rule-row py-2', index === view.guardrails.length - 1 && 'border-b border-qc-rule-row')}>
                <p className="m-0 text-xs leading-relaxed text-qc-muted">{guardrail.message}</p>
                <button type="button" className="qc-text-btn is-accent mt-1 text-xs" onClick={() => onGoToSection(guardrail.section)}>
                  {COPY.goToSection(SECTION_LABELS[guardrail.section])}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <button type="button" className="qc-text-btn is-accent mt-5" onClick={onGoToResults}>
        {COPY.allResults}
      </button>

      {/* The desktop call site: the pane is where a desktop reader sits, so
          the report is reachable without scrolling back through the results. */}
      <div className="hidden lg:block">
        <ReportActionButton variant="pane" canPrint={canPrintReport} onOpen={onOpenReport} />
      </div>
    </div>
  )
}

function PaneRow({ label, isLast = false, children }: { label: string; isLast?: boolean; children: ReactNode }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3 border-t border-qc-rule-row py-2.5', isLast && 'border-b border-qc-rule-row')}>
      <span className="shrink-0 text-[13px] text-qc-secondary">{label}</span>
      {children}
    </div>
  )
}

export function CalculateButton({ canSubmit, submitHint, onCalculate }: { canSubmit: boolean; submitHint: string | null; onCalculate: () => void }) {
  return (
    <div>
      <button
        type="button"
        onClick={onCalculate}
        disabled={!canSubmit}
        className={cn('flex h-[46px] w-full items-center justify-center rounded text-sm font-medium', canSubmit ? 'bg-qc-accent text-qc-on-accent hover:bg-qc-accent-hover' : 'border border-qc-disabled-border bg-qc-disabled text-qc-subtle')}
      >
        {COPY.calculate}
      </button>
      {submitHint ? <p className="mt-2 text-center text-xs leading-relaxed text-qc-muted">{submitHint}</p> : null}
    </div>
  )
}
