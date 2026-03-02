'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface WhiteLabelBranding {
  logo: string | null;
  favicon: string | null;
  companyName: string | null;
  supportEmail: string | null;
}

interface WhiteLabelColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface WhiteLabelSettings {
  branding: WhiteLabelBranding;
  colors: WhiteLabelColors;
  domain: string | null;
  termsOfService: string | null;
  customCss: string | null;
}

interface WhiteLabelContextType {
  settings: WhiteLabelSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultSettings: WhiteLabelSettings = {
  branding: {
    logo: null,
    favicon: null,
    companyName: 'PolyOne',
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
};

const WhiteLabelContext = createContext<WhiteLabelContextType>({
  settings: defaultSettings,
  loading: false,
  refresh: async () => {},
});

export function WhiteLabelProvider({ 
  children, 
  orgId 
}: { 
  children: ReactNode; 
  orgId?: string | null;
}) {
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      let loadedSettings: WhiteLabelSettings | null = null;

      if (orgId) {
        // Load by organization ID
        const response = await apiClient.whitelabel.getSettings(orgId);
        loadedSettings = response.data.settings;
      } else {
        // Try to load by domain
        const host = typeof window !== 'undefined' ? window.location.host : '';
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          try {
            const response = await apiClient.whitelabel.getByDomain(host);
            loadedSettings = response.data.settings;
          } catch (error) {
            // Domain not found, use defaults
            console.log('No white-label settings found for domain:', host);
          }
        }
      }

      const finalSettings = loadedSettings || defaultSettings;
      setSettings(finalSettings);
      applyBranding(finalSettings);
    } catch (error) {
      console.error('Error loading white-label settings:', error);
      setSettings(defaultSettings);
      applyBranding(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const applyBranding = (settings: WhiteLabelSettings) => {
    // Apply favicon
    if (settings.branding.favicon) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = settings.branding.favicon;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = settings.branding.favicon;
        document.head.appendChild(newLink);
      }
    }

    // Apply custom CSS
    if (settings.customCss) {
      let styleElement = document.getElementById('white-label-custom-css');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'white-label-custom-css';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = settings.customCss;
    } else {
      // Remove custom CSS if it exists
      const styleElement = document.getElementById('white-label-custom-css');
      if (styleElement) {
        styleElement.remove();
      }
    }

    // Apply colors via CSS variables (ThemeProvider handles this, but we ensure it's set)
    const root = document.documentElement;
    root.style.setProperty('--color-accent-primary', settings.colors.primary);
    root.style.setProperty('--color-accent-secondary', settings.colors.secondary);
    root.style.setProperty('--color-accent-tertiary', settings.colors.accent);
    root.style.setProperty('--color-bg-primary', settings.colors.background);
    
    // Update gradients
    root.style.setProperty('--gradient-primary', 
      `linear-gradient(135deg, ${settings.colors.primary} 0%, ${settings.colors.secondary} 50%, ${settings.colors.accent} 100%)`);
    root.style.setProperty('--gradient-secondary', 
      `linear-gradient(135deg, ${settings.colors.primary} 0%, ${settings.colors.secondary} 100%)`);

    // Update page title if company name is set
    if (settings.branding.companyName && settings.branding.companyName !== 'PolyOne') {
      const title = document.querySelector('title');
      if (title && !title.textContent?.includes(settings.branding.companyName)) {
        // Only update if it's still the default
        const currentTitle = title.textContent || '';
        if (currentTitle.includes('PolyOne')) {
          title.textContent = currentTitle.replace('PolyOne', settings.branding.companyName);
        }
      }
    }
  };

  useEffect(() => {
    loadSettings();
  }, [orgId]);

  const refresh = async () => {
    setLoading(true);
    await loadSettings();
  };

  return (
    <WhiteLabelContext.Provider value={{ settings: settings || defaultSettings, loading, refresh }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  return useContext(WhiteLabelContext);
}






















