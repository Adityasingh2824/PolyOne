'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Rocket, Info } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { useWallet } from '@/hooks/useWallet'
import { ethers } from 'ethers'

const CHAIN_FACTORY_ABI = [
  "function createChain(string memory _name, string memory _chainType, string memory _rollupType, string memory _gasToken, uint256 _validators, string memory _rpcUrl, string memory _explorerUrl) external returns (uint256)"
]

export default function CreateChainPage() {
  const router = useRouter()
  const { address, isConnected } = useWallet()
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    setLoading(true)

    try {
      // Create chain data
      const chainData = {
        ...formData,
        id: Date.now().toString(),
        owner: address,
        status: 'active',
        transactions: Math.floor(Math.random() * 10000),
        rpcUrl: `https://rpc-${Date.now()}.polyone.io`,
        explorerUrl: `https://explorer-${Date.now()}.polyone.io`,
        createdAt: new Date().toISOString()
      }

      // Save to localStorage
      const existingChains = JSON.parse(localStorage.getItem('userChains') || '[]')
      existingChains.push(chainData)
      localStorage.setItem('userChains', JSON.stringify(existingChains))

      // Try blockchain if contract address exists
      const contractAddress = process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS
      if (contractAddress && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          const contract = new ethers.Contract(contractAddress, CHAIN_FACTORY_ABI, signer)

          const tx = await contract.createChain(
            formData.name,
            formData.chainType,
            formData.rollupType,
            formData.gasToken.toUpperCase(),
            parseInt(formData.initialValidators),
            chainData.rpcUrl,
            chainData.explorerUrl
          )

          toast.success('🚀 Transaction sent! Waiting for confirmation...')
          await tx.wait()
          toast.success('✅ Chain created on blockchain!')
        } catch (blockchainError) {
          console.log('Blockchain creation skipped:', blockchainError)
          toast.success('✅ Chain created locally!')
        }
      } else {
        toast.success('✅ Chain created successfully!', {
          style: {
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white',
          },
        })
      }

      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to create chain')
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
