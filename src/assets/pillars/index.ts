/**
 * Philosophical Pillars - AI-Generated Hyper-Realistic Imagery
 * Warm, human-interaction focused images for brand value cards
 */

import collaborationPillar from './collaboration-pillar.jpg';
import integrityPillar from './integrity-pillar.jpg';
import excellencePillar from './excellence-pillar.jpg';
import innovationPillar from './innovation-pillar.jpg';
import customerFocusPillar from './customer-focus-pillar.jpg';
import trustPillar from './trust-pillar.jpg';
import sustainabilityPillar from './sustainability-pillar.jpg';
import diversityPillar from './diversity-pillar.jpg';

export const pillarImages: Record<string, string> = {
  // Collaboration / Teamwork
  collaboration: collaborationPillar,
  teamwork: collaborationPillar,
  partnership: collaborationPillar,
  together: collaborationPillar,
  unity: collaborationPillar,
  
  // Integrity / Ethics
  integrity: integrityPillar,
  honesty: integrityPillar,
  transparency: integrityPillar,
  ethics: integrityPillar,
  authentic: integrityPillar,
  
  // Excellence / Quality
  excellence: excellencePillar,
  quality: excellencePillar,
  success: excellencePillar,
  achievement: excellencePillar,
  results: excellencePillar,
  performance: excellencePillar,
  award: excellencePillar,
  
  // Innovation / Growth
  innovation: innovationPillar,
  creativity: innovationPillar,
  ideas: innovationPillar,
  growth: innovationPillar,
  urgency: innovationPillar,
  agility: innovationPillar,
  speed: innovationPillar,
  
  // Customer Focus / Service
  customer: customerFocusPillar,
  service: customerFocusPillar,
  care: customerFocusPillar,
  empathy: customerFocusPillar,
  compassion: customerFocusPillar,
  client: customerFocusPillar,
  
  // Trust / Reliability
  trust: trustPillar,
  reliability: trustPillar,
  commitment: trustPillar,
  accountability: trustPillar,
  'own it': trustPillar,
  ownership: trustPillar,
  
  // Sustainability / Community
  sustainability: sustainabilityPillar,
  environment: sustainabilityPillar,
  community: sustainabilityPillar,
  responsibility: sustainabilityPillar,
  giving: sustainabilityPillar,
  financial: sustainabilityPillar,
  
  // Diversity / Inclusion
  diversity: diversityPillar,
  inclusion: diversityPillar,
  belonging: diversityPillar,
  respect: diversityPillar,
  equity: diversityPillar,
  people: diversityPillar,
};

export const pillarImagesList = [
  collaborationPillar,
  integrityPillar,
  excellencePillar,
  innovationPillar,
  customerFocusPillar,
  trustPillar,
  sustainabilityPillar,
  diversityPillar,
];

/**
 * Get pillar image based on value text keyword matching
 */
export function getPillarImage(valueText: string): string | null {
  const lowerText = valueText.toLowerCase();
  
  for (const [keyword, image] of Object.entries(pillarImages)) {
    if (lowerText.includes(keyword)) {
      return image;
    }
  }
  
  return null;
}

/**
 * Get a stable pillar image based on text hash for consistency
 */
export function getStablePillarImage(valueText: string): string {
  // Use a simple hash to get a consistent image for the same text
  let hash = 0;
  for (let i = 0; i < valueText.length; i++) {
    hash = ((hash << 5) - hash) + valueText.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % pillarImagesList.length;
  return pillarImagesList[index];
}

/**
 * Get a random pillar image for variety
 */
export function getRandomPillarImage(): string {
  return pillarImagesList[Math.floor(Math.random() * pillarImagesList.length)];
}

export {
  collaborationPillar,
  integrityPillar,
  excellencePillar,
  innovationPillar,
  customerFocusPillar,
  trustPillar,
  sustainabilityPillar,
  diversityPillar,
};
