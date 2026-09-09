import { AppShell } from './AppShell.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { QuickCalcPage } from '../features/quick-calc/QuickCalcPage.tsx'

export function App() {
  return (
    <ErrorBoundary>
      <AppShell>
        <QuickCalcPage />
      </AppShell>
    </ErrorBoundary>
  )
}
