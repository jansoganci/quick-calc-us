import { DetailedForm } from './components/DetailedForm.tsx'
import { DetailedResults } from './components/DetailedResults.tsx'
import { useDetailedCalc } from './hooks/useDetailedCalc.ts'

/** The Detailed Feasibility screen. The page frame, masthead and colophon live in `app/AppShell.tsx`. */
export function DetailedFeasibilityPage() {
  const calc = useDetailedCalc()
  const guardrails = calc.evaluation.ok ? calc.evaluation.guardrails : []

  return (
    <main id="detailed-feasibility" className="lg:grid lg:grid-cols-[392px_1px_1fr]">
      <DetailedForm calc={calc} />
      <div className="hidden bg-qc-rule lg:block" aria-hidden="true" />
      <div className="lg:bg-qc-surface-result">
        <div ref={calc.resultsRef} className="lg:sticky lg:top-14 lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto">
          <DetailedResults
            view={calc.view}
            guardrails={guardrails}
            liveFlash={calc.liveFlash}
            copied={calc.copied}
            onCopy={() => {
              void calc.copySummary()
            }}
          />
        </div>
      </div>
    </main>
  )
}
