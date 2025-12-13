'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Rocket, CheckCircle2, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useWallet } from '@/hooks/useWallet'
import { ethers } from 'ethers'
import { PRIMARY_CHAIN_ID, polygonMainnet } from '@/lib/chains'
import { getChainFactoryContract, CONTRACT_ADDRESSES } from '@/lib/contracts'

export default function DeployTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string
  
  const { address, isConnected, chainId, switchNetwork, getProvider } = useWallet()
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    gasToken: '',
    initialValidators: ''
  })

  useEffect(() => {
    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const response = await apiClient.templates.getById(templateId)
      const templateData = response.data.template
      setTemplate(templateData)
      
      // Pre-fill form with template defaults
      setFormData({
        name: '',
        gasToken: templateData.config.gasToken || 'POL',
        initialValidators: templateData.config.initialValidators?.toString() || '3'
      })
    } catch (error: any) {
      console.error('Error loading template:', error)
      toast.error('Failed to load template')
      router.push('/dashboard/templates')
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!formData.name) {
      toast.error('Please enter a chain name')
      return
    }

    // Check if contract is configured
    const contractAddress = CONTRACT_ADDRESSES.CHAIN_FACTORY
    const isContractConfigured = contractAddress && contractAddress.trim() !== ''

    if (!isContractConfigured) {
      toast.error('Chain Factory contract not configured. Deploying without on-chain registration.')
    }

    // Ensure user is on Polygon network
    let currentChainId = chainId
    if (chainId !== polygonMainnet.id && chainId !== PRIMARY_CHAIN_ID) {
      try {
        toast.loading('Switching to Polygon Amoy Testnet...', { id: 'network-switch' })
        await switchNetwork(PRIMARY_CHAIN_ID)
        currentChainId = PRIMARY_CHAIN_ID
        toast.success('Switched to Polygon Amoy Testnet!', { id: 'network-switch' })
      } catch (networkError: any) {
        toast.error(`Failed to switch network: ${networkError?.message}`, { id: 'network-switch' })
        return
      }
    }

    setDeploying(true)

    try {
      let blockchainTxHash: string | null = null
      let blockchainChainId: number | null = null

      // If contract is configured, create on-chain
      if (isContractConfigured && address) {
        try {
          const eip1193Provider = await getProvider()
          const provider = new ethers.BrowserProvider(eip1193Provider)
          const signer = await provider.getSigner()
          const contract = getChainFactoryContract(signer)

          toast.loading('Creating chain on blockchain...', { id: 'blockchain-tx' })

          const tx = await contract.createChain(
            formData.name,
            template.config.chainType,
            template.config.rollupType,
            formData.gasToken || template.config.gasToken || 'POL',
            parseInt(formData.initialValidators) || template.config.initialValidators || 3,
            `https://rpc-${Date.now()}.polyone.io`,
            `https://explorer-${Date.now()}.polyone.io`
          )

          toast.loading('Waiting for transaction confirmation...', { id: 'blockchain-tx' })
          const receipt = await tx.wait()
          blockchainTxHash = receipt.hash
          blockchainChainId = currentChainId

          toast.success('Chain created on blockchain!', { id: 'blockchain-tx' })
        } catch (contractError: any) {
          console.error('Contract error:', contractError)
          toast.error(`Contract error: ${contractError?.message || 'Unknown error'}`, { id: 'blockchain-tx' })
          // Continue with off-chain deployment
        }
      }

      // Deploy via template API
      toast.loading('Deploying chain from template...', { id: 'deploy' })

      const deployData = {
        name: formData.name,
        gasToken: formData.gasToken || template.config.gasToken || 'POL',
        initialValidators: parseInt(formData.initialValidators) || template.config.initialValidators || 3,
        walletAddress: address,
        blockchainTxHash,
        blockchainChainId
      }

      const response = await apiClient.templates.deploy(templateId, deployData)

      toast.success('Chain deployed successfully!', { id: 'deploy' })
      router.push(`/dashboard/chains/${response.data.chain.id}`)
    } catch (error: any) {
      console.error('Deployment error:', error)
      toast.error(`Deployment failed: ${error?.response?.data?.message || error?.message || 'Unknown error'}`, { id: 'deploy' })
    } finally {
      setDeploying(false)
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

  if (!template) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Template not found</h2>
          <Link href="/dashboard/templates">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink">
              Back to Templates
            </button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <Link href={`/dashboard/templates/${templateId}`}>
          <motion.button
            whileHover={{ x: -4 }}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Template
          </motion.button>
        </Link>

        {/* Header */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl">{template.icon}</div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Deploy {template.name}</h1>
              <p className="text-gray-400">{template.description}</p>
            </div>
          </div>

          {/* Deployment Form */}
          <form onSubmit={handleDeploy} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Chain Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Awesome Chain"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Gas Token</label>
                <input
                  type="text"
                  value={formData.gasToken}
                  onChange={(e) => setFormData({ ...formData, gasToken: e.target.value })}
                  placeholder={template.config.gasToken || 'POL'}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Initial Validators</label>
                <input
                  type="number"
                  value={formData.initialValidators}
                  onChange={(e) => setFormData({ ...formData, initialValidators: e.target.value })}
                  placeholder={template.config.initialValidators?.toString() || '3'}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
                />
              </div>
            </div>

            {/* Template Configuration Summary */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <h3 className="font-semibold mb-3">Template Configuration</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Chain Type:</span>
                  <span className="ml-2 font-semibold capitalize">{template.config.chainType}</span>
                </div>
                <div>
                  <span className="text-gray-400">Rollup Type:</span>
                  <span className="ml-2 font-semibold">{template.config.rollupType}</span>
                </div>
                <div>
                  <span className="text-gray-400">Block Time:</span>
                  <span className="ml-2 font-semibold">{template.config.blockTime}s</span>
                </div>
                <div>
                  <span className="text-gray-400">Gas Limit:</span>
                  <span className="ml-2 font-semibold">{template.config.gasLimit?.toLocaleString() || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={deploying || !isConnected}
              className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-lg shadow-glow-purple hover:shadow-glow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deploying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Deploy Chain
                </>
              )}
            </motion.button>

            {!isConnected && (
              <p className="text-center text-sm text-gray-400">
                Please connect your wallet to deploy
              </p>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}


