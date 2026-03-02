'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { useWhiteLabel } from '@/components/WhiteLabelProvider';
import { Eye, EyeOff, Upload, Check } from 'lucide-react';

interface WhiteLabelSettings {
  branding: {
    logo: string | null;
    favicon: string | null;
    companyName: string | null;
    supportEmail: string | null;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  domain: string | null;
  termsOfService: string | null;
  customCss: string | null;
}

export default function WhiteLabelSettingsPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { refresh } = useWhiteLabel();
  const [formData, setFormData] = useState<WhiteLabelSettings>({
    branding: {
      logo: null,
      favicon: null,
      companyName: null,
      supportEmail: null,
    },
    colors: {
      primary: '#a855f7',
      secondary: '#ec4899',
      accent: '#06b6d4',
      background: '#030014',
    },
    domain: null,
    termsOfService: null,
    customCss: null,
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await apiClient.organizations.getAll();
      const orgs = response.data.organizations;
      if (orgs && orgs.length > 0) {
        setOrgId(orgs[0].id);
        loadSettings(orgs[0].id);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      toast.error('Failed to load organizations');
      setLoading(false);
    }
  };

  const loadSettings = async (id: string) => {
    try {
      const response = await apiClient.whitelabel.getSettings(id);
      const loadedSettings = response.data.settings;
      setSettings(loadedSettings);
      setFormData(loadedSettings);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load white-label settings');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!orgId) {
      toast.error('Please select an organization');
      return;
    }

    setSaving(true);
    try {
      // Convert null to undefined for API compatibility
      const apiData = {
        branding: {
          logo: formData.branding.logo ?? undefined,
          favicon: formData.branding.favicon ?? undefined,
          companyName: formData.branding.companyName ?? undefined,
          supportEmail: formData.branding.supportEmail ?? undefined,
        },
        colors: formData.colors,
        domain: formData.domain ?? undefined,
        termsOfService: formData.termsOfService ?? undefined,
        customCss: formData.customCss ?? undefined,
      };
      await apiClient.whitelabel.updateSettings(orgId, apiData);
      toast.success('White-label settings saved successfully');
      await loadSettings(orgId);
      await refresh(); // Refresh white-label provider
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Apply preview styles
  useEffect(() => {
    if (showPreview) {
      const root = document.documentElement;
      root.style.setProperty('--color-accent-primary', formData.colors.primary);
      root.style.setProperty('--color-accent-secondary', formData.colors.secondary);
      root.style.setProperty('--color-accent-tertiary', formData.colors.accent);
      root.style.setProperty('--color-bg-primary', formData.colors.background);
      
      return () => {
        // Reset on unmount
        root.style.removeProperty('--color-accent-primary');
        root.style.removeProperty('--color-accent-secondary');
        root.style.removeProperty('--color-accent-tertiary');
        root.style.removeProperty('--color-bg-primary');
      };
    }
  }, [showPreview, formData.colors]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="min-h-screen bg-[#030014] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">No Organization Found</h1>
            <p className="text-gray-400 mb-6">Please create an organization first to configure white-label settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030014] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">White-Label Settings</h1>
            <p className="text-gray-400">Customize your branding, colors, and domain</p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Branding Section */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Branding</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.branding.companyName || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    branding: { ...formData.branding, companyName: e.target.value }
                  })}
                  className="input"
                  placeholder="Your Company Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
                <div className="flex gap-4">
                  <input
                    type="url"
                    value={formData.branding.logo || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      branding: { ...formData.branding, logo: e.target.value }
                    })}
                    className="input flex-1"
                    placeholder="https://example.com/logo.png"
                  />
                  {formData.branding.logo && (
                    <div className="w-20 h-20 rounded-lg bg-white/5 p-2 flex items-center justify-center border border-white/10">
                      <img 
                        src={formData.branding.logo} 
                        alt="Logo preview" 
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Favicon URL</label>
                <div className="flex gap-4">
                  <input
                    type="url"
                    value={formData.branding.favicon || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      branding: { ...formData.branding, favicon: e.target.value }
                    })}
                    className="input flex-1"
                    placeholder="https://example.com/favicon.ico"
                  />
                  {formData.branding.favicon && (
                    <div className="w-16 h-16 rounded-lg bg-white/5 p-2 flex items-center justify-center border border-white/10">
                      <img 
                        src={formData.branding.favicon} 
                        alt="Favicon preview" 
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Support Email</label>
                <input
                  type="email"
                  value={formData.branding.supportEmail || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    branding: { ...formData.branding, supportEmail: e.target.value }
                  })}
                  className="input"
                  placeholder="support@example.com"
                />
              </div>
            </div>
          </div>

          {/* Color Scheme Section */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Color Scheme</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.colors.primary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, primary: e.target.value }
                    })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.colors.primary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, primary: e.target.value }
                    })}
                    className="input flex-1"
                    placeholder="#a855f7"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.colors.secondary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, secondary: e.target.value }
                    })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.colors.secondary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, secondary: e.target.value }
                    })}
                    className="input flex-1"
                    placeholder="#ec4899"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.colors.accent}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, accent: e.target.value }
                    })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.colors.accent}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, accent: e.target.value }
                    })}
                    className="input flex-1"
                    placeholder="#06b6d4"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.colors.background}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, background: e.target.value }
                    })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.colors.background}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, background: e.target.value }
                    })}
                    className="input flex-1"
                    placeholder="#030014"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Domain Section */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Custom Domain</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Custom Domain</label>
              <input
                type="text"
                value={formData.domain || ''}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="input"
                placeholder="app.example.com"
              />
              <p className="text-xs text-gray-400 mt-2">
                Configure your DNS to point this domain to our servers
              </p>
            </div>
          </div>

          {/* Terms of Service Section */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Terms of Service</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Terms of Service URL</label>
              <input
                type="url"
                value={formData.termsOfService || ''}
                onChange={(e) => setFormData({ ...formData, termsOfService: e.target.value })}
                className="input"
                placeholder="https://example.com/terms"
              />
            </div>
          </div>

          {/* Custom CSS Section */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Custom CSS</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Custom CSS</label>
              <textarea
                value={formData.customCss || ''}
                onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
                className="input font-mono text-sm"
                rows={10}
                placeholder="/* Your custom CSS here */"
              />
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="glass-card p-6 border-2 border-primary-500/30">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    {formData.branding.logo ? (
                      <img src={formData.branding.logo} alt="Logo" className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-pink" />
                    )}
                    <div>
                      <div className="font-semibold text-white">
                        {formData.branding.companyName || 'Your Company'}
                      </div>
                      <div className="text-xs text-gray-400">Dashboard</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div 
                      className="flex-1 h-12 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ background: `linear-gradient(135deg, ${formData.colors.primary} 0%, ${formData.colors.secondary} 100%)` }}
                    >
                      Primary Button
                    </div>
                    <div 
                      className="flex-1 h-12 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: formData.colors.accent }}
                    >
                      Accent Button
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Colors and branding will be applied across the entire application
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}






















