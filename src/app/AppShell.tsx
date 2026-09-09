import type { ReactNode } from 'react'
import { ModeRow } from './ModeRow.tsx'
import { SHELL_COPY, type CalculationMode } from './shellCopy.ts'

type AppShellProps = {
  mode: CalculationMode
  onModeChange: (mode: CalculationMode) => void
  children: ReactNode
}

/**
 * The page frame the calculator renders inside: one 1152px sheet, the
 * masthead, the mode row, and the colophon. Inherited from the TR sibling
 * app's shell (`docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`,
 * `docs/DESIGN_DIRECTION.md`). The mode row returned once Detailed shipped
 * an engine and a UI of its own (Phase 3/4) — before that this product was
 * Quick-only and had nothing to switch to.
 */
export function AppShell({ mode, onModeChange, children }: AppShellProps) {
  return (
    <div className="qc-sheet mx-auto max-w-[1152px] overflow-x-clip border-x border-qc-rule bg-qc-surface">
      <AppHeader />
      <ModeRow mode={mode} onModeChange={onModeChange} />
      {children}
      <AppFooter />
    </div>
  )
}

function AppHeader() {
  return (
    <header className="flex h-[52px] items-center gap-2.5 border-b border-qc-rule bg-qc-surface px-[18px] lg:sticky lg:top-0 lg:z-10 lg:h-14 lg:px-[30px]">
      <span className="text-sm font-semibold tracking-[-0.005em] text-qc-ink lg:text-[15px]">
        {SHELL_COPY.productName}
      </span>
      <span className="truncate text-xs text-qc-muted">{SHELL_COPY.slogan}</span>
    </header>
  )
}

function AppFooter() {
  return (
    <footer className="border-t border-qc-rule px-[18px] py-[18px] text-xs text-qc-muted lg:px-[30px]">
      <div className="flex flex-col gap-[5px] lg:flex-row lg:items-baseline lg:justify-between lg:gap-6">
        <span>{SHELL_COPY.footerNature}</span>
        <span className="font-mono text-[11px] text-qc-subtle">
          {SHELL_COPY.domain ?? 'domain TBD'} · {SHELL_COPY.footerScope}
          {SHELL_COPY.authorHandle && SHELL_COPY.authorUrl ? (
            <>
              {' · '}
              <a
                href={SHELL_COPY.authorUrl}
                target="_blank"
                rel="me noopener noreferrer"
                className="underline decoration-qc-rule underline-offset-2 hover:text-qc-muted"
              >
                {SHELL_COPY.authorHandle}
              </a>
            </>
          ) : null}
        </span>
      </div>
    </footer>
  )
}
