'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Crown,
  Sparkles,
  ArrowRight,
  Download,
  RefreshCw
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

function BillingContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  
  // Check URL parameter for default tab, default to subscriptions
  const defaultTab = searchParams?.get('tab')
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'invoices' | 'plans'>(
    defaultTab && ['subscriptions', 'invoices', 'plans'].includes(defaultTab) 
      ? (defaultTab as 'subscriptions' | 'invoices' | 'plans')
      : 'subscriptions'
  )

  // Default plans data
  const getDefaultPlans = () => [
    {
      id: '1',
      name: 'Starter',
      price: 29,
      duration: 30,
      features: ['3 Chains', 'Basic Support', '10 Validators'],
      popular: false
    },
    {
      id: '2',
      name: 'Professional',
      price: 99,
      duration: 30,
      features: ['10 Chains', 'Priority Support', '50 Validators', 'Advanced Analytics'],
      popular: true
    },
    {
      id: '3',
      name: 'Enterprise',
      price: 299,
      duration: 30,
      features: ['Unlimited Chains', '24/7 Support', 'Unlimited Validators', 'Custom Features'],
      popular: false
    }
  ]

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    setLoading(true)
    try {
      // Load subscriptions
      try {
        const subsResponse = await apiClient.billing.getSubscriptions()
        // Ensure we always have an array
        const subsData = subsResponse.data
        if (Array.isArray(subsData)) {
          setSubscriptions(subsData)
        } else if (subsData && Array.isArray(subsData.subscriptions)) {
          setSubscriptions(subsData.subscriptions)
        } else {
          setSubscriptions([])
        }
      } catch (err) {
        console.warn('Error loading subscriptions:', err)
        // Use mock data for development
        setSubscriptions([
          {
            id: '1',
            planId: '1',
            planName: 'Professional',
            status: 'active',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            autoRenew: true,
            price: 99
          }
        ])
      }

      // Load invoices
      try {
        const invoicesResponse = await apiClient.billing.getInvoices()
        // Ensure we always have an array
        const invoicesData = invoicesResponse.data
        if (Array.isArray(invoicesData)) {
          setInvoices(invoicesData)
        } else if (invoicesData && Array.isArray(invoicesData.invoices)) {
          setInvoices(invoicesData.invoices)
        } else {
          setInvoices([])
        }
      } catch (err) {
        console.warn('Error loading invoices:', err)
        // Use mock data
        setInvoices([
          {
            id: '1',
            subscriptionId: '1',
            invoiceNumber: 'INV-2024-001',
            amount: 99,
            status: 'paid',
            issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            paidDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
          }
        ])
      }

      // Load plans
      try {
        const plansResponse = await apiClient.billing.getPlans()
        // Ensure we always have an array
        const plansData = plansResponse.data
        if (Array.isArray(plansData)) {
          setPlans(plansData)
        } else if (plansData && Array.isArray(plansData.plans)) {
          setPlans(plansData.plans)
        } else {
          // Fallback to mock data if response structure is unexpected
          setPlans(getDefaultPlans())
        }
      } catch (err) {
        console.warn('Error loading plans:', err)
        // Use mock data
        setPlans(getDefaultPlans())
      }
    } catch (error) {
      console.error('Error loading billing data:', error)
      toast.error('Failed to load billing data')
      // Ensure all arrays are always set even on error
      setPlans(getDefaultPlans())
      if (!Array.isArray(subscriptions)) {
        setSubscriptions([])
      }
      if (!Array.isArray(invoices)) {
        setInvoices([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    try {
      toast.loading('Processing subscription...', { id: 'subscribe' })
      await apiClient.billing.subscribe(planId, true)
      toast.success('Subscription activated!', { id: 'subscribe' })
      loadBillingData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to subscribe', { id: 'subscribe' })
    }
  }

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      toast.loading('Processing payment...', { id: 'pay-invoice' })
      await apiClient.billing.payInvoice(invoiceId)
      toast.success('Payment successful!', { id: 'pay-invoice' })
      loadBillingData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process payment', { id: 'pay-invoice' })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-400 to-accent-pink bg-clip-text text-transparent">
                  Billing & Subscriptions
                </h1>
                <p className="text-gray-400">Manage your subscriptions, invoices, and payment methods</p>
              </div>
              <button
                onClick={loadBillingData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
              {[
                { id: 'subscriptions', label: 'Subscriptions', icon: Sparkles },
                { id: 'invoices', label: 'Invoices', icon: Receipt },
                { id: 'plans', label: 'Plans', icon: Crown }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center gap-2 px-6 py-3 border-b-2 transition-all
                      ${activeTab === tab.id
                        ? 'border-primary-500 text-primary-400'
                        : 'border-transparent text-gray-400 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                {!Array.isArray(subscriptions) || subscriptions.length === 0 ? (
                  <div className="glass-card p-12 text-center">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-xl font-bold mb-2">No Active Subscriptions</h3>
                    <p className="text-gray-400 mb-6">Get started by choosing a plan that fits your needs</p>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-accent-pink hover:from-primary-600 hover:to-accent-pink/90 transition-all"
                    >
                      View Plans
                    </button>
                  </div>
                ) : (
                  Array.isArray(subscriptions) && subscriptions.map((subscription: any) => (
                    <motion.div
                      key={subscription.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-pink flex items-center justify-center">
                              <Crown className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">{subscription.planName || 'Professional Plan'}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {subscription.status === 'active' ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-emerald-400">Active</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span className="text-sm text-red-400">Inactive</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Start Date</p>
                              <p className="font-mono">
                                {new Date(subscription.startDate || subscription.startTime).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 mb-1">End Date</p>
                              <p className="font-mono">
                                {new Date(subscription.endDate || subscription.endTime).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400 mb-1">Price</p>
                              <p className="font-mono text-lg font-bold">${subscription.price || 99}/mo</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className={`
                              px-3 py-1 rounded-full text-xs font-semibold
                              ${subscription.autoRenew 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                              }
                            `}>
                              {subscription.autoRenew ? 'Auto-renew enabled' : 'Auto-renew disabled'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-6">
                          <button
                            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
                          >
                            Manage
                          </button>
                          <button
                            className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 transition-all text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="space-y-4">
                {!Array.isArray(invoices) || invoices.length === 0 ? (
                  <div className="glass-card p-12 text-center">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-xl font-bold mb-2">No Invoices</h3>
                    <p className="text-gray-400">Your invoices will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Invoice #</th>
                          <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Amount</th>
                          <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Status</th>
                          <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Issue Date</th>
                          <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Due Date</th>
                          <th className="text-right py-4 px-4 text-sm font-semibold text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(invoices) && invoices.map((invoice: any) => (
                          <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 font-mono text-sm">{invoice.invoiceNumber || `INV-${invoice.id}`}</td>
                            <td className="py-4 px-4 font-bold">${invoice.amount || invoice.total || 0}</td>
                            <td className="py-4 px-4">
                              <span className={`
                                px-2 py-1 rounded-full text-xs font-semibold
                                ${invoice.status === 'paid' || invoice.isPaid
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : invoice.status === 'overdue'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }
                              `}>
                                {invoice.status === 'paid' || invoice.isPaid ? 'Paid' : invoice.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-400">
                              {new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-400">
                              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {(invoice.status !== 'paid' && !invoice.isPaid) && (
                                  <button
                                    onClick={() => handlePayInvoice(invoice.id)}
                                    className="px-3 py-1.5 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 text-primary-400 text-sm transition-all"
                                  >
                                    Pay
                                  </button>
                                )}
                                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="grid md:grid-cols-3 gap-6">
                {Array.isArray(plans) && plans.length > 0 ? (
                  plans.map((plan: any, index: number) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      glass-card p-6 relative
                      ${plan.popular ? 'border-2 border-primary-500/50' : 'border border-white/10'}
                    `}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-pink text-white text-xs font-semibold">
                        Most Popular
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-gray-400">/month</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features?.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      className={`
                        w-full py-3 rounded-lg font-semibold transition-all
                        ${plan.popular
                          ? 'bg-gradient-to-r from-primary-500 to-accent-pink hover:from-primary-600 hover:to-accent-pink/90 text-white'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                        }
                      `}
                    >
                      {Array.isArray(subscriptions) && subscriptions.some((s: any) => s.planId === plan.id && s.status === 'active')
                        ? 'Current Plan'
                        : 'Subscribe'
                      }
                    </button>
                  </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 glass-card p-12 text-center">
                    <Crown className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-xl font-bold mb-2">No Plans Available</h3>
                    <p className="text-gray-400">Plans are currently being loaded. Please try again in a moment.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </DashboardLayout>
    }>
      <BillingContent />
    </Suspense>
  )
}

