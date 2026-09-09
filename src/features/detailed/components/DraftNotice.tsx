import { useState } from 'react'
import { COPY } from '../labels.ts'

/**
 * The quiet acknowledgement that the draft is on this device, plus the only
 * route back to a blank form.
 *
 * Autosave takes away the reload-to-clear escape hatch, so starting a second
 * business needs a deliberate control. It sits at the foot of the inputs,
 * where the work ends, rather than at the top where it would invite a stray
 * click. The confirmation is inline, no browser `confirm()` dialog.
 *
 * Nothing renders until a draft has actually been written, so a first-time
 * visitor is never told about storage they do not yet have.
 */
export function DraftNotice({ saved, onReset }: { saved: boolean; onReset: () => void }) {
  const [confirming, setConfirming] = useState(false)

  if (!saved) return null

  return (
    <div className="mt-7 border-t border-qc-rule pt-4 lg:mt-9">
      <p className="text-[13px] text-qc-muted">
        {confirming ? (
          <>
            {COPY.draftResetConfirm}{' '}
            <button
              type="button"
              className="qc-text-btn"
              onClick={() => {
                setConfirming(false)
                onReset()
              }}
            >
              {COPY.draftResetYes}
            </button>
            {' · '}
            <button type="button" className="qc-text-btn" onClick={() => setConfirming(false)}>
              {COPY.draftResetCancel}
            </button>
          </>
        ) : (
          <>
            {COPY.draftSaved}
            {' · '}
            <button type="button" className="qc-text-btn" onClick={() => setConfirming(true)}>
              {COPY.draftReset}
            </button>
          </>
        )}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-qc-muted">{COPY.draftScope}</p>
    </div>
  )
}
