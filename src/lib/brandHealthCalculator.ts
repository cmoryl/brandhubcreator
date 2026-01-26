/**
 * Brand Health Score Calculator
 * Calculates a completeness/health score based on guide_data content
 */

const SECTION_WEIGHTS = {
  hero: { weight: 15, label: 'Brand Name & Hero' },
  tagline: { weight: 10, label: 'Tagline' },
  identity: { weight: 12, label: 'Mission & Vision' },
  values: { weight: 10, label: 'Core Values' },
  colors: { weight: 15, label: 'Color Palette' },
  typography: { weight: 12, label: 'Typography' },
  logo: { weight: 15, label: 'Logo Assets' },
  patterns: { weight: 5, label: 'Patterns' },
  gradients: { weight: 3, label: 'Gradients' },
  icons: { weight: 5, label: 'Icons' },
  imagery: { weight: 5, label: 'Imagery Guidelines' },
  social: { weight: 8, label: 'Social Profiles' },
  services: { weight: 8, label: 'Services' },
  templates: { weight: 5, label: 'Templates' },
  signatures: { weight: 3, label: 'Email Signatures' },
  qr: { weight: 3, label: 'QR Codes' },
  brochures: { weight: 5, label: 'Brochures' },
};

export interface HealthScoreResult {
  overallScore: number;
  filledSections: number;
  totalSections: number;
  breakdown: {
    section: string;
    label: string;
    weight: number;
    earned: number;
    filled: boolean;
  }[];
}

/**
 * Calculate brand health score from guide_data
 */
export function calculateBrandHealth(guideData: Record<string, unknown> | null | undefined): HealthScoreResult {
  if (!guideData) {
    return {
      overallScore: 0,
      filledSections: 0,
      totalSections: Object.keys(SECTION_WEIGHTS).length,
      breakdown: [],
    };
  }

  let totalWeight = 0;
  let earnedWeight = 0;
  let filledSections = 0;
  const breakdown: HealthScoreResult['breakdown'] = [];

  // Hero / Brand Name
  const hero = guideData.hero as Record<string, unknown> | undefined;
  const hasHeroName = !!(hero?.name);
  totalWeight += SECTION_WEIGHTS.hero.weight;
  if (hasHeroName) {
    earnedWeight += SECTION_WEIGHTS.hero.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'hero',
    label: SECTION_WEIGHTS.hero.label,
    weight: SECTION_WEIGHTS.hero.weight,
    earned: hasHeroName ? SECTION_WEIGHTS.hero.weight : 0,
    filled: hasHeroName,
  });

  // Tagline
  const hasTagline = !!(hero?.tagline);
  totalWeight += SECTION_WEIGHTS.tagline.weight;
  if (hasTagline) {
    earnedWeight += SECTION_WEIGHTS.tagline.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'tagline',
    label: SECTION_WEIGHTS.tagline.label,
    weight: SECTION_WEIGHTS.tagline.weight,
    earned: hasTagline ? SECTION_WEIGHTS.tagline.weight : 0,
    filled: hasTagline,
  });

  // Identity (Mission/Vision)
  const identity = guideData.identity as Record<string, unknown> | undefined;
  const hasIdentity = !!(identity?.missionStatement || identity?.visionStatement);
  const hasFullIdentity = !!(identity?.missionStatement && identity?.visionStatement);
  totalWeight += SECTION_WEIGHTS.identity.weight;
  const identityEarned = hasFullIdentity ? SECTION_WEIGHTS.identity.weight : hasIdentity ? SECTION_WEIGHTS.identity.weight * 0.5 : 0;
  if (hasIdentity) {
    earnedWeight += identityEarned;
    filledSections++;
  }
  breakdown.push({
    section: 'identity',
    label: SECTION_WEIGHTS.identity.label,
    weight: SECTION_WEIGHTS.identity.weight,
    earned: identityEarned,
    filled: hasIdentity,
  });

  // Values
  const values = (guideData.values as unknown[]) || [];
  const hasValues = values.length >= 3;
  const hasPartialValues = values.length > 0;
  totalWeight += SECTION_WEIGHTS.values.weight;
  const valuesEarned = hasValues ? SECTION_WEIGHTS.values.weight : hasPartialValues ? SECTION_WEIGHTS.values.weight * 0.5 : 0;
  if (hasPartialValues) {
    earnedWeight += valuesEarned;
    filledSections++;
  }
  breakdown.push({
    section: 'values',
    label: SECTION_WEIGHTS.values.label,
    weight: SECTION_WEIGHTS.values.weight,
    earned: valuesEarned,
    filled: hasPartialValues,
  });

  // Colors
  const colors = (guideData.colors as unknown[]) || [];
  const hasColors = colors.length >= 3;
  const hasPartialColors = colors.length > 0;
  totalWeight += SECTION_WEIGHTS.colors.weight;
  const colorsEarned = hasColors ? SECTION_WEIGHTS.colors.weight : hasPartialColors ? SECTION_WEIGHTS.colors.weight * 0.5 : 0;
  if (hasPartialColors) {
    earnedWeight += colorsEarned;
    filledSections++;
  }
  breakdown.push({
    section: 'colors',
    label: SECTION_WEIGHTS.colors.label,
    weight: SECTION_WEIGHTS.colors.weight,
    earned: colorsEarned,
    filled: hasPartialColors,
  });

  // Typography
  const typography = (guideData.typography as unknown[]) || [];
  const hasTypography = typography.length >= 2;
  const hasPartialTypography = typography.length > 0;
  totalWeight += SECTION_WEIGHTS.typography.weight;
  const typographyEarned = hasTypography ? SECTION_WEIGHTS.typography.weight : hasPartialTypography ? SECTION_WEIGHTS.typography.weight * 0.5 : 0;
  if (hasPartialTypography) {
    earnedWeight += typographyEarned;
    filledSections++;
  }
  breakdown.push({
    section: 'typography',
    label: SECTION_WEIGHTS.typography.label,
    weight: SECTION_WEIGHTS.typography.weight,
    earned: typographyEarned,
    filled: hasPartialTypography,
  });

  // Logo
  const logo = guideData.logo as Record<string, unknown> | undefined;
  const hasLogo = !!(logo?.primaryUrl);
  totalWeight += SECTION_WEIGHTS.logo.weight;
  if (hasLogo) {
    earnedWeight += SECTION_WEIGHTS.logo.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'logo',
    label: SECTION_WEIGHTS.logo.label,
    weight: SECTION_WEIGHTS.logo.weight,
    earned: hasLogo ? SECTION_WEIGHTS.logo.weight : 0,
    filled: hasLogo,
  });

  // Patterns
  const patterns = (guideData.patterns as unknown[]) || [];
  const hasPatterns = patterns.length > 0;
  totalWeight += SECTION_WEIGHTS.patterns.weight;
  if (hasPatterns) {
    earnedWeight += SECTION_WEIGHTS.patterns.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'patterns',
    label: SECTION_WEIGHTS.patterns.label,
    weight: SECTION_WEIGHTS.patterns.weight,
    earned: hasPatterns ? SECTION_WEIGHTS.patterns.weight : 0,
    filled: hasPatterns,
  });

  // Gradients
  const gradients = (guideData.gradients as unknown[]) || [];
  const hasGradients = gradients.length > 0;
  totalWeight += SECTION_WEIGHTS.gradients.weight;
  if (hasGradients) {
    earnedWeight += SECTION_WEIGHTS.gradients.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'gradients',
    label: SECTION_WEIGHTS.gradients.label,
    weight: SECTION_WEIGHTS.gradients.weight,
    earned: hasGradients ? SECTION_WEIGHTS.gradients.weight : 0,
    filled: hasGradients,
  });

  // Icons
  const icons = (guideData.icons as unknown[]) || [];
  const hasIcons = icons.length > 0;
  totalWeight += SECTION_WEIGHTS.icons.weight;
  if (hasIcons) {
    earnedWeight += SECTION_WEIGHTS.icons.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'icons',
    label: SECTION_WEIGHTS.icons.label,
    weight: SECTION_WEIGHTS.icons.weight,
    earned: hasIcons ? SECTION_WEIGHTS.icons.weight : 0,
    filled: hasIcons,
  });

  // Imagery
  const imagery = guideData.imagery as Record<string, unknown> | undefined;
  const imageryItems = (imagery?.items as unknown[]) || [];
  const hasImagery = !!(imagery?.style || imagery?.guidelines || imageryItems.length > 0);
  totalWeight += SECTION_WEIGHTS.imagery.weight;
  if (hasImagery) {
    earnedWeight += SECTION_WEIGHTS.imagery.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'imagery',
    label: SECTION_WEIGHTS.imagery.label,
    weight: SECTION_WEIGHTS.imagery.weight,
    earned: hasImagery ? SECTION_WEIGHTS.imagery.weight : 0,
    filled: hasImagery,
  });

  // Social
  const social = (guideData.social as unknown[]) || [];
  const hasSocial = social.length > 0;
  totalWeight += SECTION_WEIGHTS.social.weight;
  if (hasSocial) {
    earnedWeight += SECTION_WEIGHTS.social.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'social',
    label: SECTION_WEIGHTS.social.label,
    weight: SECTION_WEIGHTS.social.weight,
    earned: hasSocial ? SECTION_WEIGHTS.social.weight : 0,
    filled: hasSocial,
  });

  // Services
  const services = (guideData.services as unknown[]) || [];
  const hasServices = services.length > 0;
  totalWeight += SECTION_WEIGHTS.services.weight;
  if (hasServices) {
    earnedWeight += SECTION_WEIGHTS.services.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'services',
    label: SECTION_WEIGHTS.services.label,
    weight: SECTION_WEIGHTS.services.weight,
    earned: hasServices ? SECTION_WEIGHTS.services.weight : 0,
    filled: hasServices,
  });

  // Templates
  const templates = (guideData.templates as unknown[]) || [];
  const hasTemplates = templates.length > 0;
  totalWeight += SECTION_WEIGHTS.templates.weight;
  if (hasTemplates) {
    earnedWeight += SECTION_WEIGHTS.templates.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'templates',
    label: SECTION_WEIGHTS.templates.label,
    weight: SECTION_WEIGHTS.templates.weight,
    earned: hasTemplates ? SECTION_WEIGHTS.templates.weight : 0,
    filled: hasTemplates,
  });

  // Signatures
  const signatures = (guideData.signatures as unknown[]) || [];
  const hasSignatures = signatures.length > 0;
  totalWeight += SECTION_WEIGHTS.signatures.weight;
  if (hasSignatures) {
    earnedWeight += SECTION_WEIGHTS.signatures.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'signatures',
    label: SECTION_WEIGHTS.signatures.label,
    weight: SECTION_WEIGHTS.signatures.weight,
    earned: hasSignatures ? SECTION_WEIGHTS.signatures.weight : 0,
    filled: hasSignatures,
  });

  // QR
  const qr = guideData.qr as Record<string, unknown> | undefined;
  const hasQr = !!(qr?.url || qr?.dataUrl);
  totalWeight += SECTION_WEIGHTS.qr.weight;
  if (hasQr) {
    earnedWeight += SECTION_WEIGHTS.qr.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'qr',
    label: SECTION_WEIGHTS.qr.label,
    weight: SECTION_WEIGHTS.qr.weight,
    earned: hasQr ? SECTION_WEIGHTS.qr.weight : 0,
    filled: hasQr,
  });

  // Brochures
  const brochures = (guideData.brochures as unknown[]) || [];
  const hasBrochures = brochures.length > 0;
  totalWeight += SECTION_WEIGHTS.brochures.weight;
  if (hasBrochures) {
    earnedWeight += SECTION_WEIGHTS.brochures.weight;
    filledSections++;
  }
  breakdown.push({
    section: 'brochures',
    label: SECTION_WEIGHTS.brochures.label,
    weight: SECTION_WEIGHTS.brochures.weight,
    earned: hasBrochures ? SECTION_WEIGHTS.brochures.weight : 0,
    filled: hasBrochures,
  });

  const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return {
    overallScore,
    filledSections,
    totalSections: Object.keys(SECTION_WEIGHTS).length,
    breakdown,
  };
}

/**
 * Get a human-readable health status
 */
export function getHealthStatus(score: number): 'excellent' | 'good' | 'needs-work' | 'incomplete' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 40) return 'needs-work';
  return 'incomplete';
}

/**
 * Get trend based on comparing current to previous score
 */
export function getHealthTrend(currentScore: number, previousScore?: number): 'up' | 'down' | 'stable' {
  if (previousScore === undefined) return 'stable';
  if (currentScore > previousScore) return 'up';
  if (currentScore < previousScore) return 'down';
  return 'stable';
}
