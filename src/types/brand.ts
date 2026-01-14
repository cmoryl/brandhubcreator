// Core types
export interface BrandColor {
  id: string;
  name: string;
  hex: string;
  rgb?: string;
  cmyk?: string;
  hsv?: string;
  pantone?: string;
  usage?: string;
  role?: 'primary' | 'secondary' | 'accent' | 'neutral';
}

// Color Combination for A/B testing
export interface ColorCombination {
  id: string;
  name: string;
  colors: string[]; // Array of hex values
  status: 'approved' | 'rejected' | 'testing';
  notes?: string;
}

export interface BrandTypography {
  id: string;
  name: string;
  fontFamily: string;
  weight: string;
  usage: string;
  role?: 'display' | 'body';
  downloadUrl?: string;
  previewText?: string; // Custom preview text (e.g., company tagline)
}

export interface BrandLogo {
  id: string;
  name: string;
  url: string;
  variant: 'primary' | 'secondary' | 'icon' | 'wordmark' | 'reversed' | 'monochrome';
}

// HERO - Identity Shield
export interface BrandHero {
  name: string;
  tagline: string;
  coverImage: string;
  logoUrl: string;
}

// TAGLINE - Corporate Tagline
export interface BrandTagline {
  primary: string;
  secondary?: string;
  variations?: string[];
}

// IDENTITY - Narrative Architecture
export interface BrandIdentity {
  missionStatement: string;
  archetype: string;
  toneOfVoice: string[];
}

// VALUES - Philosophical Pillars
export interface BrandValue {
  id: string;
  text: string;
  description: string;
  icon: string;
}

// BRANDICON - Symbol Standards
export interface BrandIcon {
  id: string;
  name: string;
  url: string;
  settings: string;
}

// GRADIENTS - Gradients
export interface BrandGradient {
  id: string;
  name: string;
  css: string;
}

// PATTERNS - Geometric Primitives
export interface BrandPattern {
  id: string;
  name: string;
  url: string;
}

// TEXTSTYLES - CSS Hierarchies
export interface BrandTextStyle {
  id: string;
  tag: string;
  size: string;
  weight: string;
  lineHeight: string;
}

// ICONOGRAPHY - Neural Vectors
export interface BrandIconography {
  id: string;
  name: string;
  svgPath: string;
  category: string;
  viewBox?: string;
  fillMode?: 'stroke' | 'fill';
}

// SOCIALICONS - Platform Markers
export interface BrandSocialIcon {
  id: string;
  platform: string;
  svgPath: string;
}

// IMAGERY - Visual Direction
export interface BrandImagery {
  id: string;
  url: string;
  type: 'do' | 'dont';
  description: string;
}

// SOCIAL - Social Registry
export interface BrandSocialProfile {
  id: string;
  platform: string;
  handle: string;
  url: string;
  color: string;
}

// WEBSITE - Website Links
export interface BrandWebsiteLink {
  id: string;
  label: string;
  url: string;
  screenshotUrl?: string; // Optional screenshot preview of the website
}

// SIGNATURES - Signature Protocol
export interface BrandSignature {
  id: string;
  name: string;
  role: string;
  html: string;
}

// QR - Access Ports
export interface BrandQR {
  defaultUrl: string;
  fgColor: string;
  bgColor: string;
}

// VIDEOS - Video Resources
export interface BrandVideo {
  id: string;
  title: string;
  url: string;
  type: 'youtube' | 'vimeo' | 'direct';
  description?: string;
  thumbnail?: string;
}

// ASSETS - Operational Vault
export interface BrandAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  size: string;
}

// MISUSE - Anti-Patterns
export interface BrandMisuse {
  id: string;
  url: string;
  description: string;
}

// ATMOSPHERE - Atmosphere Engine
export interface BrandAtmosphere {
  style: string;
  animate: boolean;
  opacity: number;
  blur: number;
}

// PAGESETTINGS - Brand Page Display Settings
export type BrandBackgroundType = 
  | 'inherit' 
  | 'gradient' 
  | 'image' 
  | 'animated-gradient' 
  | 'animated-particles'
  | 'animated-waves'
  | 'animated-mesh'
  | 'animated-aurora'
  | 'animated-geometric'
  | 'animated-spotlight'
  | 'animated-mesh-waves'
  | 'animated-dataflow'
  | 'solid';

export interface BrandPageSettings {
  backgroundType: BrandBackgroundType;
  backgroundImage: string;
  backgroundColor: string;
  accentColor: string;
  animationTintColor: string; // Color tint for animated backgrounds
  animationSpeed: 'slow' | 'medium' | 'fast';
  showHeader: boolean;
  headerStyle: 'default' | 'minimal' | 'transparent';
  contentWidth: 'default' | 'wide' | 'full';
  sectionSpacing: 'compact' | 'default' | 'spacious';
}

// CASESTUDIES - Proof Shards
export interface BrandCaseStudy {
  id: string;
  title: string;
  description: string;
  previewUrl: string;
}

// BROCHURES - Digital Collateral
export interface BrandBrochure {
  id: string;
  title: string;
  category: string;
  previewUrl: string;
  thumbnailUrl?: string; // Optional image preview/screenshot
}

// TEMPLATES - Master Scaffolds
export interface BrandTemplate {
  id: string;
  name: string;
  fileType: string;
  fileSize: string;
}

// Default page settings
export const DEFAULT_PAGE_SETTINGS: BrandPageSettings = {
  backgroundType: 'inherit',
  backgroundImage: '',
  backgroundColor: '',
  accentColor: '',
  animationTintColor: '',
  animationSpeed: 'medium',
  showHeader: true,
  headerStyle: 'default',
  contentWidth: 'default',
  sectionSpacing: 'default',
};

// Base Guide interface shared by Brands and Products
export interface BaseGuide {
  id: string;
  type: 'brand' | 'product';
  isFavorite?: boolean;
  isPublic?: boolean;
  // Section ordering
  sectionOrder?: SectionId[];
  // Hidden sections (admin can toggle visibility)
  hiddenSections?: SectionId[];
  // Section subtitles (custom descriptions for each section)
  sectionSubtitles?: Partial<Record<SectionId, string>>;
  // Page display settings (individual brand customization)
  pageSettings?: BrandPageSettings;
  // Hero
  hero: BrandHero;
  // Tagline (Corporate Tagline)
  tagline: BrandTagline;
  // Identity
  identity: BrandIdentity;
  // Values
  values: BrandValue[];
  // Logos (Mark Repository)
  logos: BrandLogo[];
  // Brand Icons (Symbol Standards)
  brandIcons: BrandIcon[];
  // Colors (Prismatic Lab)
  colors: BrandColor[];
  // Color Combinations (A/B Testing)
  colorCombinations: ColorCombination[];
  // Gradients
  gradients: BrandGradient[];
  // Patterns (Geometric Primitives)
  patterns: BrandPattern[];
  // Typography (Type Registry)
  typography: BrandTypography[];
  // Text Styles (CSS Hierarchies)
  textStyles: BrandTextStyle[];
  // Iconography (Neural Vectors)
  iconography: BrandIconography[];
  // Social Icons (Platform Markers)
  socialIcons: BrandSocialIcon[];
  // Imagery (Visual Direction)
  imagery: BrandImagery[];
  // Social (Social Registry)
  social: BrandSocialProfile[];
  // Website (Website Links)
  websites: BrandWebsiteLink[];
  // Signatures (Signature Protocol)
  signatures: BrandSignature[];
  // QR (Access Ports)
  qr: BrandQR;
  // Videos (Video Resources)
  videos: BrandVideo[];
  // Assets (Operational Vault)
  assets: BrandAsset[];
  // Misuse (Anti-Patterns)
  misuse: BrandMisuse[];
  // Atmosphere (Atmosphere Engine)
  atmosphere: BrandAtmosphere;
  // Case Studies (Proof Shards)
  caseStudies: BrandCaseStudy[];
  // Brochures (Digital Collateral)
  brochures: BrandBrochure[];
  // Templates (Master Scaffolds)
  templates: BrandTemplate[];
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Default section order
export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'hero', 'tagline', 'identity', 'values', 'logos', 'brandicon', 'colors', 'gradients', 
  'patterns', 'typography', 'textstyles', 'iconography', 'socialicons', 
  'imagery', 'social', 'website', 'signatures', 'qr', 'videos', 'assets', 'misuse', 'atmosphere',
  'casestudies', 'brochures', 'templates', 'products'
];

// Main Brand Guide interface (extends base)
export interface BrandGuide extends BaseGuide {
  type: 'brand';
}

// Product Guide interface
export interface ProductGuide extends BaseGuide {
  type: 'product';
  parentBrandId?: string; // Optional link to parent brand
}

// Section IDs for navigation
export type SectionId = 
  | 'hero'
  | 'tagline'
  | 'identity'
  | 'values'
  | 'logos'
  | 'brandicon'
  | 'colors'
  | 'gradients'
  | 'patterns'
  | 'typography'
  | 'textstyles'
  | 'iconography'
  | 'socialicons'
  | 'imagery'
  | 'social'
  | 'website'
  | 'signatures'
  | 'qr'
  | 'videos'
  | 'assets'
  | 'misuse'
  | 'atmosphere'
  | 'casestudies'
  | 'brochures'
  | 'templates'
  | 'products';
