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
import { getChainFactoryContract, CONTRACT_ADDRESSES, POLYONE_CHAIN_FACTORY_ABI, LEGACY_CHAIN_FACTORY_ABI } from '@/lib/contracts'

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

    // Check if contract is configured (REQUIRED for on-chain registration)
    const contractAddress = CONTRACT_ADDRESSES.CHAIN_FACTORY
    const isContractConfigured = contractAddress && contractAddress.trim() !== ''

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
      return
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
        const message = networkError?.message || 'Unknown error'
        toast.error(`Failed to switch network: ${message}`, { id: 'network-switch' })
        return
      }
    }

    setDeploying(true)

    try {
      // Step 1: Create chain on blockchain first (REQUIRED) - Same as manual creation
      const eip1193Provider = await getProvider()
      const provider = new ethers.BrowserProvider(eip1193Provider)
      const signer = await provider.getSigner()
      
      const fetchLegacyGasPrice = async (): Promise<bigint> => {
        const gasPriceHex = await provider.send('eth_gasPrice', [])
        if (!gasPriceHex) {
          throw new Error('Unable to fetch gas price from provider')
        }
        return BigInt(gasPriceHex)
      }
      
      // Validate contract address format
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Invalid contract address. Please check NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS in your environment variables.')
      }

      // Check if contract is deployed by checking code at address
      const code = await provider.getCode(contractAddress)
      if (code === '0x' || code === '0x0') {
        throw new Error('No contract found at the specified address. Please ensure the ChainFactory contract is deployed.')
      }
      console.log('Contract code found at address:', contractAddress)

      // Test contract connection by calling a view function
      // Try to detect which contract type is deployed
      let contract
      let contractWithSigner
      let contractABI = POLYONE_CHAIN_FACTORY_ABI
      let isPolyOneFactory = false
      
      // First, try PolyOneChainFactory (check for deploymentFee function)
      try {
        contract = new ethers.Contract(contractAddress, POLYONE_CHAIN_FACTORY_ABI, provider)
        // Try to call deploymentFee() - this only exists in PolyOneChainFactory
        const deploymentFee = await contract.deploymentFee()
        console.log('Detected PolyOneChainFactory. Deployment fee:', ethers.formatEther(deploymentFee))
        isPolyOneFactory = true
        contractABI = POLYONE_CHAIN_FACTORY_ABI
        contractWithSigner = new ethers.Contract(contractAddress, POLYONE_CHAIN_FACTORY_ABI, signer)
      } catch (testError: any) {
        console.log('PolyOneChainFactory not detected, trying Legacy ChainFactory:', testError.message)
        // Fallback to legacy contract
        try {
          contract = new ethers.Contract(contractAddress, LEGACY_CHAIN_FACTORY_ABI, provider)
          contractABI = LEGACY_CHAIN_FACTORY_ABI
          isPolyOneFactory = false
          const totalChains = await contract.getTotalChains()
          console.log('Legacy ChainFactory detected. Total chains:', totalChains.toString())
          contractWithSigner = new ethers.Contract(contractAddress, LEGACY_CHAIN_FACTORY_ABI, signer)
        } catch (legacyError: any) {
          console.error('Both contract ABIs failed:', legacyError)
          throw new Error('Unable to connect to contract. Please verify the contract address is correct.')
        }
      }

      // Generate temporary URLs (will be updated after backend deployment)
      const tempChainId = `temp-${Date.now()}`
      const tempRpcUrl = `https://rpc-${tempChainId.substring(0, 8)}.polyone.io`
      const tempExplorerUrl = `https://explorer-${tempChainId.substring(0, 8)}.polyone.io`

      toast.loading('📝 Creating chain on Polygon blockchain...', { id: 'blockchain-tx' })
      
      // Check balance first
      const balance = await provider.getBalance(await signer.getAddress())
      if (balance === 0n) {
        throw new Error('Insufficient balance. Please add POL/MATIC to your wallet.')
      }

      // isPolyOneFactory is already set above during contract detection
      
      // Prepare transaction parameters based on contract type
      let txParams: any
      
      if (isPolyOneFactory) {
        // PolyOneChainFactory requires: name, symbol, chainType (enum), validatorAccess (enum), gasToken, validatorCount, config (struct)
        // Map rollupType string to ChainType enum (0=ZkRollup, 1=OptimisticRollup, 2=Validium)
        // Note: PolyOneChainFactory uses rollupType to determine ChainType enum
        const chainTypeMap: Record<string, number> = {
          'zk-rollup': 0,        // ChainType.ZkRollup
          'optimistic-rollup': 1, // ChainType.OptimisticRollup
          'validium': 2          // ChainType.Validium
        }
        
        // Map validatorAccess string to ValidatorAccess enum (0=Public, 1=Permissioned, 2=Private)
        const validatorAccessMap: Record<string, number> = {
          'public': 0,        // ValidatorAccess.Public
          'permissioned': 1,  // ValidatorAccess.Permissioned
          'private': 2        // ValidatorAccess.Private
        }
        
        // Get rollupType from template config (this maps to ChainType enum)
        const rollupType = template.config.rollupType || 'zk-rollup'
        const chainTypeEnum = chainTypeMap[rollupType.toLowerCase()] ?? 0
        
        // Get validatorAccess from template config
        const validatorAccess = template.config.validatorAccess || 'public'
        const validatorAccessEnum = validatorAccessMap[validatorAccess.toLowerCase()] ?? 0
        
        console.log('Enum mappings:', {
          rollupType,
          chainTypeEnum,
          validatorAccess,
          validatorAccessEnum
        })
        
        // Generate symbol from name (first 3-4 uppercase letters, min 2 chars)
        let symbol = (formData.name || 'CHAIN')
          .substring(0, 4)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
        
        // Ensure symbol is at least 2 characters and max 10
        if (symbol.length < 2) {
          symbol = (formData.name || 'CHAIN').substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CHAIN'
        }
        if (symbol.length > 10) {
          symbol = symbol.substring(0, 10)
        }
        
        // Validate inputs BEFORE creating txParams
        if (!formData.name || formData.name.trim().length === 0) {
          throw new Error('Chain name is required')
        }
        
        // Validate validator count
        const validatorCount = parseInt(formData.initialValidators) || template.config.initialValidators || 3
        if (validatorCount < 1 || validatorCount > 100) {
          throw new Error('Validator count must be between 1 and 100')
        }
        
        // Get and validate gas token
        const gasToken = (formData.gasToken || template.config.gasToken || 'POL').toUpperCase().trim()
        if (!gasToken || gasToken.length === 0) {
          throw new Error('Gas token is required')
        }
        
        // Create txParams with validated values
        txParams = {
          name: formData.name,
          symbol: symbol,
          chainType: chainTypeEnum,
          validatorAccess: validatorAccessEnum,
          gasToken: gasToken,
          validatorCount: validatorCount,
          config: {
            maxTps: template.config.maxTps || 1000,
            blockGasLimit: template.config.gasLimit || 30000000,
            blockTime: (template.config.blockTime || 2) * 1000, // Convert to milliseconds
            maxValidators: 100,
            bridgeEnabled: template.config.bridgeEnabled !== false,
            analyticsEnabled: template.config.analyticsEnabled !== false
          }
        }
        
        console.log('PolyOneChainFactory parameters:', {
          name: txParams.name,
          symbol: txParams.symbol,
          chainType: txParams.chainType,
          validatorAccess: txParams.validatorAccess,
          gasToken: txParams.gasToken,
          validatorCount: txParams.validatorCount,
          config: txParams.config
        })
      } else {
        // Legacy ChainFactory
        txParams = {
          name: formData.name,
          chainType: template.config.chainType,
          rollupType: template.config.rollupType,
          gasToken: (formData.gasToken || template.config.gasToken || 'POL').toUpperCase(),
          validators: parseInt(formData.initialValidators) || template.config.initialValidators || 3,
          rpcUrl: tempRpcUrl,
          explorerUrl: tempExplorerUrl
        }
      }

      console.log('Transaction parameters:', txParams)
      console.log('Contract address:', contractAddress)
      console.log('Contract type:', isPolyOneFactory ? 'PolyOneChainFactory' : 'Legacy ChainFactory')
      console.log('Signer address:', await signer.getAddress())
      
      // Check deployment fee for PolyOneChainFactory
      let deploymentFee = 0n
      if (isPolyOneFactory) {
        try {
          deploymentFee = await contract.deploymentFee()
          const balance = await provider.getBalance(await signer.getAddress())
          const signerAddress = await signer.getAddress()
          console.log('Deployment fee required:', ethers.formatEther(deploymentFee), 'ETH')
          console.log('Wallet balance:', ethers.formatEther(balance), 'ETH')
          
          if (balance < deploymentFee) {
            throw new Error(`Insufficient balance. Required: ${ethers.formatEther(deploymentFee)} ETH, Have: ${ethers.formatEther(balance)} ETH`)
          }
        } catch (feeError: any) {
          console.warn('Could not check deployment fee:', feeError.message)
          // If we can't get the fee, try to continue but warn the user
          toast.error('Warning: Could not verify deployment fee. Transaction may fail if insufficient balance.', {
            duration: 5000
          })
        }
      }

      // First, try to populate the transaction to validate it
      let populatedTx
      try {
        toast.loading('⏳ Preparing transaction...', { id: 'blockchain-tx' })
        
        if (isPolyOneFactory) {
          // PolyOneChainFactory signature
          // Get deployment fee if not already fetched
          if (deploymentFee === 0n) {
            deploymentFee = await contract.deploymentFee().catch(() => 0n)
          }
          
          populatedTx = await contractWithSigner.createChain.populateTransaction(
            txParams.name,
            txParams.symbol,
            txParams.chainType,
            txParams.validatorAccess,
            txParams.gasToken,
            txParams.validatorCount,
            txParams.config,
            {
              value: deploymentFee // Include deployment fee
            }
          )
        } else {
          // Legacy ChainFactory signature
          populatedTx = await contractWithSigner.createChain.populateTransaction(
            txParams.name,
            txParams.chainType,
            txParams.rollupType,
            txParams.gasToken,
            txParams.validators,
            txParams.rpcUrl,
            txParams.explorerUrl
          )
        }
        console.log('Populated transaction:', populatedTx)
      } catch (populateError: any) {
        console.error('Transaction populate error:', populateError)
        console.error('Contract type:', isPolyOneFactory ? 'PolyOneChainFactory' : 'Legacy ChainFactory')
        console.error('Parameters being sent:', txParams)
        
        let errorMessage = 'Failed to prepare transaction. '
        if (populateError.reason) {
          errorMessage += `Reason: ${populateError.reason}. `
        }
        if (populateError.message) {
          errorMessage += populateError.message
        } else {
          errorMessage += 'Please check that all required parameters are provided and valid.'
        }
        
        // Add helpful hints based on contract type
        if (isPolyOneFactory) {
          errorMessage += ' Make sure you have sufficient balance for the deployment fee.'
        }
        
        throw new Error(errorMessage)
      }

      // Estimate gas with populated transaction
      let gasEstimate: bigint
      try {
        toast.loading('⏳ Estimating gas...', { id: 'blockchain-tx' })
        gasEstimate = await provider.estimateGas(populatedTx)
        console.log('Gas estimate:', gasEstimate.toString())
        // Add 30% buffer to gas estimate for safety
        gasEstimate = (gasEstimate * 130n) / 100n
      } catch (gasError: any) {
        console.error('Gas estimation error:', gasError)
        let gasErrorMessage = 'Gas estimation failed. '
        if (gasError.reason) {
          gasErrorMessage += `Reason: ${gasError.reason}`
        } else if (gasError.message) {
          gasErrorMessage += gasError.message
        } else {
          gasErrorMessage += 'The transaction would likely fail. Please check your inputs and try again.'
        }
        throw new Error(gasErrorMessage)
      }

      // Send transaction
      let tx
      let legacyGasPrice: bigint
      
      try {
        toast.loading('📤 Sending transaction...', { id: 'blockchain-tx' })
        
        // Get legacy gas price
        legacyGasPrice = await fetchLegacyGasPrice()
        console.log('Using legacy gas price:', legacyGasPrice.toString())
        
        // deploymentFee is already fetched above, reuse it
        // If somehow it's still 0, fetch it again
        if (isPolyOneFactory && deploymentFee === 0n) {
          try {
            deploymentFee = await contract.deploymentFee()
          } catch {
            // If we can't get it, use 0 and let the contract reject with a clear error
            deploymentFee = 0n
          }
        }
        
        // Send transaction - use contract method directly
        if (isPolyOneFactory) {
          // PolyOneChainFactory signature
          tx = await contractWithSigner.createChain(
            txParams.name,
            txParams.symbol,
            txParams.chainType,
            txParams.validatorAccess,
            txParams.gasToken,
            txParams.validatorCount,
            txParams.config,
            {
              gasLimit: gasEstimate,
              gasPrice: legacyGasPrice,
              value: deploymentFee,
              type: 0 // Force legacy transaction
            }
          )
        } else {
          // Legacy ChainFactory signature
          tx = await contractWithSigner.createChain(
            txParams.name,
            txParams.chainType,
            txParams.rollupType,
            txParams.gasToken,
            txParams.validators,
            txParams.rpcUrl,
            txParams.explorerUrl,
            {
              gasLimit: gasEstimate,
              gasPrice: legacyGasPrice,
              type: 0 // Force legacy transaction
            }
          )
        }
        console.log('Transaction sent:', tx.hash)
      } catch (txError: any) {
        console.error('Transaction send error:', txError)
        
        // Retry with explicit legacy format
        if (!tx) {
          try {
            console.log('Retrying with explicit legacy transaction format...')
            const retryGasPrice = await fetchLegacyGasPrice()
            const retryDeploymentFee = isPolyOneFactory 
              ? await contract.deploymentFee().catch(() => 0n)
              : 0n
            
            if (isPolyOneFactory) {
              tx = await contractWithSigner.createChain(
                txParams.name,
                txParams.symbol,
                txParams.chainType,
                txParams.validatorAccess,
                txParams.gasToken,
                txParams.validatorCount,
                txParams.config,
                {
                  gasLimit: gasEstimate,
                  gasPrice: retryGasPrice,
                  value: retryDeploymentFee
                }
              )
            } else {
              tx = await contractWithSigner.createChain(
                txParams.name,
                txParams.chainType,
                txParams.rollupType,
                txParams.gasToken,
                txParams.validators,
                txParams.rpcUrl,
                txParams.explorerUrl,
                {
                  gasLimit: gasEstimate,
                  gasPrice: retryGasPrice
                }
              )
            }
            console.log('Retry successful, transaction sent:', tx.hash)
          } catch (retryError: any) {
            console.error('Retry also failed:', retryError)
            throw new Error(`Transaction failed: ${retryError.message || 'Unknown error'}`)
          }
        }
      }

      // Wait for transaction confirmation
      toast.loading('⏳ Waiting for transaction confirmation...', { id: 'blockchain-tx' })
      const receipt = await tx.wait()
      
      if (!receipt || !receipt.hash) {
        throw new Error('Transaction receipt not received')
      }

      const blockchainTxHash = receipt.hash
      const blockchainChainId = currentChainId

      // Get PolygonScan URL
      const getPolygonScanUrl = (txHash: string) => {
        if (currentChainId === polygonMainnet.id) {
          return `https://polygonscan.com/tx/${txHash}`
        } else if (currentChainId === PRIMARY_CHAIN_ID) {
          return `https://amoy.polygonscan.com/tx/${txHash}`
        }
        return null
      }

      const polygonScanUrl = getPolygonScanUrl(blockchainTxHash)
      
      toast.success('✅ Chain created on blockchain!', { 
        id: 'blockchain-tx',
        duration: 5000
      })

      console.log('Blockchain transaction:', {
        hash: blockchainTxHash,
        chainId: blockchainChainId,
        polygonScanUrl
      })

      // Step 2: Deploy via template API with blockchain transaction hash
      toast.loading('Deploying chain from template...', { id: 'deploy' })

      const deployData = {
        name: formData.name,
        gasToken: formData.gasToken || template.config.gasToken || 'POL',
        initialValidators: parseInt(formData.initialValidators) || template.config.initialValidators || 3,
        walletAddress: address ?? undefined,
        blockchainTxHash: blockchainTxHash ?? undefined,
        blockchainChainId: blockchainChainId ?? undefined
      }

      const response = await apiClient.templates.deploy(templateId, deployData)

      console.log('Template deployment response:', response.data)

      toast.success('✅ Chain deployed successfully!', { id: 'deploy' })
      
      // Ensure we have the chain ID from response - check multiple possible locations
      const deployedChainId = response.data?.chain?.id || 
                             response.data?.chainId || 
                             response.data?.data?.chain?.id ||
                             response.data?.data?.chainId
      
      if (!deployedChainId) {
        console.error('No chain ID in response:', JSON.stringify(response.data, null, 2))
        toast.error('Chain deployed but ID not found. Redirecting to chains list.', {
          duration: 5000
        })
        router.push('/dashboard/chains')
        return
      }
      
      console.log('✅ Chain ID found:', deployedChainId)
      console.log('📋 Full chain data:', response.data?.chain)
      
      // Wait a moment for the chain to be fully saved in the database
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Try to verify the chain exists before redirecting
      try {
        const verifyResponse = await apiClient.chains.getById(deployedChainId)
        if (verifyResponse.data) {
          console.log('✅ Chain verified, redirecting...')
        }
      } catch (verifyError: any) {
        console.warn('⚠️ Chain not immediately available, but continuing with redirect:', verifyError.message)
        // Continue anyway - the retry logic in the chain detail page will handle it
      }
      
      // Navigate to chain page with wallet address and new flag
      const params = new URLSearchParams()
      if (address) {
        params.set('walletAddress', address)
      }
      params.set('new', 'true') // Flag to indicate this is a new deployment
      
      const chainUrl = `/dashboard/chains/${deployedChainId}?${params.toString()}`
      
      console.log('🚀 Navigating to:', chainUrl)
      router.push(chainUrl)
    } catch (error: any) {
      console.error('Deployment error:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error'
      toast.error(`Deployment failed: ${errorMessage}`, { 
        id: 'deploy',
        duration: 8000
      })
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



























