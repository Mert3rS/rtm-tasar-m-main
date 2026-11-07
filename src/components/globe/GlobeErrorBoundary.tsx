'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

type GlobeErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
}

type GlobeErrorBoundaryState = {
  hasError: boolean
}

export class GlobeErrorBoundary extends Component<
  GlobeErrorBoundaryProps,
  GlobeErrorBoundaryState
> {
  state: GlobeErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): GlobeErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3B küre başlatılamadı.', error, info)
  }

  render() {
    if (this.state.hasError) return this.props.fallback

    return this.props.children
  }
}
