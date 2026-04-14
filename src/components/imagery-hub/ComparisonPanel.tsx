/**
 * ComparisonPanel - Side-by-side imagery comparison between two entities
 */
import { useState } from 'react';
import { X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ImageryEntity } from '@/hooks/useImageryHubEntities';
import { useEntityImagery } from '@/hooks/useEntityImagery';

interface ComparisonPanelProps {
  entities: ImageryEntity[];
  primaryEntity: ImageryEntity;
  onClose: () => void;
}

export const ComparisonPanel = ({ entities, primaryEntity, onClose }: ComparisonPanelProps) => {
  const [compareEntityId, setCompareEntityId] = useState<string>('_none');

  const compareEntity = entities.find(e => e.id === compareEntityId);
  const { sections: primarySections } = useEntityImagery({ entityId: primaryEntity.id, entityType: primaryEntity.type });
  const { sections: compareSections } = useEntityImagery({
    entityId: compareEntity?.id,
    entityType: compareEntity?.type || 'brand',
  });

  const renderImageGrid = (images: { id: string; url: string; description?: string }[]) => (
    <div className="grid grid-cols-3 gap-2">
      {images.slice(0, 12).map(img => (
        <div key={img.id} className="aspect-square rounded-md overflow-hidden bg-muted/30">
          <img src={img.url} alt={img.description || ''} className="w-full h-full object-cover" />
        </div>
      ))}
      {images.length > 12 && (
        <div className="aspect-square rounded-md bg-muted/50 flex items-center justify-center text-sm text-muted-foreground">
          +{images.length - 12} more
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Side-by-Side Comparison</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-2 divide-x divide-border overflow-hidden">
        {/* Left: Primary Entity */}
        <div className="flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary/10">
                <ImageIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{primaryEntity.name}</p>
                <Badge variant="secondary" className="text-[10px]">{primaryEntity.type}</Badge>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {primarySections.map(section => (
                <div key={section.id}>
                  <h4 className="text-sm font-medium mb-2">{section.name} ({section.images.length})</h4>
                  {section.images.length > 0 ? renderImageGrid(section.images) : (
                    <p className="text-xs text-muted-foreground">No images</p>
                  )}
                </div>
              ))}
              {primarySections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No approved imagery</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Compare Entity */}
        <div className="flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <Select value={compareEntityId} onValueChange={setCompareEntityId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select entity to compare..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Select an entity...</SelectItem>
                {entities.filter(e => e.id !== primaryEntity.id).map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({e.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1 p-4">
            {!compareEntity ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageIcon className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Select an entity to compare</p>
              </div>
            ) : (
              <div className="space-y-4">
                {compareSections.map(section => (
                  <div key={section.id}>
                    <h4 className="text-sm font-medium mb-2">{section.name} ({section.images.length})</h4>
                    {section.images.length > 0 ? renderImageGrid(section.images) : (
                      <p className="text-xs text-muted-foreground">No images</p>
                    )}
                  </div>
                ))}
                {compareSections.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No approved imagery</p>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
