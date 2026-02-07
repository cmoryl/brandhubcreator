/**
 * Philosophical Pillars - Persistent Storage URLs
 * Images stored in Supabase storage for reliability and admin management
 */

const STORAGE_BASE = 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/pillars';

// Persistent storage URLs for pillar images
export const collaborationPillar = `${STORAGE_BASE}/collaboration-pillar.jpg`;
export const integrityPillar = `${STORAGE_BASE}/integrity-pillar.jpg`;
export const excellencePillar = `${STORAGE_BASE}/excellence-pillar.jpg`;
export const innovationPillar = `${STORAGE_BASE}/innovation-pillar.jpg`;
export const customerFocusPillar = `${STORAGE_BASE}/customer-focus-pillar.jpg`;
export const trustPillar = `${STORAGE_BASE}/trust-pillar.jpg`;
export const sustainabilityPillar = `${STORAGE_BASE}/sustainability-pillar.jpg`;
export const diversityPillar = `${STORAGE_BASE}/diversity-pillar.jpg`;

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

export const pillarImagesWithLabels = [
  { url: collaborationPillar, label: 'Collaboration', keywords: ['teamwork', 'partnership', 'unity'] },
  { url: integrityPillar, label: 'Integrity', keywords: ['honesty', 'transparency', 'ethics'] },
  { url: excellencePillar, label: 'Excellence', keywords: ['quality', 'success', 'achievement'] },
  { url: innovationPillar, label: 'Innovation', keywords: ['creativity', 'ideas', 'growth'] },
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
