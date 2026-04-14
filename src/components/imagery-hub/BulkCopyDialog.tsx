/**
 * BulkCopyDialog - Copy selected images to another entity
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ImageIcon } from 'lucide-react';
import { ApprovedImage } from '@/types/brand';
import { ImageryEntity } from '@/hooks/useImageryHubEntities';

interface BulkCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ApprovedImage[];
  sourceSectionName: string;
  entities: ImageryEntity[];
  currentEntityId: string;
  onCopy: (targetEntityId: string, targetEntityType: 'brand' | 'product' | 'event', sectionName: string) => void;
}

export const BulkCopyDialog = ({
  open, onOpenChange, images, sourceSectionName, entities, currentEntityId, onCopy,
}: BulkCopyDialogProps) => {
  const [targetEntityId, setTargetEntityId] = useState('_none');
  const [sectionName, setSectionName] = useState(sourceSectionName);

  const targetEntity = entities.find(e => e.id === targetEntityId);

  const handleCopy = () => {
    if (!targetEntity || !sectionName.trim()) return;
    onCopy(targetEntity.id, targetEntity.type, sectionName.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Copy Images to Entity
          </DialogTitle>
          <DialogDescription>
            Copy {images.length} image{images.length !== 1 ? 's' : ''} to another brand, product, or event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Preview */}
          <div className="flex gap-1.5 overflow-hidden">
            {images.slice(0, 5).map(img => (
              <div key={img.id} className="w-14 h-14 rounded-md overflow-hidden shrink-0 bg-muted/30">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {images.length > 5 && (
              <div className="w-14 h-14 rounded-md bg-muted/50 flex items-center justify-center text-xs text-muted-foreground shrink-0">
                +{images.length - 5}
              </div>
            )}
          </div>

          {/* Target Entity */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Target Entity</label>
            <Select value={targetEntityId} onValueChange={setTargetEntityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Select an entity...</SelectItem>
                {entities.filter(e => e.id !== currentEntityId).map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      {e.name}
                      <Badge variant="secondary" className="text-[10px]">{e.type}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Target Category</label>
            <Input
              value={sectionName}
              onChange={e => setSectionName(e.target.value)}
              placeholder="e.g. People & Portraits"
            />
            <p className="text-xs text-muted-foreground">Images will be added to this category. Created if it doesn't exist.</p>
          </div>

          <Button
            onClick={handleCopy}
            disabled={!targetEntity || !sectionName.trim()}
            className="w-full gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Copy {images.length} Image{images.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
