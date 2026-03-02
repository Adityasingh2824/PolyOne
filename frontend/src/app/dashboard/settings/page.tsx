'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Save,
  CheckCircle,
  Moon,
  Sun,
  Monitor,
  Key,
  Globe,
  Trash2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { useWallet } from '@/hooks/useWallet'

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button onClick={onChange} className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled ? 'bg-gradient-to-r from-primary-500 to-accent-pink shadow-glow-purple/30' : 'bg-white/15'}`}>
    <motion.div
      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
      animate={{ x: enabled ? 24 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </button>
)

export default function SettingsPage() {
  const { address, isConnected } = useWallet()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('account')
  const [settings, setSettings] = useState({
    notifications: { email: true, push: false, chainAlerts: true, updates: true, security: true },
    preferences: { theme: 'dark', language: 'en', timezone: 'UTC', currency: 'USD' },
    privacy: { showEmail: false, showAddress: true, analytics: true }
  })

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)) } catch {}
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    localStorage.setItem('userSettings', JSON.stringify(settings))
    setSaving(false)
    setSaved(true)
    toast.success('Settings saved successfully!')
    setTimeout(() => setSaved(false), 3000)
  }

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({ ...prev, [category]: { ...prev[category as keyof typeof prev], [key]: value } }))
  }

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied!') }

  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
              <SettingsIcon className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-semibold text-primary-300 uppercase tracking-wider">Settings</span>
            </motion.div>
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-2">
              Account <span className="text-gradient">Settings</span>
            </h1>
            <p className="text-gray-400">Manage your account, preferences, and security settings</p>
          </div>
          <motion.button
            onClick={handleSave}
            disabled={saving || saved}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-pink font-semibold text-sm shadow-glow-purple hover:shadow-glow-lg transition-all flex items-center gap-2 disabled:opacity-60 self-start"
          >
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : saving
              ? <><motion.div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /> Saving...</>
              : <><Save className="w-4 h-4" /> Save Changes</>
            }
          </motion.button>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Section Nav */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 sticky top-24">
              {sections.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeSection === sec.id
                      ? 'bg-gradient-to-r from-primary-500/15 to-accent-pink/10 text-white border border-primary-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <sec.icon className={`w-4 h-4 ${activeSection === sec.id ? 'text-primary-400' : ''}`} />
                  {sec.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account */}
            {activeSection === 'account' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="card-premium p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="w-5 h-5 text-primary-400" /> Profile</h2>
                  {isConnected && address && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Connected Wallet</div>
                          <div className="font-mono text-sm font-semibold">{address}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyToClipboard(address)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><Copy className="w-4 h-4 text-gray-400" /></button>
                          <a href={`https://amoy.polygonscan.com/address/${address}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><ExternalLink className="w-4 h-4 text-gray-400" /></a>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Display Name</label>
                      <input type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm" placeholder="Your display name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                      <input type="email" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm" placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Company / Organization</label>
                      <input type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm" placeholder="Acme Inc." />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="card-premium p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Bell className="w-5 h-5 text-primary-400" /> Notification Preferences</h2>
                  <div className="space-y-1">
                    {[
                      { key: 'email', label: 'Email Notifications', desc: 'Receive important updates via email' },
                      { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications for real-time alerts' },
                      { key: 'chainAlerts', label: 'Chain Alerts', desc: 'Get notified about chain status changes and incidents' },
                      { key: 'updates', label: 'Product Updates', desc: 'New features, improvements, and announcements' },
                      { key: 'security', label: 'Security Alerts', desc: 'Critical security notifications and advisories' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors">
                        <div>
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-gray-500">{item.desc}</div>
                        </div>
                        <Toggle
                          enabled={settings.notifications[item.key as keyof typeof settings.notifications]}
                          onChange={() => updateSetting('notifications', item.key, !settings.notifications[item.key as keyof typeof settings.notifications])}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Preferences */}
            {activeSection === 'preferences' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="card-premium p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Palette className="w-5 h-5 text-primary-400" /> Appearance & Locale</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-300">Theme</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', icon: Sun, label: 'Light' },
                          { value: 'dark', icon: Moon, label: 'Dark' },
                          { value: 'system', icon: Monitor, label: 'System' }
                        ].map(({ value, icon: Icon, label }) => (
                          <button key={value} onClick={() => updateSetting('preferences', 'theme', value)}
                            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                              settings.preferences.theme === value
                                ? 'border-primary-500/50 bg-primary-500/10 shadow-glow-purple/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${settings.preferences.theme === value ? 'text-primary-400' : 'text-gray-400'}`} />
                            <span className="text-sm font-medium">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { key: 'language', label: 'Language', options: [['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['zh', 'Chinese'], ['ja', 'Japanese']] },
                        { key: 'timezone', label: 'Timezone', options: [['UTC', 'UTC'], ['America/New_York', 'Eastern'], ['America/Los_Angeles', 'Pacific'], ['Europe/London', 'London'], ['Asia/Tokyo', 'Tokyo']] },
                        { key: 'currency', label: 'Currency', options: [['USD', 'USD ($)'], ['EUR', 'EUR (€)'], ['GBP', 'GBP (£)'], ['JPY', 'JPY (¥)']] },
                      ].map(field => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium mb-2 text-gray-300">{field.label}</label>
                          <select
                            value={settings.preferences[field.key as keyof typeof settings.preferences]}
                            onChange={(e) => updateSetting('preferences', field.key, e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-primary-500/50 text-sm transition-all"
                          >
                            {field.options.map(([val, label]) => (
                              <option key={val} value={val} style={{ background: '#120726' }}>{label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="card-premium p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="w-5 h-5 text-primary-400" /> Privacy & Security</h2>
                  <div className="space-y-1">
                    {[
                      { key: 'showEmail', label: 'Public Email', desc: 'Display your email address on your public profile' },
                      { key: 'showAddress', label: 'Public Wallet Address', desc: 'Show your connected wallet address publicly' },
                      { key: 'analytics', label: 'Usage Analytics', desc: 'Help us improve PolyOne by sharing anonymous usage data' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors">
                        <div>
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-gray-500">{item.desc}</div>
                        </div>
                        <Toggle
                          enabled={settings.privacy[item.key as keyof typeof settings.privacy]}
                          onChange={() => updateSetting('privacy', item.key, !settings.privacy[item.key as keyof typeof settings.privacy])}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-premium p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-primary-400" /> API Keys</h3>
                  <p className="text-sm text-gray-400 mb-4">Manage API keys for programmatic access to your chains and data.</p>
                  <button className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary-500/30 text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2">
                    <Key className="w-4 h-4" /> Generate New API Key
                  </button>
                </div>
              </motion.div>
            )}

            {/* Danger Zone */}
            {activeSection === 'danger' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                  <h2 className="text-xl font-bold mb-2 text-red-400 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h2>
                  <p className="text-sm text-gray-400 mb-6">These actions are destructive and cannot be undone.</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <div className="font-medium text-sm">Clear Local Data</div>
                        <div className="text-xs text-gray-500">Remove all locally stored chains, settings, and cached data</div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure? This will remove all locally stored data and cannot be undone.')) {
                            localStorage.clear()
                            toast.success('Local data cleared')
                            window.location.reload()
                          }
                        }}
                        className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Clear Data
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <div className="font-medium text-sm">Delete Account</div>
                        <div className="text-xs text-gray-500">Permanently delete your PolyOne account and all associated data</div>
                      </div>
                      <button className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
