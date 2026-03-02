'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight,
  Rocket,
  Code2,
  Users,
  Zap,
  Shield,
  Globe2,
  Box,
  ChevronRight,
  Play,
  Sparkles,
  Layers,
  Network,
  Cpu,
  Lock,
  BarChart3,
  Workflow,
  CheckCircle2,
  ArrowUpRight,
  Menu,
  X,
  ExternalLink,
  Github,
  Twitter,
  MessageCircle,
  Clock
} from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWallet } from '@/hooks/useWallet'
import toast from 'react-hot-toast'

// Animated Background Component
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 bg-mesh-gradient" />
      
      {/* Animated orbs with morph effect */}
      <motion.div
        className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] animate-morph hero-glow-orb"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 60%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 60, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] animate-morph hero-glow-orb"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 60%)',
          animationDelay: '2s',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -60, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-[40%] right-[10%] w-[600px] h-[600px] animate-morph hero-glow-orb"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
          animationDelay: '4s',
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -30, 30, 0],
          y: [0, 50, -20, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-[60%] left-[10%] w-[500px] h-[500px] animate-morph hero-glow-orb"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 60%)',
          animationDelay: '6s',
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          x: [0, 40, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Grid pattern overlay with gradient fade */}
      <div className="absolute inset-0 bg-grid opacity-40" style={{
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
      }} />
      
      {/* Subtle scan line effect */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"
          animate={{ y: ['0vh', '100vh'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      
      {/* Noise texture */}
      <div className="absolute inset-0 bg-noise" />
    </div>
  )
}

// Floating Particles Component - Enhanced with variety
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{ 
    id: number; 
    x: number; 
    y: number; 
    size: number; 
    duration: number;
    delay: number;
    type: 'dot' | 'ring' | 'star';
    color: string;
  }>>([])
  
  useEffect(() => {
    const colors = [
      'rgba(168, 85, 247, 0.3)',
      'rgba(236, 72, 153, 0.25)',
      'rgba(6, 182, 212, 0.25)',
      'rgba(16, 185, 129, 0.2)',
    ]
    const types: Array<'dot' | 'ring' | 'star'> = ['dot', 'dot', 'dot', 'ring', 'star']
    
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * 8,
      type: types[Math.floor(Math.random() * types.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.type === 'dot' ? particle.color : 'transparent',
            borderRadius: '50%',
            border: particle.type === 'ring' ? `1px solid ${particle.color}` : 'none',
            boxShadow: particle.type === 'star' ? `0 0 ${particle.size * 2}px ${particle.color}` : 'none',
          }}
          animate={{
            y: [0, -150, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.8, 1],
            rotate: particle.type === 'star' ? [0, 180, 360] : 0,
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  )
}

// Stats Counter Component
const StatCounter = ({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return

    const duration = 2000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(end * easeOutQuart))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [end, isInView])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

// Feature Card Component - Enhanced with premium effects
const FeatureCard = ({ icon: Icon, title, description, gradient, delay, href }: { 
  icon: any; 
  title: string; 
  description: string; 
  gradient: string;
  delay: number;
  href?: string;
}) => {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -12 }}
      className="group relative h-full"
    >
      {/* Glow effect on hover */}
      <motion.div 
        className="absolute -inset-1 bg-gradient-to-br from-primary-500/30 via-accent-pink/20 to-accent-cyan/30 rounded-[28px] blur-2xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.7 }}
        transition={{ duration: 0.4 }}
      />
      
      <div className="relative card-premium card-shine p-8 h-full cursor-pointer">
        {/* Animated gradient border */}
        <motion.div 
          className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.2), rgba(6, 182, 212, 0.2))',
            padding: '1px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid-dense opacity-10 rounded-[28px]" />
        
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <motion.div 
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg relative overflow-hidden`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Icon className="w-8 h-8 text-white relative z-10" />
            {/* Shine effect on icon */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent"
              initial={{ x: '-100%', y: '-100%' }}
              whileHover={{ x: '100%', y: '100%' }}
              transition={{ duration: 0.6 }}
            />
          </motion.div>
          
          <h3 className="text-xl font-bold mb-3 group-hover:text-gradient transition-all duration-500">{title}</h3>
          <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">{description}</p>
          
          <motion.div 
            className="mt-6 flex items-center gap-2 text-primary-400"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 0.7 }}
            whileHover={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-sm font-semibold">Learn more</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

export default function Home() {
  const { isConnected, isConnecting } = useWallet()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hasShownConnectToast, setHasShownConnectToast] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  
  // Mouse follower
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 30, stiffness: 200 }
  const cursorX = useSpring(mouseX, springConfig)
  const cursorY = useSpring(mouseY, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  useEffect(() => {
    if (isConnected && !hasShownConnectToast) {
      toast.success('Wallet connected successfully!')
      setHasShownConnectToast(true)
    }
    if (!isConnected && hasShownConnectToast) {
      setHasShownConnectToast(false)
    }
  }, [isConnected, hasShownConnectToast])

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Ecosystem', href: '#ecosystem' },
    { label: 'Docs', href: '/docs' },
  ]

  const features = [
    {
      icon: Rocket,
      title: 'One-Click Deployment',
      description: 'Launch your custom Polygon app chain in minutes with our intuitive deployment wizard. No complex infrastructure needed.',
      gradient: 'from-primary-500 to-accent-pink',
      href: '/dashboard/create',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Built on Polygon zkEVM with battle-tested security. Your chain inherits Ethereum\'s security guarantees.',
      gradient: 'from-accent-cyan to-primary-500',
      href: '/docs#security',
    },
    {
      icon: Zap,
      title: '10,000+ TPS',
      description: 'Experience blazing fast transactions with sub-second finality. Scale without limits.',
      gradient: 'from-accent-amber to-accent-pink',
      href: '/docs#performance',
    },
    {
      icon: Network,
      title: 'AggLayer Integration',
      description: 'Native cross-chain interoperability with Polygon\'s AggLayer. Connect to any chain seamlessly.',
      gradient: 'from-accent-emerald to-accent-cyan',
      href: '/docs#ecosystem',
    },
    {
      icon: Users,
      title: 'Validator Management',
      description: 'Full control over your validator set. Add, remove, stake, and monitor validators with ease.',
      gradient: 'from-accent-pink to-primary-500',
      href: '/dashboard/chains',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Monitor chain performance with comprehensive dashboards. Track TPS, blocks, and transactions live.',
      gradient: 'from-primary-600 to-accent-cyan',
      href: '/dashboard/analytics',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Configure Your Chain',
      description: 'Choose your chain type, gas token, and validator settings. Customize every aspect of your blockchain.',
      icon: Cpu,
    },
    {
      number: '02',
      title: 'Deploy to Polygon',
      description: 'Register your chain on-chain with a single transaction. Our contracts handle the heavy lifting.',
      icon: Rocket,
    },
    {
      number: '03',
      title: 'Go Live',
      description: 'Your chain is live! Start building dApps, onboarding users, and scaling your ecosystem.',
      icon: Globe2,
    },
  ]

  const stats = [
    { value: 10000, suffix: '+', label: 'Transactions/sec', icon: Zap },
    { value: 99, suffix: '.99%', label: 'Uptime SLA', icon: Shield },
    { value: 100, suffix: '+', label: 'Connected Chains', icon: Network },
    { value: 500, suffix: 'ms', label: 'Block Time', icon: Clock },
  ]

  return (
    <div className="min-h-screen bg-dark-600 text-white relative">
      <AnimatedBackground />
      <FloatingParticles />

      {/* Custom Cursor Glow */}
      <motion.div
        className="fixed w-[500px] h-[500px] rounded-full pointer-events-none z-0 hidden lg:block"
        style={{
          x: useTransform(cursorX, (x) => x - 250),
          y: useTransform(cursorY, (y) => y - 250),
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl px-6 py-3 border border-white/5"
          >
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-purple"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Rocket className="w-5 h-5 text-white" />
                </motion.div>
                <div className="hidden sm:block">
                  <span className="font-bold text-lg">PolyOne</span>
                  <span className="text-xs text-gray-400 block">Polygon App Chains</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors relative group"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-pink group-hover:w-full transition-all duration-300" />
                  </Link>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <ConnectButton.Custom>
                  {({ account, chain, mounted, openAccountModal, openConnectModal }) => {
                    const ready = mounted
                    const connected = ready && account && chain

                    if (!connected) {
                      return (
                        <motion.button
                          onClick={openConnectModal}
                          disabled={isConnecting}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-500/30 text-sm font-medium hover:bg-primary-500/10 transition-all disabled:opacity-50"
                        >
                          {isConnecting ? (
                            <>
                              <motion.div
                                className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              />
                              Connecting...
                            </>
                          ) : (
                            <>Connect Wallet</>
                          )}
                        </motion.button>
                      )
                    }

                    return (
                      <button
                        onClick={openAccountModal}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/30 text-sm font-medium hover:bg-primary-500/20 transition-all"
                      >
                        <div className="w-2 h-2 bg-accent-emerald rounded-full animate-pulse" />
                        {account.displayName}
                      </button>
                    )
                  }}
                </ConnectButton.Custom>
                
                <Link 
                  href="/dashboard"
                  className="hidden sm:inline-flex"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple hover:shadow-glow-lg transition-all"
                  >
                    Launch App
                  </motion.button>
                </Link>

                {/* Mobile Menu Button */}
                <button
                  className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="lg:hidden glass rounded-2xl mt-2 p-4 border border-white/5"
              >
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-white/10 mt-3 pt-3 space-y-2">
                  <Link href="/dashboard" className="block w-full">
                    <button className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm">
                      Launch App
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
        <motion.div style={{ y, opacity }} className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Badge - Enhanced with glow */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-primary-500/30 mb-8 animate-breathe"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2.5 h-2.5 bg-accent-emerald rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            />
            <span className="text-sm text-gray-200 font-medium">Now live on Polygon Amoy Testnet</span>
            <motion.div
              animate={{ x: [0, 3, 0], y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowUpRight className="w-4 h-4 text-primary-400" />
            </motion.div>
          </motion.div>

          {/* Main Heading - Enhanced with glow */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] mb-6 tracking-tight"
          >
            <motion.span 
              className="text-white inline-block hero-text-shadow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Launch Your Own
            </motion.span>
            <br />
            <motion.span 
              className="text-gradient animate-gradient bg-[length:200%_auto] inline-block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              Polygon App Chain
            </motion.span>
          </motion.h1>

          {/* Tagline - Enhanced with typewriter feel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">
              <span className="text-gradient-purple">One click</span>
              <span className="text-gray-500 mx-3">•</span>
              <span className="text-gradient-pink">One chain</span>
              <span className="text-gray-500 mx-3">•</span>
              <span className="text-gradient-cyan">PolyOne</span>
            </p>
          </motion.div>

          {/* Subheading - Enhanced with highlighted keywords */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Deploy custom blockchain networks powered by Polygon CDK in minutes.
            <motion.span 
              className="text-white font-medium"
              whileHover={{ color: '#a855f7' }}
              transition={{ duration: 0.2 }}
            > Enterprise-grade security</motion.span>, 
            <motion.span 
              className="text-white font-medium"
              whileHover={{ color: '#ec4899' }}
              transition={{ duration: 0.2 }}
            > unlimited scalability</motion.span>, and 
            <motion.span 
              className="text-white font-medium"
              whileHover={{ color: '#06b6d4' }}
              transition={{ duration: 0.2 }}
            > seamless interoperability</motion.span>.
          </motion.p>

          {/* CTA Buttons - Enhanced with glow effects */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16"
          >
            <Link href="/dashboard/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="btn-glow group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-primary-500 via-accent-pink to-primary-500 bg-[length:200%_auto] animate-gradient font-bold text-lg shadow-glow-lg overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  Start Building
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </span>
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  initial={{ x: '-200%' }}
                  whileHover={{ x: '200%' }}
                  transition={{ duration: 0.8 }}
                />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              className="group px-10 py-5 rounded-2xl border-2 border-white/20 hover:bg-white/5 font-semibold text-lg transition-all flex items-center gap-3 backdrop-blur-sm"
            >
              <motion.div
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Play className="w-5 h-5 fill-white" />
              </motion.div>
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-8 text-gray-500"
          >
            <span className="text-sm">Powered by:</span>
            <div className="flex items-center gap-6">
              {['Polygon CDK', 'zkEVM', 'AggLayer', 'Ethereum'].map((tech, i) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="text-sm text-gray-400 font-mono"
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-primary-500 rounded-full"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-24 px-6 relative">
        {/* Section background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-900/5 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative group"
              >
                {/* Glow on hover */}
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-br from-primary-500/30 to-accent-pink/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-60"
                  transition={{ duration: 0.3 }}
                />
                
                <div className="relative glass-card p-8 text-center border border-white/5 group-hover:border-primary-500/30 transition-all duration-500">
                  {/* Animated icon container */}
                  <motion.div 
                    className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center relative overflow-hidden"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <stat.icon className="w-7 h-7 text-primary-400 relative z-10" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-primary-500/30 to-transparent"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>
                  
                  {/* Stat value with glow */}
                  <div className="text-4xl sm:text-5xl font-extrabold mb-3 text-gradient text-glow">
                    <StatCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  
                  {/* Label */}
                  <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">{stat.label}</div>
                  
                  {/* Bottom accent line */}
                  <motion.div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-pink group-hover:w-1/2 transition-all duration-500"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section id="features" className="py-32 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            {/* Badge with animation */}
            <motion.div 
              className="inline-flex items-center gap-2 badge badge-purple mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4" />
              Features
            </motion.div>
            
            {/* Section title */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
              <span className="text-white">Everything You Need to</span>
              <motion.span 
                className="text-gradient block mt-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                Build at Scale
              </motion.span>
            </h2>
            
            {/* Description */}
            <motion.p 
              className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              PolyOne provides all the tools and infrastructure you need to launch, manage, and scale your blockchain with enterprise-grade reliability.
            </motion.p>
          </motion.div>

          {/* Feature cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section id="how-it-works" className="py-32 px-6 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-900/10 to-transparent" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <motion.div 
              className="inline-flex items-center gap-2 badge badge-info mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Workflow className="w-4 h-4" />
              How It Works
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
              Launch in
              <span className="text-gradient"> Three Steps</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              From configuration to deployment, get your chain live in minutes.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden lg:block absolute top-28 left-[20%] right-[20%] h-0.5">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary-500/50 via-accent-pink/50 to-accent-cyan/50"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                <div className="card-premium p-8 h-full relative overflow-hidden">
                  {/* Corner accent */}
                  <motion.div 
                    className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/15 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  
                  {/* Step number - Large background */}
                  <motion.div 
                    className="absolute top-4 right-4 text-8xl font-black text-primary-500/10 font-mono select-none"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 + 0.3 }}
                  >
                    {step.number}
                  </motion.div>
                  
                  {/* Icon container with pulse ring */}
                  <div className="relative mb-8">
                    <motion.div 
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center shadow-lg relative z-10"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <step.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    {/* Pulse ring effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-primary-500/30"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  
                  {/* Step indicator badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-4">
                    Step {step.number}
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-gradient transition-all duration-300">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  
                  {/* Bottom accent */}
                  <motion.div 
                    className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500/0 via-primary-500/50 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Animated background glow */}
            <motion.div 
              className="absolute -inset-4 bg-gradient-to-r from-primary-500/30 via-accent-pink/30 to-accent-cyan/30 rounded-[40px] blur-3xl"
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            <div className="relative card-premium p-12 sm:p-16 lg:p-20 text-center overflow-hidden">
              {/* Animated grid pattern */}
              <div className="absolute inset-0 bg-grid opacity-20" />
              
              {/* Floating orbs inside */}
              <motion.div
                className="absolute top-10 left-10 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl"
                animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-10 right-10 w-40 h-40 bg-accent-pink/20 rounded-full blur-2xl"
                animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              
              <div className="relative z-10">
                {/* Animated rocket icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 150, delay: 0.2 }}
                  className="relative w-24 h-24 mx-auto mb-10"
                >
                  <motion.div
                    className="w-full h-full rounded-3xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-lg"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Rocket className="w-12 h-12 text-white" />
                  </motion.div>
                  {/* Glow ring */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl border-2 border-primary-500/50"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <motion.h2 
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  Ready to Build the{' '}
                  <span className="text-gradient">Future</span>?
                </motion.h2>
                
                <motion.p 
                  className="text-gray-400 text-lg sm:text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  Join thousands of developers building the next generation of blockchain applications on PolyOne.
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-5 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <Link href="/dashboard/create">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-glow px-10 py-5 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-pink font-bold text-lg shadow-glow-lg flex items-center gap-3 mx-auto sm:mx-0"
                    >
                      <Rocket className="w-5 h-5" />
                      Deploy Your Chain
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </Link>
                  <Link href="/docs">
                    <motion.button
                      whileHover={{ scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' }}
                      whileTap={{ scale: 0.98 }}
                      className="px-10 py-5 rounded-2xl border-2 border-white/20 font-semibold text-lg transition-all flex items-center gap-3 mx-auto sm:mx-0 backdrop-blur-sm hover:bg-white/5"
                    >
                      <Code2 className="w-5 h-5" />
                      Read Documentation
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="relative border-t border-white/5 py-20 px-6 overflow-hidden">
        {/* Background accent */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-radial from-primary-500/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-5 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6 group">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-purple"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Rocket className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <span className="font-bold text-xl block group-hover:text-gradient transition-all">PolyOne</span>
                  <span className="text-xs text-gray-500">Polygon App Chains</span>
                </div>
              </Link>
              <p className="text-gray-400 text-sm mb-8 max-w-sm leading-relaxed">
                The most powerful platform for launching Polygon app chains. Deploy, scale, and manage your blockchain infrastructure with ease.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Twitter, href: '#', label: 'Twitter' },
                  { icon: Github, href: '#', label: 'GitHub' },
                  { icon: MessageCircle, href: '#', label: 'Discord' },
                ].map((social) => (
                  <motion.a 
                    key={social.label}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary-500/30 hover:bg-white/10 transition-all group"
                  >
                    <social.icon className="w-5 h-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
                  </motion.a>
                ))}
              </div>
            </div>
            
            {/* Links */}
            {[
              { title: 'Product', links: [
                { name: 'Features', href: '#features' },
                { name: 'Templates', href: '/dashboard/templates' },
                { name: 'Documentation', href: '/docs' },
                { name: 'Changelog', href: '#' },
              ]},
              { title: 'Company', links: [
                { name: 'About', href: '#' },
                { name: 'Blog', href: '#' },
                { name: 'Careers', href: '#' },
                { name: 'Contact', href: '/support' },
              ]},
              { title: 'Resources', links: [
                { name: 'Community', href: '#' },
                { name: 'Support', href: '/support' },
                { name: 'Status', href: '#' },
                { name: 'Terms', href: '/terms' },
              ]},
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold mb-5 text-white">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link 
                        href={link.href} 
                        className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                      >
                        <span className="w-0 h-px bg-primary-500 group-hover:w-2 transition-all" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {/* Newsletter */}
          <div className="glass-card p-8 mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-bold text-lg mb-2">Stay Updated</h4>
                <p className="text-gray-400 text-sm">Get the latest updates on new features and releases.</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 md:w-64 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary-500/50 focus:outline-none text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm whitespace-nowrap"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-white/5">
            <p className="text-gray-500 text-sm">
              © 2026 PolyOne. Built for Polygon Buildathon.
            </p>
            <div className="flex gap-8 text-sm">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Settings</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
