// Event Brand Kit Types
// Specialized types for event-specific brand guidelines

import { 
  BrandHero, 
  BrandTagline, 
  BrandIdentity, 
  BrandValue, 
  BrandLogo, 
  BrandIcon, 
  BrandColor, 
  ColorCombination,
  BrandGradient, 
  BrandPattern, 
  BrandTypography, 
  BrandTextStyle,
  BrandIconography,
  BrandSocialIcon,
  BrandImagery,
  BrandSocialProfile,
  BrandWebsiteLink,
  BrandSignature,
  BrandEmailBanner,
  BrandQR,
  BrandVideo,
  BrandAsset,
  BrandMisuse,
  BrandAtmosphere,
  BrandCaseStudy,
  BrandBrochure,
  BrandTemplate,
  BrandService,
  BrandSocialAssetSpec,
  BrandDisplayBannerSpec,
  LinkedGuideReference,
  TemplateSpec,
  RevenueDataPoint,
  StatisticItem,
  InfographicLayout,
  BrandPageSettings,
  SectionId,
  SectionLayoutSettings,
  DEFAULT_PAGE_SETTINGS,
} from './brand';

// Event-specific types

export interface EventDetails {
  eventName: string;
  eventDates: string; // e.g., "March 15-17, 2026"
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  location: string;
  venue?: string;
  tagline?: string;
  eventType?: 'conference' | 'trade-show' | 'summit' | 'webinar' | 'workshop' | 'launch' | 'other';
  expectedAttendees?: number;
  hashtag?: string;
  registrationUrl?: string;
}

export interface EventLogo {
  id: string;
  name: string;
  url: string;
  variant: 'event-primary' | 'event-secondary' | 'co-branded' | 'date-lockup' | 'sponsor-lockup' | 'stacked' | 'horizontal';
  description?: string;
}

export interface EventSignage {
  id: string;
  name: string;
  type: 'booth-backdrop' | 'pull-up-banner' | 'table-banner' | 'hanging-sign' | 'floor-graphic' | 'directional' | 'podium-sign' | 'stage-backdrop' | 'outdoor-banner' | 'other';
  dimensions: string; // e.g., "10ft x 8ft"
  previewUrl?: string;
  templateUrl?: string;
  notes?: string;
  specifications?: string;
}

export interface EventBanner {
  id: string;
  name: string;
  type: 'email-header' | 'social-cover' | 'website-hero' | 'landing-page' | 'countdown' | 'save-the-date' | 'thank-you' | 'promotional';
  dimensions: string;
  previewUrl?: string;
  templateUrl?: string;
  platform?: string; // e.g., "LinkedIn", "Twitter", "Email"
  notes?: string;
}

export interface EventDigitalMaterial {
  id: string;
  name: string;
  type: 'email-template' | 'landing-page' | 'social-post' | 'virtual-background' | 'presentation-template' | 'name-badge' | 'agenda' | 'map' | 'mobile-app' | 'other';
  previewUrl?: string;
  templateUrl?: string;
  fileType?: string;
  description?: string;
}

export interface EventScheduleItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  speaker?: string;
  location?: string;
  track?: string;
}

export interface EventSpeaker {
  id: string;
  name: string;
  title: string;
  company?: string;
  bio?: string;
  photoUrl?: string;
  socialLinks?: { platform: string; url: string }[];
}

export interface EventSponsor {
  id: string;
  name: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner' | 'media' | 'other';
  logoUrl: string;
  websiteUrl?: string;
  description?: string;
  placement?: string; // Where sponsor logo appears
}

// Event Video types
export interface EventVideo {
  id: string;
  title: string;
  url: string;
  type: 'promo' | 'recap' | 'speaker' | 'stage' | 'testimonial' | 'teaser' | 'slideshow' | 'livestream' | 'other';
  platform: 'youtube' | 'vimeo' | 'direct';
  thumbnailUrl?: string;
  description?: string;
  duration?: string;
  year?: number;
}

// Event Location types
export interface EventVenueMap {
  id: string;
  name: string;
  type: 'floor-plan' | 'venue-overview' | 'parking' | 'transit' | 'custom';
  imageUrl: string;
  description?: string;
}

export interface EventLocation {
  venueName: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: { lat: number; lng: number };
  googleMapsUrl?: string;
  googleMapsEmbed?: string;
  venueWebsite?: string;
  venuePhone?: string;
  venueEmail?: string;
  parkingInfo?: string;
  transitInfo?: string;
  nearbyHotels?: string;
  customNotes?: string;
  venueMaps?: EventVenueMap[];
}

// Event History types for archiving past events
export interface EventHistoryAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'logo' | 'presentation' | 'other';
  url: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface EventHistoryEntry {
  id: string;
  year: number;
  eventName: string;
  theme?: string;
  location?: string;
  venue?: string;
  dates?: string;
  attendees?: number;
  highlights?: string;
  learnings?: string;
  assets?: EventHistoryAsset[];
}

// Event Section IDs (extends base SectionId)
export type EventSectionId = 
  | SectionId
  | 'eventdetails'      // Event information
  | 'eventlogos'        // Event-specific logos
  | 'eventsignage'      // Physical signage specs
  | 'eventbanners'      // Digital banners
  | 'eventdigital'      // Digital materials
  | 'eventschedule'     // Agenda/schedule
  | 'eventspeakers'     // Speaker info
  | 'eventsponsors'     // Sponsor tiers
  | 'eventhistory'      // Past events archive
  | 'eventvideos'       // Event videos & promos
  | 'eventlocation';    // Venue & location info

// Default Event Section Order
export const DEFAULT_EVENT_SECTION_ORDER: EventSectionId[] = [
  'hero',
  'eventdetails',
  'tagline',
  'eventlocation',
  'eventlogos',
  'eventsignage',
  'eventbanners',
  'eventdigital',
  'eventvideos',
  'colors',
  'gradients',
  'typography',
  'imagery',
  'social',
  'socialassets',
  'eventschedule',
  'eventspeakers',
  'eventsponsors',
  'eventhistory',
  'casestudies',
  'templates',
  'brochures',
  'templatespecs',
  'assets',
  'misuse',
];

// Event Guide Interface
export interface EventGuide {
  id: string;
  type: 'event';
  slug?: string;
  organizationId?: string | null;
  parentBrandId?: string;
  isFavorite?: boolean;
  isPublic?: boolean;
  sectionOrder?: EventSectionId[];
  hiddenSections?: EventSectionId[];
  sectionSubtitles?: Partial<Record<EventSectionId, string>>;
  sectionLayouts?: SectionLayoutSettings;
  pageSettings?: BrandPageSettings;
  
  // Core identity (reused from brand)
  hero: BrandHero;
  tagline: BrandTagline;
  identity: BrandIdentity;
  values: BrandValue[];
  
  // Event-specific sections
  eventDetails: EventDetails;
  eventLogos: EventLogo[];
  eventSignage: EventSignage[];
  eventBanners: EventBanner[];
  eventDigitalMaterials: EventDigitalMaterial[];
  eventSchedule: EventScheduleItem[];
  eventSpeakers: EventSpeaker[];
  eventSponsors: EventSponsor[];
  eventHistory: EventHistoryEntry[];
  eventVideos: EventVideo[];
  eventLocation: EventLocation;
  
  // Visual identity (reused from brand)
  logos: BrandLogo[];
  brandIcons: BrandIcon[];
  colors: BrandColor[];
  colorCombinations: ColorCombination[];
  gradients: BrandGradient[];
  patterns: BrandPattern[];
  typography: BrandTypography[];
  textStyles: BrandTextStyle[];
  iconography: BrandIconography[];
  socialIcons: BrandSocialIcon[];
  imagery: BrandImagery[];
  
  // Communication (reused from brand)
  social: BrandSocialProfile[];
  socialAssets?: BrandSocialAssetSpec[];
  displayBanners?: BrandDisplayBannerSpec[];
  websites: BrandWebsiteLink[];
  signatures: BrandSignature[];
  emailBanners?: BrandEmailBanner[];
  qr: BrandQR;
  videos: BrandVideo[];
  
  // Resources (reused from brand)
  assets: BrandAsset[];
  misuse: BrandMisuse[];
  atmosphere: BrandAtmosphere;
  
  // Collateral (reused from brand)
  caseStudies: BrandCaseStudy[];
  brochures: BrandBrochure[];
  templates: BrandTemplate[];
  services: BrandService[];
  linkedGuides?: LinkedGuideReference[];
  templateSpecs?: TemplateSpec[];
  revenueData?: RevenueDataPoint[];
  statistics?: StatisticItem[];
  infographicLayout?: InfographicLayout;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Default Event Details
export const DEFAULT_EVENT_DETAILS: EventDetails = {
  eventName: '',
  eventDates: '',
  location: '',
  venue: '',
  tagline: '',
  eventType: 'conference',
  hashtag: '',
  registrationUrl: '',
};

// Default Event Page Settings
export const DEFAULT_EVENT_PAGE_SETTINGS: BrandPageSettings = {
  ...DEFAULT_PAGE_SETTINGS,
  heroFullWidth: true,
};

// Create default event guide data
export const createDefaultEventGuideData = (name: string): Omit<EventGuide, 'id' | 'type' | 'createdAt' | 'updatedAt'> => ({
  hero: {
    name,
    tagline: 'Your event tagline here',
    coverImage: '',
    logoUrl: '',
  },
  tagline: { primary: '', secondary: '', variations: [] },
  identity: { missionStatement: '', archetype: '', toneOfVoice: [] },
  values: [],
  
  // Event-specific
  eventDetails: { ...DEFAULT_EVENT_DETAILS, eventName: name },
  eventLogos: [],
  eventSignage: [],
  eventBanners: [],
  eventDigitalMaterials: [],
  eventSchedule: [],
  eventSpeakers: [],
  eventSponsors: [],
  eventHistory: [],
  eventVideos: [],
  eventLocation: {
    venueName: '',
    address: '',
    city: '',
    country: '',
    venueMaps: [],
  },
  
  // Visual
  logos: [],
  brandIcons: [],
  colors: [
    { id: '1', name: 'Event Primary', hex: '#6366f1', usage: 'Main event color' },
    { id: '2', name: 'Event Accent', hex: '#f59e0b', usage: 'Accent and highlights' },
    { id: '3', name: 'Background', hex: '#ffffff', usage: 'Light backgrounds' },
  ],
  colorCombinations: [],
  gradients: [],
  patterns: [],
  typography: [
    { id: '1', name: 'Heading', fontFamily: 'Inter, sans-serif', weight: '700', usage: 'Event titles' },
    { id: '2', name: 'Body', fontFamily: 'Inter, sans-serif', weight: '400', usage: 'Body text' },
  ],
  textStyles: [],
  iconography: [],
  socialIcons: [],
  imagery: [],
  
  // Communication
  social: [],
  socialAssets: [],
  displayBanners: [],
  websites: [],
  signatures: [],
  emailBanners: [],
  qr: { defaultUrl: '', fgColor: '#6366f1', bgColor: '#ffffff' },
  videos: [],
  
  // Resources
  assets: [],
  misuse: [],
  atmosphere: { style: 'gradient', animate: true, opacity: 0.5, blur: 0 },
  
  // Collateral
  caseStudies: [],
  brochures: [],
  templates: [],
  services: [],
  linkedGuides: [],
  templateSpecs: [],
  revenueData: [],
  statistics: [],
  infographicLayout: 'cards',
  
  pageSettings: DEFAULT_EVENT_PAGE_SETTINGS,
});
