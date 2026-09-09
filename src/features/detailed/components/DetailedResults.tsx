import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn.ts'
import { COPY } from '../labels.ts'
import type { DetailedView } from '../viewModel.ts'
import { AssumptionsList } from './AssumptionsList.tsx'
import { ChannelTable } from './ChannelTable.tsx'
import { MonthTable } from './MonthTable.tsx'
import { PaybackChart } from './PaybackChart.tsx'
import { ProductContributionTable } from './ProductContributionTable.tsx'
import { ProjectionChart } from './ProjectionChart.tsx'
import { ReportActionButton } from './ReportActionButton.tsx'
import { ResultBar } from './ResultBar.tsx'
import { SankeyBreakdown } from './SankeyBreakdown.tsx'
import { ScenarioTable } from './ScenarioTable.tsx'

/**
 * The full-width result: money flow, scenarios, the monthly projection (chart
 * + always-mounted table), payback, channel and product economics, and the
 * assumptions block. Renders on screen below the two-column `<main>` and,
 * unchanged, inside the printed report — the same content, the same
 * component tree, in both media.
 */
export function DetailedResults({ view, canPrintReport, onOpenReport }: { view: DetailedView; canPrintReport: boolean; onOpenReport: () => void }) {
  return (
    <div className="qc-report-body mx-auto w-full max-w-[1092px] px-[18px] py-6 lg:px-[30px] lg:py-8">
      <Section index={1} title={COPY.moneyFlowTitle}>
        <ResultBar breakdown={view.breakdown} gross={view.breakdown.total} />
        <SankeyBreakdown breakdown={view.breakdown} gross={view.breakdown.total} />
      </Section>

      <Section index={2} title={COPY.scenario}>
        <ScenarioTable scenarios={view.scenarios} />
      </Section>

      <Section index={3} title={COPY.monthlyResultTitle} flows>
        <div className="hidden lg:block">
          <ProjectionChart data={view.projection} size="lg" />
        </div>
        <div className="lg:hidden">
          <ProjectionChart data={view.projection} size="sm" />
        </div>
        <div className="qc-print-only">
          <ProjectionChart data={view.projection} size="print" />
        </div>
        <MonthTable rows={view.monthRows} />
      </Section>

      <Section index={4} title={COPY.payback}>
        <div className="hidden lg:block">
          <PaybackChart data={view.paybackChart} size="lg" />
        </div>
        <div className="lg:hidden">
          <PaybackChart data={view.paybackChart} size="smPayback" />
        </div>
        <div className="qc-print-only">
          <PaybackChart data={view.paybackChart} size="printPayback" />
        </div>
      </Section>

      <Section index={5} title={COPY.byChannelTitle}>
        <ChannelTable channels={view.channels} totals={view.channelTotals} />
      </Section>

      <Section index={6} title={COPY.byProductTitle}>
        <ProductContributionTable products={view.products} totals={view.productTotals} />
      </Section>

      <Section index={7} title={COPY.breakEven}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 lg:max-w-[500px]">
          <BreakEvenCell label={COPY.breakEvenUnitsPerDay} value={view.breakEvenUnitsPerDay ?? (view.breakEvenPerDay.available ? null : view.breakEvenPerDay.message)} />
          <BreakEvenCell label={COPY.breakEvenUnitsPerMonth} value={view.breakEvenUnitsPerMonth} />
          <BreakEvenCell label="Planned volume" value={view.plannedUnitsPerDay} />
        </div>
      </Section>

      <Section index={8} title={COPY.assumptionsTitle}>
        <AssumptionsList rows={view.assumptions} />
      </Section>

      {/* The mobile call site: at the end of the results, where reading ends.
          Desktop reaches the same control from the summary pane. */}
      <div className="lg:hidden">
        <ReportActionButton variant="results" canPrint={canPrintReport} onOpen={onOpenReport} />
      </div>
    </div>
  )
}

function Section({ index, title, children, flows = false }: { index: number; title: string; children: ReactNode; flows?: boolean }) {
  return (
    <section className={cn(flows ? 'qc-report-flow' : 'qc-report-section', 'border-t border-qc-rule py-6 first:border-t-0 first:pt-0 lg:py-7')}>
      <div className="mb-4 flex items-baseline gap-[10px]">
        <span className="font-mono text-[11px] tabular-nums text-qc-subtle">{String(index).padStart(2, '0')}</span>
        <h2 className="m-0 text-[15px] font-semibold text-qc-ink">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function BreakEvenCell({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs text-qc-muted">{label}</div>
      <div className="mt-1 font-mono text-sm tabular-nums text-qc-ink">{value ?? COPY.none}</div>
    </div>
  )
}
