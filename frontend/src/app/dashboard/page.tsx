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
import { ethers } from 'ethers'

const CHAIN_FACTORY_ABI = [
  "function getChain(uint256 _chainId) external view returns (uint256 id, address owner, string memory name, string memory chainType, string memory rollupType, string memory gasToken, uint256 validators, uint256 createdAt, bool isActive, string memory rpcUrl, string memory explorerUrl)",
  "function getUserChains(address _user) external view returns (uint256[] memory)",
  "function getTotalChains() external view returns (uint256)"
]

export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected, balance, disconnect, chainId } = useWallet()
  const [chains, setChains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOnChain, setLoadingOnChain] = useState(false)

  useEffect(() => {
    // Load chains from localStorage
    loadChains()
    // Load chains from blockchain if wallet is connected
    if (isConnected && address) {
      loadChainsFromBlockchain()
    }
  }, [router, isConnected, address, chainId])

  const loadChains = () => {
    try {
      const storedChains = localStorage.getItem('userChains')
      if (storedChains) {
        const localChains = JSON.parse(storedChains)
        setChains(localChains)
      }
    } catch (error) {
      console.error('Error loading chains:', error)
    }
  }

  const loadChainsFromBlockchain = async () => {
    if (!window.ethereum || !address) return
    
    const contractAddress = process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      console.warn('ChainFactory contract address not configured')
      return
    }

    // Only load from blockchain if on Polygon network
    if (chainId !== 137 && chainId !== 80002) {
      return
    }

    setLoadingOnChain(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(contractAddress, CHAIN_FACTORY_ABI, provider)
      
      // Get user's chain IDs from blockchain
      const chainIds = await contract.getUserChains(address)
      
      // Fetch details for each chain
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
              blockchainTxHash: null, // We don't have this from the contract
              blockchainChainId: chainId
            }
          } catch (error) {
            console.error(`Error fetching chain ${chainId}:`, error)
            return null
          }
        })
      )

      // Filter out nulls and merge with local chains
      const validBlockchainChains = blockchainChains.filter(c => c !== null)
      
      // Merge with local chains, prioritizing blockchain data but preserving local metadata
      const localChains = JSON.parse(localStorage.getItem('userChains') || '[]')
      const mergedChains = validBlockchainChains.map((blockchainChain: any) => {
        // Find matching local chain to preserve metadata like polygonScanUrl and blockchainTxHash
        const matchingLocalChain = localChains.find((lc: any) => {
          const lcId = String(lc.id || '')
          const bcId = String(blockchainChain.id || '')
          return lcId === bcId || 
                 lcId === `chain-${blockchainChain.blockchainChainId?.toString()}` ||
                 lc.blockchainChainId?.toString() === blockchainChain.blockchainChainId?.toString()
        })
        
        if (matchingLocalChain) {
          // Merge blockchain data with local metadata
          return {
            ...blockchainChain,
            polygonScanUrl: matchingLocalChain.polygonScanUrl || blockchainChain.polygonScanUrl,
            blockchainTxHash: matchingLocalChain.blockchainTxHash || blockchainChain.blockchainTxHash,
            transactions: matchingLocalChain.transactions || blockchainChain.transactions
          }
        }
        return blockchainChain
      })
      
      // Add local chains that aren't on blockchain
      localChains.forEach((localChain: any) => {
        if (!localChain.onChainRegistered || !validBlockchainChains.find(bc => {
          const bcId = String(bc.id || '')
          const lcId = String(localChain.id || '')
          return bcId === lcId || 
                 bcId === `chain-${localChain.blockchainChainId?.toString()}` ||
                 bc.blockchainChainId?.toString() === localChain.blockchainChainId?.toString()
        })) {
          mergedChains.push({
            ...localChain,
            onChainRegistered: localChain.onChainRegistered || false
          })
        }
      })

      setChains(mergedChains)
    } catch (error) {
      console.error('Error loading chains from blockchain:', error)
      // Fallback to local chains only
      loadChains()
    } finally {
      setLoadingOnChain(false)
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    if (isConnected) {
      disconnect()
      toast.success('Wallet disconnected')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!', {
      icon: '📋',
    })
  }

  const getPolygonScanUrl = (txHash: string) => {
    if (chainId === 137) {
      return `https://polygonscan.com/tx/${txHash}`
    } else if (chainId === 80002) {
      return `https://amoy.polygonscan.com/tx/${txHash}`
    }
    return null
  }

  const handleExternalLink = (chain: any, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // If chain has a polygonScanUrl, use it
    if (chain.polygonScanUrl) {
      window.open(chain.polygonScanUrl, '_blank', 'noopener,noreferrer')
      return
    }
    
    // If chain has a blockchainTxHash, construct the Polyscan URL
    if (chain.blockchainTxHash) {
      const scanUrl = getPolygonScanUrl(chain.blockchainTxHash)
      if (scanUrl) {
        window.open(scanUrl, '_blank', 'noopener,noreferrer')
        return
      }
    }
    
    // If chain has an explorerUrl, use it
    if (chain.explorerUrl) {
      window.open(chain.explorerUrl, '_blank', 'noopener,noreferrer')
      return
    }
    
    // If chain has a blockchainChainId, try to construct a Polyscan chain ID URL
    if (chain.blockchainChainId) {
      const chainIdNum = typeof chain.blockchainChainId === 'bigint' 
        ? Number(chain.blockchainChainId) 
        : parseInt(chain.blockchainChainId)
      
      if (chainId === 137) {
        window.open(`https://polygonscan.com/address/${chainIdNum}`, '_blank', 'noopener,noreferrer')
      } else if (chainId === 80002) {
        window.open(`https://amoy.polygonscan.com/address/${chainIdNum}`, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const stats = [
    {
      label: 'Total Chains',
      value: chains.length,
      icon: <Globe className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-purple-500 to-pink-500',
      change: `${chains.filter(c => c.onChainRegistered).length} On-Chain`
    },
    {
      label: 'Active Chains',
      value: chains.filter(c => c.status === 'active' || c.isActive).length,
      icon: <Activity className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-cyan-500 to-blue-500',
      change: `${chains.filter(c => (c.status === 'active' || c.isActive) && c.onChainRegistered).length} On-Chain`
    },
    {
      label: 'On-Chain Registered',
      value: chains.filter(c => c.onChainRegistered).length,
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-green-500 to-emerald-500',
      change: `${chains.filter(c => !c.onChainRegistered).length} Local Only`
    },
    {
      label: 'Total Validators',
      value: chains.reduce((acc, c) => acc + (parseInt(c.validators || c.initialValidators || '0')), 0),
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-orange-500 to-red-500',
      change: `${chains.filter(c => c.onChainRegistered).reduce((acc, c) => acc + (parseInt(c.validators || '0')), 0)} On-Chain`
    }
  ]


  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Welcome to <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">PolyOne Labs</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400">Manage your blockchain networks</p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all flex items-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          )}
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

          <Link href="/dashboard/analytics">
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
          </Link>
        </div>

        {/* Your Chains */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Your Blockchains</h2>
            <div className="flex items-center gap-2">
              {loadingOnChain && (
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Loading from blockchain...
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
                className="text-purple-400 hover:text-purple-300 flex items-center gap-2 text-sm sm:text-base transition-colors"
                disabled={loadingOnChain}
              >
                <Activity className="w-4 h-4" />
                Refresh
              </button>
              <Link 
                href="/dashboard/create"
                className="text-purple-400 hover:text-purple-300 flex items-center gap-2 text-sm sm:text-base transition-colors"
              >
                Create New
                <Plus className="w-4 h-4" />
              </Link>
            </div>
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
                  className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-purple-500/50 transition-all group cursor-pointer"
                  onClick={() => {
                    const safeId = encodeURIComponent(String(chain.id || ''))
                    router.push(`/dashboard/chains/${safeId}`)
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Globe className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/dashboard/chains/${encodeURIComponent(String(chain.id || ''))}`}>
                            <h3 className="text-base sm:text-lg font-bold hover:text-purple-400 transition-colors">{chain.name}</h3>
                          </Link>
                          {chain.onChainRegistered && (
                            <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-xs font-semibold">
                              ✓ On-Chain
                            </span>
                          )}
                          {!chain.onChainRegistered && (
                            <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
                              Local Only
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-400 mb-2">
                          <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 capitalize">
                            {chain.chainType}
                          </span>
                          <span className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-400">
                            {chain.rollupType}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{chain.gasToken} Gas Token</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                          <div className="text-xs">
                            <span className="text-gray-500">Chain ID:</span>
                            <span className="text-white ml-1 font-semibold">{chain.chainId || 'N/A'}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">Validators:</span>
                            <span className="text-white ml-1 font-semibold">{chain.validators || chain.initialValidators || 'N/A'}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">Status:</span>
                            <span className={`ml-1 font-semibold ${chain.status === 'active' || chain.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                              {chain.status === 'active' || chain.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {chain.transactions !== undefined && (
                            <div className="text-xs">
                              <span className="text-gray-500">TXs:</span>
                              <span className="text-white ml-1 font-semibold">{chain.transactions || 0}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created {new Date(chain.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link 
                        href={`/dashboard/chains/${encodeURIComponent(String(chain.id || ''))}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all text-xs sm:text-sm">
                          <Activity className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(chain.rpcUrl || 'https://rpc.example.com')
                        }}
                        className="px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all text-xs sm:text-sm"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleExternalLink(chain, e)}
                        className="px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all text-xs sm:text-sm"
                        disabled={!chain.polygonScanUrl && !chain.blockchainTxHash && !chain.explorerUrl && !chain.blockchainChainId}
                      >
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
