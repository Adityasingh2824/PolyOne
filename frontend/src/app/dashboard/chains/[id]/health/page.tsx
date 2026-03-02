'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Network,
  Users,
  BarChart3,
  RefreshCw,
  Settings,
  Bell,
  Shield,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const COLORS = {
  healthy: '#10b981',
  warning: '#f59e0b',
  degraded: '#ef4444',
  unhealthy: '#dc2626',
  error: '#991b1b'
}

export default function ChainHealthPage() {
  const params = useParams()
  const router = useRouter()
  const chainId = params.id as string
  
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [uptimeData, setUptimeData] = useState<any>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [thresholds, setThresholds] = useState<any>(null)
  const [apiUnavailable, setApiUnavailable] = useState(false)

  useEffect(() => {
    if (chainId) {
      loadHealthData()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadHealthData()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [chainId])

  const buildMockHealthData = () => {
    const now = Date.now()
    const score = Math.floor(82 + Math.random() * 15)
    const status = score >= 90 ? 'healthy' : score >= 70 ? 'warning' : 'degraded'
    const blockNumber = Math.floor(100000 + Math.random() * 20000)
    const responseTime = Math.floor(150 + Math.random() * 250)
    const blockTime = parseFloat((1.8 + Math.random() * 0.7).toFixed(2))
    const tps = parseFloat((120 + Math.random() * 180).toFixed(2))

    return {
      status,
      score,
      lastCheck: new Date().toISOString(),
      consecutiveFailures: 0,
      metrics: {
        rpc: { status: 'healthy', responseTime, blockNumber },
        blocks: { status: 'healthy', currentBlock: blockNumber, blockTime },
        validators: { status: 'healthy', total: 3, active: 3 },
        performance: { status: 'healthy', tps: tps.toFixed(2) },
        network: { status: 'healthy', responseTime: responseTime + 40 }
      },
      issues: [],
      monitoring: { active: false, simulated: true }
    }
  }

  const buildMockHistory = () => {
    const now = Date.now()
    return Array.from({ length: 12 }, (_, i) => ({
      timestamp: now - (11 - i) * 3600000,
      score: Math.floor(75 + Math.random() * 20)
    }))
  }

  const loadHealthData = async () => {
    try {
      setRefreshing(true)

      try {
        await apiClient.health.startMonitoring(chainId)
      } catch (e) {
        // Non-blocking: monitoring might already be running
      }
      
      // Load health status
      const statusResponse = await apiClient.health.getStatus(chainId)
      setHealthStatus(statusResponse.data)
      setApiUnavailable(false)
      
      // Load uptime data
      try {
        const uptimeResponse = await apiClient.health.getUptime(chainId)
        setUptimeData(uptimeResponse.data)
      } catch (e) {
        // Uptime might not be available yet
      }
      
      // Load incidents
      try {
        const incidentsResponse = await apiClient.health.getIncidents(chainId)
        setIncidents(incidentsResponse.data.incidents || [])
      } catch (e) {
        console.warn('Could not load incidents:', e)
      }
      
      // Load history
      try {
        const historyResponse = await apiClient.health.getHistory(chainId)
        setHistory(historyResponse.data.history || [])
      } catch (e) {
        console.warn('Could not load history:', e)
      }
      
      // Load thresholds
      try {
        const thresholdsResponse = await apiClient.health.getThresholds(chainId)
        setThresholds(thresholdsResponse.data.thresholds)
      } catch (e) {
        console.warn('Could not load thresholds:', e)
      }
    } catch (error: any) {
      console.error('Error loading health data:', error)
      if (!apiUnavailable) {
        toast.error('Failed to load health data, showing simulated metrics')
        setApiUnavailable(true)
      }
      const mockStatus = buildMockHealthData()
      setHealthStatus(mockStatus)
      setUptimeData({
        uptimePercentage: 99.8,
        totalUptimeSeconds: 3600 * 12
      })
      setIncidents([])
      setHistory(buildMockHistory())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const performManualCheck = async () => {
    try {
      setRefreshing(true)
      toast.loading('Performing health check...', { id: 'health-check' })
      
      await apiClient.health.performCheck(chainId)
      await loadHealthData()
      
      toast.success('Health check completed', { id: 'health-check' })
    } catch (error: any) {
      toast.error('Health check failed', { id: 'health-check' })
    } finally {
      setRefreshing(false)
    }
  }

  const startMonitoring = async () => {
    try {
      await apiClient.health.startMonitoring(chainId)
      toast.success('Health monitoring started')
      await loadHealthData()
    } catch (error: any) {
      toast.error('Failed to start monitoring')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return COLORS.healthy
      case 'warning': return COLORS.warning
      case 'degraded': return COLORS.degraded
      case 'unhealthy': return COLORS.unhealthy
      case 'error': return COLORS.error
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-5 h-5" />
      case 'warning': return <AlertTriangle className="w-5 h-5" />
      case 'degraded': return <AlertCircle className="w-5 h-5" />
      case 'unhealthy': return <AlertCircle className="w-5 h-5" />
      case 'error': return <AlertCircle className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 animate-pulse">
          <div className="h-8 bg-white/5 rounded mb-4 w-1/3" />
          <div className="h-4 bg-white/5 rounded mb-2" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/chains/${chainId}`}>
              <motion.button
                whileHover={{ x: -4 }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chain
              </motion.button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Chain Health Monitoring</h1>
              <p className="text-gray-400">Real-time health status and performance metrics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={performManualCheck}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/50 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Check Now
            </motion.button>
            
            {!healthStatus?.monitoring?.active && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startMonitoring}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Start Monitoring
              </motion.button>
            )}
          </div>
        </div>

        {/* Overall Health Status */}
        {healthStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Health Status</h3>
                <div className={`p-2 rounded-lg ${getStatusColor(healthStatus.status)}/20`}>
                  {getStatusIcon(healthStatus.status)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold capitalize" style={{ color: getStatusColor(healthStatus.status) }}>
                    {healthStatus.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  Last check: {healthStatus.lastCheck ? new Date(healthStatus.lastCheck).toLocaleString() : 'Never'}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Health Score</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold" style={{ 
                    color: healthStatus.score >= 90 ? COLORS.healthy : 
                           healthStatus.score >= 70 ? COLORS.warning : 
                           healthStatus.score >= 50 ? COLORS.degraded : COLORS.unhealthy 
                  }}>
                    {healthStatus.score || 0}
                  </span>
                  <span className="text-gray-400">/ 100</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${healthStatus.score || 0}%`,
                      backgroundColor: healthStatus.score >= 90 ? COLORS.healthy : 
                                       healthStatus.score >= 70 ? COLORS.warning : 
                                       healthStatus.score >= 50 ? COLORS.degraded : COLORS.unhealthy
                    }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Uptime</h3>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-2">
                {uptimeData ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-green-400">
                        {uptimeData.uptimePercentage?.toFixed(2) || '100.00'}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {uptimeData.totalUptimeSeconds ? `${Math.floor(uptimeData.totalUptimeSeconds / 3600)}h uptime` : 'Calculating...'}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">Not available yet</div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Health Checks Breakdown */}
        {healthStatus?.metrics && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-6">Health Checks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* RPC Check */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">RPC Endpoint</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${healthStatus.metrics.rpc?.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {healthStatus.metrics.rpc?.status || 'unknown'}
                  </span>
                </div>
                {healthStatus.metrics.rpc?.responseTime && (
                  <div className="text-sm text-gray-400">
                    Response: {healthStatus.metrics.rpc.responseTime}ms
                  </div>
                )}
                {healthStatus.metrics.rpc?.blockNumber && (
                  <div className="text-sm text-gray-400">
                    Block: {healthStatus.metrics.rpc.blockNumber}
                  </div>
                )}
              </div>

              {/* Block Production */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">Block Production</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${healthStatus.metrics.blocks?.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {healthStatus.metrics.blocks?.status || 'unknown'}
                  </span>
                </div>
                {healthStatus.metrics.blocks?.blockTime && (
                  <div className="text-sm text-gray-400">
                    Block time: {healthStatus.metrics.blocks.blockTime}s
                  </div>
                )}
                {healthStatus.metrics.blocks?.currentBlock && (
                  <div className="text-sm text-gray-400">
                    Block: {healthStatus.metrics.blocks.currentBlock}
                  </div>
                )}
              </div>

              {/* Validators */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">Validators</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${healthStatus.metrics.validators?.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {healthStatus.metrics.validators?.status || 'unknown'}
                  </span>
                </div>
                {healthStatus.metrics.validators && (
                  <div className="text-sm text-gray-400">
                    {healthStatus.metrics.validators.active || 0} / {healthStatus.metrics.validators.total || 0} active
                  </div>
                )}
              </div>

              {/* Performance */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">Performance</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${healthStatus.metrics.performance?.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {healthStatus.metrics.performance?.status || 'unknown'}
                  </span>
                </div>
                {healthStatus.metrics.performance?.tps && (
                  <div className="text-sm text-gray-400">
                    TPS: {parseFloat(healthStatus.metrics.performance.tps).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Network */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">Network</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${healthStatus.metrics.network?.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {healthStatus.metrics.network?.status || 'unknown'}
                  </span>
                </div>
                {healthStatus.metrics.network?.responseTime && (
                  <div className="text-sm text-gray-400">
                    Latency: {healthStatus.metrics.network.responseTime}ms
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Issues & Alerts */}
        {healthStatus?.issues && healthStatus.issues.length > 0 && (
          <div className="glass-card p-6 border-yellow-500/30">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold">Issues Detected</h2>
            </div>
            <ul className="space-y-2">
              {healthStatus.issues.map((issue: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-yellow-400">
                  <span className="mt-1">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Incidents */}
        {incidents.length > 0 && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Incidents</h2>
              <Link href={`/dashboard/chains/${chainId}/health/incidents`}>
                <button className="text-sm text-purple-400 hover:text-purple-300">
                  View All
                </button>
              </Link>
            </div>
            <div className="space-y-3">
              {incidents.slice(0, 5).map((incident: any) => (
                <div key={incident.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          incident.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          incident.severity === 'error' ? 'bg-orange-500/20 text-orange-400' :
                          incident.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {incident.severity}
                        </span>
                        <span className="font-semibold">{incident.title || incident.description}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(incident.detected_at).toLocaleString()}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      incident.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                      incident.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {incident.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health History Chart */}
        {history.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-6">Health Score History</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9ca3af"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #3b82f6' }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}



















