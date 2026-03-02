'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  Vote,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Rocket,
  Sparkles,
  BarChart3,
  Globe,
  Zap,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Timer,
  Award
} from 'lucide-react'

const proposals = [
  {
    id: 'PIP-42',
    title: 'Increase Maximum Validator Count to 200',
    description: 'Proposal to increase the maximum number of validators per chain from 100 to 200, enabling greater decentralization for enterprise chains.',
    status: 'active',
    author: '0x1a2b...3c4d',
    votesFor: 8420,
    votesAgainst: 1230,
    totalVotes: 9650,
    quorum: 10000,
    endsIn: '2 days',
    category: 'Protocol',
    created: '2026-02-25',
  },
  {
    id: 'PIP-41',
    title: 'Implement Dynamic Gas Pricing for App Chains',
    description: 'Introduce an EIP-1559 style dynamic gas pricing mechanism for all PolyOne-deployed app chains to improve UX and gas efficiency.',
    status: 'active',
    author: '0x5e6f...7g8h',
    votesFor: 6100,
    votesAgainst: 3200,
    totalVotes: 9300,
    quorum: 10000,
    endsIn: '4 days',
    category: 'Economics',
    created: '2026-02-23',
  },
  {
    id: 'PIP-40',
    title: 'Add Cross-Chain Bridge Fee Reduction',
    description: 'Reduce the bridge fee from 0.1% to 0.05% for transactions between PolyOne-managed chains via AggLayer.',
    status: 'passed',
    author: '0x9a0b...1c2d',
    votesFor: 11200,
    votesAgainst: 800,
    totalVotes: 12000,
    quorum: 10000,
    endsIn: 'Ended',
    category: 'Economics',
    created: '2026-02-15',
  },
  {
    id: 'PIP-39',
    title: 'Community Treasury Allocation for Developer Grants',
    description: 'Allocate 5% of the community treasury to fund developer grants for building tools and applications on PolyOne.',
    status: 'passed',
    author: '0x3e4f...5g6h',
    votesFor: 9800,
    votesAgainst: 1100,
    totalVotes: 10900,
    quorum: 10000,
    endsIn: 'Ended',
    category: 'Treasury',
    created: '2026-02-10',
  },
  {
    id: 'PIP-38',
    title: 'Mandatory Security Audits for Template Submissions',
    description: 'Require all community-submitted chain templates to pass a security audit before being listed on the marketplace.',
    status: 'rejected',
    author: '0x7i8j...9k0l',
    votesFor: 3200,
    votesAgainst: 7800,
    totalVotes: 11000,
    quorum: 10000,
    endsIn: 'Ended',
    category: 'Security',
    created: '2026-02-05',
  },
]

const councilMembers = [
  { name: 'Development SubDAO', members: 7, focus: 'Protocol upgrades & smart contract development', icon: Zap },
  { name: 'Operations SubDAO', members: 5, focus: 'Infrastructure, validators, & chain health', icon: Shield },
  { name: 'Communications SubDAO', members: 4, focus: 'Community engagement & ecosystem growth', icon: MessageCircle },
]

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: Timer, label: 'Active' },
  passed: { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', icon: CheckCircle2, label: 'Passed' },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', icon: XCircle, label: 'Rejected' },
}

export default function GovernancePage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'rejected'>('all')

  const filtered = filter === 'all' ? proposals : proposals.filter(p => p.status === filter)

  const stats = [
    { label: 'Total Proposals', value: '42', icon: Vote, gradient: 'from-primary-500 to-accent-pink' },
    { label: 'Active Votes', value: '2', icon: Timer, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Council Members', value: '16', icon: Users, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Participation Rate', value: '73%', icon: TrendingUp, gradient: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="min-h-screen bg-dark-600 text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
        <motion.div
          className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-primary-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], x: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-accent-pink/10 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-grid opacity-20" />
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
                  <span className="text-xs text-gray-400 block">Governance</span>
                </div>
              </Link>
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
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-500/20 mb-4" whileHover={{ scale: 1.02 }}>
                <Vote className="w-4 h-4 text-primary-400" />
                <span className="text-sm text-gray-300">On-chain Governance</span>
              </motion.div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                PolyOne <span className="text-gradient">Governance</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl">
                Shape the future of the PolyOne ecosystem. Vote on proposals, delegate your power, and participate in protocol governance.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="btn-glow px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-bold flex items-center gap-3 self-start lg:self-auto"
            >
              <Sparkles className="w-5 h-5" />
              Create Proposal
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-extrabold mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Council SubDAOs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Award className="w-6 h-6 text-primary-400" />
            Council SubDAOs
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {councilMembers.map((dao, i) => (
              <motion.div
                key={dao.name}
                whileHover={{ y: -6 }}
                className="card-premium card-shine p-6 group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center border border-primary-500/20">
                    <dao.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-bold group-hover:text-gradient transition-all">{dao.name}</h3>
                    <span className="text-xs text-gray-500">{dao.members} members</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{dao.focus}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Proposals */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary-400" />
              Proposals
            </h2>
            <div className="flex gap-2">
              {(['all', 'active', 'passed', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-gradient-to-r from-primary-500 to-accent-pink text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((proposal, i) => {
                const sc = statusConfig[proposal.status]
                const StatusIcon = sc.icon
                const pct = Math.round((proposal.votesFor / proposal.totalVotes) * 100)
                const quorumPct = Math.min(100, Math.round((proposal.totalVotes / proposal.quorum) * 100))

                return (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="card-premium p-6 group cursor-pointer"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="font-mono text-sm text-primary-400 font-semibold">{proposal.id}</span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color} border ${sc.border}`}>
                            <StatusIcon className="w-3 h-3" />
                            {sc.label}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400 border border-white/10">
                            {proposal.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-gradient transition-all">{proposal.title}</h3>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{proposal.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span>By {proposal.author}</span>
                          <span>{proposal.created}</span>
                          {proposal.status === 'active' && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Clock className="w-3 h-3" />
                              Ends in {proposal.endsIn}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="lg:w-64 flex-shrink-0 space-y-4">
                        {/* Vote progress */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="flex items-center gap-1.5 text-emerald-400"><ThumbsUp className="w-3.5 h-3.5" /> {pct}%</span>
                            <span className="flex items-center gap-1.5 text-red-400"><ThumbsDown className="w-3.5 h-3.5" /> {100 - pct}%</span>
                          </div>
                          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{proposal.votesFor.toLocaleString()} For</span>
                            <span>{proposal.votesAgainst.toLocaleString()} Against</span>
                          </div>
                        </div>

                        {/* Quorum */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-400">Quorum</span>
                            <span className={quorumPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}>{quorumPct}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${quorumPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${quorumPct}%` }}
                              transition={{ duration: 1, delay: i * 0.1 + 0.2 }}
                            />
                          </div>
                        </div>

                        {proposal.status === 'active' && (
                          <div className="flex gap-2">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/30 transition-all">
                              Vote For
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-all">
                              Vote Against
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 via-accent-pink/20 to-accent-cyan/20 rounded-[36px] blur-3xl" />
            <div className="relative glass-card p-12 text-center overflow-hidden">
              <div className="absolute inset-0 bg-grid opacity-15" />
              <div className="relative z-10">
                <Globe className="w-12 h-12 mx-auto mb-6 text-primary-400" />
                <h2 className="text-3xl font-bold mb-4">Join the PolyOne Community</h2>
                <p className="text-gray-400 max-w-lg mx-auto mb-8">
                  Participate in governance, contribute to the protocol, and help shape the future of blockchain infrastructure.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard">
                    <motion.button whileHover={{ scale: 1.05 }} className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-bold flex items-center gap-2">
                      <Rocket className="w-5 h-5" /> Launch App
                    </motion.button>
                  </Link>
                  <Link href="/docs">
                    <motion.button whileHover={{ scale: 1.05 }} className="px-8 py-4 rounded-xl border-2 border-white/20 font-semibold flex items-center gap-2 hover:bg-white/5">
                      Learn More <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 PolyOne Governance</p>
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
