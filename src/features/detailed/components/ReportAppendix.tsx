import { REPORT_COPY } from '../labels.ts'
import { formatReportDate, type ReportInputGroup } from '../reportView.ts'
import type { DetailedView } from '../viewModel.ts'

/**
 * "Appendix A — Inputs" and "Appendix B — Scope and limitations": the two
 * things a printed result needs that a screen result does not.
 *
 * The appendix is what makes the report auditable — a reader can check
 * every conclusion against the inputs that produced it — and the
 * limitations section is what keeps it honest about what it is. Both are
 * print-only: on screen the inputs are the form itself, a scroll away.
 *
 * Repeating-row groups are real tables so their headers repeat when a long
 * list spills onto another page; there is no cap on how many products or
 * expense lines a user may enter.
 */
export function ReportAppendix({ view }: { view: DetailedView }) {
  return (
    <div className="qc-print-only qc-report-appendix px-[18px] pb-8 pt-6 lg:px-[30px]">
      <h2 className="m-0 text-[17px] font-semibold text-qc-ink">{REPORT_COPY.appendixTitle}</h2>
      <p className="mb-6 mt-2 max-w-[620px] text-xs leading-relaxed text-qc-muted">{REPORT_COPY.appendixNote}</p>

      {view.reportInputs.map((group) => (
        <AppendixGroup key={group.section} group={group} />
      ))}

      <div className="mt-9 border-t border-qc-rule pt-5">
        <h2 className="m-0 text-[15px] font-semibold text-qc-ink">{REPORT_COPY.limitsTitle}</h2>
        <div className="mt-3 flex max-w-[660px] flex-col gap-[7px]">
          {REPORT_COPY.disclaimerFull.map((paragraph, index) => (
            <p key={index} className="qc-report-row m-0 text-xs leading-[1.65] text-qc-secondary">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="mt-4 border-t border-qc-rule-row pt-2.5">
          <span className="font-mono text-[10px] text-qc-subtle">{REPORT_COPY.meta(view.engineVersion, formatReportDate(new Date()))}</span>
        </div>
      </div>
    </div>
  )
}

function AppendixGroup({ group }: { group: ReportInputGroup }) {
  return (
    <section className="qc-report-section mb-7">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-qc-subtle">{String(group.index).padStart(2, '0')}</span>
        <h3 className="m-0 text-[13px] font-semibold text-qc-ink">{group.title}</h3>
      </div>

      {group.content.kind === 'table' ? (
        <table className="qc-report-table w-full table-fixed border-collapse">
          <thead>
            <tr>
              {group.content.table.columns.map((column, index) => (
                <th key={column} scope="col" className={`border-b border-qc-ink pb-[7px] text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted ${index === 0 ? 'text-left' : 'pl-3 text-right'}`}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.content.table.rows.map((row, rowIndex) => (
              <tr key={`${group.section}-${String(rowIndex)}`}>
                {row.map((cell, index) => (
                  <td
                    key={`${group.section}-${String(rowIndex)}-${String(index)}`}
                    className={index === 0 ? 'border-b border-qc-rule-row py-2 text-[13px] text-qc-ink' : 'border-b border-qc-rule-row py-2 pl-3 text-right font-mono text-[13px] tabular-nums text-qc-secondary'}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>
          {group.content.rows.map((row) => (
            <div key={row.label} className="qc-report-row flex justify-between gap-3 border-b border-qc-rule-row py-2">
              <span className="text-[13px] text-qc-secondary">{row.label}</span>
              <span className="font-mono text-[13px] tabular-nums text-qc-ink">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {group.total === null ? null : (
        <div className="qc-report-row flex justify-between gap-3 border-t border-qc-rule-mid pt-[9px]">
          <span className="text-[13px] text-qc-secondary">{group.total.label}</span>
          <span className="font-mono text-[13px] tabular-nums text-qc-ink">{group.total.value}</span>
        </div>
      )}
    </section>
  )
}
