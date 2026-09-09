import { cn } from '../lib/cn.ts'
import { MODES, MODE_ANCHORS, MODE_DESCRIPTIONS, MODE_LABELS, SHELL_COPY, type CalculationMode } from './shellCopy.ts'

/**
 * The choice between the two calculators. A full-width row under the
 * masthead rather than a masthead-corner link, so it reads as a control and
 * each mode carries a line saying what it gives you.
 */
export function ModeRow({
  mode,
  onModeChange,
}: {
  mode: CalculationMode
  onModeChange: (mode: CalculationMode) => void
}) {
  return (
    <nav
      aria-label={SHELL_COPY.modeNavigation}
      className="qc-screen-only border-b border-qc-rule bg-qc-surface px-[18px] pb-3.5 pt-3 lg:px-[30px]"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
        {SHELL_COPY.modeNavigation}
      </span>

      <div className="mt-2 grid grid-cols-2 gap-x-5 lg:max-w-[620px] lg:gap-x-10">
        {MODES.map((candidate) => {
          const isActive = candidate === mode
          return (
            <a
              key={candidate}
              href={`#${MODE_ANCHORS[candidate]}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                onModeChange(candidate)
              }}
              className="group flex min-h-[44px] flex-col items-start pt-1"
            >
              <span
                className={cn(
                  'border-b-2 pb-1 text-sm',
                  isActive
                    ? 'border-b-qc-ink font-semibold text-qc-ink'
                    : 'border-b-transparent text-qc-secondary group-hover:border-b-qc-rule-strong group-hover:text-qc-ink',
                )}
              >
                {MODE_LABELS[candidate]}
              </span>
              <span className="mt-1.5 text-xs leading-relaxed text-qc-muted">{MODE_DESCRIPTIONS[candidate]}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
