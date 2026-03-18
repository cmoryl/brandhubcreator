import { useState, useCallback, useEffect } from 'react';
import { Search, Loader2, Check, ImageIcon, Sparkles, ArrowRight, Info, Hash, Camera, PenTool, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { ApprovedImage } from '@/types/brand';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShutterstockSearchResult {
  id: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  previewUrl: string;
  width: number;
  height: number;
  categories: string[];
  media_type?: string;
}

interface AISuggestion {
  query: string;
  category?: string;
  rationale: string;
}

interface ShutterstockSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproveImages: (images: ApprovedImage[]) => void;
  targetSectionName: string;
  entityId?: string;
  entityType?: string;
}

const IMAGE_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types', icon: Layers },
  { value: 'photo', label: 'Photos', icon: Camera },
  { value: 'vector', label: 'Vectors', icon: PenTool },
  { value: 'illustration', label: 'Illustrations', icon: ImageIcon },
];

export const ShutterstockSearchDialog = ({
  open,
  onOpenChange,
  onApproveImages,
  targetSectionName,
  entityId,
  entityType = 'brand',
}: ShutterstockSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [orientation, setOrientation] = useState<string>('any');
  const [imageType, setImageType] = useState<string>('all');
  const [results, setResults] = useState<ShutterstockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // AI suggestions state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [brandProfile, setBrandProfile] = useState('');
  const [moodKeywords, setMoodKeywords] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [enhancedQueries, setEnhancedQueries] = useState<string[]>([]);
  const [styleNotes, setStyleNotes] = useState('');
  const [aiReasoning, setAiReasoning] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Fetch AI suggestions when dialog opens
  useEffect(() => {
    if (open && entityId && suggestions.length === 0 && !loadingSuggestions) {
      fetchSuggestions();
    }
    if (!open) {
      setSuggestions([]);
      setBrandProfile('');
      setMoodKeywords([]);
      setEnhancedQueries([]);
      setStyleNotes('');
      setAiReasoning('');
      setShowSuggestions(true);
    }
  }, [open, entityId]);

  const fetchSuggestions = useCallback(async () => {
    if (!entityId) return;
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('shutterstock-ai-suggest', {
        body: {
          entityId,
          entityType,
          categoryName: targetSectionName,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        setBrandProfile(data.brandImageryProfile || '');
        setMoodKeywords(data.moodKeywords || []);
      }
    } catch (err: any) {
      console.error('AI suggestion error:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [entityId, entityType, targetSectionName]);

  const fetchEnhancedQueries = useCallback(async (userQuery: string) => {
    if (!entityId || !userQuery.trim()) return;
    try {
      const { data, error } = await supabase.functions.invoke('shutterstock-ai-suggest', {
        body: {
          entityId,
          entityType,
          userQuery: userQuery.trim(),
          categoryName: targetSectionName,
        },
      });

      if (error) throw error;
      if (data?.enhancedQueries) {
        setEnhancedQueries(data.enhancedQueries);
        setStyleNotes(data.styleNotes || '');
        setAiReasoning(data.reasoning || '');
      }
    } catch (err: any) {
      console.error('AI enhance error:', err);
    }
  }, [entityId, entityType, targetSectionName]);

  // Detect if the query is a Shutterstock image ID (numeric string)
  const isImageIdQuery = useCallback((q: string) => {
    return /^\d{5,15}$/.test(q.trim());
  }, []);

  const handleSearch = useCallback(async (searchQuery?: string, searchPage = 1) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    try {
      // Check if it's an image ID lookup
      if (isImageIdQuery(q)) {
        const { data, error } = await supabase.functions.invoke('shutterstock-search', {
          body: {
            action: 'get_by_id',
            imageId: q.trim(),
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setResults(data.results || []);
        setTotalCount(data.totalCount || 0);
        setPage(1);
      } else {
        const { data, error } = await supabase.functions.invoke('shutterstock-search', {
          body: {
            query: q.trim(),
            orientation: orientation === 'any' ? undefined : orientation,
            image_type: imageType === 'all' ? undefined : imageType,
            page: searchPage,
            per_page: 20,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        if (searchPage === 1) {
          setResults(data.results || []);
          if (entityId) fetchEnhancedQueries(q.trim());
        } else {
          setResults(prev => [...prev, ...(data.results || [])]);
        }
        setTotalCount(data.totalCount || 0);
        setPage(searchPage);
      }
    } catch (err: any) {
      console.error('Shutterstock search error:', err);
      toast.error(err.message || 'Failed to search images');
    } finally {
      setLoading(false);
    }
  }, [query, orientation, imageType, entityId, fetchEnhancedQueries, isImageIdQuery]);

  const handleSuggestionClick = useCallback((suggestionQuery: string) => {
    setQuery(suggestionQuery);
    handleSearch(suggestionQuery, 1);
  }, [handleSearch]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleApprove = useCallback(() => {
    const approved: ApprovedImage[] = results
      .filter(r => selectedIds.has(r.id))
      .map(r => ({
        id: r.id,
        url: r.previewUrl || r.url,
        thumbnailUrl: r.thumbnailUrl,
        title: r.description?.slice(0, 100) || 'Untitled',
        source: 'shutterstock',
        category: r.categories?.[0] || '',
        approvedAt: new Date().toISOString(),
      }));

    onApproveImages(approved);
    setSelectedIds(new Set());
    toast.success(`${approved.length} image${approved.length !== 1 ? 's' : ''} approved`);
    onOpenChange(false);
  }, [results, selectedIds, onApproveImages, onOpenChange]);

  const handleLoadMore = useCallback(() => {
    handleSearch(undefined, page + 1);
  }, [handleSearch, page]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Shutterstock
          </DialogTitle>
          <DialogDescription>
            Search and approve images for <span className="font-medium text-foreground">{targetSectionName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Brand Imagery Profile */}
        {brandProfile && showSuggestions && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 shrink-0">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Brand Visual DNA</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{brandProfile}</p>
              {moodKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {moodKeywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] cursor-pointer hover:bg-primary/10"
                      onClick={() => handleSuggestionClick(kw)}>
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search controls */}
        <div className="space-y-2 shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Input
                placeholder="Search images or enter Shutterstock image ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(undefined, 1)}
                className="pr-8"
              />
              {isImageIdQuery(query) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Hash className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Image ID detected — will fetch this specific image
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <Button onClick={() => handleSearch(undefined, 1)} disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-1">Search</span>
            </Button>
          </div>

          {/* Advanced filters row */}
          <div className="flex gap-2 items-center flex-wrap">
            {/* Image type toggle */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              {IMAGE_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setImageType(opt.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors border-r border-border last:border-r-0',
                      imageType === opt.value
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Orientation */}
            <Select value={orientation} onValueChange={setOrientation}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any orientation</SelectItem>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
                <SelectItem value="square">Square</SelectItem>
              </SelectContent>
            </Select>

            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {totalCount.toLocaleString()} results
              </span>
            )}
          </div>
        </div>

        {/* AI Suggestions (shown before search or when no results) */}
        {showSuggestions && (
          <div className="space-y-2 shrink-0">
            {loadingSuggestions ? (
              <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing brand identity for smart suggestions...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI-Suggested Searches (based on your brand)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="text-left p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                      onClick={() => handleSuggestionClick(s.query)}
                    >
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <span className="text-sm font-medium text-foreground">{s.query}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 pl-5.5">{s.rationale}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Enhanced query suggestions (shown after a search) */}
        {!showSuggestions && enhancedQueries.length > 0 && (
          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Brand-aligned refinements
              </p>
              {aiReasoning && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-sm text-xs">
                    {aiReasoning}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {enhancedQueries.map((eq, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors text-xs"
                  onClick={() => handleSuggestionClick(eq)}
                >
                  {eq}
                </Badge>
              ))}
            </div>
            {styleNotes && (
              <p className="text-[10px] text-muted-foreground italic">{styleNotes}</p>
            )}
          </div>
        )}

        {/* Results - scrollable area */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border">
          {results.length === 0 && !loading && !showSuggestions ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 opacity-30 mb-3" />
              <p>No results found. Try a different search term.</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowSuggestions(true)}>
                <Sparkles className="h-3 w-3 mr-1" /> Show AI Suggestions
              </Button>
            </div>
          ) : results.length === 0 && !loading && showSuggestions ? null : (
            <div className="p-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {results.map((result) => {
                  const isSelected = selectedIds.has(result.id);
                  return (
                    <div
                      key={result.id}
                      className={cn(
                        'relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all',
                        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
                      )}
                      onClick={() => toggleSelect(result.id)}
                    >
                      <img
                        src={result.thumbnailUrl}
                        alt={result.description}
                        className="w-full aspect-[4/3] object-cover"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      {/* Media type badge for vectors/illustrations */}
                      {result.media_type && result.media_type !== 'image' && (
                        <Badge variant="secondary" className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5">
                          {result.media_type === 'vector' ? 'Vector' : 'Illustration'}
                        </Badge>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white line-clamp-2">{result.description}</p>
                        <p className="text-[9px] text-white/60 mt-0.5">ID: {result.id}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {results.length > 0 && results.length < totalCount && (
                <div className="flex justify-center py-4">
                  <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Load More ({results.length} of {totalCount.toLocaleString()})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between border-t pt-3 shrink-0">
            <Badge variant="secondary">{selectedIds.size} selected</Badge>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
              <Button size="sm" onClick={handleApprove}>
                <Check className="h-4 w-4 mr-1" />
                Approve {selectedIds.size} Image{selectedIds.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
