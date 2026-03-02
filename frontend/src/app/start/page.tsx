'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Wallet,
  Download,
  Rocket,
  Shield,
  CheckCircle2,
  Globe,
  Zap,
  Sparkles,
  Network,
  Layers,
  ChevronRight,
  ExternalLink,
  Code,
  Terminal,
  Copy,
  Play
} from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const steps = [
  {
    number: '01',
    title: 'Set Up Your Wallet',
    description: 'Install a Web3 wallet to interact with the Polygon network and deploy your chains.',
    icon: Wallet,
    gradient: 'from-primary-500 to-accent-pink',
    content: (
      <div className="space-y-4">
        <p className="text-gray-400">Choose one of these wallets to get started:</p>
        <div className="grid gap-3">
          {[
            { name: 'MetaMask', desc: 'Most popular Ethereum wallet', url: 'https://metamask.io/' },
            { name: 'Coinbase Wallet', desc: 'Easy to use, great for beginners', url: 'https://www.coinbase.com/wallet' },
            { name: 'WalletConnect', desc: 'Connect with 300+ wallets', url: 'https://walletconnect.com/' },
          ].map(w => (
            <a key={w.name} href={w.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 hover:bg-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold group-hover:text-gradient transition-all">{w.name}</div>
                <div className="text-sm text-gray-500">{w.desc}</div>
              </div>
              <Download className="w-5 h-5 text-gray-500 group-hover:text-primary-400 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: '02',
    title: 'Get Test Tokens',
    description: 'Obtain test POL tokens from the Polygon Amoy faucet to deploy chains on testnet.',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-500',
    content: (
      <div className="space-y-4">
        <p className="text-gray-400">You need test POL to pay for gas fees on the Polygon Amoy testnet.</p>
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Polygon Amoy Testnet Faucet</span>
            <a href="https://faucet.polygon.technology/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary-400 text-sm hover:text-primary-300 transition-colors"
            >
              Open Faucet <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="text-xs text-gray-500 mb-1">Network Details</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Network:</span> Polygon Amoy</div>
              <div><span className="text-gray-500">Chain ID:</span> 80002</div>
              <div><span className="text-gray-500">Token:</span> POL</div>
              <div><span className="text-gray-500">Type:</span> Testnet</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: '03',
    title: 'Connect to PolyOne',
    description: 'Connect your wallet to the PolyOne platform and start building.',
    icon: Network,
    gradient: 'from-accent-cyan to-blue-500',
    content: (
      <div className="space-y-4">
        <p className="text-gray-400">Click the button below to connect your wallet and access the dashboard.</p>
        <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10">
          <ConnectButton label="Connect Wallet" />
          <p className="text-xs text-gray-500 text-center">
            Your wallet will be used to sign transactions and deploy chains.
          </p>
        </div>
      </div>
    ),
  },
  {
    number: '04',
    title: 'Launch Your First Chain',
    description: 'Deploy a custom Polygon app chain in just a few clicks.',
    icon: Rocket,
    gradient: 'from-accent-emerald to-teal-500',
    content: (
      <div className="space-y-4">
        <p className="text-gray-400">Once connected, you can deploy your first chain from the dashboard.</p>
        <div className="grid gap-3">
          {[
            { label: 'Use a Template', desc: 'Pre-configured for Gaming, DeFi, NFT, or Enterprise', href: '/dashboard/templates' },
            { label: 'Custom Configuration', desc: 'Full control over chain type, validators, and gas token', href: '/dashboard/create' },
          ].map(opt => (
            <Link key={opt.label} href={opt.href}>
              <motion.div whileHover={{ x: 4 }} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 transition-all group cursor-pointer">
                <div className="flex-1">
                  <div className="font-semibold group-hover:text-gradient transition-all">{opt.label}</div>
                  <div className="text-sm text-gray-500">{opt.desc}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-400 transition-colors" />
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    ),
  },
]

const quickLinks = [
  { icon: Terminal, title: 'API Reference', desc: 'Complete REST API docs', href: '/docs/api-reference' },
  { icon: Shield, title: 'Security Guide', desc: 'Best practices & audits', href: '/docs/security' },
  { icon: Code, title: 'SDK Documentation', desc: 'JavaScript/TypeScript SDK', href: '/docs/getting-started' },
  { icon: Layers, title: 'Chain Templates', desc: 'Pre-built configurations', href: '/dashboard/templates' },
]

export default function StartPage() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="min-h-screen bg-dark-600 text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
        <motion.div
          className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-primary-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-accent-cyan/10 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-dark-600/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-purple" whileHover={{ scale: 1.1, rotate: 5 }}>
                <Rocket className="w-5 h-5 text-white" />
              </motion.div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg">PolyOne</span>
                <span className="text-xs text-gray-400 block">Getting Started</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Docs</Link>
              <Link href="/dashboard">
                <motion.button whileHover={{ scale: 1.02 }} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple">
                  Dashboard
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
          <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-500/20 mb-6 mx-auto" whileHover={{ scale: 1.02 }}>
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-gray-300">Quick Start</span>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Get Started with{' '}<span className="text-gradient">PolyOne</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Follow these four simple steps to set up your wallet, connect to the platform, and deploy your first Polygon app chain.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid lg:grid-cols-5 gap-8 mb-20">
          {/* Step selector */}
          <div className="lg:col-span-2 space-y-3">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isActive = activeStep === i
              return (
                <motion.button
                  key={step.number}
                  onClick={() => setActiveStep(i)}
                  whileHover={{ x: 4 }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/15 to-accent-pink/10 border-primary-500/30'
                      : 'bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg flex-shrink-0 ${
                      isActive ? 'scale-110' : 'opacity-70'
                    } transition-all`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-primary-400">Step {step.number}</span>
                        {i < activeStep && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <h3 className={`font-bold truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>{step.title}</h3>
                    </div>
                    <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-gray-600'}`} />
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Step content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="card-premium p-8"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono text-primary-400">Step {steps[activeStep].number}</span>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-500">{activeStep + 1} of {steps.length}</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{steps[activeStep].title}</h2>
              <p className="text-gray-400 mb-6">{steps[activeStep].description}</p>
              {steps[activeStep].content}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                <button
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
                {activeStep < steps.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm flex items-center gap-2"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <Link href="/dashboard">
                    <motion.button whileHover={{ scale: 1.02 }} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm flex items-center gap-2">
                      Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold mb-6 text-center">Explore More</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, i) => (
              <Link key={link.title} href={link.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="p-5 rounded-xl bg-white/5 border border-white/5 hover:border-primary-500/30 hover:bg-white/10 transition-all group cursor-pointer h-full"
                >
                  <link.icon className="w-6 h-6 text-gray-400 group-hover:text-primary-400 transition-colors mb-3" />
                  <h3 className="font-semibold mb-1 group-hover:text-gradient transition-all">{link.title}</h3>
                  <p className="text-xs text-gray-500">{link.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 PolyOne</p>
          <div className="flex gap-6 text-sm">
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Docs</Link>
            <Link href="/support" className="text-gray-400 hover:text-white transition-colors">Support</Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
