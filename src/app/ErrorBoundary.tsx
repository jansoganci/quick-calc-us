import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = { children: ReactNode }
type ErrorBoundaryState = { hasError: boolean }

/** Root boundary: a render failure shows a recovery instruction instead of a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Quick Calculation failed to render', error, info.componentStack)
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="mx-auto max-w-[620px] px-[18px] py-16">
        <p className="text-lg text-qc-ink">The calculator failed to load.</p>
        <p className="mt-2 text-[13px] leading-relaxed text-qc-secondary">
          Refresh the page and try again. Nothing you entered is saved.
        </p>
      </div>
    )
  }
}
