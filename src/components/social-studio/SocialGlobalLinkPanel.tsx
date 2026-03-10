/**
 * GlobalLink Cultural Adaptation Panel for Social Asset Placements
 * Provides region-specific guidance for social media assets
 */
import { useState, useCallback } from 'react';
import { Globe, ChevronDown, ChevronUp, Loader2, MapPin, AlertTriangle, CheckCircle2, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrandContext {
  name?: string;
  colors?: Array<{ name: string; hex: string; role?: string }>;
  typography?: Array<{ family: string; weight?: string; usage?: string }>;
  archetype?: string;
  industry?: string;
  mission?: string;
  values?: string[];
  logos?: Array<{ url?: string; name?: string }>;
}

interface AdaptationInsight {
  category: string;
  finding: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface AdaptationResult {
  region: string;
  insights: AdaptationInsight[];
  captionSuggestions?: string[];
  colorGuidance?: string[];
  imageryNotes?: string[];
}

interface SocialGlobalLinkPanelProps {
  organizationId: string;
  entityId: string;
  entityType: string;
  platform: string;
  format: string;
  imageUrl?: string;
  brandContext?: BrandContext;
  hasImage: boolean;
}

const REGIONS = [
  { value: 'americas', label: 'Americas', icon: '🌎' },
  { value: 'europe', label: 'Europe', icon: '🇪🇺' },
  { value: 'asia-pacific', label: 'Asia-Pacific', icon: '🌏' },
  { value: 'middle-east-africa', label: 'Middle East & Africa', icon: '🌍' },
  { value: 'latin-america', label: 'Latin America', icon: '🌎' },
];

export const SocialGlobalLinkPanel = ({
  organizationId,
  entityId,
  entityType,
  platform,
  format,
  imageUrl,
  brandContext,
  hasImage,
}: SocialGlobalLinkPanelProps) => {
  const [open, setOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdaptationResult | null>(null);

  const runAdaptation = useCallback(async () => {
    if (!selectedRegion || !organizationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('globallink-cultural-adapt', {
        body: {
          organization_id: organizationId,
          entity_type: entityType,
          entity_id: entityId,
          target_region: selectedRegion,
          sections: ['social_assets'],
          social_context: {
            platform,
            format,
            image_url: imageUrl,
            brand_name: brandContext?.name,
            brand_colors: brandContext?.colors?.map(c => c.hex),
            brand_archetype: brandContext?.archetype,
            brand_industry: brandContext?.industry,
          },
        },
      });

      if (error) throw error;

      // Parse suggestions into our format
      const suggestions = data?.suggestions || [];
      const insights: AdaptationInsight[] = suggestions.map((s: any) => ({
        category: s.section || s.category || 'General',
        finding: s.suggestion || s.finding || s.description || '',
        severity: s.priority === 'high' ? 'high' : s.priority === 'low' ? 'low' : 'medium',
        recommendation: s.rationale || s.recommendation || '',
      }));

      // Extract caption-like suggestions
      const captionSuggestions = suggestions
        .filter((s: any) => s.section === 'messaging' || s.category === 'caption')
        .map((s: any) => s.suggestion || s.description)
        .filter(Boolean);

      const colorGuidance = suggestions
        .filter((s: any) => s.section === 'colors' || s.category === 'color')
        .map((s: any) => s.suggestion || s.description)
        .filter(Boolean);

      const imageryNotes = suggestions
        .filter((s: any) => s.section === 'imagery' || s.category === 'imagery')
        .map((s: any) => s.suggestion || s.description)
        .filter(Boolean);

      setResult({
        region: selectedRegion,
        insights,
        captionSuggestions: captionSuggestions.length > 0 ? captionSuggestions : undefined,
        colorGuidance: colorGuidance.length > 0 ? colorGuidance : undefined,
        imageryNotes: imageryNotes.length > 0 ? imageryNotes : undefined,
      });

      toast.success('Cultural adaptation insights generated');
    } catch (err) {
      console.error('GlobalLink adaptation error:', err);
      toast.error('Failed to generate cultural insights');
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, organizationId, entityId, entityType, platform, format, imageUrl, brandContext]);

  if (!hasImage) return null;

  const regionLabel = REGIONS.find(r => r.value === result?.region)?.label;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="px-3 py-2.5 border-t border-border/50 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">GlobalLink</span>
              {result && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  {regionLabel || result.region}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-3">
          {/* Region selector */}
          <div className="flex items-center gap-2">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Select target region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map(r => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">
                    <span className="mr-1.5">{r.icon}</span> {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={!selectedRegion || loading}
              onClick={(e) => { e.stopPropagation(); runAdaptation(); }}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
              Localize
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {/* Imagery notes */}
              {result.imageryNotes && result.imageryNotes.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" /> Imagery Guidance
                  </span>
                  {result.imageryNotes.map((note, i) => (
                    <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-amber-500/30">{note}</p>
                  ))}
                </div>
              )}

              {/* Color guidance */}
              {result.colorGuidance && result.colorGuidance.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium">Color Considerations</span>
                  {result.colorGuidance.map((note, i) => (
                    <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">{note}</p>
                  ))}
                </div>
              )}

              {/* Caption suggestions */}
              {result.captionSuggestions && result.captionSuggestions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <Languages className="h-3 w-3" /> Caption Suggestions
                  </span>
                  {result.captionSuggestions.map((caption, i) => (
                    <div key={i} className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5 border border-border/50">
                      {caption}
                    </div>
                  ))}
                </div>
              )}

              {/* General insights */}
              {result.insights.filter(i => !['messaging', 'colors', 'imagery', 'caption', 'color'].includes(i.category)).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium">Cultural Insights</span>
                  {result.insights
                    .filter(i => !['messaging', 'colors', 'imagery', 'caption', 'color'].includes(i.category))
                    .map((insight, i) => {
                      const Icon = insight.severity === 'high' ? AlertTriangle : CheckCircle2;
                      const color = insight.severity === 'high' ? 'text-destructive' : insight.severity === 'medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
                      return (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <Icon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', color)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{insight.finding}</p>
                            {insight.recommendation && (
                              <p className="text-muted-foreground mt-0.5">{insight.recommendation}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {!result && !loading && (
            <p className="text-xs text-muted-foreground italic">Select a region and click Localize to get cultural adaptation insights for this asset.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
