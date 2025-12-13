'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCw,
  Loader2,
  ArrowUpCircle,
  Database,
  X,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Scale,
  Plus,
  Minus,
  Server,
  History,
  ShieldCheck,
  Activity,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ChainManagementProps {
  chainId: string
  chainStatus: string
  onStatusChange?: () => void
}

interface ActionButtonProps {
  icon: any
  label: string
  description: string
  onClick: () => void
  disabled?: boolean
  variant: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary'
  loading?: boolean
}

const ActionButton = ({ icon: Icon, label, description, onClick, disabled, variant, loading }: ActionButtonProps) => {
  const variants = {
    success: 'from-accent-emerald/20 to-accent-emerald/5 border-accent-emerald/30 hover:border-accent-emerald/60',
    warning: 'from-accent-amber/20 to-accent-amber/5 border-accent-amber/30 hover:border-accent-amber/60',
    danger: 'from-red-500/20 to-red-500/5 border-red-500/30 hover:border-red-500/60',
    info: 'from-accent-cyan/20 to-accent-cyan/5 border-accent-cyan/30 hover:border-accent-cyan/60',
    primary: 'from-primary-500/20 to-primary-500/5 border-primary-500/30 hover:border-primary-500/60',
    secondary: 'from-gray-500/20 to-gray-500/5 border-gray-500/30 hover:border-gray-500/60',
  }
  
  const iconColors = {
    success: 'text-accent-emerald',
    warning: 'text-accent-amber',
    danger: 'text-red-400',
    info: 'text-accent-cyan',
    primary: 'text-primary-400',
    secondary: 'text-gray-400',
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative group overflow-hidden rounded-2xl p-5 border transition-all w-full
        bg-gradient-to-br ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-dense opacity-10" />
      
      {/* Hover Glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${variants[variant]} blur-xl`} />
      
      <div className="relative z-10 flex flex-col items-center text-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${iconColors[variant]}`}>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </div>
        <div>
          <div className="font-semibold text-white mb-1">{label}</div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
      </div>
    </motion.button>
  )
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  icon: any
  iconColor: string
  children: React.ReactNode
}

const Modal = ({ isOpen, onClose, title, description, icon: Icon, iconColor, children }: ModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md glass-card p-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl ${iconColor} flex items-center justify-center`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
          
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

export default function ChainManagement({ chainId, chainStatus, onStatusChange }: ChainManagementProps) {
  const [loading, setLoading] = useState(false)
  const [actionType, setActionType] = useState<string | null>(null)
  
  // Modal states
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showScaleModal, setShowScaleModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Form states
  const [backups, setBackups] = useState<any[]>([])
  const [backupType, setBackupType] = useState('full')
  const [upgradeVersion, setUpgradeVersion] = useState('')
  const [upgradeDescription, setUpgradeDescription] = useState('')
  const [scaleAction, setScaleAction] = useState<'add' | 'remove'>('add')
  const [validatorCount, setValidatorCount] = useState(1)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  
  // Chain events history
  const [events, setEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  // Load chain events
  const loadEvents = async () => {
    setLoadingEvents(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/chains/${chainId}/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [chainId])

  // Pause/Resume Chain
  const handlePauseResume = async () => {
    const action = chainStatus === 'active' ? 'pause' : 'resume'
    setLoading(true)
    setActionType(action)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/chains/${chainId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || `Chain ${action}d successfully`)
        onStatusChange?.()
        loadEvents()
      } else {
        const error = await response.json()
        toast.error(error.message || `Failed to ${action} chain`)
      }
    } catch (error) {
      console.error(`Error ${action}ing chain:`, error)
      toast.error(`Failed to ${action} chain`)
    } finally {
      setLoading(false)
      setActionType(null)
    }
  }

  // Load Backups
  const loadBackups = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/chains/${chainId}/backups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups || [])
      }
    } catch (error) {
      console.error('Error loading backups:', error)
    }
  }

  // Create Backup
  const handleCreateBackup = async () => {
    setLoading(true)
    setActionType('backup')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/chains/${chainId}/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backupType })
      })

      if (response.ok) {
        toast.success('Backup created successfully')
        setShowBackupModal(false)
        loadBackups()
        loadEvents()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create backup')
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Failed to create backup')
    } finally {
      setLoading(false)
      setActionType(null)
    }
  }

  // Restore Backup
  const handleRestoreBackup = async (backupId: string) => {
    setLoading(true)
    setActionType('restore')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/chains/${chainId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backupId })
      })

      if (response.ok) {
        toast.success('Chain restored successfully')
        setShowRestoreModal(false)
        onStatusChange?.()
        loadEvents()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to restore backup')
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast.error('Failed to restore backup')
    } finally {
      setLoading(false)
      setActionType(null)
    }
  }

  // Upgrade Chain
  const handleUpgrade = async () => {
    if (!upgradeVersion) {
      toast.error('Please enter a target version')
      return
    }

    setLoading(true)
    setActionType('upgrade')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/chains/${chainId}/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          toVersion: upgradeVersion,
          description: upgradeDescription
        })
      })

      if (response.ok) {
        toast.success('Chain upgrade initiated')
        setShowUpgradeModal(false)
        setUpgradeVersion('')
        setUpgradeDescription('')
        onStatusChange?.()
        loadEvents()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to initiate upgrade')
      }
    } catch (error) {
      console.error('Error upgrading chain:', error)
      toast.error('Failed to initiate upgrade')
    } finally {
      setLoading(false)
      setActionType(null)
    }
  }

  // Scale Chain (Add/Remove Validators)
  const handleScale = async () => {
    setLoading(true)
    setActionType('scale')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/chains/${chainId}/scale`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: scaleAction,
          count: validatorCount
        })
      })

      if (response.ok) {
        toast.success(`Successfully ${scaleAction === 'add' ? 'added' : 'removed'} ${validatorCount} validator(s)`)
        setShowScaleModal(false)
        setValidatorCount(1)
        onStatusChange?.()
        loadEvents()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to scale chain')
      }
    } catch (error) {
      console.error('Error scaling chain:', error)
      toast.error('Failed to scale chain')
    } finally {
      setLoading(false)
      setActionType(null)
    }
  }

  // Delete Chain
  const handleDeleteChain = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setLoading(true)
    setActionType('delete')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/api/chains/${chainId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Chain deleted successfully')
        // Redirect to chains list
        window.location.href = '/dashboard/chains'
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete chain')
      }
    } catch (error) {
      console.error('Error deleting chain:', error)
      toast.error('Failed to delete chain')
    } finally {
      setLoading(false)
      setActionType(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pause/Resume */}
        <ActionButton
          icon={chainStatus === 'active' ? Pause : Play}
          label={chainStatus === 'active' ? 'Pause Chain' : 'Resume Chain'}
          description={chainStatus === 'active' ? 'Temporarily stop operations' : 'Restart chain operations'}
          onClick={handlePauseResume}
          disabled={loading || chainStatus === 'deploying' || chainStatus === 'upgrading'}
          variant={chainStatus === 'active' ? 'warning' : 'success'}
          loading={loading && actionType === 'pause' || loading && actionType === 'resume'}
        />

        {/* Backup */}
        <ActionButton
          icon={Database}
          label="Create Backup"
          description="Save current state"
          onClick={() => {
            loadBackups()
            setShowBackupModal(true)
          }}
          disabled={loading || chainStatus !== 'active'}
          variant="info"
        />

        {/* Restore */}
        <ActionButton
          icon={RotateCw}
          label="Restore"
          description="Restore from backup"
          onClick={() => {
            loadBackups()
            setShowRestoreModal(true)
          }}
          disabled={loading}
          variant="primary"
        />

        {/* Upgrade */}
        <ActionButton
          icon={ArrowUpCircle}
          label="Upgrade"
          description="Update to new version"
          onClick={() => setShowUpgradeModal(true)}
          disabled={loading || chainStatus === 'upgrading'}
          variant="info"
        />
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-4">
        {/* Scale */}
        <ActionButton
          icon={Scale}
          label="Scale Validators"
          description="Add or remove validators"
          onClick={() => setShowScaleModal(true)}
          disabled={loading || chainStatus !== 'active'}
          variant="primary"
        />

        {/* Delete */}
        <ActionButton
          icon={Trash2}
          label="Delete Chain"
          description="Permanently remove chain"
          onClick={() => setShowDeleteModal(true)}
          disabled={loading}
          variant="danger"
        />
      </div>

      {/* Recent Events */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center">
              <History className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h4 className="font-semibold">Recent Events</h4>
              <p className="text-sm text-gray-400">Chain activity history</p>
            </div>
          </div>
          <button 
            onClick={loadEvents}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <RotateCw className={`w-4 h-4 text-gray-400 ${loadingEvents ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {events.slice(0, 10).map((event, i) => (
              <motion.div
                key={event.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  event.event_type === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                  event.event_type === 'resumed' ? 'bg-emerald-500/20 text-emerald-400' :
                  event.event_type === 'backup_created' ? 'bg-cyan-500/20 text-cyan-400' :
                  event.event_type === 'upgraded' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {event.event_type === 'paused' ? <Pause className="w-4 h-4" /> :
                   event.event_type === 'resumed' ? <Play className="w-4 h-4" /> :
                   event.event_type === 'backup_created' ? <Database className="w-4 h-4" /> :
                   event.event_type === 'upgraded' ? <ArrowUpCircle className="w-4 h-4" /> :
                   <Activity className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm capitalize">{event.event_type?.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-gray-400 truncate">{event.description}</div>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(event.created_at).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Backup Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Create Backup"
        description="Save your chain state"
        icon={Database}
        iconColor="bg-gradient-to-br from-accent-cyan to-blue-600"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Backup Type</label>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              className="input"
            >
              <option value="full">Full Backup</option>
              <option value="incremental">Incremental Backup</option>
              <option value="snapshot">Snapshot</option>
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateBackup}
            disabled={loading}
            className="btn btn-primary w-full py-3"
          >
            {loading && actionType === 'backup' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Create Backup
              </>
            )}
          </motion.button>
        </div>
      </Modal>

      {/* Restore Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Restore from Backup"
        description="Select a backup to restore"
        icon={RotateCw}
        iconColor="bg-gradient-to-br from-primary-500 to-accent-pink"
      >
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {backups.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No backups available
            </div>
          ) : (
            backups.map((backup) => (
              <motion.div
                key={backup.id}
                whileHover={{ scale: 1.01 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">{backup.backup_type} Backup</div>
                    <div className="text-xs text-gray-400">
                      {new Date(backup.created_at).toLocaleString()}
                    </div>
                    {backup.size_bytes && (
                      <div className="text-xs text-gray-500 mt-1">
                        Size: {(backup.size_bytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${
                      backup.status === 'completed' ? 'badge-success' :
                      backup.status === 'in_progress' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {backup.status}
                    </span>
                    {backup.status === 'completed' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-semibold transition-all"
                      >
                        Restore
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Modal>

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Chain"
        description="Update to a new version"
        icon={ArrowUpCircle}
        iconColor="bg-gradient-to-br from-accent-cyan to-blue-600"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Target Version</label>
            <input
              type="text"
              value={upgradeVersion}
              onChange={(e) => setUpgradeVersion(e.target.value)}
              placeholder="e.g., 2.0.0"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={upgradeDescription}
              onChange={(e) => setUpgradeDescription(e.target.value)}
              placeholder="Describe the upgrade..."
              rows={3}
              className="input resize-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgrade}
            disabled={loading || !upgradeVersion}
            className="btn btn-primary w-full py-3"
          >
            {loading && actionType === 'upgrade' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Initiating Upgrade...
              </>
            ) : (
              <>
                <ArrowUpCircle className="w-5 h-5" />
                Initiate Upgrade
              </>
            )}
          </motion.button>
        </div>
      </Modal>

      {/* Scale Modal */}
      <Modal
        isOpen={showScaleModal}
        onClose={() => setShowScaleModal(false)}
        title="Scale Validators"
        description="Adjust your validator count"
        icon={Scale}
        iconColor="bg-gradient-to-br from-primary-500 to-accent-pink"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Action</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setScaleAction('add')}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  scaleAction === 'add'
                    ? 'bg-accent-emerald/20 border-accent-emerald/50 text-accent-emerald'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Add</span>
              </button>
              <button
                onClick={() => setScaleAction('remove')}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  scaleAction === 'remove'
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Minus className="w-5 h-5" />
                <span className="text-sm font-medium">Remove</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Number of Validators</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setValidatorCount(Math.max(1, validatorCount - 1))}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                value={validatorCount}
                onChange={(e) => setValidatorCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="input text-center w-20"
              />
              <button
                onClick={() => setValidatorCount(validatorCount + 1)}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleScale}
            disabled={loading}
            className="btn btn-primary w-full py-3"
          >
            {loading && actionType === 'scale' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scaling...
              </>
            ) : (
              <>
                <Server className="w-5 h-5" />
                {scaleAction === 'add' ? 'Add' : 'Remove'} {validatorCount} Validator{validatorCount > 1 ? 's' : ''}
              </>
            )}
          </motion.button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteConfirmation('')
        }}
        title="Delete Chain"
        description="This action cannot be undone"
        icon={Trash2}
        iconColor="bg-gradient-to-br from-red-500 to-red-700"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Warning</span>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              This will permanently delete the chain and all associated data including validators, backups, and transaction history. This action cannot be reversed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Type <span className="text-red-400 font-mono">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE"
              className="input"
            />
          </div>

          <motion.button
            whileHover={{ scale: deleteConfirmation === 'DELETE' ? 1.02 : 1 }}
            whileTap={{ scale: deleteConfirmation === 'DELETE' ? 0.98 : 1 }}
            onClick={handleDeleteChain}
            disabled={loading || deleteConfirmation !== 'DELETE'}
            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && actionType === 'delete' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Delete Chain Permanently
              </>
            )}
          </motion.button>
        </div>
      </Modal>
    </div>
  )
}
