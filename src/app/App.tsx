import { useState } from 'react'
import { AppShell } from './AppShell.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { MODE_ANCHORS, type CalculationMode } from './shellCopy.ts'
import { QuickCalcPage } from '../features/quick-calc/QuickCalcPage.tsx'
import { DetailedFeasibilityPage } from '../features/detailed/DetailedFeasibilityPage.tsx'

/**
 * Mode is in-page state, not a route — there is nothing to address, since
 * URL sharing is out of scope (architecture D4's "a router only when a
 * second real screen requires it" isn't met by a same-page toggle).
 *
 * Both modes stay mounted so switching away and back preserves what the
 * user typed.
 */
export function App() {
  const [mode, setMode] = useState<CalculationMode>('quick')

  function goToMode(next: CalculationMode) {
    setMode(next)
    window.history.replaceState(null, '', `#${MODE_ANCHORS[next]}`)
    window.scrollTo({ top: 0 })
  }

  return (
    <ErrorBoundary>
      <AppShell mode={mode} onModeChange={goToMode}>
        <div hidden={mode !== 'quick'}>
          <QuickCalcPage />
        </div>
        <div hidden={mode !== 'detailed'}>
          <DetailedFeasibilityPage />
        </div>
      </AppShell>
    </ErrorBoundary>
  )
}
