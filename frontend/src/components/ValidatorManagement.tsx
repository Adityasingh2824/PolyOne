'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Server,
  Plus,
  Trash2,
  Activity,
  TrendingUp,
  Coins,
  Shield,
  Loader2,
  Gift,
  X,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Target,
  TrendingDown,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Validator {
  id: string
  name: string
  address: string
  status: string
  stake_amount: number
  rewards_earned: number
  total_blocks_produced: number
  missed_blocks: number
  uptime_percentage: number
  is_genesis: boolean
  activated_at: string
  last_active_at?: string
}

interface ValidatorManagementProps {
  chainId: string
  onUpdate?: () => void
}

// Stats Card Component
const StatCard = ({ icon: Icon, label, value, subValue, trend, color }: {
  icon: any
  label: string
  value: string | number
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  color: string
}) => (
  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs text-gray-400">{label}</span>
      {trend && (
        <span className={`ml-auto ${trend === 'up' ? 'text-accent-emerald' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
        </span>
      )}
    </div>
    <div className="text-xl font-bold">{value}</div>
    {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
  </div>
)

// Validator Card Component
const ValidatorCard = ({ 
  validator, 
  index, 
  onStake, 
  onReward, 
  onRemove, 
  onSlash,
  onViewPerformance,
  isExpanded,
  onToggleExpand,
  actionLoading 
}: {
  validator: Validator
  index: number
  onStake: () => void
  onReward: () => void
  onRemove: () => void
  onSlash: () => void
  onViewPerformance: () => void
  isExpanded: boolean
  onToggleExpand: () => void
  actionLoading: boolean
}) => {
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
  
  const statusColors = {
    active: 'badge-success',
    inactive: 'badge-secondary',
    slashed: 'badge-danger',
    pending: 'badge-warning',
    removed: 'badge-secondary',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card overflow-hidden"
    >
      {/* Main Info */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center shadow-glow-purple"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Server className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-lg">{validator.name}</h4>
                {validator.is_genesis && (
                  <span className="badge badge-info text-xs">Genesis</span>
                )}
              </div>
              <p className="text-sm text-gray-400 font-mono">{formatAddress(validator.address)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${statusColors[validator.status as keyof typeof statusColors] || 'badge-secondary'}`}>
              {validator.status}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleExpand}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Coins}
            label="Stake"
            value={`${validator.stake_amount.toFixed(2)}`}
            subValue="POL"
            color="text-accent-amber"
          />
          <StatCard
            icon={Gift}
            label="Rewards"
            value={`${validator.rewards_earned.toFixed(2)}`}
            subValue="POL"
            trend="up"
            color="text-accent-emerald"
          />
          <StatCard
            icon={BarChart3}
            label="Blocks"
            value={validator.total_blocks_produced.toLocaleString()}
            subValue={`${validator.missed_blocks} missed`}
            color="text-accent-cyan"
          />
          <StatCard
            icon={Activity}
            label="Uptime"
            value={`${validator.uptime_percentage.toFixed(1)}%`}
            trend={validator.uptime_percentage >= 99 ? 'up' : validator.uptime_percentage >= 95 ? 'neutral' : 'down'}
            color="text-primary-400"
          />
        </div>
      </div>

      {/* Expanded Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5"
          >
            <div className="p-5 space-y-4">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Last Active</div>
                  <div className="text-sm font-medium">
                    {validator.last_active_at 
                      ? new Date(validator.last_active_at).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Activated</div>
                  <div className="text-sm font-medium">
                    {validator.activated_at 
                      ? new Date(validator.activated_at).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Block Rate</div>
                  <div className="text-sm font-medium">
                    {validator.total_blocks_produced > 0 
                      ? `${((validator.total_blocks_produced - validator.missed_blocks) / validator.total_blocks_produced * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Status</div>
                  <div className={`text-sm font-medium ${
                    validator.status === 'active' ? 'text-accent-emerald' :
                    validator.status === 'slashed' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {validator.status === 'active' ? '● Online' : 
                     validator.status === 'slashed' ? '✕ Slashed' : 
                     '○ Offline'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {validator.status === 'active' && (
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onStake}
                    disabled={actionLoading}
                    className="flex-1 min-w-[120px] px-4 py-2.5 rounded-xl bg-accent-amber/20 hover:bg-accent-amber/30 border border-accent-amber/30 text-accent-amber text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Coins className="w-4 h-4" />
                    Stake
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onReward}
                    disabled={actionLoading}
                    className="flex-1 min-w-[120px] px-4 py-2.5 rounded-xl bg-accent-emerald/20 hover:bg-accent-emerald/30 border border-accent-emerald/30 text-accent-emerald text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    Reward
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onViewPerformance}
                    className="flex-1 min-w-[120px] px-4 py-2.5 rounded-xl bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 text-primary-400 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Performance
                  </motion.button>
                  {!validator.is_genesis && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onSlash}
                        disabled={actionLoading}
                        className="px-4 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Slash
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onRemove}
                        disabled={actionLoading}
                        className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </motion.button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ValidatorManagement({ chainId, onUpdate }: ValidatorManagementProps) {
  const [validators, setValidators] = useState<Validator[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [expandedValidator, setExpandedValidator] = useState<string | null>(null)
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [showSlashModal, setShowSlashModal] = useState(false)
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null)
  const [newValidatorName, setNewValidatorName] = useState('')
  const [initialStake, setInitialStake] = useState('')
  const [stakeAmount, setStakeAmount] = useState('')
  const [stakeAction, setStakeAction] = useState<'add' | 'withdraw'>('add')
  const [rewardAmount, setRewardAmount] = useState('')
  const [slashPercentage, setSlashPercentage] = useState('10')
  const [slashReason, setSlashReason] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    loadValidators()
  }, [chainId])

  const loadValidators = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/validators/chain/${chainId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setValidators(data.validators || [])
      }
    } catch (error) {
      console.error('Error loading validators:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddValidator = async () => {
    if (!newValidatorName) {
      toast.error('Please enter a validator name')
      return
    }

    setActionLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/validators/chain/${chainId}/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: newValidatorName,
          stakeAmount: parseFloat(initialStake) || 0
        })
      })

      if (response.ok) {
        toast.success('Validator added successfully')
        setShowAddModal(false)
        setNewValidatorName('')
        setInitialStake('')
        loadValidators()
        onUpdate?.()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add validator')
      }
    } catch (error) {
      console.error('Error adding validator:', error)
      toast.error('Failed to add validator')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveValidator = async (validatorId: string, validatorName: string) => {
    if (!confirm(`Are you sure you want to remove validator "${validatorName}"?`)) {
      return
    }

    setActionLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/validators/chain/${chainId}/remove/${validatorId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Validator removed successfully')
        loadValidators()
        onUpdate?.()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to remove validator')
      }
    } catch (error) {
      console.error('Error removing validator:', error)
      toast.error('Failed to remove validator')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error('Please enter a valid stake amount')
      return
    }

    if (!selectedValidator) return

    setActionLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/validators/${selectedValidator.id}/stake`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          amount: parseFloat(stakeAmount),
          action: stakeAction
        })
      })

      if (response.ok) {
        toast.success(`Successfully ${stakeAction === 'add' ? 'staked' : 'withdrew'} ${stakeAmount} POL`)
        setShowStakeModal(false)
        setStakeAmount('')
        loadValidators()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update stake')
      }
    } catch (error) {
      console.error('Error updating stake:', error)
      toast.error('Failed to update stake')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDistributeReward = async () => {
    if (!rewardAmount || parseFloat(rewardAmount) <= 0) {
      toast.error('Please enter a valid reward amount')
      return
    }

    if (!selectedValidator) return

    setActionLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/validators/${selectedValidator.id}/distribute-rewards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(rewardAmount) })
      })

      if (response.ok) {
        toast.success(`Distributed ${rewardAmount} POL reward`)
        setShowRewardModal(false)
        setRewardAmount('')
        loadValidators()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to distribute reward')
      }
    } catch (error) {
      console.error('Error distributing reward:', error)
      toast.error('Failed to distribute reward')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSlash = async () => {
    if (!selectedValidator) return

    setActionLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/validators/${selectedValidator.id}/slash`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          percentage: parseFloat(slashPercentage),
          reason: slashReason
        })
      })

      if (response.ok) {
        toast.success(`Validator slashed by ${slashPercentage}%`)
        setShowSlashModal(false)
        setSlashPercentage('10')
        setSlashReason('')
        loadValidators()
        onUpdate?.()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to slash validator')
      }
    } catch (error) {
      console.error('Error slashing validator:', error)
      toast.error('Failed to slash validator')
    } finally {
      setActionLoading(false)
    }
  }

  // Calculate totals
  const totalStake = validators.reduce((sum, v) => sum + v.stake_amount, 0)
  const totalRewards = validators.reduce((sum, v) => sum + v.rewards_earned, 0)
  const avgUptime = validators.length > 0 
    ? validators.reduce((sum, v) => sum + v.uptime_percentage, 0) / validators.length 
    : 0
  const activeValidators = validators.filter(v => v.status === 'active').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-primary-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center shadow-glow-purple">
            <Server className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Validators</h3>
            <p className="text-sm text-gray-400">{validators.length} total • {activeValidators} active</p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadValidators}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple hover:shadow-glow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Validator
          </motion.button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-amber/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-accent-amber" />
            </div>
            <span className="text-sm text-gray-400">Total Stake</span>
          </div>
          <div className="text-2xl font-bold">{totalStake.toFixed(2)} <span className="text-sm text-gray-400">POL</span></div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-emerald/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-accent-emerald" />
            </div>
            <span className="text-sm text-gray-400">Total Rewards</span>
          </div>
          <div className="text-2xl font-bold text-accent-emerald">{totalRewards.toFixed(2)} <span className="text-sm text-gray-400">POL</span></div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-sm text-gray-400">Avg. Uptime</span>
          </div>
          <div className="text-2xl font-bold">{avgUptime.toFixed(1)}%</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-cyan" />
            </div>
            <span className="text-sm text-gray-400">Active</span>
          </div>
          <div className="text-2xl font-bold">{activeValidators} <span className="text-sm text-gray-400">/ {validators.length}</span></div>
        </div>
      </div>

      {/* Validators Grid */}
      {validators.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Server className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h4 className="text-lg font-semibold mb-2">No Validators</h4>
          <p className="text-gray-400 mb-6">Add your first validator to secure the network</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold shadow-glow-purple"
          >
            Add First Validator
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          {validators.map((validator, index) => (
            <ValidatorCard
              key={validator.id}
              validator={validator}
              index={index}
              isExpanded={expandedValidator === validator.id}
              onToggleExpand={() => setExpandedValidator(expandedValidator === validator.id ? null : validator.id)}
              onStake={() => {
                setSelectedValidator(validator)
                setStakeAction('add')
                setShowStakeModal(true)
              }}
              onReward={() => {
                setSelectedValidator(validator)
                setShowRewardModal(true)
              }}
              onRemove={() => handleRemoveValidator(validator.id, validator.name)}
              onSlash={() => {
                setSelectedValidator(validator)
                setShowSlashModal(true)
              }}
              onViewPerformance={() => {
                setSelectedValidator(validator)
                setShowPerformanceModal(true)
              }}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Add Validator Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-card p-6"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Add Validator</h3>
                  <p className="text-sm text-gray-400">Create a new validator node</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Validator Name</label>
                  <input
                    type="text"
                    value={newValidatorName}
                    onChange={(e) => setNewValidatorName(e.target.value)}
                    placeholder="e.g., Validator-01"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Initial Stake (Optional)</label>
                  <input
                    type="number"
                    value={initialStake}
                    onChange={(e) => setInitialStake(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="input"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddValidator}
                  disabled={actionLoading || !newValidatorName}
                  className="btn btn-primary w-full py-3"
                >
                  {actionLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Adding...</>
                  ) : (
                    <><Plus className="w-5 h-5" /> Add Validator</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stake Modal */}
      <AnimatePresence>
        {showStakeModal && selectedValidator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStakeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-card p-6"
            >
              <button onClick={() => setShowStakeModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-amber to-orange-600 flex items-center justify-center">
                  <Coins className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Manage Stake</h3>
                  <p className="text-sm text-gray-400">{selectedValidator.name}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 mb-4">
                <div className="text-sm text-gray-400 mb-1">Current Stake</div>
                <div className="text-2xl font-bold">{selectedValidator.stake_amount.toFixed(2)} POL</div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStakeAction('add')}
                    className={`p-4 rounded-xl border transition-all ${
                      stakeAction === 'add'
                        ? 'bg-accent-emerald/20 border-accent-emerald/50 text-accent-emerald'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">Add Stake</span>
                  </button>
                  <button
                    onClick={() => setStakeAction('withdraw')}
                    className={`p-4 rounded-xl border transition-all ${
                      stakeAction === 'withdraw'
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">Withdraw</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="input"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStake}
                  disabled={actionLoading || !stakeAmount}
                  className="btn btn-primary w-full py-3"
                >
                  {actionLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    <><Coins className="w-5 h-5" /> {stakeAction === 'add' ? 'Add' : 'Withdraw'} Stake</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward Modal */}
      <AnimatePresence>
        {showRewardModal && selectedValidator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRewardModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-card p-6"
            >
              <button onClick={() => setShowRewardModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-emerald to-teal-600 flex items-center justify-center">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Distribute Reward</h3>
                  <p className="text-sm text-gray-400">{selectedValidator.name}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 mb-4">
                <div className="text-sm text-gray-400 mb-1">Total Rewards Earned</div>
                <div className="text-2xl font-bold text-accent-emerald">{selectedValidator.rewards_earned.toFixed(2)} POL</div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Reward Amount</label>
                  <input
                    type="number"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="input"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDistributeReward}
                  disabled={actionLoading || !rewardAmount}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-emerald to-teal-500 font-semibold flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Distributing...</>
                  ) : (
                    <><Gift className="w-5 h-5" /> Distribute Reward</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slash Modal */}
      <AnimatePresence>
        {showSlashModal && selectedValidator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSlashModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-card p-6"
            >
              <button onClick={() => setShowSlashModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Slash Validator</h3>
                  <p className="text-sm text-gray-400">{selectedValidator.name}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">Warning</span>
                </div>
                <p className="text-sm text-gray-400">
                  Slashing will penalize this validator by reducing their stake. This action cannot be undone.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 mb-4">
                <div className="text-sm text-gray-400 mb-1">Current Stake</div>
                <div className="text-2xl font-bold">{selectedValidator.stake_amount.toFixed(2)} POL</div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Slash Percentage</label>
                  <select
                    value={slashPercentage}
                    onChange={(e) => setSlashPercentage(e.target.value)}
                    className="input"
                  >
                    <option value="5">5% - Minor Offense</option>
                    <option value="10">10% - Standard Penalty</option>
                    <option value="25">25% - Major Offense</option>
                    <option value="50">50% - Severe Violation</option>
                    <option value="100">100% - Full Slash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reason</label>
                  <textarea
                    value={slashReason}
                    onChange={(e) => setSlashReason(e.target.value)}
                    placeholder="Describe the reason for slashing..."
                    rows={3}
                    className="input resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSlash}
                  disabled={actionLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 font-semibold flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    <><AlertTriangle className="w-5 h-5" /> Slash {slashPercentage}%</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Modal */}
      <AnimatePresence>
        {showPerformanceModal && selectedValidator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPerformanceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl glass-card p-6 max-h-[80vh] overflow-y-auto"
            >
              <button onClick={() => setShowPerformanceModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Performance Metrics</h3>
                  <p className="text-sm text-gray-400">{selectedValidator.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Uptime</div>
                  <div className="text-2xl font-bold">{selectedValidator.uptime_percentage.toFixed(2)}%</div>
                  <div className={`text-xs mt-1 ${selectedValidator.uptime_percentage >= 99 ? 'text-accent-emerald' : 'text-accent-amber'}`}>
                    {selectedValidator.uptime_percentage >= 99 ? '● Excellent' : '○ Needs improvement'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Blocks Produced</div>
                  <div className="text-2xl font-bold">{selectedValidator.total_blocks_produced.toLocaleString()}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Blocks Missed</div>
                  <div className="text-2xl font-bold text-red-400">{selectedValidator.missed_blocks}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Success Rate</div>
                  <div className="text-2xl font-bold">
                    {selectedValidator.total_blocks_produced > 0 
                      ? ((selectedValidator.total_blocks_produced - selectedValidator.missed_blocks) / selectedValidator.total_blocks_produced * 100).toFixed(2)
                      : 0}%
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Stake Amount</div>
                  <div className="text-2xl font-bold">{selectedValidator.stake_amount.toFixed(2)} <span className="text-sm">POL</span></div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-gray-400 mb-1">Rewards Earned</div>
                  <div className="text-2xl font-bold text-accent-emerald">{selectedValidator.rewards_earned.toFixed(2)} <span className="text-sm">POL</span></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5">
                <h4 className="font-semibold mb-3">Validator Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Address</span>
                    <span className="font-mono">{selectedValidator.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={selectedValidator.status === 'active' ? 'text-accent-emerald' : 'text-gray-400'}>
                      {selectedValidator.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Genesis Validator</span>
                    <span>{selectedValidator.is_genesis ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Activated</span>
                    <span>{selectedValidator.activated_at ? new Date(selectedValidator.activated_at).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
