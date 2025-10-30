import { useState, useEffect, useCallback } from 'react'
import { web3Service } from '@/lib/web3'

interface WalletState {
  address: string | null
  chainId: number | null
  balance: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    isConnected: false,
    isConnecting: false,
    error: null
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
        error: null
      })

      // Save to localStorage
      localStorage.setItem('walletConnected', 'true')
      localStorage.setItem('walletAddress', address)
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message
      }))
    }
  }, [])

  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      balance: null,
      isConnected: false,
      isConnecting: false,
      error: null
    })
    
    localStorage.removeItem('walletConnected')
    localStorage.removeItem('walletAddress')
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

      const handleChainChanged = () => {
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
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

