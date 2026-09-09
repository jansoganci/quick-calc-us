import type { QuickView } from '../viewModel.ts'

type OutputStripProps = {
  outputs: QuickView['outputs']
}

export function OutputStrip({ outputs }: OutputStripProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4 lg:gap-0">
      {outputs.map((output, index) => (
        <div
          key={output.label}
          className="lg:border-r lg:border-qc-rule lg:pr-4 lg:pl-4 first:lg:pl-0 last:lg:border-r-0"
          style={index === outputs.length - 1 ? { borderRightColor: 'transparent' } : undefined}
        >
          <div className="line-clamp-2 min-h-8 text-xs leading-snug text-qc-secondary lg:min-h-[34px]">
            {output.label}
          </div>
          <div className="font-mono text-xl tabular-nums tracking-tight text-qc-ink lg:text-[22px]">
            {output.value}
            {output.unit ? <span className="text-[13px] text-qc-muted"> {output.unit}</span> : null}
          </div>
        </div>
      ))}
    </div>
  )
}
