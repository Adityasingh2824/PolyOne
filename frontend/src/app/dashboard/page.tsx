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
  Globe,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  BarChart3,
  Cpu,
  Network,
  Layers,
  Server,
  Clock,
  Shield,
  Users,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { useWallet } from '@/hooks/useWallet'
import { PRIMARY_CHAIN_ID, polygonMainnet } from '@/lib/chains'
import { ethers } from 'ethers'
import { apiClient } from '@/lib/api'

const CHAIN_FACTORY_ABI = [
  "function getChain(uint256 _chainId) external view returns (tuple(uint256 id, address owner, string name, string chainType, string rollupType, string gasToken, uint256 validators, uint256 createdAt, bool isActive, string rpcUrl, string explorerUrl))",
  "function getUserChains(address _user) external view returns (uint256[])",
  "function getTotalChains() external view returns (uint256)"
]

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, change, gradient, delay }: {
  icon: any
  label: string
  value: string | number
  change: string
  gradient: string
  delay: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="glass-card p-6 group"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-xs font-medium text-primary-400 flex items-center gap-1">
        <ArrowUpRight className="w-3 h-3" />
        {change}
      </span>
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </motion.div>
)

// Quick Action Card Component
const QuickActionCard = ({ 
  icon: Icon, 
  title, 
  description, 
  href, 
  gradient, 
  delay 
}: {
  icon: any
  title: string
  description: string
  href: string
  gradient: string
  delay: number
}) => (
  <Link href={href}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-6 h-full group cursor-pointer relative overflow-hidden"
    >
      {/* Hover gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-dense opacity-10" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-glow-purple group-hover:shadow-glow-lg transition-shadow`}
            whileHover={{ rotate: 5, scale: 1.1 }}
          >
            <Icon className="w-7 h-7 text-white" />
          </motion.div>
          <motion.div
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
            whileHover={{ x: 5 }}
          >
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </motion.div>
        </div>
        
        <h3 className="text-xl font-bold mb-2 group-hover:text-gradient transition-all">{title}</h3>
        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{description}</p>
      </div>
    </motion.div>
  </Link>
)

// Chain Card Component
const ChainCard = ({ chain, index, onClick, onCopy, onExternal }: {
  chain: any
  index: number
  onClick: () => void
  onCopy: (text: string) => void
  onExternal: () => void
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ y: -4 }}
    className="glass-card p-6 group cursor-pointer relative overflow-hidden"
    onClick={onClick}
  >
    {/* Hover effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-pink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="relative z-10">
      <div className="flex items-start gap-4">
        <motion.div 
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center shadow-glow-purple flex-shrink-0"
          whileHover={{ rotate: 5, scale: 1.1 }}
        >
          <Globe className="w-7 h-7 text-white" />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg truncate group-hover:text-gradient transition-all">
              {chain.name}
            </h3>
            {chain.onChainRegistered && (
              <span className="badge badge-success text-xs">On-Chain</span>
            )}
            {!chain.onChainRegistered && (
              <span className="badge badge-warning text-xs">Local</span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge badge-purple">{chain.chainType}</span>
            <span className="badge badge-info">{chain.rollupType}</span>
            <span className="text-xs text-gray-500">{chain.gasToken} Gas</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2 rounded-lg bg-white/5">
              <div className="text-gray-500 mb-1">Chain ID</div>
              <div className="font-semibold font-mono text-[10px] truncate" title={chain.id || chain.chainId || 'N/A'}>
                {chain.id ? chain.id.substring(0, 8) + '...' : (chain.chainId || 'N/A')}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <div className="text-gray-500 mb-1">Validators</div>
              <div className="font-semibold">
                {chain.validator_count || chain.validators || chain.initialValidators || 0}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <div className="text-gray-500 mb-1">Status</div>
              <div className={`font-semibold ${
                chain.status === 'active' || chain.isActive 
                  ? 'text-accent-emerald' 
                  : chain.status === 'deploying'
                  ? 'text-yellow-400'
                  : 'text-gray-400'
              }`}>
                {chain.status === 'active' || chain.isActive 
                  ? '● Active' 
                  : chain.status === 'deploying'
                  ? '● Deploying'
                  : chain.status === 'failed'
                  ? '● Failed'
                  : '○ Inactive'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <div className="text-gray-500 mb-1">Created</div>
              <div className="font-semibold">
                {chain.created_at || chain.createdAt 
                  ? new Date(chain.created_at || chain.createdAt).toLocaleDateString() 
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
        <button
          onClick={(e) => { e.stopPropagation(); onCopy(chain.rpcUrl || ''); }}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center gap-2 transition-all"
        >
          <Copy className="w-4 h-4" />
          RPC
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center gap-2 transition-all"
        >
          <Activity className="w-4 h-4" />
          Details
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onExternal(); }}
          disabled={!chain.polygonScanUrl && !chain.blockchainTxHash && !chain.explorerUrl}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <ExternalLink className="w-4 h-4" />
          Explorer
        </button>
      </div>
    </div>
  </motion.div>
)

export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected, balance, chainId, tokenSymbol, getProvider, disconnect } = useWallet()
  const [chains, setChains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOnChain, setLoadingOnChain] = useState(false)

  const handleDisconnect = async () => {
    try {
      await disconnect()
      toast.success('Wallet disconnected')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to disconnect wallet')
    }
  }

  useEffect(() => {
    loadChains()
    if (isConnected && address) {
      loadChainsFromBlockchain()
    }
    
    // Auto-refresh chains every 5 seconds to get status updates
    const refreshInterval = setInterval(() => {
      if (address) {
        loadChains()
      }
    }, 5000)
    
    return () => clearInterval(refreshInterval)
  }, [isConnected, address, chainId, getProvider])

  const loadChains = async () => {
    try {
      setLoading(true)
      
      // First, try to load from backend API
      if (address) {
        try {
          console.log('📡 Fetching chains from backend for address:', address)
          const response = await apiClient.chains.getAll(address)
          console.log('📦 Backend response:', response.data)
          
          const backendChains = response.data?.chains || []
          console.log('✅ Loaded chains from backend:', backendChains.length)
          
          // Always use backend data (even if empty) and save to localStorage as backup
          setChains(backendChains)
          localStorage.setItem('userChains', JSON.stringify(backendChains))
          return
        } catch (apiError) {
          console.error('❌ Error loading chains from backend:', apiError)
          console.warn('Falling back to localStorage')
          // Only fall back to localStorage if API call fails
        }
      }
      
      // Fallback to localStorage
      const storedChains = localStorage.getItem('userChains')
      if (storedChains) {
        const localChains = JSON.parse(storedChains)
        console.log('Loaded chains from localStorage:', localChains.length)
        setChains(localChains)
      } else {
        setChains([])
      }
    } catch (error) {
      console.error('Error loading chains:', error)
      setChains([])
    } finally {
      setLoading(false)
    }
  }

  const loadChainsFromBlockchain = async () => {
    if (!address) return
    
    const contractAddress = process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      console.warn('ChainFactory contract address not configured')
      return
    }

    if (chainId !== polygonMainnet.id && chainId !== PRIMARY_CHAIN_ID) {
      return
    }

    setLoadingOnChain(true)
    try {
      const eip1193Provider = await getProvider()
      const provider = new ethers.BrowserProvider(eip1193Provider)

      const code = await provider.getCode(contractAddress)
      if (!code || code === '0x' || code === '0x0') {
        console.warn('ChainFactory contract not found')
        setLoading(false)
        setLoadingOnChain(false)
        return
      }

      const contract = new ethers.Contract(contractAddress, CHAIN_FACTORY_ABI, provider)
      const chainIds = await contract.getUserChains(address)
      
      const blockchainChains = await Promise.all(
        chainIds.map(async (chainId: bigint) => {
          try {
            const chainData = await contract.getChain(chainId)
            return {
              id: `chain-${chainId.toString()}`,
              chainId: chainId.toString(),
              name: chainData.name,
              chainType: chainData.chainType,
              rollupType: chainData.rollupType,
              gasToken: chainData.gasToken,
              validators: chainData.validators.toString(),
              owner: chainData.owner,
              isActive: chainData.isActive,
              rpcUrl: chainData.rpcUrl,
              explorerUrl: chainData.explorerUrl,
              createdAt: new Date(Number(chainData.createdAt) * 1000).toISOString(),
              status: chainData.isActive ? 'active' : 'inactive',
              onChainRegistered: true,
              blockchainChainId: chainId
            }
          } catch (error) {
            console.error(`Error fetching chain ${chainId}:`, error)
            return null
          }
        })
      )

      const validBlockchainChains = blockchainChains.filter(c => c !== null)
      const localChains = JSON.parse(localStorage.getItem('userChains') || '[]')
      
      const mergedChains = validBlockchainChains.map((blockchainChain: any) => {
        const matchingLocalChain = localChains.find((lc: any) => {
          return String(lc.id) === String(blockchainChain.id) || 
                 lc.blockchainChainId?.toString() === blockchainChain.blockchainChainId?.toString()
        })
        
        if (matchingLocalChain) {
          return {
            ...blockchainChain,
            polygonScanUrl: matchingLocalChain.polygonScanUrl,
            blockchainTxHash: matchingLocalChain.blockchainTxHash,
            transactions: matchingLocalChain.transactions
          }
        }
        return blockchainChain
      })
      
      localChains.forEach((localChain: any) => {
        if (!localChain.onChainRegistered) {
          mergedChains.push(localChain)
        }
      })

      setChains(mergedChains)
    } catch (error) {
      console.error('Error loading chains from blockchain:', error)
      loadChains()
    } finally {
      setLoadingOnChain(false)
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getPolygonScanUrl = (txHash: string) => {
    if (chainId === polygonMainnet.id) {
      return `https://polygonscan.com/tx/${txHash}`
    } else if (chainId === PRIMARY_CHAIN_ID) {
      return `https://amoy.polygonscan.com/tx/${txHash}`
    }
    return null
  }

  const handleExternalLink = (chain: any) => {
    if (chain.polygonScanUrl) {
      window.open(chain.polygonScanUrl, '_blank')
      return
    }
    if (chain.blockchainTxHash) {
      const scanUrl = getPolygonScanUrl(chain.blockchainTxHash)
      if (scanUrl) {
        window.open(scanUrl, '_blank')
        return
      }
    }
    if (chain.explorerUrl) {
      window.open(chain.explorerUrl, '_blank')
    }
  }

  // Calculate stats
  const totalChains = chains.length
  const activeChains = chains.filter(c => c.status === 'active' || c.isActive).length
  const onChainChains = chains.filter(c => c.onChainRegistered).length
  const totalValidators = chains.reduce((acc, c) => acc + (parseInt(c.validators || c.initialValidators || '0')), 0)

  const stats = [
    {
      icon: Network,
      label: 'Total Chains',
      value: totalChains,
      change: `${onChainChains} on-chain`,
      gradient: 'from-primary-500 to-primary-600',
    },
    {
      icon: Activity,
      label: 'Active Chains',
      value: activeChains,
      change: `${Math.round((activeChains / Math.max(totalChains, 1)) * 100)}%`,
      gradient: 'from-accent-emerald to-teal-500',
    },
    {
      icon: Layers,
      label: 'On-Chain',
      value: onChainChains,
      change: `${totalChains - onChainChains} local`,
      gradient: 'from-accent-cyan to-blue-500',
    },
    {
      icon: Server,
      label: 'Validators',
      value: totalValidators,
      change: 'total',
      gradient: 'from-accent-pink to-rose-500',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-3"
              >
                <span className="w-2 h-2 bg-accent-emerald rounded-full animate-pulse" />
                <span className="text-xs font-medium text-primary-300">Dashboard</span>
              </motion.div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                Welcome to <span className="text-gradient">PolyOne</span>
              </h1>
              <p className="text-gray-400 flex items-center gap-2">
                <Network className="w-4 h-4" />
                Manage your blockchain networks
                <span className="text-primary-400">•</span>
                <span className="text-primary-300 font-semibold">{chains.length} chains deployed</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Wallet Status */}
        {isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 relative overflow-hidden group"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-grid-dense opacity-10" />
            <motion.div 
              className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/20 via-accent-pink/10 to-accent-cyan/10 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <div className="relative z-10">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-lg relative overflow-hidden">
                      <Wallet className="w-8 h-8 text-white relative z-10" />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                        animate={{ 
                          x: ['-100%', '100%'],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent-emerald rounded-full border-4 border-dark-600 shadow-lg"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3 text-white absolute inset-0 m-auto" />
                    </motion.div>
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Connected Wallet</span>
                      <motion.div
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-emerald/20 border border-accent-emerald/30"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        <div className="w-1.5 h-1.5 bg-accent-emerald rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-accent-emerald">Active</span>
                      </motion.div>
                    </div>
                    <motion.div 
                      className="font-mono text-base font-semibold text-gradient cursor-pointer group/address"
                      onClick={() => address && copyToClipboard(address)}
                      whileHover={{ scale: 1.02 }}
                      title="Click to copy"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate">{address}</span>
                        <Copy className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover/address:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                    {chainId && (
                      <div className="mt-1.5 text-xs text-gray-500">
                        Network: {chainId === polygonMainnet.id ? 'Polygon Mainnet' : chainId === PRIMARY_CHAIN_ID ? 'Polygon Amoy' : `Chain ${chainId}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Balance Card */}
              {balance && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-white/10 via-primary-500/5 to-accent-pink/5 border border-white/10 hover:border-primary-500/30 transition-all group/balance"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 opacity-0 group-hover/balance:opacity-100 transition-opacity" 
                    style={{ transform: 'translateX(-100%)' }}
                  />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center border border-primary-500/20">
                        <Zap className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">Available Balance</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-white">
                            {parseFloat(balance).toFixed(4)}
                          </span>
                          <span className="text-sm font-semibold text-primary-400">
                            {tokenSymbol ?? 'POL'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => address && copyToClipboard(address)}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary-500/30 transition-all"
                      title="Copy address"
                    >
                      <Copy className="w-4 h-4 text-gray-400 hover:text-primary-400 transition-colors" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4">
                <motion.button
                  onClick={() => address && copyToClipboard(address)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 hover:bg-primary-500/10 text-sm font-medium transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <Copy className="w-4 h-4 group-hover/btn:text-primary-400 transition-colors" />
                  <span className="group-hover/btn:text-primary-300 transition-colors">Copy Address</span>
                </motion.button>
                <motion.button
                  onClick={handleDisconnect}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-sm font-medium transition-all flex items-center justify-center gap-2 group/disconnect"
                >
                  <LogOut className="w-4 h-4 group-hover/disconnect:text-red-400 transition-colors" />
                  <span className="group-hover/disconnect:text-red-400 transition-colors">Disconnect</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border-accent-amber/20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-amber/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-accent-amber" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Wallet Not Connected</h3>
                  <p className="text-sm text-gray-400">Connect your wallet to access all features</p>
                </div>
              </div>
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold shadow-glow-purple"
                >
                  Connect Wallet
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} delay={i * 0.1} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <QuickActionCard
            icon={Sparkles}
            title="Browse Templates"
            description="Deploy from pre-configured templates"
            href="/dashboard/templates"
            gradient="from-purple-500 to-pink-500"
            delay={0.2}
          />
          <QuickActionCard
            icon={Plus}
            title="Launch New Chain"
            description="Deploy a custom Polygon-based blockchain in minutes"
            href="/dashboard/create"
            gradient="from-primary-500 to-accent-pink"
            delay={0.3}
          />
          <QuickActionCard
            icon={BarChart3}
            title="View Analytics"
            description="Monitor your chains' performance and metrics"
            href="/dashboard/analytics"
            gradient="from-accent-cyan to-blue-500"
            delay={0.4}
          />
        </div>

        {/* Chains Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Blockchains</h2>
            <div className="flex items-center gap-3">
              {loadingOnChain && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <motion.div
                    className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Syncing...
                </div>
              )}
              <button
                onClick={() => {
                  if (isConnected && address) {
                    loadChainsFromBlockchain()
                  } else {
                    loadChains()
                  }
                }}
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-2 transition-colors"
                disabled={loadingOnChain}
              >
                <Activity className="w-4 h-4" />
                Refresh
              </button>
              <Link 
                href="/dashboard/create"
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-2 transition-colors"
              >
                Create New
                <Plus className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : chains.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center">
                <Rocket className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Chains Yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Create your first blockchain to get started with PolyOne
              </p>
              <Link href="/dashboard/create">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-pink font-bold shadow-glow-lg flex items-center gap-2 mx-auto"
                >
                  <Rocket className="w-5 h-5" />
                  Launch Your First Chain
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {chains.map((chain, i) => (
                <ChainCard
                  key={chain.id || i}
                  chain={chain}
                  index={i}
                  onClick={() => router.push(`/dashboard/chains/${encodeURIComponent(String(chain.id || ''))}`)}
                  onCopy={copyToClipboard}
                  onExternal={() => handleExternalLink(chain)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
