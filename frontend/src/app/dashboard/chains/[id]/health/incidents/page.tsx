'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  X,
  AlertCircle,
  Info
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api'

export default function HealthIncidentsPage() {
  const params = useParams()
  const router = useRouter()
  const chainId = params.id as string
  
  const [incidents, setIncidents] = useState<any[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all'
  })

  useEffect(() => {
    if (chainId) {
      loadIncidents()
    }
  }, [chainId, filters])

  const loadIncidents = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 100 }
      if (filters.status !== 'all') {
        params.status = filters.status
      }
      if (filters.severity !== 'all') {
        params.severity = filters.severity
      }
      
      const response = await apiClient.health.getIncidents(chainId, params)
      setIncidents(response.data.incidents || [])
      setFilteredIncidents(response.data.incidents || [])
    } catch (error: any) {
      console.error('Error loading incidents:', error)
      toast.error('Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'error': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-500/20 text-green-400'
      case 'open': return 'bg-yellow-500/20 text-yellow-400'
      case 'acknowledged': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5" />
      case 'error': return <AlertTriangle className="w-5 h-5" />
      case 'warning': return <AlertTriangle className="w-5 h-5" />
      case 'info': return <Info className="w-5 h-5" />
      default: return <AlertCircle className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 animate-pulse">
          <div className="h-8 bg-white/5 rounded mb-4 w-1/3" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/chains/${chainId}/health`}>
              <motion.button
                whileHover={{ x: -4 }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Health
              </motion.button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Health Incidents</h1>
              <p className="text-gray-400">Incident history and management</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            
            {(filters.status !== 'all' || filters.severity !== 'all') && (
              <button
                onClick={() => setFilters({ status: 'all', severity: 'all' })}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-red-500/50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Incidents List */}
        {filteredIncidents.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold mb-2">No Incidents Found</h3>
            <p className="text-gray-400">No incidents match your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident: any) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border-l-4"
                style={{ borderLeftColor: incident.severity === 'critical' ? '#ef4444' : 
                                       incident.severity === 'error' ? '#f97316' :
                                       incident.severity === 'warning' ? '#f59e0b' : '#3b82f6' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${getSeverityColor(incident.severity)} border`}>
                        {getSeverityIcon(incident.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{incident.title || incident.description}</h3>
                          <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(incident.status)}`}>
                            {incident.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(incident.detected_at).toLocaleString()}
                          </div>
                          {incident.resolved_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Resolved: {new Date(incident.resolved_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {incident.description && (
                      <p className="text-gray-300 mb-4 ml-14">{incident.description}</p>
                    )}
                    
                    {incident.recovery_actions && incident.recovery_actions.length > 0 && (
                      <div className="ml-14 mb-4">
                        <h4 className="text-sm font-semibold mb-2 text-gray-400">Recovery Actions:</h4>
                        <ul className="space-y-1">
                          {incident.recovery_actions.map((action: any, idx: number) => (
                            <li key={idx} className="text-sm text-gray-300">
                              • {action.description || action.action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}



















