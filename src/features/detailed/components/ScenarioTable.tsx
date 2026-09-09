import { cn } from '../../../lib/cn.ts'
import { COPY } from '../labels.ts'
import type { ScenarioRow } from '../viewModel.ts'

const ROWS = [
  { key: 'operatingResult', label: COPY.monthlyOperatingResult, emphasise: true },
  { key: 'netRevenue', label: COPY.netRevenue, emphasise: false },
  { key: 'contribution', label: COPY.contribution, emphasise: false },
  { key: 'payback', label: COPY.payback, emphasise: false },
] as const

/** Four rows, three columns. Three numbers do not need a chart; Base stays primary. */
export function ScenarioTable({ scenarios }: { scenarios: ScenarioRow[] }) {
  return (
    <div className="max-w-[820px]">
      <div className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] gap-3 border-b border-qc-ink pb-2 lg:grid-cols-[1fr_180px_180px_180px]">
        <span />
        {scenarios.map((scenario) => (
          <span key={scenario.key} className={cn('text-right text-[11px] font-semibold uppercase tracking-[0.08em]', scenario.isBase ? 'text-qc-ink' : 'text-qc-muted')}>
            {scenario.label}
          </span>
        ))}
      </div>

      {ROWS.map((row, index) => (
        <div
          key={row.key}
          className={cn(
            'grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] items-baseline gap-3 py-[11px] lg:grid-cols-[1fr_180px_180px_180px]',
            index === ROWS.length - 1 ? 'border-b border-qc-ink' : 'border-b border-qc-rule-row',
          )}
        >
          <span className="text-[13px] text-qc-secondary lg:text-sm">{row.label}</span>
          {scenarios.map((scenario) => {
            const value = scenario[row.key]
            const isSentence = row.key === 'payback' && !/^Month \d/.test(value)
            return (
              <span
                key={scenario.key}
                className={cn(
                  'text-right',
                  isSentence ? 'text-xs lg:text-[13px]' : 'font-mono tabular-nums text-[13px] lg:text-sm',
                  scenario.isBase ? cn('text-qc-ink', row.emphasise ? 'font-semibold lg:text-base' : 'font-medium') : 'text-qc-secondary',
                )}
              >
                {value}
              </span>
            )
          })}
        </div>
      ))}
      <p className="mt-3 text-xs leading-relaxed text-qc-muted">{COPY.scenariosInvariantNote}</p>
    </div>
  )
}
