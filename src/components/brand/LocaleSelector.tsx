/**
 * LocaleSelector - User-facing locale picker for viewing regional brand variants
 * Shows preferred region/country with option to compare differences
 */

import React, { useState } from 'react';
import { Globe2, MapPin, ChevronDown, Eye, Shuffle, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocalePreference } from '@/hooks/useRegionalBranding';
import { STANDARD_REGIONS, COMMON_COUNTRIES } from '@/types/regionalBranding';

interface LocaleSelectorProps {
  availableRegions?: string[];
  availableCountries?: string[];
  onLocaleChange?: (locale: { region?: string; country?: string }) => void;
  showComparisonToggle?: boolean;
  className?: string;
}

export const LocaleSelector: React.FC<LocaleSelectorProps> = ({
  availableRegions = [],
  availableCountries = [],
  onLocaleChange,
  showComparisonToggle = true,
  className,
}) => {
  const { preference, updatePreference } = useLocalePreference();
  const [isOpen, setIsOpen] = useState(false);

  const currentRegion = preference?.preferred_region || 'global';
  const currentCountry = preference?.preferred_country;
  const showComparison = preference?.show_regional_comparison || false;

  const regionName = STANDARD_REGIONS.find(r => r.code === currentRegion)?.name || 'Global';
  const countryName = currentCountry
    ? COMMON_COUNTRIES.find(c => c.code === currentCountry)?.name
    : null;

  const handleRegionSelect = (regionCode: string) => {
    updatePreference.mutate({
      preferred_region: regionCode,
      preferred_country: null, // Reset country when region changes
    });
    onLocaleChange?.({ region: regionCode, country: undefined });
  };

  const handleCountrySelect = (countryCode: string) => {
    const country = COMMON_COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      updatePreference.mutate({
        preferred_region: country.region,
        preferred_country: countryCode,
      });
      onLocaleChange?.({ region: country.region, country: countryCode });
    }
  };

  const handleComparisonToggle = () => {
    updatePreference.mutate({
      show_regional_comparison: !showComparison,
    });
  };

  // Group countries by region
  const countriesByRegion = COMMON_COUNTRIES.reduce((acc, country) => {
    if (!acc[country.region]) acc[country.region] = [];
    // Filter to only available countries if specified
    if (availableCountries.length === 0 || availableCountries.includes(country.code)) {
      acc[country.region].push(country);
    }
    return acc;
  }, {} as Record<string, typeof COMMON_COUNTRIES[number][]>);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 h-9 border-dashed',
            showComparison && 'border-primary/50 bg-primary/5',
            className
          )}
        >
          <Globe2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {countryName || regionName}
          </span>
          {showComparison && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              Compare
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* Quick region selection */}
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Quick Select Region
        </div>
        {STANDARD_REGIONS.filter(r => 
          availableRegions.length === 0 || availableRegions.includes(r.code)
        ).map(region => (
          <DropdownMenuItem
            key={region.code}
            onClick={() => handleRegionSelect(region.code)}
            className="gap-2"
          >
            <Globe2 className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{region.name}</span>
            {currentRegion === region.code && !currentCountry && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Country by region submenus */}
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Select Country
        </div>
        
        {Object.entries(countriesByRegion).map(([regionCode, regionCountries]) => {
          if (regionCountries.length === 0) return null;
          const region = STANDARD_REGIONS.find(r => r.code === regionCode);
          
          return (
            <DropdownMenuSub key={regionCode}>
              <DropdownMenuSubTrigger className="gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{region?.name || regionCode}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {regionCountries.map(country => (
                  <DropdownMenuItem
                    key={country.code}
                    onClick={() => handleCountrySelect(country.code)}
                    className="gap-2"
                  >
                    <span className="text-base">{getCountryFlag(country.code)}</span>
                    <span className="flex-1">{country.name}</span>
                    {currentCountry === country.code && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}

        {showComparisonToggle && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showComparison}
              onCheckedChange={handleComparisonToggle}
              className="gap-2"
            >
              <Shuffle className="h-4 w-4" />
              <span>Show Regional Differences</span>
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Helper to get country flag emoji
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default LocaleSelector;
