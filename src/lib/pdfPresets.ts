// PDF Layout Presets - Different styling themes for exports

export type PdfLayoutPreset = 'minimal' | 'professional' | 'creative' | 'magazine';

// Cover Page Configuration
export type CoverLayout = 'centered' | 'left-aligned' | 'split' | 'full-bleed';
export type CoverPattern = 'none' | 'dots' | 'grid' | 'waves' | 'diagonal' | 'circles';

export interface CoverPageConfig {
  layout: CoverLayout;
  pattern: CoverPattern;
  backgroundColor: string;
  accentColor: string;
  showLogo: boolean;
  showTagline: boolean;
  showDate: boolean;
  showCoverImage: boolean;
  patternOpacity: number;
  confidentialityLevel: 'none' | 'confidential' | 'internal' | 'draft';
  showPageNumbers: boolean;
  showRunningFooter: boolean;
}

export const DEFAULT_COVER_CONFIG: CoverPageConfig = {
  layout: 'centered',
  pattern: 'none',
  backgroundColor: '',
  accentColor: '',
  showLogo: true,
  showTagline: true,
  showDate: true,
  showCoverImage: true,
  patternOpacity: 0.05,
  confidentialityLevel: 'none',
  showPageNumbers: true,
  showRunningFooter: true,
};

export const CONFIDENTIALITY_LEVELS = [
  { id: 'none' as const, label: 'None', color: '' },
  { id: 'confidential' as const, label: 'Confidential', color: '#dc2626' },
  { id: 'internal' as const, label: 'Internal Only', color: '#d97706' },
  { id: 'draft' as const, label: 'Draft', color: '#6b7280' },
];

export const COVER_LAYOUTS: { id: CoverLayout; label: string; description: string }[] = [
  { id: 'centered', label: 'Centered', description: 'Classic centered layout' },
  { id: 'left-aligned', label: 'Left Aligned', description: 'Modern left-aligned' },
  { id: 'split', label: 'Split', description: 'Content left, image right' },
  { id: 'full-bleed', label: 'Full Bleed', description: 'Image background' },
];

export const COVER_PATTERNS: { id: CoverPattern; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'waves', label: 'Waves' },
  { id: 'diagonal', label: 'Diagonal' },
  { id: 'circles', label: 'Circles' },
];

export interface PresetConfig {
  id: PdfLayoutPreset;
  label: string;
  description: string;
  icon: string;
  styles: PresetStyles;
}

export interface PresetStyles {
  // Typography
  headingStyle: 'clean' | 'bold' | 'decorative';
  bodyFont: string;
  headingFont: string;
  
  // Spacing
  sectionSpacing: 'compact' | 'normal' | 'generous';
  cardPadding: 'tight' | 'normal' | 'relaxed';
  
  // Visual Elements
  showSectionNumbers: boolean;
  showDividers: boolean;
  showAccentBorders: boolean;
  cardStyle: 'flat' | 'elevated' | 'bordered' | 'gradient';
  
  // Layout
  gridStyle: 'dense' | 'balanced' | 'spacious';
  heroStyle: 'compact' | 'centered' | 'dramatic';
  
  // Decorative
  showPatterns: boolean;
  accentShape: 'none' | 'circle' | 'square' | 'line';
  cornerRadius: 'none' | 'small' | 'medium' | 'large';
}

export const PDF_PRESETS: Record<PdfLayoutPreset, PresetConfig> = {
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    description: 'Clean, distraction-free layout with ample whitespace',
    icon: 'minus',
    styles: {
      headingStyle: 'clean',
      bodyFont: 'Inter, sans-serif',
      headingFont: 'Inter, sans-serif',
      sectionSpacing: 'generous',
      cardPadding: 'normal',
      showSectionNumbers: false,
      showDividers: false,
      showAccentBorders: false,
      cardStyle: 'flat',
      gridStyle: 'spacious',
      heroStyle: 'compact',
      showPatterns: false,
      accentShape: 'none',
      cornerRadius: 'none',
    },
  },
  professional: {
    id: 'professional',
    label: 'Professional',
    description: 'Classic corporate layout with structured sections',
    icon: 'briefcase',
    styles: {
      headingStyle: 'bold',
      bodyFont: 'Inter, sans-serif',
      headingFont: 'Inter, sans-serif',
      sectionSpacing: 'normal',
      cardPadding: 'normal',
      showSectionNumbers: true,
      showDividers: true,
      showAccentBorders: true,
      cardStyle: 'bordered',
      gridStyle: 'balanced',
      heroStyle: 'centered',
      showPatterns: false,
      accentShape: 'line',
      cornerRadius: 'small',
    },
  },
  creative: {
    id: 'creative',
    label: 'Creative',
    description: 'Bold, dynamic layout with decorative elements',
    icon: 'sparkles',
    styles: {
      headingStyle: 'decorative',
      bodyFont: 'Inter, sans-serif',
      headingFont: 'Inter, sans-serif',
      sectionSpacing: 'normal',
      cardPadding: 'relaxed',
      showSectionNumbers: true,
      showDividers: false,
      showAccentBorders: true,
      cardStyle: 'gradient',
      gridStyle: 'balanced',
      heroStyle: 'dramatic',
      showPatterns: true,
      accentShape: 'circle',
      cornerRadius: 'large',
    },
  },
  magazine: {
    id: 'magazine',
    label: 'Magazine',
    description: 'Multi-column editorial layout with rich visuals',
    icon: 'newspaper',
    styles: {
      headingStyle: 'decorative',
      bodyFont: 'Inter, sans-serif',
      headingFont: 'Inter, sans-serif',
      sectionSpacing: 'compact',
      cardPadding: 'normal',
      showSectionNumbers: false,
      showDividers: true,
      showAccentBorders: true,
      cardStyle: 'elevated',
      gridStyle: 'dense',
      heroStyle: 'dramatic',
      showPatterns: false,
      accentShape: 'line',
      cornerRadius: 'medium',
    },
  },
};

// CSS class generators based on preset
export const getPresetClasses = (preset: PdfLayoutPreset, theme: 'light' | 'dark') => {
  const config = PDF_PRESETS[preset].styles;
  const isDark = theme === 'dark';
  
  return {
    // Container
    container: `pdf-preset-${preset} ${isDark ? 'pdf-theme-dark' : ''}`,
    
    // Hero
    hero: `pdf-hero-${config.heroStyle}`,
    
    // Sections
    section: [
      `pdf-spacing-${config.sectionSpacing}`,
      config.showDividers ? 'pdf-with-dividers' : '',
    ].filter(Boolean).join(' '),
    
    // Section headers
    sectionHeader: [
      `pdf-heading-${config.headingStyle}`,
      config.showSectionNumbers ? 'pdf-with-numbers' : '',
      config.showAccentBorders ? 'pdf-accent-border' : '',
    ].filter(Boolean).join(' '),
    
    // Cards
    card: [
      `pdf-card-${config.cardStyle}`,
      `pdf-padding-${config.cardPadding}`,
      `pdf-radius-${config.cornerRadius}`,
    ].filter(Boolean).join(' '),
    
    // Grid
    grid: `pdf-grid-${config.gridStyle}`,
    
    // Decorative
    decorative: config.showPatterns ? 'pdf-with-patterns' : '',
  };
};

// Get inline styles for dynamic elements
export const getPresetInlineStyles = (preset: PdfLayoutPreset) => {
  const config = PDF_PRESETS[preset].styles;
  
  return {
    body: {
      fontFamily: config.bodyFont,
    },
    heading: {
      fontFamily: config.headingFont,
    },
  };
};

// Generate cover page pattern SVG
export const getCoverPatternSvg = (pattern: CoverPattern, color: string, opacity: number): string => {
  const patternColor = color || 'currentColor';
  
  switch (pattern) {
    case 'dots':
      return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='${encodeURIComponent(patternColor)}' fill-opacity='${opacity}'/%3E%3C/svg%3E")`;
    case 'grid':
      return `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1v38h38V1H1z' fill='${encodeURIComponent(patternColor)}' fill-opacity='${opacity}'/%3E%3C/svg%3E")`;
    case 'waves':
      return `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10c25 0 25-10 50-10s25 10 50 10' stroke='${encodeURIComponent(patternColor)}' stroke-opacity='${opacity}' fill='none' stroke-width='1'/%3E%3C/svg%3E")`;
    case 'diagonal':
      return `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-1 1l2-2M0 10L10 0M9 11l2-2' stroke='${encodeURIComponent(patternColor)}' stroke-opacity='${opacity}' stroke-width='1'/%3E%3C/svg%3E")`;
    case 'circles':
      return `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='20' stroke='${encodeURIComponent(patternColor)}' stroke-opacity='${opacity}' fill='none' stroke-width='1'/%3E%3C/svg%3E")`;
    default:
      return 'none';
  }
};
