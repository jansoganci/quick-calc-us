import { COPY } from '../labels.ts'
import type { QuickView } from '../viewModel.ts'

type SimulationTableProps = {
  rows: QuickView['simulation']
}

export function SimulationTable({ rows }: SimulationTableProps) {
  return (
    <div>
      <div className="mb-[13px] text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
        {COPY.simTitle}
      </div>
      <div className="hidden grid-cols-[1fr_auto_auto_auto] items-center gap-x-6 text-sm lg:grid">
        <div className="text-xs text-qc-muted">{COPY.simScenario}</div>
        <div className="text-right text-xs text-qc-muted">{COPY.simVolume}</div>
        <div className="text-right text-xs text-qc-muted">{COPY.simCost}</div>
        <div className="text-right text-xs text-qc-muted">{COPY.simEarnings}</div>
        <div className="col-span-full mt-2 h-px bg-qc-ink" />
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <div className={`${row.isCurrent ? 'py-[11px] font-semibold text-qc-ink' : 'py-2.5 text-qc-secondary'}`}>
              {row.scenario}
            </div>
            <div
              className={`text-right font-mono tabular-nums ${row.isCurrent ? 'py-[11px] font-semibold text-qc-ink' : 'py-2.5 text-qc-secondary'}`}
            >
              {row.volume}
            </div>
            <div
              className={`text-right font-mono tabular-nums ${row.isCurrent ? 'py-[11px] font-semibold text-qc-ink' : 'py-2.5 text-qc-secondary'}`}
            >
              {row.cost}
            </div>
            <div
              className={`text-right font-mono tabular-nums ${row.isCurrent ? 'py-[11px] font-semibold text-qc-ink' : 'py-2.5 text-qc-secondary'}`}
            >
              {row.earnings}
            </div>
            <div className="col-span-full h-px" style={{ background: row.rule }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 text-[13px] lg:hidden">
        <div className="text-[11px] text-qc-muted">{COPY.simVolumeShort}</div>
        <div className="text-right text-[11px] text-qc-muted">{COPY.simCostShort}</div>
        <div className="text-right text-[11px] text-qc-muted">{COPY.simEarnings}</div>
        <div className="col-span-full mt-1.5 h-px bg-qc-ink" />
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <div className={`py-[11px] font-mono tabular-nums ${row.isCurrent ? 'font-semibold text-qc-ink' : 'text-qc-secondary'}`}>
              {row.volume}
            </div>
            <div className={`py-[11px] text-right font-mono tabular-nums ${row.isCurrent ? 'font-semibold text-qc-ink' : 'text-qc-secondary'}`}>
              {row.cost}
            </div>
            <div className={`py-[11px] text-right font-mono tabular-nums ${row.isCurrent ? 'font-semibold text-qc-ink' : 'text-qc-secondary'}`}>
              {row.earnings}
            </div>
            <div className="col-span-full h-px" style={{ background: row.rule }} />
          </div>
        ))}
      </div>
    </div>
  )
}
