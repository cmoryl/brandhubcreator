// PDF Export Types & Shared Interfaces

import { SectionId } from '@/types/brand';
import { PdfTheme, PaperSize, PdfQuality } from '@/lib/exportPdf';
import { PdfLayoutPreset, CoverPageConfig } from '@/lib/pdfPresets';

export interface PdfExportSettings {
  theme: PdfTheme;
  paperSize: PaperSize;
  quality: PdfQuality;
  layoutPreset: PdfLayoutPreset;
  coverConfig: CoverPageConfig;
  includeToc: boolean;
  selectedSections: Set<SectionId>;
}

export interface BrandIntelligenceData {
  brand_summary: string | null;
  market_position: string | null;
  target_audience: {
    primary: string;
    secondary: string[];
    demographics: string[];
  } | null;
  competitive_advantages: string[];
  brand_voice_profile: {
    tone: string[];
    personality: string[];
    communication_style: string;
  } | null;
  growth_recommendations: {
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    rationale: string;
  }[];
}

export interface ThemeClasses {
  bg: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  card: string;
  accent: string;
  highlight: string;
}

export const THEME_CLASSES: Record<PdfTheme, ThemeClasses> = {
  light: {
    bg: 'bg-white',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    textSubtle: 'text-gray-500',
    border: 'border-gray-200',
    card: 'bg-gray-50',
    accent: 'border-gray-900',
    highlight: 'bg-blue-50 border-blue-200',
  },
  dark: {
    bg: 'bg-gray-900',
    text: 'text-white',
    textMuted: 'text-gray-300',
    textSubtle: 'text-gray-400',
    border: 'border-gray-700',
    card: 'bg-gray-800',
    accent: 'border-white',
    highlight: 'bg-blue-900/30 border-blue-700',
  },
};

// Estimated content height for page break calculation (in mm)
export const SECTION_HEIGHT_ESTIMATES: Partial<Record<SectionId, number>> = {
  hero: 80,
  tagline: 40,
  identity: 50,
  values: 60,
  bythenumbers: 50,
  services: 70,
  revenue: 60,
  awards: 80,
  brief: 120,
  insights: 100,
  logos: 80,
  brandicon: 60,
  colors: 80,
  gradients: 60,
  patterns: 60,
  typography: 80,
  textstyles: 60,
  iconography: 70,
  socialicons: 50,
  imagery: 80,
  social: 50,
  socialassets: 70,
  website: 40,
  signatures: 60,
  qr: 50,
  videos: 50,
  webinars: 70,
  assets: 60,
  imageassets: 80,
  misuse: 70,
  casestudies: 100,
  brochures: 80,
  templates: 50,
  templatespecs: 80,
  presentations: 80,
  eventsignage: 70,
  sponsorlogos: 60,
  clientlogos: 60,
  locations: 80,
  studios: 70,
  approvedimagery: 40,
  products: 60,
  events: 60,
  universe: 60,
  socialmetrics: 100,
};
