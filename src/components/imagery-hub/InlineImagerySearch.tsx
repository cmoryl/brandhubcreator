/**
 * InlineImagerySearch - Embedded search panel for the Imagery Hub
 * Redesigned for intuitive UX with clear visual hierarchy
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { BrandMaterialsPanel } from '@/components/imagery-hub/BrandMaterialsPanel';
import { AssetImageExtractor } from '@/components/imagery-hub/AssetImageExtractor';
import { ImageryPreviewDialog } from '@/components/brand/approved-imagery/ImageryPreviewDialog';
import { SearchByImageUpload } from '@/components/imagery-hub/SearchByImageUpload';
import { ExampleSearchGrid } from '@/components/imagery-hub/ExampleSearchGrid';
import {
  Search, Loader2, Check, ImageIcon, Sparkles, ArrowRight, Info, Hash,
  Camera, PenTool, Layers, SlidersHorizontal, X, Palette, Users, Eye,
  CheckSquare, Square, FolderPlus, Bookmark, Brain, ZoomIn, ChevronLeft,
  ShieldCheck, Ruler, Ban, Grid3X3, LayoutGrid, Upload, TrendingUp, FileImage,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { ApprovedImage } from '@/types/brand';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useImageryPreferenceLearning } from '@/hooks/useImageryPreferenceLearning';
import { LearnedPreferencesPanel } from '@/components/brand/approved-imagery/LearnedPreferencesPanel';

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

interface LightboxItem {
  id: string;
  name: string;
  images: ShutterstockSearchResult[];
  createdAt: string;
}

interface InlineImagerySearchProps {
  onApproveImages: (images: ApprovedImage[]) => void;
  onClose: () => void;
  targetSectionName: string;
  entityId?: string;
  entityType?: string;
  organizationId?: string | null;
  sections?: { id: string; name: string; images: ApprovedImage[] }[];
  activeSectionId?: string;
  onChangeSection?: (sectionId: string) => void;
}

const IMAGE_TYPE_OPTIONS = [
  { value: 'all', label: 'All', icon: Layers },
  { value: 'photo', label: 'Photos', icon: Camera },
  { value: 'vector', label: 'Vectors', icon: PenTool },
  { value: 'illustration', label: 'Illustrations', icon: ImageIcon },
];

const PEOPLE_NUMBER_OPTIONS = [
  { value: '_any', label: 'Any' },
  { value: '0', label: 'No people' },
  { value: '1', label: '1 person' },
  { value: '2', label: '2 people' },
  { value: '3', label: '3 people' },
  { value: '4', label: '4+ people' },
];

const PEOPLE_AGE_OPTIONS = [
  { value: '_any', label: 'Any age' },
  { value: 'infants', label: 'Infants' },
  { value: 'children', label: 'Children' },
  { value: 'teenagers', label: 'Teenagers' },
  { value: '20s', label: '20s' },
  { value: '30s', label: '30s' },
  { value: '40s', label: '40s' },
  { value: '50s', label: '50s' },
  { value: '60s', label: '60s' },
  { value: 'older', label: 'Older' },
];

const PEOPLE_ETHNICITY_OPTIONS = [
  { value: '_any', label: 'Any ethnicity' },
  { value: 'african', label: 'African' },
  { value: 'african_american', label: 'African American' },
  { value: 'black', label: 'Black' },
  { value: 'brazilian', label: 'Brazilian' },
  { value: 'caucasian', label: 'Caucasian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'east_asian', label: 'East Asian' },
  { value: 'hispanic', label: 'Hispanic' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'native_american', label: 'Native American' },
  { value: 'pacific_islander', label: 'Pacific Islander' },
  { value: 'south_asian', label: 'South Asian' },
  { value: 'southeast_asian', label: 'Southeast Asian' },
  { value: 'multi_ethnic', label: 'Multi-ethnic' },
  { value: 'other', label: 'Other' },
];

const PEOPLE_GENDER_OPTIONS = [
  { value: '_any', label: 'Any gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'both', label: 'Both' },
];

const QUICK_COLORS = [
  { hex: 'FF0000', label: 'Red' },
  { hex: 'FF6600', label: 'Orange' },
  { hex: 'FFCC00', label: 'Yellow' },
  { hex: '00CC00', label: 'Green' },
  { hex: '0066FF', label: 'Blue' },
  { hex: '6600CC', label: 'Purple' },
  { hex: 'FF0099', label: 'Pink' },
  { hex: '000000', label: 'Black' },
  { hex: 'FFFFFF', label: 'White' },
  { hex: '888888', label: 'Gray' },
];

const LIGHTBOX_STORAGE_KEY = 'shutterstock-lightboxes';

type ToolPanel = 'none' | 'filters' | 'lightbox' | 'preferences' | 'examples' | 'materials' | 'upload' | 'extract';

export const InlineImagerySearch = ({
  onApproveImages,
  onClose,
  targetSectionName,
  entityId,
  entityType = 'brand',
  organizationId,
  sections: availableSections,
  activeSectionId,
  onChangeSection,
}: InlineImagerySearchProps) => {
  const {
    visualDna, signalCount, isAnalyzing, isLoading: dnaLoading,
    recordApproved, recordSkipped, analyzePreferences,
  } = useImageryPreferenceLearning(entityId, entityType, organizationId);
  const lastSearchContextRef = useRef<Record<string, unknown>>({});

  const [query, setQuery] = useState('');
  const [orientation, setOrientation] = useState<string>('any');
  const [imageType, setImageType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [results, setResults] = useState<ShutterstockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [gridCols, setGridCols] = useState<2 | 3>(3);

  const [activePanel, setActivePanel] = useState<ToolPanel>('none');
  const [colorFilter, setColorFilter] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [peopleNumber, setPeopleNumber] = useState('');
  const [peopleAge, setPeopleAge] = useState('');
  const [peopleEthnicity, setPeopleEthnicity] = useState('');
  const [peopleGender, setPeopleGender] = useState('');
  const [safeSearch, setSafeSearch] = useState(true);
  const [minWidth, setMinWidth] = useState('');
  const [minHeight, setMinHeight] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState('');

  const [similarSourceId, setSimilarSourceId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ShutterstockSearchResult | null>(null);

  const [lightboxes, setLightboxes] = useState<LightboxItem[]>([]);
  const [activeLightboxId, setActiveLightboxId] = useState<string | null>(null);
  const [newLightboxName, setNewLightboxName] = useState('');

  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [brandProfile, setBrandProfile] = useState('');
  const [moodKeywords, setMoodKeywords] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [enhancedQueries, setEnhancedQueries] = useState<string[]>([]);
  const [styleNotes, setStyleNotes] = useState('');
  const [aiReasoning, setAiReasoning] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const hasResults = results.length > 0;
  const isLandingState = !hasResults && !loading && showSuggestions;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LIGHTBOX_STORAGE_KEY);
      if (stored) setLightboxes(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (entityId && suggestions.length === 0 && !loadingSuggestions) {
      fetchSuggestions();
    }
  }, [entityId]);

  const saveLightboxes = useCallback((updated: LightboxItem[]) => {
    setLightboxes(updated);
    try { localStorage.setItem(LIGHTBOX_STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  }, []);

  const activeFilterCount = [colorFilter, peopleNumber, peopleAge, peopleEthnicity, peopleGender, minWidth, minHeight, excludeKeywords, !safeSearch ? 'off' : ''].filter(Boolean).length;

  const togglePanel = useCallback((panel: ToolPanel) => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!entityId) return;
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('shutterstock-ai-suggest', {
        body: { entityId, entityType, categoryName: targetSectionName },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
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
        body: { entityId, entityType, userQuery: userQuery.trim(), categoryName: targetSectionName },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.enhancedQueries) {
        setEnhancedQueries(data.enhancedQueries);
        setStyleNotes(data.styleNotes || '');
        setAiReasoning(data.reasoning || '');
      }
    } catch (err: any) {
      console.error('AI enhance error:', err);
    }
  }, [entityId, entityType, targetSectionName]);

  const isImageIdQuery = useCallback((q: string) => /^\d{5,15}$/.test(q.trim()), []);

  const handleSearch = useCallback(async (searchQuery?: string, searchPage = 1) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    setSimilarSourceId(null);
    lastSearchContextRef.current = { query: q.trim(), orientation, imageType, colorFilter, peopleNumber, page: searchPage };

    try {
      if (isImageIdQuery(q)) {
        const { data, error } = await supabase.functions.invoke('shutterstock-search', {
          body: { action: 'get_by_id', imageId: q.trim() },
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
            color: colorFilter || undefined,
            sort: sortBy || 'popular',
            safe: safeSearch,
            min_width: minWidth || undefined,
            min_height: minHeight || undefined,
            exclude_keywords: excludeKeywords || undefined,
            people_number: peopleNumber && peopleNumber !== '_any' ? peopleNumber : undefined,
            people_age: peopleAge && peopleAge !== '_any' ? peopleAge : undefined,
            people_ethnicity: peopleEthnicity && peopleEthnicity !== '_any' ? peopleEthnicity : undefined,
            people_gender: peopleGender && peopleGender !== '_any' ? peopleGender : undefined,
            page: searchPage,
            per_page: 24,
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
  }, [query, orientation, imageType, sortBy, safeSearch, minWidth, minHeight, excludeKeywords, colorFilter, peopleNumber, peopleAge, peopleEthnicity, peopleGender, entityId, fetchEnhancedQueries, isImageIdQuery]);

  const handleSimilarSearch = useCallback(async (imageId: string) => {
    setLoading(true);
    setShowSuggestions(false);
    setSimilarSourceId(imageId);
    try {
      const { data, error } = await supabase.functions.invoke('shutterstock-search', {
        body: { action: 'similar', imageId, page: 1, per_page: 20 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data.results || []);
      setTotalCount(data.totalCount || 0);
      setPage(1);
    } catch (err: any) {
      console.error('Similar search error:', err);
      toast.error(err.message || 'Failed to find similar images');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const selectAll = useCallback(() => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(r => r.id)));
    }
  }, [results, selectedIds.size]);

  const handleApprove = useCallback(() => {
    const selectedResults = results.filter(r => selectedIds.has(r.id));
    const skippedResults = results.filter(r => !selectedIds.has(r.id));
    const approved: ApprovedImage[] = selectedResults.map(r => ({
      id: r.id,
      url: r.previewUrl || r.url,
      thumbnailUrl: r.thumbnailUrl,
      title: r.description?.slice(0, 100) || 'Untitled',
      source: 'shutterstock',
      category: r.categories?.[0] || '',
      approvedAt: new Date().toISOString(),
    }));
    onApproveImages(approved);
    recordApproved(
      selectedResults.map(r => ({ id: r.id, description: r.description, categories: r.categories, media_type: r.media_type, width: r.width, height: r.height })),
      lastSearchContextRef.current,
      targetSectionName
    );
    if (skippedResults.length > 0 && skippedResults.length <= 40) {
      recordSkipped(
        skippedResults.map(r => ({ id: r.id, description: r.description, categories: r.categories, media_type: r.media_type })),
        lastSearchContextRef.current
      );
    }
    setSelectedIds(new Set());
    toast.success(`${approved.length} image${approved.length !== 1 ? 's' : ''} approved`);
  }, [results, selectedIds, onApproveImages, recordApproved, recordSkipped, targetSectionName]);

  const handleLoadMore = useCallback(() => {
    if (similarSourceId) {
      setLoading(true);
      supabase.functions.invoke('shutterstock-search', {
        body: { action: 'similar', imageId: similarSourceId, page: page + 1, per_page: 20 },
      }).then(({ data, error }) => {
        if (!error && !data?.error) {
          setResults(prev => [...prev, ...(data.results || [])]);
          setTotalCount(data.totalCount || 0);
          setPage(data.page || page + 1);
        }
        setLoading(false);
      });
    } else {
      handleSearch(undefined, page + 1);
    }
  }, [handleSearch, page, similarSourceId]);

  const createLightbox = useCallback(() => {
    if (!newLightboxName.trim()) return;
    const lb: LightboxItem = { id: crypto.randomUUID(), name: newLightboxName.trim(), images: [], createdAt: new Date().toISOString() };
    const updated = [...lightboxes, lb];
    saveLightboxes(updated);
    setActiveLightboxId(lb.id);
    setNewLightboxName('');
    toast.success(`Collection "${lb.name}" created`);
  }, [newLightboxName, lightboxes, saveLightboxes]);

  const addToLightbox = useCallback((lightboxId: string) => {
    const selectedImages = results.filter(r => selectedIds.has(r.id));
    if (selectedImages.length === 0) return;
    const updated = lightboxes.map(lb => {
      if (lb.id !== lightboxId) return lb;
      const existingIds = new Set(lb.images.map(i => i.id));
      const newImages = selectedImages.filter(i => !existingIds.has(i.id));
      return { ...lb, images: [...lb.images, ...newImages] };
    });
    saveLightboxes(updated);
    toast.success(`${selectedImages.length} image(s) added to collection`);
  }, [results, selectedIds, lightboxes, saveLightboxes]);

  const viewLightbox = useCallback((lightboxId: string) => {
    const lb = lightboxes.find(l => l.id === lightboxId);
    if (!lb) return;
    setResults(lb.images);
    setTotalCount(lb.images.length);
    setPage(1);
    setShowSuggestions(false);
    setSimilarSourceId(null);
    setActivePanel('none');
    toast.info(`Viewing collection: ${lb.name}`);
  }, [lightboxes]);

  const deleteLightbox = useCallback((lightboxId: string) => {
    const updated = lightboxes.filter(l => l.id !== lightboxId);
    saveLightboxes(updated);
    if (activeLightboxId === lightboxId) setActiveLightboxId(null);
    toast.success('Collection deleted');
  }, [lightboxes, saveLightboxes, activeLightboxId]);

  const approveLightbox = useCallback((lightboxId: string) => {
    const lb = lightboxes.find(l => l.id === lightboxId);
    if (!lb || lb.images.length === 0) return;
    const approved: ApprovedImage[] = lb.images.map(r => ({
      id: r.id,
      url: r.previewUrl || r.url,
      thumbnailUrl: r.thumbnailUrl,
      title: r.description?.slice(0, 100) || 'Untitled',
      source: 'shutterstock',
      category: r.categories?.[0] || '',
      approvedAt: new Date().toISOString(),
    }));
    onApproveImages(approved);
    recordApproved(
      lb.images.map(r => ({ id: r.id, description: r.description, categories: r.categories, media_type: r.media_type, width: r.width, height: r.height })),
      { source: 'lightbox', lightboxName: lb.name },
      targetSectionName
    );
    toast.success(`${approved.length} image(s) from "${lb.name}" approved`);
  }, [lightboxes, onApproveImages, recordApproved, targetSectionName]);

  const clearFilters = useCallback(() => {
    setColorFilter('');
    setCustomColor('');
    setPeopleNumber('');
    setPeopleAge('');
    setPeopleEthnicity('');
    setPeopleGender('');
    setSafeSearch(true);
    setMinWidth('');
    setMinHeight('');
    setExcludeKeywords('');
  }, []);

  const handleReverseImageResults = useCallback((newResults: any[], newTotalCount: number) => {
    setResults(newResults);
    setTotalCount(newTotalCount);
    setPage(1);
    setShowSuggestions(false);
    setSimilarSourceId(null);
    setActivePanel('none');
  }, []);

  const handleExampleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setActivePanel('none');
    handleSearch(searchQuery, 1);
  }, [handleSearch]);

  return (
    <>
      <div className="flex flex-col h-full bg-background border-l border-border">
        {/* ── Header ── */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose} title="Collapse search">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Stock Image Search</h3>
            </div>
            {/* Grid density toggle */}
            <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
              <button onClick={() => setGridCols(2)} className={cn('p-1 rounded', gridCols === 2 ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setGridCols(3)} className={cn('p-1 rounded', gridCols === 3 ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}>
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {/* Target section picker */}
          {availableSections && availableSections.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground shrink-0">Add to:</span>
              <Select value={activeSectionId || ''} onValueChange={(val) => onChangeSection?.(val)}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.images.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ── Search Bar ── */}
        <div className="px-4 py-3 border-b border-border shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images, keywords, or enter image ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(undefined, 1)}
              className="pl-9 pr-20 h-10"
              autoFocus
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isImageIdQuery(query) && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">ID</Badge>
              )}
              <Button size="sm" className="h-7 px-3 text-xs" onClick={() => handleSearch(undefined, 1)} disabled={loading || !query.trim()}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </div>

          {/* Image type pills + orientation + sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              {IMAGE_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setImageType(opt.value)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors border-r border-border last:border-r-0',
                      imageType === opt.value
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <Select value={orientation} onValueChange={setOrientation}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any orient.</SelectItem>
                <SelectItem value="horizontal">Landscape</SelectItem>
                <SelectItem value="vertical">Portrait</SelectItem>
                <SelectItem value="square">Square</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="relevance">Relevant</SelectItem>
                <SelectItem value="random">Random</SelectItem>
              </SelectContent>
            </Select>

            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground ml-auto font-medium">{totalCount.toLocaleString()} results</span>
            )}
          </div>

          {/* ── Tool Bar ── Compact toggle buttons for panels */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant={activePanel === 'filters' ? 'default' : 'outline'}
              size="sm" className="h-7 text-xs gap-1 px-2.5"
              onClick={() => togglePanel('filters')}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filters
              {activeFilterCount > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">{activeFilterCount}</Badge>}
            </Button>

            <Button
              variant={activePanel === 'upload' ? 'default' : 'outline'}
              size="sm" className="h-7 text-xs gap-1 px-2.5"
              onClick={() => togglePanel('upload')}
            >
              <Upload className="h-3 w-3" />
              Reverse Search
            </Button>

            <Button
              variant={activePanel === 'lightbox' ? 'default' : 'outline'}
              size="sm" className="h-7 text-xs gap-1 px-2.5"
              onClick={() => togglePanel('lightbox')}
            >
              <Bookmark className="h-3 w-3" />
              Collections
              {lightboxes.length > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{lightboxes.length}</Badge>}
            </Button>

            <Button
              variant={activePanel === 'preferences' ? 'default' : 'outline'}
              size="sm" className="h-7 text-xs gap-1 px-2.5"
              onClick={() => togglePanel('preferences')}
            >
              <Brain className="h-3 w-3" />
              Visual DNA
              {signalCount > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{signalCount}</Badge>}
            </Button>

            <Button
              variant={activePanel === 'examples' ? 'default' : 'outline'}
              size="sm" className="h-7 text-xs gap-1 px-2.5"
              onClick={() => togglePanel('examples')}
            >
              <TrendingUp className="h-3 w-3" />
              Examples
            </Button>

            {entityId && (
              <Button
                variant={activePanel === 'materials' ? 'default' : 'outline'}
                size="sm" className="h-7 text-xs gap-1 px-2.5"
                onClick={() => togglePanel('materials')}
              >
                <Sparkles className="h-3 w-3" />
                Materials
              </Button>
            )}

            {similarSourceId && (
              <Badge variant="outline" className="text-xs gap-1 h-7">
                Similar to #{similarSourceId}
                <button onClick={() => { setSimilarSourceId(null); setResults([]); setShowSuggestions(true); }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* ── Expandable Tool Panel ── */}
        {activePanel !== 'none' && (
          <div className="border-b border-border shrink-0 max-h-[40vh] overflow-y-auto">
            {/* Filters */}
            {activePanel === 'filters' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Advanced Filters
                  </p>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-destructive" onClick={clearFilters}>Clear all</Button>
                  )}
                </div>
                {/* Color */}
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Palette className="h-3 w-3" /> Dominant Color
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {QUICK_COLORS.map(c => (
                      <button key={c.hex} onClick={() => setColorFilter(colorFilter === c.hex ? '' : c.hex)}
                        className={cn('w-7 h-7 rounded-full border-2 transition-all hover:scale-110',
                          colorFilter === c.hex ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-border'
                        )}
                        style={{ backgroundColor: `#${c.hex}` }} title={c.label} />
                    ))}
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-[10px] text-muted-foreground font-mono">#</span>
                      <Input value={customColor} onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                        setCustomColor(val);
                        if (val.length === 6) setColorFilter(val);
                      }} placeholder="Custom" className="h-7 w-20 text-xs px-1.5 font-mono" />
                      {colorFilter && (
                        <button onClick={() => { setColorFilter(''); setCustomColor(''); }} className="p-0.5 rounded hover:bg-destructive/10">
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* People */}
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> People & Composition
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={peopleNumber} onValueChange={setPeopleNumber}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="# People" /></SelectTrigger>
                      <SelectContent>{PEOPLE_NUMBER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={peopleAge} onValueChange={setPeopleAge}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Age range" /></SelectTrigger>
                      <SelectContent>{PEOPLE_AGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={peopleEthnicity} onValueChange={setPeopleEthnicity}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Ethnicity" /></SelectTrigger>
                      <SelectContent>{PEOPLE_ETHNICITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={peopleGender} onValueChange={setPeopleGender}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Gender" /></SelectTrigger>
                      <SelectContent>{PEOPLE_GENDER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Safety & Resolution */}
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Safety & Quality
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={safeSearch} onChange={(e) => setSafeSearch(e.target.checked)} className="rounded border-border" />
                      <span className="text-xs text-foreground">Safe search</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Ruler className="h-3 w-3 text-muted-foreground" />
                      <Input value={minWidth} onChange={(e) => setMinWidth(e.target.value.replace(/\D/g, ''))} placeholder="Min W" className="h-7 w-20 text-xs px-1.5" />
                      <span className="text-[10px] text-muted-foreground">×</span>
                      <Input value={minHeight} onChange={(e) => setMinHeight(e.target.value.replace(/\D/g, ''))} placeholder="Min H" className="h-7 w-20 text-xs px-1.5" />
                      <span className="text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
                {/* Exclude */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Ban className="h-3 w-3" /> Exclude Keywords
                  </p>
                  <Input value={excludeKeywords} onChange={(e) => setExcludeKeywords(e.target.value)} placeholder="e.g. cartoon, clipart, text overlay" className="h-8 text-xs" />
                </div>
              </div>
            )}

            {/* Reverse Image Search */}
            {activePanel === 'upload' && (
              <div className="p-4">
                <SearchByImageUpload onResults={handleReverseImageResults} onLoading={setLoading} />
              </div>
            )}

            {/* Collections / Lightboxes */}
            {activePanel === 'lightbox' && (
              <div className="p-4 space-y-3">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Bookmark className="h-3.5 w-3.5 text-primary" /> Image Collections
                </p>
                <div className="flex gap-2">
                  <Input placeholder="New collection name..." value={newLightboxName} onChange={(e) => setNewLightboxName(e.target.value)}
                    className="h-8 text-xs" onKeyDown={(e) => e.key === 'Enter' && createLightbox()} />
                  <Button size="sm" className="h-8 px-3 text-xs gap-1" onClick={createLightbox} disabled={!newLightboxName.trim()}>
                    <FolderPlus className="h-3.5 w-3.5" /> Create
                  </Button>
                </div>
                {lightboxes.length === 0 ? (
                  <div className="text-center py-4">
                    <Bookmark className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No collections yet. Create one to save images for later review.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lightboxes.map(lb => (
                      <div key={lb.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-accent/50 group transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{lb.name}</p>
                          <p className="text-[10px] text-muted-foreground">{lb.images.length} images</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {selectedIds.size > 0 && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => addToLightbox(lb.id)}>Add selected</Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => viewLightbox(lb.id)} title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => approveLightbox(lb.id)} disabled={lb.images.length === 0} title="Approve all">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteLightbox(lb.id)} title="Delete">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Visual DNA / Preferences */}
            {activePanel === 'preferences' && (
              <div className="p-4">
                <LearnedPreferencesPanel visualDna={visualDna} signalCount={signalCount} isAnalyzing={isAnalyzing}
                  isLoading={dnaLoading} onAnalyze={analyzePreferences}
                  onApplyToSearch={(q) => { setQuery(q); handleSearch(q, 1); }} maxHeight="300px" />
              </div>
            )}

            {/* Example Searches */}
            {activePanel === 'examples' && (
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <ExampleSearchGrid onSearch={handleExampleSearch} />
              </div>
            )}

            {/* Brand Materials */}
            {activePanel === 'materials' && entityId && (
              <div className="p-4">
                <BrandMaterialsPanel
                  entityId={entityId}
                  entityType={(entityType as 'brand' | 'product' | 'event') || 'brand'}
                  categoryName={targetSectionName}
                  onSearchTermClick={(term) => {
                    setQuery(term);
                    handleSearch(term, 1);
                  }}
                  isOpen={true}
                  onToggle={() => setActivePanel('none')}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Enhanced query suggestions (inline, after search) ── */}
        {!showSuggestions && enhancedQueries.length > 0 && (
          <div className="px-4 py-2 border-b border-border shrink-0 bg-muted/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <p className="text-[11px] font-medium text-muted-foreground">Brand-aligned refinements</p>
              {aiReasoning && (
                <Tooltip>
                  <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-sm text-xs">{aiReasoning}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {enhancedQueries.map((eq, i) => (
                <Badge key={i} variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors text-xs"
                  onClick={() => handleSuggestionClick(eq)}>{eq}</Badge>
              ))}
            </div>
            {styleNotes && <p className="text-[10px] text-muted-foreground italic mt-1">{styleNotes}</p>}
          </div>
        )}

        {/* ── Bulk actions bar ── */}
        {hasResults && (
          <div className="px-4 py-2 flex items-center gap-3 border-b border-border bg-card/50 shrink-0">
            <button onClick={selectAll} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {selectedIds.size === results.length ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5" />}
              {selectedIds.size === results.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedIds.size > 0 && (
              <>
                <span className="text-xs text-muted-foreground">|</span>
                <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
                {lightboxes.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2">
                        <Bookmark className="h-3 w-3" /> Save to...
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="start">
                      {lightboxes.map(lb => (
                        <button key={lb.id} className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors"
                          onClick={() => addToLightbox(lb.id)}>{lb.name} ({lb.images.length})</button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setSelectedIds(new Set())}>Clear</Button>
                <Button size="sm" className="h-6 text-xs gap-1 px-3 ml-auto" onClick={handleApprove}>
                  <Check className="h-3 w-3" /> Approve {selectedIds.size}
                </Button>
              </>
            )}
          </div>
        )}

        {/* ── Results Area ── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Landing state: AI Suggestions + Brand DNA */}
          {isLandingState && (
            <div className="p-4 space-y-4">
              {/* Brand Visual DNA teaser */}
              {brandProfile && (
                <div className="rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Brand Visual DNA</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{brandProfile}</p>
                      {moodKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {moodKeywords.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-[11px] cursor-pointer hover:bg-primary/10 transition-colors"
                              onClick={() => handleSuggestionClick(kw)}>
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {loadingSuggestions ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mb-3 text-primary" />
                  <p className="text-sm font-medium">Analyzing brand identity...</p>
                  <p className="text-xs text-muted-foreground mt-1">Generating smart search suggestions</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-primary" />
                    Suggested Searches
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestions.map((s, i) => (
                      <button key={i}
                        className="text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        onClick={() => handleSuggestionClick(s.query)}>
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors shrink-0">
                            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-sm font-medium text-foreground flex-1">{s.query}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5 ml-9 line-clamp-1">{s.rationale}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Quick-start hint */}
              {!loadingSuggestions && suggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-2xl bg-muted/50 mb-4">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Find the perfect image</h4>
                  <p className="text-xs text-muted-foreground max-w-[260px]">
                    Search by keyword, upload an image for reverse search, or browse examples for inspiration.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => togglePanel('upload')}>
                      <Upload className="h-3 w-3" /> Upload Image
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => togglePanel('examples')}>
                      <TrendingUp className="h-3 w-3" /> Browse Examples
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No results state */}
          {!hasResults && !loading && !showSuggestions && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="p-4 rounded-2xl bg-muted/50 mb-3">
                <Search className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No results found</p>
              <p className="text-xs text-muted-foreground mb-3">Try a different search term or adjust your filters</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setShowSuggestions(true)}>
                  <Sparkles className="h-3 w-3" /> AI Suggestions
                </Button>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={clearFilters}>
                    <X className="h-3 w-3" /> Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Image grid */}
          {hasResults && (
            <div className="p-3">
              <div className={cn('grid gap-2.5', gridCols === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
                {results.map((result) => {
                  const isSelected = selectedIds.has(result.id);
                  return (
                    <div key={result.id}
                      className={cn(
                        'relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg',
                        isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-transparent hover:border-muted-foreground/20'
                      )}
                      onClick={() => toggleSelect(result.id)}>
                      <img
                        src={result.thumbnailUrl}
                        alt={result.description}
                        className={cn('w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]', gridCols === 2 ? 'aspect-[4/3]' : 'aspect-square')}
                        loading="lazy"
                      />
                      {/* Selection checkbox */}
                      <div className={cn(
                        'absolute top-2 right-2 rounded-lg p-1.5 transition-all shadow-sm',
                        isSelected ? 'bg-primary text-primary-foreground scale-110' : 'bg-background/80 backdrop-blur-sm text-muted-foreground border border-border/50'
                      )}>
                        {isSelected ? <Check className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                      </div>
                      {/* Media type badge */}
                      {result.media_type && result.media_type !== 'image' && (
                        <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 shadow-sm">
                          {result.media_type === 'vector' ? 'Vector' : 'Illustration'}
                        </Badge>
                      )}
                      {/* Bottom info + actions overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 pt-10">
                        <p className="text-[11px] text-white/90 line-clamp-2 leading-snug font-medium">{result.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] text-white/40 font-mono">#{result.id}</p>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setPreviewImage(result); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/15 hover:bg-white/30 text-white text-[10px] backdrop-blur-sm transition-colors" title="Preview larger">
                              <ZoomIn className="h-3 w-3" /> View
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleSimilarSearch(result.id); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/15 hover:bg-white/30 text-white text-[10px] backdrop-blur-sm transition-colors" title="Find similar">
                              <Eye className="h-3 w-3" /> Similar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {results.length > 0 && results.length < totalCount && (
                <div className="flex justify-center py-5">
                  <Button variant="outline" size="default" onClick={handleLoadMore} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Load More
                    <Badge variant="secondary" className="text-[10px] ml-1">{results.length} / {totalCount.toLocaleString()}</Badge>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Loading spinner */}
          {loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Searching images...</p>
            </div>
          )}
        </div>

        {/* ── Sticky approve footer ── */}
        {selectedIds.size > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-border bg-card shrink-0">
            <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
              <Button size="sm" onClick={handleApprove} className="gap-1.5">
                <Check className="h-4 w-4" />
                Approve {selectedIds.size} Image{selectedIds.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ImageryPreviewDialog
        open={!!previewImage}
        onOpenChange={(o) => { if (!o) setPreviewImage(null); }}
        image={previewImage ? {
          id: previewImage.id,
          url: previewImage.previewUrl || previewImage.url,
          thumbnailUrl: previewImage.thumbnailUrl,
          title: previewImage.description?.slice(0, 100) || 'Untitled',
          source: 'shutterstock',
          category: previewImage.categories?.[0] || '',
        } : null}
      />
    </>
  );
};
