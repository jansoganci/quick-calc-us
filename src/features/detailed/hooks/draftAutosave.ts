import type { DetailedFormState } from '../formState.ts'

export const DRAFT_SAVE_DELAY_MS = 500

type DraftWriter = (form: DetailedFormState) => boolean

export type DraftSaveQueue = {
  updateLatest: (form: DetailedFormState) => void
  schedule: () => void
  flush: () => void
  reset: (form: DetailedFormState) => void
  dispose: () => void
}

/**
 * One pending form revision shared by the ordinary debounce and lifecycle
 * flushes. A revision is marked handled before writing, so
 * `visibilitychange` followed by `pagehide` cannot write the same form
 * twice.
 */
export function createDraftSaveQueue(initialForm: DetailedFormState, write: DraftWriter, onSaved: () => void): DraftSaveQueue {
  let latestForm = initialForm
  let handledForm = initialForm
  let timer: number | null = null

  function clearTimer() {
    if (timer === null) return
    window.clearTimeout(timer)
    timer = null
  }

  function flush() {
    if (latestForm === handledForm) return
    clearTimer()

    const formToWrite = latestForm
    handledForm = formToWrite
    try {
      if (write(formToWrite)) onSaved()
    } catch {
      // The browser-storage wrapper is already guarded; this keeps the
      // lifecycle path safe even if a future writer changes that contract.
    }
  }

  return {
    updateLatest(form) {
      latestForm = form
    },
    schedule() {
      if (latestForm === handledForm) return
      clearTimer()
      timer = window.setTimeout(flush, DRAFT_SAVE_DELAY_MS)
    },
    flush,
    reset(form) {
      clearTimer()
      latestForm = form
      handledForm = form
    },
    dispose() {
      clearTimer()
    },
  }
}

/** Flush pending input state on the lifecycle signals that remain reliable on mobile. */
export function registerDraftLifecycleFlush(queue: DraftSaveQueue): () => void {
  const onPageHide = () => queue.flush()
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') queue.flush()
  }

  window.addEventListener('pagehide', onPageHide)
  document.addEventListener('visibilitychange', onVisibilityChange)

  return () => {
    window.removeEventListener('pagehide', onPageHide)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}
