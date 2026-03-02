'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle,
  Mail,
  MessageCircle,
  Book,
  Github,
  Twitter,
  Send,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Rocket,
  Zap,
  Shield,
  Globe,
  Headphones,
  Clock,
  ExternalLink,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'

export default function SupportPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'general', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSubmitting(false)
    setSubmitted(true)
    toast.success('Support request submitted! We\'ll get back to you soon.')
    setTimeout(() => { setFormData({ name: '', email: '', subject: 'general', message: '' }); setSubmitted(false) }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const faqs = [
    { q: 'How do I create a new blockchain?', a: 'Navigate to "Launch Chain" in the sidebar and fill out the form with your chain details. You can choose the chain type (public/private), rollup type (zkRollup, Optimistic, Validium), configure validators, and set a gas token. Your chain will be registered on-chain via our smart contracts.' },
    { q: 'What networks are supported for deployment?', a: 'PolyOne supports Polygon Mainnet (chain ID 137) and Polygon Amoy Testnet (chain ID 80002). We recommend starting on Amoy testnet before deploying to mainnet. The platform will automatically prompt you to switch networks if needed.' },
    { q: 'What is the difference between local and on-chain chains?', a: 'Local chains are stored in your browser\'s localStorage. On-chain chains are registered on the Polygon blockchain via our ChainFactory smart contract, making them permanent and verifiable. On-chain registration requires a wallet connection and gas fees.' },
    { q: 'How do I add validators to my chain?', a: 'Validators are configured during chain creation. You can set the initial validator count (1-100). For on-chain registered chains, validator management is handled through our smart contracts. Visit the chain details page for advanced management.' },
    { q: 'Where can I find my RPC URL and Explorer URL?', a: 'Your RPC URL and Explorer URL are displayed in the chain details page. Click on any chain from your dashboard to view its full configuration, and use the copy button to quickly copy URLs.' },
    { q: 'How do I deploy smart contracts on my chain?', a: 'Navigate to the Contracts page in the dashboard. You can browse contract templates, deploy from templates, or deploy custom contracts by pasting your ABI and bytecode. The platform supports both standard and upgradeable contracts.' },
    { q: 'What are chain templates?', a: 'Templates are pre-configured chain setups optimized for specific use cases like Gaming, DeFi, NFT marketplaces, or Enterprise applications. Each template comes with recommended settings for validators, gas tokens, and performance parameters.' },
    { q: 'How does billing work?', a: 'PolyOne offers Starter ($29/mo), Professional ($99/mo), and Enterprise ($299/mo) plans. Each plan includes different chain limits, validator counts, and support levels. You can manage subscriptions from the Billing page in the dashboard.' },
  ]

  const filteredFaqs = searchQuery
    ? faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()))
    : faqs

  const resources = [
    { title: 'Documentation', description: 'Guides, tutorials, and API reference', icon: Book, href: '/docs', gradient: 'from-blue-500 to-cyan-500' },
    { title: 'Quick Start', description: 'Deploy your first chain in 5 minutes', icon: Rocket, href: '/docs/quick-start', gradient: 'from-primary-500 to-accent-pink' },
    { title: 'API Reference', description: 'Complete REST API documentation', icon: Zap, href: '/docs/api-reference', gradient: 'from-amber-500 to-orange-500' },
    { title: 'Security Guide', description: 'Best practices for your chains', icon: Shield, href: '/docs/security', gradient: 'from-emerald-500 to-teal-500' },
  ]

  const contactChannels = [
    { title: 'Email Support', desc: 'support@polyone.io', icon: Mail, action: 'mailto:support@polyone.io', time: 'Response within 24h' },
    { title: 'Discord Community', desc: 'Join 5,000+ developers', icon: MessageCircle, action: '#', time: 'Instant community help' },
    { title: 'GitHub Issues', desc: 'Report bugs & request features', icon: Github, action: 'https://github.com/Adityasingh2824/PolyOne/issues', time: 'Track your issues' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
            <Headphones className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-semibold text-primary-300 uppercase tracking-wider">Help Center</span>
          </motion.div>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-3">
            <span className="text-white">Support</span>{' '}<span className="text-gradient">Center</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Find answers, contact our team, or explore our resources to get the most out of PolyOne.
          </p>
        </motion.div>

        {/* Quick Contact Channels */}
        <div className="grid md:grid-cols-3 gap-4">
          {contactChannels.map((channel, i) => (
            <motion.a
              key={channel.title}
              href={channel.action}
              target={channel.action.startsWith('http') ? '_blank' : undefined}
              rel={channel.action.startsWith('http') ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 group cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center border border-primary-500/20 group-hover:border-primary-500/40 transition-colors">
                  <channel.icon className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-bold group-hover:text-gradient transition-all">{channel.title}</h3>
                  <p className="text-sm text-gray-400">{channel.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {channel.time}
              </div>
            </motion.a>
          ))}
        </div>

        {/* FAQs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-primary-400" />
              Frequently Asked Questions
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-primary-500/30 text-sm outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-3">
            {filteredFaqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <h3 className="font-semibold pr-4">{faq.q}</h3>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
            {filteredFaqs.length === 0 && (
              <div className="glass-card p-8 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400">No matching FAQs found. Try a different search term or contact us directly.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-premium p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Send us a Message</h2>
              <p className="text-sm text-gray-400">We typically respond within 24 hours</p>
            </div>
          </div>

          {submitted ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
              <p className="text-gray-400">We&apos;ll get back to you as soon as possible.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                    placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                    placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Topic</label>
                <select name="subject" value={formData.subject} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500/50 text-sm transition-all"
                >
                  <option value="general" style={{ background: '#120726' }}>General Question</option>
                  <option value="bug" style={{ background: '#120726' }}>Bug Report</option>
                  <option value="feature" style={{ background: '#120726' }}>Feature Request</option>
                  <option value="billing" style={{ background: '#120726' }}>Billing & Subscriptions</option>
                  <option value="security" style={{ background: '#120726' }}>Security Issue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Message</label>
                <textarea name="message" value={formData.message} onChange={handleChange} required rows={5}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all resize-none text-sm"
                  placeholder="Describe your question or issue..." />
              </div>
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple hover:shadow-glow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <><motion.div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Message</>
                )}
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Resources */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary-400" />
            Helpful Resources
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((res, i) => (
              <Link key={res.title} href={res.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="glass-card p-5 group cursor-pointer h-full"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${res.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <res.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold mb-1 group-hover:text-gradient transition-all">{res.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">{res.description}</p>
                  <div className="flex items-center gap-1 text-primary-400 text-xs font-medium">
                    Explore <ChevronRight className="w-3 h-3" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
