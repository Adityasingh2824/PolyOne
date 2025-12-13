'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRightLeft, 
  ArrowDownUp, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Copy,
  Filter,
  Search,
  Info,
  Loader2,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import toast from 'react-hot-toast'

// Types
interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoUrl?: string
  balance?: string
}

interface Chain {
  id: number
  name: string
  logoUrl?: string
  explorerUrl: string
  bridgeContract: string
}

interface BridgeTransaction {
  id: string
  txType: 'deposit' | 'withdraw' | 'claim'
  status: 'pending' | 'processing' | 'ready_to_claim' | 'completed' | 'failed'
  token: Token
  amount: string
  fee: string
  sourceChain: Chain
  destinationChain: Chain
  sender: string
  recipient: string
  sourceTxHash?: string
  destinationTxHash?: string
  createdAt: Date
  completedAt?: Date
}

// Mock data
const SUPPORTED_TOKENS: Token[] = [
  { address: '0x0000...', symbol: 'POL', name: 'Polygon', decimals: 18, balance: '1000.00' },
  { address: '0x7ceB...', symbol: 'USDC', name: 'USD Coin', decimals: 6, balance: '500.00' },
  { address: '0xc2132...', symbol: 'USDT', name: 'Tether USD', decimals: 6, balance: '250.00' },
  { address: '0x2791...', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, balance: '0.5' },
]

const SUPPORTED_CHAINS: Chain[] = [
  { id: 1, name: 'Ethereum', explorerUrl: 'https://etherscan.io', bridgeContract: '0x...' },
  { id: 137, name: 'Polygon', explorerUrl: 'https://polygonscan.com', bridgeContract: '0x...' },
  { id: 80002, name: 'Polygon Amoy', explorerUrl: 'https://amoy.polygonscan.com', bridgeContract: '0x...' },
]

const MOCK_TRANSACTIONS: BridgeTransaction[] = [
  {
    id: '1',
    txType: 'deposit',
    status: 'completed',
    token: SUPPORTED_TOKENS[0],
    amount: '100',
    fee: '0.1',
    sourceChain: SUPPORTED_CHAINS[0],
    destinationChain: SUPPORTED_CHAINS[1],
    sender: '0x1234...5678',
    recipient: '0x1234...5678',
    sourceTxHash: '0xabc...def',
    destinationTxHash: '0x123...456',
    createdAt: new Date(Date.now() - 86400000),
    completedAt: new Date(Date.now() - 86000000),
  },
  {
    id: '2',
    txType: 'deposit',
    status: 'processing',
    token: SUPPORTED_TOKENS[1],
    amount: '500',
    fee: '0.5',
    sourceChain: SUPPORTED_CHAINS[1],
    destinationChain: SUPPORTED_CHAINS[2],
    sender: '0x1234...5678',
    recipient: '0x1234...5678',
    sourceTxHash: '0xdef...ghi',
    createdAt: new Date(Date.now() - 3600000),
  },
]

export default function BridgeInterface() {
  const { address, isConnected } = useWallet()
  
  // Bridge form state
  const [sourceChain, setSourceChain] = useState<Chain>(SUPPORTED_CHAINS[0])
  const [destinationChain, setDestinationChain] = useState<Chain>(SUPPORTED_CHAINS[1])
  const [selectedToken, setSelectedToken] = useState<Token>(SUPPORTED_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // UI state
  const [activeTab, setActiveTab] = useState<'bridge' | 'history' | 'fees'>('bridge')
  const [showTokenSelect, setShowTokenSelect] = useState(false)
  const [showSourceChainSelect, setShowSourceChainSelect] = useState(false)
  const [showDestChainSelect, setShowDestChainSelect] = useState(false)
  const [transactions, setTransactions] = useState<BridgeTransaction[]>(MOCK_TRANSACTIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Calculate estimated fee
  const estimatedFee = amount ? (parseFloat(amount) * 0.001).toFixed(4) : '0'
  const estimatedReceive = amount ? (parseFloat(amount) - parseFloat(estimatedFee)).toFixed(4) : '0'

  // Swap chains
  const swapChains = () => {
    const temp = sourceChain
    setSourceChain(destinationChain)
    setDestinationChain(temp)
  }

  // Handle bridge initiation
  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newTx: BridgeTransaction = {
        id: Date.now().toString(),
        txType: 'deposit',
        status: 'pending',
        token: selectedToken,
        amount,
        fee: estimatedFee,
        sourceChain,
        destinationChain,
        sender: address || '0x...',
        recipient: recipient || address || '0x...',
        createdAt: new Date(),
      }
      
      setTransactions(prev => [newTx, ...prev])
      setAmount('')
      setRecipient('')
      toast.success('Bridge transaction initiated!')
      setActiveTab('history')
    } catch (error) {
      toast.error('Failed to initiate bridge')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sourceTxHash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'processing': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'ready_to_claim': return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />
      case 'processing': return <Loader2 className="w-4 h-4 animate-spin" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'ready_to_claim': return <AlertCircle className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            Bridge
          </h1>
          <p className="text-gray-400 mt-1">Transfer tokens across chains securely</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-dark-400/50 rounded-xl">
          {[
            { id: 'bridge', label: 'Bridge', icon: ArrowRightLeft },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'fees', label: 'Fees', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
      </div>

      <AnimatePresence mode="wait">
        {/* Bridge Tab */}
        {activeTab === 'bridge' && (
          <motion.div
            key="bridge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Bridge Form */}
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-6 border border-white/5">
                {/* From Chain */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-400">From</label>
                  <div className="flex gap-4">
                    {/* Chain Selector */}
                    <div className="relative flex-1">
                      <button
                        onClick={() => setShowSourceChainSelect(!showSourceChainSelect)}
                        className="w-full flex items-center justify-between p-4 bg-dark-400/50 rounded-xl border border-white/5 hover:border-primary-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center text-xs font-bold">
                            {sourceChain.name[0]}
                          </div>
                          <span className="font-medium text-white">{sourceChain.name}</span>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </button>
                      
                      {showSourceChainSelect && (
                        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-dark-400 rounded-xl border border-white/10 z-10">
                          {SUPPORTED_CHAINS.map(chain => (
                            <button
                              key={chain.id}
                              onClick={() => {
                                setSourceChain(chain)
                                setShowSourceChainSelect(false)
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-300 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center text-xs font-bold">
                                {chain.name[0]}
                              </div>
                              <span className="text-white">{chain.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Token Selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowTokenSelect(!showTokenSelect)}
                        className="flex items-center gap-2 p-4 bg-dark-400/50 rounded-xl border border-white/5 hover:border-primary-500/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs font-bold">
                          {selectedToken.symbol[0]}
                        </div>
                        <span className="font-medium text-white">{selectedToken.symbol}</span>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </button>

                      {showTokenSelect && (
                        <div className="absolute top-full right-0 mt-2 w-64 p-2 bg-dark-400 rounded-xl border border-white/10 z-10">
                          {SUPPORTED_TOKENS.map(token => (
                            <button
                              key={token.address}
                              onClick={() => {
                                setSelectedToken(token)
                                setShowTokenSelect(false)
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-dark-300 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs font-bold">
                                  {token.symbol[0]}
                                </div>
                                <div className="text-left">
                                  <div className="text-white font-medium">{token.symbol}</div>
                                  <div className="text-gray-400 text-sm">{token.name}</div>
                                </div>
                              </div>
                              <span className="text-gray-400 text-sm">{token.balance}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-4 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-2xl font-bold text-white placeholder-gray-500"
                    />
                    <button
                      onClick={() => setAmount(selectedToken.balance || '0')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="text-sm text-gray-400">
                    Balance: {selectedToken.balance} {selectedToken.symbol}
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center py-4">
                  <button
                    onClick={swapChains}
                    className="p-3 rounded-xl bg-dark-400/50 border border-white/5 hover:border-primary-500/50 hover:bg-dark-300 transition-all group"
                  >
                    <ArrowDownUp className="w-5 h-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
                  </button>
                </div>

                {/* To Chain */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-400">To</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowDestChainSelect(!showDestChainSelect)}
                      className="w-full flex items-center justify-between p-4 bg-dark-400/50 rounded-xl border border-white/5 hover:border-primary-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center text-xs font-bold">
                          {destinationChain.name[0]}
                        </div>
                        <span className="font-medium text-white">{destinationChain.name}</span>
                      </div>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>

                    {showDestChainSelect && (
                      <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-dark-400 rounded-xl border border-white/10 z-10">
                        {SUPPORTED_CHAINS.filter(c => c.id !== sourceChain.id).map(chain => (
                          <button
                            key={chain.id}
                            onClick={() => {
                              setDestinationChain(chain)
                              setShowDestChainSelect(false)
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-300 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center text-xs font-bold">
                              {chain.name[0]}
                            </div>
                            <span className="text-white">{chain.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recipient Address (Optional) */}
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Recipient address (optional, defaults to your wallet)"
                    className="w-full p-4 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white placeholder-gray-500"
                  />

                  {/* Estimated Receive */}
                  <div className="p-4 bg-dark-400/30 rounded-xl">
                    <div className="text-sm text-gray-400 mb-1">You will receive (estimated)</div>
                    <div className="text-2xl font-bold text-white">
                      {estimatedReceive} {selectedToken.symbol}
                    </div>
                  </div>
                </div>

                {/* Bridge Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBridge}
                  disabled={isLoading || !amount || !isConnected}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-primary-500 to-accent-pink rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : !isConnected ? (
                    <>
                      <Wallet className="w-5 h-5" />
                      Connect Wallet
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-5 h-5" />
                      Bridge Tokens
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              {/* Fee Breakdown */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-400" />
                  Fee Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Bridge Fee (0.1%)</span>
                    <span className="text-white">{estimatedFee} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Estimated Gas</span>
                    <span className="text-white">~0.002 POL</span>
                  </div>
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-300">Total Cost</span>
                    <span className="text-white">{estimatedFee} {selectedToken.symbol}</span>
                  </div>
                </div>
              </div>

              {/* Estimated Time */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent-cyan" />
                  Estimated Time
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Source Confirmation</span>
                    <span className="text-white">~2 mins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Bridge Processing</span>
                    <span className="text-white">~10-15 mins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Destination Claim</span>
                    <span className="text-white">~2 mins</span>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Security
                </h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Secured by ZK proofs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Multi-sig validation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Audited smart contracts
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-white/5"
          >
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by token, tx hash..."
                  className="w-full pl-12 pr-4 py-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white placeholder-gray-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-12 pr-10 py-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="ready_to_claim">Ready to Claim</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No transactions found</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-dark-400/30 rounded-xl border border-white/5 hover:border-primary-500/20 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center">
                          <ArrowRightLeft className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{tx.amount} {tx.token.symbol}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(tx.status)}`}>
                              {getStatusIcon(tx.status)}
                              {tx.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {tx.sourceChain.name} → {tx.destinationChain.name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-400">
                            {tx.createdAt.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {tx.createdAt.toLocaleTimeString()}
                          </div>
                        </div>
                        
                        {tx.sourceTxHash && (
                          <a
                            href={`${tx.sourceChain.explorerUrl}/tx/${tx.sourceTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
                          >
                            <ExternalLink className="w-5 h-5 text-gray-400" />
                          </a>
                        )}

                        {tx.status === 'ready_to_claim' && (
                          <button className="px-4 py-2 bg-primary-500 rounded-lg font-medium text-white hover:bg-primary-600 transition-colors">
                            Claim
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <motion.div
            key="fees"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Fee Structure */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-xl font-semibold text-white mb-6">Fee Structure</h3>
              <div className="space-y-4">
                {SUPPORTED_TOKENS.map((token) => (
                  <div key={token.address} className="flex items-center justify-between p-4 bg-dark-400/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center font-bold">
                        {token.symbol[0]}
                      </div>
                      <div>
                        <div className="font-medium text-white">{token.symbol}</div>
                        <div className="text-sm text-gray-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">0.1%</div>
                      <div className="text-sm text-gray-400">Min: 0.001 {token.symbol}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Limits */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-xl font-semibold text-white mb-6">Daily Limits</h3>
              <div className="space-y-4">
                {SUPPORTED_TOKENS.map((token) => (
                  <div key={token.address} className="p-4 bg-dark-400/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs font-bold">
                          {token.symbol[0]}
                        </div>
                        <span className="font-medium text-white">{token.symbol}</span>
                      </div>
                      <span className="text-sm text-gray-400">0 / 100,000</span>
                    </div>
                    <div className="w-full h-2 bg-dark-500 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-500 to-accent-pink rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee Discounts */}
            <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-xl font-semibold text-white mb-6">Fee Discounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-dark-400/30 rounded-xl border border-primary-500/20">
                  <div className="text-2xl font-bold text-primary-400 mb-2">10%</div>
                  <div className="text-white font-medium mb-1">Starter Plan</div>
                  <div className="text-sm text-gray-400">For active subscribers</div>
                </div>
                <div className="p-4 bg-dark-400/30 rounded-xl border border-accent-cyan/20">
                  <div className="text-2xl font-bold text-accent-cyan mb-2">25%</div>
                  <div className="text-white font-medium mb-1">Professional Plan</div>
                  <div className="text-sm text-gray-400">For professional users</div>
                </div>
                <div className="p-4 bg-dark-400/30 rounded-xl border border-accent-pink/20">
                  <div className="text-2xl font-bold text-accent-pink mb-2">50%</div>
                  <div className="text-white font-medium mb-1">Enterprise Plan</div>
                  <div className="text-sm text-gray-400">Custom enterprise rates</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


