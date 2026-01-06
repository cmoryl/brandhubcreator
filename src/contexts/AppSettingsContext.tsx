import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ThemeColors {
  accent: string;
  accentForeground: string;
  primary: string;
  primaryForeground: string;
}

export type HeroBackgroundType = 
  | 'gradient' 
  | 'image' 
  | 'animated-gradient' 
  | 'animated-particles'
  | 'animated-waves'
  | 'animated-mesh'
  | 'animated-aurora'
  | 'animated-geometric'
  | 'animated-spotlight'
  | 'animated-mesh-waves';

export interface HeroBackground {
  type: HeroBackgroundType;
  image: string;
  gradientFrom: string;
  gradientTo: string;
  animationSpeed: 'slow' | 'medium' | 'fast';
  overlay: boolean;
  overlayOpacity: number;
}

export interface PageSectionVisibility {
  features: boolean;
  howItWorks: boolean;
  faqPreview: boolean;
  videoTutorials: boolean;
}

export interface AppSettings {
  appName: string;
  appLogo: string;
  appLogoLight: string;  // Logo for light mode
  appLogoDark: string;   // Logo for dark mode
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  heroBadgeText: string;
  colors: ThemeColors;
  heroBackground: HeroBackground;
  pageSections: PageSectionVisibility;
}

const defaultColors: ThemeColors = {
  accent: '12 76% 61%', // coral
  accentForeground: '0 0% 100%',
  primary: '220 15% 20%',
  primaryForeground: '40 20% 98%',
};

const defaultHeroBackground: HeroBackground = {
  type: 'gradient',
  image: '',
  gradientFrom: 'primary/5',
  gradientTo: 'background',
  animationSpeed: 'medium',
  overlay: true,
  overlayOpacity: 0.5,
};

const defaultPageSections: PageSectionVisibility = {
  features: true,
  howItWorks: true,
  faqPreview: true,
  videoTutorials: false, // Hidden by default until fine-tuned
};

const defaultSettings: AppSettings = {
  appName: 'BrandHub',
  appLogo: '',
  appLogoLight: '',
  appLogoDark: '',
  heroTitle: 'Create stunning',
  heroHighlight: 'brand guides',
  heroDescription: 'Design, organize, and share comprehensive brand identity systems. From colors to typography, logos to guidelines — all in one place.',
  heroBadgeText: 'Brand Identity Platform',
  colors: defaultColors,
  heroBackground: defaultHeroBackground,
  pageSections: defaultPageSections,
};

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetColors: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'brandhub-app-settings';

// Convert hex to HSL
const hexToHSL = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Convert HSL string to hex
const hslToHex = (hsl: string): string => {
  const parts = hsl.match(/(\d+\.?\d*)/g);
  if (!parts || parts.length < 3) return '#000000';
  
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Apply colors to CSS variables
const applyColors = (colors: ThemeColors) => {
  const root = document.documentElement;
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentForeground);
  root.style.setProperty('--ring', colors.accent);
  root.style.setProperty('--accent-coral', colors.accent);
};

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { 
          ...defaultSettings, 
          ...parsed, 
          colors: { ...defaultColors, ...parsed.colors },
          heroBackground: { ...defaultHeroBackground, ...parsed.heroBackground },
          pageSections: { ...defaultPageSections, ...parsed.pageSections }
        };
      }
    } catch (e) {
      console.error('Error loading app settings:', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applyColors(settings.colors);
  }, [settings]);

  // Apply colors on mount
  useEffect(() => {
    applyColors(settings.colors);
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetColors = () => {
    setSettings(prev => ({ ...prev, colors: defaultColors }));
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, resetColors }}>
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

export { hexToHSL, hslToHex };
