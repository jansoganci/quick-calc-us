import { useLayoutEffect, useRef } from 'react'
import { cn } from '../lib/cn.ts'
import { caretAfterFormat, formatTypedNumber } from '../lib/number.ts'
import { InfoTooltip } from './InfoTooltip.tsx'

type NumberFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  unit: string
  error?: string | null
  hint?: string | null
  /** Short explanation revealed by a ⓘ next to the label — what the field means and what it changes. Not the short always-visible `hint`. */
  info?: string | null
  span?: 'half' | 'full'
  placeholder?: string
  grouped?: boolean
  maxFractionDigits?: number
  /**
   * Id of a hint element the caller renders itself, when the hint has to sit below
   * another control. Keeps the input described without moving the hint into here.
   */
  describedBy?: string
  disabled?: boolean
  /**
   * `true` hides the label at every width — the row already names the field.
   * `'from-lg'` keeps it on mobile and hides it from `lg` up, where a column header
   * takes over: a repeating row that collapses to a stack must still be labelled.
   */
  labelHidden?: boolean | 'from-lg'
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  onBlur,
  unit,
  error,
  hint,
  info,
  span = 'half',
  placeholder,
  grouped = false,
  maxFractionDigits = 2,
  labelHidden = false,
  describedBy,
  disabled = false,
}: NumberFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const caretRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const node = inputRef.current
    const caret = caretRef.current
    if (node === null || caret === null) return
    node.setSelectionRange(caret, caret)
    caretRef.current = null
  }, [value])

  function applyGrouped(nextRaw: string, caret: number | null) {
    const formatted = formatTypedNumber(nextRaw, { maxFractionDigits })
    if (caret !== null) {
      caretRef.current = caretAfterFormat(nextRaw, caret, formatted)
    }
    onChange(formatted)
  }

  return (
    <label
      className={cn('qc-field', span === 'full' && 'col-span-full', labelHidden === true && 'gap-0')}
      htmlFor={id}
    >
      <span
        className={cn(
          'flex items-baseline',
          labelHidden === true ? 'sr-only' : labelHidden === 'from-lg' ? 'lg:sr-only' : undefined,
        )}
      >
        {label}
        {info ? <InfoTooltip text={info} /> : null}
      </span>
      <span
        className={cn(
          'qc-input-wrap',
          error && 'is-error',
          disabled && 'border-qc-disabled-border bg-qc-disabled',
        )}
      >
        <input
          ref={inputRef}
          id={id}
          className={cn('qc-input', disabled && 'text-qc-subtle')}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value
            if (!grouped) {
              onChange(next)
              return
            }
            applyGrouped(next, event.target.selectionStart)
          }}
          onBlur={() => {
            if (grouped && value.trim() !== '') {
              applyGrouped(value, null)
            }
            onBlur?.()
          }}
          onPaste={(event) => {
            if (!grouped) return
            const pasted = event.clipboardData.getData('text')
            if (pasted === '') return
            event.preventDefault()
            const node = event.currentTarget
            const start = node.selectionStart ?? value.length
            const end = node.selectionEnd ?? value.length
            const next = `${value.slice(0, start)}${pasted}${value.slice(end)}`
            applyGrouped(next, start + pasted.length)
          }}
          placeholder={placeholder}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : describedBy ? describedBy : undefined
          }
        />
        <span className="qc-unit">{unit}</span>
      </span>
      {error ? (
        <span id={`${id}-error`} className="qc-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="qc-hint">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
