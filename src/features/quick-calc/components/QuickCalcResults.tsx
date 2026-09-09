import { cn } from '../../../lib/cn.ts'
import { COPY } from '../labels.ts'
import type { QuickView } from '../viewModel.ts'
import { BreakdownTable } from './BreakdownTable.tsx'
import { OutputStrip } from './OutputStrip.tsx'
import { SankeyBreakdown } from './SankeyBreakdown.tsx'
import { SimulationTable } from './SimulationTable.tsx'
import { StackedBar } from './StackedBar.tsx'

type QuickCalcResultsProps = {
  view: QuickView | null
  hasCalculated: boolean
  liveFlash: boolean
  copied: boolean
  onCopy: () => void
}

export function QuickCalcResults({ view, hasCalculated, liveFlash, copied, onCopy }: QuickCalcResultsProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[600px] px-[18px] py-5 lg:max-w-none lg:px-[34px] lg:py-[30px] lg:pb-[34px]',
        hasCalculated && view && 'qc-enter',
        liveFlash && 'qc-live',
      )}
    >
      {!view ? (
        <EmptyResult />
      ) : (
        <>
          <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:hidden">
            {COPY.resultSection}
          </div>
          <p className="max-w-[610px] text-lg leading-normal tracking-tight text-qc-ink text-pretty lg:text-[21px] lg:leading-normal">
            {view.headlineSegments.map((segment, index) =>
              segment.tone === 'text' ? (
                <span key={index}>{segment.text}</span>
              ) : (
                <span
                  key={index}
                  className={cn('font-mono font-medium tabular-nums', segment.tone === 'accent' && 'text-qc-accent')}
                >
                  {segment.text}
                </span>
              ),
            )}
          </p>
          <div className="mt-3.5 lg:mt-3.5">
            <button
              type="button"
              onClick={onCopy}
              className="min-h-[44px] bg-transparent p-0 py-[11px] text-[13px] text-qc-secondary hover:text-qc-ink hover:underline lg:min-h-0 lg:py-0"
            >
              {copied ? COPY.copied : COPY.copySummary}
            </button>
          </div>

          <div className="my-5 h-px bg-qc-rule lg:my-[26px]" />

          {view.headlineCost ? (
            <div className="flex items-end justify-between gap-[30px]">
              <div>
                <div className="mb-1.5 text-[13px] text-qc-secondary lg:mb-[7px]">{COPY.headlineCost}</div>
                <div className="font-mono text-4xl font-medium leading-none tracking-tight text-qc-accent tabular-nums lg:text-[44px]">
                  {view.headlineCost}
                </div>
              </div>
              <div className="hidden pb-[3px] text-right lg:block">
                <div className="mb-1.5 text-[13px] text-qc-secondary">{COPY.headlineTicket}</div>
                <div className="font-mono text-[19px] tabular-nums text-qc-ink">{view.ticketFormatted}</div>
              </div>
            </div>
          ) : null}

          <StackedBar bar={view.bar} endLabel={view.barEndLabel} />
          <BreakdownTable rows={view.breakdown} totalFormatted={view.ticketFormatted} />
          <SankeyBreakdown bar={view.bar} ticketFormatted={view.ticketFormatted} />

          <div className="mb-[18px] mt-6 h-px bg-qc-rule lg:mb-6 lg:mt-[30px]" />
          <OutputStrip outputs={view.outputs} />
          {/*
            The payback note explains a specific figure the strip renders as `—`, so
            it sits directly beneath it; the general earnings limitation, which
            explains none of them in particular, follows.
          */}
          {view.paybackNote ? (
            <p className="mt-[14px] max-w-[620px] text-xs leading-relaxed text-qc-muted text-pretty lg:mt-[15px]">
              {view.paybackNote}
            </p>
          ) : null}
          <p
            className={cn(
              'max-w-[620px] text-xs leading-relaxed text-qc-muted text-pretty',
              view.paybackNote ? 'mt-2' : 'mt-[14px] lg:mt-[15px]',
            )}
          >
            {COPY.earningsFootnote}
          </p>

          <div className="mb-[18px] mt-6 h-px bg-qc-rule lg:mb-5 lg:mt-[30px]" />
          <SimulationTable rows={view.simulation} />
          <p className="mt-3 max-w-[620px] text-xs leading-relaxed text-qc-muted text-pretty lg:mt-[13px]">
            {COPY.simFootnote}
          </p>
        </>
      )}
    </div>
  )
}

/**
 * The sentence and nothing else. DIRECTION V6 is explicit: before the first
 * calculation there is "no partial figures, no placeholder numbers, no
 * skeleton of the result column".
 */
function EmptyResult() {
  return <p className="text-[13px] leading-relaxed text-qc-secondary text-pretty">{COPY.emptyResult}</p>
}
