import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
  appName: string;
  appLogo: string;
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  heroBadgeText: string;
}

const defaultSettings: AppSettings = {
  appName: 'BrandForge',
  appLogo: '',
  heroTitle: 'Create stunning',
  heroHighlight: 'brand guides',
  heroDescription: 'Design, organize, and share comprehensive brand identity systems. From colors to typography, logos to guidelines — all in one place.',
  heroBadgeText: 'Brand Identity Platform',
};

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'brandforge-app-settings';

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading app settings:', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
