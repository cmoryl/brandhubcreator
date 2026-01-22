// Pre-populated demo brand and product guides with sample imagery, colors, typography, and logos
// These showcase the full capabilities of BrandHub

import type { BrandGuide, ProductGuide, SectionId } from '@/types/brand';

// Demo Brand 1: Nexus Tech - Modern Tech Company
export const DEMO_BRAND_NEXUS: Omit<BrandGuide, 'createdAt' | 'updatedAt'> = {
  id: 'demo-nexus-tech',
  type: 'brand',
  slug: 'demo-nexus-tech',
  isFavorite: false,
  isPublic: true,
  sectionOrder: [
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'logos', 'brandicon', 'colors', 'gradients', 
    'typography', 'textstyles', 'imagery', 'social', 'website', 'signatures', 'qr', 'videos', 'assets', 'misuse',
    'casestudies', 'brochures', 'templates'
  ] as SectionId[],
  hiddenSections: [],
  hero: {
    name: 'Nexus Tech',
    tagline: 'Building tomorrow\'s digital infrastructure today',
    coverImage: '/images/demos/hero-nexus-tech.jpg',
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
    { id: 'c1', name: 'Nexus Blue', hex: '#0066FF', rgb: 'rgb(0, 102, 255)', usage: 'Primary brand color, CTAs, key elements', role: 'primary' },
    { id: 'c2', name: 'Deep Navy', hex: '#0A1628', rgb: 'rgb(10, 22, 40)', usage: 'Headlines, body text, dark backgrounds', role: 'secondary' },
    { id: 'c3', name: 'Electric Cyan', hex: '#00D4FF', rgb: 'rgb(0, 212, 255)', usage: 'Accents, highlights, interactive elements', role: 'accent' },
    { id: 'c4', name: 'Cloud White', hex: '#F8FAFC', rgb: 'rgb(248, 250, 252)', usage: 'Backgrounds, cards, light surfaces', role: 'neutral' },
    { id: 'c5', name: 'Slate Gray', hex: '#64748B', rgb: 'rgb(100, 116, 139)', usage: 'Secondary text, borders, subtle elements', role: 'neutral' },
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
    { id: 'p1', name: 'Circuit Pattern', url: '' },
    { id: 'p2', name: 'Dot Grid', url: '' },
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
    { id: 'im3', url: '', type: 'dont', description: 'Avoid cluttered or outdated technology images' },
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
      html: '', 
      company: 'Nexus Tech',
      email: 'alex@nexustech.com',
      phone: '+1 (555) 123-4567',
      website: 'nexustech.com',
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
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'logos', 'colors', 'gradients', 
    'typography', 'imagery', 'social', 'website', 'qr'
  ] as SectionId[],
  hiddenSections: [],
  hero: {
    name: 'Bloom Wellness',
    tagline: 'Nurturing your journey to holistic well-being',
    coverImage: '/images/demos/hero-bloom-wellness.jpg',
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
    { id: 'c1', name: 'Sage Green', hex: '#7CB342', rgb: 'rgb(124, 179, 66)', usage: 'Primary brand color, natural elements', role: 'primary' },
    { id: 'c2', name: 'Warm Earth', hex: '#8D6E63', rgb: 'rgb(141, 110, 99)', usage: 'Grounding elements, organic feel', role: 'secondary' },
    { id: 'c3', name: 'Soft Lavender', hex: '#B39DDB', rgb: 'rgb(179, 157, 219)', usage: 'Calm accents, wellness themes', role: 'accent' },
    { id: 'c4', name: 'Cream', hex: '#FFF8E7', rgb: 'rgb(255, 248, 231)', usage: 'Backgrounds, soft surfaces', role: 'neutral' },
    { id: 'c5', name: 'Deep Forest', hex: '#2E7D32', rgb: 'rgb(46, 125, 50)', usage: 'Strong accents, emphasis', role: 'secondary' },
  ],
  colorCombinations: [
    { id: 'cc1', name: 'Nature Duo', colors: ['#7CB342', '#2E7D32'], status: 'approved', notes: 'Primary nature palette' },
  ],
  gradients: [
    { id: 'g1', name: 'Morning Bloom', css: 'linear-gradient(135deg, #7CB342 0%, #B39DDB 100%)' },
    { id: 'g2', name: 'Sunset Wellness', css: 'linear-gradient(180deg, #FFF8E7 0%, #FFE0B2 100%)' },
  ],
  patterns: [],
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
    { id: 'im3', url: '', type: 'dont', description: 'Avoid artificial or overly processed imagery' },
  ],
  social: [
    { id: 's1', platform: 'Instagram', handle: '@bloomwellness', url: 'https://instagram.com/bloomwellness', color: '#E4405F' },
    { id: 's2', platform: 'Pinterest', handle: '@bloomwellness', url: 'https://pinterest.com/bloomwellness', color: '#BD081C' },
  ],
  websites: [
    { id: 'w1', label: 'Main Website', url: 'https://bloomwellness.com' },
  ],
  signatures: [],
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
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'logos', 'colors', 'gradients', 'typography', 'imagery'
  ] as SectionId[],
  hiddenSections: [],
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
    { id: 'c1', name: 'Cloud Blue', hex: '#3B82F6', rgb: 'rgb(59, 130, 246)', usage: 'Primary product color', role: 'primary' },
    { id: 'c2', name: 'Deep Space', hex: '#1E293B', rgb: 'rgb(30, 41, 59)', usage: 'Dark UI elements', role: 'secondary' },
    { id: 'c3', name: 'Electric Teal', hex: '#14B8A6', rgb: 'rgb(20, 184, 166)', usage: 'Success states, highlights', role: 'accent' },
  ],
  colorCombinations: [],
  gradients: [
    { id: 'g1', name: 'Cloud Gradient', css: 'linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%)' },
  ],
  patterns: [],
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
  signatures: [],
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
    'hero', 'tagline', 'identity', 'values', 'services', 'logos', 'colors', 'gradients', 'typography', 'imagery'
  ] as SectionId[],
  hiddenSections: [],
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
    { id: 'c1', name: 'Lavender', hex: '#9575CD', rgb: 'rgb(149, 117, 205)', usage: 'Primary product color', role: 'primary' },
    { id: 'c2', name: 'Eucalyptus', hex: '#4DB6AC', rgb: 'rgb(77, 182, 172)', usage: 'Freshness, vitality', role: 'secondary' },
    { id: 'c3', name: 'Honey Gold', hex: '#FFB74D', rgb: 'rgb(255, 183, 77)', usage: 'Warmth, energy', role: 'accent' },
  ],
  colorCombinations: [],
  gradients: [
    { id: 'g1', name: 'Aromatherapy', css: 'linear-gradient(135deg, #9575CD 0%, #4DB6AC 100%)' },
  ],
  patterns: [],
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
  signatures: [],
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

// All demo guides collection
export const DEMO_BRANDS = [DEMO_BRAND_NEXUS, DEMO_BRAND_BLOOM];
export const DEMO_PRODUCTS = [DEMO_PRODUCT_CLOUD, DEMO_PRODUCT_OILS];

// Gradient classes for display cards
export const DEMO_GRADIENTS: Record<string, string> = {
  'demo-nexus-tech': 'from-blue-500 via-cyan-500 to-blue-600',
  'demo-bloom-wellness': 'from-green-400 via-emerald-500 to-teal-500',
  'demo-nexus-cloud': 'from-blue-400 via-teal-500 to-cyan-500',
  'demo-bloom-oils': 'from-purple-400 via-pink-400 to-amber-400',
};

// Industry labels for display
export const DEMO_INDUSTRIES: Record<string, string> = {
  'demo-nexus-tech': 'Technology',
  'demo-bloom-wellness': 'Wellness',
  'demo-nexus-cloud': 'Cloud Platform',
  'demo-bloom-oils': 'Consumer Products',
};
