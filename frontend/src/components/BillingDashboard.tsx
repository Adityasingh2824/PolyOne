'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard,
  Receipt,
  TrendingUp,
  Check,
  X,
  ChevronDown,
  Download,
  Calendar,
  AlertCircle,
  Crown,
  Zap,
  Building2,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  DollarSign,
  FileText,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

// Types
interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  priceMonthly: number
  priceYearly: number
  maxChains: number
  maxValidators: number
  maxTps: number
  maxStorage: number
  maxBandwidth: number
  maxTeamMembers: number
  bridgeEnabled: boolean
  analyticsEnabled: boolean
  prioritySupport: boolean
  features: string[]
  popular?: boolean
}

interface Subscription {
  id: string
  plan: SubscriptionPlan
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'
  billingCycle: 'monthly' | 'yearly'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEnd?: Date
  canceledAt?: Date
  usage: {
    chains: number
    storage: number
    bandwidth: number
    apiCalls: number
  }
}

interface Invoice {
  id: string
  number: string
  status: 'paid' | 'open' | 'void'
  amount: number
  periodStart: Date
  periodEnd: Date
  paidAt?: Date
  dueDate: Date
  pdfUrl?: string
}

interface PaymentMethod {
  id: string
  type: 'card' | 'crypto'
  brand?: string
  last4?: string
  expMonth?: number
  expYear?: number
  cryptoAddress?: string
  cryptoNetwork?: string
  isDefault: boolean
}

// Mock data
const PLANS: SubscriptionPlan[] = [
  {
    id: '1',
    name: 'Free',
    slug: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    maxChains: 1,
    maxValidators: 3,
    maxTps: 100,
    maxStorage: 5,
    maxBandwidth: 50,
    maxTeamMembers: 1,
    bridgeEnabled: false,
    analyticsEnabled: false,
    prioritySupport: false,
    features: ['1 App Chain', '3 Validators', 'Community Support', 'Basic Dashboard'],
  },
  {
    id: '2',
    name: 'Starter',
    slug: 'starter',
    priceMonthly: 49,
    priceYearly: 490,
    maxChains: 3,
    maxValidators: 5,
    maxTps: 500,
    maxStorage: 25,
    maxBandwidth: 250,
    maxTeamMembers: 3,
    bridgeEnabled: true,
    analyticsEnabled: true,
    prioritySupport: false,
    features: ['3 App Chains', '5 Validators/Chain', 'Bridge Access', 'Basic Analytics', 'Email Support'],
    popular: true,
  },
  {
    id: '3',
    name: 'Professional',
    slug: 'professional',
    priceMonthly: 199,
    priceYearly: 1990,
    maxChains: 10,
    maxValidators: 10,
    maxTps: 2000,
    maxStorage: 100,
    maxBandwidth: 1000,
    maxTeamMembers: 10,
    bridgeEnabled: true,
    analyticsEnabled: true,
    prioritySupport: true,
    features: ['10 App Chains', '10 Validators/Chain', 'Advanced Analytics', 'Priority Support', '99.9% SLA', 'Custom Domain'],
  },
  {
    id: '4',
    name: 'Enterprise',
    slug: 'enterprise',
    priceMonthly: 999,
    priceYearly: 9990,
    maxChains: -1,
    maxValidators: 25,
    maxTps: 10000,
    maxStorage: 500,
    maxBandwidth: 5000,
    maxTeamMembers: -1,
    bridgeEnabled: true,
    analyticsEnabled: true,
    prioritySupport: true,
    features: ['Unlimited Chains', '25 Validators/Chain', 'Dedicated Support', 'Custom SLA', 'On-premise Option', 'White-label'],
  },
]

const MOCK_SUBSCRIPTION: Subscription = {
  id: '1',
  plan: PLANS[1],
  status: 'active',
  billingCycle: 'monthly',
  currentPeriodStart: new Date('2024-11-01'),
  currentPeriodEnd: new Date('2024-12-01'),
  usage: {
    chains: 2,
    storage: 15,
    bandwidth: 120,
    apiCalls: 8500,
  },
}

const MOCK_INVOICES: Invoice[] = [
  { id: '1', number: 'INV-2024-001', status: 'paid', amount: 49, periodStart: new Date('2024-11-01'), periodEnd: new Date('2024-12-01'), paidAt: new Date('2024-11-01'), dueDate: new Date('2024-11-01') },
  { id: '2', number: 'INV-2024-002', status: 'paid', amount: 49, periodStart: new Date('2024-10-01'), periodEnd: new Date('2024-11-01'), paidAt: new Date('2024-10-01'), dueDate: new Date('2024-10-01') },
  { id: '3', number: 'INV-2024-003', status: 'paid', amount: 49, periodStart: new Date('2024-09-01'), periodEnd: new Date('2024-10-01'), paidAt: new Date('2024-09-01'), dueDate: new Date('2024-09-01') },
]

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: '1', type: 'card', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2025, isDefault: true },
  { id: '2', type: 'card', brand: 'mastercard', last4: '8888', expMonth: 6, expYear: 2026, isDefault: false },
]

type ActiveTab = 'overview' | 'plans' | 'invoices' | 'payment'

export default function BillingDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [subscription, setSubscription] = useState<Subscription | null>(MOCK_SUBSCRIPTION)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS)

  // Calculate usage percentages
  const usagePercentages = subscription ? {
    chains: (subscription.usage.chains / subscription.plan.maxChains) * 100,
    storage: (subscription.usage.storage / subscription.plan.maxStorage) * 100,
    bandwidth: (subscription.usage.bandwidth / subscription.plan.maxBandwidth) * 100,
    apiCalls: (subscription.usage.apiCalls / (subscription.plan.maxTeamMembers * 10000)) * 100,
  } : null

  // Handle plan upgrade
  const handleUpgrade = async (plan: SubscriptionPlan) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSubscription(prev => prev ? { ...prev, plan } : null)
      setShowUpgradeModal(false)
      toast.success(`Upgraded to ${plan.name} plan!`)
    } catch (error) {
      toast.error('Failed to upgrade plan')
    }
  }

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubscription(prev => prev ? { ...prev, status: 'canceled', canceledAt: new Date() } : null)
      toast.success('Subscription canceled')
    } catch (error) {
      toast.error('Failed to cancel subscription')
    }
  }

  // Handle remove payment method
  const handleRemovePaymentMethod = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id))
      toast.success('Payment method removed')
    } catch (error) {
      toast.error('Failed to remove payment method')
    }
  }

  // Handle set default payment method
  const handleSetDefaultPaymentMethod = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setPaymentMethods(prev => prev.map(pm => ({ ...pm, isDefault: pm.id === id })))
      toast.success('Default payment method updated')
    } catch (error) {
      toast.error('Failed to update payment method')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'trialing': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'past_due': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'canceled': return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
      case 'paused': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'paid': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'open': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'void': return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            Billing & Subscription
          </h1>
          <p className="text-gray-400 mt-1">Manage your subscription and billing details</p>
        </div>

        {subscription && subscription.status !== 'canceled' && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-pink rounded-xl font-medium text-white"
          >
            <Sparkles className="w-5 h-5" />
            Upgrade Plan
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-dark-400/50 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'plans', label: 'Plans', icon: Crown },
          { id: 'invoices', label: 'Invoices', icon: Receipt },
          { id: 'payment', label: 'Payment Methods', icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Current Plan Card */}
            {subscription && (
              <div className="glass rounded-2xl p-6 border border-white/5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-white">{subscription.plan.name} Plan</h2>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(subscription.status)}`}>
                          {subscription.status}
                        </span>
                      </div>
                      <p className="text-gray-400 mt-1">
                        ${subscription.billingCycle === 'monthly' ? subscription.plan.priceMonthly : subscription.plan.priceYearly}
                        /{subscription.billingCycle === 'monthly' ? 'month' : 'year'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col lg:items-end gap-2">
                    <div className="text-sm text-gray-400">
                      Next billing date: {subscription.currentPeriodEnd.toLocaleDateString()}
                    </div>
                    {subscription.status === 'active' && (
                      <button
                        onClick={handleCancelSubscription}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        Cancel subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Usage Stats */}
            {subscription && usagePercentages && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <UsageCard
                  title="Chains Used"
                  value={subscription.usage.chains}
                  max={subscription.plan.maxChains}
                  percentage={usagePercentages.chains}
                  icon={Zap}
                />
                <UsageCard
                  title="Storage Used"
                  value={subscription.usage.storage}
                  max={subscription.plan.maxStorage}
                  unit="GB"
                  percentage={usagePercentages.storage}
                  icon={Building2}
                />
                <UsageCard
                  title="Bandwidth Used"
                  value={subscription.usage.bandwidth}
                  max={subscription.plan.maxBandwidth}
                  unit="GB"
                  percentage={usagePercentages.bandwidth}
                  icon={TrendingUp}
                />
                <UsageCard
                  title="API Calls"
                  value={subscription.usage.apiCalls}
                  max={subscription.plan.maxTeamMembers * 10000}
                  percentage={usagePercentages.apiCalls}
                  icon={Zap}
                />
              </div>
            )}

            {/* Recent Invoices */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Invoices</h3>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_INVOICES.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-dark-400/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{invoice.number}</div>
                        <div className="text-sm text-gray-400">
                          {invoice.periodStart.toLocaleDateString()} - {invoice.periodEnd.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                      <span className="font-medium text-white">${invoice.amount}</span>
                      <button className="p-2 rounded-lg hover:bg-dark-300 transition-colors">
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center">
              <div className="flex items-center gap-3 p-1 bg-dark-400/50 rounded-xl">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    billingCycle === 'yearly'
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-xs text-green-400">Save 17%</span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLANS.map((plan) => {
                const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly
                const isCurrentPlan = subscription?.plan.id === plan.id
                
                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ y: -5 }}
                    className={`glass rounded-2xl p-6 border ${
                      plan.popular 
                        ? 'border-primary-500/50 ring-2 ring-primary-500/20' 
                        : 'border-white/5'
                    } relative`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-primary-500 to-accent-pink rounded-full text-xs font-medium text-white">
                        Most Popular
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-white">
                          ${price}
                        </span>
                        <span className="text-gray-400">
                          /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(plan)}
                      disabled={isCurrentPlan}
                      className={`w-full py-3 rounded-xl font-medium transition-all ${
                        isCurrentPlan
                          ? 'bg-dark-400 text-gray-500 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-gradient-to-r from-primary-500 to-accent-pink text-white hover:opacity-90'
                          : 'bg-dark-400 text-white hover:bg-dark-300'
                      }`}
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <motion.div
            key="invoices"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 border border-white/5"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Invoice History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-white/5">
                    <th className="pb-3 font-medium">Invoice</th>
                    <th className="pb-3 font-medium">Period</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Paid Date</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_INVOICES.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-white/5">
                      <td className="py-4">
                        <span className="font-medium text-white">{invoice.number}</span>
                      </td>
                      <td className="py-4 text-gray-400">
                        {invoice.periodStart.toLocaleDateString()} - {invoice.periodEnd.toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <span className="text-white font-medium">${invoice.amount}</span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">
                        {invoice.paidAt?.toLocaleDateString() || '-'}
                      </td>
                      <td className="py-4">
                        <button className="p-2 rounded-lg hover:bg-dark-300 transition-colors">
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
                <button
                  onClick={() => setShowAddCardModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 rounded-xl font-medium text-white hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Payment Method
                </button>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 bg-dark-400/30 rounded-xl border ${
                      method.isDefault ? 'border-primary-500/30' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-dark-400 flex items-center justify-center">
                          {method.type === 'card' ? (
                            <CreditCard className="w-6 h-6 text-gray-400" />
                          ) : (
                            <DollarSign className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          {method.type === 'card' ? (
                            <>
                              <div className="font-medium text-white capitalize">
                                {method.brand} •••• {method.last4}
                              </div>
                              <div className="text-sm text-gray-400">
                                Expires {method.expMonth}/{method.expYear}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-white">
                                Crypto Wallet
                              </div>
                              <div className="text-sm text-gray-400">
                                {method.cryptoAddress?.slice(0, 10)}...{method.cryptoAddress?.slice(-6)}
                              </div>
                            </>
                          )}
                        </div>
                        {method.isDefault && (
                          <span className="px-2 py-0.5 bg-primary-500/20 rounded-full text-xs font-medium text-primary-400">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
                          <button
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleRemovePaymentMethod(method.id)}
                          className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Address */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Billing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
                  <select className="w-full p-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white">
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Germany</option>
                    <option>France</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">ZIP / Postal Code</label>
                  <input
                    type="text"
                    placeholder="10001"
                    className="w-full p-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white placeholder-gray-500"
                  />
                </div>
              </div>
              <button className="mt-4 px-4 py-2 bg-primary-500 rounded-xl font-medium text-white hover:bg-primary-600 transition-colors">
                Update Address
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddCardModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 border border-white/10 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-white mb-4">Add Payment Method</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Card Number</label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    className="w-full p-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white placeholder-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full p-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">CVC</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full p-3 bg-dark-400/50 rounded-xl border border-white/5 focus:border-primary-500/50 focus:outline-none text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddCardModal(false)}
                    className="flex-1 py-3 bg-dark-400 rounded-xl font-medium text-gray-300 hover:bg-dark-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Payment method added')
                      setShowAddCardModal(false)
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-accent-pink rounded-xl font-medium text-white"
                  >
                    Add Card
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Usage Card Component
function UsageCard({
  title,
  value,
  max,
  unit = '',
  percentage,
  icon: Icon
}: {
  title: string
  value: number
  max: number
  unit?: string
  percentage: number
  icon: any
}) {
  const getColor = () => {
    if (percentage >= 90) return 'from-red-500 to-red-600'
    if (percentage >= 70) return 'from-yellow-500 to-yellow-600'
    return 'from-primary-500 to-accent-pink'
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-dark-400">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <span className="text-sm text-gray-400">
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {value}{unit} <span className="text-gray-400 text-base font-normal">/ {max === -1 ? '∞' : max}{unit}</span>
      </div>
      <div className="text-sm text-gray-400 mb-3">{title}</div>
      <div className="w-full h-2 bg-dark-500 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}


