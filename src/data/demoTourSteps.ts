import type { TourStep } from '@/components/demo/DemoTour';

// Comprehensive tour steps for brand/product demo guides
// Covers all 35+ sections - Using data-section attributes set by SectionWrapper
export const brandDemoTourSteps: TourStep[] = [
  // === IDENTITY CATEGORY ===
  {
    target: '[data-section="hero"], .hero-section',
    title: 'Identity Shield',
    description: 'The hero section showcases your brand\'s primary identity with logo, tagline, and visual theme. Configure animations, overlays, and parallax effects for maximum impact.',
    position: 'bottom',
  },
  {
    target: '[data-section="tagline"]',
    title: 'Corporate Tagline',
    description: 'Your brand\'s signature phrase with customizable typography, animations, and hover effects. Define primary, secondary, and variation taglines.',
    position: 'top',
  },
  {
    target: '[data-section="identity"]',
    title: 'Narrative Architecture',
    description: 'Define your brand story, mission statement, archetype, and tone of voice. This section communicates the core purpose driving your brand.',
    position: 'top',
  },
  {
    target: '[data-section="values"]',
    title: 'Philosophical Pillars',
    description: 'Highlight the core values that guide every brand decision. Each value includes an icon and description for stakeholder understanding.',
    position: 'top',
  },
  {
    target: '[data-section="bythenumbers"]',
    title: 'By the Numbers',
    description: 'Showcase key statistics and metrics in an engaging infographic layout. Perfect for communicating scale, reach, and achievements.',
    position: 'top',
  },
  {
    target: '[data-section="services"]',
    title: 'Our Services',
    description: 'Display your service offerings with custom icons and descriptions. Each service card can include header images and detailed explanations.',
    position: 'top',
  },
  {
    target: '[data-section="revenue"]',
    title: 'Revenue Growth',
    description: 'Visualize financial performance with customizable charts. Configure colors, themes, and yearly data points to tell your growth story.',
    position: 'top',
  },
  {
    target: '[data-section="awards"]',
    title: 'Awards & Recognition',
    description: 'Showcase industry accolades, certifications, and recognition. Include award images, dates, and awarding organizations.',
    position: 'top',
  },
  {
    target: '[data-section="brief"]',
    title: 'Brand Brief',
    description: 'A comprehensive overview document summarizing your brand strategy, positioning, and key messaging for quick stakeholder reference.',
    position: 'top',
  },

  // === VISUAL CATEGORY ===
  {
    target: '[data-section="logos"]',
    title: 'Logo Repository',
    description: 'All logo variations with usage rules and downloadable assets. Includes primary, secondary, icon, wordmark, reversed, and monochrome versions.',
    position: 'top',
  },
  {
    target: '[data-section="brandicon"]',
    title: 'Symbol Standards',
    description: 'Brand symbol and icon guidelines with clear usage specifications. Define primary symbols and approved variations.',
    position: 'top',
  },
  {
    target: '[data-section="colors"]',
    title: 'Prismatic Lab',
    description: 'Your complete color system with HEX, RGB, CMYK, and Pantone values. Click any color to copy instantly. Includes role assignments and usage guidelines.',
    position: 'top',
  },
  {
    target: '[data-section="gradients"]',
    title: 'Gradient Library',
    description: 'Pre-approved gradient combinations for digital applications. Each gradient includes CSS values for easy implementation.',
    position: 'top',
  },
  {
    target: '[data-section="patterns"]',
    title: 'Geometric Primitives',
    description: 'Brand patterns and textural elements for backgrounds and decorative use. Download patterns in various formats.',
    position: 'top',
  },

  // === TYPOGRAPHY CATEGORY ===
  {
    target: '[data-section="typography"]',
    title: 'Type Registry',
    description: 'Font families, weights, and sizing guidelines. Preview each typeface with custom sample text and download font files directly.',
    position: 'top',
  },
  {
    target: '[data-section="textstyles"]',
    title: 'CSS Hierarchies',
    description: 'Predefined text styles from H1 to body copy with exact sizes, weights, and line heights. Copy CSS values for consistent implementation.',
    position: 'top',
  },

  // === ASSETS CATEGORY ===
  {
    target: '[data-section="iconography"]',
    title: 'Iconography Library',
    description: 'Custom icon set designed for your brand. Organized by category with SVG downloads and consistent styling guidelines.',
    position: 'top',
  },
  {
    target: '[data-section="socialicons"]',
    title: 'Platform Markers',
    description: 'Social media icons styled to match your brand aesthetic. Includes approved SVG paths for each platform.',
    position: 'top',
  },
  {
    target: '[data-section="imagery"]',
    title: 'Visual Direction',
    description: 'Photography and imagery guidelines showing approved styles (do) and what to avoid (don\'t). Ensures visual consistency across all materials.',
    position: 'top',
  },

  // === COMMUNICATION CATEGORY ===
  {
    target: '[data-section="social"]',
    title: 'Social Registry',
    description: 'Official social media profiles with handles, links, and brand colors. Quick access to all platform presence.',
    position: 'top',
  },
  {
    target: '[data-section="socialassets"]',
    title: 'Social Assets & Guidelines',
    description: 'Platform-specific specifications for posts, stories, reels, and covers. Includes downloadable templates and preview images.',
    position: 'top',
  },
  {
    target: '[data-section="website"]',
    title: 'Website Links',
    description: 'Official website links with optional screenshot previews. Organize all digital presence in one location.',
    position: 'top',
  },
  {
    target: '[data-section="signatures"]',
    title: 'Signature Protocol',
    description: 'Email signature templates with customizable fields. Generate HTML signatures with proper branding and contact information.',
    position: 'top',
  },
  {
    target: '[data-section="qr"]',
    title: 'Access Ports (QR)',
    description: 'Generate branded QR codes with custom colors matching your palette. Perfect for print materials and event signage.',
    position: 'top',
  },

  // === RESOURCES CATEGORY ===
  {
    target: '[data-section="videos"]',
    title: 'Video Resources',
    description: 'Brand videos, commercials, and motion content. Supports YouTube, Vimeo, and direct video embeds with thumbnails.',
    position: 'top',
  },
  {
    target: '[data-section="assets"]',
    title: 'Operational Vault',
    description: 'Downloadable brand assets including documents, presentations, and raw design files. Organized with file type and size information.',
    position: 'top',
  },
  {
    target: '[data-section="imageassets"]',
    title: 'Image Assets Library',
    description: 'A curated library of approved images for marketing and communications. Drag-and-drop uploads with full-screen preview.',
    position: 'top',
  },
  {
    target: '[data-section="webinars"]',
    title: 'Webinar Series',
    description: 'Upcoming and recorded webinars with registration links, speakers, and duration. Perfect for thought leadership content.',
    position: 'top',
  },
  {
    target: '[data-section="misuse"]',
    title: 'Anti-Patterns',
    description: 'Examples of what NOT to do with your brand. Visual documentation of common mistakes to avoid in brand implementation.',
    position: 'top',
  },

  // === COLLATERAL CATEGORY ===
  {
    target: '[data-section="brochures"]',
    title: 'Digital Collateral',
    description: 'Brochures, flyers, and marketing materials organized by category. Includes preview thumbnails and download links.',
    position: 'top',
  },
  {
    target: '[data-section="templates"]',
    title: 'Master Scaffolds',
    description: 'Template files for presentations, documents, and designs. Includes Figma, Canva, and other format templates.',
    position: 'top',
  },
  {
    target: '[data-section="templatespecs"]',
    title: 'Template Specifications',
    description: 'Visual annotation system for templates showing exact zones, dimensions, and placement guidelines.',
    position: 'top',
  },
  {
    target: '[data-section="products"]',
    title: 'Product Guides',
    description: 'Links to product-specific brand guidelines within your portfolio. Navigate between parent brand and product sub-guides.',
    position: 'top',
  },
  {
    target: '[data-section="events"]',
    title: 'Event Guides',
    description: 'Event-specific branding and guidelines. Connect corporate brand standards with individual event identities.',
    position: 'top',
  },
  {
    target: '[data-section="universe"]',
    title: 'Product Universe',
    description: 'Interactive visualization of your product ecosystem. Shows relationships between products, brands, and services.',
    position: 'top',
  },
  {
    target: '[data-section="sponsorlogos"]',
    title: 'Sponsor Logos',
    description: 'Partner and sponsor logo placement guidelines organized by tier (Platinum, Gold, Silver, Bronze).',
    position: 'top',
  },
];

// Tour steps for event demo guides - comprehensive coverage
export const eventDemoTourSteps: TourStep[] = [
  // === IDENTITY ===
  {
    target: '[data-section="hero"], .hero-section',
    title: 'Event Identity',
    description: 'The event hero displays key details like date, location, and visual identity. Configure video backgrounds and animated effects.',
    position: 'bottom',
  },
  {
    target: '[data-section="tagline"]',
    title: 'Event Tagline',
    description: 'The event\'s signature phrase with customizable animations. Define the messaging that captures your event\'s essence.',
    position: 'top',
  },
  {
    target: '[data-section="identity"]',
    title: 'Event Story',
    description: 'Share the event\'s purpose, history, and what attendees can expect. Build anticipation and provide context.',
    position: 'top',
  },
  {
    target: '[data-section="values"]',
    title: 'Event Themes',
    description: 'The core themes and focus areas of your event. Guide attendees on what to expect and learn.',
    position: 'top',
  },
  {
    target: '[data-section="bythenumbers"]',
    title: 'Event Statistics',
    description: 'Key metrics like attendees, speakers, sessions, and sponsors. Showcase the scale of your event.',
    position: 'top',
  },
  {
    target: '[data-section="services"]',
    title: 'Event Features',
    description: 'Highlight key features, tracks, or experiences available at the event.',
    position: 'top',
  },

  // === VISUAL ===
  {
    target: '[data-section="logos"]',
    title: 'Event Logos',
    description: 'Event-specific logo variations for different applications. Includes horizontal, vertical, and badge formats.',
    position: 'top',
  },
  {
    target: '[data-section="colors"]',
    title: 'Event Colors',
    description: 'The event\'s color palette with approved combinations. Distinct from corporate colors for event identity.',
    position: 'top',
  },
  {
    target: '[data-section="gradients"]',
    title: 'Event Gradients',
    description: 'Gradient combinations specific to the event\'s visual language.',
    position: 'top',
  },
  {
    target: '[data-section="patterns"]',
    title: 'Event Patterns',
    description: 'Decorative patterns and textures for event materials like banners, signage, and digital assets.',
    position: 'top',
  },

  // === TYPOGRAPHY ===
  {
    target: '[data-section="typography"]',
    title: 'Event Typography',
    description: 'Fonts selected for the event\'s unique identity. May differ from corporate typography.',
    position: 'top',
  },
  {
    target: '[data-section="textstyles"]',
    title: 'Text Hierarchies',
    description: 'Pre-defined text styles for event materials including headings, body, and accent text.',
    position: 'top',
  },

  // === ASSETS ===
  {
    target: '[data-section="iconography"]',
    title: 'Event Icons',
    description: 'Custom icons for event themes, tracks, or session types.',
    position: 'top',
  },
  {
    target: '[data-section="imagery"]',
    title: 'Photo Guidelines',
    description: 'Approved photography styles for event promotion and documentation.',
    position: 'top',
  },

  // === COMMUNICATION ===
  {
    target: '[data-section="social"]',
    title: 'Event Social Handles',
    description: 'Dedicated social media profiles for the event with hashtags and handles.',
    position: 'top',
  },
  {
    target: '[data-section="socialassets"]',
    title: 'Social Media Kits',
    description: 'Ready-to-use social media graphics for speakers, sponsors, and attendees.',
    position: 'top',
  },
  {
    target: '[data-section="website"]',
    title: 'Event Website',
    description: 'Links to the event website, registration page, and related resources.',
    position: 'top',
  },
  {
    target: '[data-section="signatures"]',
    title: 'Event Signatures',
    description: 'Email signatures branded for event promotion with registration links.',
    position: 'top',
  },
  {
    target: '[data-section="qr"]',
    title: 'Event QR Codes',
    description: 'Branded QR codes for registration, check-in, and session links.',
    position: 'top',
  },

  // === RESOURCES ===
  {
    target: '[data-section="videos"]',
    title: 'Event Videos',
    description: 'Promotional videos, highlights from past events, and speaker previews.',
    position: 'top',
  },
  {
    target: '[data-section="assets"]',
    title: 'Event Downloads',
    description: 'Downloadable assets for sponsors, speakers, and partners.',
    position: 'top',
  },
  {
    target: '[data-section="imageassets"]',
    title: 'Event Photography',
    description: 'Official event photos available for press and promotional use.',
    position: 'top',
  },

  // === COLLATERAL ===
  {
    target: '[data-section="brochures"]',
    title: 'Event Materials',
    description: 'Brochures, programs, and printed collateral for the event.',
    position: 'top',
  },
  {
    target: '[data-section="templates"]',
    title: 'Event Templates',
    description: 'Templates for presentations, social posts, and promotional materials.',
    position: 'top',
  },
  {
    target: '[data-section="sponsorlogos"]',
    title: 'Sponsor Showcase',
    description: 'Tiered display of event sponsors and partners with placement guidelines.',
    position: 'top',
  },
];

// Get appropriate tour steps based on guide type
export const getTourSteps = (type: 'brand' | 'product' | 'event'): TourStep[] => {
  return type === 'event' ? eventDemoTourSteps : brandDemoTourSteps;
};

// Get tour step count for display
export const getTourStepCount = (type: 'brand' | 'product' | 'event'): number => {
  return getTourSteps(type).length;
};
