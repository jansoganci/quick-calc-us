import { COPY } from '../labels.ts'
import type { MonthRow } from '../resultView.ts'

/**
 * The month-by-month projection. Always mounted (the print report needs it
 * in the DOM regardless of any on-screen toggle) as a real `<table>`, not a
 * grid of `div`s — `thead { display: table-header-group }` is the only
 * mechanism that repeats a header on the next printed page, and a 36-month
 * horizon is two pages.
 */
export function MonthTable({ rows }: { rows: MonthRow[] }) {
  return (
    <div className="mt-4">
      <table className="qc-report-table w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th scope="col" className="w-[56px] border-b border-qc-ink pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:w-[72px]">
              {COPY.monthColumn}
            </th>
            <th scope="col" className="hidden border-b border-qc-ink pb-2 pl-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:table-cell">
              {COPY.unitsColumn}
            </th>
            <th scope="col" className="border-b border-qc-ink pb-2 pl-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
              {COPY.netRevenue}
            </th>
            <th scope="col" className="hidden border-b border-qc-ink pb-2 pl-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:table-cell">
              {COPY.contribution}
            </th>
            <th scope="col" className="hidden border-b border-qc-ink pb-2 pl-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:table-cell">
              {COPY.fixedCostColumn}
            </th>
            <th scope="col" className="border-b border-qc-ink pb-2 pl-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
              {COPY.monthlyOperatingResult}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <td className="border-b border-qc-rule-row py-2 font-mono text-[13px] tabular-nums text-qc-secondary">{row.month}</td>
              <td className="hidden border-b border-qc-rule-row py-2 pl-3 text-right font-mono text-[13px] tabular-nums text-qc-secondary lg:table-cell">{row.units}</td>
              <td className="border-b border-qc-rule-row py-2 pl-3 text-right font-mono text-[13px] tabular-nums text-qc-secondary">{row.netRevenue}</td>
              <td className="hidden border-b border-qc-rule-row py-2 pl-3 text-right font-mono text-[13px] tabular-nums text-qc-secondary lg:table-cell">{row.contribution}</td>
              <td className="hidden border-b border-qc-rule-row py-2 pl-3 text-right font-mono text-[13px] tabular-nums text-qc-secondary lg:table-cell">{row.fixedCost}</td>
              <td className="border-b border-qc-rule-row py-2 pl-3 text-right font-mono text-[13px] font-medium tabular-nums text-qc-ink">{row.operatingResult}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
