/**
 * RegionalComparisonView - Side-by-side comparison of regional brand variants
 * Shows differences across regions for a specific section
 */

import React, { useState } from 'react';
import { Globe2, ChevronDown, Eye, EyeOff, ArrowRight, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { RegionalComparison, LocalizableSection } from '@/types/regionalBranding';
import { STANDARD_REGIONS, COMMON_COUNTRIES } from '@/types/regionalBranding';

interface RegionalComparisonViewProps {
  comparisons: RegionalComparison[];
  onApplyVariant?: (section: LocalizableSection, variantCode: string) => void;
  className?: string;
}

export const RegionalComparisonView: React.FC<RegionalComparisonViewProps> = ({
  comparisons,
  onApplyVariant,
  className,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (comparisons.length === 0) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Globe2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h4 className="font-medium mb-2">No Regional Variants</h4>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Create regional variants to see differences across markets
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Regional Comparison</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (expandedSections.size === comparisons.length) {
              setExpandedSections(new Set());
            } else {
              setExpandedSections(new Set(comparisons.map(c => c.section)));
            }
          }}
        >
          {expandedSections.size === comparisons.length ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Collapse All
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Expand All
            </>
          )}
        </Button>
      </div>

      {comparisons.map(comparison => {
        const hasOverrides = comparison.variants.some(v => v.has_override);
        const isExpanded = expandedSections.has(comparison.section);

        return (
          <Collapsible
            key={comparison.section}
            open={isExpanded}
            onOpenChange={() => toggleSection(comparison.section)}
          >
            <Card className={cn(!hasOverrides && 'opacity-60')}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                      <CardTitle className="text-base">
                        {formatSectionName(comparison.section)}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasOverrides ? (
                        <Badge variant="default" className="text-[10px]">
                          {comparison.variants.filter(v => v.has_override).length} variants
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Global only
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 pb-4">
                      {/* Global Value */}
                      <div className="min-w-[200px] p-3 rounded-lg border bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe2 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Global</span>
                          <Badge variant="secondary" className="text-[10px] ml-auto">
                            Base
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {renderValue(comparison.global_value)}
                        </div>
                      </div>

                      {/* Arrow */}
                      {hasOverrides && (
                        <div className="flex items-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}

                      {/* Variant Values */}
                      {comparison.variants
                        .filter(v => v.has_override)
                        .map(variant => (
                          <div
                            key={variant.code}
                            className="min-w-[200px] p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {variant.level === 'country' ? (
                                <span className="text-base">
                                  {getCountryFlag(variant.code)}
                                </span>
                              ) : (
                                <Globe2 className="h-4 w-4 text-blue-500" />
                              )}
                              <span className="text-sm font-medium">
                                {getVariantLabel(variant.code, variant.level)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {renderValue(variant.value)}
                            </div>
                            {onApplyVariant && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full mt-2 h-7 text-xs"
                                onClick={() => onApplyVariant(comparison.section, variant.code)}
                              >
                                Apply to View
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};

// Helper to format section names
function formatSectionName(section: LocalizableSection): string {
  const names: Record<LocalizableSection, string> = {
    hero: 'Hero Section',
    identity: 'Brand Identity',
    colors: 'Color Palette',
    typography: 'Typography',
    imagery: 'Imagery',
    messaging: 'Messaging',
    voice: 'Voice & Tone',
    logos: 'Logos',
    patterns: 'Patterns',
    gradients: 'Gradients',
    custom_sections: 'Custom Sections',
  };
  return names[section] || section;
}

// Helper to render a value preview
function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="italic">No value</span>;
  }

  if (typeof value === 'string') {
    return value.length > 100 ? value.slice(0, 100) + '...' : value;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return (
      <div className="space-y-1">
        {keys.slice(0, 3).map(key => (
          <div key={key} className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-500" />
            <span>{key}</span>
          </div>
        ))}
        {keys.length > 3 && (
          <span className="text-muted-foreground">+{keys.length - 3} more</span>
        )}
      </div>
    );
  }

  return String(value);
}

// Helper to get variant label
function getVariantLabel(code: string, level: string): string {
  if (level === 'region') {
    const region = STANDARD_REGIONS.find(r => r.code === code);
    return region?.name || code;
  }
  if (level === 'country') {
    const country = COMMON_COUNTRIES.find(c => c.code === code);
    return country?.name || code;
  }
  return code;
}

// Helper to get country flag
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default RegionalComparisonView;
