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
  Link as LinkIcon,
  Copy,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Server,
  Network
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function ChainDetailPage() {
  const params = useParams()
  const router = useRouter()
  // Next.js automatically decodes URL parameters, so we just use it directly
  const chainId = params.id as string
  const [chain, setChain] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!chainId) {
      setLoading(false)
      return
    }
    
    loadChainData()
    loadMetrics()
    loadAnalytics()

    // Auto-refresh metrics every 15 seconds
    const interval = setInterval(() => {
      loadMetrics()
    }, 15000)

    return () => clearInterval(interval)
  }, [chainId])

  const loadChainData = async () => {
    if (!chainId) return
    
    try {
      const storedChains = JSON.parse(localStorage.getItem('userChains') || '[]')
      // Try exact match first
      let foundChain = storedChains.find((c: any) => c.id === chainId)
      
      // If not found, try matching without URL encoding
      if (!foundChain) {
        foundChain = storedChains.find((c: any) => {
          const cId = String(c.id || '')
          return cId === chainId || decodeURIComponent(cId) === chainId || cId === decodeURIComponent(chainId)
        })
      }
      
      if (foundChain) {
        setChain(foundChain)
      } else {
        // Try to fetch from API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        
        try {
          const response = await fetch(`${apiUrl}/api/chains/${chainId}`)
          
          if (response.ok) {
            const data = await response.json()
            setChain(data)
          }
        } catch (error) {
          console.error('Failed to fetch chain:', error)
        }
      }
    } catch (error) {
      console.error('Error loading chain:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      
      const response = await fetch(`${apiUrl}/api/monitoring/${chainId}/metrics`)
      
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      
      const response = await fetch(`${apiUrl}/api/monitoring/${chainId}/analytics`)
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data || [])
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadChainData(), loadMetrics(), loadAnalytics()])
    setRefreshing(false)
    toast.success('Data refreshed!')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
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
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold mb-2">Chain Not Found</h2>
            <p className="text-gray-400 mb-8">The chain you're looking for doesn't exist</p>
            <Link href="/dashboard" className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 font-semibold">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const statusColor = chain.status === 'active' ? 'bg-green-500' : chain.status === 'deploying' ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Chain Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{chain.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor} text-white capitalize`}>
                  {chain.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 capitalize">
                  {chain.chainType}
                </span>
                <span className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-400">
                  {chain.rollupType}
                </span>
                <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400">
                  {chain.gasToken} Gas Token
                </span>
                {chain.agglayerChainId && (
                  <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400">
                    AggLayer Connected
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Chain ID</div>
              <div className="font-mono font-semibold">{chain.chainId || chainId}</div>
            </div>
          </div>

          {/* Blockchain Transaction Info */}
          {chain.blockchainTxHash && chain.polygonScanUrl && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-sm text-gray-300 mb-1">On-Chain Registration</div>
                    <div className="text-xs text-gray-400 font-mono truncate max-w-md">
                      {chain.blockchainTxHash}
                    </div>
                  </div>
                </div>
                <a
                  href={chain.polygonScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 text-sm font-semibold"
                >
                  View on PolygonScan
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Endpoints */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chain.rpcUrl && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">RPC URL</div>
                  <button onClick={() => copyToClipboard(chain.rpcUrl)} className="text-gray-400 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="font-mono text-sm truncate">{chain.rpcUrl}</div>
              </div>
            )}
            {chain.explorerUrl && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Explorer</div>
                  <a href={chain.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="font-mono text-sm truncate">{chain.explorerUrl}</div>
              </div>
            )}
            {chain.bridgeUrl && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Bridge</div>
                  <a href={chain.bridgeUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="font-mono text-sm truncate">{chain.bridgeUrl}</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold mb-1">{metrics.tps || 0}</div>
              <div className="text-sm text-gray-400">Transactions/sec</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold mb-1">{metrics.blockTime || 0}s</div>
              <div className="text-sm text-gray-400">Block Time</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold mb-1">{metrics.activeValidators || 0}</div>
              <div className="text-sm text-gray-400">Validators</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-green-400" />
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold mb-1">{metrics.uptime || 0}%</div>
              <div className="text-sm text-gray-400">Uptime</div>
            </motion.div>
          </div>
        )}

        {/* Analytics Charts */}
        {analytics.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-3xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-bold mb-4">Transaction History (24h)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    stroke="rgba(255,255,255,0.5)"
                  />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="transactions"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-3xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-bold mb-4">TPS Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    stroke="rgba(255,255,255,0.5)"
                  />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tps"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Validator Info */}
        {chain.validatorKeys && chain.validatorKeys.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-3xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" />
              Validators ({chain.validatorKeys.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chain.validatorKeys.map((validator: string, index: number) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">Validator #{index + 1}</div>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="font-mono text-xs text-gray-400 truncate">{validator}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}

