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
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-[30%] right-[20%] w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      {/* Noise texture */}
      <div className="absolute inset-0 bg-noise" />
    </div>
  )
}

// Floating Particles Component
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number }>>([])
  
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 10,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary-500/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 5,
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

// Feature Card Component
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-pink/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
      <div className="relative glass-card p-8 h-full cursor-pointer overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-dense opacity-20" />
        
        {/* Animated border */}
        <div className="absolute inset-0 rounded-3xl border border-transparent group-hover:border-primary-500/30 transition-colors duration-500" />
        
        <div className="relative z-10">
          <motion.div 
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-glow-purple group-hover:shadow-glow-lg transition-shadow duration-500`}
            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-7 h-7 text-white" />
          </motion.div>
          <h3 className="text-xl font-bold mb-3 group-hover:text-gradient transition-all duration-300">{title}</h3>
          <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">{description}</p>
          
          <motion.div 
            className="mt-6 flex items-center gap-2 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ x: -10 }}
            whileHover={{ x: 0 }}
          >
            <span className="text-sm font-semibold">Learn more</span>
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )

  if (href) {
    return (
      <Link href={href}>
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
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-500/20 mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-accent-emerald rounded-full"
            />
            <span className="text-sm text-gray-300">Now live on Polygon Amoy Testnet</span>
            <ArrowUpRight className="w-4 h-4 text-primary-400" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] mb-6"
          >
            <span className="text-white">Launch Your Own</span>
            <br />
            <span className="text-gradient animate-gradient bg-[length:200%_auto]">
              Polygon App Chain
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Deploy custom blockchain networks powered by Polygon CDK in minutes.
            <span className="text-white"> Enterprise-grade security</span>, 
            <span className="text-white"> unlimited scalability</span>, and 
            <span className="text-white"> seamless interoperability</span>.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link href="/dashboard/create">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 via-accent-pink to-primary-500 bg-[length:200%_auto] animate-gradient font-bold text-lg shadow-glow-lg overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Building
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group px-8 py-4 rounded-2xl border border-white/20 hover:border-primary-500/50 hover:bg-white/5 font-semibold text-lg transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
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

      {/* Stats Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 text-center group hover:border-primary-500/40 transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-primary-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold mb-2 text-gradient">
                  <StatCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="badge badge-purple mb-4">Features</div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Everything You Need to
              <span className="text-gradient block">Build at Scale</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              PolyOne provides all the tools and infrastructure you need to launch, manage, and scale your blockchain.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-900/10 to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="badge badge-info mb-4">How It Works</div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Launch in
              <span className="text-gradient"> Three Steps</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              From configuration to deployment, get your chain live in minutes.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative group"
              >
                {/* Connection Line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-20 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent" />
                )}
                
                <div className="glass-card p-8 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-full" />
                  
                  <div className="text-6xl font-bold text-primary-500/20 mb-6 font-mono">
                    {step.number}
                  </div>
                  
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center mb-6 shadow-glow-purple group-hover:scale-110 transition-transform">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-accent-pink/20 to-accent-cyan/20 rounded-4xl blur-3xl" />
            
            <div className="relative glass-card p-12 sm:p-16 text-center border-primary-500/20">
              {/* Pattern */}
              <div className="absolute inset-0 bg-grid opacity-20" />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center shadow-glow-lg"
                >
                  <Rocket className="w-10 h-10 text-white" />
                </motion.div>
                
                <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                  Ready to Build the Future?
                </h2>
                <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                  Join thousands of developers building the next generation of blockchain applications on PolyOne.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard/create">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-pink font-bold text-lg shadow-glow-lg flex items-center gap-2 mx-auto sm:mx-0"
                    >
                      Deploy Your Chain
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </Link>
                  <Link href="/docs">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-4 rounded-2xl border border-white/20 hover:border-primary-500/50 font-semibold text-lg transition-all flex items-center gap-2 mx-auto sm:mx-0"
                    >
                      Read Documentation
                      <ExternalLink className="w-5 h-5" />
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">PolyOne</span>
              </Link>
              <p className="text-gray-400 text-sm mb-6">
                The most powerful platform for launching Polygon app chains.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <Twitter className="w-5 h-5 text-gray-400" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <Github className="w-5 h-5 text-gray-400" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                </a>
              </div>
            </div>
            
            {/* Links */}
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Documentation', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Resources', links: ['Community', 'Support', 'Status', 'Terms'] },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 PolyOne. Built for Polygon Buildathon.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
