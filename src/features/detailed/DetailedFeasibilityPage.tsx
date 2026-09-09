import { cn } from '../../lib/cn.ts'
import { DetailedForm } from './components/DetailedForm.tsx'
import { DetailedResults } from './components/DetailedResults.tsx'
import { MobileSummaryBar } from './components/MobileSummaryBar.tsx'
import { ReportAppendix } from './components/ReportAppendix.tsx'
import { ReportCover } from './components/ReportCover.tsx'
import { ReportNameDialog } from './components/ReportNameDialog.tsx'
import { SummaryPane, type SectionSummary } from './components/SummaryPane.tsx'
import { useDetailedCalc } from './hooks/useDetailedCalc.ts'
import { useReportPrint } from './hooks/useReportPrint.ts'
import { COPY, SECTION_LABELS, type SectionId } from './labels.ts'
import { sectionSummary, visibleSections } from './sectionSummary.ts'

/**
 * One page, eleven sections, a persistent decision summary. Inputs scroll on
 * the left; the pane on the right answers "is this making money?" while
 * they are edited; the reasoning sits full width below.
 */
export function DetailedFeasibilityPage() {
  const calc = useDetailedCalc()
  const report = useReportPrint(calc.businessName, calc.setBusinessName)
  const sections = visibleSections(calc.form)

  const summaries: SectionSummary[] = sections.map((section, index) => ({
    section,
    index: index + 1,
    summary: sectionSummary(calc.form, section),
  }))

  const submitHint = buildSubmitHint()

  function buildSubmitHint(): string | null {
    if (calc.canSubmit) return calc.hasCalculated ? null : COPY.calculateLive
    if (calc.errorSections.length === 1 && calc.errorSections[0] === 'products') {
      return COPY.calculateNoProducts
    }
    return COPY.calculateInvalid(calc.errorSections.length, calc.errorSections.map((section) => SECTION_LABELS[section]).join(', '))
  }

  function goToSection(section: SectionId) {
    calc.setOpenSection(section)
    document.getElementById(`detailed-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function goToResults() {
    calc.resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function goToInputs() {
    document.getElementById('detailed-feasibility')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pb-[92px] lg:pb-0">
      {/*
        The report is this same result, printed: a cover ahead of it, the
        input appendix behind it, and the application's own chrome left out.
        Both are print-only, and both render only once a result exists —
        before Calculate there is nothing to report (V6).
      */}
      {calc.view ? <ReportCover view={calc.view} businessName={calc.businessName} /> : null}

      <main id="detailed-feasibility" className="qc-screen-only lg:grid lg:grid-cols-[1fr_1px_372px]">
        <DetailedForm calc={calc} />
        <div className="hidden bg-qc-rule lg:block" aria-hidden="true" />
        {/*
          The tint sits on the grid item, which stretches to the row height,
          so the column reads as one sheet however short the summary is; the
          sticky pane is the inner element. Same arrangement as Quick's
          result column.
        */}
        <div className="border-t border-qc-rule lg:border-t-0 lg:bg-qc-surface-result">
          <div className="lg:sticky lg:top-14 lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto">
            <SummaryPane
              view={calc.view}
              sections={summaries}
              canSubmit={calc.canSubmit}
              submitHint={submitHint}
              copied={calc.copied}
              onCopy={() => {
                void calc.copySummary()
              }}
              onCalculate={calc.calculate}
              onGoToSection={goToSection}
              onGoToResults={goToResults}
              canPrintReport={report.canPrint}
              onOpenReport={report.open}
            />
          </div>
        </div>
      </main>

      <div ref={calc.resultsRef}>
        {calc.view ? (
          <div className={cn('qc-enter', calc.liveFlash && 'qc-live')}>
            <DetailedResults view={calc.view} canPrintReport={report.canPrint} onOpenReport={report.open} />
            <ReportAppendix view={calc.view} />
          </div>
        ) : null}
      </div>

      <ReportNameDialog open={report.isOpen} name={report.name} canGenerate={report.canGenerate} onNameChange={report.setName} onCancel={report.cancel} onGenerate={report.generate} />

      <MobileSummaryBar view={calc.view} canSubmit={calc.canSubmit} submitHint={submitHint} onCalculate={calc.calculate} onGoToInputs={goToInputs} onGoToResults={goToResults} />
    </div>
  )
}
