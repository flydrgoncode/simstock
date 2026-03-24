import type { ReactNode } from 'react'
import { Component } from 'react'

type Props = {
  name: string
  children: ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export class SurfaceErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Unknown render error',
    }
  }

  componentDidCatch(error: Error) {
    console.error(`${this.props.name} crashed`, error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
          <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-700">
              {this.props.name}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              This page hit an error
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The route did not render correctly, so Birdview showed this safe fallback instead of a blank screen.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              {this.state.message}
            </pre>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
