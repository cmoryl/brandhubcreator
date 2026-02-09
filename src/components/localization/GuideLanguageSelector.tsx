/**
 * GuideLanguageSelector - Header language selector for guides
 * Globe icon dropdown for quick language switching and translation status
 */

import React, { useState } from 'react';
import { Globe2, Check, Languages, Loader2, Sparkles, ChevronDown } from 'lucide-react';
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
import { useLocalization } from '@/hooks/useLocalization';
import { useOrganization } from '@/contexts/OrganizationContext';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES } from '@/types/localization';

interface GuideLanguageSelectorProps {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  currentLanguage?: string;
  onLanguageChange?: (languageCode: string) => void;
  onOpenLocalizationPanel?: () => void;
  className?: string;
  variant?: 'icon' | 'full';
}

export const GuideLanguageSelector: React.FC<GuideLanguageSelectorProps> = ({
  entityType,
  entityId,
  entityName,
  currentLanguage = 'en_US',
  onLanguageChange,
  onOpenLocalizationPanel,
  className,
  variant = 'icon',
}) => {
  const { organization } = useOrganization();
  const { targetLanguages, config, isTranslating } = useLocalization(organization?.id);
  const [isOpen, setIsOpen] = useState(false);

  // Get active target languages
  const activeLanguages = targetLanguages.filter(lang => lang.is_active);
  
  // Get current language display name
  const currentLangName = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.name || 'English (US)';
  
  // Check if translations exist for each language
  const hasTranslations = activeLanguages.length > 0;

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange?.(languageCode);
    setIsOpen(false);
  };

  // Icon-only variant for header
  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'relative h-9 w-9',
                    hasTranslations && 'text-primary',
                    className
                  )}
                >
                  {isTranslating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe2 className="h-4 w-4" />
                  )}
                  {hasTranslations && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Language & Translations</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Available Languages
            </DropdownMenuLabel>
            
            {/* Source language */}
            <DropdownMenuItem
              onClick={() => handleLanguageSelect('en_US')}
              className="gap-2"
            >
              <span className="flex-1">English (US)</span>
              <Badge variant="outline" className="text-[10px]">Source</Badge>
              {currentLanguage === 'en_US' && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>

            {activeLanguages.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Translations
                </DropdownMenuLabel>
                {activeLanguages.map(lang => (
                  <DropdownMenuItem
                    key={lang.id}
                    onClick={() => handleLanguageSelect(lang.language_code)}
                    className="gap-2"
                  >
                    <span className="flex-1">{lang.language_name}</span>
                    {currentLanguage === lang.language_code && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {activeLanguages.length === 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-3 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    No translations configured yet
                  </p>
                </div>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setIsOpen(false);
                onOpenLocalizationPanel?.();
              }}
              className="gap-2 text-primary"
            >
              <Sparkles className="h-4 w-4" />
              <span>Open Localization Panel</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    );
  }

  // Full variant with label
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2 h-8', className)}
        >
          <Globe2 className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLangName}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>View Language</DropdownMenuLabel>
        
        <DropdownMenuItem
          onClick={() => handleLanguageSelect('en_US')}
          className="gap-2"
        >
          <span className="flex-1">English (US)</span>
          <Badge variant="outline" className="text-[10px]">Source</Badge>
          {currentLanguage === 'en_US' && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </DropdownMenuItem>

        {activeLanguages.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {activeLanguages.map(lang => (
              <DropdownMenuItem
                key={lang.id}
                onClick={() => handleLanguageSelect(lang.language_code)}
                className="gap-2"
              >
                <span className="flex-1">{lang.language_name}</span>
                {currentLanguage === lang.language_code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setIsOpen(false);
            onOpenLocalizationPanel?.();
          }}
          className="gap-2 text-primary"
        >
          <Sparkles className="h-4 w-4" />
          Manage Translations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GuideLanguageSelector;
