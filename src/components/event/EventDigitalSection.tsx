import { useState } from 'react';
import { Plus, Trash2, Check, X, FileText, Monitor, Smartphone, Presentation, IdCard, Map, Calendar } from 'lucide-react';
import { EventDigitalMaterial } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventDigitalSectionProps {
  materials: EventDigitalMaterial[];
  onUpdate: (materials: EventDigitalMaterial[]) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const MATERIAL_TYPES = [
  { value: 'email-template', label: 'Email Template', icon: FileText },
  { value: 'landing-page', label: 'Landing Page', icon: Monitor },
  { value: 'social-post', label: 'Social Post', icon: FileText },
  { value: 'virtual-background', label: 'Virtual Background', icon: Monitor },
  { value: 'presentation-template', label: 'Presentation', icon: Presentation },
  { value: 'name-badge', label: 'Name Badge', icon: IdCard },
  { value: 'agenda', label: 'Agenda', icon: Calendar },
  { value: 'map', label: 'Venue Map', icon: Map },
  { value: 'mobile-app', label: 'Mobile App', icon: Smartphone },
  { value: 'other', label: 'Other', icon: FileText },
];

const getTypeIcon = (type: EventDigitalMaterial['type']) => {
  return MATERIAL_TYPES.find(t => t.value === type)?.icon || FileText;
};

export const EventDigitalSection = ({
  materials,
  onUpdate,
  isEditable = true,
  subtitle,
}: EventDigitalSectionProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState<Partial<EventDigitalMaterial>>({
    name: '',
    type: 'email-template',
    description: '',
  });

  const handleAdd = () => {
    if (!newItem.name) return;
    
    const item: EventDigitalMaterial = {
      id: crypto.randomUUID(),
      name: newItem.name,
      type: newItem.type as EventDigitalMaterial['type'],
      previewUrl: newItem.previewUrl,
      templateUrl: newItem.templateUrl,
      fileType: newItem.fileType,
      description: newItem.description,
    };
    
    onUpdate([...materials, item]);
    setNewItem({ name: '', type: 'email-template', description: '' });
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(materials.filter(m => m.id !== id));
  };

  return (
    <section id="eventdigital" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Digital Materials</h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: subtitle }} />
          ) : (
            <p className="text-muted-foreground mt-1">Email templates, presentations, badges, and other digital assets</p>
          )}
        </div>
        {isEditable && (
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
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
                  placeholder="Invitation Email Template"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newItem.type}
                  onValueChange={(value) => setNewItem({ ...newItem, type: value as EventDigitalMaterial['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File Type (optional)</Label>
                <Input
                  value={newItem.fileType || ''}
                  onChange={(e) => setNewItem({ ...newItem, fileType: e.target.value })}
                  placeholder="HTML, PPTX, PDF, etc."
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
                <Label>Description (optional)</Label>
                <Input
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Brief description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!newItem.name}>
                <Check className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {materials.length === 0 && !isAddingNew ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No digital materials yet</h3>
            <p className="text-muted-foreground mb-4">Add email templates, presentations, and other digital assets</p>
            {isEditable && (
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Material
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {materials.map((material) => {
            const Icon = getTypeIcon(material.type);
            return (
              <Card key={material.id} className="group hover:border-primary/50 transition-colors overflow-hidden">
                <CardContent className="p-0">
                  {/* Document-sized preview area */}
                  <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative">
                    {material.previewUrl ? (
                      <img 
                        src={material.previewUrl} 
                        alt={material.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                        <Icon className="h-8 w-8" />
                        {material.fileType && (
                          <span className="text-[10px] font-medium uppercase tracking-wider">
                            {material.fileType}
                          </span>
                        )}
                      </div>
                    )}
                    {isEditable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 text-destructive hover:text-destructive bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {/* Compact info area */}
                  <div className="p-2 space-y-1">
                    <h4 className="font-medium text-xs truncate">{material.name}</h4>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {MATERIAL_TYPES.find(t => t.value === material.type)?.label}
                    </p>
                    {material.templateUrl && (
                      <Button variant="outline" size="sm" className="w-full h-6 text-[10px] mt-1" asChild>
                        <a href={material.templateUrl} target="_blank" rel="noopener noreferrer">
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};
