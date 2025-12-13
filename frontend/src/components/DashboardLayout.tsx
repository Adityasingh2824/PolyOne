'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Rocket,
  Box,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  HelpCircle,
  Home,
  Wallet,
  BarChart3,
  ChevronRight,
  Bell,
  Search,
  Layers,
  Sparkles,
  Users,
  Activity,
  ExternalLink,
  CreditCard,
  Zap,
  Copy
} from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import NotificationDropdown from './NotificationDropdown'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Animated Background Component for Dashboard
const DashboardBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    {/* Base gradient */}
    <div className="absolute inset-0 bg-gradient-dark" />
    
    {/* Animated orbs */}
    <motion.div
      className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
      }}
      animate={{
        scale: [1, 1.1, 1],
        x: [0, 30, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    <motion.div
      className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full opacity-25"
      style={{
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
      }}
      animate={{
        scale: [1.1, 1, 1.1],
        x: [0, -30, 0],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    
    {/* Grid pattern */}
    <div className="absolute inset-0 bg-grid opacity-20" />
    
    {/* Noise texture */}
    <div className="absolute inset-0 bg-noise" />
  </div>
)

// Sidebar Nav Item Component
const NavItem = ({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: { name: string; href: string; icon: any; badge?: string }
  isActive: boolean
  onClick?: () => void 
}) => {
  const Icon = item.icon
  
  return (
    <Link href={item.href} onClick={onClick}>
      <motion.div
        whileHover={{ x: 6 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer group
          ${isActive 
            ? 'bg-gradient-to-r from-primary-500/20 to-accent-pink/10 text-white' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }
        `}
      >
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-primary-400 to-accent-pink"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center transition-all
          ${isActive 
            ? 'bg-gradient-to-br from-primary-500 to-accent-pink shadow-glow-purple' 
            : 'bg-white/5 group-hover:bg-white/10'
          }
        `}>
          <Icon className="w-5 h-5" />
        </div>
        
        <span className="font-medium">{item.name}</span>
        
        {item.badge && (
          <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30">
            {item.badge}
          </span>
        )}
        
        <ChevronRight className={`
          w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity
          ${isActive ? 'text-primary-400' : 'text-gray-500'}
        `} />
      </motion.div>
    </Link>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { address, isConnected, disconnect, balance, chainId, tokenSymbol } = useWallet()

  // Fetch unread notification count function
  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.notifications.getUnreadCount()
      setUnreadCount(response.data?.count || 0)
    } catch (error) {
      // Silently fail - notifications are optional
      console.debug('Error fetching unread count:', error)
    }
  }

  // Fetch unread notification count
  useEffect(() => {
    if (address) {
      fetchUnreadCount()
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [address])

  const copyToClipboard = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleDisconnect = () => {
    if (isConnected) {
      disconnect().catch((error) => {
        console.warn('Failed to disconnect wallet:', error)
      })
    }
  }

  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Chains', href: '/dashboard/chains', icon: Layers, badge: 'New' },
    { name: 'Templates', href: '/dashboard/templates', icon: Sparkles, badge: 'New' },
    { name: 'Launch Chain', href: '/dashboard/create', icon: Plus },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  ]

  const secondaryNavigation = [
    { name: 'Documentation', href: '/docs', icon: FileText },
    { name: 'Support', href: '/support', icon: HelpCircle },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const formatAddress = (addr: string): string => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Render component
  return (
    <div className="min-h-screen bg-dark-600 text-white relative">
      <DashboardBackground />

      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 
        bg-dark-400/80 backdrop-blur-2xl border-r border-white/5
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Section */}
          <div className="flex-shrink-0 p-6 border-b border-white/5">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-purple"
              >
                <Rocket className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <span className="font-bold text-lg block group-hover:text-gradient transition-all">PolyOne</span>
                <span className="text-xs text-gray-500">Dashboard</span>
              </div>
            </Link>
            
            {/* Close button for mobile */}
            <button
              className="lg:hidden absolute top-6 right-6 p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation - Scrollable */}
          <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-1 scrollbar-thin scrollbar-thumb-primary-500/20 scrollbar-track-transparent">
            <div className="mb-4">
              <span className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Menu</span>
            </div>
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
              return (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  onClick={() => setSidebarOpen(false)}
                />
              )
            })}
            
            <div className="my-6 border-t border-white/5" />
            
            <div className="mb-4">
              <span className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Resources</span>
            </div>
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  onClick={() => setSidebarOpen(false)}
                />
              )
            })}
            {/* Extra padding at bottom to prevent overlap */}
            <div className="h-4" />
          </nav>

          {/* Bottom Section - Fixed */}
          <div className="flex-shrink-0 border-t border-white/5 bg-dark-400/80 backdrop-blur-xl space-y-0">
            {/* Wallet Section */}
            <div className="p-4 pb-3">
            {isConnected && address ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 space-y-4 relative overflow-hidden group"
              >
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-accent-pink/5 to-accent-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'linear'
                  }}
                />
                
                <div className="relative z-10">
                  {/* Wallet Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      className="relative"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center font-bold text-sm shadow-glow relative overflow-hidden">
                        <span className="relative z-10">{address.slice(2, 4).toUpperCase()}</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"
                          animate={{ 
                            x: ['-100%', '100%'],
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: "easeInOut"
                          }}
                        />
                      </div>
                      <motion.div
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-accent-emerald rounded-full border-2 border-dark-600 shadow-lg"
                        animate={{ 
                          scale: [1, 1.15, 1],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">Connected</span>
                        <motion.div
                          className="w-1.5 h-1.5 bg-accent-emerald rounded-full"
                          animate={{ 
                            opacity: [1, 0.5, 1],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </div>
                      <div 
                        className="text-xs text-gray-400 font-mono truncate cursor-pointer hover:text-primary-400 transition-colors"
                        onClick={() => address && copyToClipboard(address)}
                        title="Click to copy"
                      >
                        {formatAddress(address)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Balance Card */}
                  {balance !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-br from-white/10 via-primary-500/5 to-accent-pink/5 border border-white/10 hover:border-primary-500/30 transition-all group/balance"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 opacity-0 group-hover/balance:opacity-100 transition-opacity" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center border border-primary-500/20">
                            <Zap className="w-4 h-4 text-primary-400" />
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Balance</div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-bold text-white">
                                {parseFloat(balance).toFixed(4)}
                              </span>
                              <span className="text-xs font-semibold text-primary-400">
                                {tokenSymbol ?? 'POL'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => address && copyToClipboard(address)}
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary-500/30 transition-all"
                          title="Copy address"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-primary-400 transition-colors" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Disconnect Button */}
                  <motion.button
                    onClick={handleDisconnect}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-sm font-medium transition-all group/disconnect mt-3"
                  >
                    <LogOut className="w-4 h-4 group-hover/disconnect:text-red-400 transition-colors" />
                    <span className="group-hover/disconnect:text-red-400 transition-colors">Disconnect</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple hover:shadow-glow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </motion.button>
              </Link>
            )}
          </div>
          
            {/* Upgrade CTA */}
            <div className="px-4 pb-4 pt-0">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-primary-500/20 via-accent-pink/10 to-accent-cyan/20 border border-primary-500/20 group/pro"
              >
              {/* Animated background */}
              <motion.div
                className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/30 via-accent-pink/20 to-transparent rounded-bl-full"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.7, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/10 to-accent-pink/0 opacity-0 group-hover/pro:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mb-3"
                >
                  <Sparkles className="w-6 h-6 text-primary-400" />
                </motion.div>
                <h4 className="font-bold text-sm mb-1.5 group-hover/pro:text-primary-300 transition-colors">Pro Features</h4>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">Unlock advanced chain management tools</p>
                <Link href="/dashboard/billing?tab=plans">
                  <motion.button
                    whileHover={{ x: 4 }}
                    className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1.5 group/link"
                  >
                    <span>Learn More</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:ml-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-dark-600/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Search */}
            <div className="hidden sm:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search chains, validators..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
                />
                <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs bg-white/10 text-gray-500 hidden md:block">⌘K</kbd>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* Search button for mobile */}
              <button
                className="sm:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </button>
              
              {/* Notifications */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-2 h-2 bg-accent-pink rounded-full"
                    />
                  )}
                </motion.button>
                <NotificationDropdown
                  isOpen={notificationOpen}
                  onClose={() => setNotificationOpen(false)}
                />
              </div>
              
              {/* Quick Actions */}
              <Link href="/dashboard/create">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple hover:shadow-glow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Chain
                </motion.button>
              </Link>
              
              {/* User Menu */}
              {isConnected && address && (
                <Link href="/dashboard/settings">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center font-bold text-sm cursor-pointer shadow-glow-purple"
                  >
                    {address.slice(2, 4).toUpperCase()}
                  </motion.div>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-73px)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-white/5 py-6 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2025 PolyOne. Built on Polygon CDK.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/docs" className="text-sm text-gray-500 hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/support" className="text-sm text-gray-500 hover:text-white transition-colors">
                Support
              </Link>
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4 sm:hidden"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search chains, validators..."
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-dark-300 border border-white/10 focus:border-primary-500/30 text-base transition-all outline-none"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
