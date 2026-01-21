import { useState } from 'react';
import { Plus, X, Briefcase, Upload, Palette, FileText, Share2, Zap, Settings, Users, Globe, Shield, Heart, Star, Sparkles, Layers, Package, Target, Award, TrendingUp, MessageSquare } from 'lucide-react';
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
  onServicesChange: (services: BrandService[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const ServicesSection = ({ services, onServicesChange, customSubtitle, onSubtitleChange }: ServicesSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<BrandService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Briefcase',
    imageUrl: '',
  });

  const openAddDialog = () => {
    setFormData({ name: '', description: '', icon: 'Briefcase', imageUrl: '' });
    setEditingService(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: BrandService) => {
    setFormData({
      name: service.name,
      description: service.description,
      icon: service.icon,
      imageUrl: service.imageUrl || '',
    });
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingService) {
      // Update existing
      onServicesChange(services.map(s => 
        s.id === editingService.id 
          ? { ...s, ...formData }
          : s
      ));
    } else {
      // Add new
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
    onServicesChange(services.filter(s => s.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Our Services"
        defaultSubtitle="What we offer to help your business grow"
        customSubtitle={customSubtitle}
        onSubtitleChange={onSubtitleChange}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
      />

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => {
          const IconComponent = getIconComponent(service.icon);
          return (
            <Card 
              key={service.id} 
              className="group relative bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              {isEditing && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => openEditDialog(service)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => handleDelete(service.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <CardContent className="p-6">
                {/* Icon or Image */}
                {service.imageUrl ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden mb-4">
                    <img 
                      src={service.imageUrl} 
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                )}
                <h3 className="font-semibold text-foreground mb-2">{service.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Service Card */}
        {isEditing && (
          <Card 
            className="border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors"
            onClick={openAddDialog}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[160px]">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Add Service</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {services.length === 0 && !isEditing && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No services added yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Click edit to add your services</p>
          </CardContent>
        </Card>
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
              <Label>Custom Image (optional)</Label>
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
