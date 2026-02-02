import type { TourStep } from '@/components/demo/DemoTour';

// Tour steps for brand/product demo guides
// Using data-section attributes which are set by SectionWrapper in FullBrandPage
export const brandDemoTourSteps: TourStep[] = [
  {
    target: '[data-section="hero"], .hero-section',
    title: 'Brand Identity Hero',
    description: 'The hero section showcases your brand\'s primary identity with logo, tagline, and visual theme. It sets the first impression for anyone viewing your brand guidelines.',
    position: 'bottom',
  },
  {
    target: '[data-section="identity"]',
    title: 'Brand Narrative',
    description: 'Define your brand story, mission, and vision here. This section helps stakeholders understand the core purpose and values that drive your brand.',
    position: 'top',
  },
  {
    target: '[data-section="values"]',
    title: 'Core Values',
    description: 'Highlight the philosophical pillars that guide your brand decisions. Values help maintain consistency across all brand touchpoints.',
    position: 'top',
  },
  {
    target: '[data-section="logos"]',
    title: 'Logo Guidelines',
    description: 'Showcase all logo variations with usage rules, clear space requirements, and downloadable assets. Essential for maintaining visual consistency.',
    position: 'top',
  },
  {
    target: '[data-section="colors"]',
    title: 'Color Palette',
    description: 'Your brand\'s color system with HEX, RGB, and CMYK values. Click any color to copy its value instantly for easy implementation.',
    position: 'top',
  },
  {
    target: '[data-section="typography"]',
    title: 'Typography System',
    description: 'Font families, weights, and sizing guidelines ensure consistent text styling across all materials and platforms.',
    position: 'top',
  },
];

// Tour steps for event demo guides
export const eventDemoTourSteps: TourStep[] = [
  {
    target: '[data-section="hero"], .hero-section',
    title: 'Event Identity',
    description: 'The event hero displays key details like date, location, and the event\'s visual identity. Perfect for making a strong first impression.',
    position: 'bottom',
  },
  {
    target: '[data-section="about"]',
    title: 'About the Event',
    description: 'Share the event\'s purpose, history, and what attendees can expect. This builds anticipation and provides context.',
    position: 'top',
  },
  {
    target: '[data-section="schedule"]',
    title: 'Event Schedule',
    description: 'A detailed timeline of sessions, speakers, and activities. Helps attendees plan their experience.',
    position: 'top',
  },
  {
    target: '[data-section="speakers"]',
    title: 'Speakers & Hosts',
    description: 'Showcase the people behind your event with bios, photos, and social links.',
    position: 'top',
  },
  {
    target: '[data-section="branding"]',
    title: 'Event Branding',
    description: 'Visual guidelines specific to the event including logos, colors, and approved imagery.',
    position: 'top',
  },
];

// Get appropriate tour steps based on guide type
export const getTourSteps = (type: 'brand' | 'product' | 'event'): TourStep[] => {
  return type === 'event' ? eventDemoTourSteps : brandDemoTourSteps;
};
