import { useState, useEffect, useCallback } from 'react'
import { web3Service } from '@/lib/web3'

interface WalletState {
  address: string | null
  chainId: number | null
  balance: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  walletType: string | null
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    walletType: null
  })

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }))
    
    try {
      const { address, chainId } = await web3Service.connectWallet()
      const balance = await web3Service.getBalance(address)
      
      setState({
        address,
        chainId,
        balance,
        isConnected: true,
        isConnecting: false,
        error: null,
        walletType: 'metamask'
      })

      // Save to localStorage
      localStorage.setItem('walletConnected', 'true')
      localStorage.setItem('walletAddress', address)
      localStorage.setItem('walletType', 'metamask')
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message
      }))
      throw error // Re-throw so caller can handle it
    }
  }, [])

  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      balance: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      walletType: null
    })
    
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('walletAddress')
    localStorage.removeItem('walletType')
  }, [])

  const refreshBalance = useCallback(async () => {
    if (state.address) {
      try {
        const balance = await web3Service.getBalance(state.address)
        setState(prev => ({ ...prev, balance }))
      } catch (error) {
        console.error('Failed to refresh balance:', error)
      }
    }
  }, [state.address])

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected')
    if (wasConnected === 'true') {
      connect()
    }
  }, [connect])

  // Refresh balance periodically and on chain changes
  useEffect(() => {
    if (state.address && state.isConnected) {
      // Refresh balance immediately
      refreshBalance()
      
      // Set up interval to refresh balance every 30 seconds
      const interval = setInterval(() => {
        refreshBalance()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [state.address, state.isConnected, refreshBalance])

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        } else {
          connect()
        }
      }

      const handleChainChanged = async () => {
        // Refresh balance when chain changes
        if (state.address) {
          try {
            await refreshBalance()
          } catch (error) {
            console.error('Failed to refresh balance on chain change:', error)
          }
        }
        // Reload to update chainId
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        if (typeof window.ethereum !== 'undefined') {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
          window.ethereum.removeListener('chainChanged', handleChainChanged)
        }
      }
    }
  }, [connect, disconnect])

  return {
    ...state,
    connect,
    disconnect,
    refreshBalance
  }
}

