/**
 * AutoCategorizeDialog - AI suggests category assignments for uncategorized images
 */
import { useState, useCallback } from 'react';
import { Sparkles, Loader2, Check, FolderPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ApprovedImage, ApprovedImagerySubSection } from '@/types/brand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CategorizeResult {
  index: number;
  suggestedCategory: string;
  isNewCategory: boolean;
  confidence: number;
  suggestedTags: string[];
  reasoning?: string;
}

interface AutoCategorizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ApprovedImage[];
  sections: ApprovedImagerySubSection[];
  entityName?: string;
  onApply: (assignments: { image: ApprovedImage; sectionId: string; newSectionName?: string; tags: string[] }[]) => void;
}

export const AutoCategorizeDialog = ({
  open, onOpenChange, images, sections, entityName, onApply,
}: AutoCategorizeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CategorizeResult[]>([]);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const urls = images.map(img => img.url || img.thumbnailUrl);
      const BATCH_SIZE = 20;
      const sectionNames = sections.map(s => s.name);
      const allAssignments: CategorizeResult[] = [];

      for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batchUrls = urls.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.functions.invoke('imagery-auto-categorize', {
          body: { imageUrls: batchUrls, existingSections: sectionNames, entityName },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        // Re-map indices back to the full image list
        (data.assignments || []).forEach((a: CategorizeResult) => {
          allAssignments.push({ ...a, index: a.index + i });
        });
      }

      setResults(allAssignments);
      const autoAccept = new Set<number>();
      allAssignments.forEach(a => {
        if (a.confidence >= 80) autoAccept.add(a.index);
      });
      setAccepted(autoAccept);
    } catch (err: any) {
      toast.error(err.message || 'Failed to categorize');
    } finally {
      setLoading(false);
    }
  }, [images, sections, entityName]);

  const toggleAccept = useCallback((index: number) => {
    setAccepted(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    const assignments = results
      .filter(r => accepted.has(r.index))
      .map(r => {
        const image = images[r.index];
        const existingSection = sections.find(
          s => s.name.toLowerCase() === r.suggestedCategory.toLowerCase()
        );
        return {
          image,
          sectionId: existingSection?.id || '',
          newSectionName: r.isNewCategory || !existingSection ? r.suggestedCategory : undefined,
          tags: r.suggestedTags,
        };
      });
    onApply(assignments);
    onOpenChange(false);
    toast.success(`Applied ${assignments.length} categorization(s)`);
  }, [results, accepted, images, sections, onApply, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Auto-Categorize
          </DialogTitle>
        </DialogHeader>

        {!results.length && !loading && (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-muted-foreground">
              AI will analyze {images.length} image{images.length !== 1 ? 's' : ''} and suggest categories and tags.
            </p>
            <Button onClick={analyze} className="gap-2">
              <Sparkles className="h-4 w-4" /> Analyze Images
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Analyzing {images.length} images...
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, i) => {
              const img = images[result.index];
              if (!img) return null;
              const isAccepted = accepted.has(result.index);

              return (
                <div
                  key={result.index}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors',
                    isAccepted ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}
                  onClick={() => toggleAccept(result.index)}
                >
                  <img
                    src={img.thumbnailUrl || img.url}
                    alt={img.title}
                    className="w-12 h-12 rounded object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{result.suggestedCategory}</span>
                      {result.isNewCategory && (
                        <Badge variant="secondary" className="text-[10px] gap-0.5">
                          <FolderPlus className="h-2.5 w-2.5" /> New
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          result.confidence >= 80 ? 'text-green-600' :
                          result.confidence >= 60 ? 'text-yellow-600' : 'text-red-600'
                        )}
                      >
                        {result.confidence}%
                      </Badge>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {result.suggestedTags.map((tag, ti) => (
                        <Badge key={ti} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    isAccepted ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  )}>
                    {isAccepted && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {results.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={accepted.size === 0}>
              Apply {accepted.size} Assignment{accepted.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
