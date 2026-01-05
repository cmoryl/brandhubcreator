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

export interface BrandTypography {
  id: string;
  name: string;
  fontFamily: string;
  weight: string;
  usage: string;
  role?: 'display' | 'body';
  downloadUrl?: string;
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

// GRADIENTS - Flux Nodes
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
}

// TEMPLATES - Master Scaffolds
export interface BrandTemplate {
  id: string;
  name: string;
  fileType: string;
  fileSize: string;
}

// Base Guide interface shared by Brands and Products
export interface BaseGuide {
  id: string;
  type: 'brand' | 'product';
  isFavorite?: boolean;
  // Section ordering
  sectionOrder?: SectionId[];
  // Hero
  hero: BrandHero;
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
  // Gradients (Flux Nodes)
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
  // Signatures (Signature Protocol)
  signatures: BrandSignature[];
  // QR (Access Ports)
  qr: BrandQR;
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
  'hero', 'identity', 'values', 'logos', 'brandicon', 'colors', 'gradients', 
  'patterns', 'typography', 'textstyles', 'iconography', 'socialicons', 
  'imagery', 'social', 'signatures', 'qr', 'assets', 'misuse', 'atmosphere',
  'casestudies', 'brochures', 'templates'
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
  | 'signatures'
  | 'qr'
  | 'assets'
  | 'misuse'
  | 'atmosphere'
  | 'casestudies'
  | 'brochures'
  | 'templates';
