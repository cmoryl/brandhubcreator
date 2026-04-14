/**
 * BatchOperationsToolbar - Batch operations for selected images
 * Supports bulk tagging, bulk quality scoring, bulk move/delete, and export
 */
import { useState, useCallback } from 'react';
import { Tags, Star, Trash2, FolderInput, Download, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ApprovedImage, ApprovedImagerySubSection } from '@/types/brand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BatchOperationsToolbarProps {
  selectedImages: Map<string, ApprovedImage>;
  sections: ApprovedImagerySubSection[];
  entityId?: string;
  entityType?: string;
  onBulkTag: (tag: string) => void;
  onBulkRemoveTag: (tag: string) => void;
  onBulkDelete: () => void;
  onBulkMove: (targetSectionId: string) => void;
  onBulkQualityScore: (scores: Map<string, { score: number; details: ApprovedImage['qualityDetails'] }>) => void;
  onClearSelection: () => void;
}

export const BatchOperationsToolbar = ({
  selectedImages, sections, entityId, entityType,
  onBulkTag, onBulkRemoveTag, onBulkDelete, onBulkMove, onBulkQualityScore, onClearSelection,
}: BatchOperationsToolbarProps) => {
  const [newTag, setNewTag] = useState('');
  const [scoring, setScoring] = useState(false);
  const [moveTarget, setMoveTarget] = useState('');

  const handleAddTag = useCallback(() => {
    if (!newTag.trim()) return;
    onBulkTag(newTag.trim());
    setNewTag('');
    toast.success(`Tag "${newTag.trim()}" added to ${selectedImages.size} images`);
  }, [newTag, onBulkTag, selectedImages.size]);

  const handleBulkScore = useCallback(async () => {
    const images = Array.from(selectedImages.values());
    const urls = images.map(img => img.url || img.thumbnailUrl);
    
    // Score in batches of 10
    setScoring(true);
    const scoreMap = new Map<string, { score: number; details: ApprovedImage['qualityDetails'] }>();

    try {
      for (let i = 0; i < urls.length; i += 10) {
        const batch = urls.slice(i, i + 10);
        const batchImages = images.slice(i, i + 10);
        
        const { data, error } = await supabase.functions.invoke('imagery-quality-score', {
          body: { imageUrls: batch, entityId, entityType },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        (data.scores || []).forEach((s: any) => {
          const img = batchImages[s.index];
          if (img) {
            scoreMap.set(img.id, {
              score: s.overall,
              details: {
                resolution: s.resolution,
                composition: s.composition,
                brandAlignment: s.brandAlignment,
                technicalQuality: s.technicalQuality,
                notes: s.notes,
              },
            });
          }
        });
      }

      onBulkQualityScore(scoreMap);
      toast.success(`Scored ${scoreMap.size} images`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to score images');
    } finally {
      setScoring(false);
    }
  }, [selectedImages, entityId, entityType, onBulkQualityScore]);

  const handleMove = useCallback(() => {
    if (!moveTarget) return;
    onBulkMove(moveTarget);
    setMoveTarget('');
  }, [moveTarget, onBulkMove]);

  const handleExport = useCallback(() => {
    const images = Array.from(selectedImages.values());
    const csv = [
      'ID,Title,URL,Source,Tags,Quality Score',
      ...images.map(img =>
        `"${img.id}","${img.title}","${img.url}","${img.source}","${(img.tags || []).join('; ')}","${img.qualityScore || 'N/A'}"`
      ),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected-images.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported image data');
  }, [selectedImages]);

  if (selectedImages.size === 0) return null;

  return (
    <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected</span>
        <Button variant="ghost" size="default" className="h-9" onClick={onClearSelection}>
          <X className="h-4 w-4 mr-1.5" /> Clear
        </Button>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Bulk Tag */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add tag..."
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
            className="w-36 h-9"
          />
          <Button size="default" variant="outline" className="h-9 gap-2" onClick={handleAddTag} disabled={!newTag.trim()}>
            <Tags className="h-4 w-4" /> Tag
          </Button>
        </div>

        {/* Bulk Quality Score */}
        <Button size="default" variant="outline" className="h-9 gap-2" onClick={handleBulkScore} disabled={scoring}>
          {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
          Score All
        </Button>

        {/* Bulk Move */}
        <div className="flex items-center gap-2">
          <Select value={moveTarget} onValueChange={setMoveTarget}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Move to..." />
            </SelectTrigger>
            <SelectContent>
              {sections.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="default" variant="outline" className="h-9 gap-2" onClick={handleMove} disabled={!moveTarget}>
            <FolderInput className="h-4 w-4" /> Move
          </Button>
        </div>

        {/* Export */}
        <Button size="default" variant="outline" className="h-9 gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export
        </Button>

        {/* Bulk Delete */}
        <Button size="default" variant="destructive" className="h-9 gap-2" onClick={onBulkDelete}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
    </div>
  );
};
