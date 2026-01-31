/**
 * BrandHub Demo Brand - Self-referential demo showcasing the platform itself
 * Shows users and viewers what BrandHub can do
 */

import type { BrandGuide, SectionId, BrandPageSettings } from '@/types/brand';
import brandHubLogo from '@/assets/brandhub-logo.png';

// BrandHub page settings - bold, modern tech aesthetic
const BRANDHUB_PAGE_SETTINGS: BrandPageSettings = {
  backgroundType: 'gradient',
  backgroundImage: '',
  backgroundColor: '',
  accentColor: '',
  animationTintColor: 'hsl(199, 89%, 48%)',
  animationSpeed: 'medium',
  showHeader: true,
  headerStyle: 'transparent',
  contentWidth: 'full',
  sectionSpacing: 'spacious',
  heroFullWidth: true,
  defaultTheme: 'dark',
  customPrimaryColor: '',
  customSecondaryColor: '',
};

// BrandHub Demo Brand
export const DEMO_BRAND_BRANDHUB: Omit<BrandGuide, 'createdAt' | 'updatedAt'> = {
  id: 'demo-brandhub',
  type: 'brand',
  slug: 'brandhub',
  isFavorite: true,
  isPublic: true,
  sectionOrder: [
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'logos', 'brandicon', 'colors', 'gradients',
    'typography', 'textstyles', 'imagery', 'social', 'website', 'signatures', 'qr', 'videos', 'assets', 'misuse',
  ] as SectionId[],
  hiddenSections: [],
  pageSettings: BRANDHUB_PAGE_SETTINGS,
  hero: {
    name: 'BrandHub',
    tagline: 'Create stunning live brand guides that stay up-to-date',
    coverImage: '',
    logoUrl: brandHubLogo,
  },
  tagline: {
    primary: 'Your brand. Always alive.',
    secondary: 'The modern platform for creating, managing, and sharing comprehensive brand identity systems.',
    variations: [
      'Live brand guides that evolve with you',
      'From colors to culture, all in one place',
      'Share your brand story, beautifully',
    ],
    fontSettings: {
      fontFamily: 'Poppins',
      fontWeight: '600',
      fontSize: 48,
      letterSpacing: -1,
      lineHeight: 1.2,
      textTransform: 'none',
      textAlign: 'center',
      fontStyle: 'normal',
    },
  },
  identity: {
    missionStatement: 'To empower teams and agencies to create, maintain, and share beautiful brand guidelines that stay current and accessible to everyone who needs them.',
    archetype: 'The Creator',
    toneOfVoice: ['Professional', 'Empowering', 'Clear', 'Innovative'],
  },
  values: [
    { 
      id: 'v1', 
      text: 'Always Live', 
      description: 'Changes sync instantly. No more outdated PDFs or email attachments. Your brand guide is always current.', 
      icon: 'Zap' 
    },
    { 
      id: 'v2', 
      text: 'Beautifully Simple', 
      description: 'Powerful features wrapped in an intuitive interface. Create professional guides without design expertise.', 
      icon: 'Sparkles' 
    },
    { 
      id: 'v3', 
      text: 'Share Anywhere', 
      description: 'One link, infinite reach. Share your brand guide with anyone—no account needed to view.', 
      icon: 'Globe' 
    },
    { 
      id: 'v4', 
      text: 'AI-Powered', 
      description: 'Smart suggestions, automated patterns, and brand analysis. AI that helps, not replaces, your creativity.', 
      icon: 'Brain' 
    },
  ],
  logos: [
    { id: 'l1', name: 'Primary Logo', url: brandHubLogo, variant: 'primary' },
    { id: 'l2', name: 'Icon Mark', url: brandHubLogo, variant: 'icon' },
    { id: 'l3', name: 'Monochrome', url: '', variant: 'monochrome' },
    { id: 'l4', name: 'Reversed', url: '', variant: 'reversed' },
  ],
  brandIcons: [
    { id: 'bi1', name: 'App Icon', url: brandHubLogo, settings: 'Primary brand mark for all applications', isPrimary: true },
    { id: 'bi2', name: 'Favicon', url: brandHubLogo, settings: 'Simplified mark for browser tabs', isVariation: true },
  ],
  colors: [
    { 
      id: 'c1', 
      name: 'BrandHub Cyan', 
      hex: '#0EA5E9', 
      rgb: 'rgb(14, 165, 233)', 
      usage: 'Primary accent color for CTAs, links, and key interactive elements', 
      role: 'primary', 
      pantone: 'PMS 2995 C',
      hsv: 'hsv(199, 94%, 91%)',
      cmyk: 'cmyk(94, 29, 0, 9)',
    },
    { 
      id: 'c2', 
      name: 'Deep Slate', 
      hex: '#0F172A', 
      rgb: 'rgb(15, 23, 42)', 
      usage: 'Dark mode backgrounds, hero sections, premium feel', 
      role: 'secondary', 
      pantone: 'PMS 433 C',
      hsv: 'hsv(222, 64%, 16%)',
      cmyk: 'cmyk(64, 45, 0, 84)',
    },
    { 
      id: 'c3', 
      name: 'Electric Teal', 
      hex: '#14B8A6', 
      rgb: 'rgb(20, 184, 166)', 
      usage: 'Success states, positive indicators, secondary accent', 
      role: 'accent', 
      pantone: 'PMS 3262 C',
    },
    { 
      id: 'c4', 
      name: 'Soft Gray', 
      hex: '#94A3B8', 
      rgb: 'rgb(148, 163, 184)', 
      usage: 'Secondary text, borders, muted elements', 
      role: 'neutral', 
      pantone: 'PMS 429 C',
    },
    { 
      id: 'c5', 
      name: 'Pure White', 
      hex: '#FFFFFF', 
      rgb: 'rgb(255, 255, 255)', 
      usage: 'Backgrounds, cards, light mode surfaces', 
      role: 'neutral', 
      pantone: 'PMS White',
    },
    { 
      id: 'c6', 
      name: 'Amber Glow', 
      hex: '#F59E0B', 
      rgb: 'rgb(245, 158, 11)', 
      usage: 'Warnings, highlights, premium features', 
      role: 'accent', 
      pantone: 'PMS 137 C',
    },
  ],
  colorCombinations: [
    { id: 'cc1', name: 'Primary Gradient', colors: ['#0EA5E9', '#14B8A6'], status: 'approved', notes: 'Main brand gradient for heroes and CTAs' },
    { id: 'cc2', name: 'Dark Mode', colors: ['#0F172A', '#0EA5E9'], status: 'approved', notes: 'High contrast for dark interfaces' },
    { id: 'cc3', name: 'Light Accent', colors: ['#FFFFFF', '#0EA5E9'], status: 'approved', notes: 'Clean, minimal light mode' },
    { id: 'cc4', name: 'Clashing Colors', colors: ['#F59E0B', '#14B8A6'], status: 'rejected', notes: 'These accent colors compete visually' },
    { id: 'cc5', name: 'Low Contrast', colors: ['#94A3B8', '#FFFFFF'], status: 'rejected', notes: 'Text readability fails WCAG guidelines' },
  ],
  gradients: [
    { id: 'g1', name: 'BrandHub Gradient', css: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)' },
    { id: 'g2', name: 'Dark Premium', css: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' },
    { id: 'g3', name: 'Radiant Glow', css: 'radial-gradient(ellipse at center, #0EA5E9 0%, transparent 70%)' },
    { id: 'g4', name: 'Sunset Accent', css: 'linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 50%, #F59E0B 100%)' },
  ],
  patterns: [],
  typography: [
    { id: 't1', name: 'Display', fontFamily: 'Poppins', weight: '600', usage: 'Headlines, hero sections, brand statements', role: 'display' },
    { id: 't2', name: 'Body', fontFamily: 'Inter', weight: '400', usage: 'Body text, descriptions, general content', role: 'body' },
    { id: 't3', name: 'UI', fontFamily: 'Inter', weight: '500', usage: 'Buttons, labels, navigation elements', role: 'body' },
  ],
  textStyles: [
    { id: 'ts1', tag: 'H1', size: '48px', weight: '600', lineHeight: '1.2' },
    { id: 'ts2', tag: 'H2', size: '36px', weight: '600', lineHeight: '1.3' },
    { id: 'ts3', tag: 'H3', size: '24px', weight: '500', lineHeight: '1.4' },
    { id: 'ts4', tag: 'Body', size: '16px', weight: '400', lineHeight: '1.6' },
    { id: 'ts5', tag: 'Small', size: '14px', weight: '400', lineHeight: '1.5' },
  ],
  iconography: [],
  socialIcons: [],
  imagery: [
    { id: 'im1', url: '', type: 'do', description: 'Use clean, modern interface screenshots showing the platform in action' },
    { id: 'im2', url: '', type: 'do', description: 'Abstract tech patterns with cyan and teal gradients work well' },
    { id: 'im3', url: '', type: 'do', description: 'Show real brand guides in context - desktop and mobile views' },
    { id: 'im4', url: '', type: 'dont', description: 'Avoid generic stock photos of "business people looking at screens"' },
    { id: 'im5', url: '', type: 'dont', description: 'Never use pixelated or low-resolution screenshots' },
  ],
  social: [
    { id: 's1', platform: 'Twitter', handle: '@BrandHubApp', url: 'https://twitter.com/brandhubapp', color: '#1DA1F2' },
    { id: 's2', platform: 'LinkedIn', handle: 'BrandHub', url: 'https://linkedin.com/company/brandhub', color: '#0A66C2' },
  ],
  websites: [
    { id: 'w1', label: 'Main Platform', url: 'https://brandhubcreator.lovable.app' },
    { id: 'w2', label: 'Documentation', url: 'https://docs.brandhub.io' },
  ],
  signatures: [
    { 
      id: 'sig1', 
      name: 'BrandHub Team', 
      role: 'Product Team', 
      html: `<table cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px;">
  <tr>
    <td style="padding-bottom: 12px; border-bottom: 2px solid #0EA5E9;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #0F172A;">[NAME]</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #0EA5E9; font-weight: 500;">[ROLE]</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0;">
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748B;">
        <span style="color: #0EA5E9;">✉</span> [EMAIL]
      </p>
      <p style="margin: 0; font-size: 13px; color: #64748B;">
        <span style="color: #0EA5E9;">🌐</span> [WEBSITE]
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 10px; border-top: 1px solid #E2E8F0;">
      <p style="margin: 0; font-size: 11px; color: #94A3B8;">Create stunning live brand guides → brandhubcreator.lovable.app</p>
    </td>
  </tr>
</table>`, 
      company: 'BrandHub',
      email: 'hello@brandhub.io',
      phone: '',
      website: 'brandhubcreator.lovable.app',
      variant: 'full',
    },
  ],
  qr: {
    defaultUrl: 'https://brandhubcreator.lovable.app',
    fgColor: '#0EA5E9',
    bgColor: '#FFFFFF',
  },
  videos: [
    { id: 'vid1', title: 'Platform Overview', url: '', type: 'youtube', description: 'See how BrandHub works in 2 minutes' },
  ],
  assets: [],
  misuse: [
    { id: 'm1', url: '', description: 'Do not stretch or distort the BrandHub logo' },
    { id: 'm2', url: '', description: 'Do not use the logo on busy or patterned backgrounds' },
    { id: 'm3', url: '', description: 'Do not change the logo colors outside approved variants' },
  ],
  atmosphere: {
    style: 'tech',
    animate: true,
    opacity: 0.3,
    blur: 60,
  },
  caseStudies: [],
  brochures: [],
  templates: [],
  services: [
    { id: 'srv1', name: 'Brand Guides', description: 'Create comprehensive, living brand guidelines that everyone can access', icon: 'BookOpen' },
    { id: 'srv2', name: 'Product Guides', description: 'Document product-specific branding with hierarchical organization', icon: 'Package' },
    { id: 'srv3', name: 'Event Kits', description: 'Build event-specific branding with schedules and sponsor management', icon: 'Calendar' },
    { id: 'srv4', name: 'AI Analysis', description: 'Get intelligent insights about your brand with AI-powered analysis', icon: 'Brain' },
    { id: 'srv5', name: 'Team Collaboration', description: 'Invite team members and manage permissions with role-based access', icon: 'Users' },
    { id: 'srv6', name: 'PDF Export', description: 'Generate professional PDF brand books from your guides instantly', icon: 'FileText' },
  ],
  statistics: [
    { id: 'stat1', value: '15', suffix: '+', label: 'Section Types', icon: 'Layers', category: 'primary' },
    { id: 'stat2', value: '100', suffix: '%', label: 'Cloud Synced', icon: 'Cloud', category: 'primary' },
    { id: 'stat3', value: '0', suffix: '', label: 'PDFs to Email', icon: 'FileX', category: 'primary' },
    { id: 'stat4', value: '∞', suffix: '', label: 'Team Members', icon: 'Users', category: 'secondary' },
  ],
  infographicLayout: 'cards',
};

// Platform feature highlights for the tour section
export const PLATFORM_FEATURES = [
  {
    id: 'create',
    title: 'Create',
    description: 'Build comprehensive brand guides with 15+ section types',
    icon: 'Plus',
    color: '#0EA5E9',
    details: [
      'Color palettes with Pantone matching',
      'Typography scales and font pairings',
      'Logo variants and usage guidelines',
      'Visual direction and imagery',
      'Brand values and voice',
    ],
  },
  {
    id: 'collaborate',
    title: 'Collaborate',
    description: 'Invite your team with role-based permissions',
    icon: 'Users',
    color: '#14B8A6',
    details: [
      'Real-time sync across devices',
      'Owner, admin, and member roles',
      'Organization-wide asset libraries',
      'Comment and feedback (coming soon)',
    ],
  },
  {
    id: 'share',
    title: 'Share',
    description: 'One link gives anyone instant access',
    icon: 'Share2',
    color: '#8B5CF6',
    details: [
      'No account needed to view',
      'Public or private guides',
      'Organization portal pages',
      'PDF export for offline access',
    ],
  },
  {
    id: 'analyze',
    title: 'Analyze',
    description: 'AI-powered brand intelligence and insights',
    icon: 'Brain',
    color: '#F59E0B',
    details: [
      'Brand health scoring',
      'Market positioning analysis',
      'Competitive insights',
      'Growth recommendations',
    ],
  },
];

// User vs Viewer comparison data
export const USER_VIEWER_COMPARISON = {
  users: {
    title: 'For Creators',
    subtitle: 'Brand managers, designers, and marketing teams',
    capabilities: [
      { icon: 'Plus', label: 'Create and edit brand guides' },
      { icon: 'Upload', label: 'Upload logos, images, and assets' },
      { icon: 'Palette', label: 'Define colors with Pantone matching' },
      { icon: 'Type', label: 'Set typography and text styles' },
      { icon: 'Brain', label: 'Generate AI-powered analysis' },
      { icon: 'Users', label: 'Invite and manage team members' },
      { icon: 'Settings', label: 'Configure organization settings' },
      { icon: 'FileText', label: 'Export professional PDFs' },
    ],
  },
  viewers: {
    title: 'For Viewers',
    subtitle: 'Partners, vendors, and external stakeholders',
    capabilities: [
      { icon: 'Eye', label: 'View complete brand guidelines' },
      { icon: 'Download', label: 'Download approved assets' },
      { icon: 'Copy', label: 'Copy color codes and values' },
      { icon: 'Bookmark', label: 'Navigate organized sections' },
      { icon: 'Smartphone', label: 'Access on any device' },
      { icon: 'Lock', label: 'No account required' },
      { icon: 'Search', label: 'Search within guides' },
      { icon: 'QrCode', label: 'Scan QR codes for quick access' },
    ],
  },
};
