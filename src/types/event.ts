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
  ImageAsset,
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
  ClientLogo,
  SponsorLogo,
  InsightItem,
  InsightsLayout,
  BrandWebinar,
  BrandAward,
  BrandLocation,
  LocationStat,
  PresentationTemplate,
  LinkedBoothCard,
  ApprovedImageryData,
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
  /** Card images for each info card section */
  cardImages?: {
    eventType?: string;
    dates?: string;
    location?: string;
    venue?: string;
    attendees?: string;
    hashtag?: string;
    registration?: string;
  };
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
  type: 'booth-backdrop' | 'pull-up-banner' | 'table-banner' | 'hanging-sign' | 'floor-graphic' | 'directional' | 'podium-sign' | 'stage-backdrop' | 'outdoor-banner' | 'registration' | 'technology-counter' | 'information-counter' | 'large-backwall' | 'location-pillars' | 'map-pillars' | 'pillars' | 'doors' | 'stairs' | 'other' | (string & {});
  dimensions: string; // e.g., "10ft x 8ft"
  previewUrl?: string;
  templateUrl?: string;
  liveFilesUrl?: string; // Link to live design files (Figma, Google Drive, Dropbox, etc.)
  notes?: string;
  specifications?: string;
}

export interface EventBanner {
  id: string;
  name: string;
  type: 'email-header' | 'social-cover' | 'social-banner' | 'website-hero' | 'landing-page' | 'countdown' | 'save-the-date' | 'thank-you' | 'promotional';
  dimensions: string;
  previewUrl?: string;
  templateUrl?: string;
  platform?: string; // e.g., "LinkedIn", "Twitter", "Email"
  notes?: string;
  liveFilesUrl?: string; // Link to live design files (Figma, Dropbox, etc.)
}

export interface EventDigitalMaterial {
  id: string;
  name: string;
  type: 'email-template' | 'landing-page' | 'social-post' | 'virtual-background' | 'presentation-template' | 'name-badge' | 'agenda' | 'map' | 'mobile-app' | 'other';
  previewUrl?: string;
  templateUrl?: string;
  fileType?: string;
  description?: string;
  liveFilesUrl?: string; // Link to live design files (Figma, Dropbox, etc.)
}

export interface EventPrintMaterial {
  id: string;
  name: string;
  type: 'flyer' | 'poster' | 'brochure' | 'banner' | 'business-card' | 'badge' | 'name-badge' | 'signage' | 'sticker' | 'stamp' | 'prospectus' | 'deck' | 'tier-sheet' | 'agreement' | 'logo-sheet' | 'benefits' | 'activation' | 'thank-you' | 'catalog' | 'postcard' | 'folder' | 'letterhead' | 'envelope' | 'notepad' | 'with-compliments' | 'venue-map' | 'floor-plan' | 'wayfinding-map' | 'campus-map' | 'booth-map' | 'evacuation-map' | 'other-map' | 'lanyard' | 'wristband' | 'ticket' | 'gift-box' | 'gift-bag' | 'swag-bag' | 'packaging-sleeve' | 'packaging-label' | 'packaging-other' | 'other' | (string & {});
  dimensions?: string;
  previewUrl?: string;
  fileUrl?: string;
  liveFileUrl?: string;   // Link to live design files (Figma, Google Drive, Dropbox, etc.)
  description?: string;
  quantity?: string;
}

export interface EventInfographic {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  category?: string;
  liveFilesUrl?: string; // Link to live design files (Figma, Dropbox, etc.)
}

export interface EventApplication {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  platform?: 'ios' | 'android' | 'web' | 'desktop' | 'other';
  appUrl?: string;
  liveFilesUrl?: string; // Link to live design files (Figma, Dropbox, etc.)
}

export interface EventDigitalAsset {
  id: string;
  name: string;
  imageUrl: string;
  fileType?: string; // svg, png, jpg, webp, gif, etc.
  description?: string;
  category?: string;
  liveFilesUrl?: string; // Link to live design files (Figma, Dropbox, etc.)
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

// Logo variant for sponsors with multiple logo versions
export interface SponsorLogoVariant {
  id: string;
  variant: 'color' | 'white' | 'black' | 'primary';
  url: string;
}

export interface EventSponsor {
  id: string;
  name: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner' | 'media' | 'other';
  logoUrl: string;  // Primary logo (backwards compatibility)
  logoVariants?: SponsorLogoVariant[];  // Multiple logo versions
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
  platform: 'youtube' | 'vimeo' | 'transperfect' | 'direct';
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

// AI-generated location research report
export interface LocationResearchReport {
  overview: string;
  neighborhood: {
    description: string;
    character: string;
    safetyNotes: string;
  };
  dining: {
    nearby: string[];
    recommendations: string;
  };
  transportation: {
    airports: string[];
    publicTransit: string;
    rideshare: string;
    parking: string;
  };
  hotels: {
    luxury: string[];
    midRange: string[];
    budget: string[];
    recommendations: string;
  };
  attractions: {
    cultural: string[];
    entertainment: string[];
    outdoor: string[];
  };
  practicalInfo: {
    weather: string;
    timezone: string;
    currency: string;
    tipping: string;
    localCustoms: string;
  };
  eventTips: string[];
  generatedAt: string;
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
  venueBackgroundImage?: string;
  locationResearchReport?: LocationResearchReport;
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
  | 'eventlocation'     // Venue & location info
  | 'eventwebsites'     // Event website links
  | 'subevents'         // Sub-events / regional events
  | 'sharedassets'      // Shared asset library for inheritance
  | 'eventpatterns'     // Event-specific patterns
  | 'partnerbooths'     // Partner booth catalog
  | 'sponsorlogos'      // Sponsor logos
  | 'clientlogos'       // Client logos
  | 'eventprint';       // Print collateral

// Default Event Section Order
// Note: eventsponsors now includes sponsor logos - sponsorlogos section is not used in events
// Note: eventdigital is the unified digital collateral section - templates/brochures not used separately
export const DEFAULT_EVENT_SECTION_ORDER: EventSectionId[] = [
  'hero',
  'eventdetails',
  'subevents',           // Show sub-events right after details for master events
  'sharedassets',        // Shared assets for inheritance
  'tagline',
  'eventwebsites',
  'eventlocation',
  'eventlogos',
  'eventsignage',
  'eventprint',          // Print collateral (signage, brochures, badges, etc.)
  'eventdigital',        // Unified digital collateral (banners, materials, templates, brochures)
  'eventvideos',
  'colors',
  'gradients',
  'eventpatterns',       // Event-specific patterns
  'typography',
  'textstyles',          // Content hierarchy / CSS styles
  'imagery',
  'social',
  'socialassets',
  'eventschedule',
  'eventspeakers',
  'eventsponsors',       // Unified sponsors section with logos
  'partnerbooths',       // Partner booth catalog
  'eventhistory',
  
  'qr',
  'templatespecs',
  'presentations',
  'insights',
  'clientlogos',
  'assets',
  'approvedimagery',
  
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
  eventPrintMaterials: EventPrintMaterial[];
  eventSponsorshipMaterials?: EventPrintMaterial[];
  eventInfographics?: EventInfographic[];
  eventApplications?: EventApplication[];
  eventDigitalAssets?: EventDigitalAsset[];
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
  defaultIconColor?: string;
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
  imageAssets?: ImageAsset[];
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
  
  // Insights & Updates
  insights?: InsightItem[];
  insightsLayout?: InsightsLayout;
  insightsAccessCode?: string;
  
  // Partner assets
  sponsorLogos?: SponsorLogo[];
  clientLogos?: ClientLogo[];
  
  // Presentation Templates (PowerPoint slide galleries)
  presentationTemplates?: PresentationTemplate[];
  presentations?: PresentationTemplate[];
  
  // Shared Assets (for event inheritance)
  sharedAssets?: any[];
  
  // Partner Booths (linked from booth catalog + custom entries)
  partnerBooths?: LinkedBoothCard[];
  
  // Webinars
  webinars?: BrandWebinar[];
  
  // Awards
  awards?: BrandAward[];
  
  // Locations
  locations?: BrandLocation[];
  locationStats?: LocationStat[];
  
  // Approved Imagery (Shutterstock curated sub-sections)
  approvedImagery?: ApprovedImageryData;
  
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
  eventPrintMaterials: [],
  eventSponsorshipMaterials: [],
  eventInfographics: [],
  eventApplications: [],
  eventDigitalAssets: [],
  eventSchedule: [
    { id: '1', time: 'Day 1 - 8:00 AM', title: 'Registration & Welcome Coffee', description: 'Check in, grab your badge, and network over coffee before the main program begins.', speaker: '', location: 'Main Lobby', track: 'registration' },
    { id: '2', time: 'Day 1 - 9:00 AM', title: 'Opening Keynote', description: 'Welcome address and vision for the year ahead. Setting the stage for two days of innovation and collaboration.', speaker: '', location: 'Grand Ballroom', track: 'keynote' },
    { id: '3', time: 'Day 1 - 10:15 AM', title: 'The Future of Localization', description: 'How AI and automation are transforming the localization industry. Trends, challenges, and opportunities.', speaker: '', location: 'Grand Ballroom', track: 'session' },
    { id: '4', time: 'Day 1 - 11:15 AM', title: 'Networking Break', description: 'Refreshments and networking in the exhibition area.', speaker: '', location: 'Exhibition Hall', track: 'break' },
    { id: '5', time: 'Day 1 - 11:45 AM', title: 'Hands-On Workshop: AI Translation Tools', description: 'Interactive workshop exploring the latest AI-powered translation tools and workflows.', speaker: '', location: 'Workshop Room A', track: 'workshop' },
    { id: '6', time: 'Day 1 - 12:45 PM', title: 'Lunch', description: 'Seated lunch with themed discussion tables.', speaker: '', location: 'Dining Pavilion', track: 'lunch' },
    { id: '7', time: 'Day 1 - 2:00 PM', title: 'Panel: Global Brand Consistency', description: 'Industry leaders discuss maintaining brand integrity across markets, cultures, and languages.', speaker: '', location: 'Grand Ballroom', track: 'panel' },
    { id: '8', time: 'Day 1 - 3:15 PM', title: 'Customer Success Stories', description: 'Real-world case studies from organizations that have transformed their global content strategy.', speaker: '', location: 'Breakout Room 1', track: 'session' },
    { id: '9', time: 'Day 1 - 4:15 PM', title: 'Networking Reception', description: 'Cocktails, canapés, and conversation to close out Day 1.', speaker: '', location: 'Rooftop Terrace', track: 'networking' },
    { id: '10', time: 'Day 2 - 9:00 AM', title: 'Day 2 Keynote: Innovation Showcase', description: 'Unveiling new product features and roadmap highlights for the coming year.', speaker: '', location: 'Grand Ballroom', track: 'keynote' },
    { id: '11', time: 'Day 2 - 10:15 AM', title: 'Workshop: Cultural Adaptation Best Practices', description: 'Deep dive into cultural adaptation strategies for global campaigns.', speaker: '', location: 'Workshop Room B', track: 'workshop' },
    { id: '12', time: 'Day 2 - 11:30 AM', title: 'Panel: Measuring Localization ROI', description: 'Data-driven approaches to quantifying the impact of localization investments.', speaker: '', location: 'Grand Ballroom', track: 'panel' },
    { id: '13', time: 'Day 2 - 12:30 PM', title: 'Lunch & Learn', description: 'Lunch with expert-led roundtable discussions on trending topics.', speaker: '', location: 'Dining Pavilion', track: 'lunch' },
    { id: '14', time: 'Day 2 - 2:00 PM', title: 'Closing Session & Awards', description: 'Recap of key takeaways, award ceremony, and looking ahead to next year.', speaker: '', location: 'Grand Ballroom', track: 'keynote' },
  ],
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
  templateSpecs: [
    // Pre-built event template specs for users to work from
    {
      id: 'event-signage-spec-1',
      name: 'Event Signage Specification',
      category: 'template' as const,
      previewImageUrl: '/images/events/signage-booth-backdrop.jpg',
      items: [
        { id: 'z1', number: 1, title: 'Logo Zone', description: 'Event logo placement - primary lockup, minimum clear space 2"', position: { x: 10, y: 8 } },
        { id: 'z2', number: 2, title: 'Headline Area', description: 'Event name and tagline - use event headline font, left or center aligned', position: { x: 50, y: 15 } },
        { id: 'z3', number: 3, title: 'Key Visual', description: 'Hero imagery or event photography - full bleed acceptable', position: { x: 50, y: 45 } },
        { id: 'z4', number: 4, title: 'Date & Venue', description: 'Event date, location, and hashtag - use body font, high contrast', position: { x: 10, y: 85 } },
        { id: 'z5', number: 5, title: 'Sponsor Lockup', description: 'Sponsor logos tier placement - maintain hierarchy spacing', position: { x: 85, y: 85 } },
      ],
      notes: 'Visual specification for booth backdrops, pull-up banners, and directional signage',
    },
    {
      id: 'event-banner-spec-1',
      name: 'Digital Banner Specification',
      category: 'template' as const,
      previewImageUrl: '/images/events/banner-email.jpg',
      items: [
        { id: 'b1', number: 1, title: 'Logo', description: 'Event logo - minimum 120px height for web, left-aligned', position: { x: 5, y: 50 } },
        { id: 'b2', number: 2, title: 'Event Title', description: 'Event name in headline font - maximum 2 lines', position: { x: 35, y: 30 } },
        { id: 'b3', number: 3, title: 'Event Details', description: 'Date, location, CTA - use accent color for CTA button', position: { x: 35, y: 55 } },
        { id: 'b4', number: 4, title: 'Visual Element', description: 'Supporting imagery or pattern - 40% max width', position: { x: 75, y: 50 } },
      ],
      notes: 'Specification for email headers, social covers, and web banners',
    },
    {
      id: 'event-badge-spec-1',
      name: 'Name Badge Specification',
      category: 'other' as const,
      items: [
        { id: 'n1', number: 1, title: 'Event Logo', description: 'Event logo centered at top - max height 0.75"', position: { x: 50, y: 10 } },
        { id: 'n2', number: 2, title: 'Attendee Name', description: 'Name in bold - 24pt minimum for readability at 3ft distance', position: { x: 50, y: 35 } },
        { id: 'n3', number: 3, title: 'Company/Title', description: 'Organization and title - secondary font, 14pt', position: { x: 50, y: 55 } },
        { id: 'n4', number: 4, title: 'Role Indicator', description: 'Color-coded badge type (Speaker, VIP, Attendee, Staff)', position: { x: 50, y: 75 } },
        { id: 'n5', number: 5, title: 'QR Code', description: 'Contact exchange QR - minimum 0.5" square', position: { x: 85, y: 90 } },
      ],
      notes: 'Attendee and speaker badge layout specification',
    },
    {
      id: 'event-presentation-spec-1',
      name: 'Presentation Template Specification',
      category: 'template' as const,
      items: [
        { id: 'p1', number: 1, title: 'Title Safe Zone', description: 'Keep titles within top 15% - event headline font required', position: { x: 5, y: 5 } },
        { id: 'p2', number: 2, title: 'Footer Bar', description: 'Persistent footer with event logo, hashtag, slide number', position: { x: 5, y: 90 } },
        { id: 'p3', number: 3, title: 'Content Area', description: 'Main content zone - respect margins of 5% on all sides', position: { x: 50, y: 45 } },
        { id: 'p4', number: 4, title: 'Speaker Logo', description: 'Speaker company logo placement - 80px max height', position: { x: 90, y: 5 } },
      ],
      notes: 'Speaker deck and presentation slide guidelines',
    },
  ],
  revenueData: [],
  statistics: [],
  infographicLayout: 'cards',
  
  pageSettings: DEFAULT_EVENT_PAGE_SETTINGS,
});
