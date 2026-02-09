/**
 * RegionalVariantIndicator - Shows when viewing a regional variant
 * Displays inheritance chain and override status
 */

import React from 'react';
import { Globe2, MapPin, ArrowRight, Info, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ResolvedBrandVariant, LocalizableSection } from '@/types/regionalBranding';
import { STANDARD_REGIONS, COMMON_COUNTRIES } from '@/types/regionalBranding';

interface RegionalVariantIndicatorProps {
  resolvedVariant: ResolvedBrandVariant | null;
  onViewGlobal?: () => void;
  onEditVariant?: () => void;
  className?: string;
}

export const RegionalVariantIndicator: React.FC<RegionalVariantIndicatorProps> = ({
  resolvedVariant,
  onViewGlobal,
  onEditVariant,
  className,
}) => {
  if (!resolvedVariant || resolvedVariant.variant_code === 'global') {
    return null;
  }

  const { variant_code, variant_level, inheritance_chain, overrides_applied, translation_status } = resolvedVariant;

  // Get display names for the inheritance chain
  const chainLabels = inheritance_chain.map(code => {
    if (code === 'global') return 'Global';
    const region = STANDARD_REGIONS.find(r => r.code === code);
    if (region) return region.name;
    const country = COMMON_COUNTRIES.find(c => c.code === code);
    if (country) return country.name;
    return code;
  });

  const currentLabel = chainLabels[chainLabels.length - 1];
  const isCountry = variant_level === 'country';
  const countryData = isCountry ? COMMON_COUNTRIES.find(c => c.code === variant_code) : null;

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2 rounded-lg border bg-muted/50',
      className
    )}>
      {/* Icon & Label */}
      <div className="flex items-center gap-2">
        {isCountry ? (
          <>
            <span className="text-lg">{countryData ? getCountryFlag(countryData.code) : '🌍'}</span>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </>
        ) : (
          <Globe2 className="h-4 w-4 text-primary" />
        )}
        <span className="font-medium text-sm">{currentLabel}</span>
      </div>

      {/* Inheritance Chain */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
        {chainLabels.slice(0, -1).map((label, i) => (
          <React.Fragment key={i}>
            <span>{label}</span>
            <ArrowRight className="h-3 w-3" />
          </React.Fragment>
        ))}
        <span className="font-medium text-foreground">{currentLabel}</span>
      </div>

      {/* Translation Status */}
      <Badge
        variant={
          translation_status === 'published' ? 'default' :
          translation_status === 'review' ? 'secondary' :
          translation_status === 'in_translation' ? 'outline' :
          'secondary'
        }
        className="text-[10px] h-5"
      >
        {translation_status === 'published' ? '✓ Published' :
         translation_status === 'review' ? 'In Review' :
         translation_status === 'in_translation' ? 'Translating' :
         'Draft'}
      </Badge>

      {/* Overrides Info */}
      {overrides_applied.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-[10px] h-5 cursor-help">
                <Info className="h-3 w-3" />
                {overrides_applied.length} override{overrides_applied.length !== 1 ? 's' : ''}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs font-medium mb-1">Regional Overrides:</p>
              <ul className="text-xs text-muted-foreground">
                {overrides_applied.map(section => (
                  <li key={section}>• {formatSectionName(section)}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Actions */}
      <div className="flex-1" />
      
      {onViewGlobal && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewGlobal}
          className="h-7 text-xs"
        >
          View Global
        </Button>
      )}
      
      {onEditVariant && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEditVariant}
          className="h-7 text-xs"
        >
          Edit Variant
        </Button>
      )}
    </div>
  );
};

// Helper to format section names for display
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

// Helper to get country flag emoji
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default RegionalVariantIndicator;
