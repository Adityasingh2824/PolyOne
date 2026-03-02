'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Rocket, FileText, Shield, Scale } from 'lucide-react'
import { apiClient } from '@/lib/api'

export default function TermsOfServicePage() {
  const [termsUrl, setTermsUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTermsUrl()
  }, [])

  const loadTermsUrl = async () => {
    try {
      const host = window.location.host
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        const response = await apiClient.whitelabel.getByDomain(host)
        const settings = response.data.settings
        if (settings?.termsOfService) {
          setTermsUrl(settings.termsOfService)
        }
      }
    } catch {
      // Use default terms
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-600 flex items-center justify-center">
        <motion.div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
      </div>
    )
  }

  if (termsUrl) {
    window.location.href = termsUrl
    return null
  }

  const sections = [
    { title: '1. Acceptance of Terms', content: 'By accessing and using PolyOne ("the Platform"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you should not use the Platform. These terms apply to all visitors, users, and others who access or use the Platform.' },
    { title: '2. Platform Description', content: 'PolyOne is a Blockchain-as-a-Service (BaaS) platform that enables users to deploy, manage, and scale custom Polygon app chains. The Platform provides tools for chain deployment, validator management, smart contract deployment, analytics, and related services.' },
    { title: '3. Use License', content: 'Permission is granted to use PolyOne for personal and commercial purposes in accordance with these terms. Under this license you may not: modify or copy the platform materials for redistribution; attempt to reverse engineer any software; remove any copyright or proprietary notations; transfer the materials to another person or "mirror" the materials on any other server.' },
    { title: '4. Wallet & Blockchain Interactions', content: 'You are solely responsible for the security of your wallet credentials and private keys. PolyOne does not store or have access to your private keys. All blockchain transactions are irreversible. You acknowledge the risks associated with blockchain technology including but not limited to: smart contract vulnerabilities, network congestion, gas fee fluctuations, and potential loss of funds.' },
    { title: '5. Chain Deployment', content: 'Chains deployed through PolyOne are registered on the Polygon blockchain via smart contracts. You are responsible for the configuration and management of your deployed chains. PolyOne provides infrastructure tools but does not guarantee uptime or performance of individual chains beyond the service level specified in your subscription plan.' },
    { title: '6. Fees & Billing', content: 'Certain features of PolyOne require a paid subscription. Fees are billed in advance on a monthly basis. Blockchain transaction fees (gas fees) are separate from subscription fees and are paid directly through your wallet. Refunds may be provided at PolyOne\'s discretion.' },
    { title: '7. Disclaimer', content: 'The materials on PolyOne are provided on an "as is" basis. PolyOne makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.' },
    { title: '8. Limitations of Liability', content: 'In no event shall PolyOne or its suppliers be liable for any damages (including, without limitation, damages for loss of data, profit, or due to business interruption) arising out of the use or inability to use the Platform, even if PolyOne has been notified of the possibility of such damage. This limitation applies to the fullest extent permitted by applicable law.' },
    { title: '9. Privacy & Data', content: 'PolyOne collects and processes data in accordance with our Privacy Policy. Wallet addresses and on-chain data are publicly visible on the blockchain. We may collect usage analytics to improve the Platform. You can manage your data preferences in your account settings.' },
    { title: '10. Modifications', content: 'PolyOne reserves the right to modify these Terms of Service at any time. Changes will be posted on this page with an updated revision date. Continued use of the Platform after modifications constitutes acceptance of the updated terms.' },
    { title: '11. Governing Law', content: 'These terms and conditions are governed by and construed in accordance with applicable laws. You irrevocably submit to the exclusive jurisdiction of the courts in the applicable jurisdiction for any disputes arising from these terms.' },
  ]

  return (
    <div className="min-h-screen bg-dark-600 text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
        <div className="absolute inset-0 bg-grid opacity-15" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-dark-600/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-purple" whileHover={{ scale: 1.1, rotate: 5 }}>
                <Rocket className="w-5 h-5 text-white" />
              </motion.div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg">PolyOne</span>
                <span className="text-xs text-gray-400 block">Legal</span>
              </div>
            </Link>
            <Link href="/dashboard">
              <motion.button whileHover={{ scale: 1.02 }} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple">
                Dashboard
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-pink/20 flex items-center justify-center border border-primary-500/20">
              <Scale className="w-7 h-7 text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Terms of Service</h1>
              <p className="text-gray-400 text-sm mt-1">Last updated: February 27, 2026</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-bold mb-3 text-white">{section.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-gray-400 text-sm mb-4">
            Questions about these terms? Contact us at{' '}
            <a href="mailto:legal@polyone.io" className="text-primary-400 hover:text-primary-300 transition-colors">legal@polyone.io</a>
          </p>
          <Link href="/support" className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium">
            Visit Support Center &rarr;
          </Link>
        </motion.div>
      </div>

      <footer className="relative z-10 border-t border-white/5 py-8 px-6 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 PolyOne. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Docs</Link>
            <Link href="/support" className="text-gray-400 hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
