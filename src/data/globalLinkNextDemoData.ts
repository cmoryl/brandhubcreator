// GlobalLink NEXT Demo Data
// Pre-populated content for the GlobalLink NEXT master event and regional sub-events
// Based on https://www.globallinknext.com/ and the official brand kit

import { EventGuide, EventLogo, EventDetails, EventSponsor, EventLocation, EventVideo } from '@/types/event';
import { LinkedGuideReference } from '@/types/brand';

// Brand Colors from GlobalLink NEXT
export const GLOBALLINK_NEXT_COLORS = {
  primary: '#0a1628', // Dark Navy Blue (background)
  secondary: '#00d4ff', // Cyan/Teal
  accent: '#ff00ff', // Magenta/Pink
  apac: '#ff69b4', // Pink for APAC
  usa: '#00ff00', // Green for USA  
  emea: '#00d4ff', // Cyan for EMEA
  white: '#ffffff',
};

// Master Event Logos
export const GLOBALLINK_NEXT_LOGOS: EventLogo[] = [
  {
    id: 'next-logo-block',
    name: 'GlobalLink NEXT Block Logo',
    url: '/images/events/globallink-next-logo-block.jpg',
    variant: 'event-primary',
    description: 'Main stacked logo with TransPerfect endorsement',
  },
  {
    id: 'next-logo-long',
    name: 'GlobalLink NEXT Horizontal',
    url: '/images/events/globallink-next-logo-long.jpg',
    variant: 'horizontal',
    description: 'Horizontal lockup for banners and headers',
  },
  {
    id: 'next-logo-stacked',
    name: 'NEXT Only Stacked',
    url: '/images/events/globallink-next-stacked.png',
    variant: 'stacked',
    description: 'NEXT logo stacked variant without TransPerfect',
  },
  {
    id: 'next-logo-horizontal',
    name: 'NEXT Only Horizontal',
    url: '/images/events/globallink-next-horizontal.png',
    variant: 'event-secondary',
    description: 'NEXT logo horizontal variant',
  },
  {
    id: 'next-globallink-logo',
    name: 'GlobalLink NEXT Master',
    url: '/images/events/globallink-next-logo.svg',
    variant: 'co-branded',
    description: 'Official GlobalLink NEXT conference logo',
  },
];

// Master Event Details
export const GLOBALLINK_NEXT_MASTER_DETAILS: EventDetails = {
  eventName: 'GlobalLink NEXT',
  eventDates: 'Multiple Dates Worldwide',
  tagline: 'Intelligent Performance',
  eventType: 'conference',
  hashtag: '#GlobalLinkNEXT',
  registrationUrl: 'https://www.globallinknext.com/',
  location: 'Global - USA, EMEA, APAC',
};

// Regional Sub-Events
export const GLOBALLINK_NEXT_USA_DETAILS: EventDetails = {
  eventName: 'GlobalLink NEXT USA',
  eventDates: 'October 27-28, 2026',
  startDate: '2026-10-27',
  endDate: '2026-10-28',
  tagline: 'Intelligent Performance',
  eventType: 'conference',
  expectedAttendees: 500,
  hashtag: '#GlobalLinkNEXT',
  registrationUrl: 'https://www.globallinknext.com/usa/',
  location: 'San Francisco, CA',
  venue: 'InterContinental San Francisco',
};

export const GLOBALLINK_NEXT_EMEA_DETAILS: EventDetails = {
  eventName: 'GlobalLink NEXT EMEA',
  eventDates: 'London 2026 - Announcing Soon',
  tagline: 'Intelligent Performance',
  eventType: 'conference',
  expectedAttendees: 400,
  hashtag: '#GlobalLinkNEXT',
  registrationUrl: 'https://www.globallinknext.com/emea/',
  location: 'London, UK',
};

export const GLOBALLINK_NEXT_APAC_DETAILS: EventDetails = {
  eventName: 'GlobalLink NEXT APAC',
  eventDates: 'Various Locations',
  tagline: 'Intelligent Performance',
  eventType: 'conference',
  expectedAttendees: 300,
  hashtag: '#GlobalLinkNEXT',
  registrationUrl: 'https://www.globallinknext.com/apac/',
  location: 'Various APAC Locations',
};

// Sponsors (major brands from the website)
export const GLOBALLINK_NEXT_SPONSORS: EventSponsor[] = [
  { id: 'sponsor-1', name: 'Avis', tier: 'platinum', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/avis.png' },
  { id: 'sponsor-2', name: 'Cathay Pacific', tier: 'platinum', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/cathay-pacific.png' },
  { id: 'sponsor-3', name: 'HBO', tier: 'gold', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/hbo.png' },
  { id: 'sponsor-4', name: 'Heineken', tier: 'gold', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/heineken.png' },
  { id: 'sponsor-5', name: 'Hewlett Packard', tier: 'platinum', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/hewlett-packard.png' },
  { id: 'sponsor-6', name: 'Hugo Boss', tier: 'gold', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/hugo-boss2.png' },
  { id: 'sponsor-7', name: 'Marriott', tier: 'platinum', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/marriott.png' },
  { id: 'sponsor-8', name: 'Moet Hennessy', tier: 'gold', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/moet-hennessy.png' },
  { id: 'sponsor-9', name: 'PNC', tier: 'silver', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/pnc.png' },
  { id: 'sponsor-10', name: 'Puma', tier: 'silver', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/puma.png' },
  { id: 'sponsor-11', name: 'Radisson', tier: 'gold', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/radisson.png' },
  { id: 'sponsor-12', name: 'Sanofi', tier: 'platinum', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/sanofi.png' },
  { id: 'sponsor-13', name: 'SAP', tier: 'platinum', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/SAP_2011_logo.png' },
  { id: 'sponsor-14', name: 'Shell', tier: 'platinum', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/shell-logo-svgrepo-com.png' },
  { id: 'sponsor-15', name: 'Western Digital', tier: 'gold', logoUrl: 'https://www.globallinknext.com/wp-content/uploads/2024/12/western-digital.png' },
];

// USA Location
export const GLOBALLINK_NEXT_USA_LOCATION: EventLocation = {
  venueName: 'InterContinental San Francisco',
  address: '888 Howard Street',
  city: 'San Francisco',
  state: 'CA',
  country: 'United States',
  postalCode: '94103',
  googleMapsUrl: 'https://maps.google.com/?q=InterContinental+San+Francisco',
  venueWebsite: 'https://www.ihg.com/intercontinental/hotels/us/en/san-francisco/sfoha/hoteldetail',
  parkingInfo: 'Valet parking available. Self-parking at nearby public garages.',
  transitInfo: 'BART Powell Street Station (10 min walk). Muni lines nearby.',
  nearbyHotels: 'InterContinental San Francisco (venue), Four Seasons, Marriott Marquis',
  customNotes: 'Located in the heart of SoMa district, walking distance to Moscone Center.',
};

// Event Videos
export const GLOBALLINK_NEXT_VIDEOS: EventVideo[] = [
  {
    id: 'video-1',
    title: 'GlobalLink NEXT 2024 Highlights',
    url: 'https://tv.transperfect.com/public/00000000-0000-0000-0000-000000000000/watch/667698a6-52b8-4486-a380-bbc951c50fb1',
    type: 'recap',
    platform: 'direct',
    description: 'Watch highlights from GlobalLink NEXT 2024 featuring keynotes, sessions, and networking.',
  },
];

// Sub-event references for master event
export const GLOBALLINK_NEXT_SUB_EVENTS: LinkedGuideReference[] = [
  {
    id: 'sub-usa',
    type: 'event',
    name: 'GlobalLink NEXT USA',
    region: 'USA',
    accentColor: GLOBALLINK_NEXT_COLORS.usa,
    location: 'San Francisco, CA',
    dates: 'October 27-28, 2026',
    attendees: 500,
    coverImage: '/images/events/venue-sf-intercontinental.jpg',
  },
  {
    id: 'sub-emea',
    type: 'event',
    name: 'GlobalLink NEXT EMEA',
    region: 'EMEA',
    accentColor: GLOBALLINK_NEXT_COLORS.emea,
    location: 'London, UK',
    dates: 'London 2026 - Announcing Soon',
    attendees: 400,
    coverImage: '/images/events/venue-london.jpg',
  },
  {
    id: 'sub-apac',
    type: 'event',
    name: 'GlobalLink NEXT APAC',
    region: 'APAC',
    accentColor: GLOBALLINK_NEXT_COLORS.apac,
    location: 'Various APAC Locations',
    dates: 'Various Dates',
    attendees: 300,
    coverImage: '/images/events/venue-singapore.jpg',
  },
];

// Shared Assets for inheritance
export const GLOBALLINK_NEXT_SHARED_ASSETS = [
  {
    id: 'shared-1',
    name: 'GlobalLink NEXT Logo Package',
    type: 'logo',
    url: '/images/events/next-logos-page.jpg',
    description: 'Complete logo package including all variants and lockups',
    isRequired: true,
    tags: ['logo', 'branding'],
  },
  {
    id: 'shared-2',
    name: 'Event Pattern Library',
    type: 'pattern',
    url: '/images/events/pattern-globallink-next.jpg',
    description: 'Branded patterns and textures for event materials',
    isRequired: true,
    tags: ['pattern', 'background'],
  },
  {
    id: 'shared-3',
    name: 'Social Media Templates',
    type: 'template',
    url: '/images/events/next-social-template-1.jpg',
    description: 'Canva-compatible social media templates',
    isRequired: false,
    tags: ['social', 'template'],
  },
];

// Typography configuration
export const GLOBALLINK_NEXT_TYPOGRAPHY = [
  { id: 'typo-1', name: 'Display', fontFamily: 'Inter, sans-serif', weight: '800', usage: 'Headlines and hero text' },
  { id: 'typo-2', name: 'Heading', fontFamily: 'Inter, sans-serif', weight: '700', usage: 'Section headers' },
  { id: 'typo-3', name: 'Body', fontFamily: 'Inter, sans-serif', weight: '400', usage: 'Body copy and descriptions' },
];

// Brand colors for event
export const GLOBALLINK_NEXT_BRAND_COLORS = [
  { id: 'color-1', name: 'Deep Navy', hex: '#0a1628', usage: 'Primary backgrounds', role: 'primary' as const },
  { id: 'color-2', name: 'Electric Cyan', hex: '#00d4ff', usage: 'Accents and highlights', role: 'accent' as const },
  { id: 'color-3', name: 'Vibrant Magenta', hex: '#ff00ff', usage: 'Secondary accents', role: 'secondary' as const },
  { id: 'color-4', name: 'Pure White', hex: '#ffffff', usage: 'Text on dark backgrounds', role: 'neutral' as const },
  { id: 'color-5', name: 'USA Green', hex: '#00ff00', usage: 'USA regional accent' },
  { id: 'color-6', name: 'APAC Pink', hex: '#ff69b4', usage: 'APAC regional accent' },
];

// Helper function to create a pre-populated GlobalLink NEXT master event
export const createGlobalLinkNextMasterEvent = (name: string = 'GlobalLink NEXT'): Partial<EventGuide> => ({
  hero: {
    name,
    tagline: 'Intelligent Performance',
    coverImage: '/images/events/next-hero-imagery.png',
    logoUrl: '/images/events/globallink-next-logo.svg',
  },
  tagline: {
    primary: 'Intelligent Performance',
    secondary: 'The Language of Global Business',
    variations: [
      'Intelligence Everywhere',
      'Presented by TransPerfect',
      'Engaging Content. Curated Tracks. Great Networking.',
    ],
  },
  identity: {
    missionStatement: 'GlobalLink NEXT is an annual invitation-only conference hosted by TransPerfect. The event brings together industry professionals, technology & solutions experts, client support teams, and users from around the globe.',
    archetype: 'Innovation Leader',
    toneOfVoice: ['Professional', 'Innovative', 'Inclusive', 'Forward-thinking'],
  },
  eventDetails: GLOBALLINK_NEXT_MASTER_DETAILS,
  eventLogos: GLOBALLINK_NEXT_LOGOS,
  eventSponsors: GLOBALLINK_NEXT_SPONSORS,
  eventVideos: GLOBALLINK_NEXT_VIDEOS,
  linkedGuides: GLOBALLINK_NEXT_SUB_EVENTS,
  colors: GLOBALLINK_NEXT_BRAND_COLORS,
  typography: GLOBALLINK_NEXT_TYPOGRAPHY,
  values: [
    { id: 'val-1', text: 'Industry Insights', description: 'Get the inside scoop from those who have developed GlobalLink technology from the ground up.', icon: 'Lightbulb' },
    { id: 'val-2', text: 'Boost Your Skills', description: 'Participate in interactive demos and roundtable discussions tailored to multiple user levels.', icon: 'TrendingUp' },
    { id: 'val-3', text: 'Develop Professionally', description: 'Experience an agenda packed with business and technical sessions including Innovation Spotlights.', icon: 'Award' },
    { id: 'val-4', text: 'Grow Your Network', description: 'Meet professionals from the world\'s leading brands to share knowledge and insights.', icon: 'Users' },
  ],
  websites: [
    { id: 'web-1', label: 'GlobalLink NEXT Official', url: 'https://www.globallinknext.com/' },
    { id: 'web-2', label: 'TransPerfect', url: 'https://www.transperfect.com/' },
  ],
  social: [
    { id: 'social-1', platform: 'LinkedIn', handle: '@TransPerfectGlobalLink', url: 'https://linkedin.com/company/transperfect', color: '#0077B5' },
    { id: 'social-2', platform: 'Twitter', handle: '@GLNEXT', url: 'https://twitter.com/GLNEXT', color: '#1DA1F2' },
  ],
});

// Helper function to create a regional sub-event with inherited branding
export const createGlobalLinkNextRegionalEvent = (
  region: 'USA' | 'EMEA' | 'APAC',
): Partial<EventGuide> => {
  const regionConfig = {
    USA: {
      details: GLOBALLINK_NEXT_USA_DETAILS,
      location: GLOBALLINK_NEXT_USA_LOCATION,
      accentColor: GLOBALLINK_NEXT_COLORS.usa,
      coverImage: '/images/events/venue-sf-intercontinental.jpg',
    },
    EMEA: {
      details: GLOBALLINK_NEXT_EMEA_DETAILS,
      location: {
        venueName: 'London Venue TBA',
        address: '',
        city: 'London',
        country: 'United Kingdom',
      },
      accentColor: GLOBALLINK_NEXT_COLORS.emea,
      coverImage: '/images/events/venue-london.jpg',
    },
    APAC: {
      details: GLOBALLINK_NEXT_APAC_DETAILS,
      location: {
        venueName: 'Various APAC Venues',
        address: '',
        city: 'Multiple Cities',
        country: 'Asia Pacific',
      },
      accentColor: GLOBALLINK_NEXT_COLORS.apac,
      coverImage: '/images/events/venue-singapore.jpg',
    },
  };

  const config = regionConfig[region];

  return {
    hero: {
      name: `GlobalLink NEXT ${region}`,
      tagline: 'Intelligent Performance',
      coverImage: config.coverImage,
      logoUrl: '/images/events/globallink-next-logo.svg',
    },
    tagline: {
      primary: 'Intelligent Performance',
      secondary: 'The Language of Global Business',
      variations: ['Intelligence Everywhere', `GlobalLink NEXT ${region}`],
    },
    eventDetails: config.details,
    eventLocation: config.location as EventLocation,
    eventLogos: GLOBALLINK_NEXT_LOGOS, // Inherit from master
    eventSponsors: GLOBALLINK_NEXT_SPONSORS, // Inherit sponsors
    colors: [
      ...GLOBALLINK_NEXT_BRAND_COLORS.slice(0, 4),
      { id: `color-regional`, name: `${region} Accent`, hex: config.accentColor, usage: 'Regional accent color', role: 'accent' as const },
    ],
    typography: GLOBALLINK_NEXT_TYPOGRAPHY,
    websites: [
      { id: 'web-1', label: `GlobalLink NEXT ${region}`, url: `https://www.globallinknext.com/${region.toLowerCase()}/` },
    ],
  };
};
