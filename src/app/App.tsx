import { AppShell } from './AppShell.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'

/**
 * Placeholder root. The Quick Calculation engine (`core/quick-us/`) and its
 * feature UI (`features/quick-calc-us/`) are separate, explicitly-authorised
 * phases (docs/US_PRODUCT_SCOPE.md, task Phase 1 / Phase 2) — neither exists
 * yet, so the shell renders an empty-state notice rather than a form.
 */
export function App() {
  return (
    <ErrorBoundary>
      <AppShell>
        <main className="px-[18px] py-16 lg:px-[30px]">
          <p className="text-lg text-qc-ink">Quick Calculation (US) — coming soon.</p>
          <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-qc-secondary">
            This is the Phase 0 scaffold. The calculation engine and form are not built yet.
          </p>
        </main>
      </AppShell>
    </ErrorBoundary>
  )
}
