'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    // Reload the page to reset state
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isWalletError = this.state.error?.message?.includes('MetaMask') || 
                           this.state.error?.message?.includes('wallet') ||
                           this.state.error?.message?.includes('ethereum')

      return (
        <div className="min-h-screen bg-dark-600 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-red-500/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Something went wrong</h2>
                <p className="text-sm text-gray-400">
                  {isWalletError ? 'Wallet connection error' : 'An unexpected error occurred'}
                </p>
              </div>
            </div>
            
            {isWalletError ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-sm text-yellow-400 mb-2">
                    <strong>MetaMask not detected</strong>
                  </p>
                  <p className="text-xs text-gray-400">
                    Please install MetaMask extension or refresh the page. The app will work without a wallet connection.
                  </p>
                </div>
                <button
                  onClick={this.handleReset}
                  className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-pink rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload Page
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
                </p>
                <button
                  onClick={this.handleReset}
                  className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-pink rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload Page
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
























