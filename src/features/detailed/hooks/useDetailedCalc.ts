import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DeliveryMode } from '../../../core/detailed-us/index.ts'
import type { UsState } from '../../../data/us/salesTaxRates.ts'
import { stateTaxRatePercent } from '../../quick-calc/viewModel.ts'
import {
  emptyLine,
  emptyPosition,
  emptyProduct,
  initialForm,
  type DetailedFormState,
  type LineRow,
  type PositionRow,
  type ProductRow,
} from '../formState.ts'
import type { SectionId } from '../labels.ts'
import type { DetailedView } from '../resultView.ts'
import { evaluateDetailed } from '../viewModel.ts'

/**
 * Form state and the V6 gate: the first calculation happens only on
 * Calculate, and every valid change after it updates the result live — same
 * pattern as `useQuickCalc`, extended with row mutators for the array
 * sections.
 *
 * No draft autosave, no sample loader, no report metadata: deferred out of
 * Phase 4 scope (see the Detailed UI plan) along with PDF export and charts.
 */
export function useDetailedCalc() {
  const [form, setForm] = useState<DetailedFormState>(initialForm)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [view, setView] = useState<DetailedView | null>(null)
  const [liveFlash, setLiveFlash] = useState(false)
  const [copied, setCopied] = useState(false)
  const [openSection, setOpenSection] = useState<SectionId | null>('jurisdiction')
  const resultsRef = useRef<HTMLDivElement>(null)
  const previousViewKeyRef = useRef<string | null>(null)

  const evaluation = useMemo(() => evaluateDetailed(form), [form])
  const canSubmit = evaluation.ok

  useEffect(() => {
    if (!hasCalculated || !evaluation.ok) return
    const key = JSON.stringify(evaluation.view)
    if (previousViewKeyRef.current === key) return
    const isFirstResult = previousViewKeyRef.current === null
    previousViewKeyRef.current = key
    setView(evaluation.view)
    if (isFirstResult) return
    setLiveFlash(true)
    const timer = window.setTimeout(() => setLiveFlash(false), 180)
    return () => window.clearTimeout(timer)
  }, [hasCalculated, evaluation])

  const markTouched = useCallback((path: string) => {
    setTouched((current) => ({ ...current, [path]: true }))
  }, [])

  const errorFor = useCallback(
    (path: string): string | null => {
      if (evaluation.ok) return null
      if (!submitted && !touched[path]) return null
      return evaluation.errors[path] ?? null
    },
    [evaluation, submitted, touched],
  )

  const errorSections = evaluation.ok ? [] : evaluation.errorSections

  function update(mutate: (draft: DetailedFormState) => DetailedFormState) {
    setForm((current) => mutate(current))
  }

  function resetForm() {
    setForm(initialForm())
    setTouched({})
    setSubmitted(false)
    setHasCalculated(false)
    setView(null)
    setOpenSection('jurisdiction')
    previousViewKeyRef.current = null
  }

  const api = {
    form,
    evaluation,
    view,
    hasCalculated,
    canSubmit,
    liveFlash,
    copied,
    openSection,
    resultsRef,
    errorFor,
    errorSections,
    markTouched,
    resetForm,

    setOpenSection: (section: SectionId | null) => setOpenSection(section),
    toggleSection: (section: SectionId) =>
      setOpenSection((current) => (current === section ? null : section)),

    setUsState: (value: UsState) =>
      update((draft) => ({ ...draft, usState: value, salesTaxRate: stateTaxRatePercent(value) })),
    setSalesTaxRate: (value: string) => update((draft) => ({ ...draft, salesTaxRate: value })),

    setProductField: (index: number, field: keyof Omit<ProductRow, 'id'>, value: string) =>
      update((draft) => ({
        ...draft,
        products: draft.products.map((row, at) => (at === index ? { ...row, [field]: value } : row)),
      })),
    addProduct: () => update((draft) => ({ ...draft, products: [...draft.products, emptyProduct()] })),
    removeProduct: (index: number) =>
      update((draft) => ({ ...draft, products: draft.products.filter((_, at) => at !== index) })),

    setPositionField: (index: number, field: keyof Omit<PositionRow, 'id'>, value: string) =>
      update((draft) => ({
        ...draft,
        positions: draft.positions.map((row, at) => (at === index ? { ...row, [field]: value } : row)),
      })),
    addPosition: () => update((draft) => ({ ...draft, positions: [...draft.positions, emptyPosition()] })),
    removePosition: (index: number) =>
      update((draft) => ({ ...draft, positions: draft.positions.filter((_, at) => at !== index) })),

    setLineField: (
      collection: 'opexLines' | 'capexItems',
      index: number,
      field: keyof Omit<LineRow, 'id'>,
      value: string,
    ) =>
      update((draft) => ({
        ...draft,
        [collection]: draft[collection].map((row, at) => (at === index ? { ...row, [field]: value } : row)),
      })),
    addLine: (collection: 'opexLines' | 'capexItems') =>
      update((draft) => ({
        ...draft,
        [collection]: [...draft[collection], emptyLine(collection === 'opexLines' ? 'opex' : 'capex')],
      })),
    removeLine: (collection: 'opexLines' | 'capexItems', index: number) =>
      update((draft) => ({ ...draft, [collection]: draft[collection].filter((_, at) => at !== index) })),

    setChannelShare: (channel: keyof DetailedFormState['channelMix'], value: string) =>
      update((draft) => ({ ...draft, channelMix: { ...draft.channelMix, [channel]: value } })),
    setPackaging: (field: keyof DetailedFormState['packaging'], value: string) =>
      update((draft) => ({ ...draft, packaging: { ...draft.packaging, [field]: value } })),
    setPaymentShare: (method: keyof DetailedFormState['paymentMix'], value: string) =>
      update((draft) => ({ ...draft, paymentMix: { ...draft.paymentMix, [method]: value } })),
    setPosCommissionRate: (value: string) => update((draft) => ({ ...draft, posCommissionRate: value })),

    setDeliveryMode: (mode: DeliveryMode) =>
      update((draft) => ({ ...draft, delivery: { ...draft.delivery, mode } })),
    setDeliveryField: (field: 'platformFeeRate' | 'ownCourierCostPerDeliveryOrder', value: string) =>
      update((draft) => ({ ...draft, delivery: { ...draft.delivery, [field]: value } })),

    setOwnerField: (field: keyof DetailedFormState['owner'], value: string) =>
      update((draft) => ({ ...draft, owner: { ...draft.owner, [field]: value } })),
    setOccupancyField: (field: keyof DetailedFormState['occupancy'], value: string) =>
      update((draft) => ({ ...draft, occupancy: { ...draft.occupancy, [field]: value } })),

    setAssumption: (
      field: 'salesPriceAnnualIncrease' | 'productCogsAnnualIncrease' | 'fixedCostAnnualIncrease',
      value: string,
    ) => update((draft) => ({ ...draft, assumptions: { ...draft.assumptions, [field]: value } })),
    setHorizon: (months: DetailedFormState['assumptions']['projectionHorizonMonths']) =>
      update((draft) => ({ ...draft, assumptions: { ...draft.assumptions, projectionHorizonMonths: months } })),
    setRampUp: (preset: DetailedFormState['assumptions']['rampUpPreset']) =>
      update((draft) => ({ ...draft, assumptions: { ...draft.assumptions, rampUpPreset: preset } })),
    setScenarioDelta: (scenario: 'bad' | 'base' | 'good', value: string) =>
      update((draft) => ({
        ...draft,
        assumptions: {
          ...draft.assumptions,
          scenarioVolumeDeltas: { ...draft.assumptions.scenarioVolumeDeltas, [scenario]: value },
        },
      })),

    calculate: () => {
      setSubmitted(true)
      if (!evaluation.ok) return
      setHasCalculated(true)
      setView(evaluation.view)
      window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },

    copySummary: async () => {
      if (!view) return
      try {
        await navigator.clipboard.writeText(view.copyText)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      } catch {
        setCopied(false)
      }
    },
  }

  return api
}

export type DetailedCalcApi = ReturnType<typeof useDetailedCalc>
