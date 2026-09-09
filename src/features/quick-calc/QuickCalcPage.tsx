import { QuickCalcForm } from './components/QuickCalcForm.tsx'
import { QuickCalcResults } from './components/QuickCalcResults.tsx'
import { useQuickCalc } from './hooks/useQuickCalc.ts'

/** The Quick Calculation screen. The page frame, masthead and colophon live in `app/AppShell.tsx`. */
export function QuickCalcPage() {
  const calc = useQuickCalc()

  return (
    <main id="quick-calculation" className="lg:grid lg:grid-cols-[392px_1px_1fr]">
      <QuickCalcForm
        form={calc.form}
        errors={calc.evaluation.ok ? {} : calc.evaluation.errors}
        dirty={calc.dirty}
        canSubmit={calc.canSubmit}
        submitHint={calc.submitHint}
        onChange={calc.setField}
        onBlur={calc.markBlurred}
        onStateChange={calc.setUsState}
        onSubmit={calc.calculate}
      />
      <div className="hidden bg-qc-rule lg:block" aria-hidden="true" />
      {/*
        Inputs left, results sticky right, both visible while typing. The tint sits
        on the grid item, which stretches to the row height, so the column reads as
        one sheet however short the result is; the sticky pane is the inner element.
        The offset is the sticky masthead's own height. Below `lg` the column is
        static, white, and `resultsRef` scrolls to it.
      */}
      <div className="lg:bg-qc-surface-result">
        <div
          ref={calc.resultsRef}
          className="lg:sticky lg:top-14 lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto"
        >
          <QuickCalcResults
            view={calc.view}
            hasCalculated={calc.hasCalculated}
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
