'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Book, 
  Code, 
  Rocket, 
  Shield, 
  Search,
  ChevronRight,
  Zap,
  Layers,
  Globe,
  Terminal,
  FileCode,
  Cpu,
  Network,
  Lock,
  Settings,
  ExternalLink,
  Copy,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Play,
  BookOpen,
  GraduationCap
} from 'lucide-react'

// Documentation categories with detailed content
const docCategories = [
  {
    id: 'getting-started',
    icon: Book,
    title: 'Getting Started',
    description: 'Learn the fundamentals of PolyOne and deploy your first blockchain',
    gradient: 'from-emerald-500 to-teal-500',
    href: '/docs/getting-started',
    articles: [
      { title: 'Introduction to PolyOne', time: '5 min' },
      { title: 'Creating Your Account', time: '3 min' },
      { title: 'Connecting Your Wallet', time: '2 min' },
      { title: 'Platform Overview', time: '7 min' },
    ]
  },
  {
    id: 'quick-start',
    icon: Rocket,
    title: 'Quick Start Guide',
    description: 'Fast track your way to launching a production-ready chain',
    gradient: 'from-primary-500 to-accent-pink',
    href: '/docs/quick-start',
    articles: [
      { title: 'Deploy in 5 Minutes', time: '5 min' },
      { title: 'Configure Your Chain', time: '8 min' },
      { title: 'Add Validators', time: '6 min' },
      { title: 'Go Live Checklist', time: '4 min' },
    ]
  },
  {
    id: 'api-reference',
    icon: Code,
    title: 'API Reference',
    description: 'Complete API documentation for developers and integrations',
    gradient: 'from-blue-500 to-cyan-500',
    href: '/docs/api-reference',
    articles: [
      { title: 'Authentication', time: '4 min' },
      { title: 'Chain Management API', time: '10 min' },
      { title: 'Validator API', time: '8 min' },
      { title: 'Webhooks & Events', time: '6 min' },
    ]
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security',
    description: 'Best practices for securing your blockchain infrastructure',
    gradient: 'from-red-500 to-orange-500',
    href: '/docs/security',
    articles: [
      { title: 'Security Architecture', time: '8 min' },
      { title: 'Key Management', time: '6 min' },
      { title: 'Access Control', time: '5 min' },
      { title: 'Audit Guidelines', time: '7 min' },
    ]
  },
]

// Popular topics for quick access
const popularTopics = [
  { icon: Layers, title: 'Chain Types', description: 'zkRollup vs Optimistic vs Validium' },
  { icon: Network, title: 'AggLayer', description: 'Cross-chain interoperability' },
  { icon: Cpu, title: 'Validators', description: 'Setup and management' },
  { icon: Terminal, title: 'CLI Tools', description: 'Command line interface' },
  { icon: Lock, title: 'Permissions', description: 'Access control setup' },
  { icon: Settings, title: 'Configuration', description: 'Advanced settings' },
]

// Code example for the preview
const codeExample = `// Deploy a new chain with PolyOne SDK
import { PolyOne } from '@polyone/sdk';

const polyone = new PolyOne({
  apiKey: process.env.POLYONE_API_KEY
});

const chain = await polyone.chains.create({
  name: 'My Gaming Chain',
  type: 'zk-rollup',
  gasToken: 'GAME',
  validators: 5
});

console.log('Chain deployed:', chain.id);`

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeExample)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="min-h-screen bg-dark-600 text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-accent-pink/15 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-dark-600/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-3 group">
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-purple"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Rocket className="w-5 h-5 text-white" />
                </motion.div>
                <div className="hidden sm:block">
                  <span className="font-bold text-lg">PolyOne</span>
                  <span className="text-xs text-gray-400 block">Documentation</span>
                </div>
              </Link>
              
              <div className="hidden md:flex items-center gap-1 text-sm">
                <Link href="/docs" className="px-3 py-2 rounded-lg bg-primary-500/10 text-primary-300 font-medium">
                  Docs
                </Link>
                <Link href="/docs/api-reference" className="px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  API
                </Link>
                <Link href="/docs/quick-start" className="px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  Guides
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-primary-500/50 focus:outline-none text-sm transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs bg-white/10 text-gray-500">⌘K</kbd>
              </div>
              
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple"
                >
                  Dashboard
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-500/20 mb-6"
              whileHover={{ scale: 1.02 }}
            >
              <BookOpen className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-gray-300">Documentation</span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
              Learn to Build with{' '}
              <span className="text-gradient">PolyOne</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-400 leading-relaxed mb-10">
              Everything you need to deploy, manage, and scale your Polygon app chains. 
              From quick starts to advanced API references.
            </p>

            {/* Quick actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs/quick-start">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-glow px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-bold flex items-center gap-3"
                >
                  <Rocket className="w-5 h-5" />
                  Quick Start Guide
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/docs/api-reference">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 rounded-xl border-2 border-white/20 hover:border-primary-500/50 font-semibold flex items-center gap-3"
                >
                  <Code className="w-5 h-5" />
                  API Reference
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Documentation Categories */}
          <div className="grid md:grid-cols-2 gap-6 mb-20">
            {docCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={category.href}>
                  <motion.div
                    whileHover={{ y: -8 }}
                    className="card-premium card-shine p-8 h-full group cursor-pointer"
                  >
                    <div className="flex items-start gap-5">
                      <motion.div 
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <category.icon className="w-7 h-7 text-white" />
                      </motion.div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold group-hover:text-gradient transition-all">
                            {category.title}
                          </h3>
                          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-gray-400 text-sm mb-4">{category.description}</p>
                        
                        {/* Article list */}
                        <div className="space-y-2">
                          {category.articles.slice(0, 3).map((article, i) => (
                            <div key={i} className="flex items-center justify-between text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                              <span>{article.title}</span>
                              <span className="text-xs">{article.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Popular Topics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-3">Popular Topics</h2>
              <p className="text-gray-400">Quick access to commonly searched documentation</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {popularTopics.map((topic, index) => (
                <motion.button
                  key={topic.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary-500/30 hover:bg-white/10 transition-all text-center group"
                >
                  <topic.icon className="w-6 h-6 mx-auto mb-3 text-gray-400 group-hover:text-primary-400 transition-colors" />
                  <h4 className="font-semibold text-sm mb-1">{topic.title}</h4>
                  <p className="text-xs text-gray-500">{topic.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Code Example */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3">Get Started in Minutes</h2>
              <p className="text-gray-400">Deploy your first chain with just a few lines of code</p>
            </div>
            
            <div className="relative glass-card overflow-hidden">
              {/* Code header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-sm text-gray-400 font-mono">deploy-chain.ts</span>
                </div>
                <motion.button
                  onClick={handleCopyCode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-all"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </motion.button>
              </div>
              
              {/* Code content */}
              <div className="p-6 overflow-x-auto">
                <pre className="text-sm font-mono">
                  <code className="text-gray-300">
                    {codeExample.split('\n').map((line, i) => (
                      <div key={i} className="flex">
                        <span className="w-8 text-gray-600 select-none">{i + 1}</span>
                        <span className="flex-1">
                          {line.includes('//') ? (
                            <span className="text-gray-500">{line}</span>
                          ) : line.includes('import') || line.includes('const') || line.includes('await') ? (
                            <span>
                              <span className="text-purple-400">{line.split(' ')[0]}</span>
                              <span className="text-gray-300">{' ' + line.split(' ').slice(1).join(' ')}</span>
                            </span>
                          ) : line.includes(':') && !line.includes('//') ? (
                            <span>
                              {line.split(':')[0].includes("'") ? (
                                <>
                                  <span className="text-cyan-300">{line.split(':')[0]}</span>
                                  <span className="text-gray-300">:</span>
                                  <span className="text-amber-300">{line.split(':').slice(1).join(':')}</span>
                                </>
                              ) : (
                                <span className="text-gray-300">{line}</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-300">{line}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 via-accent-pink/20 to-accent-cyan/20 rounded-[40px] blur-3xl" />
            
            <div className="relative glass-card p-12 text-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center"
              >
                <GraduationCap className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Can't find what you're looking for? Our support team is here to help you get started.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/support">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-bold flex items-center gap-2"
                  >
                    Contact Support
                    <ExternalLink className="w-5 h-5" />
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 rounded-xl border-2 border-white/20 font-semibold flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Tutorials
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © 2026 PolyOne Documentation
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</Link>
            <Link href="/support" className="text-gray-400 hover:text-white transition-colors">Support</Link>
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">Community</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
