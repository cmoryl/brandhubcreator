import { useState } from 'react';
import { Plus, Trash2, Check, X, Image as ImageIcon, Mail, Globe, Share2, Download, Eye } from 'lucide-react';
import { EventBanner } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PreviewDialog } from '@/components/ui/preview-dialog';

interface EventBannersSectionProps {
  banners: EventBanner[];
  onUpdate: (banners: EventBanner[]) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const BANNER_TYPES = [
  { value: 'email-header', label: 'Email Header', icon: Mail, category: 'email' },
  { value: 'social-cover', label: 'Social Cover', icon: Share2, category: 'social' },
  { value: 'website-hero', label: 'Website Hero', icon: Globe, category: 'web' },
  { value: 'landing-page', label: 'Landing Page', icon: Globe, category: 'web' },
  { value: 'countdown', label: 'Countdown', icon: ImageIcon, category: 'promo' },
  { value: 'save-the-date', label: 'Save the Date', icon: Mail, category: 'email' },
  { value: 'thank-you', label: 'Thank You', icon: Mail, category: 'email' },
  { value: 'promotional', label: 'Promotional', icon: ImageIcon, category: 'promo' },
];

const CATEGORIES = [
  { value: 'all', label: 'All Banners' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social' },
  { value: 'web', label: 'Website' },
  { value: 'promo', label: 'Promotional' },
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

const getAspectRatio = (dimensions: string): string => {
  const match = dimensions.match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) return 'aspect-[16/9]';
  const w = parseInt(match[1]);
  const h = parseInt(match[2]);
  const ratio = w / h;
  if (ratio > 2.5) return 'aspect-[3/1]';
  if (ratio > 1.5) return 'aspect-[16/9]';
  if (ratio > 0.8) return 'aspect-square';
  return 'aspect-[9/16]';
};

export const EventBannersSection = ({
  banners,
  onUpdate,
  isEditable = true,
  subtitle,
}: EventBannersSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<EventBanner | null>(null);
  const [newItem, setNewItem] = useState<Partial<EventBanner>>({
    name: '',
    type: 'email-header',
    dimensions: '',
    platform: '',
  });

  const openPreview = (item: EventBanner) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

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
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(banners.filter(b => b.id !== id));
  };

  // Filter banners by category
  const filteredBanners = activeCategory === 'all' 
    ? banners 
    : banners.filter(b => {
        const typeInfo = BANNER_TYPES.find(t => t.value === b.type);
        return typeInfo?.category === activeCategory;
      });

  // Get counts by category
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    if (cat.value === 'all') {
      acc[cat.value] = banners.length;
    } else {
      acc[cat.value] = banners.filter(b => {
        const typeInfo = BANNER_TYPES.find(t => t.value === b.type);
        return typeInfo?.category === cat.value;
      }).length;
    }
    return acc;
  }, {} as Record<string, number>);

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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Digital Banner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                <Button onClick={handleAdd} className="w-full" disabled={!newItem.name || !newItem.dimensions}>
                  Add Banner
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Tabs */}
      {banners.length > 0 && (
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            {CATEGORIES.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value} 
                className="text-xs"
                disabled={categoryCounts[cat.value] === 0 && cat.value !== 'all'}
              >
                {cat.label} ({categoryCounts[cat.value]})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {banners.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No digital banners yet</h3>
            <p className="text-muted-foreground mb-4">Add email headers, social covers, and promotional graphics</p>
            {isEditable && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Banner
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBanners.map((banner) => (
            <Card key={banner.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
              {banner.previewUrl ? (
                <div className={cn("bg-muted relative", getAspectRatio(banner.dimensions || ''))}>
                  <img
                    src={banner.previewUrl}
                    alt={banner.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className={cn("absolute top-2 left-2 text-xs", getTypeColor(banner.type))}>
                    {BANNER_TYPES.find(t => t.value === banner.type)?.label}
                  </Badge>
                </div>
              ) : (
                <div className={cn(
                  "bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative",
                  getAspectRatio(banner.dimensions || '')
                )}>
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground font-mono">{banner.dimensions}</p>
                  </div>
                  <Badge className={cn("absolute top-2 left-2 text-xs", getTypeColor(banner.type))}>
                    {BANNER_TYPES.find(t => t.value === banner.type)?.label}
                  </Badge>
                </div>
              )}
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm truncate">{banner.name}</h4>
                    <p className="text-xs text-muted-foreground">{banner.dimensions}</p>
                    {banner.platform && (
                      <Badge variant="outline" className="mt-1.5 text-xs">
                        {banner.platform}
                      </Badge>
                    )}
                  </div>
                  {isEditable && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  {banner.previewUrl && (
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => openPreview(banner)}>
                      <Eye className="h-3 w-3 mr-1.5" />
                      Preview
                    </Button>
                  )}
                  {banner.templateUrl && (
                    <Button variant="default" size="sm" className="flex-1 text-xs h-8" asChild>
                      <a href={banner.templateUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3 mr-1.5" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {banners.length > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Total Banners:</span>
              <span className="ml-2 font-medium">{banners.length}</span>
            </div>
            {Object.entries(categoryCounts).filter(([k, v]) => k !== 'all' && v > 0).map(([cat, count]) => (
              <div key={cat}>
                <span className="text-muted-foreground capitalize">{cat}:</span>
                <span className="ml-2 font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewItem?.name || 'Banner Preview'}
        previewUrl={previewItem?.previewUrl}
        externalUrl={previewItem?.previewUrl}
        type="image"
      />
    </section>
  );
};
