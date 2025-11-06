'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Rocket, Info, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { useWallet } from '@/hooks/useWallet'
import { ethers } from 'ethers'
import { web3Service, NETWORKS } from '@/lib/web3'

const CHAIN_FACTORY_ABI = [
  "function createChain(string memory _name, string memory _chainType, string memory _rollupType, string memory _gasToken, uint256 _validators, string memory _rpcUrl, string memory _explorerUrl) external returns (uint256)",
  "event ChainCreated(uint256 indexed chainId, address indexed owner, string name, string chainType, string rollupType)"
]

export default function CreateChainPage() {
  const router = useRouter()
  const { address, isConnected, chainId } = useWallet()
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [polygonScanUrl, setPolygonScanUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    chainType: 'public',
    rollupType: 'zk-rollup',
    gasToken: '',
    validatorAccess: 'public',
    initialValidators: '3'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Check if user is on Polygon network
  const isPolygonNetwork = chainId === 137 || chainId === 80002 // Polygon Mainnet or Amoy Testnet
  const getPolygonScanUrl = (txHash: string) => {
    if (chainId === 137) {
      return `https://polygonscan.com/tx/${txHash}`
    } else if (chainId === 80002) {
      return `https://amoy.polygonscan.com/tx/${txHash}`
    }
    return null
  }

  // Check if contract is configured
  const contractAddress = process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS
  const isContractConfigured = contractAddress && contractAddress.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    // Validate form data
    if (!formData.name || !formData.gasToken) {
      toast.error('Please fill in all required fields')
      return
    }

    // Check if contract address is configured (REQUIRED for on-chain registration)
    if (!isContractConfigured) {
      toast.error(
        'Chain Factory contract not configured. Please deploy the contract and set NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS in frontend/.env.local. See DEPLOYMENT_GUIDE.md for instructions.',
        {
          duration: 8000,
          style: {
            background: '#ef4444',
            color: 'white',
          },
        }
      )
      setLoading(false)
      return
    }

    // Ensure user is on Polygon network
    let currentChainId = chainId
    if (!isPolygonNetwork) {
      try {
        toast.loading('Switching to Polygon Amoy Testnet...', { id: 'network-switch' })
        await web3Service.switchToPolygon('POLYGON_AMOY')
        // Wait a moment for the network to update
        await new Promise(resolve => setTimeout(resolve, 1500))
        // Get updated chainId from provider
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const network = await provider.getNetwork()
          currentChainId = Number(network.chainId)
        }
        toast.success('Switched to Polygon Amoy Testnet!', { id: 'network-switch' })
      } catch (networkError: any) {
        toast.error(`Failed to switch network: ${networkError.message}`, { id: 'network-switch' })
        return
      }
    }

    setLoading(true)
    setTxHash(null)
    setPolygonScanUrl(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

      // Step 1: Create chain on blockchain first (REQUIRED)
      if (!window.ethereum) {
        throw new Error('MetaMask is required for on-chain registration')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(contractAddress, CHAIN_FACTORY_ABI, signer)

      // Generate temporary URLs (will be updated after backend deployment)
      const tempChainId = `temp-${Date.now()}`
      const tempRpcUrl = `https://rpc-${tempChainId.substring(0, 8)}.polyone.io`
      const tempExplorerUrl = `https://explorer-${tempChainId.substring(0, 8)}.polyone.io`

      toast.loading('📝 Creating chain on Polygon blockchain...', { id: 'blockchain-tx' })
      
      const tx = await contract.createChain(
        formData.name,
        formData.chainType,
        formData.rollupType,
        formData.gasToken.toUpperCase(),
        parseInt(formData.initialValidators),
        tempRpcUrl,
        tempExplorerUrl
      )

      const txHashValue = tx.hash
      setTxHash(txHashValue)
      // Use currentChainId instead of chainId for the scan URL
      const scanUrl = currentChainId === 137 
        ? `https://polygonscan.com/tx/${txHashValue}`
        : currentChainId === 80002
        ? `https://amoy.polygonscan.com/tx/${txHashValue}`
        : null
      setPolygonScanUrl(scanUrl)

      toast.loading('⏳ Waiting for transaction confirmation...', { id: 'blockchain-tx' })
      
      const receipt = await tx.wait()
      
      toast.success('✅ Chain registered on Polygon blockchain!', { 
        id: 'blockchain-tx',
        duration: 3000
      })

      // Step 2: Call backend API to create chain infrastructure (optional)
      // Backend is only needed for infrastructure deployment, not for on-chain registration
      let chainData: any = null
      
      try {
        toast.loading('🚀 Starting chain deployment...', { id: 'backend-deploy' })

        // Check backend connectivity first
        try {
          const healthCheck = await axios.get(`${apiUrl}/health`, {
            timeout: 5000
          })
          console.log('Backend health check:', healthCheck.data)
        } catch (healthError: any) {
          console.warn('Backend not available, continuing with on-chain registration only')
          throw new Error('BACKEND_NOT_AVAILABLE')
        }

        // Call backend API to create chain
        const response = await axios.post(
          `${apiUrl}/api/chains/create`,
          {
            name: formData.name,
            chainType: formData.chainType,
            rollupType: formData.rollupType,
            gasToken: formData.gasToken,
            validatorAccess: formData.validatorAccess,
            initialValidators: formData.initialValidators,
            blockchainTxHash: txHashValue,
            blockchainChainId: currentChainId,
            walletAddress: address
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        )

        chainData = {
          ...response.data.chain,
          id: response.data.chainId,
          owner: address,
          createdAt: new Date().toISOString(),
          blockchainTxHash: txHashValue,
          polygonScanUrl: scanUrl
        }

        toast.success('✅ Chain deployment started!', { 
          id: 'backend-deploy',
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white',
          },
        })
      } catch (backendError: any) {
        // Backend is optional - chain is already registered on-chain
        if (backendError.message === 'BACKEND_NOT_AVAILABLE' || 
            backendError.code === 'ECONNREFUSED' || 
            backendError.message?.includes('Network Error')) {
          
          // Create chain data from on-chain registration only
          chainData = {
            id: `chain-${Date.now()}`,
            name: formData.name,
            chainType: formData.chainType,
            rollupType: formData.rollupType,
            gasToken: formData.gasToken,
            owner: address,
            status: 'on-chain-registered',
            createdAt: new Date().toISOString(),
            blockchainTxHash: txHashValue,
            polygonScanUrl: scanUrl,
            blockchainChainId: currentChainId,
            note: 'Chain registered on blockchain. Backend infrastructure deployment skipped (backend server not available).'
          }

          toast.success('✅ Chain registered on blockchain!', { 
            id: 'backend-deploy',
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
            },
          })
          
          toast('ℹ️ Backend server not available. Chain is registered on-chain but infrastructure deployment skipped.', {
            duration: 8000,
            style: {
              background: '#3b82f6',
              color: 'white',
            },
          })
        } else {
          // Other backend errors
          console.error('Backend error:', backendError)
          toast('⚠️ Chain registered on blockchain, but backend deployment failed.', {
            id: 'backend-deploy',
            duration: 5000,
            style: {
              background: '#f59e0b',
              color: 'white',
            },
          })
          
          // Still create chain data
          chainData = {
            id: `chain-${Date.now()}`,
            name: formData.name,
            chainType: formData.chainType,
            rollupType: formData.rollupType,
            gasToken: formData.gasToken,
            owner: address,
            status: 'on-chain-registered',
            createdAt: new Date().toISOString(),
            blockchainTxHash: txHashValue,
            polygonScanUrl: scanUrl,
            blockchainChainId: currentChainId
          }
        }
      }

      // Save to localStorage for frontend display
      if (chainData) {
        const existingChains = JSON.parse(localStorage.getItem('userChains') || '[]')
        existingChains.push(chainData)
        localStorage.setItem('userChains', JSON.stringify(existingChains))
      }

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Error creating chain:', error)
      
      // Provide specific error messages
      let errorMessage = 'Failed to create chain'
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMessage = `Cannot connect to backend server. Please ensure the backend server is running at ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`
      } else if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user'
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient MATIC balance. Please add funds to your wallet.'
      } else if (error.response) {
        // Server responded with error status
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid request. Please check your input.'
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = error.response.data?.message || `Server error (${error.response.status})`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: 'white',
        },
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Wallet Required</h2>
            <p className="text-gray-400 mb-8">Please connect your wallet to create a blockchain</p>
            <Link href="/dashboard" className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 font-semibold">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Launch New Blockchain
            </h1>
            <p className="text-gray-400">Configure your custom Polygon-based chain</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Chain Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                placeholder="My Awesome Chain"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Chain Type *</label>
              <div className="grid grid-cols-2 gap-4">
                {['public', 'private'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, chainType: type })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.chainType === type
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="font-semibold capitalize">{type}</div>
                    <div className="text-sm text-gray-400">{type === 'public' ? 'Open to everyone' : 'Restricted access'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rollup Type *</label>
              <select
                name="rollupType"
                value={formData.rollupType}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                <option value="zk-rollup">zkRollup (Recommended)</option>
                <option value="optimistic-rollup">Optimistic Rollup</option>
                <option value="validium">Validium</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gas Token Symbol *</label>
              <input
                type="text"
                name="gasToken"
                value={formData.gasToken}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                placeholder="e.g., GAME, PAY, COIN"
                maxLength={10}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Initial Validators *</label>
              <input
                type="number"
                name="initialValidators"
                value={formData.initialValidators}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                min="1"
                max="100"
                required
              />
            </div>

            {!isContractConfigured && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-400 mb-1">Chain Factory Contract Not Configured</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    To enable on-chain registration, you need to deploy the ChainFactory contract and configure it.
                  </p>
                  <p className="text-sm text-gray-400">
                    <strong>Steps:</strong><br />
                    1. Deploy the contract: <code className="bg-black/30 px-1 rounded">npm run deploy:amoy</code> (or <code className="bg-black/30 px-1 rounded">npm run deploy:polygon</code> for mainnet)<br />
                    2. Copy the deployed contract address<br />
                    3. Add <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x...</code> to <code className="bg-black/30 px-1 rounded">frontend/.env.local</code><br />
                    4. Restart your frontend server
                  </p>
                </div>
              </div>
            )}

            {!isPolygonNetwork && isConnected && isContractConfigured && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-yellow-400 mb-1">Switch to Polygon Network</h3>
                  <p className="text-sm text-gray-300">
                    You need to be on Polygon Mainnet or Polygon Amoy Testnet to launch your chain. 
                    The network will be switched automatically when you submit.
                  </p>
                </div>
              </div>
            )}

            {txHash && polygonScanUrl && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <h3 className="font-bold text-green-400">Transaction Submitted!</h3>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Your chain has been registered on Polygon blockchain. View it on PolygonScan:
                </p>
                <a
                  href={polygonScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors text-sm font-medium"
                >
                  View on PolygonScan
                  <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-xs text-gray-400 mt-2 font-mono break-all">
                  {txHash}
                </p>
              </div>
            )}

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
              <h3 className="font-bold mb-4">Estimated Costs</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Setup Fee</span>
                  <span className="font-semibold">$499</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Hosting</span>
                  <span className="font-semibold">$299/mo</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-purple-400">$798</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="flex-1 py-3 text-center rounded-xl border border-white/20 hover:bg-white/5 transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Creating...'
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Launch Chain
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
