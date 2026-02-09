/**
 * RegionalAnalysisPanel - AI-powered cultural adaptation analysis for brand guides
 * Provides suggestions for localizing brand content across regions/countries
 */

import React, { useState, useMemo } from 'react';
import {
  Globe2,
  Sparkles,
  MapPin,
  Palette,
  Type,
  MessageSquare,
  Image,
  ChevronRight,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCulturalAdaptation, useRegionalBranding, useEntityVariants } from '@/hooks/useRegionalBranding';
import { STANDARD_REGIONS, COMMON_COUNTRIES, LOCALIZABLE_SECTIONS } from '@/types/regionalBranding';
import type { AdaptationSuggestion, LocalizableSection } from '@/types/regionalBranding';

interface RegionalAnalysisPanelProps {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  organizationId: string;
  guideData: Record<string, unknown>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApplySuggestion?: (section: LocalizableSection, suggestion: AdaptationSuggestion) => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  colors: <Palette className="h-4 w-4" />,
  typography: <Type className="h-4 w-4" />,
  messaging: <MessageSquare className="h-4 w-4" />,
  imagery: <Image className="h-4 w-4" />,
  hero: <Eye className="h-4 w-4" />,
  identity: <Globe2 className="h-4 w-4" />,
  voice: <MessageSquare className="h-4 w-4" />,
  logos: <Image className="h-4 w-4" />,
  patterns: <Palette className="h-4 w-4" />,
  gradients: <Palette className="h-4 w-4" />,
};

const PRIORITY_COLORS = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  low: 'bg-primary/10 text-primary border-primary/30',
};

export const RegionalAnalysisPanel: React.FC<RegionalAnalysisPanelProps> = ({
  entityType,
  entityId,
  organizationId,
  guideData,
  isOpen,
  onOpenChange,
  onApplySuggestion,
}) => {
  const { regions, countries, isLoading: regionsLoading } = useRegionalBranding(organizationId);
  const { variants, upsertVariant } = useEntityVariants(entityType, entityId, organizationId);
  const { isAdapting, getCulturalSuggestions } = useCulturalAdaptation(organizationId);

  const [targetRegion, setTargetRegion] = useState<string>('');
  const [targetCountry, setTargetCountry] = useState<string>('');
  const [selectedSections, setSelectedSections] = useState<string[]>(['colors', 'messaging', 'imagery']);
  const [suggestions, setSuggestions] = useState<AdaptationSuggestion[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyze' | 'variants'>('analyze');

  // Get available regions and countries
  const availableRegions = useMemo(() => {
    if (regions.length > 0) {
      return regions.map(r => ({ code: r.code, name: r.name }));
    }
    return STANDARD_REGIONS;
  }, [regions]);

  const availableCountries = useMemo(() => {
    if (countries.length > 0) {
      if (targetRegion) {
        return countries
          .filter(c => c.region_code === targetRegion)
          .map(c => ({ code: c.country_code, name: c.country_name }));
      }
      return countries.map(c => ({ code: c.country_code, name: c.country_name }));
    }
    if (targetRegion) {
      return COMMON_COUNTRIES.filter(c => c.region === targetRegion);
    }
    return COMMON_COUNTRIES;
  }, [countries, targetRegion]);

  const handleAnalyze = async () => {
    if (!targetRegion && !targetCountry) {
      toast.error('Please select a target region or country');
      return;
    }

    const result = await getCulturalSuggestions(
      entityType,
      entityId,
      guideData,
      targetCountry || undefined,
      targetRegion || undefined,
      selectedSections.length > 0 ? selectedSections : undefined
    );

    if (result.success) {
      setSuggestions(result.suggestions);
      setAnalysisComplete(true);
      toast.success(`Found ${result.suggestions.length} cultural adaptation suggestions`);
    } else {
      toast.error(result.error || 'Analysis failed');
    }
  };

  const handleApplySuggestion = async (suggestion: AdaptationSuggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion.section, suggestion);
    }

    // Create or update the regional variant
    try {
      await upsertVariant.mutateAsync({
        variant_level: targetCountry ? 'country' : 'region',
        variant_code: targetCountry || targetRegion,
        overrides: {
          [`${suggestion.section}_override` as const]: suggestion.suggested_value as Record<string, unknown>,
        },
      });
      toast.success(`Applied ${suggestion.section} adaptation for ${targetCountry || targetRegion}`);
    } catch (error) {
      toast.error('Failed to save regional variant');
    }
  };

  const handleCopySuggestion = (suggestion: AdaptationSuggestion) => {
    navigator.clipboard.writeText(JSON.stringify(suggestion.suggested_value, null, 2));
    toast.success('Suggestion copied to clipboard');
  };

  const toggleSection = (section: string) => {
    setSelectedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const groupedSuggestions = useMemo(() => {
    const grouped: Record<string, AdaptationSuggestion[]> = {};
    suggestions.forEach(s => {
      if (!grouped[s.section]) grouped[s.section] = [];
      grouped[s.section].push(s);
    });
    return grouped;
  }, [suggestions]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" />
            Regional Analysis
          </SheetTitle>
          <SheetDescription>
            AI-powered cultural adaptation analysis for global brand consistency
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'analyze' | 'variants')} className="flex-1 flex flex-col overflow-hidden mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="variants" className="gap-2">
              <MapPin className="h-4 w-4" />
              Variants ({variants.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="analyze" className="m-0 space-y-4">
              {/* Target Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Target Market</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Region</label>
                      <Select value={targetRegion} onValueChange={(v) => {
                        setTargetRegion(v);
                        setTargetCountry('');
                        setAnalysisComplete(false);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRegions.map(r => (
                            <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Country</label>
                      <Select value={targetCountry} onValueChange={(v) => {
                        setTargetCountry(v);
                        setAnalysisComplete(false);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCountries.map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Sections to Analyze</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {LOCALIZABLE_SECTIONS.map(section => (
                      <Badge
                        key={section}
                        variant={selectedSections.includes(section) ? 'default' : 'outline'}
                        className="cursor-pointer gap-1.5 capitalize"
                        onClick={() => toggleSection(section)}
                      >
                        {SECTION_ICONS[section] || <Globe2 className="h-3 w-3" />}
                        {section.replace('_', ' ')}
                        {selectedSections.includes(section) && (
                          <Check className="h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={isAdapting || (!targetRegion && !targetCountry)}
                className="w-full gap-2"
              >
                {isAdapting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Cultural Context...
                  </>
                ) : analysisComplete ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Re-analyze
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze for {targetCountry || targetRegion || 'Target Market'}
                  </>
                )}
              </Button>

              {/* Results */}
              <AnimatePresence>
                {analysisComplete && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {suggestions.length} Adaptation Suggestions
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {targetCountry || targetRegion}
                      </Badge>
                    </div>

                    <Accordion type="multiple" className="space-y-2">
                      {Object.entries(groupedSuggestions).map(([section, sectionSuggestions]) => (
                        <AccordionItem
                          key={section}
                          value={section}
                          className="border rounded-lg px-3"
                        >
                          <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex items-center gap-2">
                              {SECTION_ICONS[section] || <Globe2 className="h-4 w-4" />}
                              <span className="capitalize font-medium">
                                {section.replace('_', ' ')}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {sectionSuggestions.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3 pb-3">
                            {sectionSuggestions.map((suggestion, idx) => (
                              <Card
                                key={idx}
                                className={cn(
                                  'border',
                                  PRIORITY_COLORS[suggestion.priority]
                                )}
                              >
                                <CardContent className="p-3 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      {suggestion.priority === 'high' && (
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                      )}
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {suggestion.priority} priority
                                      </Badge>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() => handleCopySuggestion(suggestion)}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  <p className="text-sm">{suggestion.reason}</p>

                                  {suggestion.cultural_context && (
                                    <p className="text-xs text-muted-foreground italic">
                                      {suggestion.cultural_context}
                                    </p>
                                  )}

                                  <Separator />

                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Confidence: {Math.round(suggestion.confidence * 100)}%
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-7 gap-1"
                                      onClick={() => handleApplySuggestion(suggestion)}
                                      disabled={upsertVariant.isPending}
                                    >
                                      {upsertVariant.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <>
                                          Apply
                                          <ArrowRight className="h-3 w-3" />
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </motion.div>
                )}

                {analysisComplete && suggestions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Check className="h-12 w-12 text-primary mx-auto mb-3" />
                    <p className="font-medium">No adaptations needed!</p>
                    <p className="text-sm text-muted-foreground">
                      Your brand guide is already well-suited for {targetCountry || targetRegion}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="variants" className="m-0 space-y-3">
              {variants.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No regional variants created yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run an analysis to create localized versions
                  </p>
                </div>
              ) : (
                variants.map(variant => (
                  <Card key={variant.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {variant.variant_level}
                          </Badge>
                          <span className="font-medium">{variant.variant_code}</span>
                        </div>
                        <Badge
                          variant={
                            variant.translation_status === 'published'
                              ? 'default'
                              : variant.translation_status === 'approved' || variant.translation_status === 'review'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs capitalize"
                        >
                          {variant.translation_status}
                        </Badge>
                      </div>

                      {/* Show which sections have overrides */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {LOCALIZABLE_SECTIONS.filter(section =>
                          variant[`${section}_override` as keyof typeof variant]
                        ).map(section => (
                          <Badge key={section} variant="secondary" className="text-xs gap-1 capitalize">
                            {SECTION_ICONS[section] || <Globe2 className="h-3 w-3" />}
                            {section.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>

                      {variant.adaptation_notes && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {variant.adaptation_notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default RegionalAnalysisPanel;
