'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileCode, 
  Plus, 
  Search, 
  Filter,
  Code,
  Zap,
  ChevronRight,
  Copy,
  ExternalLink,
  Settings,
  ArrowUpRight,
  FileText,
  Layers
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useWallet } from '@/hooks/useWallet'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import ContractDeployer from '@/components/ContractDeployer'
import ContractInteraction from '@/components/ContractInteraction'
import ABIManager from '@/components/ABIManager'

type ViewMode = 'templates' | 'deployed' | 'deploy' | 'interact' | 'abis'

interface ContractTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  tags: string[]
  constructorParams: any[]
  upgradeable: boolean
}

interface DeployedContract {
  id: string
  name: string
  address: string
  chain_id: number
  abi: any[]
  template_id?: string
  tx_hash?: string
  is_upgradeable: boolean
  proxy_address?: string
  deployed_at: string
}

export default function ContractsPage() {
  const { address, isConnected } = useWallet()
  const [viewMode, setViewMode] = useState<ViewMode>('templates')
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [deployedContracts, setDeployedContracts] = useState<DeployedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<DeployedContract | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', 'token', 'nft', 'governance', 'utility', 'infrastructure']

  useEffect(() => {
    // Always load templates on mount
    loadTemplates()
    if (isConnected && address) {
      loadDeployedContracts()
    }
  }, [isConnected, address])
  
  // Also load templates when view mode changes to templates
  useEffect(() => {
    if (viewMode === 'templates' && templates.length === 0 && !loading) {
      loadTemplates()
    }
  }, [viewMode])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await apiClient.contracts.getTemplates({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined
      })
      
      // Handle both response formats
      const templatesData = response.data?.templates || response.data || []
      setTemplates(Array.isArray(templatesData) ? templatesData : [])
      
      if (templatesData.length === 0 && !searchQuery && selectedCategory === 'all') {
        console.warn('No templates found in response:', response.data)
      }
    } catch (error: any) {
      console.error('Error loading templates:', error)
      console.error('Error details:', error?.response?.data || error?.message)
      
      // Show more detailed error
      const errorMsg = error?.response?.data?.error?.message || error?.message || 'Failed to load contract templates'
      toast.error(errorMsg)
      
      // Set empty array on error
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const loadDeployedContracts = async () => {
    if (!address) return
    try {
      const response = await apiClient.contracts.getAll(address)
      setDeployedContracts(response.data.contracts || [])
    } catch (error: any) {
      console.error('Error loading contracts:', error)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [selectedCategory, searchQuery])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getExplorerUrl = (chainId: number, address: string) => {
    if (chainId === 80002) {
      return `https://amoy.polygonscan.com/address/${address}`
    } else if (chainId === 137) {
      return `https://polygonscan.com/address/${address}`
    }
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-3">
              <FileCode className="w-3 h-3 text-primary-400" />
              <span className="text-xs font-medium text-primary-300">Smart Contracts</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              Contract <span className="text-gradient">Deployment</span>
            </h1>
            <p className="text-gray-400">
              Deploy, manage, and interact with smart contracts
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: 'templates', label: 'Templates', icon: Layers },
            { id: 'deployed', label: 'Deployed', icon: FileCode, count: deployedContracts.length },
            { id: 'deploy', label: 'Deploy', icon: Plus },
            { id: 'interact', label: 'Interact', icon: Zap, disabled: !selectedContract },
            { id: 'abis', label: 'ABI Manager', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setViewMode(tab.id as ViewMode)}
                disabled={tab.disabled}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap
                  ${viewMode === tab.id
                    ? 'bg-gradient-to-r from-primary-500 to-accent-pink text-white shadow-glow-purple'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                  }
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Templates View */}
        {viewMode === 'templates' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`
                      px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all
                      ${selectedCategory === cat
                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                      }
                    `}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : templates.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <FileCode className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold mb-2">No Templates Found</h3>
                <p className="text-gray-400 mb-4">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Unable to load contract templates. Please check your connection or try refreshing the page.'}
                </p>
                {(!searchQuery && selectedCategory === 'all') && (
                  <button
                    onClick={() => {
                      setLoading(true)
                      loadTemplates()
                    }}
                    className="px-6 py-3 rounded-xl bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 font-medium transition-all"
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template, i) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="glass-card p-6 group cursor-pointer relative overflow-hidden"
                    onClick={() => {
                      setSelectedContract(null)
                      setViewMode('deploy')
                      // Store template in sessionStorage for deployer
                      sessionStorage.setItem('selectedTemplate', JSON.stringify(template))
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-pink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl">{template.icon}</div>
                        {template.upgradeable && (
                          <span className="px-2 py-1 rounded-lg bg-accent-cyan/20 text-accent-cyan text-xs font-medium border border-accent-cyan/30">
                            Upgradeable
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2 group-hover:text-gradient transition-all">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-lg bg-white/5 text-xs text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 text-primary-400 text-sm font-medium">
                        <span>Deploy</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deployed Contracts View */}
        {viewMode === 'deployed' && (
          <div className="space-y-4">
            {!isConnected ? (
              <div className="glass-card p-12 text-center">
                <FileCode className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
                <p className="text-gray-400 mb-6">Connect your wallet to view deployed contracts</p>
              </div>
            ) : deployedContracts.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <FileCode className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold mb-2">No Contracts Deployed</h3>
                <p className="text-gray-400 mb-6">Deploy your first contract to get started</p>
                <button
                  onClick={() => setViewMode('deploy')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold shadow-glow-purple"
                >
                  Deploy Contract
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {deployedContracts.map((contract, i) => (
                  <motion.div
                    key={contract.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-6 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-pink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1 group-hover:text-gradient transition-all">
                            {contract.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                            <span>{contract.address.slice(0, 10)}...{contract.address.slice(-8)}</span>
                            <button
                              onClick={() => copyToClipboard(contract.address)}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {contract.is_upgradeable && (
                            <span className="px-2 py-1 rounded-lg bg-accent-cyan/20 text-accent-cyan text-xs font-medium border border-accent-cyan/30">
                              Upgradeable
                            </span>
                          )}
                          {getExplorerUrl(contract.chain_id, contract.address) && (
                            <a
                              href={getExplorerUrl(contract.chain_id, contract.address)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="text-xs text-gray-500 mb-1">Chain ID</div>
                          <div className="font-semibold">{contract.chain_id}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="text-xs text-gray-500 mb-1">Template</div>
                          <div className="font-semibold text-sm truncate">
                            {contract.template_id || 'Custom'}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="text-xs text-gray-500 mb-1">Deployed</div>
                          <div className="font-semibold text-sm">
                            {new Date(contract.deployed_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                          <div className="text-xs text-gray-500 mb-1">Functions</div>
                          <div className="font-semibold">
                            {contract.abi?.filter((item: any) => item.type === 'function').length || 0}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedContract(contract)
                            setViewMode('interact')
                          }}
                          className="flex-1 px-4 py-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 font-medium text-sm transition-all"
                        >
                          Interact
                        </button>
                        {contract.is_upgradeable && (
                          <button
                            className="px-4 py-2 rounded-lg bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan font-medium text-sm transition-all"
                          >
                            Upgrade
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deploy View */}
        {viewMode === 'deploy' && (
          <ContractDeployer
            onDeploySuccess={() => {
              loadDeployedContracts()
              setViewMode('deployed')
            }}
            onCancel={() => setViewMode('templates')}
          />
        )}

        {/* Interact View */}
        {viewMode === 'interact' && selectedContract && (
          <ContractInteraction
            contract={selectedContract}
            onBack={() => {
              setSelectedContract(null)
              setViewMode('deployed')
            }}
          />
        )}

        {/* ABI Manager View */}
        {viewMode === 'abis' && (
          <ABIManager walletAddress={address || undefined} />
        )}
      </div>
    </DashboardLayout>
  )
}
























