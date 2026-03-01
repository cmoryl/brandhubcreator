import { useState } from 'react';
import { Plus, X, Briefcase, Upload, Palette, FileText, Share2, Zap, Settings, Users, Globe, Shield, Heart, Star, Sparkles, Layers, Package, Target, Award, TrendingUp, MessageSquare, ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import { GuideEmptyState } from './GuideEmptyState';
import { BrandService } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from './SectionHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { toast } from 'sonner';

// Available icons for services
const SERVICE_ICONS = [
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Palette', icon: Palette },
  { name: 'FileText', icon: FileText },
  { name: 'Share2', icon: Share2 },
  { name: 'Zap', icon: Zap },
  { name: 'Settings', icon: Settings },
  { name: 'Users', icon: Users },
  { name: 'Globe', icon: Globe },
  { name: 'Shield', icon: Shield },
  { name: 'Heart', icon: Heart },
  { name: 'Star', icon: Star },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Layers', icon: Layers },
  { name: 'Package', icon: Package },
  { name: 'Target', icon: Target },
  { name: 'Award', icon: Award },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'MessageSquare', icon: MessageSquare },
];

const getIconComponent = (iconName: string) => {
  const found = SERVICE_ICONS.find(i => i.name === iconName);
  return found?.icon || Briefcase;
};

interface ServicesSectionProps {
  services: BrandService[];
  onServicesChange?: (services: BrandService[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
}

export const ServicesSection = ({ services, onServicesChange, customSubtitle, onSubtitleChange, entityId, entityType = 'brand' }: ServicesSectionProps) => {
  const canEdit = Boolean(onServicesChange);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { uploadFile } = useStorageUpload({ entityType, entityId });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<BrandService | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Briefcase',
    imageUrl: '',
    headerImage: '',
  });

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddDialog = () => {
    setFormData({ name: '', description: '', icon: 'Briefcase', imageUrl: '', headerImage: '' });
    setEditingService(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: BrandService) => {
    setFormData({
      name: service.name,
      description: service.description,
      icon: service.icon,
      imageUrl: service.imageUrl || '',
      headerImage: service.headerImage || '',
    });
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !onServicesChange) return;

    if (editingService) {
      onServicesChange(services.map(s => 
        s.id === editingService.id 
          ? { ...s, ...formData }
          : s
      ));
    } else {
      const newService: BrandService = {
        id: crypto.randomUUID(),
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        imageUrl: formData.imageUrl || undefined,
      };
      onServicesChange([...services, newService]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!onServicesChange) return;
    onServicesChange(services.filter(s => s.id !== id));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!entityId) {
      toast.error('Save the entity first to enable image uploads.');
      return;
    }
    setIsUploadingImage(true);
    try {
      const result = await uploadFile(file, 'asset', `service-img-${Date.now()}`);
      if (result?.url) setFormData(prev => ({ ...prev, imageUrl: result.url }));
    } finally { setIsUploadingImage(false); }
  };

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!entityId) {
      toast.error('Save the entity first to enable image uploads.');
      return;
    }
    setIsUploadingImage(true);
    try {
      const result = await uploadFile(file, 'asset', `service-header-${Date.now()}`);
      if (result?.url) setFormData(prev => ({ ...prev, headerImage: result.url }));
    } finally { setIsUploadingImage(false); }
  };

  // Determine if any service has an image (imageUrl or headerImage) for the full-width card layout
  const hasImages = services.some(s => s.imageUrl || s.headerImage);

  return (
    <section className="space-y-6 overflow-x-hidden">
      <SectionHeader
        title="Our Services"
        defaultSubtitle="What we offer to help your business grow"
        customSubtitle={customSubtitle}
        onSubtitleChange={canEdit ? onSubtitleChange : undefined}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
      />

      {/* Services Grid */}
      <div className="overflow-x-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {services.map((service) => {
          const IconComponent = getIconComponent(service.icon);
          const isExpanded = expandedIds.has(service.id);
          const cardImage = service.headerImage || service.imageUrl;
          const serviceLink = (service as any).link;

          return (
            <Card 
              key={service.id} 
              className="group relative bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
              onClick={() => toggleExpanded(service.id)}
            >
              {/* Full-width image banner */}
              {cardImage && (
                <div className="relative w-full h-40 sm:h-44 overflow-hidden">
                  <img 
                    src={cardImage} 
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                </div>
              )}

              {canEdit && isEditing && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-8 w-8 sm:h-7 sm:w-7"
                    onClick={(e) => { e.stopPropagation(); openEditDialog(service); }}
                    aria-label={`Edit ${service.name}`}
                  >
                    <Settings className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-8 w-8 sm:h-7 sm:w-7"
                    onClick={(e) => { e.stopPropagation(); handleDelete(service.id); }}
                    aria-label={`Delete ${service.name}`}
                  >
                    <X className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                </div>
              )}

              <CardContent className={cn(
                "p-4 sm:p-5",
                cardImage && "-mt-8 relative z-10"
              )}>
                {/* Icon fallback when no image */}
                {!cardImage && (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight">{service.name}</h3>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform duration-300",
                    isExpanded && "rotate-180"
                  )} />
                </div>

                {/* Collapsed: truncated description */}
                <p className={cn(
                  "text-xs sm:text-sm text-muted-foreground mt-1.5 transition-all duration-300",
                  !isExpanded && "line-clamp-2"
                )}>
                  {service.description}
                </p>

                {/* Expanded: full content + link */}
                {isExpanded && serviceLink && (
                  <a
                    href={serviceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 mt-3 font-medium transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Learn more <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Add Service Card */}
        {canEdit && isEditing && (
          <Card 
            className="border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors"
            onClick={openAddDialog}
          >
            <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center h-full min-h-[160px]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center mb-3 sm:mb-4">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Add Service</p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* Empty State */}
      {services.length === 0 && !isEditing && (
        <GuideEmptyState
          icon={Briefcase}
          title="Define Your Services"
          description="List core services or capabilities to give visitors a clear picture of what your brand offers."
          actionLabel="Add First Service"
          onAction={() => canEdit && setIsEditing(true)}
          canEdit={canEdit}
          readOnlyHint="Services will appear here once defined"
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Brand Strategy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the service"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={formData.icon} onValueChange={(v) => setFormData(prev => ({ ...prev, icon: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_ICONS.map(({ name, icon: Icon }) => (
                    <SelectItem key={name} value={name}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Header Image (spans full card width)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderImageUpload}
                  className="flex-1"
                />
                {formData.headerImage && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setFormData(prev => ({ ...prev, headerImage: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {formData.headerImage && (
                <div className="w-full h-20 rounded-lg overflow-hidden border mt-2">
                  <img src={formData.headerImage} alt="Header Preview" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Custom Icon Image (optional, small)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1"
                />
                {formData.imageUrl && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {formData.imageUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border mt-2">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>
              {editingService ? 'Save Changes' : 'Add Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
