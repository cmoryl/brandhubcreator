/**
 * GlobalBrandToolbar - Toolbar for regional branding features
 * Shows locale selector and regional analysis trigger
 */

import React, { useState, useMemo } from 'react';
import { Globe2, Languages, Sparkles, MapPin, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useRegionalBranding, useEntityVariants, useLocalePreference } from '@/hooks/useRegionalBranding';
import { STANDARD_REGIONS, COMMON_COUNTRIES } from '@/types/regionalBranding';

interface GlobalBrandToolbarProps {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  organizationId?: string;
  onOpenAnalysis?: () => void;
  onLocaleChange?: (locale: { region?: string; country?: string }) => void;
  className?: string;
}

export const GlobalBrandToolbar: React.FC<GlobalBrandToolbarProps> = ({
  entityType,
  entityId,
  organizationId,
  onOpenAnalysis,
  onLocaleChange,
  className,
}) => {
  const { regions, countries } = useRegionalBranding(organizationId);
  const { variants } = useEntityVariants(entityType, entityId, organizationId);
  const { preference, updatePreference } = useLocalePreference();

  const [selectedLocale, setSelectedLocale] = useState<{
    type: 'global' | 'region' | 'country';
    code: string;
    name: string;
  }>({ type: 'global', code: 'global', name: 'Global' });

  // Get available regions and countries
  const availableRegions = useMemo(() => {
    if (regions.length > 0) {
      return regions.map(r => ({ code: r.code, name: r.name }));
    }
    return STANDARD_REGIONS;
  }, [regions]);

  const availableCountries = useMemo(() => {
    if (countries.length > 0) {
      return countries.map(c => ({ code: c.country_code, name: c.country_name, region: c.region_code }));
    }
    return COMMON_COUNTRIES;
  }, [countries]);

  // Get regions that have variants
  const regionsWithVariants = useMemo(() => {
    return new Set(variants.filter(v => v.variant_level === 'region').map(v => v.variant_code));
  }, [variants]);

  // Get countries that have variants
  const countriesWithVariants = useMemo(() => {
    return new Set(variants.filter(v => v.variant_level === 'country').map(v => v.variant_code));
  }, [variants]);

  const hasVariants = variants.length > 0;

  const handleLocaleSelect = async (type: 'global' | 'region' | 'country', code: string, name: string) => {
    setSelectedLocale({ type, code, name });
    
    // Update preference
    try {
      await updatePreference.mutateAsync({
        preferred_region: type === 'region' ? code : type === 'country' ? undefined : null,
        preferred_country: type === 'country' ? code : null,
      });
    } catch {
      // Silent fail - preference is just for convenience
    }

    // Notify parent
    if (onLocaleChange) {
      onLocaleChange({
        region: type === 'region' ? code : undefined,
        country: type === 'country' ? code : undefined,
      });
    }
  };

  if (!organizationId) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        {/* Locale Selector */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-8"
                >
                  <Globe2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{selectedLocale.name}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>View regional variant</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              View as Region/Country
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => handleLocaleSelect('global', 'global', 'Global')}
              className="gap-2"
            >
              <Globe2 className="h-4 w-4" />
              Global (Master)
              {selectedLocale.code === 'global' && (
                <Check className="h-4 w-4 ml-auto" />
              )}
            </DropdownMenuItem>

            {hasVariants && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Regions
                </DropdownMenuLabel>
                {availableRegions.map(region => (
                  <DropdownMenuItem
                    key={region.code}
                    onClick={() => handleLocaleSelect('region', region.code, region.name)}
                    className="gap-2"
                  >
                    {region.name}
                    {regionsWithVariants.has(region.code) && (
                      <Badge variant="secondary" className="text-[10px] ml-auto h-4 px-1">
                        variant
                      </Badge>
                    )}
                    {selectedLocale.code === region.code && (
                      <Check className="h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  <Languages className="h-3 w-3" />
                  Countries
                </DropdownMenuLabel>
                {availableCountries.slice(0, 10).map(country => (
                  <DropdownMenuItem
                    key={country.code}
                    onClick={() => handleLocaleSelect('country', country.code, country.name)}
                    className="gap-2"
                  >
                    {country.name}
                    {countriesWithVariants.has(country.code) && (
                      <Badge variant="secondary" className="text-[10px] ml-auto h-4 px-1">
                        variant
                      </Badge>
                    )}
                    {selectedLocale.code === country.code && (
                      <Check className="h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Regional Analysis Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAnalysis}
              className="gap-2 h-8"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Regional Analysis</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI-powered cultural adaptation analysis</p>
          </TooltipContent>
        </Tooltip>

        {/* Variant Count Badge */}
        {hasVariants && (
          <Badge variant="secondary" className="h-6 gap-1">
            <MapPin className="h-3 w-3" />
            {variants.length} variant{variants.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
};

export default GlobalBrandToolbar;
