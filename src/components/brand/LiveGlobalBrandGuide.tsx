/**
 * LiveGlobalBrandGuide - Wrapper component for viewing brand guides with regional variants
 * Provides locale selection and regional comparison capabilities
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Globe2, MapPin, Shuffle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { LocaleSelector } from './LocaleSelector';
import { RegionalVariantIndicator } from './RegionalVariantIndicator';
import { RegionalComparisonView } from './RegionalComparisonView';
import { useEntityVariants, useLocalePreference } from '@/hooks/useRegionalBranding';
import { LOCALIZABLE_SECTIONS } from '@/types/regionalBranding';
import type { ResolvedBrandVariant, LocalizableSection, RegionalComparison } from '@/types/regionalBranding';

interface LiveGlobalBrandGuideProps {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  organizationId: string;
  baseGuideData: Record<string, unknown>;
  onGuideDataChange?: (resolvedData: Record<string, unknown>) => void;
  availableRegions?: string[];
  availableCountries?: string[];
  showLocaleSelector?: boolean;
  showComparisonView?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const LiveGlobalBrandGuide: React.FC<LiveGlobalBrandGuideProps> = ({
  entityType,
  entityId,
  organizationId,
  baseGuideData,
  onGuideDataChange,
  availableRegions = [],
  availableCountries = [],
  showLocaleSelector = true,
  showComparisonView = false,
  children,
  className,
}) => {
  const { preference } = useLocalePreference();
  const { variants, resolveVariant, getComparison } = useEntityVariants(
    entityType,
    entityId,
    organizationId
  );

  const [activeVariantCode, setActiveVariantCode] = useState<string>('global');
  const [showComparison, setShowComparison] = useState(false);

  // Determine which variant to show based on user preference
  useEffect(() => {
    if (preference?.preferred_country) {
      setActiveVariantCode(preference.preferred_country);
    } else if (preference?.preferred_region) {
      setActiveVariantCode(preference.preferred_region);
    } else {
      setActiveVariantCode('global');
    }

    if (preference?.show_regional_comparison !== undefined) {
      setShowComparison(preference.show_regional_comparison);
    }
  }, [preference]);

  // Resolve the current variant
  const resolvedVariant = useMemo((): ResolvedBrandVariant | null => {
    return resolveVariant(activeVariantCode, baseGuideData);
  }, [activeVariantCode, baseGuideData, resolveVariant]);

  // Build comparison data for all sections
  const comparisons = useMemo((): RegionalComparison[] => {
    if (!showComparison) return [];
    return LOCALIZABLE_SECTIONS.map(section =>
      getComparison(section as LocalizableSection, baseGuideData)
    ).filter(c => c.variants.some(v => v.has_override));
  }, [showComparison, baseGuideData, getComparison]);

  // Notify parent of resolved data changes
  useEffect(() => {
    if (resolvedVariant && onGuideDataChange) {
      onGuideDataChange(resolvedVariant.resolved_guide_data);
    }
  }, [resolvedVariant, onGuideDataChange]);

  const handleLocaleChange = (locale: { region?: string; country?: string }) => {
    if (locale.country) {
      setActiveVariantCode(locale.country);
    } else if (locale.region) {
      setActiveVariantCode(locale.region);
    } else {
      setActiveVariantCode('global');
    }
  };

  const handleViewGlobal = () => {
    setActiveVariantCode('global');
  };

  const hasVariants = variants.length > 0;

  return (
    <div className={cn('relative', className)}>
      {/* Top Bar with Locale Selector */}
      {showLocaleSelector && hasVariants && (
        <div className="flex items-center justify-between gap-4 mb-4 p-3 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-3">
            <Globe2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Living Global Brand Guide</p>
              <p className="text-xs text-muted-foreground">
                View culturally-adapted content for different regions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LocaleSelector
              availableRegions={availableRegions}
              availableCountries={availableCountries}
              onLocaleChange={handleLocaleChange}
              showComparisonToggle
            />
            
            {showComparisonView && (
              <Button
                variant={showComparison ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="gap-2"
              >
                <Shuffle className="h-4 w-4" />
                Compare
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Variant Indicator */}
      {resolvedVariant && resolvedVariant.variant_code !== 'global' && (
        <RegionalVariantIndicator
          resolvedVariant={resolvedVariant}
          onViewGlobal={handleViewGlobal}
          className="mb-4"
        />
      )}

      {/* Regional Comparison View */}
      {showComparison && comparisons.length > 0 && (
        <div className="mb-6">
          <RegionalComparisonView
            comparisons={comparisons}
            onApplyVariant={(section, code) => setActiveVariantCode(code)}
          />
          <Separator className="my-6" />
        </div>
      )}

      {/* Main Content */}
      {children}

      {/* Empty State for No Variants */}
      {showLocaleSelector && !hasVariants && (
        <Card className="mt-4 border-dashed">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 bg-muted rounded-lg">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">No Regional Variants</p>
              <p className="text-xs text-muted-foreground">
                Create regional variants to enable culturally-adapted content
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Global Only
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveGlobalBrandGuide;
