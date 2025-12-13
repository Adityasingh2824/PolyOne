'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  Zap,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileJson,
  Users,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Fuel,
  Server,
  Cpu,
  HardDrive
} from 'lucide-react'
import toast from 'react-hot-toast'

// Types
interface TransactionAnalytics {
  period: string
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  totalVolume: string
  avgTransactionValue: string
  uniqueSenders: number
  uniqueReceivers: number
}

interface GasAnalytics {
  period: string
  avgGasPrice: string
  minGasPrice: string
  maxGasPrice: string
  totalGasUsed: string
  gasUtilization: number
  suggestedGasPrice: {
    slow: string
    standard: string
    fast: string
    instant: string
  }
}

interface ChainPerformance {
  chainId: string
  chainName: string
  blocksProduced: number
  avgBlockTime: number
  tpsAvg: number
  tpsMax: number
  uptime: number
  incidents: number
}

interface UserActivity {
  period: string
  logins: number
  apiCalls: number
  chainsCreated: number
  validatorsAdded: number
  bridgeTransactions: number
  dashboardViews: number
}

// Mock data
const MOCK_TX_ANALYTICS: TransactionAnalytics[] = [
  { period: 'Today', totalTransactions: 1250, successfulTransactions: 1200, failedTransactions: 50, totalVolume: '125,000', avgTransactionValue: '100', uniqueSenders: 450, uniqueReceivers: 380 },
  { period: 'Yesterday', totalTransactions: 1100, successfulTransactions: 1050, failedTransactions: 50, totalVolume: '110,000', avgTransactionValue: '100', uniqueSenders: 400, uniqueReceivers: 350 },
  { period: 'Last 7 Days', totalTransactions: 8500, successfulTransactions: 8200, failedTransactions: 300, totalVolume: '850,000', avgTransactionValue: '100', uniqueSenders: 2000, uniqueReceivers: 1800 },
]

const MOCK_GAS_ANALYTICS: GasAnalytics = {
  period: 'Last 24 Hours',
  avgGasPrice: '25',
  minGasPrice: '15',
  maxGasPrice: '100',
  totalGasUsed: '1,250,000',
  gasUtilization: 65,
  suggestedGasPrice: {
    slow: '18',
    standard: '25',
    fast: '35',
    instant: '50'
  }
}

const MOCK_CHAIN_PERFORMANCE: ChainPerformance[] = [
  { chainId: '1', chainName: 'My App Chain', blocksProduced: 5000, avgBlockTime: 2.1, tpsAvg: 150, tpsMax: 500, uptime: 99.95, incidents: 0 },
  { chainId: '2', chainName: 'Test Network', blocksProduced: 3000, avgBlockTime: 2.3, tpsAvg: 100, tpsMax: 300, uptime: 99.9, incidents: 1 },
]

const MOCK_USER_ACTIVITY: UserActivity = {
  period: 'Last 30 Days',
  logins: 45,
  apiCalls: 12500,
  chainsCreated: 2,
  validatorsAdded: 5,
  bridgeTransactions: 15,
  dashboardViews: 250
}

type ExportFormat = 'csv' | 'pdf' | 'json' | 'xlsx'
type DateRange = '24h' | '7d' | '30d' | '90d' | 'custom'
type AnalyticsTab = 'transactions' | 'gas' | 'performance' | 'activity'

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('transactions')
  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [isExporting, setIsExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast.success('Analytics refreshed')
  }

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)
    setShowExportMenu(false)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Analytics exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const dateRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Comprehensive insights into your blockchain networks</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="pl-10 pr-10 py-2 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white appearance-none cursor-pointer"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-dark-400/50 border border-white/5 hover:border-primary-500/50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 rounded-xl font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </button>

            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 p-2 bg-dark-400 rounded-xl border border-white/10 z-10"
              >
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-300 transition-colors"
                >
                  <FileSpreadsheet className="w-5 h-5 text-green-400" />
                  <span className="text-white">Export CSV</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-300 transition-colors"
                >
                  <FileText className="w-5 h-5 text-red-400" />
                  <span className="text-white">Export PDF</span>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-300 transition-colors"
                >
                  <FileJson className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">Export JSON</span>
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-300 transition-colors"
                >
                  <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Export Excel</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-dark-400/50 rounded-xl w-fit">
        {[
          { id: 'transactions', label: 'Transactions', icon: Activity },
          { id: 'gas', label: 'Gas Analytics', icon: Fuel },
          { id: 'performance', label: 'Performance', icon: Cpu },
          { id: 'activity', label: 'User Activity', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AnalyticsTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Transactions Analytics */}
        {activeTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Transactions"
                value="8,500"
                change="+12.5%"
                trend="up"
                icon={Activity}
                color="primary"
              />
              <StatCard
                title="Success Rate"
                value="96.5%"
                change="+0.5%"
                trend="up"
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title="Total Volume"
                value="$850,000"
                change="+8.3%"
                trend="up"
                icon={BarChart3}
                color="cyan"
              />
              <StatCard
                title="Unique Users"
                value="2,000"
                change="+15%"
                trend="up"
                icon={Users}
                color="pink"
              />
            </div>

            {/* Transaction Chart Placeholder */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Transaction Volume</h3>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chart visualization would go here</p>
                  <p className="text-sm">(Integrate with Chart.js or Recharts)</p>
                </div>
              </div>
            </div>

            {/* Transaction Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4">Transaction Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-gray-300">Successful</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">8,200</span>
                      <span className="text-green-400 text-sm">96.5%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-dark-500 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '96.5%' }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-gray-300">Failed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">300</span>
                      <span className="text-red-400 text-sm">3.5%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-dark-500 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '3.5%' }} />
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4">Top Token Transfers</h3>
                <div className="space-y-3">
                  {['POL', 'USDC', 'USDT', 'WETH'].map((token, index) => (
                    <div key={token} className="flex items-center justify-between p-3 bg-dark-400/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-6">#{index + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs font-bold">
                          {token[0]}
                        </div>
                        <span className="font-medium text-white">{token}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{(Math.random() * 1000).toFixed(0)}K</div>
                        <div className="text-xs text-gray-400">transfers</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Gas Analytics */}
        {activeTab === 'gas' && (
          <motion.div
            key="gas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Gas Price Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Avg Gas Price"
                value="25 Gwei"
                change="-5%"
                trend="down"
                icon={Fuel}
                color="primary"
              />
              <StatCard
                title="Gas Used"
                value="1.25M"
                change="+3%"
                trend="up"
                icon={Zap}
                color="yellow"
              />
              <StatCard
                title="Gas Utilization"
                value="65%"
                change="+2%"
                trend="up"
                icon={Activity}
                color="cyan"
              />
              <StatCard
                title="Avg Fee"
                value="$0.025"
                change="-10%"
                trend="down"
                icon={TrendingDown}
                color="green"
              />
            </div>

            {/* Suggested Gas Prices */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Suggested Gas Prices</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-dark-400/30 rounded-xl border border-gray-500/20 text-center">
                  <div className="text-gray-400 text-sm mb-2">🐢 Slow</div>
                  <div className="text-2xl font-bold text-white">18</div>
                  <div className="text-gray-400 text-sm">Gwei</div>
                  <div className="text-xs text-gray-500 mt-1">~5 min</div>
                </div>
                <div className="p-4 bg-dark-400/30 rounded-xl border border-blue-500/20 text-center">
                  <div className="text-blue-400 text-sm mb-2">🚗 Standard</div>
                  <div className="text-2xl font-bold text-white">25</div>
                  <div className="text-gray-400 text-sm">Gwei</div>
                  <div className="text-xs text-gray-500 mt-1">~2 min</div>
                </div>
                <div className="p-4 bg-dark-400/30 rounded-xl border border-primary-500/20 text-center">
                  <div className="text-primary-400 text-sm mb-2">🚀 Fast</div>
                  <div className="text-2xl font-bold text-white">35</div>
                  <div className="text-gray-400 text-sm">Gwei</div>
                  <div className="text-xs text-gray-500 mt-1">~30 sec</div>
                </div>
                <div className="p-4 bg-dark-400/30 rounded-xl border border-accent-pink/20 text-center">
                  <div className="text-accent-pink text-sm mb-2">⚡ Instant</div>
                  <div className="text-2xl font-bold text-white">50</div>
                  <div className="text-gray-400 text-sm">Gwei</div>
                  <div className="text-xs text-gray-500 mt-1">~15 sec</div>
                </div>
              </div>
            </div>

            {/* Gas Chart Placeholder */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Gas Price Trend</h3>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Gas price chart would go here</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Performance Analytics */}
        {activeTab === 'performance' && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Avg Block Time"
                value="2.1s"
                change="-0.1s"
                trend="down"
                icon={Clock}
                color="primary"
              />
              <StatCard
                title="Avg TPS"
                value="150"
                change="+25"
                trend="up"
                icon={Zap}
                color="cyan"
              />
              <StatCard
                title="Uptime"
                value="99.95%"
                change="+0.01%"
                trend="up"
                icon={Server}
                color="green"
              />
              <StatCard
                title="Blocks Produced"
                value="5,000"
                change="+500"
                trend="up"
                icon={Layers}
                color="pink"
              />
            </div>

            {/* Chain Performance Table */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Chain Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-white/5">
                      <th className="pb-3 font-medium">Chain</th>
                      <th className="pb-3 font-medium">Blocks</th>
                      <th className="pb-3 font-medium">Avg Block Time</th>
                      <th className="pb-3 font-medium">TPS (Avg/Max)</th>
                      <th className="pb-3 font-medium">Uptime</th>
                      <th className="pb-3 font-medium">Incidents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_CHAIN_PERFORMANCE.map((chain) => (
                      <tr key={chain.chainId} className="border-b border-white/5">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center text-xs font-bold">
                              {chain.chainName[0]}
                            </div>
                            <span className="text-white font-medium">{chain.chainName}</span>
                          </div>
                        </td>
                        <td className="py-4 text-white">{chain.blocksProduced.toLocaleString()}</td>
                        <td className="py-4 text-white">{chain.avgBlockTime}s</td>
                        <td className="py-4 text-white">{chain.tpsAvg} / {chain.tpsMax}</td>
                        <td className="py-4">
                          <span className={`${chain.uptime >= 99.9 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {chain.uptime}%
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            chain.incidents === 0 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {chain.incidents}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ResourceCard
                title="CPU Usage"
                value={45}
                max={100}
                unit="%"
                icon={Cpu}
                color="primary"
              />
              <ResourceCard
                title="Storage Used"
                value={25}
                max={100}
                unit="GB"
                icon={HardDrive}
                color="cyan"
              />
              <ResourceCard
                title="Bandwidth Used"
                value={150}
                max={500}
                unit="GB"
                icon={Activity}
                color="pink"
              />
            </div>
          </motion.div>
        )}

        {/* User Activity */}
        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Activity Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="API Calls"
                value="12,500"
                change="+15%"
                trend="up"
                icon={Zap}
                color="primary"
              />
              <StatCard
                title="Dashboard Views"
                value="250"
                change="+8%"
                trend="up"
                icon={Activity}
                color="cyan"
              />
              <StatCard
                title="Logins"
                value="45"
                change="+5%"
                trend="up"
                icon={Users}
                color="pink"
              />
            </div>

            {/* Activity Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { action: 'Created new chain', time: '2 hours ago', type: 'chain' },
                    { action: 'Added validator', time: '5 hours ago', type: 'validator' },
                    { action: 'Bridge transaction', time: '1 day ago', type: 'bridge' },
                    { action: 'Updated chain config', time: '2 days ago', type: 'config' },
                    { action: 'API key generated', time: '3 days ago', type: 'api' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-dark-400/30 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.type === 'chain' ? 'bg-primary-500/20' :
                        activity.type === 'validator' ? 'bg-green-500/20' :
                        activity.type === 'bridge' ? 'bg-cyan-500/20' :
                        activity.type === 'config' ? 'bg-yellow-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        <Activity className={`w-5 h-5 ${
                          activity.type === 'chain' ? 'text-primary-400' :
                          activity.type === 'validator' ? 'text-green-400' :
                          activity.type === 'bridge' ? 'text-cyan-400' :
                          activity.type === 'config' ? 'text-yellow-400' :
                          'text-purple-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{activity.action}</div>
                        <div className="text-gray-400 text-sm">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4">Activity Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-dark-400/30 rounded-xl">
                    <span className="text-gray-400">Chains Created</span>
                    <span className="text-white font-medium">2</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-400/30 rounded-xl">
                    <span className="text-gray-400">Validators Added</span>
                    <span className="text-white font-medium">5</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-400/30 rounded-xl">
                    <span className="text-gray-400">Bridge Transactions</span>
                    <span className="text-white font-medium">15</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-400/30 rounded-xl">
                    <span className="text-gray-400">Config Updates</span>
                    <span className="text-white font-medium">8</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-400/30 rounded-xl">
                    <span className="text-gray-400">API Keys Created</span>
                    <span className="text-white font-medium">3</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color 
}: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: any
  color: 'primary' | 'green' | 'cyan' | 'pink' | 'yellow'
}) {
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-500/5 border-primary-500/20',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/20',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
  }

  const iconColorClasses = {
    primary: 'text-primary-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    pink: 'text-pink-400',
    yellow: 'text-yellow-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-6 border bg-gradient-to-br ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl bg-dark-400/50`}>
          <Icon className={`w-5 h-5 ${iconColorClasses[color]}`} />
        </div>
        <div className={`flex items-center gap-1 text-sm ${
          trend === 'up' ? 'text-green-400' : 'text-red-400'
        }`}>
          {trend === 'up' ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {change}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </motion.div>
  )
}

// Resource Card Component
function ResourceCard({
  title,
  value,
  max,
  unit,
  icon: Icon,
  color
}: {
  title: string
  value: number
  max: number
  unit: string
  icon: any
  color: 'primary' | 'cyan' | 'pink'
}) {
  const percentage = (value / max) * 100
  
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    cyan: 'from-cyan-500 to-cyan-600',
    pink: 'from-pink-500 to-pink-600',
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-gray-400" />
        <h4 className="font-medium text-white">{title}</h4>
      </div>
      <div className="text-3xl font-bold text-white mb-2">
        {value} <span className="text-lg text-gray-400">{unit}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <span>of {max} {unit}</span>
        <span>({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full h-2 bg-dark-500 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}


