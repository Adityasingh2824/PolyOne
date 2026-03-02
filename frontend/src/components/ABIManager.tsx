'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Plus, 
  Trash2, 
  Copy, 
  Edit,
  Save,
  X,
  Upload,
  Download,
  CheckCircle2
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface ABIManagerProps {
  walletAddress?: string
}

interface SavedABI {
  id: string
  name: string
  abi: any[]
  description?: string
  created_at: string
}

export default function ABIManager({ walletAddress }: ABIManagerProps) {
  const [abis, setAbis] = useState<SavedABI[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    abi: ''
  })

  useEffect(() => {
    if (walletAddress) {
      loadABIs()
    }
  }, [walletAddress])

  const loadABIs = async () => {
    if (!walletAddress) return
    try {
      setLoading(true)
      const response = await apiClient.contracts.getAbis(walletAddress)
      setAbis(response.data.abis || [])
    } catch (error: any) {
      console.error('Error loading ABIs:', error)
      toast.error('Failed to load ABIs')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet')
      return
    }

    if (!formData.name || !formData.abi) {
      toast.error('Please provide name and ABI')
      return
    }

    try {
      let parsedAbi
      try {
        parsedAbi = typeof formData.abi === 'string' ? JSON.parse(formData.abi) : formData.abi
      } catch (e) {
        toast.error('Invalid ABI JSON format')
        return
      }

      if (!Array.isArray(parsedAbi)) {
        toast.error('ABI must be an array')
        return
      }

      await apiClient.contracts.saveAbi({
        name: formData.name,
        abi: parsedAbi,
        description: formData.description || undefined,
        walletAddress
      })

      toast.success('ABI saved successfully!')
      setShowAddForm(false)
      setFormData({ name: '', description: '', abi: '' })
      loadABIs()
    } catch (error: any) {
      console.error('Error saving ABI:', error)
      toast.error(error?.response?.data?.error?.message || 'Failed to save ABI')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ABI?')) return

    try {
      // Note: Delete endpoint would need to be added to backend
      toast.error('Delete functionality requires backend endpoint')
      // await apiClient.contracts.deleteAbi(id)
      // loadABIs()
    } catch (error: any) {
      console.error('Error deleting ABI:', error)
      toast.error('Failed to delete ABI')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content)
        setFormData({
          ...formData,
          abi: JSON.stringify(parsed, null, 2)
        })
        toast.success('ABI file loaded!')
      } catch (error) {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const handleDownload = (abi: SavedABI) => {
    const blob = new Blob([JSON.stringify(abi.abi, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${abi.name.replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('ABI downloaded!')
  }

  const copyABI = (abi: any[]) => {
    navigator.clipboard.writeText(JSON.stringify(abi, null, 2))
    toast.success('ABI copied to clipboard!')
  }

  if (!walletAddress) {
    return (
      <div className="glass-card p-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
        <p className="text-gray-400">Connect your wallet to manage ABIs</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">ABI Manager</h2>
          <p className="text-gray-400">Store and manage contract ABIs for easy access</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold shadow-glow-purple flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add ABI
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Add New ABI</h3>
            <button
              onClick={() => {
                setShowAddForm(false)
                setFormData({ name: '', description: '', abi: '' })
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="MyContract ABI"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">ABI JSON *</label>
                <label className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium cursor-pointer transition-all flex items-center gap-2">
                  <Upload className="w-3 h-3" />
                  Upload File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                value={formData.abi}
                onChange={(e) => setFormData({ ...formData, abi: e.target.value })}
                placeholder='[{"type":"function","name":"myFunction",...}]'
                className="w-full h-64 p-4 rounded-xl bg-dark-600 border border-white/10 font-mono text-sm focus:border-primary-500/30 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({ name: '', description: '', abi: '' })
                }}
                className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold shadow-glow-purple flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save ABI
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ABIs List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div
            className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : abis.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl font-bold mb-2">No ABIs Saved</h3>
          <p className="text-gray-400 mb-6">Save your first ABI to get started</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold shadow-glow-purple"
          >
            Add ABI
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {abis.map((abi) => (
            <motion.div
              key={abi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-pink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1 group-hover:text-gradient transition-all">
                      {abi.name}
                    </h3>
                    {abi.description && (
                      <p className="text-sm text-gray-400">{abi.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyABI(abi.abi)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title="Copy ABI"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(abi)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title="Download ABI"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(abi.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      title="Delete ABI"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Functions</span>
                    <span className="font-semibold">
                      {abi.abi.filter((item: any) => item.type === 'function').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Events</span>
                    <span className="font-semibold">
                      {abi.abi.filter((item: any) => item.type === 'event').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Created</span>
                    <span className="font-semibold text-xs">
                      {new Date(abi.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
























