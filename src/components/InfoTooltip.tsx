import { useEffect, useRef, useState } from 'react'

/**
 * A small ⓘ affordance next to a field label: tap/click reveals one short
 * explanation, tap/click elsewhere or Escape closes it.
 *
 * Deliberately not hover-only — touch has no hover, and the app's mobile
 * treatment is locked as first-class (DESIGN_DIRECTION §1.1) — and deliberately
 * not always-visible text, which would work against the "quiet instrument,
 * readable in a few seconds" rule once several fields carry one. Domain-neutral:
 * lives in `components/`, not a feature folder, so any form may reuse it.
 */
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span ref={rootRef} className="relative ml-1 inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Info"
        onClick={(event) => {
          // NumberField/TextField wrap this in a <label>; without stopping the
          // event here, a click on this button also activates the label's
          // associated input (focusing it, and toggling a checkbox/radio if it
          // ever were one) on top of toggling the popover.
          event.preventDefault()
          event.stopPropagation()
          setOpen((current) => !current)
        }}
        className="qc-info-btn"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="5" r="0.75" fill="currentColor" stroke="none" />
          <line x1="8" y1="7.3" x2="8" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <span role="tooltip" className="qc-info-popover">
          {text}
        </span>
      ) : null}
    </span>
  )
}
