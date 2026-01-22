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
export interface TaglineFontSettings {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textAlign: 'left' | 'center' | 'right';
  fontStyle: 'normal' | 'italic';
}

export interface BrandTagline {
  primary: string;
  secondary?: string;
  variations?: string[];
  fontSettings?: TaglineFontSettings;
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
  isPrimary?: boolean; // Mark as the main/primary symbol
  isVariation?: boolean; // Mark as a variation of the primary
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
  // Extended fields
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  logoUrl?: string;
  variant?: 'full' | 'reply' | 'minimal';
  confidentialityNotice?: string;
}

// EMAIL BANNERS - Promotional banners below signatures
export interface BrandEmailBanner {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl?: string;
  width: number;
  height: number;
  description?: string;
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

// REVENUE - Revenue Data for Charts
export interface RevenueDataPoint {
  year: number;
  revenue: number; // In millions USD
  facts?: string[];
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
  heroFullWidth?: boolean; // Full width hero option
  defaultTheme?: 'light' | 'dark' | 'system'; // Per-brand default theme
  customPrimaryColor?: string; // Override primary color for this brand
  customSecondaryColor?: string; // Override secondary color for this brand
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
  externalUrl?: string; // External link (Dropbox, Google Drive, etc.)
  thumbnailUrl?: string; // Preview thumbnail for the asset
  description?: string; // Optional description
  isEmbeddedFolder?: boolean; // If true, shows as embedded folder browser
}

// TEMPLATE SPECIFICATIONS - Visual Template Annotation System
export interface TemplateSpecItem {
  id: string;
  number: number;
  title: string;
  description: string;
  dimensions?: string; // e.g., "1500 x 500 pixels"
  fileFormats?: string; // e.g., "JPEG or PNG under 2MB"
  position?: { x: number; y: number }; // Position on preview (0-100 percentage)
}

export interface TemplateSpec {
  id: string;
  name: string;
  category: 'case-study' | 'brochure' | 'whitepaper' | 'template' | 'other';
  previewImageUrl?: string;
  items: TemplateSpecItem[];
  notes?: string;
}

// LINKED GUIDES - References to other brand/product guides
export interface LinkedGuideReference {
  id: string;
  guideId: string;
  guideType: 'brand' | 'product';
}

// SERVICES - Service Offerings
export interface BrandService {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  imageUrl?: string; // Optional custom image
}

// SOCIAL ASSET TEMPLATE - Downloadable design files for social platforms
export interface SocialAssetTemplate {
  id: string;
  name: string;
  fileType: 'psd' | 'figma' | 'canva' | 'ai' | 'sketch' | 'xd' | 'other';
  url: string;
  description?: string;
}

// SOCIAL ASSETS - Platform Specifications
export interface BrandSocialAssetSpec {
  id: string;
  platform: string;
  postSize: string;
  altSize?: string;
  textLegibility: string;
  directive: string;
  templates?: SocialAssetTemplate[]; // Downloadable design templates
  previewImageUrl?: string; // Example/preview image for this platform
  storySize?: string; // Story/vertical format size
  reelSize?: string; // Reel/video format size
  coverSize?: string; // Cover/banner format size
}

// DISPLAY BANNERS - Industry Standard Specs
export interface BrandDisplayBannerSpec {
  id: string;
  name: string;
  dimensions: string;
  maxMessaging: string;
  textLegibility: string;
  safeZonePolicy: string;
  aspectRatio: number;
  previewImageUrl?: string; // Brand-specific example image for this banner size
  category?: 'desktop' | 'mobile' | 'video' | 'native'; // Banner category for grouping
}

// SECTION LAYOUTS - Per-section layout preferences
export type LayoutPreset = 
  | 'grid-2'      // 2 columns
  | 'grid-3'      // 3 columns  
  | 'grid-4'      // 4 columns
  | 'list'        // Horizontal list view
  | 'large-cards' // Large 2-column cards
  | 'compact';    // Compact small cards (5+ columns)

// Section layout settings stored per-section
export type SectionLayoutSettings = Partial<Record<SectionId, LayoutPreset>>;

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
  heroFullWidth: true, // Default to full width hero
  defaultTheme: 'system',
  customPrimaryColor: '',
  customSecondaryColor: '',
};

// Default Template Specs - TransPerfect Case Study 8-Zone Template
export const DEFAULT_TEMPLATE_SPECS: TemplateSpec[] = [
  {
    id: 'case-study-default',
    name: 'TransPerfect Case Study Template',
    category: 'case-study',
    previewImageUrl: '',
    items: [
      {
        id: 'zone-1',
        number: 1,
        title: 'Client Logo',
        description: 'High-resolution client logo placement area. Use approved client brand assets only.',
        dimensions: '300 x 150 pixels',
        fileFormats: 'PNG or SVG (transparent background preferred)',
        position: { x: 10, y: 8 }
      },
      {
        id: 'zone-2',
        number: 2,
        title: 'Cover Image',
        description: 'Hero cover image showcasing the client project or visual metaphor.',
        dimensions: '1500 x 500 pixels',
        fileFormats: 'JPEG or PNG under 2MB',
        position: { x: 50, y: 25 }
      },
      {
        id: 'zone-3',
        number: 3,
        title: 'Spotlight Header',
        description: 'Section header introducing the client spotlight content.',
        dimensions: 'Auto width, 48px height',
        fileFormats: 'Text element - use brand typography',
        position: { x: 15, y: 45 }
      },
      {
        id: 'zone-4',
        number: 4,
        title: 'Client Spotlight Copy',
        description: 'Main narrative block describing the client challenge, solution, and outcomes.',
        dimensions: '600 x auto (max 200 words)',
        fileFormats: 'Text - 16px body, 1.6 line height',
        position: { x: 25, y: 55 }
      },
      {
        id: 'zone-5',
        number: 5,
        title: 'TransPerfect Logo',
        description: 'Corporate logo placement. Use approved variant only.',
        dimensions: '180 x 60 pixels',
        fileFormats: 'SVG or PNG (transparent)',
        position: { x: 85, y: 8 }
      },
      {
        id: 'zone-6',
        number: 6,
        title: 'Page Identifier',
        description: 'Page number and document reference marker.',
        dimensions: '50 x 20 pixels',
        fileFormats: 'Text element - 10px caption',
        position: { x: 90, y: 92 }
      },
      {
        id: 'zone-7',
        number: 7,
        title: 'Headline',
        description: 'Primary headline communicating the key result or impact statement.',
        dimensions: 'Full width, 72px height',
        fileFormats: 'Text - Display font, 36-48px',
        position: { x: 50, y: 75 }
      },
      {
        id: 'zone-8',
        number: 8,
        title: 'Body Copy',
        description: 'Supporting narrative text with detailed project information and metrics.',
        dimensions: '800 x auto (max 300 words)',
        fileFormats: 'Text - 14px body, 1.5 line height',
        position: { x: 50, y: 85 }
      }
    ],
    notes: 'This template follows TransPerfect brand guidelines. Ensure all imagery meets quality standards and text follows the approved tone of voice.'
  }
];

// Base Guide interface shared by Brands and Products
export interface BaseGuide {
  id: string;
  type: 'brand' | 'product';
  slug?: string; // URL-friendly slug for clean URLs
  organizationId?: string | null; // Organization this guide belongs to
  isFavorite?: boolean;
  isPublic?: boolean;
  // Section ordering
  sectionOrder?: SectionId[];
  // Hidden sections (admin can toggle visibility)
  hiddenSections?: SectionId[];
  // Section subtitles (custom descriptions for each section)
  sectionSubtitles?: Partial<Record<SectionId, string>>;
  // Section layout settings (per-section layout preferences)
  sectionLayouts?: SectionLayoutSettings;
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
  // Default icon color for iconography display
  defaultIconColor?: string;
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
  // Email Banners (Promotional banners below signatures)
  emailBanners?: BrandEmailBanner[];
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
  // Services (Service Offerings)
  services: BrandService[];
  // Social Assets (Platform Specifications)
  socialAssets?: BrandSocialAssetSpec[];
  // Display Banners (Industry Standard Specs)
  displayBanners?: BrandDisplayBannerSpec[];
  // Linked Guides (for Product Guides section - links to other brand/product guides)
  linkedGuides?: LinkedGuideReference[];
  // Template Specifications (Visual annotation system for templates)
  templateSpecs?: TemplateSpec[];
  // Revenue Data (for Revenue Growth chart)
  revenueData?: RevenueDataPoint[];
  // Statistics (By the Numbers infographic section)
  statistics?: StatisticItem[];
  // Infographic layout for By the Numbers section
  infographicLayout?: InfographicLayout;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Default section order
export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'revenue', 'logos', 'brandicon', 'colors', 'gradients', 
  'patterns', 'typography', 'textstyles', 'iconography', 'socialicons', 
  'imagery', 'social', 'socialassets', 'website', 'signatures', 'qr', 'videos', 'assets', 'misuse',
  'casestudies', 'brochures', 'templates', 'templatespecs', 'products'
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
  | 'bythenumbers'
  | 'services'
  | 'revenue'
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
  | 'socialassets'
  | 'website'
  | 'signatures'
  | 'qr'
  | 'videos'
  | 'assets'
  | 'misuse'
  | 'casestudies'
  | 'brochures'
  | 'templates'
  | 'templatespecs'
  | 'products';

// Statistic item for By the Numbers section
export interface StatisticItem {
  id: string;
  value: string;
  prefix?: string;
  suffix?: string;
  label: string;
  description?: string;
  icon?: string; // Lucide icon name
  category?: 'primary' | 'secondary' | 'highlight'; // For layout grouping
}

// Infographic layout options for By the Numbers
export type InfographicLayout = 
  | 'cards'           // Default card grid
  | 'infographic'     // Full infographic with stats, support banner, services
  | 'vertical-list'   // Vertical list with large numbers (GlobalLink style)
  | 'split-panel'     // Two-panel layout
  | 'hero-stats'      // Large hero numbers with supporting stats
  | 'circular';       // Circular/radial layout

// Default statistics for brands
export const DEFAULT_STATISTICS: StatisticItem[] = [
  { id: 'stat-cities', value: '140', suffix: '+', label: 'Cities Worldwide', icon: 'MapPin', category: 'primary' },
  { id: 'stat-countries', value: '50', suffix: '+', label: 'Countries', icon: 'Globe', category: 'primary' },
  { id: 'stat-years', value: '30', suffix: '+', label: 'Years of Growth', icon: 'TrendingUp', category: 'primary' },
  { id: 'stat-languages', value: '200', suffix: '+', label: 'Languages Supported', icon: 'Globe', category: 'primary' },
  { id: 'stat-revenue', value: '1.22', prefix: '$', suffix: 'B', label: 'Billion & Growing', icon: 'DollarSign', category: 'secondary' },
  { id: 'stat-team', value: '10,000', label: 'Global Team Members', icon: 'Users', category: 'secondary' },
  { id: 'stat-acquisitions', value: '10', label: 'Strategic Acquisitions', icon: 'Building2', category: 'secondary' },
];
