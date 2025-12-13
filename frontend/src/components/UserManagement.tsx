'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users,
  UserPlus,
  UserMinus,
  Shield,
  Settings,
  Mail,
  Check,
  X,
  MoreVertical,
  ChevronDown,
  Search,
  Filter,
  Building2,
  Crown,
  Key,
  Lock,
  Unlock,
  Eye,
  Edit2,
  Trash2,
  Clock,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

// Types
type Role = 'owner' | 'admin' | 'member' | 'viewer' | 'billing'

interface TeamMember {
  id: string
  email: string
  username: string
  role: Role
  status: 'active' | 'pending' | 'suspended'
  chainPermissions: Record<string, string[]>
  joinedAt: Date
  lastActive?: Date
  avatar?: string
}

interface Organization {
  id: string
  name: string
  slug: string
  ownerId: string
  memberCount: number
  maxMembers: number
  createdAt: Date
}

interface ActivityLog {
  id: string
  userId: string
  username: string
  action: string
  resource: string
  timestamp: Date
  ipAddress: string
  status: 'success' | 'failure'
}

// Mock data
const MOCK_ORGANIZATION: Organization = {
  id: '1',
  name: 'PolyOne Team',
  slug: 'polyone-team',
  ownerId: '1',
  memberCount: 5,
  maxMembers: 10,
  createdAt: new Date('2024-01-01'),
}

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: '1',
    email: 'owner@example.com',
    username: 'JohnDoe',
    role: 'owner',
    status: 'active',
    chainPermissions: {},
    joinedAt: new Date('2024-01-01'),
    lastActive: new Date(),
  },
  {
    id: '2',
    email: 'admin@example.com',
    username: 'JaneSmith',
    role: 'admin',
    status: 'active',
    chainPermissions: { 'chain-1': ['read', 'write', 'admin'] },
    joinedAt: new Date('2024-02-15'),
    lastActive: new Date(Date.now() - 3600000),
  },
  {
    id: '3',
    email: 'dev@example.com',
    username: 'DevUser',
    role: 'member',
    status: 'active',
    chainPermissions: { 'chain-1': ['read', 'write'] },
    joinedAt: new Date('2024-03-01'),
    lastActive: new Date(Date.now() - 86400000),
  },
  {
    id: '4',
    email: 'viewer@example.com',
    username: 'ViewerUser',
    role: 'viewer',
    status: 'active',
    chainPermissions: { 'chain-1': ['read'] },
    joinedAt: new Date('2024-04-01'),
  },
  {
    id: '5',
    email: 'pending@example.com',
    username: 'PendingUser',
    role: 'member',
    status: 'pending',
    chainPermissions: {},
    joinedAt: new Date(),
  },
]

const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  { id: '1', userId: '2', username: 'JaneSmith', action: 'Updated chain config', resource: 'chain-1', timestamp: new Date(), ipAddress: '192.168.1.1', status: 'success' },
  { id: '2', userId: '3', username: 'DevUser', action: 'Added validator', resource: 'chain-1', timestamp: new Date(Date.now() - 3600000), ipAddress: '192.168.1.2', status: 'success' },
  { id: '3', userId: '2', username: 'JaneSmith', action: 'Invited member', resource: 'pending@example.com', timestamp: new Date(Date.now() - 7200000), ipAddress: '192.168.1.1', status: 'success' },
  { id: '4', userId: '3', username: 'DevUser', action: 'Failed login attempt', resource: 'auth', timestamp: new Date(Date.now() - 86400000), ipAddress: '10.0.0.1', status: 'failure' },
]

const ROLE_CONFIG = {
  owner: { label: 'Owner', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: Crown },
  admin: { label: 'Admin', color: 'text-primary-400 bg-primary-500/10 border-primary-500/20', icon: Shield },
  member: { label: 'Member', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Users },
  viewer: { label: 'Viewer', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: Eye },
  billing: { label: 'Billing', color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: Key },
}

type ActiveTab = 'members' | 'roles' | 'activity' | 'settings'

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('members')
  const [members, setMembers] = useState<TeamMember[]>(MOCK_MEMBERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('member')

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Handle invite
  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address')
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newMember: TeamMember = {
        id: Date.now().toString(),
        email: inviteEmail,
        username: inviteEmail.split('@')[0],
        role: inviteRole,
        status: 'pending',
        chainPermissions: {},
        joinedAt: new Date(),
      }
      
      setMembers(prev => [...prev, newMember])
      setInviteEmail('')
      setShowInviteModal(false)
      toast.success('Invitation sent successfully')
    } catch (error) {
      toast.error('Failed to send invitation')
    }
  }

  // Handle role change
  const handleRoleChange = async (memberId: string, newRole: Role) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ))
      toast.success('Role updated successfully')
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  // Handle remove member
  const handleRemoveMember = async (memberId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success('Member removed successfully')
    } catch (error) {
      toast.error('Failed to remove member')
    }
  }

  // Handle suspend member
  const handleSuspendMember = async (memberId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, status: m.status === 'suspended' ? 'active' : 'suspended' } : m
      ))
      toast.success('Member status updated')
    } catch (error) {
      toast.error('Failed to update member status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'suspended': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink">
              <Users className="w-6 h-6 text-white" />
            </div>
            Team Management
          </h1>
          <p className="text-gray-400 mt-1">Manage team members, roles, and permissions</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-pink rounded-xl font-medium text-white"
        >
          <UserPlus className="w-5 h-5" />
          Invite Member
        </motion.button>
      </div>

      {/* Organization Info Card */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{MOCK_ORGANIZATION.name}</h2>
              <p className="text-gray-400">@{MOCK_ORGANIZATION.slug}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {MOCK_ORGANIZATION.memberCount} / {MOCK_ORGANIZATION.maxMembers}
            </div>
            <p className="text-gray-400 text-sm">Team Members</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-dark-400/50 rounded-xl w-fit">
        {[
          { id: 'members', label: 'Members', icon: Users },
          { id: 'roles', label: 'Roles & Permissions', icon: Shield },
          { id: 'activity', label: 'Activity Log', icon: Clock },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Members Tab */}
        {activeTab === 'members' && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-white/5"
          >
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members..."
                  className="w-full pl-12 pr-4 py-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white placeholder-gray-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-12 pr-10 py-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white appearance-none cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                  <option value="billing">Billing</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-3">
              {filteredMembers.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role]
                const RoleIcon = roleConfig.icon
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 bg-dark-400/30 rounded-xl border ${
                      member.status === 'suspended' ? 'border-red-500/20' : 'border-white/5'
                    } hover:border-primary-500/20 transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/30 to-accent-pink/30 flex items-center justify-center text-lg font-bold text-white">
                          {member.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{member.username}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleConfig.color}`}>
                              <RoleIcon className="w-3 h-3" />
                              {roleConfig.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(member.status)}`}>
                              {member.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mt-0.5">{member.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <div className="text-sm text-gray-400">
                            Joined {member.joinedAt.toLocaleDateString()}
                          </div>
                          {member.lastActive && (
                            <div className="text-xs text-gray-500">
                              Last active: {member.lastActive.toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {member.role !== 'owner' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedMember(member)
                                setShowRoleModal(true)
                              }}
                              className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
                              title="Change Role"
                            >
                              <Edit2 className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleSuspendMember(member.id)}
                              className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
                              title={member.status === 'suspended' ? 'Activate' : 'Suspend'}
                            >
                              {member.status === 'suspended' ? (
                                <Unlock className="w-4 h-4 text-green-400" />
                              ) : (
                                <Lock className="w-4 h-4 text-yellow-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <motion.div
            key="roles"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Role Descriptions */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Available Roles</h3>
              <div className="space-y-4">
                {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                  const Icon = config.icon
                  return (
                    <div key={role} className="p-4 bg-dark-400/30 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${config.color.replace('text-', 'bg-').replace('400', '500/20')}`}>
                          <Icon className={`w-5 h-5 ${config.color.split(' ')[0]}`} />
                        </div>
                        <span className="font-medium text-white">{config.label}</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {role === 'owner' && 'Full access to all resources and settings. Can manage billing and delete organization.'}
                        {role === 'admin' && 'Can manage team members, chains, and validators. Cannot access billing.'}
                        {role === 'member' && 'Can create and manage chains and validators assigned to them.'}
                        {role === 'viewer' && 'Read-only access to view chains and analytics.'}
                        {role === 'billing' && 'Can manage billing, invoices, and subscription settings.'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Permissions Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-white/5">
                      <th className="pb-3 font-medium">Permission</th>
                      <th className="pb-3 font-medium text-center">Owner</th>
                      <th className="pb-3 font-medium text-center">Admin</th>
                      <th className="pb-3 font-medium text-center">Member</th>
                      <th className="pb-3 font-medium text-center">Viewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'View Dashboard', owner: true, admin: true, member: true, viewer: true },
                      { name: 'Create Chains', owner: true, admin: true, member: true, viewer: false },
                      { name: 'Manage Validators', owner: true, admin: true, member: true, viewer: false },
                      { name: 'View Analytics', owner: true, admin: true, member: true, viewer: true },
                      { name: 'Export Data', owner: true, admin: true, member: false, viewer: false },
                      { name: 'Manage Team', owner: true, admin: true, member: false, viewer: false },
                      { name: 'Manage Billing', owner: true, admin: false, member: false, viewer: false },
                      { name: 'Delete Organization', owner: true, admin: false, member: false, viewer: false },
                    ].map((perm, index) => (
                      <tr key={index} className="border-b border-white/5">
                        <td className="py-3 text-gray-300">{perm.name}</td>
                        <td className="py-3 text-center">
                          {perm.owner ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}
                        </td>
                        <td className="py-3 text-center">
                          {perm.admin ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}
                        </td>
                        <td className="py-3 text-center">
                          {perm.member ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}
                        </td>
                        <td className="py-3 text-center">
                          {perm.viewer ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-white/5"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {MOCK_ACTIVITY_LOGS.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 bg-dark-400/30 rounded-xl border ${
                    log.status === 'failure' ? 'border-red-500/20' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        log.status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {log.status === 'success' ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{log.username}</span>
                          <span className="text-gray-400">{log.action}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Resource: {log.resource} • IP: {log.ipAddress}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {log.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Organization Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Organization Name</label>
                  <input
                    type="text"
                    defaultValue={MOCK_ORGANIZATION.name}
                    className="w-full p-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Organization Slug</label>
                  <input
                    type="text"
                    defaultValue={MOCK_ORGANIZATION.slug}
                    className="w-full p-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white"
                  />
                </div>
                <button className="px-4 py-2 bg-primary-500 rounded-xl font-medium text-white hover:bg-primary-600 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-dark-400/30 rounded-xl">
                  <div>
                    <div className="font-medium text-white">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-400">Require 2FA for all team members</div>
                  </div>
                  <button className="relative w-12 h-6 bg-dark-500 rounded-full transition-colors">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-gray-400 rounded-full transition-transform" />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-dark-400/30 rounded-xl">
                  <div>
                    <div className="font-medium text-white">Session Timeout</div>
                    <div className="text-sm text-gray-400">Auto-logout after inactivity</div>
                  </div>
                  <select className="p-2 bg-dark-400 rounded-lg border border-white/5 text-white text-sm">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>Never</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-dark-400/30 rounded-xl">
                  <div>
                    <div className="font-medium text-white">IP Allowlist</div>
                    <div className="text-sm text-gray-400">Restrict access to specific IPs</div>
                  </div>
                  <button className="px-3 py-1 bg-dark-400 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 border border-white/10 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-white mb-4">Invite Team Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full p-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className="w-full p-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                    <option value="billing">Billing</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-3 bg-dark-400 rounded-xl font-medium text-gray-300 hover:bg-dark-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvite}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-accent-pink rounded-xl font-medium text-white"
                  >
                    Send Invite
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Change Modal */}
      <AnimatePresence>
        {showRoleModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRoleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 border border-white/10 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-white mb-4">Change Role</h3>
              <p className="text-gray-400 mb-4">
                Change role for <span className="text-white font-medium">{selectedMember.username}</span>
              </p>
              
              <div className="space-y-2">
                {(['admin', 'member', 'viewer', 'billing'] as Role[]).map((role) => {
                  const config = ROLE_CONFIG[role]
                  const Icon = config.icon
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        handleRoleChange(selectedMember.id, role)
                        setShowRoleModal(false)
                      }}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                        selectedMember.role === role 
                          ? 'bg-primary-500/20 border border-primary-500/30' 
                          : 'bg-dark-400/30 hover:bg-dark-400/50 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${config.color.split(' ')[0]}`} />
                      <span className="text-white font-medium">{config.label}</span>
                      {selectedMember.role === role && (
                        <Check className="w-4 h-4 text-primary-400 ml-auto" />
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setShowRoleModal(false)}
                className="w-full mt-4 py-3 bg-dark-400 rounded-xl font-medium text-gray-300 hover:bg-dark-300 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


