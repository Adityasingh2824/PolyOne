'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Play, 
  Eye, 
  Edit, 
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code,
  Zap
} from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

interface ContractInteractionProps {
  contract: {
    id: string
    name: string
    address: string
    chain_id: number
    abi: any[]
  }
  onBack: () => void
}

export default function ContractInteraction({ contract, onBack }: ContractInteractionProps) {
  const { address, isConnected, getProvider } = useWallet()
  const [functions, setFunctions] = useState<any[]>([])
  const [selectedFunction, setSelectedFunction] = useState<any>(null)
  const [functionParams, setFunctionParams] = useState<Record<string, any>>({})
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (contract.abi) {
      const funcs = contract.abi.filter((item: any) => item.type === 'function')
      setFunctions(funcs)
    }
  }, [contract.abi])

  const handleReadFunction = async (func: any) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const provider = await getProvider()
      const ethersProvider = new ethers.BrowserProvider(provider)
      const contractInstance = new ethers.Contract(contract.address, contract.abi, ethersProvider)

      // Build parameters
      const inputs = func.inputs || []
      const params = inputs.map((input: any) => {
        const value = functionParams[input.name] || ''
        // Convert based on type
        if (input.type === 'uint256' || input.type === 'uint8' || input.type === 'uint') {
          return value ? BigInt(value) : BigInt(0)
        }
        return value
      })

      // Call the function
      const response = await contractInstance[func.name](...params)
      
      // Format result
      if (Array.isArray(response)) {
        setResult(response.map((r: any) => r.toString()))
      } else {
        setResult(response.toString())
      }
    } catch (err: any) {
      console.error('Read error:', err)
      setError(err?.message || 'Failed to read from contract')
      toast.error(err?.message || 'Failed to read from contract')
    } finally {
      setLoading(false)
    }
  }

  const handleWriteFunction = async (func: any) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const provider = await getProvider()
      const ethersProvider = new ethers.BrowserProvider(provider)
      const signer = await ethersProvider.getSigner()
      const contractInstance = new ethers.Contract(contract.address, contract.abi, signer)

      // Build parameters
      const inputs = func.inputs || []
      const params = inputs.map((input: any) => {
        const value = functionParams[input.name] || ''
        // Convert based on type
        if (input.type === 'uint256' || input.type === 'uint8' || input.type === 'uint') {
          return value ? BigInt(value) : BigInt(0)
        }
        return value
      })

      // Estimate gas
      const gasEstimate = await contractInstance[func.name].estimateGas(...params)
      
      // Send transaction
      toast.loading('Confirm transaction in your wallet...', { id: 'tx-pending' })
      const tx = await contractInstance[func.name](...params, {
        gasLimit: gasEstimate * BigInt(120) / BigInt(100) // Add 20% buffer
      })

      toast.loading('Waiting for confirmation...', { id: 'tx-pending' })
      const receipt = await tx.wait()

      setResult({
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      })

      toast.success('Transaction confirmed!', { id: 'tx-pending' })
    } catch (err: any) {
      console.error('Write error:', err)
      const errorMsg = err?.reason || err?.message || 'Transaction failed'
      setError(errorMsg)
      toast.error(errorMsg, { id: 'tx-pending' })
    } finally {
      setLoading(false)
    }
  }

  const isReadOnly = (func: any) => {
    return func.stateMutability === 'view' || func.stateMutability === 'pure'
  }

  const getExplorerUrl = (txHash: string) => {
    if (contract.chain_id === 80002) {
      return `https://amoy.polygonscan.com/tx/${txHash}`
    } else if (contract.chain_id === 137) {
      return `https://polygonscan.com/tx/${txHash}`
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-1">{contract.name}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
            <span>{contract.address.slice(0, 10)}...{contract.address.slice(-8)}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(contract.address)
                toast.success('Copied!')
              }}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Functions List */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Available Functions
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {functions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No functions found in ABI</p>
              </div>
            ) : (
              functions.map((func, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedFunction(func)
                    setFunctionParams({})
                    setResult(null)
                    setError(null)
                  }}
                  className={`
                    w-full p-4 rounded-xl text-left transition-all
                    ${selectedFunction?.name === func.name
                      ? 'bg-primary-500/20 border border-primary-500/30'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono font-semibold text-sm">{func.name}</div>
                    {isReadOnly(func) ? (
                      <span className="px-2 py-1 rounded-lg bg-accent-cyan/20 text-accent-cyan text-xs">
                        <Eye className="w-3 h-3 inline mr-1" />
                        Read
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-accent-pink/20 text-accent-pink text-xs">
                        <Edit className="w-3 h-3 inline mr-1" />
                        Write
                      </span>
                    )}
                  </div>
                  {func.inputs && func.inputs.length > 0 && (
                    <div className="text-xs text-gray-400">
                      ({func.inputs.map((input: any) => `${input.name}: ${input.type}`).join(', ')})
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Function Interaction */}
        <div className="glass-card p-6">
          {selectedFunction ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2">{selectedFunction.name}</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {isReadOnly(selectedFunction) 
                    ? 'Read-only function - no transaction required'
                    : 'Write function - requires transaction and gas fees'
                  }
                </p>
              </div>

              {/* Parameters */}
              {selectedFunction.inputs && selectedFunction.inputs.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-3">Parameters</label>
                  <div className="space-y-3">
                    {selectedFunction.inputs.map((input: any, i: number) => (
                      <div key={i}>
                        <label className="block text-xs text-gray-400 mb-1">
                          {input.name} <span className="text-primary-400">({input.type})</span>
                        </label>
                        <input
                          type={input.type.includes('uint') ? 'number' : 'text'}
                          value={functionParams[input.name] || ''}
                          onChange={(e) => {
                            setFunctionParams({
                              ...functionParams,
                              [input.name]: e.target.value
                            })
                          }}
                          placeholder={`Enter ${input.name}`}
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execute Button */}
              <button
                onClick={() => {
                  if (isReadOnly(selectedFunction)) {
                    handleReadFunction(selectedFunction)
                  } else {
                    handleWriteFunction(selectedFunction)
                  }
                }}
                disabled={loading}
                className={`
                  w-full px-6 py-3 rounded-xl font-semibold shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                  ${isReadOnly(selectedFunction)
                    ? 'bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan'
                    : 'bg-gradient-to-r from-primary-500 to-accent-pink text-white'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isReadOnly(selectedFunction) ? 'Reading...' : 'Executing...'}
                  </>
                ) : (
                  <>
                    {isReadOnly(selectedFunction) ? (
                      <>
                        <Eye className="w-4 h-4" />
                        Read
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Execute
                      </>
                    )}
                  </>
                )}
              </button>

              {/* Result */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
                    <span className="text-sm font-semibold text-accent-emerald">Result</span>
                  </div>
                  {typeof result === 'object' && result.txHash ? (
                    <div className="space-y-2">
                      <div className="text-sm font-mono break-all">{result.txHash}</div>
                      {getExplorerUrl(result.txHash) && (
                        <a
                          href={getExplorerUrl(result.txHash)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-400 hover:text-primary-300"
                        >
                          View on Explorer →
                        </a>
                      )}
                      <div className="text-xs text-gray-400">
                        Block: {result.blockNumber} | Gas: {result.gasUsed}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-mono break-all">{JSON.stringify(result, null, 2)}</div>
                  )}
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">Error</span>
                  </div>
                  <div className="text-sm text-red-300">{error}</div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a function to interact with</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
























