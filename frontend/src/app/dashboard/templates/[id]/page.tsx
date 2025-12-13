'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Rocket, 
  Star, 
  Users, 
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  Clock,
  Zap,
  Shield,
  Layers
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  category: string
  description: string
  author: string
  isOfficial: boolean
  isCommunity: boolean
  recommended: boolean
  tags: string[]
  icon: string
  config: any
  pricing: any
  stats: {
    deployments: number
    rating: number
    reviews: number
  }
}

interface Review {
  id: string
  user_id: string
  rating: number
  review: string
  created_at: string
}

export default function TemplateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string
  
  const [template, setTemplate] = useState<Template | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (templateId) {
      loadTemplate()
      loadReviews()
    }
  }, [templateId])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const response = await apiClient.templates.getById(templateId)
      setTemplate(response.data.template)
    } catch (error: any) {
      console.error('Error loading template:', error)
      toast.error('Failed to load template')
      router.push('/dashboard/templates')
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      const response = await apiClient.templates.getReviews(templateId)
      setReviews(response.data.reviews || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const handleDeploy = () => {
    router.push(`/dashboard/templates/${templateId}/deploy`)
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      setSubmittingReview(true)
      await apiClient.templates.rate(templateId, rating, reviewText)
      toast.success('Review submitted successfully')
      setRating(0)
      setReviewText('')
      loadTemplate()
      loadReviews()
    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 animate-pulse">
          <div className="h-8 bg-white/5 rounded mb-4 w-1/3" />
          <div className="h-4 bg-white/5 rounded mb-2" />
          <div className="h-4 bg-white/5 rounded w-2/3" />
        </div>
      </DashboardLayout>
    )
  }

  if (!template) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Template not found</h2>
          <Link href="/dashboard/templates">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink">
              Back to Templates
            </button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/dashboard/templates">
          <motion.button
            whileHover={{ x: -4 }}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </motion.button>
        </Link>

        {/* Template Header */}
        <div className="glass-card p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-5xl">{template.icon}</div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{template.name}</h1>
                  <div className="flex items-center gap-2">
                    {template.isOfficial && (
                      <span className="px-3 py-1 rounded-lg bg-primary-500/20 text-primary-300 text-sm font-semibold border border-primary-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Official
                      </span>
                    )}
                    {template.isCommunity && (
                      <span className="px-3 py-1 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Community
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-lg bg-white/10 text-gray-300 text-sm font-semibold capitalize">
                      {template.category}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6 text-lg">{template.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xl font-bold">{(template.stats?.rating || 0).toFixed(1)}</span>
                  <span className="text-gray-400">({template.stats?.reviews || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <TrendingUp className="w-5 h-5" />
                  <span>{template.stats?.deployments || 0} deployments</span>
                </div>
              </div>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-lg bg-white/5 text-sm text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Deploy Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeploy}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-lg shadow-glow-purple hover:shadow-glow-lg transition-all flex items-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Deploy from Template
              </motion.button>
            </div>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-400" />
              Configuration
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Chain Type:</span>
                <span className="font-semibold capitalize">{template.config.chainType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rollup Type:</span>
                <span className="font-semibold">{template.config.rollupType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Validators:</span>
                <span className="font-semibold">{template.config.initialValidators || 3}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Block Time:</span>
                <span className="font-semibold">{template.config.blockTime}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gas Token:</span>
                <span className="font-semibold">{template.config.gasToken || 'POL'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-400" />
              Features
            </h3>
            <div className="space-y-2">
              {template.config.features && Object.entries(template.config.features).map(([key, value]: [string, any]) => (
                value && (
                  <div key={key} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4">Reviews</h3>
          
          {/* Submit Review */}
          <div className="mb-6 p-4 bg-white/5 rounded-xl">
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-2xl"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Your Review (Optional)</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this template..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none resize-none"
                rows={3}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmitReview}
              disabled={submittingReview || rating === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </motion.button>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.review && (
                    <p className="text-gray-300">{review.review}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}


