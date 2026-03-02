'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Activity,
  Zap,
  Users,
  Globe,
  Copy,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Server,
  Network,
  Cpu,
  Layers,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Hash
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import ChainManagement from '@/components/ChainManagement'
import ValidatorManagement from '@/components/ValidatorManagement'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useWallet } from '@/hooks/useWallet'
import { PRIMARY_CHAIN_ID, polygonMainnet } from '@/lib/chains'

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  status: 'success' | 'pending' | 'failed'
  gasUsed?: string
  gasPrice?: string
}

export default function ChainDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { chainId: walletChainId, address } = useWallet()
  const chainId = params.id as string
  const [chain, setChain] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  useEffect(() => {
    if (!chainId) {
      setLoading(false)
      return
    }
    
    loadChainData()
    loadMetrics()
    loadAnalytics()
    loadTransactions()

    // Auto-refresh metrics every 15 seconds
    const metricsInterval = setInterval(() => {
      loadMetrics()
      loadTransactions()
    }, 15000)

    return () => {
      clearInterval(metricsInterval)
    }
  }, [chainId])

  // Separate effect for status polling when deploying
  useEffect(() => {
    if (!chainId || chain?.status !== 'deploying') {
      return
    }
    
    // Auto-refresh chain data every 5 seconds if status is "deploying" to catch status updates
    const statusInterval = setInterval(() => {
      loadChainData()
    }, 5000)

    return () => {
      clearInterval(statusInterval)
    }
  }, [chainId, chain?.status])

  const loadChainData = async () => {
    if (!chainId) {
      setLoading(false)
      return
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      
      // First try API (most reliable source)
      try {
        // Build URL with wallet address query param for development
        const url = address 
          ? `${apiUrl}/api/chains/${encodeURIComponent(chainId)}?walletAddress=${encodeURIComponent(address)}`
          : `${apiUrl}/api/chains/${encodeURIComponent(chainId)}`;
        
        console.log('📡 Fetching chain from API:', url);
        
        // Try without auth first (for development)
        let response = await fetch(url)
        
        // If 401, try with auth token
        if (response.status === 401) {
          const authToken = localStorage.getItem('authToken')
          if (authToken) {
            response = await fetch(`${apiUrl}/api/chains/${encodeURIComponent(chainId)}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            })
          }
        }
        
        if (response.ok) {
          const apiChain = await response.json()
          setChain(apiChain)
          // Save to localStorage for offline access
          const existingChains = JSON.parse(localStorage.getItem('userChains') || '[]')
          const existingIndex = existingChains.findIndex((c: any) => c.id === apiChain.id)
          if (existingIndex >= 0) {
            existingChains[existingIndex] = apiChain
          } else {
            existingChains.push(apiChain)
          }
          localStorage.setItem('userChains', JSON.stringify(existingChains))
          setLoading(false)
          return
        } else if (response.status === 404) {
          console.warn('Chain not found in API (404), checking localStorage and retrying...')
          
          // If chain was just deployed, it might not be immediately available
          // Retry after a short delay
          const urlParams = new URLSearchParams(window.location.search)
          const isNewDeployment = urlParams.get('new') === 'true'
          
          if (isNewDeployment) {
            console.log('New deployment detected, retrying multiple times...')
            
            // Retry up to 5 times with increasing delays
            let retryCount = 0
            const maxRetries = 5
            const retryInterval = setInterval(async () => {
              retryCount++
              try {
                const retryUrl = address 
                  ? `${apiUrl}/api/chains/${encodeURIComponent(chainId)}?walletAddress=${encodeURIComponent(address)}`
                  : `${apiUrl}/api/chains/${encodeURIComponent(chainId)}`
                
                const authToken = localStorage.getItem('authToken')
                const headers: HeadersInit = {
                  'Content-Type': 'application/json'
                }
                if (authToken) {
                  headers['Authorization'] = `Bearer ${authToken}`
                }
                
                const retryResponse = await fetch(retryUrl, { headers })
                if (retryResponse.ok) {
                  const retryChain = await retryResponse.json()
                  console.log(`✅ Chain found on retry attempt ${retryCount}`)
                  setChain(retryChain)
                  setLoading(false)
                  clearInterval(retryInterval)
                  
                  // Save to localStorage
                  const existingChains = JSON.parse(localStorage.getItem('userChains') || '[]')
                  const existingIndex = existingChains.findIndex((c: any) => c.id === retryChain.id)
                  if (existingIndex >= 0) {
                    existingChains[existingIndex] = retryChain
                  } else {
                    existingChains.push(retryChain)
                  }
                  localStorage.setItem('userChains', JSON.stringify(existingChains))
                  return
                } else if (retryResponse.status === 404 && retryCount < maxRetries) {
                  console.log(`Retry attempt ${retryCount} failed, will retry again...`)
                } else if (retryCount >= maxRetries) {
                  console.error('Max retries reached, chain still not found')
                  clearInterval(retryInterval)
                }
              } catch (retryError) {
                console.warn(`Retry attempt ${retryCount} error:`, retryError)
                if (retryCount >= maxRetries) {
                  clearInterval(retryInterval)
                }
              }
            }, 2000) // Retry every 2 seconds
            
            // Clear interval after 15 seconds max
            setTimeout(() => {
              clearInterval(retryInterval)
            }, 15000)
          }
        } else if (response.status === 401) {
          console.warn('Unauthorized - chain might be in localStorage only')
        }
      } catch (apiError) {
        console.warn('API fetch failed, trying localStorage:', apiError)
      }
      
      // Fallback to localStorage
      const storedChains = JSON.parse(localStorage.getItem('userChains') || '[]')
      let foundChain = storedChains.find((c: any) => {
        const cId = String(c.id || '')
        return cId === chainId || 
               decodeURIComponent(cId) === chainId || 
               cId === decodeURIComponent(chainId) ||
               cId === String(chainId)
      })
      
      if (foundChain) {
        setChain(foundChain)
      } else {
        // Chain not found anywhere
        setChain(null)
      }
    } catch (error) {
      console.error('Error loading chain:', error)
      setChain(null)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/monitoring/${chainId}/metrics`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      } else {
        // Generate mock metrics if API not available
        setMetrics({
          tps: Math.floor(Math.random() * 100) + 50,
          blockTime: (Math.random() * 2 + 1).toFixed(2),
          activeValidators: chain?.validators || chain?.initialValidators || 3,
          uptime: (Math.random() * 5 + 95).toFixed(2),
          totalTransactions: chain?.transactions || Math.floor(Math.random() * 10000) + 1000,
          gasUsed: Math.floor(Math.random() * 1000000) + 500000
        })
      }
    } catch (error) {
      // Generate mock metrics
      setMetrics({
        tps: Math.floor(Math.random() * 100) + 50,
        blockTime: (Math.random() * 2 + 1).toFixed(2),
        activeValidators: chain?.validators || chain?.initialValidators || 3,
        uptime: (Math.random() * 5 + 95).toFixed(2),
        totalTransactions: chain?.transactions || Math.floor(Math.random() * 10000) + 1000,
        gasUsed: Math.floor(Math.random() * 1000000) + 500000
      })
    }
  }

  const loadAnalytics = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/monitoring/${chainId}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data || [])
      } else {
        // Generate mock analytics
        const now = Date.now()
        const mockData = Array.from({ length: 24 }, (_, i) => ({
          timestamp: now - (23 - i) * 3600000,
          transactions: Math.floor(Math.random() * 100) + 50,
          tps: Math.floor(Math.random() * 10) + 5,
          gasUsed: Math.floor(Math.random() * 100000) + 50000
        }))
        setAnalytics(mockData)
      }
    } catch (error) {
      // Generate mock analytics
      const now = Date.now()
      const mockData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: now - (23 - i) * 3600000,
        transactions: Math.floor(Math.random() * 100) + 50,
        tps: Math.floor(Math.random() * 10) + 5,
        gasUsed: Math.floor(Math.random() * 100000) + 50000
      }))
      setAnalytics(mockData)
    }
  }

  const loadTransactions = async () => {
    if (!chain) return
    
    setLoadingTransactions(true)
    try {
      // Try to fetch from Polyscan API if chain has blockchainTxHash
      if (chain.blockchainTxHash && walletChainId) {
        const isTestnet = walletChainId === PRIMARY_CHAIN_ID
        const apiKey = process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY || ''
        const baseUrl = isTestnet ? 'https://api-amoy.polygonscan.com/api' : 'https://api.polygonscan.com/api'
        
        // Fetch transactions for the contract address
        const contractAddress = process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS
        if (contractAddress && apiKey) {
          try {
            const response = await fetch(
              `${baseUrl}?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${apiKey}`
            )
            if (response.ok) {
              const data = await response.json()
              if (data.status === '1' && data.result) {
                const txs = data.result
                  .filter((tx: any) => tx.to?.toLowerCase() === contractAddress.toLowerCase())
                  .slice(0, 20)
                  .map((tx: any) => ({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: tx.value,
                    timestamp: parseInt(tx.timeStamp) * 1000,
                    status: tx.txreceipt_status === '1' ? 'success' as const : 'failed' as const,
                    gasUsed: tx.gasUsed,
                    gasPrice: tx.gasPrice
                  }))
                setTransactions(txs)
                setLoadingTransactions(false)
                return
              }
            }
          } catch (error) {
            console.error('Error fetching from Polyscan:', error)
          }
        }
      }
      
      // Generate mock transactions if API not available
      const mockTxs: Transaction[] = Array.from({ length: 15 }, (_, i) => ({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: chain.rpcUrl || `0x${Math.random().toString(16).substr(2, 40)}`,
        value: (Math.random() * 10).toFixed(4),
        timestamp: Date.now() - i * 3600000,
        status: Math.random() > 0.1 ? 'success' : 'failed',
        gasUsed: Math.floor(Math.random() * 100000).toString(),
        gasPrice: Math.floor(Math.random() * 1000000000).toString()
      }))
      setTransactions(mockTxs)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadChainData(), loadMetrics(), loadAnalytics(), loadTransactions()])
    setRefreshing(false)
    toast.success('Data refreshed!')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getPolygonScanUrl = (txHash: string) => {
    if (walletChainId === polygonMainnet.id) {
      return `https://polygonscan.com/tx/${txHash}`
    } else if (walletChainId === PRIMARY_CHAIN_ID) {
      return `https://amoy.polygonscan.com/tx/${txHash}`
    }
    return `https://polygonscan.com/tx/${txHash}`
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          </div>
          <motion.div
            className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </DashboardLayout>
    )
  }

  if (!chain) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center relative">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center relative"
          >
            <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-lg rounded-2xl p-12 border border-cyan-500/20">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_0.5px,transparent_0.5px),linear-gradient(to_bottom,#06b6d4_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10 pointer-events-none" />
              <div className="relative z-10">
                <AlertCircle className="w-16 h-16 mx-auto mb-6 text-cyan-400" />
                <h2 className="text-2xl font-bold mb-4 font-mono bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Chain Not Found
                </h2>
                <p className="text-gray-400 mb-8 font-mono">The chain you're looking for doesn't exist</p>
                <Link 
                  href="/dashboard/chains" 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-semibold transition-all font-mono"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Chains
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusDisplay = () => {
    if (chain.status === 'active' || chain.isActive) {
      return { text: 'Active', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
    } else if (chain.status === 'deploying') {
      return { text: 'Deploying', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    } else {
      return { text: chain.status || 'Inactive', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
    }
  }
  
  const statusDisplay = getStatusDisplay()
  const statusColor = statusDisplay.color

  return (
    <DashboardLayout>
      <div className="space-y-6 relative">
        {/* Tech Grid Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <Link 
            href="/dashboard/chains" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors font-mono group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Chains
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all flex items-center gap-2 disabled:opacity-50 font-mono"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Chain Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group overflow-hidden"
        >
          <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/30 hover:border-cyan-500/50 transition-all shadow-xl">
            {/* Tech grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_0.5px,transparent_0.5px),linear-gradient(to_bottom,#06b6d4_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-15 pointer-events-none" />
            
            {/* Tech corners */}
            <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-cyan-500/30 rounded-bl-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-cyan-500/30 rounded-tr-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    />
                    <Globe className="w-8 h-8 text-white relative z-10" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold font-mono bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        {chain.name}
                      </h1>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${statusColor} font-mono capitalize flex items-center gap-2`}>
                        {statusDisplay.text}
                        {chain.status === 'deploying' && (
                          <motion.div
                            className="w-2 h-2 bg-yellow-400 rounded-full"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 capitalize font-mono">
                        {chain.chainType || chain.chain_type || 'N/A'}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                        {chain.rollupType || chain.rollup_type || 'N/A'}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                        {(chain.gasToken || chain.gas_token || 'N/A')} Gas Token
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1 font-mono">Chain ID</div>
                  <div className="font-mono font-semibold text-cyan-400 text-lg">{chain.chainId || chainId}</div>
                </div>
              </div>

              {/* Blockchain Transaction Info */}
              {chain.blockchainTxHash && chain.polygonScanUrl && (
                <div className="mb-6 p-4 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div>
                        <div className="text-sm text-gray-300 mb-1 font-mono">On-Chain Registration</div>
                        <div className="text-xs text-gray-400 font-mono truncate max-w-md">
                          {chain.blockchainTxHash}
                        </div>
                      </div>
                    </div>
                    <a
                      href={chain.polygonScanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center gap-2 text-sm font-semibold font-mono"
                    >
                      View on PolygonScan
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Endpoints */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Always show RPC URL - generate if not present */}
                {(chain.rpcUrl || chain.rpc_url) && (
                  <div className="relative bg-slate-900/50 rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_0.5px,transparent_0.5px),linear-gradient(to_bottom,#06b6d4_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-5 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400 font-mono">RPC URL</div>
                      <button onClick={() => copyToClipboard(chain.rpcUrl || chain.rpc_url)} className="text-gray-400 hover:text-cyan-400 transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="font-mono text-sm truncate text-cyan-300">{chain.rpcUrl || chain.rpc_url}</div>
                  </div>
                )}
                {/* Show RPC URL placeholder if deploying but RPC not yet available */}
                {(!chain.rpcUrl && !chain.rpc_url && chain.status === 'deploying') && (
                  <div className="relative bg-slate-900/50 rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group opacity-60">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_0.5px,transparent_0.5px),linear-gradient(to_bottom,#06b6d4_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-5 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400 font-mono">RPC URL</div>
                      <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="font-mono text-sm text-gray-500">Generating RPC endpoint...</div>
                  </div>
                )}
                {(chain.blockchainTxHash || chain.blockchain_tx_hash) && (chain.polygonScanUrl || chain.polygon_scan_url) ? (
                  <div className="relative bg-slate-900/50 rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_0.5px,transparent_0.5px),linear-gradient(to_bottom,#3b82f6_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-5 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400 font-mono">Explorer</div>
                      <a href={chain.polygonScanUrl || chain.polygon_scan_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="font-mono text-xs truncate text-blue-300 mb-1">{chain.blockchainTxHash || chain.blockchain_tx_hash}</div>
                    <div className="text-xs text-gray-500 font-mono">On-Chain Registration</div>
                  </div>
                ) : (chain.explorerUrl || chain.explorer_url) ? (
                  <div className="relative bg-slate-900/50 rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_0.5px,transparent_0.5px),linear-gradient(to_bottom,#3b82f6_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-5 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400 font-mono">Explorer</div>
                      <a href={chain.explorerUrl || chain.explorer_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="font-mono text-sm truncate text-blue-300">{chain.explorerUrl || chain.explorer_url}</div>
                  </div>
                ) : null}
                {chain.bridgeUrl && (
                  <div className="relative bg-slate-900/50 rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b981_0.5px,transparent_0.5px),linear-gradient(to_bottom,#10b981_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-5 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-400 font-mono">Bridge</div>
                      <a href={chain.bridgeUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="font-mono text-sm truncate text-emerald-300">{chain.bridgeUrl}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              icon: Zap, 
              label: 'TPS', 
              value: metrics?.tps || 0, 
              gradient: 'from-yellow-500 to-orange-500',
              border: 'border-yellow-500/30',
              delay: 0
            },
            { 
              icon: Clock, 
              label: 'Block Time', 
              value: `${metrics?.blockTime || 0}s`, 
              gradient: 'from-blue-500 to-cyan-500',
              border: 'border-blue-500/30',
              delay: 0.1
            },
            { 
              icon: Users, 
              label: 'Validators', 
              value: metrics?.activeValidators || chain?.validators || chain?.initialValidators || 0, 
              gradient: 'from-purple-500 to-pink-500',
              border: 'border-purple-500/30',
              delay: 0.2
            },
            { 
              icon: Activity, 
              label: 'Uptime', 
              value: `${metrics?.uptime || 0}%`, 
              gradient: 'from-emerald-500 to-teal-500',
              border: 'border-emerald-500/30',
              delay: 0.3
            }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: stat.delay }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative group overflow-hidden"
            >
              <div className={`relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-lg rounded-xl p-4 border ${stat.border} hover:border-opacity-60 transition-all shadow-lg`}>
                {/* Tech grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_0.5px,transparent_0.5px),linear-gradient(to_bottom,#06b6d4_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-5 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center border border-white/20`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold mb-1 text-white font-mono">{stat.value}</div>
                  <div className="text-xs text-gray-400 font-mono">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Analytics Charts */}
        {analytics.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group overflow-hidden"
            >
              <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-500/50 transition-all shadow-xl">
                {/* Tech grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_0.5px,transparent_0.5px),linear-gradient(to_bottom,#06b6d4_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-15 pointer-events-none" />
                
                {/* Tech corners */}
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 rounded-bl-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30 rounded-tr-2xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center border border-cyan-400/30">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-bold font-mono text-white">Transaction History (24h)</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        stroke="rgba(255,255,255,0.5)"
                      />
                      <YAxis stroke="rgba(255,255,255,0.5)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                      />
                      <Area
                        type="monotone"
                        dataKey="transactions"
                        stroke="#06b6d4"
                        fill="url(#colorGradient1)"
                        fillOpacity={0.3}
                      />
                      <defs>
                        <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative group overflow-hidden"
            >
              <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-xl">
                {/* Tech grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b981_0.5px,transparent_0.5px),linear-gradient(to_bottom,#10b981_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-15 pointer-events-none" />
                
                {/* Tech corners */}
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-emerald-500/30 rounded-bl-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-emerald-500/30 rounded-tr-2xl pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center border border-emerald-400/30">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-bold font-mono text-white">TPS Over Time</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        stroke="rgba(255,255,255,0.5)"
                      />
                      <YAxis stroke="rgba(255,255,255,0.5)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="tps"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Polyscan Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group overflow-hidden"
        >
          <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all shadow-xl">
            {/* Tech grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_0.5px,transparent_0.5px),linear-gradient(to_bottom,#3b82f6_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-15 pointer-events-none" />
            
            {/* Tech corners */}
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-blue-500/30 rounded-bl-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-blue-500/30 rounded-tr-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center border border-blue-400/30">
                    <Hash className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold font-mono text-white">Recent Transactions</h3>
                </div>
                {chain.blockchainTxHash && (
                  <a
                    href={getPolygonScanUrl(chain.blockchainTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono flex items-center gap-1"
                  >
                    View All on PolygonScan
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {loadingTransactions ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Hash className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400 font-mono">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx, i) => (
                    <motion.div
                      key={tx.hash}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative bg-slate-900/50 rounded-lg p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${
                            tx.status === 'success' ? 'bg-emerald-400' : 
                            tx.status === 'pending' ? 'bg-yellow-400' : 
                            'bg-red-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Hash className="w-3 h-3 text-gray-400" />
                              <a
                                href={getPolygonScanUrl(tx.hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors truncate"
                              >
                                {formatAddress(tx.hash)}
                              </a>
                              <ExternalLink className="w-3 h-3 text-gray-500" />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                              <span>From: {formatAddress(tx.from)}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span>To: {formatAddress(tx.to)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-white font-mono mb-1">
                            {parseFloat(tx.value).toFixed(4)} POL
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Health Monitoring Quick Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-mono">Health Monitoring</h3>
                <p className="text-sm text-gray-400 font-mono">Real-time health status and alerts</p>
              </div>
            </div>
            <Link
              href={`/dashboard/chains/${chainId}/health`}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2 font-mono"
            >
              <Activity className="w-4 h-4" />
              View Health
            </Link>
          </div>
        </motion.div>

        {/* Chain Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative group overflow-hidden"
        >
          <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-500/50 transition-all shadow-xl">
            {/* Tech grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_0.5px,transparent_0.5px),linear-gradient(to_bottom,#06b6d4_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-15 pointer-events-none" />
            
            {/* Tech corners */}
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 rounded-bl-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30 rounded-tr-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center border border-cyan-400/30">
                  <Network className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-bold font-mono text-white">Chain Management</h3>
              </div>
              <ChainManagement 
                chainId={chainId} 
                chainStatus={chain.status}
                onStatusChange={() => {
                  loadChainData()
                  loadMetrics()
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Validator Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative group overflow-hidden"
        >
          <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all shadow-xl">
            {/* Tech grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#a855f7_0.5px,transparent_0.5px),linear-gradient(to_bottom,#a855f7_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-15 pointer-events-none" />
            
            {/* Tech corners */}
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-purple-500/30 rounded-bl-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-purple-500/30 rounded-tr-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <ValidatorManagement 
                chainId={chainId}
                onUpdate={() => {
                  loadChainData()
                  loadMetrics()
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
