'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Terminal,
  Box,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  HelpCircle,
  User,
  Home
} from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { address, isConnected, disconnect } = useWallet()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    disconnect()
    router.push('/')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Chains', href: '/dashboard/chains', icon: Box },
    { name: 'Launch Chain', href: '/dashboard/create', icon: Plus },
    { name: 'Documentation', href: '/docs', icon: FileText },
    { name: 'Support', href: '/support', icon: HelpCircle },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 
        bg-black border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Terminal className="w-5 h-5" />
              <span className="font-bold">PolyOne Labs</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-all font-medium text-sm
                    ${isActive 
                      ? 'bg-white text-black' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            {isConnected && address && (
              <div className="border border-white/10 p-4 mb-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 border border-white/20 flex items-center justify-center font-bold text-xs">
                    {address.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-xs text-white/40 truncate font-mono">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-white/20 hover:bg-white hover:text-black transition-all text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-black border-b border-white/10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              <span className="font-bold">PolyOne Labs</span>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/5 transition-all"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 md:p-12 pt-20 lg:pt-12 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
