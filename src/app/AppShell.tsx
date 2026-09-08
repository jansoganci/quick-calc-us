import type { ReactNode } from 'react'
import { SHELL_COPY } from './shellCopy.ts'

type AppShellProps = {
  children: ReactNode
}

/**
 * The page frame the calculator renders inside: one 1152px sheet, the
 * masthead, and the colophon. Inherited from the TR sibling app's shell
 * (`docs/APP_ARCHITECTURE_AND_PROJECT_STRUCTURE.md`, `docs/DESIGN_DIRECTION.md`)
 * with the two-mode switch removed — this product is Quick-only (US-6/US-8 in
 * `docs/US_PRODUCT_SCOPE.md` do not authorise a Detailed US engine yet).
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="qc-sheet mx-auto max-w-[1152px] overflow-x-clip border-x border-qc-rule bg-qc-surface">
      <AppHeader />
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
