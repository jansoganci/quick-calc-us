import { initialForm, syncIdCounter, type DetailedFormState } from '../formState.ts'
import { decodeDraft, encodeDraft, STORAGE_KEY, type Draft } from '../storage.ts'

/**
 * The only place in Detailed Feasibility that touches `localStorage`.
 *
 * It is not a React hook, and it lives under `hooks/` for a build reason
 * rather than a naming one: `tsconfig.json` compiles the rest of
 * `features/detailed` without the DOM lib, and `tsconfig.app.json` includes
 * exactly `*.tsx` plus `features/**\/hooks/**\/*.ts`. This directory is
 * therefore the only spot in the feature where `window` type-checks. The
 * codec it wraps stays pure in `../storage.ts`.
 *
 * Every call is guarded. `localStorage` throws outright in some
 * private-browsing modes and when a quota is exhausted, and the calculator
 * has to keep working with no persistence at all — losing the draft is a
 * disappointment, a blank screen is a bug.
 */

export function readDraft(): Draft | null {
  try {
    return decodeDraft(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

/** `true` when the draft actually reached storage, which drives the saved notice. */
export function writeDraft(draft: Draft): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, encodeDraft(draft))
    return true
  } catch {
    return false
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage is unavailable, so there is no draft to clear.
  }
}

export type InitialDraft = {
  form: DetailedFormState
  /** Prefills the report dialog, so a returning owner confirms rather than retypes. */
  businessName: string
  hasStoredDraft: boolean
}

/**
 * The starting state, given whatever came back from storage: the restored
 * form when there is a usable one, the ordinary blank form otherwise.
 *
 * The id counter is advanced past the restored ids before the form is used
 * anywhere — `formState.ts` mints ids from a module counter that restarts at
 * 0 on every load, so a restored `product-2` would otherwise be minted a
 * second time and two rows would share a React key.
 *
 * Only the inputs come back. `hasCalculated` and the result stay untouched,
 * because DESIGN_DIRECTION V6 is locked — no result appears before Calculate,
 * and a returning visitor has not pressed it yet.
 *
 * Split from `loadInitialDraft` so this decision is testable without the DOM.
 */
export function resolveInitialDraft(stored: Draft | null): InitialDraft {
  if (stored === null) return { form: initialForm(), businessName: '', hasStoredDraft: false }
  syncIdCounter(stored.form)
  return { form: stored.form, businessName: stored.businessName, hasStoredDraft: true }
}

/** The `useState` initializer for the form. */
export function loadInitialDraft(): InitialDraft {
  return resolveInitialDraft(readDraft())
}
