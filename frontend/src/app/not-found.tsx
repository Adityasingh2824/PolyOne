'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Rocket, Home, Search, Book } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-600 text-white flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 60%)' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-grid opacity-15" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150, delay: 0.1 }}
          className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary-500/20 to-accent-pink/20 border border-primary-500/20 flex items-center justify-center"
        >
          <span className="text-5xl font-extrabold text-gradient">404</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl font-extrabold mb-4"
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-lg mb-10 max-w-md mx-auto"
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-bold flex items-center gap-2 shadow-glow-purple"
            >
              <Home className="w-5 h-5" /> Go Home
            </motion.button>
          </Link>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl border-2 border-white/20 font-semibold flex items-center gap-2 hover:bg-white/5 transition-colors"
            >
              <Rocket className="w-5 h-5" /> Dashboard
            </motion.button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-6 text-sm"
        >
          <Link href="/docs" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <Book className="w-4 h-4" /> Documentation
          </Link>
          <Link href="/support" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" /> Support
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
