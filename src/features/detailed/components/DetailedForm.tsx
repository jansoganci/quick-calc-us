import { NumberField } from '../../../components/NumberField.tsx'
import { DELIVERY_MODES, PROJECTION_HORIZONS, RAMP_UP_PRESETS } from '../../../core/detailed-us/index.ts'
import type { UsState } from '../../../data/us/salesTaxRates.ts'
import { cn } from '../../../lib/cn.ts'
import { mixTotalPercent } from '../errors.ts'
import { STATE_OPTIONS } from '../../quick-calc/viewModel.ts'
import type { DetailedCalcApi } from '../hooks/useDetailedCalc.ts'
import { COPY, DELIVERY_MODE_LABELS, RAMP_UP_LABELS, SECTION_IDS, SECTION_LABELS } from '../labels.ts'
import { mixTotalDisplay } from '../sectionSummary.ts'
import { DraftNotice } from './DraftNotice.tsx'
import { LineRows } from './LineRows.tsx'
import { MixTable, type MixRow } from './MixTable.tsx'
import { PositionRows } from './PositionRows.tsx'
import { ProductRows } from './ProductRows.tsx'
import { SampleFillControl } from './SampleFillControl.tsx'
import { SectionFrame } from './SectionFrame.tsx'

export function DetailedForm({ calc }: { calc: DetailedCalcApi }) {
  const { form } = calc
  const hasDeliveryVolume = mixTotalPercent([form.channelMix.delivery]) !== 0

  return (
    <form
      className="mx-auto w-full max-w-[600px] bg-qc-surface px-[18px] py-5 lg:max-w-none lg:px-[30px] lg:py-[30px] lg:pb-[34px]"
      onSubmit={(event) => {
        event.preventDefault()
        calc.calculate()
      }}
    >
      {SECTION_IDS.map((section, index) => (
        <SectionFrame
          key={section}
          section={section}
          index={index + 1}
          hasError={calc.errorSections.includes(section)}
          isOpen={calc.openSection === section}
          onToggle={() => calc.toggleSection(section)}
        >
          {section === 'jurisdiction' && <JurisdictionSection calc={calc} />}
          {section === 'products' && (
            <>
              <SampleFillControl draftSaved={calc.draftSaved} onLoadSample={calc.loadSample} />
              <ProductRows
                products={form.products}
                errorFor={calc.errorFor}
                onFieldChange={calc.setProductField}
                onBlur={calc.markTouched}
                onAdd={calc.addProduct}
                onRemove={calc.removeProduct}
              />
            </>
          )}
          {section === 'channels' && <ChannelsSection calc={calc} />}
          {section === 'payments' && <PaymentsSection calc={calc} />}
          {section === 'delivery' && <DeliverySection calc={calc} hasDeliveryVolume={hasDeliveryVolume} />}
          {section === 'positions' && (
            <PositionRows
              positions={form.positions}
              errorFor={calc.errorFor}
              onFieldChange={calc.setPositionField}
              onBlur={calc.markTouched}
              onAdd={calc.addPosition}
              onRemove={calc.removePosition}
            />
          )}
          {section === 'owner' && <OwnerSection calc={calc} />}
          {section === 'occupancy' && <OccupancySection calc={calc} />}
          {section === 'opex' && (
            <LineRows
              collection="opexLines"
              lines={form.opexLines}
              amountUnit="$/mo"
              amountLabel="Monthly amount"
              addLabel={COPY.addOpexLine}
              errorFor={calc.errorFor}
              onFieldChange={calc.setLineField}
              onBlur={calc.markTouched}
              onAdd={calc.addLine}
              onRemove={calc.removeLine}
            />
          )}
          {section === 'capex' && (
            <LineRows
              collection="capexItems"
              lines={form.capexItems}
              amountUnit="$"
              amountLabel="Amount"
              addLabel={COPY.addCapexItem}
              errorFor={calc.errorFor}
              onFieldChange={calc.setLineField}
              onBlur={calc.markTouched}
              onAdd={calc.addLine}
              onRemove={calc.removeLine}
            />
          )}
          {section === 'assumptions' && <AssumptionsSection calc={calc} />}
        </SectionFrame>
      ))}

      <button
        type="submit"
        disabled={!calc.canSubmit}
        className={cn(
          'mt-6 h-[46px] w-full rounded border text-[15px] font-medium',
          calc.canSubmit
            ? 'border-qc-accent bg-qc-accent text-qc-on-accent hover:border-qc-accent-hover hover:bg-qc-accent-hover'
            : 'cursor-not-allowed border-qc-disabled-border bg-qc-disabled text-qc-subtle',
        )}
      >
        {COPY.calculate}
      </button>
      {!calc.canSubmit ? (
        <p className="mt-2.5 text-center text-xs text-qc-muted">
          {calc.errorSections.length > 0
            ? COPY.calculateInvalid(calc.errorSections.length, calc.errorSections.map((section) => SECTION_LABELS[section]).join(', '))
            : COPY.calculateNoProducts}
        </p>
      ) : calc.hasCalculated ? (
        <p className="mt-2.5 text-center text-xs text-qc-muted">{COPY.calculateLive}</p>
      ) : null}

      <DraftNotice saved={calc.draftSaved} onReset={calc.resetForm} />
    </form>
  )
}

function JurisdictionSection({ calc }: { calc: DetailedCalcApi }) {
  const { form } = calc
  return (
    <div className="grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
      <label className="qc-field col-span-full" htmlFor="detailed-usState">
        <span>State</span>
        <span className={cn('qc-input-wrap', calc.errorFor('usState') && 'is-error')}>
          <select
            id="detailed-usState"
            className="qc-input is-text"
            value={form.usState}
            onChange={(event) => {
              calc.setUsState(event.target.value as UsState)
              calc.markTouched('usState')
            }}
          >
            <option value="" disabled>
              Select a state
            </option>
            {STATE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </span>
        {calc.errorFor('usState') ? (
          <span className="qc-error" role="alert">
            {calc.errorFor('usState')}
          </span>
        ) : (
          <span className="qc-hint">{COPY.stateHint}</span>
        )}
      </label>
      <NumberField
        id="detailed-salesTaxRate"
        label="Sales tax rate"
        value={form.salesTaxRate}
        onChange={calc.setSalesTaxRate}
        onBlur={() => calc.markTouched('salesTaxRate')}
        unit="%"
        error={calc.errorFor('salesTaxRate')}
        span="full"
        grouped
      />
    </div>
  )
}

function ChannelsSection({ calc }: { calc: DetailedCalcApi }) {
  const { form } = calc
  const rows: MixRow[] = [
    { key: 'dineIn', label: 'Dine-in', sharePath: 'channelMix.dineIn', shareValue: form.channelMix.dineIn, onShareChange: (v) => calc.setChannelShare('dineIn', v), extra: null },
    {
      key: 'takeaway',
      label: 'Takeout',
      sharePath: 'channelMix.takeaway',
      shareValue: form.channelMix.takeaway,
      onShareChange: (v) => calc.setChannelShare('takeaway', v),
      extra: {
        path: 'packaging.takeawayPerOrder',
        value: form.packaging.takeawayPerOrder,
        unit: '$/order',
        label: 'Packaging / order',
        onChange: (v) => calc.setPackaging('takeawayPerOrder', v),
      },
    },
    {
      key: 'delivery',
      label: 'Delivery',
      sharePath: 'channelMix.delivery',
      shareValue: form.channelMix.delivery,
      onShareChange: (v) => calc.setChannelShare('delivery', v),
      extra: {
        path: 'packaging.deliveryPerOrder',
        value: form.packaging.deliveryPerOrder,
        unit: '$/order',
        label: 'Packaging / order',
        onChange: (v) => calc.setPackaging('deliveryPerOrder', v),
      },
    },
  ]
  return (
    <MixTable
      firstColumnLabel="Channel"
      extraColumnLabel="Packaging / order"
      rows={rows}
      total={mixTotalDisplay([form.channelMix.dineIn, form.channelMix.takeaway, form.channelMix.delivery])}
      totalError={calc.errorFor('channelMix')}
      errorFor={calc.errorFor}
      onBlur={calc.markTouched}
    />
  )
}

function PaymentsSection({ calc }: { calc: DetailedCalcApi }) {
  const { form } = calc
  const rows: MixRow[] = [
    { key: 'cash', label: 'Cash', sharePath: 'paymentMix.cash', shareValue: form.paymentMix.cash, onShareChange: (v) => calc.setPaymentShare('cash', v), extra: null },
    {
      key: 'card',
      label: 'Card',
      sharePath: 'paymentMix.card',
      shareValue: form.paymentMix.card,
      onShareChange: (v) => calc.setPaymentShare('card', v),
      extra: {
        path: 'posCommissionRate',
        value: form.posCommissionRate,
        unit: '%',
        label: 'POS commission',
        onChange: calc.setPosCommissionRate,
      },
    },
  ]
  return (
    <MixTable
      firstColumnLabel="Payment method"
      extraColumnLabel="POS commission"
      rows={rows}
      total={mixTotalDisplay([form.paymentMix.cash, form.paymentMix.card])}
      totalError={calc.errorFor('paymentMix')}
      errorFor={calc.errorFor}
      onBlur={calc.markTouched}
    />
  )
}

function DeliverySection({ calc, hasDeliveryVolume }: { calc: DetailedCalcApi; hasDeliveryVolume: boolean }) {
  const { form } = calc
  return (
    <div className="space-y-[15px]">
      {!hasDeliveryVolume ? <p className="qc-hint">No delivery share in the channel mix — these fields are unused.</p> : null}
      <div className="flex flex-wrap gap-2.5">
        {DELIVERY_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => calc.setDeliveryMode(mode)}
            className={cn(
              'min-h-[44px] rounded border px-3.5 text-sm',
              form.delivery.mode === mode ? 'border-qc-accent bg-qc-accent text-qc-on-accent' : 'border-qc-rule text-qc-ink',
            )}
          >
            {DELIVERY_MODE_LABELS[mode]}
          </button>
        ))}
      </div>
      {calc.errorFor('delivery.mode') ? (
        <p className="qc-error" role="alert">
          {calc.errorFor('delivery.mode')}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
        <NumberField
          id="delivery.platformFeeRate"
          label="Platform fee"
          value={form.delivery.platformFeeRate}
          onChange={(v) => calc.setDeliveryField('platformFeeRate', v)}
          onBlur={() => calc.markTouched('delivery.platformFeeRate')}
          unit="%"
          error={calc.errorFor('delivery.platformFeeRate')}
          grouped
        />
        {form.delivery.mode === 'platformOnly' ? (
          <NumberField
            id="delivery.ownCourierCostPerDeliveryOrder"
            label="Own courier cost / order"
            value={form.delivery.ownCourierCostPerDeliveryOrder}
            onChange={(v) => calc.setDeliveryField('ownCourierCostPerDeliveryOrder', v)}
            onBlur={() => calc.markTouched('delivery.ownCourierCostPerDeliveryOrder')}
            unit="$/order"
            error={calc.errorFor('delivery.ownCourierCostPerDeliveryOrder')}
            grouped
          />
        ) : null}
      </div>
    </div>
  )
}

function OwnerSection({ calc }: { calc: DetailedCalcApi }) {
  const { form } = calc
  return (
    <div className="grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
      <NumberField
        id="owner.monthlyDraw"
        label="Owner monthly draw"
        value={form.owner.monthlyDraw}
        onChange={(v) => calc.setOwnerField('monthlyDraw', v)}
        onBlur={() => calc.markTouched('owner.monthlyDraw')}
        unit="$"
        error={calc.errorFor('owner.monthlyDraw')}
        grouped
      />
      <NumberField
        id="owner.benefitsAllowance"
        label="Owner benefits allowance"
        value={form.owner.benefitsAllowance}
        onChange={(v) => calc.setOwnerField('benefitsAllowance', v)}
        onBlur={() => calc.markTouched('owner.benefitsAllowance')}
        unit="$"
        error={calc.errorFor('owner.benefitsAllowance')}
        grouped
      />
      <p className="qc-hint col-span-full">{COPY.guardrailOwnerNotEmployee}</p>
    </div>
  )
}

function OccupancySection({ calc }: { calc: DetailedCalcApi }) {
  const { form } = calc
  return (
    <div className="grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
      <NumberField
        id="occupancy.monthlyRent"
        label="Monthly rent"
        value={form.occupancy.monthlyRent}
        onChange={(v) => calc.setOccupancyField('monthlyRent', v)}
        onBlur={() => calc.markTouched('occupancy.monthlyRent')}
        unit="$"
        error={calc.errorFor('occupancy.monthlyRent')}
        grouped
      />
      <NumberField
        id="occupancy.monthlyCAM"
        label="Monthly CAM"
        value={form.occupancy.monthlyCAM}
        onChange={(v) => calc.setOccupancyField('monthlyCAM', v)}
        onBlur={() => calc.markTouched('occupancy.monthlyCAM')}
        unit="$"
        error={calc.errorFor('occupancy.monthlyCAM')}
        grouped
      />
    </div>
  )
}

function AssumptionsSection({ calc }: { calc: DetailedCalcApi }) {
  const { form } = calc
  return (
    <div className="space-y-[18px]">
      <div>
        <span className="mb-2 block text-[13px] text-qc-secondary">Projection horizon</span>
        <div className="flex gap-2.5">
          {PROJECTION_HORIZONS.map((months) => (
            <button
              key={months}
              type="button"
              onClick={() => calc.setHorizon(months)}
              className={cn(
                'min-h-[44px] rounded border px-3.5 text-sm',
                form.assumptions.projectionHorizonMonths === months ? 'border-qc-accent bg-qc-accent text-qc-on-accent' : 'border-qc-rule text-qc-ink',
              )}
            >
              {months} mo
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="mb-2 block text-[13px] text-qc-secondary">Ramp-up</span>
        <div className="flex gap-2.5">
          {RAMP_UP_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => calc.setRampUp(preset)}
              className={cn(
                'min-h-[44px] rounded border px-3.5 text-sm',
                form.assumptions.rampUpPreset === preset ? 'border-qc-accent bg-qc-accent text-qc-on-accent' : 'border-qc-rule text-qc-ink',
              )}
            >
              {RAMP_UP_LABELS[preset]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-x-[13px] gap-y-[15px]">
        <NumberField
          id="assumptions.scenarioVolumeDeltas.bad"
          label="Bad scenario"
          value={form.assumptions.scenarioVolumeDeltas.bad}
          onChange={(v) => calc.setScenarioDelta('bad', v)}
          onBlur={() => calc.markTouched('assumptions.scenarioVolumeDeltas.bad')}
          unit="%"
          error={calc.errorFor('assumptions.scenarioVolumeDeltas.bad')}
          grouped
        />
        <NumberField
          id="assumptions.scenarioVolumeDeltas.base"
          label="Base scenario"
          value={form.assumptions.scenarioVolumeDeltas.base}
          onChange={(v) => calc.setScenarioDelta('base', v)}
          onBlur={() => calc.markTouched('assumptions.scenarioVolumeDeltas.base')}
          unit="%"
          error={calc.errorFor('assumptions.scenarioVolumeDeltas.base')}
          grouped
        />
        <NumberField
          id="assumptions.scenarioVolumeDeltas.good"
          label="Good scenario"
          value={form.assumptions.scenarioVolumeDeltas.good}
          onChange={(v) => calc.setScenarioDelta('good', v)}
          onBlur={() => calc.markTouched('assumptions.scenarioVolumeDeltas.good')}
          unit="%"
          error={calc.errorFor('assumptions.scenarioVolumeDeltas.good')}
          grouped
        />
      </div>
      <div className="grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
        <NumberField
          id="assumptions.salesPriceAnnualIncrease"
          label="Sales price annual increase"
          value={form.assumptions.salesPriceAnnualIncrease}
          onChange={(v) => calc.setAssumption('salesPriceAnnualIncrease', v)}
          onBlur={() => calc.markTouched('assumptions.salesPriceAnnualIncrease')}
          unit="%"
          error={calc.errorFor('assumptions.salesPriceAnnualIncrease')}
          grouped
        />
        <NumberField
          id="assumptions.productCogsAnnualIncrease"
          label="Product cost annual increase"
          value={form.assumptions.productCogsAnnualIncrease}
          onChange={(v) => calc.setAssumption('productCogsAnnualIncrease', v)}
          onBlur={() => calc.markTouched('assumptions.productCogsAnnualIncrease')}
          unit="%"
          error={calc.errorFor('assumptions.productCogsAnnualIncrease')}
          grouped
        />
        <NumberField
          id="assumptions.fixedCostAnnualIncrease"
          label="Fixed cost annual increase"
          value={form.assumptions.fixedCostAnnualIncrease}
          onChange={(v) => calc.setAssumption('fixedCostAnnualIncrease', v)}
          onBlur={() => calc.markTouched('assumptions.fixedCostAnnualIncrease')}
          unit="%"
          error={calc.errorFor('assumptions.fixedCostAnnualIncrease')}
          span="full"
          grouped
        />
      </div>
    </div>
  )
}
