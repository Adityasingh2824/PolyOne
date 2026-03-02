'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  Code, 
  ArrowRight, 
  X, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import { apiClient } from '@/lib/api'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { PRIMARY_CHAIN_ID } from '@/lib/chains'

interface ContractDeployerProps {
  onDeploySuccess?: () => void
  onCancel?: () => void
}

interface ConstructorParam {
  name: string
  type: string
  label: string
  placeholder: string
  required: boolean
}

export default function ContractDeployer({ onDeploySuccess, onCancel }: ContractDeployerProps) {
  const { address, isConnected, chainId, getProvider, switchNetwork } = useWallet()
  const [step, setStep] = useState<'template' | 'configure' | 'deploy' | 'success'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [contractCode, setContractCode] = useState('')
  const [contractName, setContractName] = useState('')
  const [constructorParams, setConstructorParams] = useState<Record<string, any>>({})
  const [deploying, setDeploying] = useState(false)
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [abi, setAbi] = useState<any[]>([])

  useEffect(() => {
    // Load template from sessionStorage if available
    const storedTemplate = sessionStorage.getItem('selectedTemplate')
    if (storedTemplate) {
      const template = JSON.parse(storedTemplate)
      setSelectedTemplate(template)
      setContractCode(template.contractCode || '')
      setStep('configure')
      sessionStorage.removeItem('selectedTemplate')
    }
  }, [])

  const handleTemplateSelect = async (template: any) => {
    setSelectedTemplate(template)
    setContractCode(template.contractCode || '')
    setContractName(template.name)
    setStep('configure')
    
    // Initialize constructor params
    const params: Record<string, any> = {}
    template.constructorParams?.forEach((param: ConstructorParam) => {
      params[param.name] = ''
    })
    setConstructorParams(params)
  }

  const handleDeploy = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!contractCode || !contractName) {
      toast.error('Please provide contract code and name')
      return
    }

    // Ensure we're on the correct network
    if (chainId !== PRIMARY_CHAIN_ID) {
      try {
        toast.loading('Switching network...', { id: 'network-switch' })
        await switchNetwork(PRIMARY_CHAIN_ID)
        toast.success('Network switched!', { id: 'network-switch' })
      } catch (error: any) {
        toast.error(`Failed to switch network: ${error.message}`, { id: 'network-switch' })
        return
      }
    }

    setDeploying(true)
    setStep('deploy')

    try {
      const provider = await getProvider()
      const ethersProvider = new ethers.BrowserProvider(provider)
      const signer = await ethersProvider.getSigner()

      // Compile contract (simplified - in production, use Hardhat or similar)
      // For now, we'll use a simplified approach with ethers.js
      // Note: This is a placeholder - actual deployment requires compilation
      toast.error('Contract compilation and deployment requires Hardhat integration. This is a UI preview.')
      setDeploying(false)
      
      // In a real implementation, you would:
      // 1. Compile the contract using Hardhat or similar
      // 2. Get the bytecode and ABI
      // 3. Deploy using ContractFactory
      // 4. Wait for deployment
      // 5. Save to backend

      /* Example implementation (commented out):
      const factory = new ethers.ContractFactory(abi, bytecode, signer)
      const contract = await factory.deploy(...Object.values(constructorParams))
      await contract.waitForDeployment()
      const address = await contract.getAddress()
      const tx = contract.deploymentTransaction()
      
      setDeployedAddress(address)
      setTxHash(tx?.hash || null)
      setAbi(abi)
      
      // Save to backend
      await apiClient.contracts.save({
        name: contractName,
        address,
        chainId: PRIMARY_CHAIN_ID,
        abi,
        templateId: selectedTemplate?.id,
        constructorArgs: constructorParams,
        txHash: tx?.hash,
        isUpgradeable: selectedTemplate?.upgradeable || false,
        walletAddress: address
      })
      
      setStep('success')
      toast.success('Contract deployed successfully!')
      */

    } catch (error: any) {
      console.error('Deployment error:', error)
      toast.error(error?.message || 'Failed to deploy contract')
      setDeploying(false)
      setStep('configure')
    }
  }

  const getExplorerUrl = (hash: string) => {
    if (chainId === 80002) {
      return `https://amoy.polygonscan.com/tx/${hash}`
    } else if (chainId === 137) {
      return `https://polygonscan.com/tx/${hash}`
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        {[
          { id: 'template', label: 'Template' },
          { id: 'configure', label: 'Configure' },
          { id: 'deploy', label: 'Deploy' },
          { id: 'success', label: 'Complete' }
        ].map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all
              ${step === s.id
                ? 'bg-gradient-to-r from-primary-500 to-accent-pink text-white shadow-glow-purple'
                : ['template', 'configure', 'deploy', 'success'].indexOf(step) > i
                ? 'bg-accent-emerald text-white'
                : 'bg-white/5 text-gray-500'
              }
            `}>
              {['template', 'configure', 'deploy', 'success'].indexOf(step) > i ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                i + 1
              )}
            </div>
            {i < 3 && (
              <div className={`
                w-16 h-1 mx-2 transition-all
                ${['template', 'configure', 'deploy', 'success'].indexOf(step) > i
                  ? 'bg-accent-emerald'
                  : 'bg-white/5'
                }
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Template Selection */}
      {step === 'template' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          <h2 className="text-2xl font-bold mb-6">Select Contract Template</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="block text-sm font-medium mb-2">Or paste your contract code</label>
              <textarea
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.20;&#10;&#10;contract MyContract {&#10;    // Your code here&#10;}"
                className="w-full h-64 p-4 rounded-lg bg-dark-600 border border-white/10 font-mono text-sm focus:border-primary-500/30 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="Contract Name"
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
              />
              <button
                onClick={() => {
                  if (contractCode && contractName) {
                    setStep('configure')
                  } else {
                    toast.error('Please provide contract code and name')
                  }
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold shadow-glow-purple"
              >
                Continue
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Configuration */}
      {step === 'configure' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Configure Contract</h2>
            <button
              onClick={() => setStep('template')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedTemplate && (
            <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                <div>
                  <h3 className="font-bold">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-400">{selectedTemplate.description}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Contract Name</label>
              <input
                type="text"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="MyContract"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
              />
            </div>

            {selectedTemplate?.constructorParams && selectedTemplate.constructorParams.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-4">Constructor Parameters</label>
                <div className="space-y-4">
                  {selectedTemplate.constructorParams.map((param: ConstructorParam) => (
                    <div key={param.name}>
                      <label className="block text-sm text-gray-400 mb-2">
                        {param.label} <span className="text-primary-400">({param.type})</span>
                        {param.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <input
                        type={param.type === 'uint256' ? 'number' : 'text'}
                        value={constructorParams[param.name] || ''}
                        onChange={(e) => {
                          setConstructorParams({
                            ...constructorParams,
                            [param.name]: param.type === 'uint256' 
                              ? parseInt(e.target.value) || 0
                              : e.target.value
                          })
                        }}
                        placeholder={param.placeholder}
                        required={param.required}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={onCancel || (() => setStep('template'))}
                className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                disabled={!contractName || deploying}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    Deploy Contract
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Deploying */}
      {step === 'deploy' && deploying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary-400 animate-spin" />
          <h3 className="text-xl font-bold mb-2">Deploying Contract</h3>
          <p className="text-gray-400">Please confirm the transaction in your wallet</p>
        </motion.div>
      )}

      {/* Success */}
      {step === 'success' && deployedAddress && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent-emerald/20 flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-accent-emerald" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Contract Deployed Successfully!</h2>
            <p className="text-gray-400">Your contract is now live on the blockchain</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="text-sm text-gray-400 mb-1">Contract Address</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm">{deployedAddress}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(deployedAddress)
                    toast.success('Copied!')
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {txHash && (
              <div className="p-4 rounded-xl bg-white/5">
                <div className="text-sm text-gray-400 mb-1">Transaction Hash</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm truncate">{txHash}</code>
                  {getExplorerUrl(txHash) && (
                    <a
                      href={getExplorerUrl(txHash)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setStep('template')
                setSelectedTemplate(null)
                setContractCode('')
                setContractName('')
                setConstructorParams({})
                setDeployedAddress(null)
                setTxHash(null)
              }}
              className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-all"
            >
              Deploy Another
            </button>
            <button
              onClick={() => {
                onDeploySuccess?.()
              }}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold shadow-glow-purple"
            >
              View Contracts
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
























