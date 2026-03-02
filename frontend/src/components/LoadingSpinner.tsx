'use client'

import { motion } from 'framer-motion'
import { Rocket } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullScreen?: boolean
}

export function LoadingSpinner({ size = 'md', message, fullScreen = false }: LoadingSpinnerProps) {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', ring: 'w-10 h-10' },
    md: { container: 'w-16 h-16', icon: 'w-8 h-8', ring: 'w-20 h-20' },
    lg: { container: 'w-24 h-24', icon: 'w-12 h-12', ring: 'w-28 h-28' },
  }

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className={`absolute ${sizes[size].ring} rounded-full border-2 border-primary-500/30`}
          style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Inner rotating ring (opposite direction) */}
        <motion.div
          className={`absolute ${sizes[size].ring} rounded-full border-2 border-t-transparent border-accent-pink/50`}
          style={{ top: '50%', left: '50%', x: '-50%', y: '-50%', scale: 0.85 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Center container with icon */}
        <motion.div
          className={`relative ${sizes[size].container} rounded-2xl bg-gradient-to-br from-primary-500 via-accent-pink to-accent-cyan flex items-center justify-center shadow-glow-purple`}
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Rocket className={`${sizes[size].icon} text-white`} />
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/30 to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        
        {/* Pulsing glow */}
        <motion.div
          className={`absolute ${sizes[size].container} rounded-2xl bg-primary-500/30 blur-xl`}
          style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      
      {message && (
        <motion.p
          className="text-gray-400 text-sm font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-600/90 backdrop-blur-sm flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {spinnerContent}
        </motion.div>
      </div>
    )
  }

  return spinnerContent
}

// Page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-48 skeleton-wave rounded-lg mb-2" />
          <div className="h-4 w-64 skeleton-wave rounded-lg" />
        </div>
        <div className="h-10 w-32 skeleton-wave rounded-xl" />
      </div>
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex justify-between mb-4">
              <div className="w-12 h-12 skeleton-wave rounded-xl" />
              <div className="w-16 h-6 skeleton-wave rounded-full" />
            </div>
            <div className="h-8 w-24 skeleton-wave rounded-lg mb-2" />
            <div className="h-4 w-20 skeleton-wave rounded-lg" />
          </div>
        ))}
      </div>
      
      {/* Cards grid skeleton */}
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex justify-between mb-4">
              <div className="w-14 h-14 skeleton-wave rounded-2xl" />
              <div className="w-10 h-10 skeleton-wave rounded-full" />
            </div>
            <div className="h-6 w-full skeleton-wave rounded-lg mb-2" />
            <div className="h-4 w-3/4 skeleton-wave rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Card loading skeleton
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-6 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 skeleton-wave rounded-2xl flex-shrink-0" />
            <div className="flex-1">
              <div className="h-6 w-48 skeleton-wave rounded-lg mb-2" />
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-20 skeleton-wave rounded-lg" />
                <div className="h-6 w-24 skeleton-wave rounded-lg" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-16 skeleton-wave rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Inline loading dots
export function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 bg-primary-400 rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  )
}
