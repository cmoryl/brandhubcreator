/**
 * CulturalIntelligenceSection - Displays AI-generated cultural awareness data
 * Includes regional considerations, GlobalLink recommendations, and localization readiness
 */

import React from 'react';
import {
  Globe2,
  MapPin,
  Palette,
  Image,
  Languages,
  MessageSquare,
  Zap,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface CulturalInsights {
  global_readiness_score: number;
  primary_markets: string[];
  cultural_considerations: {
    region: string;
    considerations: string[];
    design_adaptations: string[];
    messaging_notes: string;
  }[];
  localization_priorities: string[];
  color_cultural_notes: string[];
  imagery_guidelines: string[];
}

interface GlobalLinkRecommendation {
  product: string;
  relevance: 'high' | 'medium' | 'low';
  use_case: string;
}

interface CulturalIntelligenceSectionProps {
  culturalInsights: CulturalInsights | null | undefined;
  globallinkRecommendations: GlobalLinkRecommendation[] | undefined;
  localizationReadinessScore: number | undefined;
}

const GLOBALLINK_PRODUCTS: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
  Translation: {
    icon: <Languages className="h-4 w-4" />,
    color: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
    description: 'AI-powered translation and localization',
  },
  AI: {
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    description: 'Intelligent content adaptation',
  },
  Connect: {
    icon: <Globe2 className="h-4 w-4" />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    description: 'Workflow automation and integration',
  },
  Fluent: {
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    description: 'In-context editing and review',
  },
};

const RELEVANCE_COLORS = {
  high: 'bg-primary/10 text-primary border-primary/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  low: 'bg-muted text-muted-foreground border-muted',
};

export const CulturalIntelligenceSection: React.FC<CulturalIntelligenceSectionProps> = ({
  culturalInsights,
  globallinkRecommendations,
  localizationReadinessScore,
}) => {
  if (!culturalInsights && !globallinkRecommendations?.length) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Globe2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Run AI analysis to generate cultural intelligence</p>
      </div>
    );
  }

  const readinessScore = localizationReadinessScore || culturalInsights?.global_readiness_score || 0;

  // Safely coerce fields to arrays
  const primaryMarkets = Array.isArray(culturalInsights?.primary_markets) ? culturalInsights.primary_markets : [];
  const culturalConsiderations = Array.isArray(culturalInsights?.cultural_considerations) ? culturalInsights.cultural_considerations : [];
  const colorCulturalNotes = Array.isArray(culturalInsights?.color_cultural_notes) ? culturalInsights.color_cultural_notes : [];
  const imageryGuidelines = Array.isArray(culturalInsights?.imagery_guidelines) ? culturalInsights.imagery_guidelines : [];
  const localizationPriorities = Array.isArray(culturalInsights?.localization_priorities) ? culturalInsights.localization_priorities : [];
  const safeRecommendations = Array.isArray(globallinkRecommendations) ? globallinkRecommendations : [];

  return (
    <div className="space-y-4">
      {/* Localization Readiness Score */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-primary" />
              Global Readiness
            </CardTitle>
            <Badge variant="outline" className="text-lg font-bold">
              {readinessScore}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={readinessScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {readinessScore >= 80
              ? 'Excellent - Brand is well-prepared for global expansion'
              : readinessScore >= 60
              ? 'Good - Minor adaptations needed for some markets'
              : readinessScore >= 40
              ? 'Moderate - Significant cultural considerations needed'
              : 'Needs Work - Major localization effort required'}
          </p>
        </CardContent>
      </Card>

      {/* Primary Markets */}
      {primaryMarkets.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Primary Target Markets
          </h4>
          <div className="flex flex-wrap gap-2">
            {primaryMarkets.map((market, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {market}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Considerations by Region */}
      {culturalConsiderations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            Regional Considerations
          </h4>
          <Accordion type="multiple" className="space-y-2">
            {culturalConsiderations.map((region, i) => (
              <AccordionItem key={i} value={region.region} className="border rounded-lg px-3">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <span className="font-medium text-sm">{region.region}</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3">
                  {Array.isArray(region.considerations) && region.considerations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Cultural Notes</p>
                      <ul className="space-y-1">
                        {region.considerations.map((c, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(region.design_adaptations) && region.design_adaptations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Design Adaptations</p>
                      <div className="flex flex-wrap gap-1">
                        {region.design_adaptations.map((d, j) => (
                          <Badge key={j} variant="outline" className="text-xs">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {region.messaging_notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Messaging</p>
                      <p className="text-sm text-muted-foreground">{region.messaging_notes}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* Color Cultural Notes */}
      {colorCulturalNotes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Color Considerations
          </h4>
          <ul className="space-y-1">
            {colorCulturalNotes.map((note, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <ChevronRight className="h-3 w-3 mt-1 shrink-0" />
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Imagery Guidelines */}
      {imageryGuidelines.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            Imagery Guidelines
          </h4>
          <ul className="space-y-1">
            {imageryGuidelines.map((guideline, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <ChevronRight className="h-3 w-3 mt-1 shrink-0" />
                {guideline}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Localization Priorities */}
      {localizationPriorities.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Localization Priorities</h4>
          <div className="space-y-1">
            {localizationPriorities.map((priority, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="h-5 w-5 p-0 justify-center shrink-0">
                  {i + 1}
                </Badge>
                <span>{priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* GlobalLink Recommendations */}
      {safeRecommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Recommended GlobalLink Products
          </h4>
          <div className="space-y-2">
            {safeRecommendations.map((rec, i) => {
              const productInfo = GLOBALLINK_PRODUCTS[rec.product] || {
                icon: <Globe2 className="h-4 w-4" />,
                color: 'bg-muted text-muted-foreground',
                description: 'GlobalLink product',
              };
              return (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md ${productInfo.color}`}>
                        {productInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">GlobalLink {rec.product}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${RELEVANCE_COLORS[rec.relevance]}`}
                          >
                            {rec.relevance}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {rec.use_case}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CulturalIntelligenceSection;
