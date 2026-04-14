/**
 * VisualSearchPanel - AI-powered "find similar" that analyzes an image and generates search queries
 */
import { useState, useCallback } from 'react';
import { Eye, Loader2, Search, Palette, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VisualSearchDescriptors {
  searchQueries: string[];
  dominantColors: string[];
  style: string;
  mood: string;
  subject: string;
  composition?: string;
  lighting?: string;
  suggestedFilters?: {
    orientation?: string;
    imageType?: string;
    colorHex?: string;
  };
}

interface VisualSearchPanelProps {
  imageUrl: string;
  entityId?: string;
  entityType?: string;
  onSearchQuery: (query: string) => void;
  onClose: () => void;
}

export const VisualSearchPanel = ({
  imageUrl, entityId, entityType, onSearchQuery, onClose,
}: VisualSearchPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [descriptors, setDescriptors] = useState<VisualSearchDescriptors | null>(null);

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('imagery-visual-search', {
        body: { imageUrl, entityId, entityType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDescriptors(data.descriptors);
    } catch (err: any) {
      console.error('Visual search error:', err);
      toast.error(err.message || 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  }, [imageUrl, entityId, entityType]);

  // Auto-analyze on mount
  useState(() => { analyze(); });

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Visual Search</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing image...
          </div>
        )}

        {descriptors && (
          <>
            {/* Style info */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs">{descriptors.style}</Badge>
              <Badge variant="secondary" className="text-xs">{descriptors.mood}</Badge>
              {descriptors.lighting && (
                <Badge variant="secondary" className="text-xs">{descriptors.lighting}</Badge>
              )}
            </div>

            {/* Dominant colors */}
            {descriptors.dominantColors.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                {descriptors.dominantColors.map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}

            {/* Search queries */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Find similar:</span>
              <div className="flex flex-wrap gap-1">
                {descriptors.searchQueries.map((q, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => onSearchQuery(q)}
                  >
                    <Search className="h-2.5 w-2.5 mr-1" />
                    {q}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
