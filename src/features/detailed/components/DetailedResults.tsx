import { useState } from 'react'
import type { ScenarioKey } from '../../../core/detailed-us/index.ts'
import { cn } from '../../../lib/cn.ts'
import type { Guardrail } from '../guardrails.ts'
import { COPY, SCENARIO_LABELS } from '../labels.ts'
import type { DetailedView, ScenarioView } from '../resultView.ts'

const SCENARIO_ORDER: ScenarioKey[] = ['bad', 'base', 'good']

type DetailedResultsProps = {
  view: DetailedView | null
  guardrails: Guardrail[]
  liveFlash: boolean
  copied: boolean
  onCopy: () => void
}

export function DetailedResults({ view, guardrails, liveFlash, copied, onCopy }: DetailedResultsProps) {
  const [scenario, setScenario] = useState<ScenarioKey>('base')

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[600px] px-[18px] py-5 lg:max-w-none lg:px-[34px] lg:py-[30px] lg:pb-[34px]',
        view && 'qc-enter',
        liveFlash && 'qc-live',
      )}
    >
      {!view ? (
        <p className="text-[13px] leading-relaxed text-qc-secondary text-pretty">{COPY.emptyResult}</p>
      ) : (
        <>
          <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:hidden">
            {COPY.resultSection}
          </div>

          {guardrails.length > 0 ? (
            <div className="mb-4 space-y-1.5">
              {guardrails.map((g) => (
                <p key={g.id} className="qc-hint">
                  {g.message}
                </p>
              ))}
            </div>
          ) : null}

          <p className="max-w-[610px] text-lg leading-normal tracking-tight text-qc-ink text-pretty lg:text-[21px] lg:leading-normal">
            {view.headline}
          </p>
          <div className="mt-3.5">
            <button
              type="button"
              onClick={onCopy}
              className="min-h-[44px] bg-transparent p-0 py-[11px] text-[13px] text-qc-secondary hover:text-qc-ink hover:underline lg:min-h-0 lg:py-0"
            >
              {copied ? COPY.copied : COPY.copySummary}
            </button>
          </div>

          <div className="my-5 h-px bg-qc-rule lg:my-[26px]" />

          <div className="flex gap-2">
            {SCENARIO_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setScenario(key)}
                className={cn(
                  'min-h-[44px] rounded border px-3.5 text-sm',
                  scenario === key ? 'border-qc-accent bg-qc-accent text-qc-on-accent' : 'border-qc-rule text-qc-ink',
                )}
              >
                {SCENARIO_LABELS[key]}
              </button>
            ))}
          </div>

          <ScenarioPanel scenario={view.scenarios[scenario]} />

          <div className="my-5 h-px bg-qc-rule lg:my-[26px]" />

          <div className="flex items-end justify-between gap-[30px]">
            <div>
              <div className="mb-1.5 text-[13px] text-qc-secondary">{COPY.breakEven}</div>
              <div className="font-mono text-2xl font-medium tabular-nums text-qc-ink">
                {view.breakEven.status === 'available' ? `${view.breakEven.unitsPerDay} ${COPY.breakEvenUnitsPerDay}` : view.breakEven.reason}
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1.5 text-[13px] text-qc-secondary">{COPY.totalInitialInvestment}</div>
              <div className="font-mono text-lg tabular-nums text-qc-ink">{view.totalInitialInvestment}</div>
            </div>
          </div>

          <p className="mt-[14px] max-w-[620px] text-xs leading-relaxed text-qc-muted text-pretty">{COPY.earningsFootnote}</p>
          <p className="mt-2 max-w-[620px] text-xs leading-relaxed text-qc-muted text-pretty">{COPY.assumptionsFootnote}</p>

          <div className="my-5 h-px bg-qc-rule lg:my-[26px]" />
          <AssumptionsSummary view={view} />
        </>
      )}
    </div>
  )
}

function ScenarioPanel({ scenario }: { scenario: ScenarioView }) {
  return (
    <div className="mt-4">
      <div className="flex items-end justify-between gap-[30px]">
        <div>
          <div className="mb-1.5 text-[13px] text-qc-secondary">{COPY.monthlyOperatingResult}</div>
          <div className={cn('font-mono text-4xl font-medium leading-none tracking-tight tabular-nums lg:text-[44px]', scenario.isLoss ? 'text-qc-error' : 'text-qc-accent')}>
            {scenario.monthlyOperatingResult}
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1.5 text-[13px] text-qc-secondary">{COPY.payback}</div>
          <div className="font-mono text-[15px] tabular-nums text-qc-ink">
            {scenario.payback.status === 'available' ? scenario.payback.monthLabel : scenario.payback.reason}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">{COPY.byChannelTitle}</div>
        <BreakdownGrid rows={scenario.byChannel} />
      </div>

      {scenario.byProduct.length > 0 ? (
        <div className="mt-5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">{COPY.byProductTitle}</div>
          <BreakdownGrid rows={scenario.byProduct.map((row) => ({ label: row.name, ...row }))} />
        </div>
      ) : null}
    </div>
  )
}

type BreakdownRow = {
  label: string
  units: string
  netRevenue: string
  productCogs: string
  paymentPlatformFee: string
  contribution: string
}

function BreakdownGrid({ rows }: { rows: BreakdownRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-qc-ink text-left text-[11px] uppercase tracking-[0.06em] text-qc-muted">
            <th className="py-1.5 pr-3 font-semibold" />
            <th className="py-1.5 pr-3 text-right font-semibold">Units</th>
            <th className="py-1.5 pr-3 text-right font-semibold">Revenue</th>
            <th className="py-1.5 pr-3 text-right font-semibold">COGS</th>
            <th className="py-1.5 pr-3 text-right font-semibold">Fee</th>
            <th className="py-1.5 text-right font-semibold">Contribution</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-qc-rule-row">
              <td className="py-1.5 pr-3 text-qc-ink">{row.label}</td>
              <td className="py-1.5 pr-3 text-right font-mono tabular-nums text-qc-ink">{row.units}</td>
              <td className="py-1.5 pr-3 text-right font-mono tabular-nums text-qc-ink">{row.netRevenue}</td>
              <td className="py-1.5 pr-3 text-right font-mono tabular-nums text-qc-ink">{row.productCogs}</td>
              <td className="py-1.5 pr-3 text-right font-mono tabular-nums text-qc-ink">{row.paymentPlatformFee}</td>
              <td className="py-1.5 text-right font-mono tabular-nums text-qc-ink">{row.contribution}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AssumptionsSummary({ view }: { view: DetailedView }) {
  const { assumptions } = view
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-qc-muted">
      <dt>State</dt>
      <dd className="text-right text-qc-ink">{assumptions.stateLabel}</dd>
      <dt>Sales tax</dt>
      <dd className="text-right text-qc-ink">{assumptions.salesTaxRate}</dd>
      <dt>Ramp-up</dt>
      <dd className="text-right text-qc-ink">{assumptions.rampUpLabel}</dd>
      <dt>Horizon</dt>
      <dd className="text-right text-qc-ink">{assumptions.projectionHorizonMonths} mo</dd>
      <dt>Delivery mode</dt>
      <dd className="text-right text-qc-ink">{assumptions.deliveryMode}</dd>
      <dt>Platform fee</dt>
      <dd className="text-right text-qc-ink">{assumptions.platformFeeRate}</dd>
      <dt>POS commission</dt>
      <dd className="text-right text-qc-ink">{assumptions.posCommissionRate}</dd>
    </dl>
  )
}
