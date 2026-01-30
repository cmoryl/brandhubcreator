// Pre-populated demo brand, product, and event guides with sample imagery, colors, typography, and logos
// These showcase the full capabilities of BrandHub

import type { BrandGuide, ProductGuide, SectionId, BrandPageSettings } from '@/types/brand';
import type { EventGuide, EventSectionId } from '@/types/event';

// Default demo page settings with full-width hero and spacious layout
const DEMO_PAGE_SETTINGS: BrandPageSettings = {
  backgroundType: 'inherit',
  backgroundImage: '',
  backgroundColor: '',
  accentColor: '',
  animationTintColor: '',
  animationSpeed: 'medium',
  showHeader: true,
  headerStyle: 'default',
  contentWidth: 'wide',
  sectionSpacing: 'spacious',
  heroFullWidth: true,
  defaultTheme: 'system',
  customPrimaryColor: '',
  customSecondaryColor: '',
};

// Demo Brand 1: Nexus Tech - Modern Tech Company
export const DEMO_BRAND_NEXUS: Omit<BrandGuide, 'createdAt' | 'updatedAt'> = {
  id: 'demo-nexus-tech',
  type: 'brand',
  slug: 'demo-nexus-tech',
  isFavorite: false,
  isPublic: true,
  sectionOrder: [
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'logos', 'brandicon', 'colors', 'gradients', 'patterns',
    'typography', 'textstyles', 'imagery', 'social', 'website', 'signatures', 'qr', 'videos', 'assets', 'misuse',
    'casestudies', 'brochures', 'templates'
  ] as SectionId[],
  hiddenSections: [],
  pageSettings: DEMO_PAGE_SETTINGS,
  hero: {
    name: 'Nexus Tech',
    tagline: 'Building tomorrow\'s digital infrastructure today',
    coverImage: '/images/demos/card-nexus-tech.jpg',
    logoUrl: '/images/demos/logo-nexus-tech.png',
  },
  tagline: {
    primary: 'Innovate. Connect. Transform.',
    secondary: 'Empowering businesses through cutting-edge technology solutions',
    variations: ['Future-proof your business', 'Technology that works for you', 'Your digital transformation partner'],
    fontSettings: {
      fontFamily: 'Inter',
      fontWeight: '700',
      fontSize: 48,
      letterSpacing: -1,
      lineHeight: 1.2,
      textTransform: 'none',
      textAlign: 'center',
      fontStyle: 'normal',
    },
  },
  identity: {
    missionStatement: 'To democratize access to enterprise-grade technology, enabling businesses of all sizes to compete and thrive in the digital economy.',
    archetype: 'The Sage',
    toneOfVoice: ['Confident', 'Innovative', 'Approachable', 'Expert'],
  },
  values: [
    { id: 'v1', text: 'Innovation First', description: 'We constantly push boundaries and embrace new technologies to deliver cutting-edge solutions.', icon: 'Lightbulb' },
    { id: 'v2', text: 'Customer Success', description: 'Your success is our success. We partner with you to achieve your business goals.', icon: 'Target' },
    { id: 'v3', text: 'Integrity', description: 'We operate with transparency and honesty in every interaction.', icon: 'Shield' },
    { id: 'v4', text: 'Collaboration', description: 'Great things happen when talented people work together towards a common goal.', icon: 'Users' },
  ],
  logos: [
    { id: 'l1', name: 'Primary Logo', url: '/images/demos/logo-nexus-tech.png', variant: 'primary' },
    { id: 'l2', name: 'Icon Mark', url: '/images/demos/logo-nexus-tech.png', variant: 'icon' },
    { id: 'l3', name: 'Wordmark', url: '', variant: 'wordmark' },
    { id: 'l4', name: 'Reversed', url: '', variant: 'reversed' },
  ],
  brandIcons: [
    { id: 'bi1', name: 'Primary Symbol', url: '/images/demos/logo-nexus-tech.png', settings: 'Main brand mark', isPrimary: true },
    { id: 'bi2', name: 'App Icon', url: '/images/demos/logo-nexus-tech.png', settings: 'For mobile applications', isVariation: true },
  ],
  colors: [
    { id: 'c1', name: 'Nexus Blue', hex: '#0066FF', rgb: 'rgb(0, 102, 255)', usage: 'Primary brand color, CTAs, key elements', role: 'primary', pantone: 'PMS 2728 C' },
    { id: 'c2', name: 'Deep Navy', hex: '#0A1628', rgb: 'rgb(10, 22, 40)', usage: 'Headlines, body text, dark backgrounds', role: 'secondary', pantone: 'PMS 296 C' },
    { id: 'c3', name: 'Electric Cyan', hex: '#00D4FF', rgb: 'rgb(0, 212, 255)', usage: 'Accents, highlights, interactive elements', role: 'accent', pantone: 'PMS 306 C' },
    { id: 'c4', name: 'Cloud White', hex: '#F8FAFC', rgb: 'rgb(248, 250, 252)', usage: 'Backgrounds, cards, light surfaces', role: 'neutral', pantone: 'PMS 663 C' },
    { id: 'c5', name: 'Slate Gray', hex: '#64748B', rgb: 'rgb(100, 116, 139)', usage: 'Secondary text, borders, subtle elements', role: 'neutral', pantone: 'PMS 430 C' },
  ],
  colorCombinations: [
    { id: 'cc1', name: 'Primary Duo', colors: ['#0066FF', '#00D4FF'], status: 'approved', notes: 'Main gradient combination' },
    { id: 'cc2', name: 'Corporate', colors: ['#0A1628', '#0066FF'], status: 'approved', notes: 'For formal presentations' },
  ],
  gradients: [
    { id: 'g1', name: 'Nexus Gradient', css: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)' },
    { id: 'g2', name: 'Dark Tech', css: 'linear-gradient(180deg, #0A1628 0%, #1E3A5F 100%)' },
    { id: 'g3', name: 'Aurora', css: 'linear-gradient(135deg, #0066FF 0%, #8B5CF6 50%, #00D4FF 100%)' },
  ],
  patterns: [
    { id: 'p1', name: 'Hexagonal Network', url: '/images/demos/pattern-nexus-tech.jpg' },
    { id: 'p2', name: 'Circuit Nodes', url: '/images/demos/pattern-nexus-tech.jpg' },
  ],
  typography: [
    { id: 't1', name: 'Display', fontFamily: 'Inter', weight: '700', usage: 'Headlines, hero sections, key statements', role: 'display' },
    { id: 't2', name: 'Body', fontFamily: 'Inter', weight: '400', usage: 'Body text, paragraphs, general content', role: 'body' },
    { id: 't3', name: 'Mono', fontFamily: 'JetBrains Mono', weight: '500', usage: 'Code snippets, technical content', role: 'body' },
  ],
  textStyles: [
    { id: 'ts1', tag: 'H1', size: '48px', weight: '700', lineHeight: '1.2' },
    { id: 'ts2', tag: 'H2', size: '36px', weight: '600', lineHeight: '1.3' },
    { id: 'ts3', tag: 'H3', size: '24px', weight: '600', lineHeight: '1.4' },
    { id: 'ts4', tag: 'Body', size: '16px', weight: '400', lineHeight: '1.6' },
    { id: 'ts5', tag: 'Caption', size: '14px', weight: '500', lineHeight: '1.5' },
  ],
  iconography: [
    { id: 'i1', name: 'Cloud', svgPath: 'M3 8.5a6.5 6.5 0 1 1 13 0 5.5 5.5 0 1 1 0 11H6a5 5 0 1 1 0-10', category: 'Services' },
    { id: 'i2', name: 'Shield', svgPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10', category: 'Security' },
  ],
  socialIcons: [],
  imagery: [
    { id: 'im1', url: '/images/demos/imagery-nexus-do-1.jpg', type: 'do', description: 'Use high-quality abstract tech imagery with blue tones and glowing elements' },
    { id: 'im2', url: '/images/demos/imagery-nexus-do-2.jpg', type: 'do', description: 'Digital circuit patterns and futuristic geometric designs work well' },
    { id: 'im3', url: '/images/demos/social-nexus-linkedin.jpg', type: 'do', description: 'LinkedIn company page with tech-forward banner and professional layout' },
    { id: 'im4', url: '/images/demos/social-nexus-twitter.jpg', type: 'do', description: 'Twitter/X profile showcasing dark mode tech aesthetic with circuit patterns' },
    { id: 'im5', url: '', type: 'dont', description: 'Avoid cluttered or outdated technology images' },
  ],
  social: [
    { id: 's1', platform: 'LinkedIn', handle: '@nexustech', url: 'https://linkedin.com/company/nexustech', color: '#0A66C2' },
    { id: 's2', platform: 'Twitter', handle: '@nexustech', url: 'https://twitter.com/nexustech', color: '#1DA1F2' },
    { id: 's3', platform: 'GitHub', handle: '@nexustech', url: 'https://github.com/nexustech', color: '#181717' },
  ],
  websites: [
    { id: 'w1', label: 'Main Website', url: 'https://nexustech.com' },
    { id: 'w2', label: 'Developer Portal', url: 'https://developers.nexustech.com' },
  ],
  signatures: [
    { 
      id: 'sig1', 
      name: 'Alex Chen', 
      role: 'CEO & Founder', 
      html: `<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; max-width: 550px;">
  <tr>
    <td style="padding-bottom: 12px; border-bottom: 2px solid #00D4FF;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0A1628;">[NAME]</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #0066FF; font-weight: 500;">[ROLE]</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 15px 0;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right: 20px; vertical-align: top;">
            <img src="[LOGO_URL]" alt="[COMPANY]" width="100" height="100" style="display: block;">
          </td>
          <td style="vertical-align: top;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0A1628;">[COMPANY]</p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">[ADDRESS]</p>
            <p style="margin: 8px 0 2px 0; font-size: 12px; color: #666;"><span style="color: #0066FF; font-weight: bold;">P:</span> [PHONE]</p>
            <p style="margin: 2px 0; font-size: 12px; color: #666;"><span style="color: #0066FF; font-weight: bold;">E:</span> [EMAIL]</p>
            <p style="margin: 2px 0; font-size: 12px; color: #666;"><span style="color: #0066FF; font-weight: bold;">W:</span> [WEBSITE]</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 10px; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 9px; color: #999; line-height: 1.4;">[CONFIDENTIALITY]</p>
    </td>
  </tr>
</table>`, 
      company: 'Nexus Tech',
      email: 'alex@nexustech.com',
      phone: '+1 (555) 123-4567',
      website: 'nexustech.com',
      address: '500 Innovation Drive, San Francisco, CA 94105',
      logoUrl: '/images/demos/logo-nexus-tech.png',
      variant: 'full',
      confidentialityNotice: 'CONFIDENTIALITY NOTICE: This email contains confidential information intended only for the recipient specified. If you received this in error, please delete it immediately.',
    },
    { 
      id: 'sig2', 
      name: 'Alex Chen', 
      role: 'CEO & Founder', 
      html: `<div style="font-family: Arial, sans-serif; font-size: 12px; color: #333;">
  <p style="margin: 0; font-weight: bold;">[NAME]</p>
  <p style="margin: 2px 0; color: #666;">[ROLE] | [COMPANY]</p>
  <p style="margin: 8px 0 0 0; color: #999;">[EMAIL] | [PHONE]</p>
</div>`, 
      company: 'Nexus Tech',
      email: 'alex@nexustech.com',
      phone: '+1 (555) 123-4567',
      website: 'nexustech.com',
      variant: 'minimal',
    },
    { 
      id: 'sig3', 
      name: 'Jordan Park', 
      role: 'VP of Engineering', 
      html: `<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; max-width: 550px;">
  <tr>
    <td style="padding-bottom: 12px; border-bottom: 2px solid #00D4FF;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0A1628;">[NAME]</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #0066FF; font-weight: 500;">[ROLE]</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 15px 0;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right: 20px; vertical-align: top;">
            <img src="[LOGO_URL]" alt="[COMPANY]" width="100" height="100" style="display: block;">
          </td>
          <td style="vertical-align: top;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0A1628;">[COMPANY]</p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">[ADDRESS]</p>
            <p style="margin: 8px 0 2px 0; font-size: 12px; color: #666;"><span style="color: #0066FF; font-weight: bold;">P:</span> [PHONE]</p>
            <p style="margin: 2px 0; font-size: 12px; color: #666;"><span style="color: #0066FF; font-weight: bold;">E:</span> [EMAIL]</p>
            <p style="margin: 2px 0; font-size: 12px; color: #666;"><span style="color: #0066FF; font-weight: bold;">W:</span> [WEBSITE]</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`, 
      company: 'Nexus Tech',
      email: 'jordan@nexustech.com',
      phone: '+1 (555) 987-6543',
      website: 'nexustech.com',
      address: '500 Innovation Drive, San Francisco, CA 94105',
      logoUrl: '/images/demos/logo-nexus-tech.png',
      variant: 'full',
    },
    { 
      id: 'sig4', 
      name: 'Jordan Park', 
      role: 'VP of Engineering', 
      html: `<div style="font-family: Arial, sans-serif; font-size: 12px; color: #333;">
  <p style="margin: 0; font-weight: bold;">[NAME]</p>
  <p style="margin: 2px 0; color: #666;">[ROLE] | [COMPANY]</p>
  <p style="margin: 8px 0 0 0; color: #999;">[EMAIL] | [PHONE]</p>
</div>`, 
      company: 'Nexus Tech',
      email: 'jordan@nexustech.com',
      phone: '+1 (555) 987-6543',
      website: 'nexustech.com',
      variant: 'minimal',
    },
  ],
  qr: {
    defaultUrl: 'https://nexustech.com',
    fgColor: '#0066FF',
    bgColor: '#FFFFFF',
  },
  videos: [
    { id: 'vid1', title: 'Brand Story', url: 'https://www.youtube.com/watch?v=example1', type: 'youtube', description: 'Our journey and mission' },
    { id: 'vid2', title: 'Product Overview', url: 'https://www.youtube.com/watch?v=example2', type: 'youtube', description: 'Platform walkthrough' },
  ],
  assets: [
    { id: 'a1', name: 'Logo Pack', type: 'zip', url: '', size: '2.5 MB' },
    { id: 'a2', name: 'Brand Guidelines PDF', type: 'pdf', url: '', size: '8.2 MB' },
  ],
  misuse: [
    { id: 'm1', url: '', description: 'Do not stretch or distort the logo' },
    { id: 'm2', url: '', description: 'Do not use unapproved color combinations' },
  ],
  atmosphere: {
    style: 'tech',
    animate: true,
    opacity: 0.3,
    blur: 60,
  },
  caseStudies: [
    { id: 'cs1', title: 'Enterprise Cloud Migration', description: 'How we helped Fortune 500 companies transition to cloud infrastructure', previewUrl: '' },
    { id: 'cs2', title: 'Startup Scale-up', description: 'Supporting rapid growth with scalable solutions', previewUrl: '' },
  ],
  brochures: [
    { id: 'br1', title: 'Company Overview', category: 'Corporate', previewUrl: '' },
    { id: 'br2', title: 'Product Catalog 2024', category: 'Products', previewUrl: '' },
  ],
  templates: [
    { id: 'tmp1', name: 'Presentation Template', fileType: 'pptx', fileSize: '5.2 MB' },
    { id: 'tmp2', name: 'Letterhead', fileType: 'docx', fileSize: '1.1 MB' },
  ],
  services: [
    { id: 'srv1', name: 'Cloud Infrastructure', description: 'Enterprise-grade cloud solutions tailored to your needs', icon: 'Cloud' },
    { id: 'srv2', name: 'Cybersecurity', description: 'Comprehensive security solutions to protect your business', icon: 'Shield' },
    { id: 'srv3', name: 'AI & Analytics', description: 'Unlock insights with machine learning and data analytics', icon: 'Brain' },
    { id: 'srv4', name: 'Digital Transformation', description: 'End-to-end digital transformation consulting', icon: 'Rocket' },
  ],
  statistics: [
    { id: 'stat1', value: '500', suffix: '+', label: 'Enterprise Clients', icon: 'Building2', category: 'primary' },
    { id: 'stat2', value: '99.9', suffix: '%', label: 'Uptime SLA', icon: 'Shield', category: 'primary' },
    { id: 'stat3', value: '50', suffix: 'M+', label: 'API Calls Daily', icon: 'Zap', category: 'primary' },
    { id: 'stat4', value: '15', label: 'Global Data Centers', icon: 'Globe', category: 'secondary' },
  ],
  infographicLayout: 'cards',
  revenueData: [
    { year: 2020, revenue: 45, facts: ['Series A funding'] },
    { year: 2021, revenue: 120, facts: ['100 employees'] },
    { year: 2022, revenue: 280, facts: ['Enterprise launch'] },
    { year: 2023, revenue: 450, facts: ['Global expansion'] },
    { year: 2024, revenue: 720, facts: ['IPO planned'] },
  ],
};

// Demo Brand 2: Bloom Wellness - Health & Lifestyle Brand
export const DEMO_BRAND_BLOOM: Omit<BrandGuide, 'createdAt' | 'updatedAt'> = {
  id: 'demo-bloom-wellness',
  type: 'brand',
  slug: 'demo-bloom-wellness',
  isFavorite: false,
  isPublic: true,
  sectionOrder: [
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'logos', 'colors', 'gradients', 'patterns',
    'typography', 'imagery', 'social', 'website', 'qr'
  ] as SectionId[],
  hiddenSections: [],
  pageSettings: DEMO_PAGE_SETTINGS,
  hero: {
    name: 'Bloom Wellness',
    tagline: 'Nurturing your journey to holistic well-being',
    coverImage: '/images/demos/card-bloom-wellness.jpg',
    logoUrl: '/images/demos/logo-bloom-wellness.png',
  },
  tagline: {
    primary: 'Grow into your best self',
    secondary: 'Natural wellness solutions for mind, body, and soul',
    variations: ['Wellness, naturally', 'Your wellness journey starts here', 'Live well, bloom daily'],
    fontSettings: {
      fontFamily: 'Playfair Display',
      fontWeight: '600',
      fontSize: 42,
      letterSpacing: 0,
      lineHeight: 1.3,
      textTransform: 'none',
      textAlign: 'center',
      fontStyle: 'normal',
    },
  },
  identity: {
    missionStatement: 'To inspire and empower individuals to embrace a holistic approach to wellness, connecting them with nature\'s healing power through sustainable, mindfully-crafted products.',
    archetype: 'The Caregiver',
    toneOfVoice: ['Warm', 'Nurturing', 'Authentic', 'Inspiring'],
  },
  values: [
    { id: 'v1', text: 'Natural Purity', description: 'We source only the finest organic ingredients from sustainable farms.', icon: 'Leaf' },
    { id: 'v2', text: 'Mindful Living', description: 'Every product is designed to enhance your daily wellness rituals.', icon: 'Heart' },
    { id: 'v3', text: 'Sustainability', description: 'Eco-friendly practices in every step of our process.', icon: 'Recycle' },
    { id: 'v4', text: 'Community', description: 'Building a supportive community of wellness seekers.', icon: 'Users' },
  ],
  logos: [
    { id: 'l1', name: 'Primary Logo', url: '/images/demos/logo-bloom-wellness.png', variant: 'primary' },
    { id: 'l2', name: 'Leaf Mark', url: '/images/demos/logo-bloom-wellness.png', variant: 'icon' },
    { id: 'l3', name: 'Wordmark', url: '', variant: 'wordmark' },
  ],
  brandIcons: [
    { id: 'bi1', name: 'Bloom Symbol', url: '/images/demos/logo-bloom-wellness.png', settings: 'Main brand mark', isPrimary: true },
  ],
  colors: [
    { id: 'c1', name: 'Sage Green', hex: '#7CB342', rgb: 'rgb(124, 179, 66)', usage: 'Primary brand color, natural elements', role: 'primary', pantone: 'PMS 576 C' },
    { id: 'c2', name: 'Warm Earth', hex: '#8D6E63', rgb: 'rgb(141, 110, 99)', usage: 'Grounding elements, organic feel', role: 'secondary', pantone: 'PMS 4715 C' },
    { id: 'c3', name: 'Soft Lavender', hex: '#B39DDB', rgb: 'rgb(179, 157, 219)', usage: 'Calm accents, wellness themes', role: 'accent', pantone: 'PMS 2705 C' },
    { id: 'c4', name: 'Cream', hex: '#FFF8E7', rgb: 'rgb(255, 248, 231)', usage: 'Backgrounds, soft surfaces', role: 'neutral', pantone: 'PMS 7499 C' },
    { id: 'c5', name: 'Deep Forest', hex: '#2E7D32', rgb: 'rgb(46, 125, 50)', usage: 'Strong accents, emphasis', role: 'secondary', pantone: 'PMS 357 C' },
  ],
  colorCombinations: [
    { id: 'cc1', name: 'Nature Duo', colors: ['#7CB342', '#2E7D32'], status: 'approved', notes: 'Primary nature palette' },
  ],
  gradients: [
    { id: 'g1', name: 'Morning Bloom', css: 'linear-gradient(135deg, #7CB342 0%, #B39DDB 100%)' },
    { id: 'g2', name: 'Sunset Wellness', css: 'linear-gradient(180deg, #FFF8E7 0%, #FFE0B2 100%)' },
  ],
  patterns: [
    { id: 'p1', name: 'Botanical Leaves', url: '/images/demos/pattern-bloom-wellness.jpg' },
    { id: 'p2', name: 'Fern & Eucalyptus', url: '/images/demos/pattern-bloom-wellness.jpg' },
  ],
  typography: [
    { id: 't1', name: 'Display', fontFamily: 'Playfair Display', weight: '600', usage: 'Headlines, hero sections', role: 'display' },
    { id: 't2', name: 'Body', fontFamily: 'Lato', weight: '400', usage: 'Body text, paragraphs', role: 'body' },
  ],
  textStyles: [
    { id: 'ts1', tag: 'H1', size: '42px', weight: '600', lineHeight: '1.3' },
    { id: 'ts2', tag: 'H2', size: '32px', weight: '600', lineHeight: '1.4' },
    { id: 'ts3', tag: 'Body', size: '16px', weight: '400', lineHeight: '1.7' },
  ],
  iconography: [],
  socialIcons: [],
  imagery: [
    { id: 'im1', url: '/images/demos/imagery-bloom-do-1.jpg', type: 'do', description: 'Use serene botanical close-ups with soft natural lighting' },
    { id: 'im2', url: '/images/demos/imagery-bloom-do-2.jpg', type: 'do', description: 'Organic flat lays with herbs and natural textures' },
    { id: 'im3', url: '/images/demos/social-bloom-instagram.jpg', type: 'do', description: 'Instagram profile with botanical aesthetic and wellness lifestyle grid' },
    { id: 'im4', url: '/images/demos/social-bloom-linkedin.jpg', type: 'do', description: 'LinkedIn company page with professional green botanical theme' },
    { id: 'im5', url: '', type: 'dont', description: 'Avoid artificial or overly processed imagery' },
  ],
  social: [
    { id: 's1', platform: 'Instagram', handle: '@bloomwellness', url: 'https://instagram.com/bloomwellness', color: '#E4405F' },
    { id: 's2', platform: 'Pinterest', handle: '@bloomwellness', url: 'https://pinterest.com/bloomwellness', color: '#BD081C' },
  ],
  websites: [
    { id: 'w1', label: 'Main Website', url: 'https://bloomwellness.com' },
  ],
  signatures: [
    { 
      id: 'sig1', 
      name: 'Maya Rivera', 
      role: 'Founder & Wellness Director', 
      html: `<table cellpadding="0" cellspacing="0" style="font-family: Georgia, serif; max-width: 550px;">
  <tr>
    <td style="padding-bottom: 12px; border-bottom: 2px solid #7CB342;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2E7D32;">[NAME]</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #7CB342; font-weight: 500;">[ROLE]</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 15px 0;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right: 20px; vertical-align: top;">
            <img src="[LOGO_URL]" alt="[COMPANY]" width="100" height="100" style="display: block;">
          </td>
          <td style="vertical-align: top;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #2E7D32;">[COMPANY]</p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">[ADDRESS]</p>
            <p style="margin: 8px 0 2px 0; font-size: 12px; color: #666;"><span style="color: #7CB342; font-weight: bold;">P:</span> [PHONE]</p>
            <p style="margin: 2px 0; font-size: 12px; color: #666;"><span style="color: #7CB342; font-weight: bold;">E:</span> [EMAIL]</p>
            <p style="margin: 2px 0; font-size: 12px; color: #666;"><span style="color: #7CB342; font-weight: bold;">W:</span> [WEBSITE]</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 10px; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 9px; color: #999; line-height: 1.4; font-style: italic;">Nurturing your journey to holistic well-being 🌿</p>
    </td>
  </tr>
</table>`, 
      company: 'Bloom Wellness',
      email: 'maya@bloomwellness.com',
      phone: '+1 (555) 234-5678',
      website: 'bloomwellness.com',
      address: '123 Serenity Lane, Boulder, CO 80302',
      logoUrl: '/images/demos/logo-bloom-wellness.png',
      variant: 'full',
    },
    { 
      id: 'sig2', 
      name: 'Maya Rivera', 
      role: 'Founder & Wellness Director', 
      html: `<div style="font-family: Georgia, serif; font-size: 12px; color: #333;">
  <p style="margin: 0; font-weight: bold;">[NAME]</p>
  <p style="margin: 2px 0; color: #666;">[ROLE] | [COMPANY]</p>
  <p style="margin: 8px 0 0 0; color: #999;">[EMAIL] | [PHONE]</p>
</div>`, 
      company: 'Bloom Wellness',
      email: 'maya@bloomwellness.com',
      phone: '+1 (555) 234-5678',
      website: 'bloomwellness.com',
      variant: 'minimal',
    },
  ],
  qr: {
    defaultUrl: 'https://bloomwellness.com',
    fgColor: '#7CB342',
    bgColor: '#FFFFFF',
  },
  videos: [],
  assets: [],
  misuse: [],
  atmosphere: {
    style: 'organic',
    animate: true,
    opacity: 0.2,
    blur: 80,
  },
  caseStudies: [],
  brochures: [],
  templates: [],
  services: [
    { id: 'srv1', name: 'Wellness Coaching', description: 'Personalized guidance for your wellness journey', icon: 'Heart' },
    { id: 'srv2', name: 'Organic Products', description: 'Premium organic wellness products', icon: 'Leaf' },
    { id: 'srv3', name: 'Retreat Programs', description: 'Immersive wellness retreat experiences', icon: 'Sunrise' },
  ],
  statistics: [
    { id: 'stat1', value: '100', suffix: '%', label: 'Organic Ingredients', icon: 'Leaf', category: 'primary' },
    { id: 'stat2', value: '50K', suffix: '+', label: 'Happy Customers', icon: 'Heart', category: 'primary' },
    { id: 'stat3', value: '12', label: 'Wellness Retreats', icon: 'MapPin', category: 'secondary' },
  ],
};

// Demo Product: Nexus Cloud Platform
export const DEMO_PRODUCT_CLOUD: Omit<ProductGuide, 'createdAt' | 'updatedAt'> = {
  id: 'demo-nexus-cloud',
  type: 'product',
  slug: 'demo-nexus-cloud',
  parentBrandId: 'demo-nexus-tech',
  isFavorite: false,
  isPublic: true,
  sectionOrder: [
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'logos', 'colors', 'gradients', 'patterns', 'typography', 'imagery'
  ] as SectionId[],
  hiddenSections: [],
  pageSettings: DEMO_PAGE_SETTINGS,
  hero: {
    name: 'Nexus Cloud',
    tagline: 'Enterprise cloud infrastructure that scales with you',
    coverImage: '/images/demos/hero-nexus-cloud.jpg',
    logoUrl: '/images/demos/logo-nexus-cloud.png',
  },
  tagline: {
    primary: 'Scale without limits',
    secondary: 'Deploy, manage, and scale applications with enterprise-grade reliability',
    variations: ['Cloud-native by design', 'Infrastructure reimagined'],
  },
  identity: {
    missionStatement: 'To provide developers and enterprises with the most reliable, scalable, and secure cloud infrastructure platform.',
    archetype: 'The Sage',
    toneOfVoice: ['Technical', 'Reliable', 'Innovative'],
  },
  values: [
    { id: 'v1', text: 'Reliability', description: '99.99% uptime guarantee', icon: 'Shield' },
    { id: 'v2', text: 'Performance', description: 'Lightning-fast global infrastructure', icon: 'Zap' },
    { id: 'v3', text: 'Security', description: 'Enterprise-grade security by default', icon: 'Lock' },
  ],
  logos: [
    { id: 'l1', name: 'Nexus Cloud Logo', url: '/images/demos/logo-nexus-cloud.png', variant: 'primary' },
    { id: 'l2', name: 'Cloud Icon', url: '/images/demos/logo-nexus-cloud.png', variant: 'icon' },
  ],
  brandIcons: [
    { id: 'bi1', name: 'Cloud Symbol', url: '/images/demos/logo-nexus-cloud.png', settings: 'Product icon', isPrimary: true },
  ],
  colors: [
    { id: 'c1', name: 'Cloud Blue', hex: '#3B82F6', rgb: 'rgb(59, 130, 246)', usage: 'Primary product color', role: 'primary', pantone: 'PMS 2727 C' },
    { id: 'c2', name: 'Deep Space', hex: '#1E293B', rgb: 'rgb(30, 41, 59)', usage: 'Dark UI elements', role: 'secondary', pantone: 'PMS 289 C' },
    { id: 'c3', name: 'Electric Teal', hex: '#14B8A6', rgb: 'rgb(20, 184, 166)', usage: 'Success states, highlights', role: 'accent', pantone: 'PMS 3262 C' },
  ],
  colorCombinations: [],
  gradients: [
    { id: 'g1', name: 'Cloud Gradient', css: 'linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%)' },
  ],
  patterns: [
    { id: 'p1', name: 'Cloud Infrastructure', url: '/images/demos/pattern-nexus-cloud.jpg' },
    { id: 'p2', name: 'Connected Nodes', url: '/images/demos/pattern-nexus-cloud.jpg' },
  ],
  typography: [
    { id: 't1', name: 'Display', fontFamily: 'Inter', weight: '700', usage: 'Headlines', role: 'display' },
    { id: 't2', name: 'Code', fontFamily: 'Fira Code', weight: '400', usage: 'Code examples', role: 'body' },
  ],
  textStyles: [
    { id: 'ts1', tag: 'H1', size: '40px', weight: '700', lineHeight: '1.2' },
    { id: 'ts2', tag: 'Code', size: '14px', weight: '400', lineHeight: '1.6' },
  ],
  iconography: [],
  socialIcons: [],
  imagery: [
    { id: 'im1', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', type: 'do', description: 'Use clean server room imagery' },
  ],
  social: [],
  websites: [
    { id: 'w1', label: 'Cloud Dashboard', url: 'https://cloud.nexustech.com' },
    { id: 'w2', label: 'Documentation', url: 'https://docs.nexustech.com/cloud' },
  ],
  signatures: [
    { 
      id: 'sig1', 
      name: 'DevOps Team', 
      role: 'Cloud Support', 
      html: `<table cellpadding="0" cellspacing="0" style="font-family: 'SF Mono', Consolas, monospace; max-width: 550px;">
  <tr>
    <td style="padding-bottom: 12px; border-bottom: 2px solid #14B8A6;">
      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1E293B;">[NAME]</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #3B82F6; font-weight: 500;">[ROLE]</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 0;">
      <p style="margin: 0; font-size: 12px; color: #64748B;">Nexus Cloud Platform</p>
      <p style="margin: 4px 0; font-size: 12px; color: #64748B;"><span style="color: #3B82F6;">E:</span> [EMAIL]</p>
      <p style="margin: 0; font-size: 12px; color: #64748B;"><span style="color: #3B82F6;">W:</span> cloud.nexustech.com</p>
    </td>
  </tr>
</table>`, 
      company: 'Nexus Cloud',
      email: 'support@cloud.nexustech.com',
      phone: '+1 (555) 800-CLOUD',
      website: 'cloud.nexustech.com',
      variant: 'full',
    },
    { 
      id: 'sig2', 
      name: 'DevOps Team', 
      role: 'Cloud Support', 
      html: `<div style="font-family: 'SF Mono', Consolas, monospace; font-size: 11px; color: #333;">
  <p style="margin: 0; font-weight: bold;">[NAME] | [ROLE]</p>
  <p style="margin: 4px 0 0 0; color: #64748B;">[EMAIL] • cloud.nexustech.com</p>
</div>`, 
      company: 'Nexus Cloud',
      email: 'support@cloud.nexustech.com',
      website: 'cloud.nexustech.com',
      variant: 'minimal',
    },
  ],
  qr: {
    defaultUrl: 'https://cloud.nexustech.com',
    fgColor: '#3B82F6',
    bgColor: '#FFFFFF',
  },
  videos: [],
  assets: [],
  misuse: [],
  atmosphere: {
    style: 'tech',
    animate: true,
    opacity: 0.25,
    blur: 50,
  },
  caseStudies: [],
  brochures: [],
  templates: [],
  services: [
    { id: 'srv1', name: 'Compute', description: 'Scalable virtual machines and containers', icon: 'Server' },
    { id: 'srv2', name: 'Storage', description: 'Object, block, and file storage solutions', icon: 'Database' },
    { id: 'srv3', name: 'Networking', description: 'Global load balancing and CDN', icon: 'Globe' },
    { id: 'srv4', name: 'Kubernetes', description: 'Managed Kubernetes clusters', icon: 'Box' },
  ],
  statistics: [
    { id: 'stat1', value: '99.99', suffix: '%', label: 'Uptime SLA', icon: 'Shield', category: 'primary' },
    { id: 'stat2', value: '200', suffix: 'ms', label: 'Average Latency', icon: 'Zap', category: 'primary' },
    { id: 'stat3', value: '25', label: 'Global Regions', icon: 'Globe', category: 'secondary' },
  ],
};

// Demo Product: Bloom Essential Oils
export const DEMO_PRODUCT_OILS: Omit<ProductGuide, 'createdAt' | 'updatedAt'> = {
  id: 'demo-bloom-oils',
  type: 'product',
  slug: 'demo-bloom-oils',
  parentBrandId: 'demo-bloom-wellness',
  isFavorite: false,
  isPublic: true,
  sectionOrder: [
    'hero', 'tagline', 'identity', 'values', 'services', 'logos', 'colors', 'gradients', 'patterns', 'typography', 'imagery'
  ] as SectionId[],
  hiddenSections: [],
  pageSettings: DEMO_PAGE_SETTINGS,
  hero: {
    name: 'Bloom Essential Oils',
    tagline: 'Pure botanical essences for everyday wellness',
    coverImage: '/images/demos/hero-bloom-oils.jpg',
    logoUrl: '/images/demos/logo-bloom-oils.png',
  },
  tagline: {
    primary: 'Nature\'s essence, bottled',
    secondary: '100% pure, therapeutic-grade essential oils',
    variations: ['Aromatherapy redefined', 'Wellness in every drop'],
  },
  identity: {
    missionStatement: 'To bring the purest botanical essences from nature to your home for a more balanced, healthy life.',
    archetype: 'The Caregiver',
    toneOfVoice: ['Gentle', 'Pure', 'Natural'],
  },
  values: [
    { id: 'v1', text: 'Purity', description: '100% pure, no synthetic additives', icon: 'Droplet' },
    { id: 'v2', text: 'Sustainability', description: 'Ethically sourced from sustainable farms', icon: 'Leaf' },
  ],
  logos: [
    { id: 'l1', name: 'Essential Oils Logo', url: '/images/demos/logo-bloom-oils.png', variant: 'primary' },
    { id: 'l2', name: 'Droplet Icon', url: '/images/demos/logo-bloom-oils.png', variant: 'icon' },
  ],
  brandIcons: [
    { id: 'bi1', name: 'Oils Symbol', url: '/images/demos/logo-bloom-oils.png', settings: 'Product icon', isPrimary: true },
  ],
  colors: [
    { id: 'c1', name: 'Lavender', hex: '#9575CD', rgb: 'rgb(149, 117, 205)', usage: 'Primary product color', role: 'primary', pantone: 'PMS 2715 C' },
    { id: 'c2', name: 'Eucalyptus', hex: '#4DB6AC', rgb: 'rgb(77, 182, 172)', usage: 'Freshness, vitality', role: 'secondary', pantone: 'PMS 3255 C' },
    { id: 'c3', name: 'Honey Gold', hex: '#FFB74D', rgb: 'rgb(255, 183, 77)', usage: 'Warmth, energy', role: 'accent', pantone: 'PMS 1365 C' },
  ],
  colorCombinations: [],
  gradients: [
    { id: 'g1', name: 'Aromatherapy', css: 'linear-gradient(135deg, #9575CD 0%, #4DB6AC 100%)' },
  ],
  patterns: [
    { id: 'p1', name: 'Lavender Essence', url: '/images/demos/pattern-bloom-oils.jpg' },
    { id: 'p2', name: 'Botanical Drops', url: '/images/demos/pattern-bloom-oils.jpg' },
  ],
  typography: [
    { id: 't1', name: 'Display', fontFamily: 'Cormorant Garamond', weight: '500', usage: 'Headlines', role: 'display' },
    { id: 't2', name: 'Body', fontFamily: 'Lato', weight: '400', usage: 'Body text', role: 'body' },
  ],
  textStyles: [
    { id: 'ts1', tag: 'H1', size: '38px', weight: '500', lineHeight: '1.4' },
  ],
  iconography: [],
  socialIcons: [],
  imagery: [
    { id: 'im1', url: 'https://images.unsplash.com/photo-1600428853876-fb28dbf67fa2?w=800&q=80', type: 'do', description: 'Natural botanical close-ups' },
  ],
  social: [],
  websites: [
    { id: 'w1', label: 'Shop Oils', url: 'https://bloomwellness.com/oils' },
  ],
  signatures: [
    { 
      id: 'sig1', 
      name: 'Wellness Team', 
      role: 'Product Specialist', 
      html: `<table cellpadding="0" cellspacing="0" style="font-family: Georgia, serif; max-width: 450px;">
  <tr>
    <td style="padding-bottom: 10px; border-bottom: 2px solid #9575CD;">
      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #4DB6AC;">[NAME]</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #9575CD;">[ROLE]</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 10px 0;">
      <p style="margin: 0; font-size: 12px; color: #666;">Bloom Essential Oils</p>
      <p style="margin: 4px 0; font-size: 12px; color: #666;">[EMAIL]</p>
      <p style="margin: 0; font-size: 11px; font-style: italic; color: #9575CD;">Nature's essence, bottled 💧</p>
    </td>
  </tr>
</table>`, 
      company: 'Bloom Essential Oils',
      email: 'oils@bloomwellness.com',
      phone: '+1 (555) 234-OILS',
      website: 'bloomwellness.com/oils',
      variant: 'full',
    },
    { 
      id: 'sig2', 
      name: 'Wellness Team', 
      role: 'Product Specialist', 
      html: `<div style="font-family: Georgia, serif; font-size: 11px; color: #666;">
  <p style="margin: 0; font-weight: bold; color: #4DB6AC;">[NAME]</p>
  <p style="margin: 2px 0; color: #9575CD;">[ROLE] • Bloom Essential Oils</p>
</div>`, 
      company: 'Bloom Essential Oils',
      email: 'oils@bloomwellness.com',
      website: 'bloomwellness.com/oils',
      variant: 'minimal',
    },
  ],
  qr: {
    defaultUrl: 'https://bloomwellness.com/oils',
    fgColor: '#9575CD',
    bgColor: '#FFFFFF',
  },
  videos: [],
  assets: [],
  misuse: [],
  atmosphere: {
    style: 'organic',
    animate: true,
    opacity: 0.2,
    blur: 80,
  },
  caseStudies: [],
  brochures: [],
  templates: [],
  services: [
    { id: 'srv1', name: 'Single Oils', description: 'Pure single-origin essential oils', icon: 'Droplet' },
    { id: 'srv2', name: 'Blends', description: 'Expertly crafted oil blends', icon: 'Sparkles' },
    { id: 'srv3', name: 'Diffusers', description: 'Premium aromatherapy diffusers', icon: 'Wind' },
  ],
};

// Demo Event: Global Innovation Summit 2026
export const DEMO_EVENT_SUMMIT: Omit<EventGuide, 'createdAt' | 'updatedAt'> = {
  id: 'demo-innovation-summit',
  type: 'event',
  slug: 'demo-innovation-summit',
  parentBrandId: 'demo-nexus-tech',
  isFavorite: false,
  isPublic: true,
  sectionOrder: [
    'hero', 'eventdetails', 'eventlogos', 'eventschedule', 'eventsponsors', 
    'eventsignage', 'eventbanners', 'eventdigital', 'eventvideos', 'eventwebsites', 'eventhistory'
  ] as EventSectionId[],
  hiddenSections: [],
  pageSettings: DEMO_PAGE_SETTINGS,
  hero: {
    name: 'Global Innovation Summit 2026',
    tagline: 'Where visionaries converge to shape the future of technology',
    coverImage: '/images/events/hero-innovation-summit.jpg',
    logoUrl: '/images/demos/logo-nexus-tech.png',
  },
  tagline: {
    primary: 'Where Innovation Meets Opportunity',
    secondary: 'Join 5,000+ industry leaders for three days of insights and networking',
    variations: ['Shape the Future', 'Connect. Learn. Transform.'],
  },
  identity: {
    missionStatement: 'To bring together the world\'s most innovative minds to share knowledge and drive the future of technology.',
    archetype: 'The Sage',
    toneOfVoice: ['Inspiring', 'Professional', 'Forward-thinking'],
  },
  values: [
    { id: 'v1', text: 'Innovation', description: 'Showcasing cutting-edge technology and ideas', icon: 'Lightbulb' },
    { id: 'v2', text: 'Community', description: 'Building lasting professional connections', icon: 'Users' },
    { id: 'v3', text: 'Excellence', description: 'World-class speakers and content', icon: 'Award' },
  ],
  eventDetails: {
    eventName: 'Global Innovation Summit 2026',
    eventDates: 'September 15-17, 2026',
    startDate: '2026-09-15',
    endDate: '2026-09-17',
    location: 'San Francisco, CA',
    venue: 'Moscone Center',
    tagline: 'Shaping Tomorrow\'s Technology Today',
    eventType: 'conference',
    expectedAttendees: 5000,
    hashtag: '#GIS2026',
    registrationUrl: 'https://innovationsummit.nexustech.com/register',
  },
  eventLocation: {
    venueName: 'Moscone Center',
    address: '747 Howard Street',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    postalCode: '94103',
    googleMapsUrl: 'https://maps.google.com/maps?q=Moscone+Center+San+Francisco',
    nearbyHotels: 'Marriott Marquis (0.2 mi), St. Regis San Francisco (0.3 mi), W San Francisco (0.4 mi)',
    transitInfo: 'BART Powell Street station is a 5-minute walk. Complimentary shuttle from partner hotels.',
    parkingInfo: 'Paid parking available at 5th & Mission Garage. Valet available at venue.',
    venueMaps: [],
  },
  eventLogos: [
    { id: 'el1', name: 'Event Logo Full', url: '/images/demos/logo-nexus-tech.png', variant: 'event-primary' },
    { id: 'el2', name: 'Event Logo Light', url: '/images/demos/logo-nexus-tech.png', variant: 'event-secondary' },
    { id: 'el3', name: 'Date Lockup', url: '', variant: 'date-lockup' },
  ],
  eventSignage: [
    { id: 'sig1', name: 'Main Stage Backdrop', type: 'stage-backdrop', dimensions: '40ft x 15ft', previewUrl: '/images/events/signage-booth-backdrop.jpg', notes: 'Full bleed event gradient with centered logo' },
    { id: 'sig2', name: 'Registration Banner', type: 'pull-up-banner', dimensions: '8ft x 3ft', previewUrl: '/images/events/signage-pullup-banner.jpg' },
    { id: 'sig3', name: 'Directional Signs', type: 'directional', dimensions: '24in x 36in', notes: 'Wayfinding for halls A-D' },
  ],
  eventBanners: [
    { id: 'ban1', name: 'Email Header', type: 'email-header', dimensions: '600px x 200px', previewUrl: '/images/events/banner-email.jpg', platform: 'Email' },
    { id: 'ban2', name: 'LinkedIn Event Banner', type: 'social-cover', dimensions: '1200px x 628px', previewUrl: '/images/events/banner-linkedin.jpg', platform: 'LinkedIn' },
    { id: 'ban3', name: 'Website Hero', type: 'website-hero', dimensions: '1920px x 600px', platform: 'Web' },
  ],
  eventDigitalMaterials: [
    { id: 'da1', name: 'Event Program PDF', type: 'agenda', fileType: 'pdf', description: 'Complete event schedule and speaker bios' },
    { id: 'da2', name: 'Speaker Kit', type: 'presentation-template', fileType: 'zip', description: 'Presentation templates and guidelines' },
    { id: 'da3', name: 'Press Release Template', type: 'other', fileType: 'docx', description: 'Media announcement template' },
  ],
  eventSchedule: [
    { id: 's1', time: '9:00 AM - Day 1', title: 'Opening Keynote: The Next Decade', speaker: 'CEO Panel', location: 'Main Stage' },
    { id: 's2', time: '11:00 AM - Day 1', title: 'AI in Enterprise', speaker: 'Dr. Sarah Chen', location: 'Hall A', track: 'AI & ML' },
    { id: 's3', time: '12:30 PM - Day 1', title: 'Networking Lunch', location: 'Expo Hall' },
    { id: 's4', time: '2:00 PM - Day 1', title: 'Cloud Architecture Workshop', speaker: 'Tech Team', location: 'Workshop Room 1', track: 'Cloud' },
    { id: 's5', time: '9:00 AM - Day 2', title: 'Product Showcase', location: 'Main Stage' },
    { id: 's6', time: '10:30 AM - Day 2', title: 'Developer Deep Dive', speaker: 'Engineering Team', location: 'Hall B', track: 'Dev' },
    { id: 's7', time: '2:00 PM - Day 2', title: 'Partner Summit', location: 'Executive Lounge' },
    { id: 's8', time: '7:00 PM - Day 2', title: 'Evening Gala', location: 'Grand Ballroom' },
  ],
  eventSpeakers: [
    { id: 'spk1', name: 'Dr. Sarah Chen', title: 'Chief AI Officer', company: 'TechCorp Global', bio: 'Leading expert in enterprise AI implementation' },
    { id: 'spk2', name: 'Marcus Johnson', title: 'VP of Engineering', company: 'CloudScale Inc', bio: 'Pioneer in cloud-native architecture' },
  ],
  eventSponsors: [
    { id: 'sp1', name: 'TechCorp Global', tier: 'platinum', logoUrl: '/images/demos/logo-nexus-tech.png', websiteUrl: 'https://techcorp.com' },
    { id: 'sp2', name: 'CloudScale Inc', tier: 'gold', logoUrl: '/images/demos/logo-nexus-cloud.png', websiteUrl: 'https://cloudscale.com' },
    { id: 'sp3', name: 'DataFlow Systems', tier: 'silver', logoUrl: '/images/demos/logo-nexus-tech.png', websiteUrl: 'https://dataflow.com' },
  ],
  eventHistory: [
    { id: 'eh1', year: 2025, eventName: 'Global Innovation Summit 2025', location: 'Austin, TX', venue: 'Austin Convention Center', attendees: 4200, highlights: 'First hybrid format, 50+ speakers' },
    { id: 'eh2', year: 2024, eventName: 'Global Innovation Summit 2024', location: 'Seattle, WA', venue: 'Washington State Convention Center', attendees: 3500, highlights: 'Product launch keynote, 100+ exhibitors' },
    { id: 'eh3', year: 2023, eventName: 'Global Innovation Summit 2023', location: 'New York, NY', venue: 'Javits Center', attendees: 2800, highlights: 'Inaugural summit, sold out in 48 hours' },
  ],
  eventVideos: [
    { id: 'ev1', title: 'Event Teaser', url: 'https://youtube.com/watch?v=example', type: 'teaser', platform: 'youtube', description: '60-second event preview' },
    { id: 'ev2', title: 'Last Year Highlights', url: 'https://youtube.com/watch?v=example2', type: 'recap', platform: 'youtube', description: '2025 Summit recap', year: 2025 },
  ],
  colors: [
    { id: 'ec1', name: 'Summit Blue', hex: '#0066FF', rgb: 'rgb(0, 102, 255)', usage: 'Primary event color', role: 'primary', pantone: 'PMS 2728 C' },
    { id: 'ec2', name: 'Innovation Purple', hex: '#8B5CF6', rgb: 'rgb(139, 92, 246)', usage: 'Accent color for highlights', role: 'accent', pantone: 'PMS 2665 C' },
    { id: 'ec3', name: 'Stage Gold', hex: '#F59E0B', rgb: 'rgb(245, 158, 11)', usage: 'VIP and premium elements', role: 'secondary', pantone: 'PMS 1235 C' },
  ],
  colorCombinations: [],
  logos: [
    { id: 'l1', name: 'Nexus Tech Logo', url: '/images/demos/logo-nexus-tech.png', variant: 'primary' },
  ],
  brandIcons: [],
  gradients: [
    { id: 'g1', name: 'Summit Gradient', css: 'linear-gradient(135deg, #0066FF 0%, #8B5CF6 100%)' },
  ],
  patterns: [],
  typography: [
    { id: 't1', name: 'Display', fontFamily: 'Inter', weight: '700', usage: 'Headlines, stage signage', role: 'display' },
    { id: 't2', name: 'Body', fontFamily: 'Inter', weight: '400', usage: 'Body text, materials', role: 'body' },
  ],
  textStyles: [],
  iconography: [],
  socialIcons: [],
  imagery: [],
  social: [
    { id: 's1', platform: 'LinkedIn', handle: '@nexustech', url: 'https://linkedin.com/company/nexustech', color: '#0A66C2' },
    { id: 's2', platform: 'Twitter', handle: '@GIS2026', url: 'https://twitter.com/GIS2026', color: '#1DA1F2' },
  ],
  websites: [
    { id: 'ew1', label: 'Event Website', url: 'https://innovationsummit.nexustech.com' },
    { id: 'ew2', label: 'Registration Portal', url: 'https://register.innovationsummit.com' },
  ],
  signatures: [
    { 
      id: 'sig1', 
      name: 'Events Team', 
      role: 'Summit Coordinator', 
      html: `<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; max-width: 550px;">
  <tr>
    <td style="padding-bottom: 12px; border-bottom: 2px solid #8B5CF6;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0066FF;">[NAME]</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #8B5CF6; font-weight: 500;">[ROLE]</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 15px 0;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align: top;">
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0066FF;">Global Innovation Summit 2026</p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">September 15-17, 2026 • San Francisco, CA</p>
            <p style="margin: 8px 0 2px 0; font-size: 12px; color: #666;"><span style="color: #0066FF; font-weight: bold;">E:</span> [EMAIL]</p>
            <p style="margin: 2px 0; font-size: 12px; color: #666;"><span style="color: #0066FF; font-weight: bold;">W:</span> innovationsummit.nexustech.com</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 10px; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 10px; color: #8B5CF6; font-weight: 500;">#GIS2026 • Where Innovation Meets Opportunity</p>
    </td>
  </tr>
</table>`, 
      company: 'Global Innovation Summit',
      email: 'events@innovationsummit.nexustech.com',
      phone: '+1 (555) 800-SUMMIT',
      website: 'innovationsummit.nexustech.com',
      variant: 'full',
    },
    { 
      id: 'sig2', 
      name: 'Events Team', 
      role: 'Summit Coordinator', 
      html: `<div style="font-family: Arial, sans-serif; font-size: 11px; color: #333;">
  <p style="margin: 0; font-weight: bold; color: #0066FF;">[NAME] | [ROLE]</p>
  <p style="margin: 2px 0; color: #666;">Global Innovation Summit 2026</p>
  <p style="margin: 4px 0 0 0; color: #8B5CF6;">[EMAIL] • #GIS2026</p>
</div>`, 
      company: 'Global Innovation Summit',
      email: 'events@innovationsummit.nexustech.com',
      website: 'innovationsummit.nexustech.com',
      variant: 'minimal',
    },
  ],
  qr: {
    defaultUrl: 'https://innovationsummit.nexustech.com',
    fgColor: '#0066FF',
    bgColor: '#FFFFFF',
  },
  videos: [],
  assets: [],
  misuse: [],
  atmosphere: {
    style: 'tech',
    animate: true,
    opacity: 0.3,
    blur: 60,
  },
  caseStudies: [],
  brochures: [],
  templates: [],
  services: [],
};

// All demo guides collection
export const DEMO_BRANDS = [DEMO_BRAND_NEXUS, DEMO_BRAND_BLOOM];
export const DEMO_PRODUCTS = [DEMO_PRODUCT_CLOUD, DEMO_PRODUCT_OILS];
export const DEMO_EVENTS = [DEMO_EVENT_SUMMIT];

// Gradient classes for display cards
export const DEMO_GRADIENTS: Record<string, string> = {
  'demo-nexus-tech': 'from-blue-500 via-cyan-500 to-blue-600',
  'demo-bloom-wellness': 'from-green-400 via-emerald-500 to-teal-500',
  'demo-nexus-cloud': 'from-blue-400 via-teal-500 to-cyan-500',
  'demo-bloom-oils': 'from-purple-400 via-pink-400 to-amber-400',
  'demo-innovation-summit': 'from-violet-500 via-purple-500 to-fuchsia-500',
};

// Industry labels for display
export const DEMO_INDUSTRIES: Record<string, string> = {
  'demo-nexus-tech': 'Technology',
  'demo-bloom-wellness': 'Wellness',
  'demo-nexus-cloud': 'Cloud Platform',
  'demo-bloom-oils': 'Consumer Products',
  'demo-innovation-summit': 'Conference',
};
