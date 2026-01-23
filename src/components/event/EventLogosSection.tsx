import { useState } from 'react';
import { Plus, Trash2, Check, X, Image as ImageIcon } from 'lucide-react';
import { EventLogo } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventLogosSectionProps {
  logos: EventLogo[];
  onUpdate: (logos: EventLogo[]) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const LOGO_VARIANTS = [
  { value: 'event-primary', label: 'Event Primary' },
  { value: 'event-secondary', label: 'Event Secondary' },
  { value: 'co-branded', label: 'Co-Branded' },
  { value: 'date-lockup', label: 'Date Lockup' },
  { value: 'sponsor-lockup', label: 'Sponsor Lockup' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'horizontal', label: 'Horizontal' },
];

const getVariantColor = (variant: EventLogo['variant']) => {
  const colors: Record<string, string> = {
    'event-primary': 'bg-primary/10 text-primary',
    'event-secondary': 'bg-secondary/10 text-secondary-foreground',
    'co-branded': 'bg-blue-100 text-blue-800',
    'date-lockup': 'bg-green-100 text-green-800',
    'sponsor-lockup': 'bg-purple-100 text-purple-800',
    'stacked': 'bg-orange-100 text-orange-800',
    'horizontal': 'bg-gray-100 text-gray-800',
  };
  return colors[variant] || colors['event-primary'];
};

export const EventLogosSection = ({
  logos,
  onUpdate,
  isEditable = true,
  subtitle,
}: EventLogosSectionProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState<Partial<EventLogo>>({
    name: '',
    variant: 'event-primary',
    url: '',
  });

  const handleAdd = () => {
    if (!newItem.name || !newItem.url) return;
    
    const item: EventLogo = {
      id: crypto.randomUUID(),
      name: newItem.name,
      variant: newItem.variant as EventLogo['variant'],
      url: newItem.url,
      description: newItem.description,
    };
    
    onUpdate([...logos, item]);
    setNewItem({ name: '', variant: 'event-primary', url: '' });
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(logos.filter(l => l.id !== id));
  };

  // Group logos by variant
  const groupedLogos = logos.reduce((acc, logo) => {
    if (!acc[logo.variant]) acc[logo.variant] = [];
    acc[logo.variant].push(logo);
    return acc;
  }, {} as Record<string, EventLogo[]>);

  return (
    <section id="eventlogos" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Event Logos</h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: subtitle }} />
          ) : (
            <p className="text-muted-foreground mt-1">Event-specific logos, lockups, and co-branded marks</p>
          )}
        </div>
        {isEditable && (
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Logo
          </Button>
        )}
      </div>

      {isAddingNew && (
        <Card className="mb-6 border-dashed border-primary">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Conference 2026 Logo"
                />
              </div>
              <div className="space-y-2">
                <Label>Variant</Label>
                <Select
                  value={newItem.variant}
                  onValueChange={(value) => setNewItem({ ...newItem, variant: value as EventLogo['variant'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOGO_VARIANTS.map((variant) => (
                      <SelectItem key={variant.value} value={variant.value}>
                        {variant.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={newItem.url || ''}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Usage notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!newItem.name || !newItem.url}>
                <Check className="h-4 w-4 mr-2" />
                Add Logo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {logos.length === 0 && !isAddingNew ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No event logos yet</h3>
            <p className="text-muted-foreground mb-4">Add event-specific logos, date lockups, and co-branded marks</p>
            {isEditable && (
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Logo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {logos.map((logo) => (
            <Card key={logo.id} className="group relative overflow-hidden hover:border-primary/50 transition-colors">
              <div className="aspect-square bg-white flex items-center justify-center p-4 relative">
                <img
                  src={logo.url}
                  alt={logo.name}
                  className="max-w-full max-h-full object-contain"
                />
                <Badge className={cn("absolute top-2 left-2 text-xs", getVariantColor(logo.variant))}>
                  {LOGO_VARIANTS.find(v => v.value === logo.variant)?.label}
                </Badge>
              </div>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm truncate">{logo.name}</h4>
                    {logo.description && (
                      <p className="text-xs text-muted-foreground truncate">{logo.description}</p>
                    )}
                  </div>
                  {isEditable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleDelete(logo.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};
