import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Maximize, FileImage } from 'lucide-react';
import { EventSignage } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventSignageSectionProps {
  signage: EventSignage[];
  onUpdate: (signage: EventSignage[]) => void;
  isEditable?: boolean;
  subtitle?: string;
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
}: EventSignageSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
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
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(signage.filter(s => s.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<EventSignage>) => {
    onUpdate(signage.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <section id="eventsignage" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Event Signage</h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: subtitle }} />
          ) : (
            <p className="text-muted-foreground mt-1">Physical signage specifications for booth, banners, and venue graphics</p>
          )}
        </div>
        {isEditable && (
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Signage
          </Button>
        )}
      </div>

      {isAddingNew && (
        <Card className="mb-6 border-dashed border-primary">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label>Dimensions</Label>
                <Input
                  value={newItem.dimensions || ''}
                  onChange={(e) => setNewItem({ ...newItem, dimensions: e.target.value })}
                  placeholder="10ft x 8ft"
                />
              </div>
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
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  value={newItem.notes || ''}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Installation notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!newItem.name || !newItem.dimensions}>
                <Check className="h-4 w-4 mr-2" />
                Add Signage
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {signage.length === 0 && !isAddingNew ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Maximize className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No signage specifications yet</h3>
            <p className="text-muted-foreground mb-4">Add booth backdrops, banners, and other physical event signage</p>
            {isEditable && (
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Signage
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signage.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden">
              {item.previewUrl ? (
                <div className="aspect-[16/9] bg-muted relative">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className={cn("absolute top-2 left-2", getTypeColor(item.type))}>
                    {SIGNAGE_TYPES.find(t => t.value === item.type)?.label}
                  </Badge>
                </div>
              ) : (
                <div className="aspect-[16/9] bg-muted flex items-center justify-center relative">
                  <FileImage className="h-12 w-12 text-muted-foreground/30" />
                  <Badge className={cn("absolute top-2 left-2", getTypeColor(item.type))}>
                    {SIGNAGE_TYPES.find(t => t.value === item.type)?.label}
                  </Badge>
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{item.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.dimensions}</p>
                {item.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.notes}</p>
                )}
                {isEditable && (
                  <div className="flex gap-2 mt-3">
                    {item.templateUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.templateUrl} target="_blank" rel="noopener noreferrer">
                          Download Template
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};
