/**
 * AssetImageExtractor - Extracts and imports imagery from uploaded digital assets
 * Full-featured UI with scrollable grid, preview lightbox, filter tabs, and batch selection.
 */
import { useState, useCallback, useMemo } from 'react';
import {
  FileImage, Loader2, Download, Check, ImagePlus,
  FileText, ChevronDown, ChevronUp, Info, Eye, X,
  Filter, CheckSquare, Square, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

type SourceFilter = 'all' | 'extracted' | 'direct';

export const AssetImageExtractor = ({
  entityId, entityType, onImagesExtracted, isOpen, onToggle,
}: AssetImageExtractorProps) => {
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [stats, setStats] = useState<{ docsProcessed: number; docsTotal: number } | null>(null);
  const [previewImage, setPreviewImage] = useState<ExtractedImage | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const filteredImages = useMemo(() => {
    if (sourceFilter === 'all') return extractedImages;
    return extractedImages.filter(img =>
      sourceFilter === 'extracted' ? img.source === 'extracted' : img.source !== 'extracted'
    );
  }, [extractedImages, sourceFilter]);

  const sourceBreakdown = useMemo(() => {
    const extracted = extractedImages.filter(i => i.source === 'extracted').length;
    return { extracted, direct: extractedImages.length - extracted, total: extractedImages.length };
  }, [extractedImages]);

  const handleExtract = useCallback(async () => {
    setIsExtracting(true);
    setExtractedImages([]);
    setSelectedIds(new Set());
    try {
      const { data, error } = await supabase.functions.invoke('extract-asset-images', {
        body: { entityId, entityType },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const imgs: ExtractedImage[] = data?.images || [];
      setExtractedImages(imgs);
      setStats({ docsProcessed: data?.documentsProcessed || 0, docsTotal: data?.documentsTotal || 0 });
      setHasRun(true);
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

  const toggleImage = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredImages.map(i => i.id)));
  }, [filteredImages]);

  const deselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const handleImportSelected = useCallback(() => {
    const selected = extractedImages.filter(img => selectedIds.has(img.id));
    if (selected.length === 0) { toast.error('No images selected'); return; }
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
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const allFilteredSelected = filteredImages.length > 0 && filteredImages.every(i => selectedIds.has(i.id));

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 w-full justify-between">
            <div className="flex items-center gap-1.5">
              <FileImage className="h-3.5 w-3.5 text-primary" />
              <span>Extract from Assets</span>
              {extractedImages.length > 0 && (
                <Badge variant="secondary" className="text-xs">{extractedImages.length}</Badge>
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
              <Button onClick={handleExtract} disabled={isExtracting} size="sm" className="w-full gap-2">
                {isExtracting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Scanning & extracting...</>
                ) : (
                  <><Download className="h-4 w-4" />{hasRun ? 'Re-extract Images' : 'Extract Images from Assets'}</>
                )}
              </Button>

              {/* Stats */}
              {stats && hasRun && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Scanned {stats.docsProcessed} of {stats.docsTotal} documents</span>
                  <span>{extractedImages.length} images found</span>
                </div>
              )}

              {/* Images Grid */}
              {extractedImages.length > 0 && (
                <>
                  {/* Toolbar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 text-xs px-2 gap-1"
                        onClick={allFilteredSelected ? deselectAll : selectAll}
                      >
                        {allFilteredSelected
                          ? <><CheckSquare className="h-3 w-3" /> Deselect All</>
                          : <><Square className="h-3 w-3" /> Select All</>
                        }
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Source filter tabs */}
                      <div className="flex items-center bg-muted/50 rounded-md p-0.5 gap-0.5">
                        {(['all', 'extracted', 'direct'] as SourceFilter[]).map(f => (
                          <button
                            key={f}
                            onClick={() => setSourceFilter(f)}
                            className={cn(
                              'px-2 py-1 rounded text-[10px] font-medium transition-colors capitalize',
                              sourceFilter === f
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {f === 'all' ? `All (${sourceBreakdown.total})`
                              : f === 'extracted' ? `Embedded (${sourceBreakdown.extracted})`
                              : `Direct (${sourceBreakdown.direct})`}
                          </button>
                        ))}
                      </div>
                      <Badge variant="outline" className="text-[10px] ml-1">
                        {selectedIds.size} selected
                      </Badge>
                    </div>
                  </div>

                  {/* Scrollable Image Grid */}
                  <div className="overflow-y-auto max-h-[60vh] min-h-[200px] rounded-lg border border-border/30 bg-muted/10 p-2">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {filteredImages.map(img => {
                        const isSelected = selectedIds.has(img.id);
                        return (
                          <div
                            key={img.id}
                            className={cn(
                              'relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
                              isSelected
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-transparent hover:border-muted-foreground/30'
                            )}
                          >
                            {/* Image */}
                            <div
                              className="aspect-square bg-muted/30"
                              onClick={() => setPreviewImage(img)}
                            >
                              <img
                                src={img.thumbnailUrl}
                                alt={img.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>

                            {/* Selection checkbox - top right */}
                            <button
                              onClick={(e) => toggleImage(img.id, e)}
                              className={cn(
                                'absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center transition-all z-10',
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-md'
                                  : 'bg-background/90 text-muted-foreground border border-border hover:bg-background shadow-sm'
                              )}
                            >
                              {isSelected ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">+</span>}
                            </button>

                            {/* Preview eye icon - top left */}
                            <button
                              onClick={() => setPreviewImage(img)}
                              className="absolute top-1.5 left-1.5 w-6 h-6 rounded-md bg-background/90 text-muted-foreground border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-background shadow-sm"
                            >
                              <Eye className="h-3 w-3" />
                            </button>

                            {/* Source badge & info overlay */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 pt-4">
                              <p className="text-[9px] text-white truncate font-medium">{img.title}</p>
                              <div className="flex items-center justify-between mt-0.5">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'text-[8px] h-4 px-1',
                                    img.source === 'extracted'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  )}
                                >
                                  {img.source === 'extracted' ? 'Embedded' : img.source}
                                </Badge>
                                {img.sizeBytes > 0 && (
                                  <span className="text-[8px] text-white/60">{formatSize(img.sizeBytes)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {filteredImages.length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        <Filter className="h-6 w-6 mx-auto opacity-20 mb-2" />
                        <p>No images match this filter</p>
                      </div>
                    )}
                  </div>

                  {/* Import button - sticky at bottom */}
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

              {/* Empty state */}
              {hasRun && extractedImages.length === 0 && !isExtracting && (
                <div className="text-center py-6 text-xs text-muted-foreground space-y-1">
                  <FileText className="h-10 w-10 mx-auto opacity-20" />
                  <p className="font-medium">No extractable images found</p>
                  <p className="text-[10px]">Upload PDFs or presentations with embedded photos to extract imagery</p>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Preview Lightbox Dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
          {previewImage && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] shrink-0',
                      previewImage.source === 'extracted'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    )}
                  >
                    {previewImage.source === 'extracted' ? 'Embedded' : previewImage.source}
                  </Badge>
                  <span className="text-sm font-medium truncate">{previewImage.title}</span>
                  {previewImage.sizeBytes > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">{formatSize(previewImage.sizeBytes)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant={selectedIds.has(previewImage.id) ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5 h-7"
                    onClick={() => toggleImage(previewImage.id)}
                  >
                    {selectedIds.has(previewImage.id) ? (
                      <><Check className="h-3 w-3" /> Selected</>
                    ) : (
                      <><Square className="h-3 w-3" /> Select</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Image preview */}
              <div className="flex-1 flex items-center justify-center p-4 bg-muted/20 overflow-auto min-h-[400px] max-h-[70vh]">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>

              {/* Footer nav */}
              <div className="flex items-center justify-between p-2 border-t border-border text-xs text-muted-foreground">
                <span>From: {previewImage.sourceDocument}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                    onClick={() => {
                      const idx = filteredImages.findIndex(i => i.id === previewImage.id);
                      if (idx > 0) setPreviewImage(filteredImages[idx - 1]);
                    }}
                    disabled={filteredImages.findIndex(i => i.id === previewImage.id) <= 0}
                  >
                    ← Previous
                  </Button>
                  <span className="flex items-center px-1">
                    {filteredImages.findIndex(i => i.id === previewImage.id) + 1} / {filteredImages.length}
                  </span>
                  <Button
                    variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                    onClick={() => {
                      const idx = filteredImages.findIndex(i => i.id === previewImage.id);
                      if (idx < filteredImages.length - 1) setPreviewImage(filteredImages[idx + 1]);
                    }}
                    disabled={filteredImages.findIndex(i => i.id === previewImage.id) >= filteredImages.length - 1}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
