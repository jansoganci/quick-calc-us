import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DeliveryMode } from '../../../core/detailed-us/index.ts'
import type { UsState } from '../../../data/us/salesTaxRates.ts'
import { stateTaxRatePercent } from '../../quick-calc/viewModel.ts'
import {
  emptyLine,
  emptyPosition,
  emptyProduct,
  initialForm,
  sampleCafeForm,
  type DetailedFormState,
  type LineRow,
  type PositionRow,
  type ProductRow,
} from '../formState.ts'
import type { SectionId } from '../labels.ts'
import type { DetailedView } from '../viewModel.ts'
import { evaluateDetailed } from '../viewModel.ts'
import { createDraftSaveQueue, registerDraftLifecycleFlush } from './draftAutosave.ts'
import { clearDraft, loadInitialDraft, writeDraft } from './draftStorage.ts'

/**
 * Form state and the V6 gate: the first calculation happens only on
 * Calculate, and every valid change after it updates the result live — same
 * pattern as `useQuickCalc`, extended with row mutators for the array
 * sections and the autosave/report-name state Phase 5 adds.
 */
export function useDetailedCalc() {
  const [initialDraft] = useState(loadInitialDraft)
  const [form, setForm] = useState<DetailedFormState>(initialDraft.form)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [view, setView] = useState<DetailedView | null>(null)
  const [liveFlash, setLiveFlash] = useState(false)
  const [copied, setCopied] = useState(false)
  const [openSection, setOpenSection] = useState<SectionId | null>('jurisdiction')
  const [draftSaved, setDraftSaved] = useState(initialDraft.hasStoredDraft)
  /**
   * Report metadata, not a financial input: it titles the report and names
   * the saved file, and it is deliberately NOT part of `DetailedFormState`,
   * so it cannot reach `toInput.ts`, validation or the engine even by
   * accident. The ref mirrors it for the autosave writer, which runs outside
   * React's render.
   */
  const [businessName, setBusinessNameState] = useState(initialDraft.businessName)
  const businessNameRef = useRef(initialDraft.businessName)
  const resultsRef = useRef<HTMLDivElement>(null)
  const previousViewKeyRef = useRef<string | null>(null)
  const draftSaveQueueRef = useRef<ReturnType<typeof createDraftSaveQueue> | null>(null)
  if (draftSaveQueueRef.current === null) {
    draftSaveQueueRef.current = createDraftSaveQueue(
      initialDraft.form,
      (form) => writeDraft({ form, businessName: businessNameRef.current }),
      () => setDraftSaved(true),
    )
  }
  const draftSaveQueue = draftSaveQueueRef.current
  draftSaveQueue.updateLatest(form)

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

  /**
   * Autosave, debounced so a burst of typing writes once. Watches `form`
   * rather than hooking into `update()`, so any mutator added later is
   * covered without being remembered.
   */
  useEffect(() => {
    draftSaveQueue.schedule()
  }, [draftSaveQueue, form])

  useEffect(() => {
    const unregister = registerDraftLifecycleFlush(draftSaveQueue)
    return () => {
      unregister()
      draftSaveQueue.dispose()
    }
  }, [draftSaveQueue])

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

  /**
   * Back to a blank form with no stored draft. Autosave means a reload no
   * longer clears the page, so this is the only way to start a second
   * business. The result clears with the inputs — a calculated result left
   * beside an empty form would break V6.
   */
  function resetForm() {
    const fresh = initialForm()
    draftSaveQueue.reset(fresh)
    clearDraft()
    businessNameRef.current = ''
    setBusinessNameState('')
    setForm(fresh)
    setTouched({})
    setSubmitted(false)
    setHasCalculated(false)
    setView(null)
    setDraftSaved(false)
    setOpenSection('jurisdiction')
    previousViewKeyRef.current = null
  }

  /**
   * Replaces the form with a realistic filled example. Same reset of
   * touched/submitted/view as `resetForm` — new inputs need a fresh
   * Calculate (V6) — but not a `clearDraft()`: the sample becomes the new
   * draft through the same debounced autosave every other edit goes
   * through.
   */
  function loadSample() {
    setForm(sampleCafeForm())
    setTouched({})
    setSubmitted(false)
    setHasCalculated(false)
    setView(null)
    setOpenSection('jurisdiction')
    previousViewKeyRef.current = null
  }

  /** Committed when a report is generated, not on every keystroke in the dialog. */
  function setBusinessName(next: string) {
    businessNameRef.current = next
    setBusinessNameState(next)
    if (writeDraft({ form, businessName: next })) setDraftSaved(true)
  }

  const api = {
    form,
    evaluation,
    view,
    businessName,
    setBusinessName,
    hasCalculated,
    canSubmit,
    liveFlash,
    copied,
    openSection,
    draftSaved,
    resultsRef,
    errorFor,
    errorSections,
    markTouched,
    resetForm,
    loadSample,

    setOpenSection: (section: SectionId | null) => setOpenSection(section),
    toggleSection: (section: SectionId) => setOpenSection((current) => (current === section ? null : section)),

    setUsState: (value: UsState) => update((draft) => ({ ...draft, usState: value, salesTaxRate: stateTaxRatePercent(value) })),
    setSalesTaxRate: (value: string) => update((draft) => ({ ...draft, salesTaxRate: value })),

    setProductField: (index: number, field: keyof Omit<ProductRow, 'id'>, value: string) =>
      update((draft) => ({
        ...draft,
        products: draft.products.map((row, at) => (at === index ? { ...row, [field]: value } : row)),
      })),
    addProduct: () => update((draft) => ({ ...draft, products: [...draft.products, emptyProduct()] })),
    removeProduct: (index: number) => update((draft) => ({ ...draft, products: draft.products.filter((_, at) => at !== index) })),

    setPositionField: (index: number, field: keyof Omit<PositionRow, 'id'>, value: string) =>
      update((draft) => ({
        ...draft,
        positions: draft.positions.map((row, at) => (at === index ? { ...row, [field]: value } : row)),
      })),
    addPosition: () => update((draft) => ({ ...draft, positions: [...draft.positions, emptyPosition()] })),
    removePosition: (index: number) => update((draft) => ({ ...draft, positions: draft.positions.filter((_, at) => at !== index) })),

    setLineField: (collection: 'opexLines' | 'capexItems', index: number, field: keyof Omit<LineRow, 'id'>, value: string) =>
      update((draft) => ({
        ...draft,
        [collection]: draft[collection].map((row, at) => (at === index ? { ...row, [field]: value } : row)),
      })),
    addLine: (collection: 'opexLines' | 'capexItems') =>
      update((draft) => ({ ...draft, [collection]: [...draft[collection], emptyLine(collection === 'opexLines' ? 'opex' : 'capex')] })),
    removeLine: (collection: 'opexLines' | 'capexItems', index: number) =>
      update((draft) => ({ ...draft, [collection]: draft[collection].filter((_, at) => at !== index) })),

    setChannelShare: (channel: keyof DetailedFormState['channelMix'], value: string) =>
      update((draft) => ({ ...draft, channelMix: { ...draft.channelMix, [channel]: value } })),
    setPackaging: (field: keyof DetailedFormState['packaging'], value: string) =>
      update((draft) => ({ ...draft, packaging: { ...draft.packaging, [field]: value } })),
    setPaymentShare: (method: keyof DetailedFormState['paymentMix'], value: string) =>
      update((draft) => ({ ...draft, paymentMix: { ...draft.paymentMix, [method]: value } })),
    setPosCommissionRate: (value: string) => update((draft) => ({ ...draft, posCommissionRate: value })),

    setDeliveryMode: (mode: DeliveryMode) => update((draft) => ({ ...draft, delivery: { ...draft.delivery, mode } })),
    setDeliveryField: (field: 'platformFeeRate' | 'ownCourierCostPerDeliveryOrder', value: string) =>
      update((draft) => ({ ...draft, delivery: { ...draft.delivery, [field]: value } })),

    setOwnerField: (field: keyof DetailedFormState['owner'], value: string) => update((draft) => ({ ...draft, owner: { ...draft.owner, [field]: value } })),
    setOccupancyField: (field: keyof DetailedFormState['occupancy'], value: string) =>
      update((draft) => ({ ...draft, occupancy: { ...draft.occupancy, [field]: value } })),

    setAssumption: (field: 'salesPriceAnnualIncrease' | 'productCogsAnnualIncrease' | 'fixedCostAnnualIncrease', value: string) =>
      update((draft) => ({ ...draft, assumptions: { ...draft.assumptions, [field]: value } })),
    setHorizon: (months: DetailedFormState['assumptions']['projectionHorizonMonths']) =>
      update((draft) => ({ ...draft, assumptions: { ...draft.assumptions, projectionHorizonMonths: months } })),
    setRampUp: (preset: DetailedFormState['assumptions']['rampUpPreset']) =>
      update((draft) => ({ ...draft, assumptions: { ...draft.assumptions, rampUpPreset: preset } })),
    setScenarioDelta: (scenario: 'bad' | 'base' | 'good', value: string) =>
      update((draft) => ({
        ...draft,
        assumptions: { ...draft.assumptions, scenarioVolumeDeltas: { ...draft.assumptions.scenarioVolumeDeltas, [scenario]: value } },
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
