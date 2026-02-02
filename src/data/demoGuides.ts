// Pre-populated demo brand, product, and event guides with sample imagery, colors, typography, and logos
// These showcase the full capabilities of BrandHub

import type { BrandGuide, ProductGuide, SectionId, BrandPageSettings } from '@/types/brand';
import type { EventGuide, EventSectionId } from '@/types/event';
import { DEMO_BRAND_BRANDHUB } from './demoBrandHub';

// Import demo imagery assets
import heroNexusTech from '@/assets/demos/hero-nexus-tech.jpg';
import heroBloomWellness from '@/assets/demos/hero-bloom-wellness.jpg';
import heroNexusCloud from '@/assets/demos/hero-nexus-cloud.jpg';
import heroBloomOils from '@/assets/demos/hero-bloom-oils.jpg';
import heroInnovationSummit from '@/assets/demos/hero-innovation-summit.jpg';

import patternNexusTech from '@/assets/demos/pattern-nexus-tech.jpg';
import patternBloomWellness from '@/assets/demos/pattern-bloom-wellness.jpg';
import patternNexusCloud from '@/assets/demos/pattern-nexus-cloud.jpg';
import patternBloomOils from '@/assets/demos/pattern-bloom-oils.jpg';

import imageryNexusDo1 from '@/assets/demos/imagery-nexus-do-1.jpg';
import imageryNexusDo2 from '@/assets/demos/imagery-nexus-do-2.jpg';
import imageryBloomDo1 from '@/assets/demos/imagery-bloom-do-1.jpg';
import imageryBloomDo2 from '@/assets/demos/imagery-bloom-do-2.jpg';

import socialNexusLinkedin from '@/assets/demos/social-nexus-linkedin.jpg';
import socialNexusTwitter from '@/assets/demos/social-nexus-twitter.jpg';
import socialBloomInstagram from '@/assets/demos/social-bloom-instagram.jpg';
import socialBloomLinkedin from '@/assets/demos/social-bloom-linkedin.jpg';

import signageBoothBackdrop from '@/assets/demos/signage-booth-backdrop.jpg';
import signagePullupBanner from '@/assets/demos/signage-pullup-banner.jpg';
import bannerLinkedinEvent from '@/assets/demos/banner-linkedin-event.jpg';
import bannerEmail from '@/assets/demos/banner-email.jpg';

// Import new collateral and event assets
import collateralNexusStationery from '@/assets/demos/collateral-nexus-stationery.jpg';
import collateralNexusBrochure from '@/assets/demos/collateral-nexus-brochure.jpg';
import collateralNexusCasestudy from '@/assets/demos/collateral-nexus-casestudy.jpg';
import templateNexusPresentation from '@/assets/demos/template-nexus-presentation.jpg';
import collateralBloomBrochure from '@/assets/demos/collateral-bloom-brochure.jpg';
import collateralBloomStationery from '@/assets/demos/collateral-bloom-stationery.jpg';
import signageSummitStage from '@/assets/demos/signage-summit-stage.jpg';
import signageSummitRegistration from '@/assets/demos/signage-summit-registration.jpg';
import signageSummitWayfinding from '@/assets/demos/signage-summit-wayfinding.jpg';
import webinarNexusTech from '@/assets/demos/webinar-nexus-tech.jpg';
import awardsNexusTech from '@/assets/demos/awards-nexus-tech.jpg';
import iconographyNexusTech from '@/assets/demos/iconography-nexus-tech.jpg';
import iconographyBloomWellness from '@/assets/demos/iconography-bloom-wellness.jpg';
import collateralSummitBadges from '@/assets/demos/collateral-summit-badges.jpg';

// Import card imagery for landing page showcase
import cardBrandHub from '@/assets/demos/card-brandhub.jpg';
import cardNexusTech from '@/assets/demos/card-nexus-tech.jpg';
import cardNexusCloud from '@/assets/demos/card-nexus-cloud.jpg';
import cardInnovationSummit from '@/assets/demos/card-innovation-summit.jpg';
import cardBloomWellness from '@/assets/demos/card-bloom-wellness.jpg';
import cardBloomOils from '@/assets/demos/card-bloom-oils.jpg';

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
    coverImage: heroNexusTech,
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
    { id: 'p1', name: 'Hexagonal Network', url: patternNexusTech },
    { id: 'p2', name: 'Circuit Nodes', url: patternNexusTech },
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
    { id: 'im1', url: imageryNexusDo1, type: 'do', description: 'Use high-quality abstract tech imagery with blue tones and glowing elements' },
    { id: 'im2', url: imageryNexusDo2, type: 'do', description: 'Digital circuit patterns and futuristic geometric designs work well' },
    { id: 'im3', url: socialNexusLinkedin, type: 'do', description: 'LinkedIn company page with tech-forward banner and professional layout' },
    { id: 'im4', url: socialNexusTwitter, type: 'do', description: 'Twitter/X profile showcasing dark mode tech aesthetic with circuit patterns' },
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
    { id: 'cs1', title: 'Enterprise Cloud Migration', description: 'How we helped Fortune 500 companies transition to cloud infrastructure with zero downtime', previewUrl: collateralNexusCasestudy },
    { id: 'cs2', title: 'Startup Scale-up Success', description: 'Supporting rapid growth from 10 to 10,000 users with scalable architecture', previewUrl: collateralNexusCasestudy },
    { id: 'cs3', title: 'Healthcare Data Security', description: 'Implementing HIPAA-compliant cloud solutions for medical records', previewUrl: collateralNexusCasestudy },
  ],
  brochures: [
    { id: 'br1', title: 'Company Overview 2026', category: 'Corporate', previewUrl: collateralNexusBrochure, thumbnailUrl: collateralNexusBrochure },
    { id: 'br2', title: 'Product Catalog', category: 'Products', previewUrl: collateralNexusBrochure, thumbnailUrl: collateralNexusBrochure },
    { id: 'br3', title: 'Enterprise Solutions Guide', category: 'Enterprise', previewUrl: collateralNexusBrochure, thumbnailUrl: collateralNexusBrochure },
  ],
  templates: [
    { id: 'tmp1', name: 'Presentation Template', fileType: 'pptx', fileSize: '5.2 MB', thumbnailUrl: templateNexusPresentation },
    { id: 'tmp2', name: 'Letterhead', fileType: 'docx', fileSize: '1.1 MB', thumbnailUrl: collateralNexusStationery },
    { id: 'tmp3', name: 'Business Card Template', fileType: 'ai', fileSize: '2.8 MB', thumbnailUrl: collateralNexusStationery },
    { id: 'tmp4', name: 'Email Signature Kit', fileType: 'zip', fileSize: '1.5 MB', thumbnailUrl: collateralNexusStationery },
  ],
  awards: [
    { id: 'aw1', title: 'Best Cloud Platform 2025', description: 'Recognized for innovation in enterprise cloud solutions', organization: 'TechCrunch Disrupt', year: 2025, imageUrl: awardsNexusTech },
    { id: 'aw2', title: 'Innovation Excellence Award', description: 'Honoring breakthrough technology achievements', organization: 'Forbes Technology Council', year: 2024, imageUrl: awardsNexusTech },
    { id: 'aw3', title: 'Top 10 Fastest Growing Tech', description: 'Celebrating exceptional growth and innovation', organization: 'Inc. 5000', year: 2024, imageUrl: awardsNexusTech },
    { id: 'aw4', title: 'Enterprise Solution of the Year', description: 'Best-in-class enterprise technology platform', organization: 'Gartner', year: 2023, imageUrl: awardsNexusTech },
  ],
  webinars: [
    { id: 'web1', title: 'Cloud Architecture Best Practices', description: 'Learn how to design scalable cloud infrastructure', thumbnailUrl: webinarNexusTech, recordingUrl: 'https://youtube.com/watch?v=example', status: 'recorded', date: '2025-11-15' },
    { id: 'web2', title: 'Security in the Cloud Era', description: 'Protecting your data with zero-trust architecture', thumbnailUrl: webinarNexusTech, recordingUrl: 'https://youtube.com/watch?v=example', status: 'recorded', date: '2025-10-22' },
    { id: 'web3', title: 'AI-Powered Analytics Deep Dive', description: 'Leveraging machine learning for business insights', thumbnailUrl: webinarNexusTech, status: 'upcoming', date: '2026-03-15' },
  ],
  imageAssets: [
    { id: 'ia1', name: 'Brand Stationery Suite', url: collateralNexusStationery, type: 'collateral', size: '4.2 MB', uploadedAt: '2025-12-01' },
    { id: 'ia2', name: 'Product Brochure Preview', url: collateralNexusBrochure, type: 'collateral', size: '3.8 MB', uploadedAt: '2025-12-01' },
    { id: 'ia3', name: 'Case Study Template', url: collateralNexusCasestudy, type: 'collateral', size: '2.1 MB', uploadedAt: '2025-12-01' },
    { id: 'ia4', name: 'Icon Set Preview', url: iconographyNexusTech, type: 'iconography', size: '1.5 MB', uploadedAt: '2025-12-01' },
  ],
  socialAssets: [
    { id: 'sa1', platform: 'LinkedIn', postSize: '1200x1200', storySize: '1080x1920', coverSize: '1584x396', previewImageUrl: socialNexusLinkedin, textLegibility: 'High contrast, 24pt minimum', directive: 'Use brand colors and professional imagery' },
    { id: 'sa2', platform: 'Twitter', postSize: '1200x675', coverSize: '1500x500', previewImageUrl: socialNexusTwitter, textLegibility: 'High contrast, 18pt minimum', directive: 'Tech-forward, dark mode preferred' },
    { id: 'sa3', platform: 'Instagram', postSize: '1080x1080', storySize: '1080x1920', previewImageUrl: socialNexusLinkedin, textLegibility: 'Bold text on gradient backgrounds', directive: 'Vibrant tech imagery with brand accents' },
  ],
  displayBanners: [
    { id: 'db1', name: 'LinkedIn Banner', dimensions: '1584x396', aspectRatio: 4, category: 'desktop', previewImageUrl: socialNexusLinkedin, maxMessaging: 'Headline + CTA only', textLegibility: '24pt minimum', safeZonePolicy: '10% margins all sides' },
    { id: 'db2', name: 'Twitter Header', dimensions: '1500x500', aspectRatio: 3, category: 'desktop', previewImageUrl: socialNexusTwitter, maxMessaging: 'Brand tagline + logo', textLegibility: '20pt minimum', safeZonePolicy: '15% center safe zone' },
    { id: 'db3', name: 'Email Header', dimensions: '600x200', aspectRatio: 3, category: 'native', previewImageUrl: collateralNexusStationery, maxMessaging: 'Logo + tagline', textLegibility: '16pt minimum', safeZonePolicy: '5% margins' },
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
    coverImage: heroBloomWellness,
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
    { id: 'p1', name: 'Botanical Leaves', url: patternBloomWellness },
    { id: 'p2', name: 'Fern & Eucalyptus', url: patternBloomWellness },
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
    { id: 'im1', url: imageryBloomDo1, type: 'do', description: 'Use serene botanical close-ups with soft natural lighting' },
    { id: 'im2', url: imageryBloomDo2, type: 'do', description: 'Organic flat lays with herbs and natural textures' },
    { id: 'im3', url: socialBloomInstagram, type: 'do', description: 'Instagram profile with botanical aesthetic and wellness lifestyle grid' },
    { id: 'im4', url: socialBloomLinkedin, type: 'do', description: 'LinkedIn company page with professional green botanical theme' },
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
  videos: [
    { id: 'vid1', title: 'Our Wellness Journey', url: 'https://www.youtube.com/watch?v=example1', type: 'youtube', description: 'The story behind Bloom Wellness' },
    { id: 'vid2', title: 'How We Source Our Ingredients', url: 'https://www.youtube.com/watch?v=example2', type: 'youtube', description: 'Farm to bottle transparency' },
  ],
  assets: [
    { id: 'a1', name: 'Logo Pack', type: 'zip', url: '', size: '1.8 MB' },
    { id: 'a2', name: 'Brand Guidelines PDF', type: 'pdf', url: '', size: '5.4 MB' },
    { id: 'a3', name: 'Product Photography Kit', type: 'zip', url: '', size: '45 MB' },
  ],
  misuse: [
    { id: 'm1', url: '', description: 'Do not use artificial or synthetic-looking imagery' },
    { id: 'm2', url: '', description: 'Do not combine brand colors with neon or harsh tones' },
    { id: 'm3', url: '', description: 'Do not place logo on busy or cluttered backgrounds' },
  ],
  atmosphere: {
    style: 'organic',
    animate: true,
    opacity: 0.2,
    blur: 80,
  },
  caseStudies: [
    { id: 'cs1', title: 'Wellness Retreat Partnership', description: 'How we partnered with luxury resorts to provide spa-quality products', previewUrl: collateralBloomBrochure },
    { id: 'cs2', title: 'Sustainable Packaging Initiative', description: 'Our journey to 100% recyclable and biodegradable packaging', previewUrl: collateralBloomBrochure },
  ],
  brochures: [
    { id: 'br1', title: 'Product Catalog 2026', category: 'Products', previewUrl: collateralBloomBrochure, thumbnailUrl: collateralBloomBrochure },
    { id: 'br2', title: 'Wellness Guide', category: 'Educational', previewUrl: collateralBloomBrochure, thumbnailUrl: collateralBloomBrochure },
    { id: 'br3', title: 'Retail Partner Kit', category: 'B2B', previewUrl: collateralBloomBrochure, thumbnailUrl: collateralBloomBrochure },
  ],
  templates: [
    { id: 'tmp1', name: 'Letterhead', fileType: 'docx', fileSize: '800 KB', thumbnailUrl: collateralBloomStationery },
    { id: 'tmp2', name: 'Business Card', fileType: 'ai', fileSize: '2.1 MB', thumbnailUrl: collateralBloomStationery },
    { id: 'tmp3', name: 'Presentation Template', fileType: 'pptx', fileSize: '4.2 MB', thumbnailUrl: collateralBloomStationery },
  ],
  awards: [
    { id: 'aw1', title: 'Best Organic Wellness Brand', description: 'Recognized for commitment to organic ingredients', organization: 'Natural Products Expo', year: 2025 },
    { id: 'aw2', title: 'Sustainability Excellence Award', description: 'Leading the industry in eco-friendly practices', organization: 'Green Business Council', year: 2024 },
  ],
  imageAssets: [
    { id: 'ia1', name: 'Brand Stationery Suite', url: collateralBloomStationery, type: 'collateral', size: '3.2 MB', uploadedAt: '2025-12-01' },
    { id: 'ia2', name: 'Product Catalog Preview', url: collateralBloomBrochure, type: 'collateral', size: '2.8 MB', uploadedAt: '2025-12-01' },
    { id: 'ia3', name: 'Botanical Icon Set', url: iconographyBloomWellness, type: 'iconography', size: '1.2 MB', uploadedAt: '2025-12-01' },
  ],
  socialAssets: [
    { id: 'sa1', platform: 'Instagram', postSize: '1080x1080', storySize: '1080x1920', previewImageUrl: socialBloomInstagram, textLegibility: 'Elegant script, 20pt minimum', directive: 'Natural botanical imagery with soft lighting' },
    { id: 'sa2', platform: 'Pinterest', postSize: '1000x1500', previewImageUrl: socialBloomInstagram, textLegibility: 'Clean serif, high contrast', directive: 'Lifestyle and product flat lays' },
    { id: 'sa3', platform: 'LinkedIn', postSize: '1200x1200', coverSize: '1584x396', previewImageUrl: socialBloomLinkedin, textLegibility: 'Professional, 22pt minimum', directive: 'Company culture and behind-the-scenes' },
  ],
  services: [
    { id: 'srv1', name: 'Wellness Coaching', description: 'Personalized guidance for your wellness journey', icon: 'Heart' },
    { id: 'srv2', name: 'Organic Products', description: 'Premium organic wellness products for mind and body', icon: 'Leaf' },
    { id: 'srv3', name: 'Retreat Programs', description: 'Immersive wellness retreat experiences in nature', icon: 'Sunrise' },
    { id: 'srv4', name: 'Corporate Wellness', description: 'Workplace wellness programs for teams', icon: 'Users' },
  ],
  statistics: [
    { id: 'stat1', value: '100', suffix: '%', label: 'Organic Ingredients', icon: 'Leaf', category: 'primary' },
    { id: 'stat2', value: '50', suffix: 'K+', label: 'Happy Customers', icon: 'Heart', category: 'primary' },
    { id: 'stat3', value: '12', label: 'Wellness Retreats', icon: 'MapPin', category: 'secondary' },
    { id: 'stat4', value: '98', suffix: '%', label: 'Customer Satisfaction', icon: 'Star', category: 'primary' },
  ],
  infographicLayout: 'cards',
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
    coverImage: heroNexusCloud,
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
    coverImage: heroBloomOils,
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
    coverImage: heroInnovationSummit,
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
    { id: 'sig1', name: 'Main Stage Backdrop', type: 'stage-backdrop', dimensions: '40ft x 15ft', previewUrl: signageSummitStage, notes: 'Full bleed event gradient with centered logo. Blue and purple lighting.' },
    { id: 'sig2', name: 'Registration Counter', type: 'other', dimensions: '20ft x 8ft', previewUrl: signageSummitRegistration, notes: 'Welcome desk with branded pull-up banners and digital displays' },
    { id: 'sig3', name: 'Wayfinding Signage', type: 'directional', dimensions: '24in x 36in', previewUrl: signageSummitWayfinding, notes: 'Directional signs for Halls A-D, workshops, and amenities' },
    { id: 'sig4', name: 'Pull-up Banner', type: 'pull-up-banner', dimensions: '8ft x 3ft', previewUrl: signagePullupBanner, notes: 'Session track banners and sponsor displays' },
    { id: 'sig5', name: 'Booth Backdrop', type: 'booth-backdrop', dimensions: '10ft x 8ft', previewUrl: signageBoothBackdrop, notes: 'Exhibitor booth backdrop with gradient mesh pattern' },
  ],
  eventBanners: [
    { id: 'ban1', name: 'Email Header', type: 'email-header', dimensions: '600px x 200px', previewUrl: bannerEmail, platform: 'Email' },
    { id: 'ban2', name: 'LinkedIn Event Banner', type: 'social-cover', dimensions: '1200px x 628px', previewUrl: bannerLinkedinEvent, platform: 'LinkedIn' },
    { id: 'ban3', name: 'Website Hero', type: 'website-hero', dimensions: '1920px x 600px', previewUrl: signageSummitStage, platform: 'Web' },
    { id: 'ban4', name: 'Twitter Header', type: 'social-cover', dimensions: '1500px x 500px', previewUrl: bannerLinkedinEvent, platform: 'Twitter' },
  ],
  eventDigitalMaterials: [
    { id: 'da1', name: 'Event Program PDF', type: 'agenda', fileType: 'pdf', description: 'Complete 3-day schedule with speaker bios and session abstracts' },
    { id: 'da2', name: 'Speaker Kit', type: 'presentation-template', fileType: 'zip', description: 'PowerPoint/Keynote templates with brand guidelines' },
    { id: 'da3', name: 'Press Release Template', type: 'other', fileType: 'docx', description: 'Media announcement template with boilerplate' },
    { id: 'da4', name: 'Attendee Badge Designs', type: 'other', fileType: 'pdf', description: 'VIP, Speaker, Attendee, and Staff badge templates', previewUrl: collateralSummitBadges },
    { id: 'da5', name: 'Social Media Kit', type: 'other', fileType: 'zip', description: 'Pre-made graphics for attendee sharing' },
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

// All demo guides collection - BrandHub is featured first
// These are FULL guides used by DemoGuideViewer and other components
export const DEMO_BRANDS = [DEMO_BRAND_BRANDHUB, DEMO_BRAND_NEXUS, DEMO_BRAND_BLOOM];
export const DEMO_PRODUCTS = [DEMO_PRODUCT_CLOUD, DEMO_PRODUCT_OILS];
export const DEMO_EVENTS = [DEMO_EVENT_SUMMIT];

// ============================================
// Lightweight orbit entities for landing page visualization
// These are minimal stubs to showcase the hierarchical universe
// ============================================
export interface OrbitDemoEntity {
  id: string;
  name: string;
  slug: string;
  type: 'brand' | 'product' | 'event';
  parentBrandId?: string;
  color: string;
}

export const ORBIT_DEMO_ENTITIES: OrbitDemoEntity[] = [
  // Brands (inner ring)
  { id: 'demo-brandhub', name: 'BrandHub', slug: 'brandhub', type: 'brand', color: '#0ea5e9' },
  { id: 'demo-nexus-tech', name: 'Nexus Tech', slug: 'demo-nexus-tech', type: 'brand', color: '#0066FF' },
  { id: 'demo-bloom-wellness', name: 'Bloom Wellness', slug: 'demo-bloom-wellness', type: 'brand', color: '#10b981' },
  { id: 'demo-pulse-media', name: 'Pulse Media', slug: 'demo-pulse-media', type: 'brand', color: '#ec4899' },
  { id: 'demo-horizon-finance', name: 'Horizon Finance', slug: 'demo-horizon-finance', type: 'brand', color: '#8b5cf6' },
  
  // Products (middle ring) - linked to parent brands
  { id: 'demo-nexus-cloud', name: 'Nexus Cloud', slug: 'demo-nexus-cloud', type: 'product', parentBrandId: 'demo-nexus-tech', color: '#38bdf8' },
  { id: 'demo-nexus-ai', name: 'Nexus AI', slug: 'demo-nexus-ai', type: 'product', parentBrandId: 'demo-nexus-tech', color: '#06b6d4' },
  { id: 'demo-bloom-oils', name: 'Bloom Oils', slug: 'demo-bloom-oils', type: 'product', parentBrandId: 'demo-bloom-wellness', color: '#d946ef' },
  { id: 'demo-bloom-spa', name: 'Bloom Spa', slug: 'demo-bloom-spa', type: 'product', parentBrandId: 'demo-bloom-wellness', color: '#a3e635' },
  { id: 'demo-pulse-stream', name: 'Pulse Stream', slug: 'demo-pulse-stream', type: 'product', parentBrandId: 'demo-pulse-media', color: '#f472b6' },
  { id: 'demo-horizon-invest', name: 'Horizon Invest', slug: 'demo-horizon-invest', type: 'product', parentBrandId: 'demo-horizon-finance', color: '#a78bfa' },
  
  // Events (outer ring) - linked to parent brands
  { id: 'demo-innovation-summit', name: 'Innovation Summit', slug: 'demo-innovation-summit', type: 'event', parentBrandId: 'demo-nexus-tech', color: '#f59e0b' },
  { id: 'demo-bloom-retreat', name: 'Wellness Retreat', slug: 'demo-bloom-retreat', type: 'event', parentBrandId: 'demo-bloom-wellness', color: '#34d399' },
  { id: 'demo-pulse-live', name: 'Pulse Live Festival', slug: 'demo-pulse-live', type: 'event', parentBrandId: 'demo-pulse-media', color: '#fb7185' },
  { id: 'demo-horizon-summit', name: 'Finance Summit', slug: 'demo-horizon-summit', type: 'event', parentBrandId: 'demo-horizon-finance', color: '#818cf8' },
];

// Helper to get entities by type for orbit
export const getOrbitBrands = () => ORBIT_DEMO_ENTITIES.filter(e => e.type === 'brand');
export const getOrbitProducts = () => ORBIT_DEMO_ENTITIES.filter(e => e.type === 'product');
export const getOrbitEvents = () => ORBIT_DEMO_ENTITIES.filter(e => e.type === 'event');

// Gradient classes for display cards
export const DEMO_GRADIENTS: Record<string, string> = {
  'demo-brandhub': 'from-cyan-500 via-blue-500 to-teal-400',
  'demo-nexus-tech': 'from-blue-500 via-cyan-500 to-blue-600',
  'demo-bloom-wellness': 'from-green-400 via-emerald-500 to-teal-500',
  'demo-nexus-cloud': 'from-blue-400 via-teal-500 to-cyan-500',
  'demo-bloom-oils': 'from-purple-400 via-pink-400 to-amber-400',
  'demo-innovation-summit': 'from-violet-500 via-purple-500 to-fuchsia-500',
};

// Industry labels for display
export const DEMO_INDUSTRIES: Record<string, string> = {
  'demo-brandhub': 'Brand Platform',
  'demo-nexus-tech': 'Technology',
  'demo-bloom-wellness': 'Wellness',
  'demo-nexus-cloud': 'Cloud Platform',
  'demo-bloom-oils': 'Consumer Products',
  'demo-innovation-summit': 'Conference',
};

// Card imagery for landing page showcase (hyper-realistic AI-generated)
export const DEMO_CARD_IMAGES: Record<string, string> = {
  'demo-brandhub': cardBrandHub,
  'demo-nexus-tech': cardNexusTech,
  'demo-bloom-wellness': cardBloomWellness,
  'demo-nexus-cloud': cardNexusCloud,
  'demo-bloom-oils': cardBloomOils,
  'demo-innovation-summit': cardInnovationSummit,
};
