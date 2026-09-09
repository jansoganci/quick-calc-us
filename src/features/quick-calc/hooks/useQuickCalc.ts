import { useEffect, useMemo, useRef, useState } from 'react'
import type { UsState } from '../../../data/us/salesTaxRates.ts'
import { COPY } from '../labels.ts'
import {
  EXAMPLE_FORM,
  allRequiredFilled,
  evaluateForm,
  stateTaxRatePercent,
  type QuickField,
  type QuickFormState,
  type QuickView,
} from '../viewModel.ts'

const ALL_FIELDS: readonly QuickField[] = [
  'averageTicket',
  'dailySalesVolume',
  'variableCostPerSale',
  'monthlyRent',
  'otherMonthlyOpex',
  'employeeCount',
  'averageEmployeeMonthlyCost',
  'initialCapex',
  'salesTaxRate',
  'operatingDaysPerMonth',
  'capexRecoveryPeriodMonths',
  'cardPaymentShare',
  'posCommissionRate',
]

type DirtyState = Record<QuickField, boolean> & { usState: boolean }

export function useQuickCalc() {
  // Seeded with the worked example rather than a blank form (see EXAMPLE_FORM).
  // `hasCalculated` still starts false: no result before Calculate.
  const [form, setForm] = useState<QuickFormState>(EXAMPLE_FORM)
  const [dirty, setDirty] = useState<DirtyState>(
    Object.fromEntries([...ALL_FIELDS, 'usState'].map((field) => [field, false])) as DirtyState,
  )
  const [hasCalculated, setHasCalculated] = useState(false)
  const [view, setView] = useState<QuickView | null>(null)
  const [liveFlash, setLiveFlash] = useState(false)
  const [copied, setCopied] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  const previousViewKeyRef = useRef<string | null>(null)

  const evaluation = useMemo(() => evaluateForm(form), [form])
  const allFilled = allRequiredFilled(form)
  const canSubmit = evaluation.ok && allFilled
  const submitHint = canSubmit ? null : allFilled ? COPY.calculateInvalid : COPY.calculateDisabled

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

  function setField(field: QuickField, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setDirty((current) => ({ ...current, [field]: true }))
  }

  /**
   * Selecting a state writes its table rate into `salesTaxRate`
   * (US_PRODUCT_SCOPE §3.2) — a fresh selection always resets an edited rate,
   * since the previous rate belonged to the previous state.
   */
  function setUsState(value: UsState) {
    setForm((current) => ({ ...current, usState: value, salesTaxRate: stateTaxRatePercent(value) }))
    setDirty((current) => ({ ...current, usState: true, salesTaxRate: true }))
  }

  function markBlurred(field: QuickField) {
    setDirty((current) => ({ ...current, [field]: true }))
  }

  function calculate() {
    if (!evaluation.ok) return
    setHasCalculated(true)
    setView(evaluation.view)
    setDirty(
      Object.fromEntries([...ALL_FIELDS, 'usState'].map((field) => [field, true])) as DirtyState,
    )
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  async function copySummary() {
    if (!view) return
    try {
      await navigator.clipboard.writeText(view.copyText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return {
    form,
    dirty,
    evaluation,
    view,
    hasCalculated,
    canSubmit,
    submitHint,
    liveFlash,
    copied,
    resultsRef,
    setField,
    setUsState,
    markBlurred,
    calculate,
    copySummary,
  }
}
