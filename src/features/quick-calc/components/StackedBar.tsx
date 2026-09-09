import { cn } from '../../../lib/cn.ts'
import type { QuickView } from '../viewModel.ts'

type StackedBarProps = {
  bar: QuickView['bar']
  endLabel: string
}

export function StackedBar({ bar, endLabel }: StackedBarProps) {
  if (bar.length === 0) {
    return (
      <div>
        <div className="mt-[18px] flex h-[38px] border border-qc-rule-mid lg:h-[44px]" aria-hidden="true" />
        <div className="mt-1.5 flex justify-between font-mono text-[11px] tabular-nums text-qc-muted">
          <span>$0</span>
          <span>—</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mt-[18px] flex h-[38px] overflow-hidden border border-qc-rule-mid lg:mt-[22px] lg:h-[44px]">
        {bar.map((segment) => (
          <div
            key={segment.key}
            className={cn('flex min-w-0 items-center overflow-hidden', segment.width >= 15 && 'pl-2.5')}
            style={{ width: `${segment.width}%`, background: segment.color }}
            title={`${segment.label} ${segment.amountFormatted}`}
          >
            {segment.showLabel ? (
              <span className="hidden whitespace-nowrap text-[11px] text-qc-on-accent lg:inline">
                {segment.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] tabular-nums text-qc-muted">
        <span>$0</span>
        <span>{endLabel}</span>
      </div>
    </div>
  )
}
