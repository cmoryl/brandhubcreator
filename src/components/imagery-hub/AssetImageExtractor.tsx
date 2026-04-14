/**
 * AssetImageExtractor - Extracts and imports imagery from uploaded digital assets
 * (PDFs, presentations, brochures, case studies) into Imagery Hub sections.
 */
import { useState, useCallback } from 'react';
import {
  FileImage, Loader2, Download, Check, X, ImagePlus,
  FileText, Presentation, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { ApprovedImage } from '@/types/brand';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExtractedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
  sourceDocument: string;
  mimeType: string;
  sizeBytes: number;
}

interface AssetImageExtractorProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  onImagesExtracted: (images: ApprovedImage[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const AssetImageExtractor = ({
  entityId, entityType, onImagesExtracted, isOpen, onToggle,
}: AssetImageExtractorProps) => {
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [stats, setStats] = useState<{ docsProcessed: number; docsTotal: number } | null>(null);

  const handleExtract = useCallback(async () => {
    setIsExtracting(true);
    setExtractedImages([]);
    setSelectedIds(new Set());
    try {
      const { data, error } = await supabase.functions.invoke('extract-asset-images', {
        body: { entityId, entityType },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const imgs: ExtractedImage[] = data?.images || [];
      setExtractedImages(imgs);
      setStats({
        docsProcessed: data?.documentsProcessed || 0,
        docsTotal: data?.documentsTotal || 0,
      });
      setHasRun(true);
      // Auto-select all
      setSelectedIds(new Set(imgs.map(i => i.id)));
      if (imgs.length > 0) {
        toast.success(data?.message || `Extracted ${imgs.length} images`);
      } else {
        toast.info(data?.message || 'No images found in documents');
      }
    } catch (err) {
      console.error('Image extraction failed:', err);
      toast.error('Failed to extract images from assets');
    } finally {
      setIsExtracting(false);
    }
  }, [entityId, entityType]);

  const toggleImage = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(extractedImages.map(i => i.id)));
  }, [extractedImages]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleImportSelected = useCallback(() => {
    const selected = extractedImages.filter(img => selectedIds.has(img.id));
    if (selected.length === 0) {
      toast.error('No images selected');
      return;
    }

    const approvedImages: ApprovedImage[] = selected.map(img => ({
      id: img.id,
      url: img.url,
      thumbnailUrl: img.thumbnailUrl,
      title: img.title,
      source: 'extracted',
      approvedAt: new Date().toISOString(),
      tags: ['extracted', img.sourceDocument.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
    }));

    onImagesExtracted(approvedImages);
    toast.success(`Imported ${approvedImages.length} extracted images`);
    setSelectedIds(new Set());
  }, [extractedImages, selectedIds, onImagesExtracted]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 w-full justify-between">
          <div className="flex items-center gap-1.5">
            <FileImage className="h-3.5 w-3.5 text-primary" />
            <span>Extract from Assets</span>
            {extractedImages.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {extractedImages.length}
              </Badge>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="mt-2 border-border/50">
          <CardContent className="p-3 space-y-3">
            {/* Info Banner */}
            <div className="flex items-start gap-2 p-2 rounded-md bg-primary/5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
              <p>
                Scans uploaded PDFs, presentations, brochures, and case studies to extract embedded 
                photographs and graphics for use as brand imagery.
              </p>
            </div>

            {/* Extract Button */}
            <Button
              onClick={handleExtract}
              disabled={isExtracting}
              size="sm"
              className="w-full gap-2"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting images...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {hasRun ? 'Re-extract Images' : 'Extract Images from Assets'}
                </>
              )}
            </Button>

            {/* Stats */}
            {stats && hasRun && (
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  Scanned {stats.docsProcessed} of {stats.docsTotal} document{stats.docsTotal !== 1 ? 's' : ''}
                </span>
                <span>
                  {extractedImages.length} image{extractedImages.length !== 1 ? 's' : ''} found
                </span>
              </div>
            )}

            {/* Extracted Images Grid */}
            {extractedImages.length > 0 && (
              <>
                {/* Select controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedIds.size} selected
                  </Badge>
                </div>

                <ScrollArea className="max-h-64">
                  <div className="grid grid-cols-3 gap-1.5">
                    {extractedImages.map(img => {
                      const isSelected = selectedIds.has(img.id);
                      return (
                        <div
                          key={img.id}
                          className={cn(
                            'relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all group',
                            isSelected
                              ? 'border-primary ring-1 ring-primary/30'
                              : 'border-transparent hover:border-muted-foreground/30'
                          )}
                          onClick={() => toggleImage(img.id)}
                        >
                          <img
                            src={img.thumbnailUrl}
                            alt={img.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          
                          {/* Selection indicator */}
                          <div className={cn(
                            'absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background/80 text-muted-foreground border border-border'
                          )}>
                            {isSelected ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <span className="text-[8px]">+</span>
                            )}
                          </div>

                          {/* Info overlay */}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[9px] text-white truncate">{img.sourceDocument}</p>
                            <p className="text-[8px] text-white/70">{formatSize(img.sizeBytes)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Import button */}
                <Button
                  onClick={handleImportSelected}
                  disabled={selectedIds.size === 0}
                  size="sm"
                  className="w-full gap-2"
                  variant="default"
                >
                  <ImagePlus className="h-4 w-4" />
                  Import {selectedIds.size} Image{selectedIds.size !== 1 ? 's' : ''} to Section
                </Button>
              </>
            )}

            {/* Empty state after run */}
            {hasRun && extractedImages.length === 0 && !isExtracting && (
              <div className="text-center py-4 text-xs text-muted-foreground space-y-1">
                <FileText className="h-8 w-8 mx-auto opacity-20" />
                <p>No extractable images found</p>
                <p className="text-[10px]">
                  Upload PDFs or presentations with embedded photos to extract imagery
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};
