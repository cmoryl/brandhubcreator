import { useState, useCallback } from 'react';
import { Search, Loader2, Check, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { ApprovedImage } from '@/types/brand';
import { toast } from 'sonner';

interface ShutterstockSearchResult {
  id: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  previewUrl: string;
  width: number;
  height: number;
  categories: string[];
}

interface ShutterstockSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproveImages: (images: ApprovedImage[]) => void;
  targetSectionName: string;
}

export const ShutterstockSearchDialog = ({
  open,
  onOpenChange,
  onApproveImages,
  targetSectionName,
}: ShutterstockSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [orientation, setOrientation] = useState<string>('any');
  const [results, setResults] = useState<ShutterstockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const handleSearch = useCallback(async (searchPage = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shutterstock-search', {
        body: {
          query: query.trim(),
          orientation: orientation === 'any' ? undefined : orientation,
          page: searchPage,
          per_page: 20,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (searchPage === 1) {
        setResults(data.results || []);
      } else {
        setResults(prev => [...prev, ...(data.results || [])]);
      }
      setTotalCount(data.totalCount || 0);
      setPage(searchPage);
    } catch (err: any) {
      console.error('Shutterstock search error:', err);
      toast.error(err.message || 'Failed to search images');
    } finally {
      setLoading(false);
    }
  }, [query, orientation]);

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
    handleSearch(page + 1);
  }, [handleSearch, page]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Shutterstock
          </DialogTitle>
          <DialogDescription>
            Search and approve images for <span className="font-medium text-foreground">{targetSectionName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Search controls */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              placeholder="Search images..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
            />
          </div>
          <Select value={orientation} onValueChange={setOrientation}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any orientation</SelectItem>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="vertical">Vertical</SelectItem>
              <SelectItem value="square">Square</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleSearch(1)} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-1">Search</span>
          </Button>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 min-h-0">
          {results.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ImageIcon className="h-12 w-12 opacity-30 mb-3" />
              <p>Search for stock images above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
              {results.map((result) => {
                const isSelected = selectedIds.has(result.id);
                return (
                  <div
                    key={result.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
                    }`}
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
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white line-clamp-2">{result.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {results.length > 0 && results.length < totalCount && (
            <div className="flex justify-center py-4">
              <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Load More ({results.length} of {totalCount.toLocaleString()})
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between border-t pt-3">
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
