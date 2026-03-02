'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff, Wallet, Rocket, Sparkles, ArrowRight, Shield, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWallet } from '@/hooks/useWallet'

export default function LoginPage() {
  const router = useRouter()
  const { isConnected } = useWallet()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isConnected) router.replace('/dashboard')
  }, [isConnected, router])

  if (isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-600">
        <motion.div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await apiClient.auth.login({ email, password })
      const { token, refreshToken, user } = res.data
      localStorage.setItem('authToken', token)
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
      if (user) localStorage.setItem('user', JSON.stringify(user))
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex bg-dark-600 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
        <motion.div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 60%)' }} animate={{ scale: [1, 1.15, 1], x: [0, 40, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 60%)' }} animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg">
          <Link href="/" className="flex items-center gap-3 mb-12 group">
            <motion.div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-purple" whileHover={{ scale: 1.1, rotate: 5 }}>
              <Rocket className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <span className="font-bold text-2xl block group-hover:text-gradient transition-all">PolyOne</span>
              <span className="text-xs text-gray-500">Polygon App Chains</span>
            </div>
          </Link>

          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold mb-6 leading-tight">
            Build the Future of{' '}<span className="text-gradient">Blockchain</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-400 text-lg mb-10 leading-relaxed">
            Deploy custom Polygon app chains in minutes. Enterprise-grade security, unlimited scalability.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
            {[
              { icon: Zap, text: 'One-click chain deployment' },
              { icon: Shield, text: 'Inherits Ethereum security' },
              { icon: Sparkles, text: 'Pre-built templates for any use case' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-primary-400" />
                </div>
                <span className="text-gray-300 text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-purple">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">PolyOne</span>
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to access your dashboard</p>
          </div>

          {/* Card */}
          <div className="card-premium p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                    placeholder="you@example.com" autoComplete="email" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                    placeholder="Enter your password" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-accent-pink hover:from-primary-600 hover:to-pink-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-purple"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </motion.button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-500">or continue with wallet</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex justify-center">
              <ConnectButton label="Connect Wallet" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">Sign up</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
