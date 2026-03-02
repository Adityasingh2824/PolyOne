'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { RainbowKitProvider, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect, useMemo } from 'react'
import { WagmiProvider } from 'wagmi'

import { supportedChains, polygonAmoy } from '@/lib/chains'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MetaMaskErrorHandler } from '@/components/MetaMaskErrorHandler'

interface ProvidersProps {
  children: ReactNode
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000'

// Don't create config at module level - it can cause SSR errors
// We'll create it in the component instead

// Create wagmi config function - creates config if module-level failed
function createWagmiConfig() {
  try {
    const config = getDefaultConfig({
      appName: 'PolyOne',
      projectId,
      chains: supportedChains,
      ssr: true
    })
    return config
  } catch (error: any) {
    console.error('Failed to create wagmi config:', error)
    // Fallback with minimal config
    try {
      const fallback = getDefaultConfig({
        appName: 'PolyOne',
        projectId,
        chains: supportedChains.length > 0 ? [supportedChains[0]] : [polygonAmoy],
        ssr: true
      })
      return fallback
    } catch (fallbackError: any) {
      throw fallbackError
    }
  }
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))
  const [mounted, setMounted] = useState(false)
  
  // Create config only on client side - useState lazy init returns null for SSR
  const [config, setConfig] = useState<ReturnType<typeof getDefaultConfig> | null>(() => {
    // During SSR, return null - config will be created in useEffect
    if (typeof window === 'undefined') {
      return null
    }
    // On client, try to create config immediately
    try {
      return getDefaultConfig({
        appName: 'PolyOne',
        projectId,
        chains: supportedChains,
        ssr: true
      })
    } catch (error) {
      console.error('Error creating wagmi config in useState:', error)
      return null
    }
  })
  
  // Create config after mount if it wasn't created in useState
  useEffect(() => {
    if (!config) {
      try {
        const newConfig = getDefaultConfig({
          appName: 'PolyOne',
          projectId,
          chains: supportedChains,
          ssr: true
        })
        setConfig(newConfig)
      } catch (error: any) {
        console.error('Error creating wagmi config in useEffect:', error)
        // Try fallback
        try {
          const fallback = getDefaultConfig({
            appName: 'PolyOne',
            projectId,
            chains: supportedChains.length > 0 ? [supportedChains[0]] : [polygonAmoy],
            ssr: true
          })
          setConfig(fallback)
        } catch (fallbackError) {
          console.error('Fallback config creation also failed:', fallbackError)
        }
      }
    }
  }, [config])
  
  // Update mounted state and set up error handlers
  useEffect(() => {
    setMounted(true)
    
    // Handle any uncaught errors during initialization
    const handleError = (event: ErrorEvent) => {
      const message = event.message || String(event.error)
      if (message.includes('MetaMask') || message.includes('wallet') || message.includes('ethereum')) {
        // Prevent these errors from breaking the app
        event.preventDefault()
        console.log('Suppressed wallet initialization error (non-critical)')
      }
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    // eslint-disable-next-line no-console
    console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect may not function as expected.')
  }

  // Config should always be created (useMemo ensures it), but add safety check
  if (!config) {
    // This should never happen, but if it does, show error boundary
    return (
      <ErrorBoundary>
        <div style={{ visibility: 'hidden', minHeight: '100vh' }}>{children}</div>
      </ErrorBoundary>
    )
  }

  // Always render providers, but handle mounting state
  return (
    <ErrorBoundary>
      <MetaMaskErrorHandler />
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#a855f7',
              borderRadius: 'large'
            })}
            modalSize="compact"
          >
            {!mounted ? (
              <div style={{ visibility: 'hidden', minHeight: '100vh' }}>{children}</div>
            ) : (
              children
            )}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  )
}
