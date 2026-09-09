import { useEffect, useState } from 'react'
import { isValidBusinessName, reportDocumentTitle } from '../reportView.ts'

/**
 * The report's download flow: the business-name dialog, and the print
 * itself.
 *
 * It lives under `hooks/` for a build reason as well as a naming one —
 * `tsconfig.json` compiles the rest of the feature without the DOM lib, so
 * `window` and `document` only type-check here. The same constraint put
 * `draftStorage.ts` in this directory.
 *
 * Two details are load-bearing:
 *
 * 1. **The print happens in an effect, not in the submit handler.**
 *    `window.print()` is synchronous and React has not re-rendered when the
 *    handler returns, so calling it there prints the dialog on top of the
 *    report. Deferring to an effect is enough — React commits the DOM
 *    before effects run, and the dialog's own effect (a child's) closes it
 *    before this one (a parent's) does.
 * 2. **The filename is `document.title`.** Every browser takes its
 *    suggested "Save as PDF" name from it. The previous title is restored
 *    whether the user saves or cancels, so a dismissed dialog never leaves
 *    the tab renamed.
 */

export type ReportPrintApi = {
  /** `true` while the business-name dialog is open. */
  isOpen: boolean
  /** The name being typed, which is not committed until the report is generated. */
  name: string
  setName: (name: string) => void
  /** The gate on the download button: a name of only whitespace is not a name. */
  canGenerate: boolean
  /** `false` where the browser cannot print at all — some in-app webviews. */
  canPrint: boolean
  open: () => void
  cancel: () => void
  generate: () => void
}

export function useReportPrint(businessName: string, commitBusinessName: (name: string) => void): ReportPrintApi {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(businessName)
  const [pendingName, setPendingName] = useState<string | null>(null)

  useEffect(() => {
    if (pendingName === null) return

    const previousTitle = document.title
    let restored = false
    const restore = () => {
      if (restored) return
      restored = true
      document.title = previousTitle
    }

    window.addEventListener('afterprint', restore, { once: true })

    // No frame hop is needed to get the dialog out of the way: React commits
    // the DOM before effects, and a child's effect (the dialog closing
    // itself) runs before its parent's, so by the time this line executes
    // the dialog is gone.
    try {
      document.title = reportDocumentTitle(pendingName, new Date())
      window.print()
    } catch {
      // A browser that refuses to print leaves the calculator untouched.
    }
    setPendingName(null)

    // Chrome, Safari and Firefox all block inside `print()` until the dialog
    // is dismissed, so this cleanup — which React runs on the re-render
    // above — is the first moment the title is safe to put back.
    return () => {
      window.removeEventListener('afterprint', restore)
      restore()
    }
  }, [pendingName])

  return {
    isOpen,
    name,
    setName,
    canGenerate: isValidBusinessName(name),
    canPrint: typeof window.print === 'function',
    open: () => {
      // Prefilled from the saved name, so a returning owner confirms rather than retypes.
      setName(businessName)
      setIsOpen(true)
    },
    cancel: () => setIsOpen(false),
    generate: () => {
      const trimmed = name.trim()
      if (trimmed === '') return
      commitBusinessName(trimmed)
      setIsOpen(false)
      setPendingName(trimmed)
    },
  }
}
