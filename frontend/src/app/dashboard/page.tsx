'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Rocket, 
  Activity, 
  Zap, 
  Copy, 
  ExternalLink,
  Plus,
  TrendingUp,
  Users,
  Globe,
  ChevronRight,
  Wallet,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { useWallet } from '@/hooks/useWallet'

export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected, balance, disconnect } = useWallet()
  const [chains, setChains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check authentication
    const isAuth = localStorage.getItem('isAuthenticated')
    const userData = localStorage.getItem('user')
    
    if (!isAuth) {
      toast.error('Please login first')
      router.push('/auth/login')
      return
    }

    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Load chains from localStorage
    loadChains()
  }, [router])

  const loadChains = () => {
    setLoading(true)
    try {
      const storedChains = localStorage.getItem('userChains')
      if (storedChains) {
        setChains(JSON.parse(storedChains))
      }
    } catch (error) {
      console.error('Error loading chains:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
    if (isConnected) {
      disconnect()
    }
    toast.success('Logged out successfully')
    router.push('/')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!', {
      icon: '📋',
    })
  }

  const stats = [
    {
      label: 'Total Chains',
      value: chains.length,
      icon: <Globe className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-purple-500 to-pink-500',
      change: '+12%'
    },
    {
      label: 'Active Chains',
      value: chains.filter(c => c.status === 'active').length,
      icon: <Activity className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-cyan-500 to-blue-500',
      change: '+5%'
    },
    {
      label: 'Total Transactions',
      value: chains.reduce((acc, c) => acc + (c.transactions || 0), 0).toLocaleString(),
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-green-500 to-emerald-500',
      change: '+18%'
    },
    {
      label: 'Network Users',
      value: '1.2K',
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-orange-500 to-red-500',
      change: '+24%'
    }
  ]

  if (!user) {
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

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Welcome back, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{user.name}</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400">{user.company} • {user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Wallet Status */}
        {isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-purple-500/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">Connected Wallet</div>
                <div className="font-mono text-sm sm:text-base lg:text-lg font-semibold truncate">{address}</div>
                {balance && (
                  <div className="text-xs sm:text-sm text-gray-400 mt-1">
                    Balance: {parseFloat(balance).toFixed(4)} MATIC
                  </div>
                )}
              </div>
              <button
                onClick={() => address && copyToClipboard(address)}
                className="self-start sm:self-center px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all flex items-center gap-2 text-sm"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-orange-500/20"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base sm:text-lg mb-1">Wallet Not Connected</h3>
                <p className="text-xs sm:text-sm text-gray-400">Connect your wallet to interact with blockchain features</p>
              </div>
              <Link
                href="/"
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all whitespace-nowrap text-sm"
              >
                Connect Wallet
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-white/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <span className="text-xs sm:text-sm text-green-400 font-semibold">{stat.change}</span>
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <Link href="/dashboard/create">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Launch New Chain</h3>
              <p className="text-xs sm:text-sm text-gray-400">Deploy a custom Polygon-based blockchain in minutes</p>
            </motion.div>
          </Link>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-cyan-500/30 hover:border-cyan-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">View Analytics</h3>
            <p className="text-xs sm:text-sm text-gray-400">Monitor your chains' performance and metrics</p>
          </motion.div>
        </div>

        {/* Your Chains */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Your Blockchains</h2>
            <Link 
              href="/dashboard/create"
              className="text-purple-400 hover:text-purple-300 flex items-center gap-2 text-sm sm:text-base transition-colors"
            >
              Create New
              <Plus className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <motion.div
                className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : chains.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 sm:py-20"
            >
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Rocket className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">No Chains Yet</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">Create your first blockchain to get started</p>
              <Link
                href="/dashboard/create"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all text-sm sm:text-base"
              >
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                Launch Your First Chain
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {chains.map((chain, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-purple-500/50 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Globe className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold mb-1">{chain.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-400">
                          <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 capitalize">
                            {chain.chainType}
                          </span>
                          <span className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-400">
                            {chain.rollupType}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{chain.gasToken} Gas Token</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Created {new Date(chain.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => copyToClipboard(chain.rpcUrl || 'https://rpc.example.com')}
                        className="px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all text-xs sm:text-sm"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all text-xs sm:text-sm">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
