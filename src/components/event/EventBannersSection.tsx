import { useState } from 'react';
import { Plus, Trash2, Check, X, Image as ImageIcon, Mail, Globe, Share2 } from 'lucide-react';
import { EventBanner } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventBannersSectionProps {
  banners: EventBanner[];
  onUpdate: (banners: EventBanner[]) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const BANNER_TYPES = [
  { value: 'email-header', label: 'Email Header', icon: Mail },
  { value: 'social-cover', label: 'Social Cover', icon: Share2 },
  { value: 'website-hero', label: 'Website Hero', icon: Globe },
  { value: 'landing-page', label: 'Landing Page', icon: Globe },
  { value: 'countdown', label: 'Countdown', icon: ImageIcon },
  { value: 'save-the-date', label: 'Save the Date', icon: Mail },
  { value: 'thank-you', label: 'Thank You', icon: Mail },
  { value: 'promotional', label: 'Promotional', icon: ImageIcon },
];

const getTypeColor = (type: EventBanner['type']) => {
  const colors: Record<string, string> = {
    'email-header': 'bg-blue-100 text-blue-800',
    'social-cover': 'bg-purple-100 text-purple-800',
    'website-hero': 'bg-green-100 text-green-800',
    'landing-page': 'bg-teal-100 text-teal-800',
    'countdown': 'bg-orange-100 text-orange-800',
    'save-the-date': 'bg-pink-100 text-pink-800',
    'thank-you': 'bg-indigo-100 text-indigo-800',
    'promotional': 'bg-yellow-100 text-yellow-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const EventBannersSection = ({
  banners,
  onUpdate,
  isEditable = true,
  subtitle,
}: EventBannersSectionProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState<Partial<EventBanner>>({
    name: '',
    type: 'email-header',
    dimensions: '',
    platform: '',
  });

  const handleAdd = () => {
    if (!newItem.name || !newItem.dimensions) return;
    
    const item: EventBanner = {
      id: crypto.randomUUID(),
      name: newItem.name,
      type: newItem.type as EventBanner['type'],
      dimensions: newItem.dimensions,
      previewUrl: newItem.previewUrl,
      templateUrl: newItem.templateUrl,
      platform: newItem.platform,
      notes: newItem.notes,
    };
    
    onUpdate([...banners, item]);
    setNewItem({ name: '', type: 'email-header', dimensions: '', platform: '' });
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(banners.filter(b => b.id !== id));
  };

  // Group banners by type
  const groupedBanners = banners.reduce((acc, banner) => {
    if (!acc[banner.type]) acc[banner.type] = [];
    acc[banner.type].push(banner);
    return acc;
  }, {} as Record<string, EventBanner[]>);

  return (
    <section id="eventbanners" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Digital Banners</h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: subtitle }} />
          ) : (
            <p className="text-muted-foreground mt-1">Email headers, social covers, and promotional graphics</p>
          )}
        </div>
        {isEditable && (
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
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
                  placeholder="LinkedIn Event Cover"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newItem.type}
                  onValueChange={(value) => setNewItem({ ...newItem, type: value as EventBanner['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BANNER_TYPES.map((type) => (
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
                  placeholder="1200 x 628 px"
                />
              </div>
              <div className="space-y-2">
                <Label>Platform (optional)</Label>
                <Input
                  value={newItem.platform || ''}
                  onChange={(e) => setNewItem({ ...newItem, platform: e.target.value })}
                  placeholder="LinkedIn, Twitter, etc."
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
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!newItem.name || !newItem.dimensions}>
                <Check className="h-4 w-4 mr-2" />
                Add Banner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {banners.length === 0 && !isAddingNew ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No digital banners yet</h3>
            <p className="text-muted-foreground mb-4">Add email headers, social covers, and promotional graphics</p>
            {isEditable && (
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Banner
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBanners).map(([type, items]) => (
            <div key={type}>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                {BANNER_TYPES.find(t => t.value === type)?.label || type}
                <Badge variant="secondary" className="font-normal">
                  {items.length}
                </Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((banner) => (
                  <Card key={banner.id} className="group relative overflow-hidden">
                    {banner.previewUrl ? (
                      <div className="aspect-[16/9] bg-muted">
                        <img
                          src={banner.previewUrl}
                          alt={banner.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">{banner.dimensions}</p>
                        </div>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium truncate">{banner.name}</h4>
                          <p className="text-sm text-muted-foreground">{banner.dimensions}</p>
                          {banner.platform && (
                            <Badge variant="outline" className="mt-2">
                              {banner.platform}
                            </Badge>
                          )}
                        </div>
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive shrink-0"
                            onClick={() => handleDelete(banner.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {banner.templateUrl && (
                        <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                          <a href={banner.templateUrl} target="_blank" rel="noopener noreferrer">
                            Download Template
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
