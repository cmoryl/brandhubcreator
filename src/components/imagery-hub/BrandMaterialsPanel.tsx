/**
 * BrandMaterialsPanel - Shows existing brand materials with AI-generated imagery guidance
 * Admins can toggle materials on/off to refine what the AI considers
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  FileImage, FileText, Presentation, Palette, Eye, EyeOff,
  Loader2, Sparkles, RefreshCw, ChevronDown, ChevronUp,
  Image as ImageIcon, X, Search, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BrandMaterial {
  id: string;
  type: string;
  title: string;
  source: string;
  url?: string;
  thumbnailUrl?: string;
  description?: string;
}

interface ImageryGuidance {
  visualStyle: string[];
  recommendedSearchTerms: string[];
  colorGuidance: string;
  moodAndTone: string[];
  avoidances: string[];
  overallSummary: string;
}

interface BrandMaterialsPanelProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  categoryName?: string;
  onSearchTermClick?: (term: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const TYPE_ICONS: Record<string, typeof FileImage> = {
  logo: Palette,
  image: ImageIcon,
  approved_image: ImageIcon,
  pattern: Palette,
  hero: ImageIcon,
  image_asset: ImageIcon,
  pdf: FileText,
  brochure: FileText,
  presentation: Presentation,
  template: FileText,
  case_study: FileText,
};

const TYPE_LABELS: Record<string, string> = {
  logo: 'Logo',
  image: 'Image',
  approved_image: 'Approved',
  pattern: 'Pattern',
  hero: 'Hero',
  image_asset: 'Asset',
  pdf: 'PDF',
  brochure: 'Brochure',
  presentation: 'Presentation',
  template: 'Template',
  case_study: 'Case Study',
};

export const BrandMaterialsPanel = ({
  entityId, entityType, categoryName, onSearchTermClick, isOpen, onToggle,
}: BrandMaterialsPanelProps) => {
  const [materials, setMaterials] = useState<BrandMaterial[]>([]);
  const [guidance, setGuidance] = useState<ImageryGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [showGuidance, setShowGuidance] = useState(true);

  // Load exclusions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`brand-materials-excluded-${entityId}`);
      if (stored) setExcludedIds(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, [entityId]);

  const saveExclusions = useCallback((ids: Set<string>) => {
    setExcludedIds(ids);
    try {
      localStorage.setItem(`brand-materials-excluded-${entityId}`, JSON.stringify(Array.from(ids)));
    } catch { /* ignore */ }
  }, [entityId]);

  const fetchMaterials = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-brand-materials', {
        body: { entityId, entityType, categoryName },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      // Drop materials the user previously excluded so they stop appearing
      // on refresh — the excluded IDs stay persisted so the AI keeps learning
      // what's not liked going forward.
      const incoming: BrandMaterial[] = data?.materials || [];
      const filtered = incoming.filter(m => !excludedIds.has(m.id));
      const removed = incoming.length - filtered.length;
      setMaterials(filtered);
      setGuidance(data?.guidance || null);
      if (removed > 0) {
        toast.success(`Refreshed — hid ${removed} previously rejected item${removed === 1 ? '' : 's'}`);
      }
    } catch (err) {
      console.error('Failed to fetch brand materials:', err);
      toast.error('Failed to load brand materials');
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, categoryName, excludedIds]);

  useEffect(() => {
    if (isOpen && materials.length === 0 && !isLoading) {
      fetchMaterials();
    }
  }, [isOpen, fetchMaterials, materials.length, isLoading]);

  const toggleMaterial = useCallback((materialId: string) => {
    const next = new Set(excludedIds);
    if (next.has(materialId)) {
      next.delete(materialId);
    } else {
      next.add(materialId);
    }
    saveExclusions(next);
  }, [excludedIds, saveExclusions]);

  const activeMaterials = useMemo(
    () => materials.filter(m => !excludedIds.has(m.id)),
    [materials, excludedIds]
  );

  // Group materials by source
  const groupedMaterials = useMemo(() => {
    const groups = new Map<string, BrandMaterial[]>();
    materials.forEach(m => {
      const list = groups.get(m.source) || [];
      list.push(m);
      groups.set(m.source, list);
    });
    return groups;
  }, [materials]);

  const visualMaterials = materials.filter(m =>
    ['image', 'logo', 'pattern', 'approved_image', 'hero', 'image_asset'].includes(m.type)
  );

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 w-full justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Brand Materials</span>
            {materials.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeMaterials.length}/{materials.length}
              </Badge>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="mt-2 border-border/50">
          <CardContent className="p-3 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Analyzing brand materials...</span>
              </div>
            ) : (
              <>
                {/* AI Guidance Summary */}
                {guidance && (
                  <Collapsible open={showGuidance} onOpenChange={setShowGuidance}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer p-2 rounded-md bg-primary/5 hover:bg-primary/10 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-foreground">AI Imagery Guidance</span>
                        </div>
                        {showGuidance ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-2.5 text-xs">
                        {/* Summary */}
                        <p className="text-muted-foreground leading-relaxed">{guidance.overallSummary}</p>

                        {/* Visual Style */}
                        <div>
                          <p className="font-medium text-foreground mb-1">Visual Style</p>
                          <div className="flex flex-wrap gap-1">
                            {guidance.visualStyle.map((style, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">{style}</Badge>
                            ))}
                          </div>
                        </div>

                        {/* Mood & Tone */}
                        <div>
                          <p className="font-medium text-foreground mb-1">Mood & Tone</p>
                          <div className="flex flex-wrap gap-1">
                            {guidance.moodAndTone.map((mood, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{mood}</Badge>
                            ))}
                          </div>
                        </div>

                        {/* Color Guidance */}
                        <div>
                          <p className="font-medium text-foreground mb-1">Color Guidance</p>
                          <p className="text-muted-foreground">{guidance.colorGuidance}</p>
                        </div>

                        {/* Recommended Searches */}
                        <div>
                          <p className="font-medium text-foreground mb-1">Recommended Searches</p>
                          <div className="flex flex-wrap gap-1">
                            {guidance.recommendedSearchTerms.map((term, i) => (
                              <Badge
                                key={i}
                                variant="default"
                                className="text-[10px] cursor-pointer hover:opacity-80"
                                onClick={() => onSearchTermClick?.(term)}
                              >
                                <Search className="h-2.5 w-2.5 mr-0.5" />
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Avoidances */}
                        {guidance.avoidances.length > 0 && (
                          <div>
                            <p className="font-medium text-foreground mb-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-destructive" /> Avoid
                            </p>
                            <ul className="space-y-0.5">
                              {guidance.avoidances.map((avoid, i) => (
                                <li key={i} className="text-muted-foreground flex items-start gap-1">
                                  <X className="h-2.5 w-2.5 mt-0.5 text-destructive shrink-0" />
                                  {avoid}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Visual Preview Thumbnails */}
                {visualMaterials.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1.5">Visual References</p>
                    <div className="grid grid-cols-4 gap-1">
                      {visualMaterials.slice(0, 8).map(m => (
                        <div
                          key={m.id}
                          className={cn(
                            'relative aspect-square rounded overflow-hidden border cursor-pointer transition-all',
                            excludedIds.has(m.id)
                              ? 'opacity-30 border-muted grayscale'
                              : 'border-border hover:ring-1 hover:ring-primary'
                          )}
                          onClick={() => toggleMaterial(m.id)}
                          title={`${m.title} — Click to ${excludedIds.has(m.id) ? 'include' : 'exclude'}`}
                        >
                          <img
                            src={m.thumbnailUrl || m.url}
                            alt={m.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-0.5 right-0.5">
                            {excludedIds.has(m.id) ? (
                              <EyeOff className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Eye className="h-3 w-3 text-primary drop-shadow-sm" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Materials List by Source */}
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {Array.from(groupedMaterials.entries()).map(([source, items]) => (
                      <div key={source}>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{source}</p>
                        <div className="space-y-0.5">
                          {items.map(m => {
                            const Icon = TYPE_ICONS[m.type] || FileText;
                            const isExcluded = excludedIds.has(m.id);
                            return (
                              <div
                                key={m.id}
                                className={cn(
                                  'flex items-center gap-2 p-1.5 rounded-md text-xs cursor-pointer transition-colors',
                                  isExcluded
                                    ? 'opacity-40 bg-muted/30'
                                    : 'hover:bg-muted/50'
                                )}
                                onClick={() => toggleMaterial(m.id)}
                              >
                                <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <span className={cn('flex-1 truncate', isExcluded && 'line-through')}>
                                  {m.title}
                                </span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 shrink-0">
                                  {TYPE_LABELS[m.type] || m.type}
                                </Badge>
                                {isExcluded ? (
                                  <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />
                                ) : (
                                  <Eye className="h-3 w-3 text-primary shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground">
                    {activeMaterials.length} of {materials.length} materials active
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1"
                    onClick={fetchMaterials}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
                    Refresh
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};
