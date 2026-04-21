/**
 * Philosophical Pillars - Local Asset Imports
 * Hyper-realistic human imagery for brand values
 */

import collaborationImg from '@/assets/pillars/collaboration-pillar.jpg';
import integrityImg from '@/assets/pillars/integrity-pillar.jpg';
import excellenceImg from '@/assets/pillars/excellence-pillar.jpg';
import innovationImg from '@/assets/pillars/innovation-pillar.jpg';
import customerFocusImg from '@/assets/pillars/customer-focus-pillar.jpg';
import trustImg from '@/assets/pillars/trust-pillar.jpg';
import sustainabilityImg from '@/assets/pillars/sustainability-pillar.jpg';
import diversityImg from '@/assets/pillars/diversity-pillar.jpg';
import urgencyImg from '@/assets/pillars/urgency-pillar.jpg';
import resultsImg from '@/assets/pillars/results-pillar.jpg';
import transparencyImg from '@/assets/pillars/transparency-pillar.jpg';
import financialResponsibilityImg from '@/assets/pillars/financial-responsibility-pillar.jpg';

export const collaborationPillar = collaborationImg;
export const integrityPillar = integrityImg;
export const excellencePillar = excellenceImg;
export const innovationPillar = innovationImg;
export const customerFocusPillar = customerFocusImg;
export const trustPillar = trustImg;
export const sustainabilityPillar = sustainabilityImg;
export const diversityPillar = diversityImg;
export const urgencyPillar = urgencyImg;
export const resultsPillar = resultsImg;
export const transparencyPillar = transparencyImg;
export const financialResponsibilityPillar = financialResponsibilityImg;

export const pillarImages: Record<string, string> = {
  // Financial Responsibility / Stewardship
  // (placed first so it wins over generic "responsibility" -> sustainability)
  'financial responsibility': financialResponsibilityPillar,
  'fiscal responsibility': financialResponsibilityPillar,
  'financial stewardship': financialResponsibilityPillar,
  financial: financialResponsibilityPillar,
  fiscal: financialResponsibilityPillar,
  stewardship: financialResponsibilityPillar,

  // Collaboration / Teamwork
  collaboration: collaborationPillar,
  teamwork: collaborationPillar,
  partnership: collaborationPillar,
  together: collaborationPillar,
  unity: collaborationPillar,
  
  // Integrity / Ethics
  integrity: integrityPillar,
  honesty: integrityPillar,
  ethics: integrityPillar,
  authentic: integrityPillar,
  
  // Transparency / Openness
  transparency: transparencyPillar,
  openness: transparencyPillar,
  candor: transparencyPillar,
  
  // Excellence / Quality
  excellence: excellencePillar,
  quality: excellencePillar,
  success: excellencePillar,
  achievement: excellencePillar,
  award: excellencePillar,
  
  // Results / Performance
  results: resultsPillar,
  performance: resultsPillar,
  outcomes: resultsPillar,
  goals: resultsPillar,
  
  // Innovation / Growth
  innovation: innovationPillar,
  creativity: innovationPillar,
  ideas: innovationPillar,
  growth: innovationPillar,
  
  // Urgency / Speed / Agility
  urgency: urgencyPillar,
  agility: urgencyPillar,
  speed: urgencyPillar,
  
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
  transparencyPillar,
  excellencePillar,
  resultsPillar,
  innovationPillar,
  urgencyPillar,
  customerFocusPillar,
  trustPillar,
  sustainabilityPillar,
  diversityPillar,
];

export const pillarImagesWithLabels = [
  { url: collaborationPillar, label: 'Collaboration', keywords: ['teamwork', 'partnership', 'unity'] },
  { url: integrityPillar, label: 'Integrity', keywords: ['honesty', 'ethics', 'authentic'] },
  { url: transparencyPillar, label: 'Transparency', keywords: ['openness', 'candor', 'clarity'] },
  { url: excellencePillar, label: 'Excellence', keywords: ['quality', 'success', 'achievement'] },
  { url: resultsPillar, label: 'Results', keywords: ['performance', 'outcomes', 'goals'] },
  { url: innovationPillar, label: 'Innovation', keywords: ['creativity', 'ideas', 'growth'] },
  { url: urgencyPillar, label: 'Urgency', keywords: ['speed', 'agility', 'momentum'] },
  { url: customerFocusPillar, label: 'Customer Focus', keywords: ['service', 'care', 'empathy'] },
  { url: trustPillar, label: 'Trust', keywords: ['reliability', 'commitment', 'accountability'] },
  { url: sustainabilityPillar, label: 'Sustainability', keywords: ['environment', 'community', 'responsibility'] },
  { url: diversityPillar, label: 'Diversity', keywords: ['inclusion', 'belonging', 'respect'] },
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
