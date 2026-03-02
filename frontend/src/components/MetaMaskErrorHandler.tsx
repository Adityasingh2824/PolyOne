'use client'

import { useEffect } from 'react'

export function MetaMaskErrorHandler() {
  useEffect(() => {
    // Suppress MetaMask console errors that don't affect functionality
    const originalError = console.error
    const originalWarn = console.warn

    console.error = function (...args: any[]) {
      const message = args.join(' ')
      // Filter out MetaMask connection errors that are non-critical
      if (
        message.includes('MetaMask extension not found') ||
        message.includes('Failed to connect to MetaMask') ||
        message.includes('Lost connection to "MetaMask RpcProvider"') ||
        message.includes('Disconnected from MetaMask background') ||
        message.includes('MetaMask: Lost connection') ||
        message.includes('MetaMask: Disconnected')
      ) {
        // Suppress these specific errors - they're from MetaMask extension, not our code
        return
      }
      originalError.apply(console, args)
    }

    console.warn = function (...args: any[]) {
      const message = args.join(' ')
      // Filter out MetaMask warnings
      if (
        message.includes('MetaMask') &&
        (message.includes('connection') || message.includes('disconnect'))
      ) {
        return
      }
      originalWarn.apply(console, args)
    }

    // Handle unhandled promise rejections from MetaMask
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason?.message || String(reason)
      
      if (
        message.includes('MetaMask') ||
        message.includes('wallet') ||
        message.includes('ethereum')
      ) {
        // Prevent these errors from showing in console
        event.preventDefault()
        console.log('MetaMask connection issue (non-critical):', message)
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      console.error = originalError
      console.warn = originalWarn
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
























