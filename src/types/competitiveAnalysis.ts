// Types for the Competitive Analysis Reporting System

export interface LogoAnalysis {
  style: string;
  typography: string;
  symbolism: string;
  scalability: string;
  memorability: string;
}

export interface ColorPaletteAnalysis {
  primary: string[];
  secondary: string[];
  psychology: string;
  accessibility: string;
  consistency: string;
}

export interface TypographySystemAnalysis {
  fonts: string[];
  hierarchy: string;
  personality: string;
}

export interface VisualStyleAnalysis {
  photographyStyle: string;
  illustrationApproach: string;
  iconography: string;
  aesthetic: string;
}

export interface DesignPatternsAnalysis {
  uiElements: string;
  whitespace: string;
  interactions: string;
}

export interface VisualIdentityAudit {
  logoAnalysis: LogoAnalysis;
  colorPalette: ColorPaletteAnalysis;
  typographySystem: TypographySystemAnalysis;
  visualStyle: VisualStyleAnalysis;
  designPatterns: DesignPatternsAnalysis;
}

export interface HomepageImpression {
  heroImpact: string;
  hierarchy: string;
  ctaDesign: string;
  effectiveness: string;
}

export interface UXAnalysis {
  navigation: string;
  contentOrganization: string;
  mobileResponsive: string;
  overallPolish: string;
}

export interface ContentPresentation {
  videoUsage: string;
  dataVisualization: string;
  caseStudyDesign: string;
}

export interface DigitalPresenceAnalysis {
  homepageImpression: HomepageImpression;
  uxAnalysis: UXAnalysis;
  contentPresentation: ContentPresentation;
}

export interface MarketingCollateralAnalysis {
  materialQuality: string[];
  productMarketing: string[];
  socialConsistency: string;
}

export interface PersonalityMatrix {
  innovationScore: number;
  approachabilityScore: number;
  technicalScore: number;
  boldnessScore: number;
  enterpriseScore: number;
  globalScore: number;
}

export interface BrandPositioningAnalysis {
  personalityMatrix: PersonalityMatrix;
  targetAudienceSignals: string[];
  trustIndicators: string[];
  differentiation: string[];
}

export interface StrengthsWeaknessesMatrix {
  designSophistication: number;
  visualConsistency: number;
  userCentricity: number;
  innovation: number;
  clarity: number;
  emotionalConnection: number;
  professionalPolish: number;
}

export interface DesignPriority {
  title: string;
  impact: string;
  effort: string;
}

export interface BrandRefinements {
  logo: string;
  colors: string;
  typography: string;
  imagery: string;
}

export interface RecommendationsSection {
  positioningOpportunities: string[];
  designPriorities: DesignPriority[];
  brandRefinements: BrandRefinements;
  digitalImprovements: string[];
  assetOptimization: string[];
}

export interface MarketPerceptionSummary {
  categoryMaturity: string;
  dominantTrends: string[];
  currentRanking: number;
  keyStrengths: string[];
  criticalGaps: string[];
  risks: string[];
}

export interface RegionalInsights {
  marketContext: string;
  localCompetitors: string[];
  culturalConsiderations: string[];
  localizationPriorities: string[];
  regulatoryConsiderations: string;
  marketOpportunities: string[];
  entryBarriers: string[];
}

export interface ActionPlan {
  thirtyDay: string[];
  sixtyDay: string[];
  ninetyDay: string[];
}

export interface ExecutiveSummary {
  overview: string;
  currentPosition: string;
  topPriorities: string[];
  actionPlan: ActionPlan;
  successMetrics: string[];
}

export interface CompetitiveAnalysisReportData {
  visualIdentityAudit: VisualIdentityAudit;
  digitalPresence: DigitalPresenceAnalysis;
  marketingCollateral: MarketingCollateralAnalysis;
  brandPositioning: BrandPositioningAnalysis;
  strengthsWeaknesses: StrengthsWeaknessesMatrix;
  recommendations: RecommendationsSection;
  marketPerception: MarketPerceptionSummary;
  executiveSummary: ExecutiveSummary;
  regionalInsights?: RegionalInsights;
  score: number;
  generatedAt: string;
  competitors: string[];
  region?: string;
  country?: string;
}

export interface CompetitiveAnalysisReport {
  id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  organization_id: string | null;
  report_type: string;
  report_data: CompetitiveAnalysisReportData;
  competitors: string[];
  score: number | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EntityType = 'brand' | 'product' | 'event';
