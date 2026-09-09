import { useState } from 'react'
import { cn } from '../../../lib/cn.ts'
import { COPY } from '../labels.ts'
import type { AssumptionRow } from '../resultView.ts'

/**
 * Mandatory assumption transparency: every assumption that shaped the
 * result, including the three annual rates when they are 0%. A hidden 0%
 * would mislead.
 *
 * Below `lg` it starts collapsed behind a row-count toggle — the full
 * definition list is dense and this section sits at the very end of the
 * page.
 */
export function AssumptionsList({ rows }: { rows: AssumptionRow[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="max-w-[900px]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left lg:hidden"
      >
        <span className="text-[13px] text-qc-secondary">{COPY.assumptionRowCount(rows.length)}</span>
        <span
          aria-hidden="true"
          className={cn('inline-block h-[7px] w-[7px] border-b-[1.5px] border-r-[1.5px] border-qc-muted', open ? '-translate-y-1 rotate-[-135deg]' : '-translate-y-0.5 rotate-45')}
        />
      </button>

      <div className={cn('lg:grid lg:grid-cols-2 lg:gap-x-10', open ? 'block' : 'hidden lg:grid')}>
        {rows.map((row) => (
          <div key={row.label} className="qc-report-row flex justify-between gap-3 border-t border-qc-rule-row py-2 last:border-b">
            <span className="text-[13px] text-qc-secondary">{row.label}</span>
            <span className="font-mono text-[13px] tabular-nums text-qc-ink">{row.value}</span>
          </div>
        ))}
        <p className="col-span-2 mt-3 text-xs leading-relaxed text-qc-muted">{COPY.assumptionsFootnote}</p>
      </div>
    </div>
  )
}
