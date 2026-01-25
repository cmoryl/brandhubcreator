// PDF Layout Presets - Different styling themes for exports

export type PdfLayoutPreset = 'minimal' | 'professional' | 'creative';

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
