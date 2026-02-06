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

export const pillarImages = {
  collaboration: collaborationPillar,
  teamwork: collaborationPillar,
  partnership: collaborationPillar,
  integrity: integrityPillar,
  honesty: integrityPillar,
  transparency: integrityPillar,
  ethics: integrityPillar,
  excellence: excellencePillar,
  quality: excellencePillar,
  success: excellencePillar,
  achievement: excellencePillar,
  innovation: innovationPillar,
  creativity: innovationPillar,
  ideas: innovationPillar,
  growth: innovationPillar,
  customer: customerFocusPillar,
  service: customerFocusPillar,
  care: customerFocusPillar,
  empathy: customerFocusPillar,
  compassion: customerFocusPillar,
  trust: trustPillar,
  reliability: trustPillar,
  commitment: trustPillar,
  accountability: trustPillar,
  sustainability: sustainabilityPillar,
  environment: sustainabilityPillar,
  community: sustainabilityPillar,
  responsibility: sustainabilityPillar,
  giving: sustainabilityPillar,
  diversity: diversityPillar,
  inclusion: diversityPillar,
  belonging: diversityPillar,
  respect: diversityPillar,
  equity: diversityPillar,
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
