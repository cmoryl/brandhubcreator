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
import imageryNexusDo3 from '@/assets/demos/imagery-nexus-do-3.jpg';
import imageryNexusDo4 from '@/assets/demos/imagery-nexus-do-4.jpg';
import imageryNexusDont1 from '@/assets/demos/imagery-nexus-dont-1.jpg';
import imageryBloomDo1 from '@/assets/demos/imagery-bloom-do-1.jpg';
import imageryBloomDo2 from '@/assets/demos/imagery-bloom-do-2.jpg';
import imageryBloomDo3 from '@/assets/demos/imagery-bloom-do-3.jpg';
import imageryBloomDo4 from '@/assets/demos/imagery-bloom-do-4.jpg';
import imageryBloomDont1 from '@/assets/demos/imagery-bloom-dont-1.jpg';

// Logo variation showcases
import logosNexusVariations from '@/assets/demos/logos-nexus-variations.jpg';
import logosBloomVariations from '@/assets/demos/logos-bloom-variations.jpg';

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

// New AI-generated card imagery
import casestudyNexus1 from '@/assets/demos/casestudy-nexus-1.jpg';
import casestudyNexus2 from '@/assets/demos/casestudy-nexus-2.jpg';
import webinarNexus1 from '@/assets/demos/webinar-nexus-1.jpg';
import webinarNexus2 from '@/assets/demos/webinar-nexus-2.jpg';
import awardNexus1 from '@/assets/demos/award-nexus-1.jpg';
import brochureNexus1 from '@/assets/demos/brochure-nexus-1.jpg';
import templateNexus1 from '@/assets/demos/template-nexus-1.jpg';
import bannerNexus1 from '@/assets/demos/banner-nexus-1.jpg';
import casestudyBloom1 from '@/assets/demos/casestudy-bloom-1.jpg';
import webinarBloom1 from '@/assets/demos/webinar-bloom-1.jpg';
import awardBloom1 from '@/assets/demos/award-bloom-1.jpg';
import brochureBloom1 from '@/assets/demos/brochure-bloom-1.jpg';
import templateBloom1 from '@/assets/demos/template-bloom-1.jpg';
import speakerSummit1 from '@/assets/demos/speaker-summit-1.jpg';
import speakerSummit2 from '@/assets/demos/speaker-summit-2.jpg';
import speakerSummit3 from '@/assets/demos/speaker-summit-3.jpg';
import speakerSummit4 from '@/assets/demos/speaker-summit-4.jpg';
import videoSummit1 from '@/assets/demos/video-summit-1.jpg';
import videoSummit2 from '@/assets/demos/video-summit-2.jpg';
import videoSummit3 from '@/assets/demos/video-summit-3.jpg';
import videoSummit4 from '@/assets/demos/video-summit-4.jpg';
import videoNexus1 from '@/assets/demos/video-nexus-1.jpg';
import videoNexus2 from '@/assets/demos/video-nexus-2.jpg';
import videoBloom1 from '@/assets/demos/video-bloom-1.jpg';
import videoBloom2 from '@/assets/demos/video-bloom-2.jpg';
import casestudyCloud1 from '@/assets/demos/casestudy-cloud-1.jpg';
import brochureCloud1 from '@/assets/demos/brochure-cloud-1.jpg';
import templateCloud1 from '@/assets/demos/template-cloud-1.jpg';
import casestudyOils1 from '@/assets/demos/casestudy-oils-1.jpg';
import brochureOils1 from '@/assets/demos/brochure-oils-1.jpg';
import templateOils1 from '@/assets/demos/template-oils-1.jpg';
import assetDownload1 from '@/assets/demos/asset-download-1.jpg';
// New comprehensive section assets
import socialassetsNexusSpecs from '@/assets/demos/socialassets-nexus-specs.jpg';
import qrGuidelinesNexus from '@/assets/demos/qr-guidelines-nexus.jpg';
import revenueChartNexus from '@/assets/demos/revenue-chart-nexus.jpg';
import misuseNexusExamples from '@/assets/demos/misuse-nexus-examples.jpg';
import imageassetsLibrary from '@/assets/demos/imageassets-library.jpg';
import templatespecsNexus from '@/assets/demos/templatespecs-nexus.jpg';

// Service card header images
import serviceNexus1 from '@/assets/demos/service-nexus-1.jpg';
import serviceNexus2 from '@/assets/demos/service-nexus-2.jpg';
import serviceNexus3 from '@/assets/demos/service-nexus-3.jpg';
import serviceNexus4 from '@/assets/demos/service-nexus-4.jpg';
import serviceBloom1 from '@/assets/demos/service-bloom-1.jpg';
import serviceBloom2 from '@/assets/demos/service-bloom-2.jpg';
import serviceBloom3 from '@/assets/demos/service-bloom-3.jpg';
import serviceBloom4 from '@/assets/demos/service-bloom-4.jpg';
import serviceCloud1 from '@/assets/demos/service-cloud-1.jpg';
import serviceCloud2 from '@/assets/demos/service-cloud-2.jpg';
import serviceOils1 from '@/assets/demos/service-oils-1.jpg';
import serviceOils2 from '@/assets/demos/service-oils-2.jpg';

// Import card imagery for landing page showcase
import cardBrandHub from '@/assets/demos/card-brandhub.webp';
import cardNexusTech from '@/assets/demos/card-nexus-tech.webp';
import cardNexusCloud from '@/assets/demos/card-nexus-cloud.webp';
import cardInnovationSummit from '@/assets/demos/card-innovation-summit.webp';
import cardBloomWellness from '@/assets/demos/card-bloom-wellness.jpg';
import cardBloomOils from '@/assets/demos/card-bloom-oils.jpg';
import cardPulseMedia from '@/assets/demos/card-pulse-media.jpg';
import cardPulseStream from '@/assets/demos/card-pulse-stream.jpg';
import cardPulseLive from '@/assets/demos/card-pulse-live.jpg';
import cardHorizonFinance from '@/assets/demos/card-horizon-finance.jpg';
import cardHorizonInvest from '@/assets/demos/card-horizon-invest.jpg';
import cardFinanceSummit from '@/assets/demos/card-finance-summit.jpg';
import cardBloomRetreat from '@/assets/demos/card-bloom-retreat.jpg';

// Default demo page settings with animated backgrounds - heroFullWidth controlled by admin
const DEMO_PAGE_SETTINGS_TECH: BrandPageSettings = {
  backgroundType: 'animated-data-particles',
  backgroundImage: '',
  backgroundColor: '',
  accentColor: '#0066FF',
  animationTintColor: '#0066FF',
  animationSpeed: 'medium',
  showHeader: true,
  headerStyle: 'transparent',
  contentWidth: 'full',
  sectionSpacing: 'spacious',
  heroFullWidth: false,
  defaultTheme: 'dark',
  customPrimaryColor: '#0066FF',
  customSecondaryColor: '#00D4FF',
};

const DEMO_PAGE_SETTINGS_WELLNESS: BrandPageSettings = {
  backgroundType: 'animated-flow-field',
  backgroundImage: '',
  backgroundColor: '',
  accentColor: '#22C55E',
  animationTintColor: '#22C55E',
  animationSpeed: 'slow',
  showHeader: true,
  headerStyle: 'transparent',
  contentWidth: 'full',
  sectionSpacing: 'spacious',
  heroFullWidth: false,
  defaultTheme: 'light',
  customPrimaryColor: '#22C55E',
  customSecondaryColor: '#10B981',
};

const DEMO_PAGE_SETTINGS_EVENT: BrandPageSettings = {
  backgroundType: 'animated-aurora',
  backgroundImage: '',
  backgroundColor: '',
  accentColor: '#8B5CF6',
  animationTintColor: '#8B5CF6',
  animationSpeed: 'medium',
  showHeader: true,
  headerStyle: 'transparent',
  contentWidth: 'full',
  sectionSpacing: 'spacious',
  heroFullWidth: false,
  defaultTheme: 'dark',
  customPrimaryColor: '#8B5CF6',
  customSecondaryColor: '#A855F7',
};

// Demo Brand 1: Nexus Tech - Modern Tech Company
export const DEMO_BRAND_NEXUS: Omit<BrandGuide, 'createdAt' | 'updatedAt'> = {
  id: 'demo-nexus-tech',
  type: 'brand',
  slug: 'demo-nexus-tech',
  isFavorite: false,
  isPublic: true,
  sectionOrder: [
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'revenue', 'awards', 'webinars',
    'logos', 'brandicon', 'colors', 'gradients', 'patterns',
    'typography', 'textstyles', 'iconography', 'socialicons', 
    'imagery', 'social', 'socialassets', 'website', 'signatures', 'qr', 
    'videos', 'assets', 'imageassets', 'misuse',
    'casestudies', 'brochures', 'templates', 'templatespecs', 'products', 'events', 'sponsorlogos'
  ] as SectionId[],
  hiddenSections: [],
  pageSettings: DEMO_PAGE_SETTINGS_TECH,
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
    { id: 'l1', name: 'Primary Logo', url: logosNexusVariations, variant: 'primary' },
    { id: 'l2', name: 'Icon Mark', url: logosNexusVariations, variant: 'icon' },
    { id: 'l3', name: 'Wordmark', url: logosNexusVariations, variant: 'wordmark' },
    { id: 'l4', name: 'Reversed (White)', url: logosNexusVariations, variant: 'reversed' },
    { id: 'l5', name: 'Monochrome (Black)', url: logosNexusVariations, variant: 'monochrome' },
    { id: 'l6', name: 'Favicon', url: logosNexusVariations, variant: 'icon' },
  ],
  brandIcons: [
    { id: 'bi1', name: 'Primary Symbol', url: logosNexusVariations, settings: 'Main brand mark - circuit-inspired geometric symbol', isPrimary: true },
    { id: 'bi2', name: 'App Icon', url: logosNexusVariations, settings: 'For mobile applications and favicons', isVariation: true },
    { id: 'bi3', name: 'Social Icon', url: logosNexusVariations, settings: 'Optimized for social media profile images', isVariation: true },
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
    { id: 'i1', name: 'Cloud', svgPath: 'M3 8.5a6.5 6.5 0 1 1 13 0 5.5 5.5 0 1 1 0 11H6a5 5 0 1 1 0-10', category: 'Services', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i2', name: 'Shield', svgPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10', category: 'Security', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i3', name: 'Server', svgPath: 'M2 9h20M2 15h20M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', category: 'Infrastructure', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i4', name: 'Database', svgPath: 'M12 2a9 3 0 0 1 9 3c0 1.657-4.03 3-9 3s-9-1.343-9-3a9 3 0 0 1 9-3zm0 18c-4.97 0-9-1.343-9-3V5m18 12c0 1.657-4.03 3-9 3s-9-1.343-9-3m18-6c0 1.657-4.03 3-9 3s-9-1.343-9-3', category: 'Data', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i5', name: 'Network', svgPath: 'M12 4v4m0 4v8M8 8h8M6 16h12', category: 'Infrastructure', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i6', name: 'API', svgPath: 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11V7a5 5 0 0 1 10 0v4', category: 'Development', viewBox: '0 0 24 24', fillMode: 'stroke' },
  ],
  socialIcons: [
    { id: 'si1', platform: 'LinkedIn', svgPath: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z' },
    { id: 'si2', platform: 'Twitter', svgPath: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
    { id: 'si3', platform: 'GitHub', svgPath: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' },
    { id: 'si4', platform: 'YouTube', svgPath: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z' },
  ],
  imagery: [
    { id: 'im1', url: imageryNexusDo1, type: 'do', description: 'Use high-quality abstract tech imagery with blue tones and glowing elements' },
    { id: 'im2', url: imageryNexusDo2, type: 'do', description: 'Digital circuit patterns and futuristic geometric designs work well' },
    { id: 'im3', url: imageryNexusDo3, type: 'do', description: 'Cloud infrastructure visualization with glowing server rooms and holographic data' },
    { id: 'im4', url: imageryNexusDo4, type: 'do', description: 'Hexagonal network patterns with luminous cyan nodes representing connectivity' },
    { id: 'im5', url: imageryNexusDont1, type: 'dont', description: 'Avoid cluttered layouts with off-brand neon colors and poor contrast' },
    { id: 'im6', url: imageryNexusDont1, type: 'dont', description: 'Never use distorted or stretched logos on busy backgrounds' },
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
    { id: 'vid1', title: 'Brand Story', url: 'https://www.youtube.com/watch?v=example1', type: 'youtube', description: 'Our journey and mission', thumbnail: videoNexus1 },
    { id: 'vid2', title: 'Product Overview', url: 'https://www.youtube.com/watch?v=example2', type: 'youtube', description: 'Platform walkthrough', thumbnail: videoNexus2 },
  ],
  assets: [
    { id: 'a1', name: 'Logo Pack', type: 'zip', url: '', size: '2.5 MB' },
    { id: 'a2', name: 'Brand Guidelines PDF', type: 'pdf', url: '', size: '8.2 MB' },
  ],
  misuse: [
    { id: 'm1', url: misuseNexusExamples, description: 'Do not stretch or distort the logo proportions' },
    { id: 'm2', url: misuseNexusExamples, description: 'Do not use unapproved color combinations' },
    { id: 'm3', url: misuseNexusExamples, description: 'Do not place logo on busy or cluttered backgrounds' },
    { id: 'm4', url: misuseNexusExamples, description: 'Do not rotate or skew the logo mark' },
    { id: 'm5', url: misuseNexusExamples, description: 'Do not add effects like shadows or glows' },
  ],
  atmosphere: {
    style: 'tech',
    animate: true,
    opacity: 0.3,
    blur: 60,
  },
  caseStudies: [
    { id: 'cs1', title: 'Enterprise Cloud Migration', description: 'How we helped Fortune 500 companies transition to cloud infrastructure with zero downtime', previewUrl: casestudyNexus1 },
    { id: 'cs2', title: 'AI Automation Implementation', description: 'Supporting rapid growth from 10 to 10,000 users with scalable architecture', previewUrl: casestudyNexus2 },
    { id: 'cs3', title: 'Healthcare Data Security', description: 'Implementing HIPAA-compliant cloud solutions for medical records', previewUrl: casestudyNexus1 },
  ],
  brochures: [
    { id: 'br1', title: 'API Documentation Guide', category: 'Technical', previewUrl: brochureNexus1, thumbnailUrl: brochureNexus1 },
    { id: 'br2', title: 'Company Overview 2026', category: 'Corporate', previewUrl: brochureNexus1, thumbnailUrl: brochureNexus1 },
    { id: 'br3', title: 'Enterprise Solutions Guide', category: 'Enterprise', previewUrl: brochureNexus1, thumbnailUrl: brochureNexus1 },
  ],
  templates: [
    { id: 'tmp1', name: 'Presentation Template', fileType: 'pptx', fileSize: '5.2 MB', thumbnailUrl: templateNexus1 },
    { id: 'tmp2', name: 'Data Dashboard Template', fileType: 'figma', fileSize: '12 MB', thumbnailUrl: templateNexus1 },
    { id: 'tmp3', name: 'Business Card Template', fileType: 'ai', fileSize: '2.8 MB', thumbnailUrl: templateNexus1 },
    { id: 'tmp4', name: 'Email Signature Kit', fileType: 'zip', fileSize: '1.5 MB', thumbnailUrl: templateNexus1 },
  ],
  awards: [
    { id: 'aw1', title: 'Best Cloud Platform 2025', description: 'Recognized for innovation in enterprise cloud solutions', organization: 'TechCrunch Disrupt', year: 2025, imageUrl: awardNexus1 },
    { id: 'aw2', title: 'Innovation Excellence Award', description: 'Honoring breakthrough technology achievements', organization: 'Forbes Technology Council', year: 2024, imageUrl: awardNexus1 },
    { id: 'aw3', title: 'Top 10 Fastest Growing Tech', description: 'Celebrating exceptional growth and innovation', organization: 'Inc. 5000', year: 2024, imageUrl: awardNexus1 },
    { id: 'aw4', title: 'Enterprise Solution of the Year', description: 'Best-in-class enterprise technology platform', organization: 'Gartner', year: 2023, imageUrl: awardNexus1 },
  ],
  webinars: [
    { id: 'web1', title: 'Cloud Architecture Best Practices', description: 'Learn how to design scalable cloud infrastructure', thumbnailUrl: webinarNexus1, recordingUrl: 'https://youtube.com/watch?v=example', status: 'recorded', date: '2025-11-15' },
    { id: 'web2', title: 'Kubernetes Deep Dive Workshop', description: 'Protecting your data with zero-trust architecture', thumbnailUrl: webinarNexus2, recordingUrl: 'https://youtube.com/watch?v=example', status: 'recorded', date: '2025-10-22' },
    { id: 'web3', title: 'AI-Powered Analytics Deep Dive', description: 'Leveraging machine learning for business insights', thumbnailUrl: webinarNexus1, status: 'upcoming', date: '2026-03-15' },
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
    { id: 'db1', name: 'Responsive Ad Campaign', dimensions: '1920x1080', aspectRatio: 1.78, category: 'desktop', previewImageUrl: bannerNexus1, maxMessaging: 'Headline + CTA only', textLegibility: '24pt minimum', safeZonePolicy: '10% margins all sides' },
    { id: 'db2', name: 'LinkedIn Banner', dimensions: '1584x396', aspectRatio: 4, category: 'desktop', previewImageUrl: socialNexusLinkedin, maxMessaging: 'Brand tagline + logo', textLegibility: '20pt minimum', safeZonePolicy: '15% center safe zone' },
    { id: 'db3', name: 'Email Header', dimensions: '600x200', aspectRatio: 3, category: 'native', previewImageUrl: bannerNexus1, maxMessaging: 'Logo + tagline', textLegibility: '16pt minimum', safeZonePolicy: '5% margins' },
  ],
  services: [
    { id: 'srv1', name: 'Cloud Infrastructure', description: 'Enterprise-grade cloud solutions tailored to your needs', icon: 'Cloud', headerImage: serviceNexus1 },
    { id: 'srv2', name: 'Cybersecurity', description: 'Comprehensive security solutions to protect your business', icon: 'Shield', headerImage: serviceNexus3 },
    { id: 'srv3', name: 'AI & Analytics', description: 'Unlock insights with machine learning and data analytics', icon: 'Brain', headerImage: serviceNexus4 },
    { id: 'srv4', name: 'Digital Transformation', description: 'End-to-end digital transformation consulting', icon: 'Rocket', headerImage: serviceNexus2 },
    { id: 'srv5', name: 'DevOps Solutions', description: 'Streamline your development and deployment pipelines', icon: 'GitBranch', headerImage: serviceNexus1 },
    { id: 'srv6', name: 'API Development', description: 'Build robust, scalable APIs for any platform', icon: 'Code', headerImage: serviceNexus2 },
  ],
  statistics: [
    { id: 'stat1', value: '500', suffix: '+', label: 'Enterprise Clients', icon: 'Building2', category: 'primary' },
    { id: 'stat2', value: '99.9', suffix: '%', label: 'Uptime SLA', icon: 'Shield', category: 'primary' },
    { id: 'stat3', value: '50', suffix: 'M+', label: 'API Calls Daily', icon: 'Zap', category: 'primary' },
    { id: 'stat4', value: '15', label: 'Global Data Centers', icon: 'Globe', category: 'secondary' },
    { id: 'stat5', value: '2.5', prefix: '$', suffix: 'B', label: 'Transactions Processed', icon: 'DollarSign', category: 'secondary' },
    { id: 'stat6', value: '24', suffix: '/7', label: 'Expert Support', icon: 'Headphones', category: 'secondary' },
  ],
  infographicLayout: 'cards',
  revenueData: [
    { year: 2020, revenue: 45, facts: ['Series A funding secured', 'First 50 enterprise clients'] },
    { year: 2021, revenue: 120, facts: ['100 employees milestone', 'Launched Cloud Platform v2.0'] },
    { year: 2022, revenue: 280, facts: ['Enterprise launch', 'SOC 2 Type II certified'] },
    { year: 2023, revenue: 450, facts: ['Global expansion to EMEA', 'Strategic partnership with AWS'] },
    { year: 2024, revenue: 720, facts: ['IPO preparation', 'Acquired DataFlow Systems'] },
    { year: 2025, revenue: 950, facts: ['1000+ enterprise clients', 'AI Platform launch'] },
  ],
  templateSpecs: [
    { 
      id: 'ts1', 
      name: 'Presentation Template Spec', 
      category: 'template', 
      previewImageUrl: templatespecsNexus,
      items: [
        { id: 'spec1', number: 1, title: 'Header Zone', description: 'Primary headline placement with 32pt Inter Bold', dimensions: '1920 x 200 pixels' },
        { id: 'spec2', number: 2, title: 'Body Content Area', description: 'Main content area with 18pt Inter Regular', dimensions: '1600 x 600 pixels' },
        { id: 'spec3', number: 3, title: 'Footer Bar', description: 'Logo placement and page number zone', dimensions: '1920 x 80 pixels' },
        { id: 'spec4', number: 4, title: 'Accent Strip', description: 'Brand gradient accent element', dimensions: '100% width x 8px height' },
      ],
      notes: 'Use brand colors only. Maintain 10% margin safe zones on all sides.'
    },
    { 
      id: 'ts2', 
      name: 'Business Card Spec', 
      category: 'template', 
      previewImageUrl: templatespecsNexus,
      items: [
        { id: 'spec1', number: 1, title: 'Logo Area', description: 'Primary logo at 40% scale', dimensions: '200 x 50 pixels' },
        { id: 'spec2', number: 2, title: 'Contact Info', description: 'Name, title, email, phone in Inter Medium', dimensions: 'Flexible height' },
        { id: 'spec3', number: 3, title: 'QR Code Zone', description: 'Optional QR code placement', dimensions: '80 x 80 pixels' },
      ],
      notes: 'Standard business card size: 3.5" x 2" (88.9mm x 50.8mm)'
    },
    { 
      id: 'ts3', 
      name: 'Email Newsletter Spec', 
      category: 'template', 
      previewImageUrl: templatespecsNexus,
      items: [
        { id: 'spec1', number: 1, title: 'Header Banner', description: 'Full-width header with logo and gradient background', dimensions: '600 x 150 pixels' },
        { id: 'spec2', number: 2, title: 'Content Blocks', description: 'Modular content sections with 2-column option', dimensions: '600 x auto pixels' },
        { id: 'spec3', number: 3, title: 'CTA Button', description: 'Rounded button with brand gradient', dimensions: '200 x 48 pixels' },
        { id: 'spec4', number: 4, title: 'Footer', description: 'Social links, unsubscribe, address', dimensions: '600 x 100 pixels' },
      ],
      notes: 'Max email width: 600px. Use web-safe fonts with fallbacks.'
    },
  ],
  linkedGuides: [
    { id: 'lg1', guideId: 'demo-nexus-cloud', guideType: 'product', name: 'Nexus Cloud', slug: 'demo-nexus-cloud', type: 'product', coverImage: cardNexusCloud },
    { id: 'lg2', guideId: 'demo-innovation-summit', guideType: 'event', name: 'Innovation Summit 2026', slug: 'demo-innovation-summit', type: 'event', coverImage: cardInnovationSummit },
  ],
  sponsorLogos: [
    { id: 'sp1', name: 'AWS', url: '', tier: 'platinum', description: 'Strategic Cloud Partner' },
    { id: 'sp2', name: 'Microsoft Azure', url: '', tier: 'gold', description: 'Infrastructure Partner' },
    { id: 'sp3', name: 'Google Cloud', url: '', tier: 'gold', description: 'AI & ML Partner' },
    { id: 'sp4', name: 'Cloudflare', url: '', tier: 'silver', description: 'Security Partner' },
    { id: 'sp5', name: 'Datadog', url: '', tier: 'silver', description: 'Monitoring Partner' },
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
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'revenue', 'awards',
    'logos', 'brandicon', 'colors', 'gradients', 'patterns',
    'typography', 'textstyles', 'iconography', 'socialicons',
    'imagery', 'social', 'socialassets', 'website', 'signatures', 'qr', 
    'videos', 'assets', 'imageassets', 'misuse',
    'casestudies', 'brochures', 'templates', 'products', 'sponsorlogos'
  ] as SectionId[],
  hiddenSections: [],
  pageSettings: DEMO_PAGE_SETTINGS_WELLNESS,
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
    { id: 'l1', name: 'Primary Logo', url: logosBloomVariations, variant: 'primary' },
    { id: 'l2', name: 'Leaf Mark', url: logosBloomVariations, variant: 'icon' },
    { id: 'l3', name: 'Wordmark', url: logosBloomVariations, variant: 'wordmark' },
    { id: 'l4', name: 'White Reversed', url: logosBloomVariations, variant: 'reversed' },
    { id: 'l5', name: 'Monochrome Black', url: logosBloomVariations, variant: 'monochrome' },
    { id: 'l6', name: 'Stacked Logo', url: logosBloomVariations, variant: 'secondary' },
  ],
  brandIcons: [
    { id: 'bi1', name: 'Bloom Leaf Symbol', url: logosBloomVariations, settings: 'Main botanical leaf mark - organic three-leaf design', isPrimary: true },
    { id: 'bi2', name: 'App Icon', url: logosBloomVariations, settings: 'Simplified leaf for mobile apps', isVariation: true },
    { id: 'bi3', name: 'Favicon', url: logosBloomVariations, settings: 'Minimal leaf for browser tabs', isVariation: true },
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
  iconography: [
    { id: 'i1', name: 'Leaf', svgPath: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z', category: 'Nature', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i2', name: 'Heart', svgPath: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z', category: 'Wellness', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i3', name: 'Droplet', svgPath: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z', category: 'Essential Oils', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i4', name: 'Sun', svgPath: 'M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', category: 'Energy', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i5', name: 'Flower', svgPath: 'M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15', category: 'Botanical', viewBox: '0 0 24 24', fillMode: 'stroke' },
  ],
  socialIcons: [
    { id: 'si1', platform: 'Instagram', svgPath: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2z' },
    { id: 'si2', platform: 'Pinterest', svgPath: 'M12 2a10 10 0 0 0-4.16 19.12c-.08-.94-.02-2.07.24-3.1l1.8-7.62s-.45-.9-.45-2.24c0-2.1 1.22-3.66 2.74-3.66 1.3 0 1.92.97 1.92 2.14 0 1.3-.83 3.26-1.26 5.07-.36 1.5.75 2.74 2.24 2.74 2.68 0 4.5-3.44 4.5-7.5 0-3.1-2.1-5.4-5.9-5.4-4.3 0-7 3.2-7 6.8 0 1.24.37 2.12.94 2.8.26.3.3.44.2.8l-.3 1.1c-.1.36-.4.5-.74.36-2-.82-2.92-3-2.92-5.46 0-4.04 3.4-8.9 10.14-8.9 5.4 0 8.96 3.9 8.96 8.1 0 5.56-3.1 9.7-7.66 9.7-1.54 0-2.98-.82-3.48-1.76l-.96 3.78c-.3 1.04-.9 2.08-1.44 2.9A10 10 0 1 0 12 2z' },
    { id: 'si3', platform: 'Facebook', svgPath: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
  ],
  imagery: [
    { id: 'im1', url: imageryBloomDo1, type: 'do', description: 'Use serene botanical close-ups with soft natural lighting' },
    { id: 'im2', url: imageryBloomDo2, type: 'do', description: 'Organic flat lays with herbs and natural textures' },
    { id: 'im3', url: imageryBloomDo3, type: 'do', description: 'Wellness flat lays with lavender, essential oils, and wooden bowls on linen' },
    { id: 'im4', url: imageryBloomDo4, type: 'do', description: 'Lifestyle imagery showing meditation in natural botanical garden settings' },
    { id: 'im5', url: imageryBloomDont1, type: 'dont', description: 'Avoid artificial flowers, harsh fluorescent lighting, and neon colors' },
    { id: 'im6', url: imageryBloomDont1, type: 'dont', description: 'Never use clinical or sterile environments that feel unnatural' },
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
    { id: 'vid1', title: 'Our Wellness Journey', url: 'https://www.youtube.com/watch?v=example1', type: 'youtube', description: 'The story behind Bloom Wellness', thumbnail: videoBloom1 },
    { id: 'vid2', title: 'How We Source Our Ingredients', url: 'https://www.youtube.com/watch?v=example2', type: 'youtube', description: 'Farm to bottle transparency', thumbnail: videoBloom2 },
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
    { id: 'cs1', title: 'Wellness Retreat Partnership', description: 'How we partnered with luxury resorts to provide spa-quality products', previewUrl: casestudyBloom1 },
    { id: 'cs2', title: 'Sustainable Packaging Initiative', description: 'Our journey to 100% recyclable and biodegradable packaging', previewUrl: casestudyBloom1 },
  ],
  brochures: [
    { id: 'br1', title: 'Essential Oils Catalog', category: 'Products', previewUrl: brochureBloom1, thumbnailUrl: brochureBloom1 },
    { id: 'br2', title: 'Wellness Guide', category: 'Educational', previewUrl: brochureBloom1, thumbnailUrl: brochureBloom1 },
    { id: 'br3', title: 'Retail Partner Kit', category: 'B2B', previewUrl: brochureBloom1, thumbnailUrl: brochureBloom1 },
  ],
  templates: [
    { id: 'tmp1', name: 'Product Label Design', fileType: 'ai', fileSize: '3.5 MB', thumbnailUrl: templateBloom1 },
    { id: 'tmp2', name: 'Essential Oil Bottles Mockup', fileType: 'psd', fileSize: '45 MB', thumbnailUrl: templateBloom1 },
    { id: 'tmp3', name: 'Presentation Template', fileType: 'pptx', fileSize: '4.2 MB', thumbnailUrl: templateBloom1 },
  ],
  awards: [
    { id: 'aw1', title: 'Best Organic Wellness Brand', description: 'Recognized for commitment to organic ingredients', organization: 'Natural Products Expo', year: 2025, imageUrl: awardBloom1 },
    { id: 'aw2', title: 'Sustainability Excellence Award', description: 'Leading the industry in eco-friendly practices', organization: 'Green Business Council', year: 2024, imageUrl: awardBloom1 },
    { id: 'aw3', title: 'Eco-Packaging Award', description: 'Recognition for recyclable glass packaging', organization: 'Sustainable Packaging Coalition', year: 2024, imageUrl: awardBloom1 },
  ],
  imageAssets: [
    { id: 'ia1', name: 'Brand Stationery Suite', url: collateralBloomStationery, type: 'collateral', size: '3.2 MB', uploadedAt: '2025-12-01' },
    { id: 'ia2', name: 'Product Catalog Preview', url: collateralBloomBrochure, type: 'collateral', size: '2.8 MB', uploadedAt: '2025-12-01' },
    { id: 'ia3', name: 'Botanical Icon Set', url: iconographyBloomWellness, type: 'iconography', size: '1.2 MB', uploadedAt: '2025-12-01' },
  ],
  services: [
    { id: 'srv1', name: 'Wellness Coaching', description: 'Personalized guidance for your wellness journey', icon: 'Heart', headerImage: serviceBloom1 },
    { id: 'srv2', name: 'Organic Products', description: 'Premium organic wellness products for mind and body', icon: 'Leaf', headerImage: serviceBloom3 },
    { id: 'srv3', name: 'Retreat Programs', description: 'Immersive wellness retreat experiences in nature', icon: 'Sunrise', headerImage: serviceBloom4 },
    { id: 'srv4', name: 'Corporate Wellness', description: 'Workplace wellness programs for teams', icon: 'Users', headerImage: serviceBloom2 },
    { id: 'srv5', name: 'Online Classes', description: 'Virtual yoga, meditation, and wellness workshops', icon: 'Play', headerImage: serviceBloom2 },
    { id: 'srv6', name: 'Spa Partnerships', description: 'White-label products for luxury spas and resorts', icon: 'Sparkles', headerImage: serviceBloom3 },
  ],
  statistics: [
    { id: 'stat1', value: '100', suffix: '%', label: 'Organic Ingredients', icon: 'Leaf', category: 'primary' },
    { id: 'stat2', value: '50', suffix: 'K+', label: 'Happy Customers', icon: 'Heart', category: 'primary' },
    { id: 'stat3', value: '12', label: 'Wellness Retreats', icon: 'MapPin', category: 'secondary' },
    { id: 'stat4', value: '98', suffix: '%', label: 'Customer Satisfaction', icon: 'Star', category: 'primary' },
    { id: 'stat5', value: '200', suffix: '+', label: 'Retail Partners', icon: 'Store', category: 'secondary' },
    { id: 'stat6', value: '15', label: 'Countries Served', icon: 'Globe', category: 'secondary' },
  ],
  infographicLayout: 'cards',
  socialAssets: [
    { id: 'sa1', platform: 'Instagram', postSize: '1080x1080', storySize: '1080x1920', previewImageUrl: socialBloomInstagram, textLegibility: 'Elegant script, 20pt minimum', directive: 'Natural botanical imagery with soft lighting' },
    { id: 'sa2', platform: 'Pinterest', postSize: '1000x1500', previewImageUrl: socialBloomInstagram, textLegibility: 'Clean serif, high contrast', directive: 'Lifestyle and product flat lays' },
    { id: 'sa3', platform: 'LinkedIn', postSize: '1200x1200', coverSize: '1584x396', previewImageUrl: socialBloomLinkedin, textLegibility: 'Professional, 22pt minimum', directive: 'Company culture and behind-the-scenes' },
    { id: 'sa4', platform: 'Facebook', postSize: '1200x630', coverSize: '820x312', previewImageUrl: socialBloomLinkedin, textLegibility: '16pt minimum for legibility', directive: 'Community engagement and wellness tips' },
  ],
  displayBanners: [
    { id: 'db1', name: 'Website Hero', dimensions: '1920x800', aspectRatio: 2.4, category: 'desktop', previewImageUrl: heroBloomWellness, maxMessaging: 'Tagline + CTA', textLegibility: '48pt display headline', safeZonePolicy: '15% margins' },
    { id: 'db2', name: 'Email Header', dimensions: '600x200', aspectRatio: 3, category: 'native', previewImageUrl: collateralBloomStationery, maxMessaging: 'Logo + seasonal message', textLegibility: '20pt minimum', safeZonePolicy: 'Center-aligned content' },
    { id: 'db3', name: 'Retail Display', dimensions: '1080x1920', aspectRatio: 0.56, category: 'mobile', previewImageUrl: socialBloomInstagram, maxMessaging: 'Product + price + CTA', textLegibility: '24pt minimum for distance', safeZonePolicy: 'Bottom 20% for product placement' },
  ],
  webinars: [
    { id: 'web1', title: 'Introduction to Essential Oils', description: 'Learn the basics of aromatherapy and essential oil usage', thumbnailUrl: webinarBloom1, recordingUrl: 'https://youtube.com/watch?v=example', status: 'recorded', date: '2025-09-15' },
    { id: 'web2', title: 'Building a Daily Wellness Routine', description: 'Expert tips for incorporating wellness into your daily life', thumbnailUrl: webinarBloom1, recordingUrl: 'https://youtube.com/watch?v=example', status: 'recorded', date: '2025-10-20' },
    { id: 'web3', title: 'Sustainable Beauty Practices', description: 'Eco-friendly approaches to personal care and wellness', thumbnailUrl: webinarBloom1, status: 'upcoming', date: '2026-03-15' },
    { id: 'web4', title: 'Corporate Wellness Workshop', description: 'Implementing wellness programs in the workplace', thumbnailUrl: webinarBloom1, status: 'upcoming', date: '2026-04-10' },
  ],
  revenueData: [
    { year: 2020, revenue: 2.5, facts: ['Launched first product line'] },
    { year: 2021, revenue: 8, facts: ['Expanded to 500 retail locations'] },
    { year: 2022, revenue: 18, facts: ['International expansion'] },
    { year: 2023, revenue: 32, facts: ['B2B wellness programs'] },
    { year: 2024, revenue: 45, facts: ['Retreat program launch'] },
    { year: 2025, revenue: 58, facts: ['1M customers milestone'] },
  ],
  templateSpecs: [
    { 
      id: 'ts1', 
      name: 'Product Label Spec', 
      category: 'template', 
      previewImageUrl: collateralBloomBrochure,
      items: [
        { id: 'spec1', number: 1, title: 'Product Name Zone', description: 'Playfair Display 24pt, centered', dimensions: '3 x 0.5 inches' },
        { id: 'spec2', number: 2, title: 'Botanical Illustration', description: 'Hand-drawn botanical art, monochrome', dimensions: '2 x 2 inches' },
        { id: 'spec3', number: 3, title: 'Ingredient List', description: 'Lato 8pt, justified alignment', dimensions: '2.5 x 1 inches' },
        { id: 'spec4', number: 4, title: 'Certification Badges', description: 'Organic, Cruelty-Free badges', dimensions: '0.5 x 0.5 inches each' },
      ],
      notes: 'Use uncoated paper stock for eco-friendly presentation. All labels must include batch number.'
    },
    { 
      id: 'ts2', 
      name: 'Gift Box Insert Spec', 
      category: 'template', 
      previewImageUrl: collateralBloomBrochure,
      items: [
        { id: 'spec1', number: 1, title: 'Welcome Message', description: 'Handwritten-style script font', dimensions: 'Full width' },
        { id: 'spec2', number: 2, title: 'Usage Instructions', description: 'Clear, friendly copy with icons', dimensions: '4 x 3 inches' },
        { id: 'spec3', number: 3, title: 'QR Code', description: 'Links to video tutorials', dimensions: '1 x 1 inch' },
      ],
      notes: 'Printed on seed paper - can be planted after use.'
    },
  ],
  linkedGuides: [
    { id: 'lg1', guideId: 'demo-bloom-oils', guideType: 'product', name: 'Essential Oils', slug: 'demo-bloom-oils', type: 'product', coverImage: cardBloomOils },
    { id: 'lg2', guideId: 'demo-bloom-retreat', guideType: 'event', name: 'Wellness Retreat 2026', slug: 'demo-bloom-retreat', type: 'event', coverImage: cardBloomRetreat },
  ],
  sponsorLogos: [
    { id: 'sp1', name: 'Whole Foods Market', url: '', tier: 'platinum', description: 'Exclusive Retail Partner' },
    { id: 'sp2', name: 'Gaia Herbs', url: '', tier: 'gold', description: 'Ingredient Partner' },
    { id: 'sp3', name: 'Dr. Bronners', url: '', tier: 'silver', description: 'Sustainability Partner' },
    { id: 'sp4', name: 'Patagonia', url: '', tier: 'partner', description: 'Environmental Ally' },
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
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'awards', 'webinars',
    'logos', 'brandicon', 'colors', 'gradients', 'patterns', 
    'typography', 'textstyles', 'iconography', 'socialicons',
    'imagery', 'social', 'socialassets', 'website', 'signatures', 'qr',
    'videos', 'assets', 'imageassets', 'misuse',
    'casestudies', 'brochures', 'templates', 'templatespecs'
  ] as SectionId[],
  hiddenSections: [],
  pageSettings: DEMO_PAGE_SETTINGS_TECH,
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
  iconography: [
    { id: 'i1', name: 'Server', svgPath: 'M2 9h20M2 15h20M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', category: 'Infrastructure', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i2', name: 'Database', svgPath: 'M12 2a9 3 0 0 1 9 3c0 1.657-4.03 3-9 3s-9-1.343-9-3a9 3 0 0 1 9-3zm0 18c-4.97 0-9-1.343-9-3V5m18 12c0 1.657-4.03 3-9 3s-9-1.343-9-3m18-6c0 1.657-4.03 3-9 3s-9-1.343-9-3', category: 'Data', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i3', name: 'Container', svgPath: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6m-6 6h6', category: 'DevOps', viewBox: '0 0 24 24', fillMode: 'stroke' },
    { id: 'i4', name: 'LoadBalancer', svgPath: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83', category: 'Networking', viewBox: '0 0 24 24', fillMode: 'stroke' },
  ],
  socialIcons: [
    { id: 'si1', platform: 'Twitter', svgPath: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
    { id: 'si2', platform: 'GitHub', svgPath: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' },
  ],
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
  videos: [
    { id: 'vid1', title: 'Getting Started with Nexus Cloud', url: 'https://www.youtube.com/watch?v=example1', type: 'youtube', description: 'Quick start guide for new users', thumbnail: videoNexus2 },
    { id: 'vid2', title: 'Cloud Architecture Overview', url: 'https://www.youtube.com/watch?v=example2', type: 'youtube', description: 'Understanding our infrastructure', thumbnail: videoNexus1 },
  ],
  assets: [
    { id: 'a1', name: 'Cloud SDK', type: 'zip', url: '', size: '12.5 MB' },
    { id: 'a2', name: 'API Documentation', type: 'pdf', url: '', size: '3.2 MB' },
  ],
  misuse: [
    { id: 'm1', url: misuseNexusExamples, description: 'Do not modify the cloud icon proportions' },
    { id: 'm2', url: misuseNexusExamples, description: 'Do not use non-brand colors for product materials' },
  ],
  atmosphere: {
    style: 'tech',
    animate: true,
    opacity: 0.25,
    blur: 50,
  },
  caseStudies: [
    { id: 'cs1', title: 'Enterprise Migration Success', description: 'How Fortune 100 companies migrated to Nexus Cloud', previewUrl: casestudyCloud1 },
    { id: 'cs2', title: 'Startup Scale Story', description: 'From 0 to 10M users in 18 months on Nexus Cloud', previewUrl: casestudyCloud1 },
  ],
  brochures: [
    { id: 'br1', title: 'Nexus Cloud Overview', category: 'Product', previewUrl: brochureCloud1, thumbnailUrl: brochureCloud1 },
    { id: 'br2', title: 'Pricing Guide', category: 'Sales', previewUrl: brochureCloud1, thumbnailUrl: brochureCloud1 },
    { id: 'br3', title: 'Security Whitepaper', category: 'Technical', previewUrl: brochureCloud1, thumbnailUrl: brochureCloud1 },
  ],
  templates: [
    { id: 'tmp1', name: 'Architecture Diagram Template', fileType: 'pptx', fileSize: '3.5 MB', thumbnailUrl: templateCloud1 },
    { id: 'tmp2', name: 'API Documentation Template', fileType: 'md', fileSize: '500 KB', thumbnailUrl: templateCloud1 },
  ],
  imageAssets: [
    { id: 'ia1', name: 'Cloud Platform Screenshot', url: imageassetsLibrary, type: 'product', size: '2.1 MB', uploadedAt: '2025-12-01' },
    { id: 'ia2', name: 'Dashboard UI Kit', url: assetDownload1, type: 'ui', size: '15 MB', uploadedAt: '2025-12-01' },
  ],
  socialAssets: [
    { id: 'sa1', platform: 'LinkedIn', postSize: '1200x1200', previewImageUrl: socialassetsNexusSpecs, textLegibility: 'High contrast on dark backgrounds', directive: 'Use cloud imagery with gradient accents' },
  ],
  displayBanners: [
    { id: 'db1', name: 'Product Banner', dimensions: '1200x628', aspectRatio: 1.91, category: 'native', previewImageUrl: socialNexusLinkedin, maxMessaging: 'Product features + CTA', textLegibility: '20pt minimum', safeZonePolicy: '10% margins' },
  ],
  services: [
    { id: 'srv1', name: 'Compute', description: 'Scalable virtual machines and containers', icon: 'Server', headerImage: serviceCloud1 },
    { id: 'srv2', name: 'Storage', description: 'Object, block, and file storage solutions', icon: 'Database', headerImage: serviceCloud2 },
    { id: 'srv3', name: 'Networking', description: 'Global load balancing and CDN', icon: 'Globe', headerImage: serviceCloud1 },
    { id: 'srv4', name: 'Kubernetes', description: 'Managed Kubernetes clusters', icon: 'Box', headerImage: serviceCloud2 },
    { id: 'srv5', name: 'Serverless', description: 'Functions-as-a-service with auto-scaling', icon: 'Zap', headerImage: serviceCloud1 },
    { id: 'srv6', name: 'Security', description: 'Identity management and encryption', icon: 'Shield', headerImage: serviceCloud2 },
  ],
  statistics: [
    { id: 'stat1', value: '99.99', suffix: '%', label: 'Uptime SLA', icon: 'Shield', category: 'primary' },
    { id: 'stat2', value: '200', suffix: 'ms', label: 'Average Latency', icon: 'Zap', category: 'primary' },
    { id: 'stat3', value: '25', label: 'Global Regions', icon: 'Globe', category: 'secondary' },
    { id: 'stat4', value: '10', suffix: 'M+', label: 'Containers Running', icon: 'Box', category: 'primary' },
    { id: 'stat5', value: '500', suffix: 'PB', label: 'Data Stored', icon: 'Database', category: 'secondary' },
    { id: 'stat6', value: '24', suffix: '/7', label: 'Support Available', icon: 'Headphones', category: 'secondary' },
  ],
  infographicLayout: 'cards',
  revenueData: [
    { year: 2021, revenue: 15, facts: ['Product launch'] },
    { year: 2022, revenue: 45, facts: ['First 100 customers'] },
    { year: 2023, revenue: 120, facts: ['Enterprise tier launch'] },
    { year: 2024, revenue: 280, facts: ['Global expansion'] },
    { year: 2025, revenue: 450, facts: ['1000+ customers'] },
  ],
  awards: [
    { id: 'aw1', title: 'Best Cloud Platform 2025', description: 'Recognized for enterprise reliability', organization: 'Cloud Computing Awards', year: 2025, imageUrl: awardNexus1 },
    { id: 'aw2', title: 'Developer Choice Award', description: 'Most developer-friendly cloud platform', organization: 'DevOps World', year: 2024, imageUrl: awardNexus1 },
    { id: 'aw3', title: 'Security Excellence Award', description: 'Industry-leading security practices', organization: 'CSO 50 Awards', year: 2024, imageUrl: awardNexus1 },
  ],
  webinars: [
    { id: 'web1', title: 'Getting Started with Nexus Cloud', description: 'Complete onboarding walkthrough', thumbnailUrl: webinarNexus1, recordingUrl: 'https://youtube.com/watch?v=example', status: 'recorded', date: '2025-11-01' },
    { id: 'web2', title: 'Advanced Kubernetes Management', description: 'Deep dive into container orchestration', thumbnailUrl: webinarNexus2, status: 'upcoming', date: '2026-03-20' },
    { id: 'web3', title: 'Security Best Practices', description: 'Zero-trust architecture implementation', thumbnailUrl: webinarNexus1, recordingUrl: 'https://youtube.com/watch?v=example', status: 'recorded', date: '2025-09-15' },
    { id: 'web4', title: 'Cost Optimization Workshop', description: 'Reduce cloud spend by 30%', thumbnailUrl: webinarNexus2, status: 'upcoming', date: '2026-04-10' },
  ],
  templateSpecs: [
    { 
      id: 'ts1', 
      name: 'Architecture Diagram Spec', 
      category: 'template', 
      previewImageUrl: templatespecsNexus,
      items: [
        { id: 'spec1', number: 1, title: 'Service Nodes', description: 'Use rounded rectangles for services', dimensions: '120 x 80 pixels' },
        { id: 'spec2', number: 2, title: 'Connection Lines', description: 'Use brand cyan for data flow arrows', dimensions: '2px stroke' },
        { id: 'spec3', number: 3, title: 'Labels', description: 'Inter Medium 12pt for all labels', dimensions: 'Auto' },
        { id: 'spec4', number: 4, title: 'Region Boundaries', description: 'Dashed lines for availability zones', dimensions: '1px dashed' },
      ],
      notes: 'Maintain consistent spacing of 40px between service nodes. Use brand gradients for highlights.'
    },
    { 
      id: 'ts2', 
      name: 'CLI Documentation Spec', 
      category: 'template', 
      previewImageUrl: templatespecsNexus,
      items: [
        { id: 'spec1', number: 1, title: 'Command Block', description: 'Dark background with Fira Code font', dimensions: 'Full width, 48px min-height' },
        { id: 'spec2', number: 2, title: 'Output Example', description: 'Light gray background, monospace', dimensions: 'Full width' },
        { id: 'spec3', number: 3, title: 'Annotations', description: 'Callout boxes with cyan accent', dimensions: '200px max-width' },
      ],
      notes: 'Always include copy-to-clipboard button on code blocks.'
    },
  ],
  sponsorLogos: [
    { id: 'sp1', name: 'Docker', url: '', tier: 'platinum', description: 'Container Partner' },
    { id: 'sp2', name: 'Kubernetes', url: '', tier: 'gold', description: 'Orchestration Partner' },
    { id: 'sp3', name: 'HashiCorp', url: '', tier: 'silver', description: 'Infrastructure Partner' },
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
    'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'awards',
    'logos', 'brandicon', 'colors', 'gradients', 'patterns', 
    'typography', 'textstyles', 'iconography', 'socialicons',
    'imagery', 'social', 'socialassets', 'website', 'signatures', 'qr',
    'videos', 'assets', 'imageassets', 'misuse',
    'brochures', 'templates'
  ] as SectionId[],
  hiddenSections: [],
  pageSettings: DEMO_PAGE_SETTINGS_WELLNESS,
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
    { id: 'v1', text: 'Purity', description: '100% pure, no synthetic additives or fillers ever', icon: 'Droplet' },
    { id: 'v2', text: 'Sustainability', description: 'Ethically sourced from sustainable organic farms worldwide', icon: 'Leaf' },
    { id: 'v3', text: 'Transparency', description: 'Every bottle includes full sourcing and testing information', icon: 'Eye' },
    { id: 'v4', text: 'Education', description: 'Empowering customers with aromatherapy knowledge', icon: 'BookOpen' },
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
  videos: [
    { id: 'vid1', title: 'Oil Blending Guide', url: 'https://www.youtube.com/watch?v=example1', type: 'youtube', description: 'Learn the art of creating custom blends', thumbnail: videoBloom2 },
    { id: 'vid2', title: 'Product Application Tips', url: 'https://www.youtube.com/watch?v=example2', type: 'youtube', description: 'How to get the most out of your essential oils', thumbnail: videoBloom1 },
  ],
  assets: [
    { id: 'a1', name: 'Product Labels', type: 'zip', url: '', size: '1.5 MB' },
  ],
  misuse: [
    { id: 'm1', url: '', description: 'Do not use Essential Oils branding on non-organic products' },
    { id: 'm2', url: '', description: 'Do not alter the botanical illustrations' },
  ],
  atmosphere: {
    style: 'organic',
    animate: true,
    opacity: 0.2,
    blur: 80,
  },
  caseStudies: [
    { id: 'cs1', title: 'Spa Partnership Success', description: 'How we became the exclusive oil supplier for 50+ luxury spas', previewUrl: casestudyOils1 },
    { id: 'cs2', title: 'Retail Expansion', description: 'From local markets to 500+ retail locations nationwide', previewUrl: casestudyOils1 },
  ],
  brochures: [
    { id: 'br1', title: 'Essential Oils Guide', category: 'Product', previewUrl: brochureOils1, thumbnailUrl: brochureOils1 },
    { id: 'br2', title: 'Blending Handbook', category: 'Educational', previewUrl: brochureOils1, thumbnailUrl: brochureOils1 },
    { id: 'br3', title: 'Wholesale Catalog', category: 'B2B', previewUrl: brochureOils1, thumbnailUrl: brochureOils1 },
  ],
  templates: [
    { id: 'tmp1', name: 'Product Label Template', fileType: 'ai', fileSize: '2.1 MB', thumbnailUrl: templateOils1 },
    { id: 'tmp2', name: 'Bottle Mockup', fileType: 'psd', fileSize: '45 MB', thumbnailUrl: templateOils1 },
    { id: 'tmp3', name: 'Gift Set Box Design', fileType: 'ai', fileSize: '8.5 MB', thumbnailUrl: templateOils1 },
  ],
  imageAssets: [
    { id: 'ia1', name: 'Botanical Illustrations', url: iconographyBloomWellness, type: 'illustration', size: '3.5 MB', uploadedAt: '2025-12-01' },
    { id: 'ia2', name: 'Product Photography Kit', url: socialBloomInstagram, type: 'product', size: '120 MB', uploadedAt: '2025-12-01' },
    { id: 'ia3', name: 'Lifestyle Imagery', url: imageryBloomDo1, type: 'lifestyle', size: '85 MB', uploadedAt: '2025-12-01' },
  ],
  socialAssets: [
    { id: 'sa1', platform: 'Instagram', postSize: '1080x1080', storySize: '1080x1920', previewImageUrl: socialBloomInstagram, textLegibility: 'Elegant serif, 18pt minimum', directive: 'Product photography with botanical accents' },
    { id: 'sa2', platform: 'Pinterest', postSize: '1000x1500', previewImageUrl: socialBloomInstagram, textLegibility: 'Script font, high contrast', directive: 'DIY recipes and usage tips' },
    { id: 'sa3', platform: 'TikTok', postSize: '1080x1920', previewImageUrl: socialBloomInstagram, textLegibility: 'Bold sans-serif, 24pt minimum', directive: 'Quick tips and product demos' },
  ],
  displayBanners: [
    { id: 'db1', name: 'E-commerce Banner', dimensions: '1200x400', aspectRatio: 3, category: 'desktop', previewImageUrl: heroBloomOils, maxMessaging: 'Product + benefit + CTA', textLegibility: '28pt headline', safeZonePolicy: 'Center third for text' },
    { id: 'db2', name: 'Retail Shelf Talker', dimensions: '4x6 inches', aspectRatio: 0.67, category: 'native', previewImageUrl: brochureBloom1, maxMessaging: 'Product name + key benefit', textLegibility: '14pt minimum', safeZonePolicy: 'Top third for product image' },
  ],
  awards: [
    { id: 'aw1', title: 'Best Essential Oil Brand', description: 'Top rated for purity and sustainability', organization: 'Natural Beauty Awards', year: 2025, imageUrl: awardBloom1 },
    { id: 'aw2', title: 'Eco-Packaging Award', description: 'Recognition for recyclable glass packaging initiative', organization: 'Sustainable Packaging Coalition', year: 2024, imageUrl: awardBloom1 },
    { id: 'aw3', title: 'Customer Choice Award', description: 'Voted #1 by wellness enthusiasts', organization: 'Wellness Magazine', year: 2024, imageUrl: awardBloom1 },
  ],
  webinars: [
    { id: 'web1', title: 'Introduction to Aromatherapy', description: 'Basics of essential oil usage for beginners', thumbnailUrl: webinarBloom1, recordingUrl: 'https://youtube.com/watch?v=example', status: 'recorded', date: '2025-08-15' },
    { id: 'web2', title: 'DIY Blending Workshop', description: 'Create your own custom essential oil blends', thumbnailUrl: webinarBloom1, recordingUrl: 'https://youtube.com/watch?v=example', status: 'recorded', date: '2025-10-01' },
    { id: 'web3', title: 'Seasonal Wellness Rituals', description: 'Oils for every season and occasion', thumbnailUrl: webinarBloom1, status: 'upcoming', date: '2026-03-21' },
  ],
  templateSpecs: [
    { 
      id: 'ts1', 
      name: 'Essential Oil Label Spec', 
      category: 'template', 
      previewImageUrl: collateralBloomBrochure,
      items: [
        { id: 'spec1', number: 1, title: 'Product Name', description: 'Cormorant Garamond 18pt, centered', dimensions: '2.5 x 0.4 inches' },
        { id: 'spec2', number: 2, title: 'Volume Indicator', description: 'Lato 10pt, right-aligned', dimensions: '0.5 x 0.2 inches' },
        { id: 'spec3', number: 3, title: 'Botanical Illustration', description: 'Hand-drawn line art, single color', dimensions: '1.5 x 1.5 inches' },
        { id: 'spec4', number: 4, title: 'Usage Icons', description: 'Diffuser, topical, aromatic symbols', dimensions: '16px each' },
      ],
      notes: 'Labels printed on water-resistant paper. QR code links to detailed usage guide.'
    },
  ],
  services: [
    { id: 'srv1', name: 'Single Oils', description: 'Pure single-origin essential oils from around the world', icon: 'Droplet', headerImage: serviceOils1 },
    { id: 'srv2', name: 'Signature Blends', description: 'Expertly crafted therapeutic oil blends', icon: 'Sparkles', headerImage: serviceOils2 },
    { id: 'srv3', name: 'Diffusers', description: 'Premium ultrasonic aromatherapy diffusers', icon: 'Wind', headerImage: serviceOils1 },
    { id: 'srv4', name: 'Gift Sets', description: 'Curated collections for every occasion', icon: 'Gift', headerImage: serviceOils2 },
    { id: 'srv5', name: 'Subscription Box', description: 'Monthly discovery of new oils and blends', icon: 'Package', headerImage: serviceOils1 },
  ],
  statistics: [
    { id: 'stat1', value: '100', suffix: '%', label: 'Pure Oils', icon: 'Droplet', category: 'primary' },
    { id: 'stat2', value: '45', suffix: '+', label: 'Oil Varieties', icon: 'Leaf', category: 'primary' },
    { id: 'stat3', value: '4.9', label: 'Star Rating', icon: 'Star', category: 'secondary' },
    { id: 'stat4', value: '50', suffix: 'K+', label: 'Happy Customers', icon: 'Heart', category: 'primary' },
    { id: 'stat5', value: '12', label: 'Source Countries', icon: 'Globe', category: 'secondary' },
  ],
  infographicLayout: 'cards',
  sponsorLogos: [
    { id: 'sp1', name: 'Whole Foods Market', url: '', tier: 'platinum', description: 'Exclusive Retail Partner' },
    { id: 'sp2', name: 'Credo Beauty', url: '', tier: 'gold', description: 'Clean Beauty Partner' },
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
  pageSettings: DEMO_PAGE_SETTINGS_EVENT,
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
  eventPrintMaterials: [],
  eventSchedule: [
    // Day 1
    { id: 's1', time: '8:00 AM', title: 'Registration & Welcome Coffee', location: 'Main Lobby' },
    { id: 's2', time: '9:00 AM', title: 'Opening Keynote: The Next Decade of Innovation', speaker: 'CEO Panel', location: 'Main Stage' },
    { id: 's3', time: '10:30 AM', title: 'AI in Enterprise: From Hype to Reality', speaker: 'Dr. Sarah Chen', location: 'Hall A', track: 'AI & ML' },
    { id: 's4', time: '10:30 AM', title: 'Cloud Security Best Practices', speaker: 'James Mitchell', location: 'Hall B', track: 'Security' },
    { id: 's5', time: '12:00 PM', title: 'Networking Lunch & Expo', location: 'Expo Hall' },
    { id: 's6', time: '2:00 PM', title: 'Hands-on: Building AI Applications', speaker: 'Tech Team', location: 'Workshop 1', track: 'AI & ML' },
    { id: 's7', time: '2:00 PM', title: 'DevOps Transformation Stories', speaker: 'Marcus Johnson', location: 'Hall A', track: 'DevOps' },
    { id: 's8', time: '4:00 PM', title: 'Fireside Chat: Future of Remote Work', speaker: 'Industry Leaders', location: 'Main Stage' },
    { id: 's9', time: '6:00 PM', title: 'Welcome Reception', location: 'Rooftop Terrace' },
    // Day 2
    { id: 's10', time: '9:00 AM', title: 'Product Showcase: Nexus Cloud 3.0', speaker: 'Product Team', location: 'Main Stage' },
    { id: 's11', time: '10:30 AM', title: 'Machine Learning at Scale', speaker: 'Dr. Elena Rodriguez', location: 'Hall A', track: 'AI & ML' },
    { id: 's12', time: '10:30 AM', title: 'Zero Trust Architecture Deep Dive', speaker: 'Security Team', location: 'Hall B', track: 'Security' },
    { id: 's13', time: '12:00 PM', title: 'Partner Lunch', location: 'Partner Lounge' },
    { id: 's14', time: '2:00 PM', title: 'Building Sustainable Tech', speaker: 'Green Tech Panel', location: 'Hall A', track: 'Sustainability' },
    { id: 's15', time: '4:00 PM', title: 'Startup Pitch Competition', location: 'Main Stage' },
    { id: 's16', time: '7:00 PM', title: 'Innovation Awards Gala', location: 'Grand Ballroom' },
    // Day 3
    { id: 's17', time: '9:00 AM', title: 'Morning Yoga & Wellness', location: 'Wellness Garden' },
    { id: 's18', time: '10:00 AM', title: 'The Future of Computing', speaker: 'Industry Visionaries', location: 'Main Stage' },
    { id: 's19', time: '11:30 AM', title: 'Career Workshop: Tech Leadership', speaker: 'Executive Coaches', location: 'Workshop 2', track: 'Career' },
    { id: 's20', time: '1:00 PM', title: 'Closing Keynote & Announcement', speaker: 'CEO', location: 'Main Stage' },
    { id: 's21', time: '2:30 PM', title: 'Farewell Networking', location: 'Expo Hall' },
  ],
  eventSpeakers: [
    { id: 'spk1', name: 'Dr. Sarah Chen', title: 'Chief AI Officer', company: 'TechCorp Global', bio: 'Leading expert in enterprise AI implementation with 15+ years of experience. Former Google AI researcher.', photoUrl: speakerSummit1 },
    { id: 'spk2', name: 'Marcus Johnson', title: 'VP of Engineering', company: 'CloudScale Inc', bio: 'Pioneer in cloud-native architecture, author of "Scaling with Kubernetes". Built systems serving 100M+ users.', photoUrl: speakerSummit2 },
    { id: 'spk3', name: 'Dr. Elena Rodriguez', title: 'Head of ML Research', company: 'DataFlow Systems', bio: 'PhD in Machine Learning from Stanford. Specializes in large language models and neural network optimization.', photoUrl: speakerSummit3 },
    { id: 'spk4', name: 'James Mitchell', title: 'CISO', company: 'SecureNet', bio: 'Former NSA cybersecurity advisor. Leading voice in zero-trust architecture and cloud security.', photoUrl: speakerSummit4 },
    { id: 'spk5', name: 'Aisha Patel', title: 'CEO & Founder', company: 'GreenTech Innovations', bio: 'Forbes 30 Under 30. Building sustainable technology solutions for enterprise.', photoUrl: speakerSummit3 },
    { id: 'spk6', name: 'David Kim', title: 'CTO', company: 'Nexus Tech', bio: 'Architected Nexus Cloud from the ground up. 20+ years in distributed systems.', photoUrl: speakerSummit4 },
  ],
  eventSponsors: [
    { id: 'sp1', name: 'TechCorp Global', tier: 'platinum', logoUrl: '/images/demos/logo-nexus-tech.png', websiteUrl: 'https://techcorp.com', description: 'Title Sponsor' },
    { id: 'sp2', name: 'CloudScale Inc', tier: 'platinum', logoUrl: '/images/demos/logo-nexus-cloud.png', websiteUrl: 'https://cloudscale.com', description: 'Innovation Partner' },
    { id: 'sp3', name: 'DataFlow Systems', tier: 'gold', logoUrl: '/images/demos/logo-nexus-tech.png', websiteUrl: 'https://dataflow.com', description: 'AI Track Sponsor' },
    { id: 'sp4', name: 'SecureNet', tier: 'gold', logoUrl: '', websiteUrl: 'https://securenet.com', description: 'Security Track Sponsor' },
    { id: 'sp5', name: 'GreenTech Innovations', tier: 'silver', logoUrl: '', websiteUrl: 'https://greentech.io', description: 'Sustainability Sponsor' },
    { id: 'sp6', name: 'DevTools Pro', tier: 'silver', logoUrl: '', websiteUrl: 'https://devtoolspro.com', description: 'Developer Lounge Sponsor' },
    { id: 'sp7', name: 'TechRecruit', tier: 'bronze', logoUrl: '', websiteUrl: 'https://techrecruit.com', description: 'Career Fair Partner' },
  ],
  eventHistory: [
    { id: 'eh1', year: 2025, eventName: 'Global Innovation Summit 2025', location: 'Austin, TX', venue: 'Austin Convention Center', attendees: 4200, highlights: 'First hybrid format, 50+ speakers, launched Nexus Cloud 2.0' },
    { id: 'eh2', year: 2024, eventName: 'Global Innovation Summit 2024', location: 'Seattle, WA', venue: 'Washington State Convention Center', attendees: 3500, highlights: 'Product launch keynote, 100+ exhibitors, AI workshop series' },
    { id: 'eh3', year: 2023, eventName: 'Global Innovation Summit 2023', location: 'New York, NY', venue: 'Javits Center', attendees: 2800, highlights: 'Inaugural summit, sold out in 48 hours, 30+ sponsors' },
  ],
  eventVideos: [
    { id: 'ev1', title: 'GIS 2026 Official Teaser', url: 'https://youtube.com/watch?v=example', type: 'teaser', platform: 'youtube', description: '60-second event preview with keynote highlights', thumbnailUrl: videoSummit1 },
    { id: 'ev2', title: 'GIS 2025 Highlights', url: 'https://youtube.com/watch?v=example2', type: 'recap', platform: 'youtube', description: '5-minute recap of the Austin summit', year: 2025, thumbnailUrl: videoSummit2 },
    { id: 'ev3', title: 'Speaker Announcement', url: 'https://youtube.com/watch?v=example3', type: 'promo', platform: 'youtube', description: 'Meet our keynote speakers', thumbnailUrl: videoSummit3 },
    { id: 'ev4', title: 'Venue Tour', url: 'https://youtube.com/watch?v=example4', type: 'promo', platform: 'youtube', description: 'Virtual walkthrough of Moscone Center', thumbnailUrl: videoSummit4 },
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
  { id: 'demo-pulse-media', name: 'Pulse Media', slug: 'demo-pulse-media', type: 'brand', color: '#ef4444' },
  { id: 'demo-horizon-finance', name: 'Horizon Finance', slug: 'demo-horizon-finance', type: 'brand', color: '#8b5cf6' },
  
  // Products (middle ring)
  { id: 'demo-nexus-cloud', name: 'Nexus Cloud', slug: 'demo-nexus-cloud', type: 'product', parentBrandId: 'demo-nexus-tech', color: '#38bdf8' },
  { id: 'demo-bloom-oils', name: 'Bloom Oils', slug: 'demo-bloom-oils', type: 'product', parentBrandId: 'demo-bloom-wellness', color: '#d946ef' },
  { id: 'demo-pulse-stream', name: 'Pulse Stream', slug: 'demo-pulse-stream', type: 'product', parentBrandId: 'demo-pulse-media', color: '#f97316' },
  { id: 'demo-horizon-invest', name: 'Horizon Invest', slug: 'demo-horizon-invest', type: 'product', parentBrandId: 'demo-horizon-finance', color: '#a855f7' },
  
  // Events (outer ring)
  { id: 'demo-innovation-summit', name: 'Innovation Summit', slug: 'demo-innovation-summit', type: 'event', parentBrandId: 'demo-nexus-tech', color: '#f59e0b' },
  { id: 'demo-pulse-live', name: 'Pulse Live Festival', slug: 'demo-pulse-live', type: 'event', parentBrandId: 'demo-pulse-media', color: '#ec4899' },
  { id: 'demo-finance-summit', name: 'Finance Summit 2026', slug: 'demo-finance-summit', type: 'event', parentBrandId: 'demo-horizon-finance', color: '#6366f1' },
  { id: 'demo-bloom-retreat', name: 'Bloom Wellness Retreat', slug: 'demo-bloom-retreat', type: 'event', parentBrandId: 'demo-bloom-wellness', color: '#14b8a6' },
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
  'demo-pulse-media': 'from-red-500 via-orange-500 to-amber-500',
  'demo-horizon-finance': 'from-violet-500 via-purple-500 to-indigo-500',
  'demo-nexus-cloud': 'from-blue-400 via-teal-500 to-cyan-500',
  'demo-bloom-oils': 'from-purple-400 via-pink-400 to-amber-400',
  'demo-pulse-stream': 'from-orange-500 via-red-500 to-pink-500',
  'demo-horizon-invest': 'from-purple-500 via-violet-500 to-blue-500',
  'demo-innovation-summit': 'from-violet-500 via-purple-500 to-fuchsia-500',
  'demo-pulse-live': 'from-pink-500 via-rose-500 to-red-500',
  'demo-finance-summit': 'from-indigo-500 via-blue-500 to-cyan-500',
  'demo-bloom-retreat': 'from-teal-400 via-emerald-500 to-green-500',
};

// Industry labels for display
export const DEMO_INDUSTRIES: Record<string, string> = {
  'demo-brandhub': 'Brand Platform',
  'demo-nexus-tech': 'Technology',
  'demo-bloom-wellness': 'Wellness',
  'demo-pulse-media': 'Media & Entertainment',
  'demo-horizon-finance': 'Financial Services',
  'demo-nexus-cloud': 'Cloud Platform',
  'demo-bloom-oils': 'Consumer Products',
  'demo-pulse-stream': 'Streaming Platform',
  'demo-horizon-invest': 'Investment Platform',
  'demo-innovation-summit': 'Conference',
  'demo-pulse-live': 'Music Festival',
  'demo-finance-summit': 'Finance Conference',
  'demo-bloom-retreat': 'Wellness Retreat',
};

// Card imagery for landing page showcase (hyper-realistic AI-generated)
export const DEMO_CARD_IMAGES: Record<string, string> = {
  'demo-brandhub': cardBrandHub,
  'demo-nexus-tech': cardNexusTech,
  'demo-bloom-wellness': cardBloomWellness,
  'demo-pulse-media': cardPulseMedia,
  'demo-horizon-finance': cardHorizonFinance,
  'demo-nexus-cloud': cardNexusCloud,
  'demo-bloom-oils': cardBloomOils,
  'demo-pulse-stream': cardPulseStream,
  'demo-horizon-invest': cardHorizonInvest,
  'demo-innovation-summit': cardInnovationSummit,
  'demo-pulse-live': cardPulseLive,
  'demo-finance-summit': cardFinanceSummit,
  'demo-bloom-retreat': cardBloomRetreat,
};
