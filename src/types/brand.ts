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
  /** Optional video URL for animated hero backgrounds (MP4/WebM) */
  coverVideo?: string;
  /** Whether to use video instead of image when both are present */
  useVideo?: boolean;
  /** Whether to apply Ken Burns (slow pan/zoom) effect to hero image */
  kenBurnsEffect?: boolean;
  /** Speed of the Ken Burns animation */
  kenBurnsSpeed?: 'slow' | 'normal' | 'fast';
  /** Active hero background effect type */
  heroEffect?: 'none' | 'gradient-bars' | 'horizon-glow' | 'floating-orbs' | 'gradient-spheres' | 'image-orbs' | 'image-panels';
  /** Intensity of the hero effect */
  heroEffectIntensity?: 'subtle' | 'medium' | 'bold';
  /** Color scheme for hero effect */
  heroEffectColorScheme?: string;
  /** Dark or light mode for hero effect */
  heroEffectMode?: 'dark' | 'light';
  /** Brightness level for hero effect (0-100) */
  heroEffectBrightness?: number;
  /** Density/count of orbs/spheres for orb-based effects */
  heroEffectDensity?: 'few' | 'normal' | 'many' | 'dense';
  /** Animation speed for hero effects */
  heroEffectSpeed?: 'slow' | 'normal' | 'fast' | 'very-fast';
  /** @deprecated Use heroEffect instead */
  gradientBarsEffect?: boolean;
  /** @deprecated Use heroEffectIntensity instead */
  gradientBarsIntensity?: 'subtle' | 'medium' | 'bold';
  /** @deprecated Use heroEffectColorScheme instead */
  gradientBarsColorScheme?: 'cyan-purple' | 'blue-teal' | 'purple-pink' | 'green-cyan' | 'amber-orange' | 'custom';
  /** @deprecated Use heroEffectMode instead */
  gradientBarsMode?: 'dark' | 'light';
  /** @deprecated Use heroEffectBrightness instead */
  gradientBarsBrightness?: number;
  logoUrl: string;
  /** Logo URL for dark mode display */
  darkLogoUrl?: string;
  /** Tagline animation effect on load */
  taglineAnimation?: 'typewriter' | 'fade-slide' | 'blur-reveal' | 'split-chars' | 'wave-glow';
  /** Tagline hover interaction effect */
  taglineHoverEffect?: 'none' | 'glow-pulse' | 'letter-dance' | 'color-shift' | 'underline-grow';
  /** Tagline environmental effect */
  taglineEnvironment?: 'none' | 'shimmer' | 'particle-dust' | 'aurora' | 'glitch';
  /** Overlay darkness intensity (0-100, default 50) */
  overlayIntensity?: number;
  /** Overlay gradient preset */
  overlayGradient?: 'default' | 'radial-dark' | 'top-fade' | 'vignette' | 'brand-tint' | 'none';
  /** Parallax effect intensity (0 = disabled, 1-3 = intensity levels) */
  parallaxIntensity?: 0 | 1 | 2 | 3;
  /** Custom tagline text color (hex) */
  taglineColor?: string;
  /** Custom title text color (hex) */
  titleColor?: string;
  /** Text glow effect for tagline */
  taglineGlow?: boolean;
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

export interface TaglineVariation {
  text: string;
  style?: 'gradient' | 'accent-bar' | 'floating-card' | 'glass' | 'outlined';
}

export interface BrandTagline {
  primary: string;
  secondary?: string;
  variations?: string[];
  /** Enhanced variations with style metadata */
  variationsV2?: TaglineVariation[];
  fontSettings?: TaglineFontSettings;
  /** Tagline animation effect on load */
  taglineAnimation?: 'typewriter' | 'fade-slide' | 'blur-reveal' | 'split-chars' | 'wave-glow';
  /** Tagline hover interaction effect */
  taglineHoverEffect?: 'none' | 'glow-pulse' | 'letter-dance' | 'color-shift' | 'underline-grow';
  /** Tagline environmental effect */
  taglineEnvironment?: 'none' | 'shimmer' | 'particle-dust' | 'aurora' | 'glitch';
  /** Whether to show secondary tagline (defaults to true) */
  showSecondary?: boolean;
  /** Whether to show tagline variations (defaults to true) */
  showVariations?: boolean;
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
  imageUrl?: string; // Custom image URL (persisted to storage)
  useImage?: boolean; // Whether to show image vs icon
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

// CUSTOM DESIGN SHAPES - Brand-specific vector elements
export interface CustomDesignShape {
  id: string;
  name: string;
  type: 'custom';
  svg: string;
  /** Optional category for organization */
  category?: string;
  /** Whether this is AI-generated */
  aiGenerated?: boolean;
}

// TEXTSTYLES - CSS Hierarchies
export interface BrandTextStyle {
  id: string;
  tag: string;
  size: string;
  weight: string;
  lineHeight: string;
  sampleText?: string; // Custom sample text for preview
}

// Admin Custom Style - Special style preserved across presets
export interface AdminCustomStyle {
  id: string;
  name: string;
  css: string;
  description?: string;
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

// SIGNATURES - Social Links
export interface SignatureSocialLink {
  id: string;
  platform: string;
  url: string;
}

// SIGNATURES - Advanced Styling
export interface SignatureStyle {
  fontFamily?: string;
  nameFontSize?: number;
  titleFontSize?: number;
  textFontSize?: number;
  nameColor?: string;
  titleColor?: string;
  textColor?: string;
  linkColor?: string;
  dividerStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  dividerColor?: string;
  dividerWidth?: number;
  spacing?: number;
  layout?: 'horizontal' | 'vertical';
  /** Structural layout template for different signature architectures */
  layoutTemplate?: 'classic' | 'centered' | 'side-banner' | 'card' | 'inline' | 'stacked' | 'two-column' | 'banner-top';
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
  // Logo dimensions (with aspect ratio lock)
  logoWidth?: number;
  logoHeight?: number;
  variant?: 'full' | 'reply' | 'minimal';
  confidentialityNotice?: string;
  // Custom accent color (overrides default TransPerfect Blue)
  accentColor?: string;
  // Social media links
  socialLinks?: SignatureSocialLink[];
  // Advanced styling
  style?: SignatureStyle;
  // Inline banner
  bannerUrl?: string;
  bannerLinkUrl?: string;
  bannerWidth?: number;
  bannerHeight?: number;
  // Template ID reference
  templateId?: string;
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
  liveFilesUrl?: string; // Link to live design files (Figma, Dropbox, etc.)
}

// QR - QR Codes
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
export const ASSET_CATEGORIES = [
  'Print Materials',
  'Digital Assets',
  'Photography',
  'Product Screenshots',
  'Video',
  'Logos & Icons',
  'Templates',
  'Presentations',
  'Signage & Banners',
  'Packaging',
  'Other',
] as const;

export type AssetCategory = typeof ASSET_CATEGORIES[number];

export const PRINT_SIGNAGE_TYPES = [
  { value: 'booth-backdrop', label: 'Booth Backdrop' },
  { value: 'pull-up-banner', label: 'Pull-Up Banner' },
  { value: 'table-banner', label: 'Table Banner' },
  { value: 'hanging-sign', label: 'Hanging Sign' },
  { value: 'floor-graphic', label: 'Floor Graphic' },
  { value: 'directional', label: 'Directional Sign' },
  { value: 'podium-sign', label: 'Podium Sign' },
  { value: 'stage-backdrop', label: 'Stage Backdrop' },
  { value: 'outdoor-banner', label: 'Outdoor Banner' },
  { value: 'registration-desk', label: 'Registration Desk' },
  { value: 'feather-flag', label: 'Feather Flag' },
  { value: 'pop-up-display', label: 'Pop-Up Display' },
  { value: 'canopy-tent', label: 'Canopy / Tent' },
  { value: 'window-cling', label: 'Window Cling' },
  { value: 'a-frame', label: 'A-Frame Sign' },
  { value: 'demo-station', label: 'Demo Station' },
  { value: 'kiosk-wrap', label: 'Kiosk Wrap' },
  { value: 'step-repeat', label: 'Step & Repeat' },
  { value: 'counter-display', label: 'Counter Display' },
  { value: 'ceiling-banner', label: 'Ceiling Banner' },
  { value: 'brochure', label: 'Brochure' },
  { value: 'flyer', label: 'Flyer' },
  { value: 'poster', label: 'Poster' },
  { value: 'business-card', label: 'Business Card' },
  { value: 'letterhead', label: 'Letterhead' },
  { value: 'envelope', label: 'Envelope' },
  { value: 'postcard', label: 'Postcard' },
  { value: 'catalog', label: 'Catalog' },
  { value: 'folder', label: 'Presentation Folder' },
  { value: 'sticker', label: 'Sticker / Label' },
  { value: 'other', label: 'Other' },
] as const;

export interface BrandAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  size: string;
  category?: AssetCategory;
  thumbnailUrl?: string;
  /** Optional sub-type for Print Materials & Signage & Banners categories */
  printType?: string;
  /** Dimensions e.g. "10ft x 8ft" */
  dimensions?: string;
}

// EVENT SIGNAGE - Booths & Banners for brand events
export interface BrandEventSignage {
  id: string;
  name: string;
  type: 'booth-backdrop' | 'pull-up-banner' | 'table-banner' | 'hanging-sign' | 'floor-graphic' | 'directional' | 'podium-sign' | 'stage-backdrop' | 'outdoor-banner' | 'other';
  dimensions: string; // e.g., "10ft x 8ft"
  previewUrl?: string;
  templateUrl?: string;
  notes?: string;
  specifications?: string;
}

// LINKED BOOTH CARDS - References to booth catalog divisions
export interface BoothLink {
  id: string;
  label: string;
  url: string;
}

export interface LinkedBoothCard {
  id: string;
  divisionId: string;
  divisionName: string;
  tagline: string;
  color: string;
  iconName: string;
  services: string[];
  linkedAt: string;
  links?: BoothLink[];
  customImage?: string;
  liveFileUrl?: string;
  pdfFileUrl?: string;
}

// IMAGE ASSETS - Downloadable Image Library
export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  uploadedAt: string;
}

// REVENUE - Revenue Data for Charts
export interface RevenueDataPoint {
  year: number;
  revenue: number; // In millions USD
  facts?: string[];
}

// REVENUE CHART COLORS - Customizable chart colors
export interface RevenueChartColors {
  barColor: string; // Primary bar color (hex)
  barColorEnd?: string; // Gradient end color (hex) - defaults to barColor with opacity
  hoverColor?: string; // Highlight color on hover (hex)
  gridColor?: string; // Grid line color (hex)
  textColor?: string; // Axis text color (hex)
}

// CHART THEME - Unified theming for all charts and infographics
export interface ChartTheme {
  id: string;
  name: string;
  description?: string;
  // Primary colors for bars, areas, lines
  primary: string;
  secondary: string;
  tertiary?: string;
  // Accent for highlights and hover states
  accent: string;
  // Background and structural colors
  background: string;
  gridColor: string;
  textColor: string;
  // Optional gradient settings
  useGradients?: boolean;
  // Multi-series palette (for pie charts, multi-line charts, etc.)
  palette?: string[];
}

// Pre-built chart theme presets
export type ChartThemePresetId = 
  | 'brand-primary'    // Uses brand's primary color
  | 'brand-secondary'  // Uses brand's secondary color
  | 'corporate-blue'   // Professional blue theme
  | 'modern-purple'    // Modern purple/violet
  | 'forest-green'     // Eco-friendly green
  | 'sunset-orange'    // Warm sunset tones
  | 'minimal-gray'     // Clean minimal gray
  | 'high-contrast'    // Accessibility-focused
  | 'custom';          // User-defined colors

export interface ChartThemeSettings {
  presetId: ChartThemePresetId;
  customTheme?: ChartTheme; // Only used when presetId is 'custom'
}

// APPROVED IMAGERY - Curated Stock Imagery
export interface ApprovedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string; // e.g., 'shutterstock'
  category?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ApprovedImagerySubSection {
  id: string;
  name: string;
  description?: string;
  images: ApprovedImage[];
  dropboxFolderPath?: string;
}

export interface ApprovedImageryData {
  sections: ApprovedImagerySubSection[];
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
  | 'animated-wave-lines'
  | 'animated-flow-field'
  | 'animated-neon-grid'
  | 'animated-sine-lines'
  | 'animated-data-particles'
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
  cardViewBackground?: BrandBackgroundType; // Background for card grid view
  cardViewBackgroundTint?: string; // Tint color for card view animated backgrounds
  cardViewLightLogo?: string; // Separate logo for card grid view (light mode)
  cardViewDarkLogo?: string; // Separate logo for card grid view (dark mode)
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
  externalUrl?: string; // External link (Dropbox, GlobalLink Share, etc.)
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

// PRESENTATION TEMPLATES - All document types including PowerPoint, PDFs, design files, cloud folders, and external links
export interface PresentationSlide {
  id: string;
  slideNumber: number;
  thumbnailUrl: string; // URL to slide thumbnail image
  title?: string; // Optional slide title extracted from PPTX
  textContent?: string; // Extracted text content from the slide
}

export type PresentationFileType = 
  | 'pptx' | 'pdf' | 'docx' | 'xlsx' 
  | 'figma' | 'sketch' | 'psd' | 'ai' 
  | 'image' | 'video'
  | 'dropbox' | 'dropbox-folder' | 'drive' | 'drive-folder'
  | 'link' | 'other';

export type PresentationCategory = 
  | 'presentations' | 'documents' | 'design-files' 
  | 'spreadsheets' | 'cloud-folders' | 'external-links' 
  | 'pdf' | 'sales' | 'marketing' | 'corporate' 
  | 'event' | 'training' | 'other';

export interface PresentationTemplate {
  id: string;
  name: string;
  description?: string;
  fileUrl: string; // URL to download the original file or external URL
  fileName: string; // Original file name
  fileSize?: string; // e.g., "2.4 MB"
  fileType?: PresentationFileType; // File type for classification
  slides: PresentationSlide[];
  category?: PresentationCategory;
  createdAt?: string;
  /** Optional admin-uploaded card thumbnail to override slide-derived thumbnail */
  cardImageUrl?: string;
  /** Optional thumbnail URL for preview */
  thumbnailUrl?: string;
  /** External URL for links and cloud folders */
  externalUrl?: string;
  /** Whether this is an embedded folder view (Dropbox/Drive) */
  isEmbeddedFolder?: boolean;
}

// PDF DOCUMENTS - PDF File Templates and Documents
export interface PDFDocument {
  id: string;
  name: string;
  description?: string;
  fileUrl: string; // URL to the PDF file
  fileName: string; // Original file name
  fileSize?: string; // e.g., "2.4 MB"
  pageCount: number; // Number of pages in the PDF
  thumbnailUrl?: string; // First page thumbnail or custom image
  category?: 'sales' | 'marketing' | 'corporate' | 'legal' | 'training' | 'other';
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
  createdAt?: string;
  /** Optional admin-uploaded card thumbnail to override auto-extracted thumbnail */
  cardImageUrl?: string;
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
  downloadUrl?: string;
}

// LINKED GUIDES - References to other brand/product/event guides
export interface LinkedGuideReference {
  id: string;
  guideId?: string; // Legacy field
  guideType?: 'brand' | 'product' | 'event';
  // Extended fields for event sub-guides
  type?: 'brand' | 'product' | 'event';
  slug?: string;
  name?: string;
  region?: string;
  accentColor?: string;
  location?: string;
  dates?: string;
  attendees?: number;
  coverImage?: string;
}

// SERVICES - Service Offerings
export interface BrandService {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  imageUrl?: string; // Optional custom image (small icon)
  headerImage?: string; // Optional header image spanning full card width
}

// SOCIAL ASSET TEMPLATE - Downloadable design files for social platforms
export type SocialSizeCategory = 'post' | 'square' | 'story' | 'reel' | 'cover' | 'other';

export interface SocialAssetTemplate {
  id: string;
  name: string;
  fileType: 'psd' | 'figma' | 'canva' | 'ai' | 'sketch' | 'xd' | 'other';
  url: string;
  description?: string;
  previewImageUrl?: string;
  dimensions?: string;
  sizeCategory?: SocialSizeCategory;
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
  profileIconUrl?: string; // Custom profile icon/avatar for platform preview
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

// AWARDS - Awards & Recognition
export interface BrandAward {
  id: string;
  title: string;
  description: string;
  year: number;
  organization: string; // Awarding organization
  imageUrl?: string;
  linkUrl?: string;
  category?: string; // e.g., "eDiscovery", "Legal Tech", "Company Culture"
}

// WEBINARS - Webinar Series
export interface BrandWebinar {
  id: string;
  title: string;
  description?: string;
  date?: string;
  duration?: string;
  registrationUrl?: string;
  recordingUrl?: string;
  thumbnailUrl?: string;
  speakers?: string[];
  status?: 'upcoming' | 'live' | 'recorded';
  attendees?: number;
}

// LOCATIONS - Global Presence Map
export type LocationCategory = 'studio' | 'office' | 'headquarters' | 'datacenter' | 'partner';

export interface BrandLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  category: LocationCategory;
  description?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  imageUrl?: string;
}

export interface LocationStat {
  id: string;
  value: string;
  suffix?: string;
  label: string;
  icon?: string; // Lucide icon name (e.g., 'Mic', 'Film', 'Music')
}

// SPONSOR LOGOS - Partner/Sponsor Logo Placement
export interface SponsorLogo {
  id: string;
  name: string;
  url: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner' | 'media';
  websiteUrl?: string;
  description?: string;
  placement?: string; // Where sponsor logo appears (e.g., "main stage", "lanyards")
}

// CLIENT LOGOS - Partner/Client Logo Downloads
export type ClientLogoVariant = 'color' | 'white' | 'black';
export type ClientLogoFormat = 'png' | 'svg' | 'eps';

export interface ClientLogoFile {
  variant: ClientLogoVariant;
  format: ClientLogoFormat;
  url: string;
}

export interface ClientLogo {
  id: string;
  name: string;
  description?: string;
  files: ClientLogoFile[];
  websiteUrl?: string;
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
  headerStyle: 'transparent', // Default to transparent header
  contentWidth: 'full', // Default to full width content
  sectionSpacing: 'spacious', // Default to spacious for more breathing room
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
  shareToken?: string | null; // Token for external sharing/import
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
  // Colors (Color Palette)
  colors: BrandColor[];
  // Color Combinations (A/B Testing)
  colorCombinations: ColorCombination[];
  // Gradients
  gradients: BrandGradient[];
  // Patterns (Geometric Primitives)
  patterns: BrandPattern[];
  // Custom Design Shapes (Brand-specific vector elements)
  customShapes?: CustomDesignShape[];
  // Typography (Type Registry)
  typography: BrandTypography[];
  // Text Styles (CSS Hierarchies)
  textStyles: BrandTextStyle[];
  // Admin Custom Style (preserved across presets)
  adminCustomStyle?: AdminCustomStyle;
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
  // QR (QR Codes)
  qr: BrandQR;
  // Videos (Video Resources)
  videos: BrandVideo[];
  // Assets (Operational Vault)
  assets: BrandAsset[];
  // Image Assets (Downloadable Image Library)
  imageAssets?: ImageAsset[];
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
  // Revenue Chart Colors (customizable chart theming) - deprecated, use chartTheme
  revenueChartColors?: RevenueChartColors;
  // Unified Chart Theme (applies to all charts and infographics)
  chartTheme?: ChartThemeSettings;
  // Statistics (By the Numbers infographic section)
  statistics?: StatisticItem[];
  // Infographic layout for By the Numbers section
  infographicLayout?: InfographicLayout;
  // Webinars (Webinar Series)
  webinars?: BrandWebinar[];
  // Awards (Awards & Recognition)
  awards?: BrandAward[];
  // Sponsor Logos (Partner/Sponsor Logo Placement)
  sponsorLogos?: SponsorLogo[];
  // Client Logos (Partner/Client Logo Downloads)
  clientLogos?: ClientLogo[];
  // Insights & Updates (Reports, Analytics, News for stakeholders)
  insights?: InsightItem[];
  // Insights section layout preference
  insightsLayout?: InsightsLayout;
  // Access code to protect Insights section for public users (admins/authenticated users bypass)
  insightsAccessCode?: string;
  // Locations (Global Presence Map)
  locations?: BrandLocation[];
  // Location Stats (for locations section infographic)
  locationStats?: LocationStat[];
  // Locations section settings
  locationsSectionTitle?: string;
  locationsSectionDescription?: string;
  // Whether to use shared company locations database instead of brand-specific locations
  useSharedLocations?: boolean;
  // Map theme configuration for the Locations section
  mapTheme?: import('@/types/mapTheme').MapThemeConfig;
  // Event Signage (Booths, Banners for brand events)
  eventSignage?: BrandEventSignage[];
  // Linked Booth Cards from /booths catalog
  linkedBooths?: LinkedBoothCard[];
  // Presentation Templates (PowerPoint slide galleries)
  presentationTemplates?: PresentationTemplate[];
  // Approved Imagery (Shutterstock curated sub-sections)
  approvedImagery?: ApprovedImageryData;
  // Studios (Owned studios/facilities)
  studios?: BrandStudio[];
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Studio / facility owned by the brand
export interface BrandStudio {
  id: string;
  name: string;
  location: string;
  description?: string;
  imageUrl?: string;
  specialties?: string[];
  website?: string;
  email?: string;
  phone?: string;
  established?: string;
  capacity?: string;
  status?: 'active' | 'coming-soon' | 'archived';
}

// Default section order - canonical sections only (no deprecated aliases)
export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'revenue', 'awards', 'insights', 'locations', 'webinars', 
  'logos', 'brandicon', 'colors', 'gradients', 'patterns', 
  'typography', 'textstyles', 
  'iconography', 'socialicons', 'imagery', 
  'social', 'socialassets', 'socialmetrics', 'website', 'signatures', 'qr', 
  'videos', 'assets', 'imageassets', 'misuse',
  'brochures', 'templatespecs', 'presentations', 'sponsorlogos', 'clientlogos', 'universe', 'products', 'events', 'eventsignage', 'approvedimagery'
];

// Section IDs for navigation
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
  | 'awards'
  | 'brief'
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
  | 'imageassets'
  | 'misuse'
  | 'casestudies'
  | 'brochures'
  | 'templates'
  | 'templatespecs'
  | 'webinars'
  | 'products'
  | 'events'
  | 'universe'
  | 'sponsorlogos'
  | 'clientlogos'
  | 'locations'
  | 'insights'
  | 'eventsignage'
  | 'presentations'
  | 'socialmetrics'
  | 'approvedimagery'
  | 'studios';

// Insight item for the Insights & Updates section
export interface InsightItem {
  id: string;
  type: 'report' | 'analytics' | 'news' | 'update' | 'alert';
  title: string;
  summary: string;
  content?: string; // Rich text content
  value?: string; // Key metric value
  valueLabel?: string; // Label for the metric
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string; // e.g., "+12%"
  icon?: string; // Lucide icon name
  imageUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  date: string; // ISO date string
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

// Layout options for Insights section
export type InsightsLayout = 
  | 'cards'           // Standard card grid
  | 'infographic'     // Visual infographic with metrics
  | 'timeline'        // Chronological timeline
  | 'dashboard'       // Dashboard-style with metrics
  | 'featured';       // Featured item + supporting cards

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
