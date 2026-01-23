import { useState } from 'react';
import { Plus, Trash2, Check, X, Maximize, FileImage, Download, ExternalLink, Edit2 } from 'lucide-react';
import { EventSignage } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LayoutSelector, LayoutPreset, useLayoutClasses } from '@/components/brand/LayoutSelector';

interface EventSignageSectionProps {
  signage: EventSignage[];
  onUpdate: (signage: EventSignage[]) => void;
  isEditable?: boolean;
  subtitle?: string;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
}

const SIGNAGE_TYPES = [
  { value: 'booth-backdrop', label: 'Booth Backdrop' },
  { value: 'pull-up-banner', label: 'Pull-Up Banner' },
  { value: 'table-banner', label: 'Table Banner' },
  { value: 'hanging-sign', label: 'Hanging Sign' },
  { value: 'floor-graphic', label: 'Floor Graphic' },
  { value: 'directional', label: 'Directional Sign' },
  { value: 'podium-sign', label: 'Podium Sign' },
  { value: 'stage-backdrop', label: 'Stage Backdrop' },
  { value: 'outdoor-banner', label: 'Outdoor Banner' },
  { value: 'other', label: 'Other' },
];

const getTypeColor = (type: EventSignage['type']) => {
  const colors: Record<string, string> = {
    'booth-backdrop': 'bg-blue-100 text-blue-800',
    'pull-up-banner': 'bg-green-100 text-green-800',
    'table-banner': 'bg-purple-100 text-purple-800',
    'hanging-sign': 'bg-orange-100 text-orange-800',
    'floor-graphic': 'bg-pink-100 text-pink-800',
    'directional': 'bg-cyan-100 text-cyan-800',
    'podium-sign': 'bg-amber-100 text-amber-800',
    'stage-backdrop': 'bg-indigo-100 text-indigo-800',
    'outdoor-banner': 'bg-yellow-100 text-yellow-800',
    'other': 'bg-gray-100 text-gray-800',
  };
  return colors[type] || colors.other;
};

export const EventSignageSection = ({
  signage,
  onUpdate,
  isEditable = true,
  subtitle,
  layout = 'grid-3',
  onLayoutChange,
}: EventSignageSectionProps) => {
  const { gridClass, cardClass, isListView } = useLayoutClasses(layout);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<EventSignage>>({
    name: '',
    type: 'booth-backdrop',
    dimensions: '',
    notes: '',
  });

  const handleAdd = () => {
    if (!newItem.name || !newItem.dimensions) return;
    
    const item: EventSignage = {
      id: crypto.randomUUID(),
      name: newItem.name,
      type: newItem.type as EventSignage['type'],
      dimensions: newItem.dimensions,
      previewUrl: newItem.previewUrl,
      templateUrl: newItem.templateUrl,
      notes: newItem.notes,
      specifications: newItem.specifications,
    };
    
    onUpdate([...signage, item]);
    setNewItem({ name: '', type: 'booth-backdrop', dimensions: '', notes: '' });
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(signage.filter(s => s.id !== id));
  };

  // Group by type
  const groupedSignage = signage.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, EventSignage[]>);

  return (
    <section id="eventsignage" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold">Event Signage</h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: subtitle }} />
          ) : (
            <p className="text-muted-foreground mt-1">Physical signage specifications for booth, banners, and venue graphics</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditable && onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'grid-4', 'list']}
              size="sm"
            />
          )}
          {isEditable && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Signage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Event Signage</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newItem.name || ''}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Main Booth Backdrop"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newItem.type}
                      onValueChange={(value) => setNewItem({ ...newItem, type: value as EventSignage['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIGNAGE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dimensions</Label>
                  <Input
                    value={newItem.dimensions || ''}
                    onChange={(e) => setNewItem({ ...newItem, dimensions: e.target.value })}
                    placeholder="10ft x 8ft"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preview URL (optional)</Label>
                    <Input
                      value={newItem.previewUrl || ''}
                      onChange={(e) => setNewItem({ ...newItem, previewUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Template URL (optional)</Label>
                    <Input
                      value={newItem.templateUrl || ''}
                      onChange={(e) => setNewItem({ ...newItem, templateUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes / Specifications (optional)</Label>
                  <Textarea
                    value={newItem.notes || ''}
                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    placeholder="Material, installation notes, vendor details..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={!newItem.name || !newItem.dimensions}>
                  Add Signage
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {signage.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Maximize className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No signage specifications yet</h3>
            <p className="text-muted-foreground mb-4">Add booth backdrops, banners, and other physical event signage</p>
            {isEditable && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Signage
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSignage).map(([type, items]) => (
            <div key={type}>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                {SIGNAGE_TYPES.find(t => t.value === type)?.label || type}
                <Badge variant="secondary" className="font-normal">
                  {items.length}
                </Badge>
              </h3>
              <div className={gridClass}>
                {items.map((item) => (
                  <Card key={item.id} className="group relative overflow-hidden hover:border-primary/50 transition-colors">
                    {item.previewUrl ? (
                      <div className="aspect-[16/9] bg-muted relative">
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <Badge className={cn("absolute top-2 left-2", getTypeColor(item.type))}>
                          {item.dimensions}
                        </Badge>
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                        <div className="text-center">
                          <FileImage className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm font-mono text-muted-foreground">{item.dimensions}</p>
                        </div>
                        <Badge className={cn("absolute top-2 left-2", getTypeColor(item.type))}>
                          {SIGNAGE_TYPES.find(t => t.value === item.type)?.label}
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.dimensions}</p>
                        </div>
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.notes}</p>
                      )}
                      
                      {/* Action Buttons - Always visible */}
                      <div className="flex gap-2">
                        {item.previewUrl && (
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <a href={item.previewUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                              Preview
                            </a>
                          </Button>
                        )}
                        {item.templateUrl && (
                          <Button variant="default" size="sm" className="flex-1" asChild>
                            <a href={item.templateUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Download
                            </a>
                          </Button>
                        )}
                        {!item.previewUrl && !item.templateUrl && (
                          <span className="text-xs text-muted-foreground italic">No files attached</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {signage.length > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Total Items:</span>
              <span className="ml-2 font-medium">{signage.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Types:</span>
              <span className="ml-2 font-medium">{Object.keys(groupedSignage).length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">With Templates:</span>
              <span className="ml-2 font-medium">{signage.filter(s => s.templateUrl).length}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
