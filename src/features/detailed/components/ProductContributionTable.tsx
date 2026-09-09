import { cn } from '../../../lib/cn.ts'
import { COPY } from '../labels.ts'
import type { ProductRow } from '../resultView.ts'

const COLUMNS = [
  { key: 'units', label: COPY.channelUnits },
  { key: 'gross', label: COPY.channelGross },
  { key: 'net', label: COPY.channelNet },
  { key: 'cogs', label: COPY.channelCogs },
  { key: 'variable', label: COPY.channelVariable },
  { key: 'fee', label: COPY.channelFee },
  { key: 'contribution', label: COPY.channelContribution },
] as const

type ProductContributionTableProps = {
  products: ProductRow[]
  totals: Omit<ProductRow, 'productId' | 'name'>
}

/**
 * Same anatomy as `ChannelTable` — same columns, same reconciling totals
 * row, same mobile transpose below `lg` — with rows summed per product
 * instead of per channel (DF-84). No new visual language: this is the
 * channel table's data read a different way.
 */
export function ProductContributionTable({ products, totals }: ProductContributionTableProps) {
  return (
    <div>
      <div className="hidden lg:block">
        <div className="grid grid-cols-[130px_92px_repeat(6,minmax(0,1fr))]">
          <span className="pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">Product</span>
          {COLUMNS.map((column) => (
            <span key={column.key} className="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
              {column.label}
            </span>
          ))}

          {products.map((row, index) => (
            <ProductCells key={row.productId} row={row} isFirst={index === 0} isLast={index === products.length - 1} />
          ))}

          <span className="py-2.5 text-[13px] text-qc-muted">{COPY.total}</span>
          {COLUMNS.map((column) => (
            <span key={column.key} className="py-2.5 text-right font-mono text-[13px] tabular-nums text-qc-muted">
              {totals[column.key]}
            </span>
          ))}
        </div>
      </div>

      <div className="lg:hidden">
        {products.map((row, index) => (
          <div
            key={row.productId}
            className={cn('py-2.5', index === 0 ? 'border-t border-qc-rule-mid' : 'border-t border-qc-rule-row', index === products.length - 1 && 'border-b border-qc-rule')}
          >
            <div className="flex items-baseline justify-between gap-2.5">
              <span className="text-sm font-semibold text-qc-ink">{row.name}</span>
              <span className="font-mono text-xs tabular-nums text-qc-muted">
                {row.units} {COPY.channelUnits.toLowerCase()}
              </span>
            </div>
            {COLUMNS.filter((column) => column.key !== 'units' && column.key !== 'contribution').map((column) => (
              <div key={column.key} className="flex justify-between gap-2.5 py-[5px]">
                <span className="text-[13px] text-qc-secondary">{column.label}</span>
                <span className="font-mono text-[13px] tabular-nums text-qc-ink">{row[column.key]}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between gap-2.5 border-t border-qc-rule-row pt-1.5">
              <span className="text-[13px] font-semibold text-qc-ink">{COPY.channelContribution}</span>
              <span className="font-mono text-[13px] font-semibold tabular-nums text-qc-ink">{row.contribution}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-[11px] leading-relaxed text-qc-muted">Amounts in USD. Fixed costs are not deducted from contribution.</p>
    </div>
  )
}

function ProductCells({ row, isFirst, isLast }: { row: ProductRow; isFirst: boolean; isLast: boolean }) {
  const border = isFirst ? 'border-t border-qc-ink border-b border-qc-rule-row' : isLast ? 'border-b border-qc-rule-mid' : 'border-b border-qc-rule-row'

  return (
    <>
      <span className={cn('py-2.5 text-sm text-qc-ink', border)}>{row.name}</span>
      {COLUMNS.map((column) => (
        <span key={column.key} className={cn('py-2.5 text-right font-mono text-sm tabular-nums', column.key === 'contribution' ? 'font-medium text-qc-ink' : 'text-qc-secondary', border)}>
          {row[column.key]}
        </span>
      ))}
    </>
  )
}
