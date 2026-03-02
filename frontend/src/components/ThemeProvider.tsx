'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  updateColors: (colors: Partial<ThemeColors>) => void;
  applyTheme: () => void;
}

const defaultColors: ThemeColors = {
  primary: '#a855f7',
  secondary: '#ec4899',
  accent: '#06b6d4',
  background: '#030014',
};

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultColors,
  updateColors: () => {},
  applyTheme: () => {},
});

export function ThemeProvider({ children, orgId }: { children: ReactNode; orgId?: string | null }) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);

  useEffect(() => {
    if (orgId) {
      loadTheme(orgId);
    } else {
      // Try to load from domain
      loadThemeFromDomain();
    }
  }, [orgId]);

  const loadTheme = async (id: string) => {
    try {
      const response = await apiClient.whitelabel.getSettings(id);
      const settings = response.data.settings;
      if (settings?.colors) {
        setColors(settings.colors);
        applyThemeToDocument(settings.colors);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const loadThemeFromDomain = async () => {
    try {
      const host = window.location.host;
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        const response = await apiClient.whitelabel.getByDomain(host);
        const settings = response.data.settings;
        if (settings?.colors) {
          setColors(settings.colors);
          applyThemeToDocument(settings.colors);
        }
      }
    } catch (error) {
      // Domain not found or not configured, use defaults
      applyThemeToDocument(defaultColors);
    }
  };

  const applyThemeToDocument = (themeColors: ThemeColors) => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent-primary', themeColors.primary);
    root.style.setProperty('--color-accent-secondary', themeColors.secondary);
    root.style.setProperty('--color-accent-tertiary', themeColors.accent);
    root.style.setProperty('--color-bg-primary', themeColors.background);
    
    // Update gradients
    root.style.setProperty('--gradient-primary', 
      `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 50%, ${themeColors.accent} 100%)`);
    root.style.setProperty('--gradient-secondary', 
      `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`);
  };

  const updateColors = (newColors: Partial<ThemeColors>) => {
    const updated = { ...colors, ...newColors };
    setColors(updated);
    applyThemeToDocument(updated);
  };

  const applyTheme = () => {
    applyThemeToDocument(colors);
  };

  // Apply theme on mount
  useEffect(() => {
    applyThemeToDocument(colors);
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, updateColors, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}






















