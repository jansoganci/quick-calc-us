import { useEffect, useRef } from 'react'
import { TextField } from '../../../components/TextField.tsx'
import { REPORT_COPY } from '../labels.ts'

/**
 * Asks for the one thing the report needs that the calculation does not:
 * whose business it is.
 *
 * The name is report metadata — it titles the document and names the file —
 * and it never reaches `toInput.ts`, the engine or any figure. It is
 * required, so the download stays disabled until something has been typed;
 * because the control is disabled there is no invalid submission and
 * therefore no error state to design.
 *
 * A native `<dialog>` carries the focus trap, Esc, the inert background and
 * the backdrop — this repo's `.qc-dialog` CSS already gives it the surface
 * (bottom sheet on mobile, 400px panel centered from `lg`), unused since
 * Phase 0.
 */
export function ReportNameDialog({
  open,
  name,
  canGenerate,
  onNameChange,
  onCancel,
  onGenerate,
}: {
  open: boolean
  name: string
  canGenerate: boolean
  onNameChange: (name: string) => void
  onCancel: () => void
  onGenerate: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog === null) return

    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector('input')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="qc-dialog qc-screen-only"
      aria-labelledby="report-dialog-title"
      onCancel={(event) => {
        // Esc: keep React the single source of truth for whether it is open.
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onCancel()
      }}
    >
      <form
        method="dialog"
        className="w-full border-t border-qc-rule-strong bg-qc-surface px-[18px] pb-6 pt-5 lg:w-[400px] lg:rounded lg:border lg:px-[22px] lg:py-[22px]"
        onSubmit={(event) => {
          event.preventDefault()
          onGenerate()
        }}
      >
        <p id="report-dialog-title" className="m-0 text-[15px] font-semibold text-qc-ink">
          {REPORT_COPY.dialogTitle}
        </p>
        <p className="m-0 mt-2 text-xs leading-relaxed text-qc-muted">{REPORT_COPY.dialogLede}</p>

        <div className="mt-[18px]">
          <TextField
            id="report-business-name"
            label={REPORT_COPY.businessName}
            value={name}
            onChange={onNameChange}
            placeholder={REPORT_COPY.businessNamePlaceholder}
            hint={canGenerate ? null : REPORT_COPY.businessNameHint}
          />
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <button
            type="submit"
            disabled={!canGenerate}
            className={
              canGenerate
                ? 'flex h-12 w-full items-center justify-center rounded bg-qc-accent text-[15px] font-medium text-qc-on-accent hover:bg-qc-accent-hover lg:h-[46px] lg:text-sm'
                : 'flex h-12 w-full items-center justify-center rounded border border-qc-disabled-border bg-qc-disabled text-[15px] font-medium text-qc-subtle lg:h-[46px] lg:text-sm'
            }
          >
            {REPORT_COPY.submit}
          </button>
          <button type="button" onClick={onCancel} className="flex h-11 w-full items-center justify-center text-sm text-qc-secondary underline underline-offset-2">
            {REPORT_COPY.cancel}
          </button>
        </div>
      </form>
    </dialog>
  )
}
