'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Star, 
  Rocket, 
  TrendingUp, 
  Sparkles,
  Gamepad2,
  Coins,
  Image as ImageIcon,
  Building2,
  Users,
  CheckCircle2,
  ExternalLink,
  Zap
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

const categoryIcons: Record<string, any> = {
  gaming: Gamepad2,
  defi: Coins,
  nft: ImageIcon,
  enterprise: Building2,
  general: Rocket,
  privacy: Zap
}

const categoryColors: Record<string, string> = {
  gaming: 'from-purple-500 to-pink-500',
  defi: 'from-blue-500 to-cyan-500',
  nft: 'from-pink-500 to-rose-500',
  enterprise: 'from-indigo-500 to-purple-500',
  general: 'from-primary-500 to-accent-pink',
  privacy: 'from-green-500 to-emerald-500'
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filterOfficial, setFilterOfficial] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState('recommended')

  useEffect(() => {
    loadTemplates()
  }, [selectedCategory, filterOfficial, searchQuery, sortBy])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (selectedCategory !== 'all') params.category = selectedCategory
      if (filterOfficial !== null) params.isOfficial = filterOfficial
      if (searchQuery) params.search = searchQuery
      
      const response = await apiClient.templates.getAll(params)
      setTemplates(response.data.templates || [])
    } catch (error: any) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async (template: Template) => {
    router.push(`/dashboard/templates/${template.id}/deploy`)
  }

  const categories = ['all', 'gaming', 'defi', 'nft', 'enterprise', 'general', 'privacy']

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-400 to-accent-pink bg-clip-text text-transparent">
              Chain Templates Marketplace
            </h1>
            <p className="text-gray-400">
              Deploy pre-configured chains optimized for your use case
            </p>
          </div>
          <Link href="/dashboard/templates/create">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple hover:shadow-glow-lg transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Submit Template
            </motion.button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 focus:border-primary-500/30 focus:bg-white/10 text-sm transition-all outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                    ${selectedCategory === category
                      ? 'bg-gradient-to-r from-primary-500 to-accent-pink text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => setFilterOfficial(filterOfficial === true ? null : true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterOfficial === true
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Official Only
            </button>
            <button
              onClick={() => setFilterOfficial(filterOfficial === false ? null : false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterOfficial === false
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Community
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-32 bg-white/5 rounded-xl mb-4" />
                <div className="h-4 bg-white/5 rounded mb-2" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">No templates found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
            <Link href="/dashboard/templates/create">
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold">
                Create First Template
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => {
              const CategoryIcon = categoryIcons[template.category] || Rocket
              const categoryColor = categoryColors[template.category] || 'from-primary-500 to-accent-pink'
              
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="glass-card p-6 group cursor-pointer"
                  onClick={() => router.push(`/dashboard/templates/${template.id}`)}
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColor} flex items-center justify-center text-2xl shadow-glow`}>
                      {template.icon || <CategoryIcon className="w-7 h-7 text-white" />}
                    </div>
                    <div className="flex items-center gap-2">
                      {template.recommended && (
                        <span className="px-2 py-1 rounded-lg bg-primary-500/20 text-primary-300 text-xs font-semibold border border-primary-500/30">
                          Recommended
                        </span>
                      )}
                      {template.isOfficial && (
                        <CheckCircle2 className="w-5 h-5 text-primary-400" />
                      )}
                    </div>
                  </div>

                  {/* Template Info */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-gradient transition-all">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{(template.stats?.rating || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>{template.stats?.deployments || 0} deployments</span>
                    </div>
                    {template.isCommunity && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>Community</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-lg bg-white/5 text-xs text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeploy(template)
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple hover:shadow-glow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Rocket className="w-4 h-4" />
                      Deploy
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/templates/${template.id}`)
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


