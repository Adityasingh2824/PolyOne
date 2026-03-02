'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Building2, Loader2, Eye, EyeOff, UserPlus, Rocket, CheckCircle2, Shield, Zap, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, text: '', color: '' }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    if (score <= 2) return { level: score, text: 'Weak', color: 'bg-red-500' }
    if (score <= 3) return { level: score, text: 'Fair', color: 'bg-amber-500' }
    if (score <= 4) return { level: score, text: 'Good', color: 'bg-emerald-500' }
    return { level: score, text: 'Strong', color: 'bg-emerald-400' }
  })()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) { toast.error('Please fill in all required fields'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) { toast.error('Password must contain uppercase, lowercase, and a number'); return }

    setLoading(true)
    try {
      const res = await apiClient.auth.signup({ name, email, password, company: company || undefined })
      const { token, refreshToken, user } = res.data
      localStorage.setItem('authToken', token)
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
      if (user) localStorage.setItem('user', JSON.stringify(user))
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Signup failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex bg-dark-600 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
        <motion.div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 60%)' }} animate={{ scale: [1, 1.15, 1], x: [0, -40, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 60%)' }} animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
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
            Start Building on{' '}<span className="text-gradient">Polygon</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-400 text-lg mb-10 leading-relaxed">
            Join thousands of developers launching the next generation of blockchain applications.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
            {[
              { icon: Zap, text: 'Deploy chains in minutes, not weeks' },
              { icon: Shield, text: 'Enterprise-grade security built in' },
              { icon: Sparkles, text: 'Free testnet deployment included' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-primary-400" />
                </div>
                <span className="text-gray-300 text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-2">
                {['A1', 'B2', 'C3', 'D4'].map((v, i) => (
                  <div key={v} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center text-xs font-bold border-2 border-dark-600">
                    {v[0]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-400">+2,500 developers joined</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md">
          <div className="text-center mb-6 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-purple">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">PolyOne</span>
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Create your account</h1>
            <p className="text-gray-400 text-sm">Get started with PolyOne for free</p>
          </div>

          <div className="card-premium p-8">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                    placeholder="John Doe" autoComplete="name" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                    placeholder="you@example.com" autoComplete="email" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                    placeholder="Min. 8 characters" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${passwordStrength.color} transition-all`} style={{ width: `${(passwordStrength.level / 5) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{passwordStrength.text}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[
                        { test: password.length >= 8, label: '8+ chars' },
                        { test: /[A-Z]/.test(password), label: 'Uppercase' },
                        { test: /[a-z]/.test(password), label: 'Lowercase' },
                        { test: /\d/.test(password), label: 'Number' },
                      ].map(req => (
                        <span key={req.label} className={`flex items-center gap-1 ${req.test ? 'text-emerald-400' : 'text-gray-600'}`}>
                          <CheckCircle2 className="w-3 h-3" /> {req.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company <span className="text-gray-600">(optional)</span></label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                    placeholder="Acme Inc." autoComplete="organization" />
                </div>
              </div>

              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-accent-pink hover:from-primary-600 hover:to-pink-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-purple mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {loading ? 'Creating account...' : 'Create Account'}
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

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">Sign in</Link>
              </p>
              <p className="text-xs text-gray-600">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-gray-500 hover:text-gray-400 underline transition-colors">Terms of Service</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
