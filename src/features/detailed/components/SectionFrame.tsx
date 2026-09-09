import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn.ts'
import { SECTION_LABELS, type SectionId } from '../labels.ts'

type SectionFrameProps = {
  section: SectionId
  index: number
  hasError: boolean
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}

/**
 * One input section. Below `lg` it is an accordion; from `lg` up the content
 * is always visible and the header toggle is inert. A section header never
 * carries a money figure before Calculate (DIRECTION V6) — this frame never
 * renders one at all, calculated or not, keeping Detailed's input side
 * uniform regardless of `hasCalculated`.
 */
export function SectionFrame({ section, index, hasError, isOpen, onToggle, children }: SectionFrameProps) {
  const headingId = `${section}-heading`

  return (
    <section
      id={`detailed-${section}`}
      aria-labelledby={headingId}
      className="border-t border-qc-rule first:border-t-0 lg:py-[26px] lg:first:pt-0"
    >
      <h2 id={headingId} className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`${section}-content`}
          className="flex min-h-[52px] w-full items-center justify-between gap-3 text-left lg:min-h-0 lg:cursor-default lg:items-baseline"
        >
          <span className="flex items-baseline gap-[10px]">
            <span className="font-mono text-[11px] tabular-nums text-qc-subtle">{String(index).padStart(2, '0')}</span>
            <span className={cn('text-[15px] font-semibold', hasError ? 'text-qc-error' : 'text-qc-ink')}>
              {SECTION_LABELS[section]}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'inline-block h-[7px] w-[7px] border-b-[1.5px] border-r-[1.5px] border-qc-muted lg:hidden',
              isOpen ? '-translate-y-1 rotate-[-135deg]' : '-translate-y-0.5 rotate-45',
            )}
          />
        </button>
      </h2>

      <div id={`${section}-content`} className={cn('pb-[22px] lg:block lg:pb-0', isOpen ? 'block' : 'hidden')}>
        {children}
      </div>
    </section>
  )
}
