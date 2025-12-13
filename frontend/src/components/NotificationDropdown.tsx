'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useWallet } from '@/hooks/useWallet'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'chain_event' | 'validator_alert' | 'billing' | 'security' | 'announcement' | 'bridge_update'
  title: string
  message: string
  is_read: boolean
  isRead?: boolean
  created_at: string
  createdAt?: string
  action_url?: string
  action_label?: string
  data?: any
}

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return CheckCircle2
    case 'warning':
      return AlertTriangle
    case 'error':
      return AlertCircle
    case 'chain_event':
    case 'validator_alert':
    case 'bridge_update':
      return Sparkles
    default:
      return Info
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'warning':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'error':
      return 'text-red-400 bg-red-400/10 border-red-400/20'
    case 'chain_event':
    case 'validator_alert':
    case 'bridge_update':
      return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    default:
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { address } = useWallet()

  useEffect(() => {
    if (isOpen && address) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [isOpen, address])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await apiClient.notifications.getAll({ limit: 20 })
      setNotifications(response.data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.notifications.getUnreadCount()
      setUnreadCount(response.data?.count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.notifications.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await apiClient.notifications.markAllAsRead()
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, isRead: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.notifications.delete(notificationId)
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && (!notification.is_read && !notification.isRead)) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const isRead = (notification: Notification) => {
    return notification.is_read || notification.isRead || false
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          
          {/* Dropdown */}
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 max-h-[600px] z-50"
          >
            <div className="glass-card overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary-400" />
                  <h3 className="font-bold text-lg">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-pink/20 text-accent-pink border border-accent-pink/30">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1 max-h-[500px]">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    <p className="mt-2 text-sm text-gray-400">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type)
                      const colorClass = getNotificationColor(notification.type)
                      const read = isRead(notification)
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 hover:bg-white/5 transition-colors ${!read ? 'bg-primary-500/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClass} flex-shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className={`font-semibold text-sm ${!read ? 'text-white' : 'text-gray-300'}`}>
                                  {notification.title}
                                </h4>
                                {!read && (
                                  <div className="w-2 h-2 rounded-full bg-accent-pink flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              
                              <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.created_at || notification.createdAt || '')}
                                </span>
                                
                                <div className="flex items-center gap-1">
                                  {notification.action_url && (
                                    <a
                                      href={notification.action_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded hover:bg-white/5 transition-colors"
                                      title={notification.action_label || 'View'}
                                    >
                                      <ExternalLink className="w-3 h-3 text-primary-400" />
                                    </a>
                                  )}
                                  {!read && (
                                    <button
                                      onClick={() => markAsRead(notification.id)}
                                      className="p-1 rounded hover:bg-white/5 transition-colors"
                                      title="Mark as read"
                                    >
                                      <Check className="w-3 h-3 text-gray-400 hover:text-white" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="p-1 rounded hover:bg-white/5 transition-colors"
                                    title="Delete"
                                  >
                                    <X className="w-3 h-3 text-gray-400 hover:text-red-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


