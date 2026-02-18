import { useState, useRef } from 'react';
import { Plus, Trash2, Check, X, FileText, Monitor, Smartphone, Presentation, IdCard, Map, Calendar, Download, ExternalLink, FolderOpen, BookOpen, File, Image as ImageIcon, Upload, Link, Mail, Globe, Share2, Eye, Maximize2, Printer } from 'lucide-react';
import { EventDigitalMaterial, EventBanner, EventPrintMaterial } from '@/types/event';
import { BrandTemplate, BrandBrochure } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { RichTextDisplay } from '@/components/ui/rich-text-editor';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { toast } from 'sonner';

interface EventDigitalSectionProps {
  materials: EventDigitalMaterial[];
  onUpdate: (materials: EventDigitalMaterial[]) => void;
  banners?: EventBanner[];
  onBannersChange?: (banners: EventBanner[]) => void;
  templates?: BrandTemplate[];
  onTemplatesChange?: (templates: BrandTemplate[]) => void;
  brochures?: BrandBrochure[];
  onBrochuresChange?: (brochures: BrandBrochure[]) => void;
  printMaterials?: EventPrintMaterial[];
  onPrintMaterialsChange?: (materials: EventPrintMaterial[]) => void;
  isEditable?: boolean;
  subtitle?: string;
  eventId?: string;
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

const PRINT_MATERIAL_TYPES = [
  { value: 'flyer', label: 'Flyer', icon: FileText },
  { value: 'poster', label: 'Poster', icon: ImageIcon },
  { value: 'brochure', label: 'Brochure', icon: BookOpen },
  { value: 'banner', label: 'Banner', icon: Printer },
  { value: 'business-card', label: 'Business Card', icon: IdCard },
  { value: 'badge', label: 'Badge', icon: IdCard },
  { value: 'signage', label: 'Signage', icon: Presentation },
  { value: 'sticker', label: 'Sticker', icon: FileText },
  { value: 'other', label: 'Other', icon: FileText },
];

const TEMPLATE_TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'spreadsheet', label: 'Spreadsheet' },
  { value: 'design', label: 'Design File' },
  { value: 'other', label: 'Other' },
];

const getTypeIcon = (type: EventDigitalMaterial['type']) => {
  return MATERIAL_TYPES.find(t => t.value === type)?.icon || FileText;
};

// Banner type config
const BANNER_TYPES = [
  { value: 'email-header', label: 'Email Header', icon: Mail, category: 'email' },
  { value: 'social-cover', label: 'Social Cover', icon: Share2, category: 'social' },
  { value: 'social-banner', label: 'Social Banner', icon: Share2, category: 'social' },
  { value: 'website-hero', label: 'Website Hero', icon: Globe, category: 'web' },
  { value: 'landing-page', label: 'Landing Page', icon: Globe, category: 'web' },
  { value: 'countdown', label: 'Countdown', icon: ImageIcon, category: 'promo' },
  { value: 'save-the-date', label: 'Save the Date', icon: Mail, category: 'email' },
  { value: 'thank-you', label: 'Thank You', icon: Mail, category: 'email' },
  { value: 'promotional', label: 'Promotional', icon: ImageIcon, category: 'promo' },
];

const getTypeColor = (type: EventBanner['type']) => {
  const colors: Record<string, string> = {
    'email-header': 'bg-blue-100 text-blue-800',
    'social-cover': 'bg-purple-100 text-purple-800',
    'social-banner': 'bg-violet-100 text-violet-800',
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

export const EventDigitalSection = ({
  materials,
  onUpdate,
  banners = [],
  onBannersChange,
  templates = [],
  onTemplatesChange,
  brochures = [],
  onBrochuresChange,
  printMaterials = [],
  onPrintMaterialsChange,
  isEditable = true,
  subtitle,
  eventId,
}: EventDigitalSectionProps) => {
  const [activeTab, setActiveTab] = useState<'banners' | 'materials' | 'templates' | 'brochures' | 'print'>('banners');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<EventBanner | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const printFileInputRef = useRef<HTMLInputElement>(null);
  const [bannerImageMode, setBannerImageMode] = useState<'upload' | 'url' | 'library'>('upload');
  const [printImageMode, setPrintImageMode] = useState<'upload' | 'url' | 'library'>('upload');
  const { uploadFile, isUploading } = useStorageUpload({ entityType: 'event', entityId: eventId });
  
  // Material form state
  const [newMaterial, setNewMaterial] = useState<Partial<EventDigitalMaterial>>({
    name: '',
    type: 'email-template',
    description: '',
  });
  
  // Banner form state
  const [newBanner, setNewBanner] = useState<Partial<EventBanner>>({
    name: '',
    type: 'email-header',
    dimensions: '',
    platform: '',
  });
  
  // Template form state
  const [newTemplate, setNewTemplate] = useState<Partial<BrandTemplate>>({
    name: '',
    fileType: 'document',
    fileSize: '',
  });
  
  // Brochure form state
  const [newBrochure, setNewBrochure] = useState<{ title: string; category: string }>({
    title: '',
    category: 'event',
  });

  // Print material form state
  const [newPrintMaterial, setNewPrintMaterial] = useState<Partial<EventPrintMaterial>>({
    name: '',
    type: 'flyer',
    dimensions: '',
    description: '',
  });

  // Banner handlers
  const handleAddBanner = () => {
    if (!newBanner.name || !newBanner.dimensions || !onBannersChange) return;
    const item: EventBanner = {
      id: crypto.randomUUID(),
      name: newBanner.name,
      type: newBanner.type as EventBanner['type'],
      dimensions: newBanner.dimensions,
      previewUrl: newBanner.previewUrl,
      templateUrl: newBanner.templateUrl,
      platform: newBanner.platform,
    };
    onBannersChange([...banners, item]);
    setNewBanner({ name: '', type: 'email-header', dimensions: '', platform: '' });
    setIsAddingNew(false);
    toast.success('Banner added');
  };

  const handleDeleteBanner = (id: string) => {
    if (!onBannersChange) return;
    onBannersChange(banners.filter(b => b.id !== id));
    toast.success('Banner removed');
  };

  // Material handlers
  const handleAddMaterial = () => {
    if (!newMaterial.name) return;
    
    const item: EventDigitalMaterial = {
      id: crypto.randomUUID(),
      name: newMaterial.name,
      type: newMaterial.type as EventDigitalMaterial['type'],
      previewUrl: newMaterial.previewUrl,
      templateUrl: newMaterial.templateUrl,
      fileType: newMaterial.fileType,
      description: newMaterial.description,
    };
    
    onUpdate([...materials, item]);
    setNewMaterial({ name: '', type: 'email-template', description: '' });
    setIsAddingNew(false);
    toast.success('Material added');
  };

  const handleDeleteMaterial = (id: string) => {
    onUpdate(materials.filter(m => m.id !== id));
    toast.success('Material removed');
  };

  // Template handlers
  const handleAddTemplate = () => {
    if (!newTemplate.name || !onTemplatesChange) return;
    
    const item: BrandTemplate = {
      id: crypto.randomUUID(),
      name: newTemplate.name,
      fileType: newTemplate.fileType || 'document',
      fileSize: newTemplate.fileSize || '',
      externalUrl: newTemplate.externalUrl,
      thumbnailUrl: newTemplate.thumbnailUrl,
      description: newTemplate.description,
    };
    
    onTemplatesChange([...templates, item]);
    setNewTemplate({ name: '', fileType: 'document', fileSize: '' });
    setIsAddingNew(false);
    toast.success('Template added');
  };

  const handleDeleteTemplate = (id: string) => {
    if (!onTemplatesChange) return;
    onTemplatesChange(templates.filter(t => t.id !== id));
    toast.success('Template removed');
  };

  // Brochure handlers
  const handleAddBrochure = (previewUrl: string) => {
    if (!newBrochure.title || !onBrochuresChange) return;
    
    const item: BrandBrochure = {
      id: crypto.randomUUID(),
      title: newBrochure.title,
      category: newBrochure.category || 'event',
      previewUrl,
    };
    
    onBrochuresChange([...brochures, item]);
    setNewBrochure({ title: '', category: 'event' });
    setIsAddingNew(false);
    toast.success('Brochure added');
  };

  const handleDeleteBrochure = (id: string) => {
    if (!onBrochuresChange) return;
    onBrochuresChange(brochures.filter(b => b.id !== id));
    toast.success('Brochure removed');
  };

  // Print material handlers
  const handleAddPrintMaterial = () => {
    if (!newPrintMaterial.name || !onPrintMaterialsChange) return;
    const item: EventPrintMaterial = {
      id: crypto.randomUUID(),
      name: newPrintMaterial.name,
      type: (newPrintMaterial.type || 'flyer') as EventPrintMaterial['type'],
      dimensions: newPrintMaterial.dimensions,
      previewUrl: newPrintMaterial.previewUrl,
      fileUrl: newPrintMaterial.fileUrl,
      description: newPrintMaterial.description,
      quantity: newPrintMaterial.quantity,
    };
    onPrintMaterialsChange([...printMaterials, item]);
    setNewPrintMaterial({ name: '', type: 'flyer', dimensions: '', description: '' });
    setIsAddingNew(false);
    toast.success('Print material added');
  };

  const handleDeletePrintMaterial = (id: string) => {
    if (!onPrintMaterialsChange) return;
    onPrintMaterialsChange(printMaterials.filter(p => p.id !== id));
    toast.success('Print material removed');
  };

  const hasTemplatesSection = !!onTemplatesChange;
  const hasBrochuresSection = !!onBrochuresChange;
  const hasPrintSection = !!onPrintMaterialsChange;

  return (
    <section id="eventdigital" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Digital Collateral</h2>
          {subtitle ? (
            <RichTextDisplay html={subtitle} className="text-muted-foreground mt-1" />
          ) : (
            <p className="text-muted-foreground mt-1">Digital banners, materials, templates, and downloadable assets</p>
          )}
        </div>
        {isEditable && (
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        )}
      </div>

      {/* Tabs for different asset types */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          {onBannersChange !== undefined && (
            <TabsTrigger value="banners" className="gap-1.5">
              <ImageIcon className="h-4 w-4" />
              Banners
              {banners.length > 0 && <span className="text-xs text-muted-foreground">({banners.length})</span>}
            </TabsTrigger>
          )}
          <TabsTrigger value="materials" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Materials
            {materials.length > 0 && <span className="text-xs text-muted-foreground">({materials.length})</span>}
          </TabsTrigger>
          {hasTemplatesSection && (
            <TabsTrigger value="templates" className="gap-1.5">
              <FolderOpen className="h-4 w-4" />
              Templates
              {templates.length > 0 && <span className="text-xs text-muted-foreground">({templates.length})</span>}
            </TabsTrigger>
          )}
          {hasBrochuresSection && (
            <TabsTrigger value="brochures" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              Brochures
              {brochures.length > 0 && <span className="text-xs text-muted-foreground">({brochures.length})</span>}
            </TabsTrigger>
          )}
          {hasPrintSection && (
            <TabsTrigger value="print" className="gap-1.5">
              <Printer className="h-4 w-4" />
              Print Materials
              {printMaterials.length > 0 && <span className="text-xs text-muted-foreground">({printMaterials.length})</span>}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Banners Tab */}
        <TabsContent value="banners">
          {isAddingNew && activeTab === 'banners' && (
            <Card className="mb-6 border-dashed border-primary">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newBanner.name || ''}
                      onChange={(e) => setNewBanner({ ...newBanner, name: e.target.value })}
                      placeholder="LinkedIn Event Cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newBanner.type}
                      onValueChange={(value) => setNewBanner({ ...newBanner, type: value as EventBanner['type'] })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BANNER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dimensions</Label>
                    <Input
                      value={newBanner.dimensions || ''}
                      onChange={(e) => setNewBanner({ ...newBanner, dimensions: e.target.value })}
                      placeholder="1200 x 628 px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Platform (optional)</Label>
                    <Input
                      value={newBanner.platform || ''}
                      onChange={(e) => setNewBanner({ ...newBanner, platform: e.target.value })}
                      placeholder="LinkedIn, Twitter, etc."
                    />
                  </div>
                </div>
                {/* Banner Image Picker */}
                <div className="space-y-2">
                  <Label>Banner Image (optional)</Label>
                  {newBanner.previewUrl && (
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border bg-muted">
                      <img src={newBanner.previewUrl} alt="Banner preview" className="w-full h-full object-cover" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5"
                        onClick={() => setNewBanner({ ...newBanner, previewUrl: undefined })}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <Tabs value={bannerImageMode} onValueChange={(v) => setBannerImageMode(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-8">
                      <TabsTrigger value="upload" className="text-[10px] gap-1"><Upload className="h-3 w-3" />Upload</TabsTrigger>
                      <TabsTrigger value="url" className="text-[10px] gap-1"><Link className="h-3 w-3" />URL</TabsTrigger>
                      <TabsTrigger value="library" className="text-[10px] gap-1"><ImageIcon className="h-3 w-3" />Library</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-1">
                      <input ref={bannerFileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const result = await uploadFile(file, 'asset', `banner-${(newBanner.name || 'new').toLowerCase().replace(/\s+/g, '-')}`);
                          if (result) setNewBanner(prev => ({ ...prev, previewUrl: result.url }));
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8"
                        onClick={() => bannerFileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Choose File'}
                      </Button>
                    </TabsContent>
                    <TabsContent value="url" className="mt-1">
                      <div className="flex gap-1">
                        <Input placeholder="https://..." className="h-8 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val) { setNewBanner(prev => ({ ...prev, previewUrl: val })); (e.target as HTMLInputElement).value = ''; }
                            }
                          }}
                        />
                        <Button type="button" size="sm" className="h-8 text-xs px-2">Set</Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="library" className="mt-1">
                      <ImageLibraryPicker
                        onSelect={(url) => setNewBanner(prev => ({ ...prev, previewUrl: url }))}
                        trigger={
                          <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8 gap-1">
                            <ImageIcon className="h-3 w-3" />Pick from Library
                          </Button>
                        }
                      />
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="space-y-2">
                  <Label>Template URL (optional)</Label>
                  <Input
                    value={newBanner.templateUrl || ''}
                    onChange={(e) => setNewBanner({ ...newBanner, templateUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    <X className="h-4 w-4 mr-2" />Cancel
                  </Button>
                  <Button onClick={handleAddBanner} disabled={!newBanner.name || !newBanner.dimensions}>
                    <Check className="h-4 w-4 mr-2" />Add Banner
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
                {isEditable && onBannersChange && (
                  <Button onClick={() => { setActiveTab('banners'); setIsAddingNew(true); }}>
                    <Plus className="h-4 w-4 mr-2" />Add First Banner
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {banners.map((banner) => (
                <Card key={banner.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
                  {banner.previewUrl ? (
                    <div className="bg-muted/30 relative flex items-center justify-center p-2">
                      <img src={banner.previewUrl} alt={banner.name} className="w-full h-auto max-h-[180px] object-contain rounded" />
                      <Badge className={cn("absolute top-1.5 left-1.5 text-[10px]", getTypeColor(banner.type))}>
                        {BANNER_TYPES.find(t => t.value === banner.type)?.label}
                      </Badge>
                    </div>
                  ) : (
                    <div className={cn("bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative", getAspectRatio(banner.dimensions || ''))}>
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
                        {banner.platform && <Badge variant="outline" className="mt-1.5 text-xs">{banner.platform}</Badge>}
                      </div>
                      {isEditable && onBannersChange && (
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteBanner(banner.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      {banner.previewUrl && (
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => { setPreviewItem(banner); setPreviewOpen(true); }}>
                          <Eye className="h-3 w-3 mr-1.5" />Preview
                        </Button>
                      )}
                      {banner.templateUrl && (
                        <Button variant="default" size="sm" className="flex-1 text-xs h-8" asChild>
                          <a href={banner.templateUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1.5" />Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials">
          {isAddingNew && activeTab === 'materials' && (
            <Card className="mb-6 border-dashed border-primary">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newMaterial.name || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      placeholder="Invitation Email Template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newMaterial.type}
                      onValueChange={(value) => setNewMaterial({ ...newMaterial, type: value as EventDigitalMaterial['type'] })}
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
                      value={newMaterial.fileType || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, fileType: e.target.value })}
                      placeholder="HTML, PPTX, PDF, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preview URL (optional)</Label>
                    <Input
                      value={newMaterial.previewUrl || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, previewUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Template URL (optional)</Label>
                    <Input
                      value={newMaterial.templateUrl || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, templateUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      value={newMaterial.description || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      placeholder="Brief description..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleAddMaterial} disabled={!newMaterial.name}>
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
                  <Button onClick={() => { setActiveTab('materials'); setIsAddingNew(true); }}>
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
                            onClick={() => handleDeleteMaterial(material.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
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
        </TabsContent>

        {/* Templates Tab */}
        {hasTemplatesSection && (
          <TabsContent value="templates">
            {isAddingNew && activeTab === 'templates' && (
              <Card className="mb-6 border-dashed border-primary">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newTemplate.name || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="PowerPoint Template"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newTemplate.fileType}
                        onValueChange={(value) => setNewTemplate({ ...newTemplate, fileType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>File Size (optional)</Label>
                      <Input
                        value={newTemplate.fileSize || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, fileSize: e.target.value })}
                        placeholder="2.5 MB"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>External URL</Label>
                      <Input
                        value={newTemplate.externalUrl || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, externalUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        value={newTemplate.description || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        placeholder="Brief description..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleAddTemplate} disabled={!newTemplate.name}>
                      <Check className="h-4 w-4 mr-2" />
                      Add Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {templates.length === 0 && !isAddingNew ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No templates yet</h3>
                  <p className="text-muted-foreground mb-4">Add downloadable templates for your event</p>
                  {isEditable && (
                    <Button onClick={() => { setActiveTab('templates'); setIsAddingNew(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="group hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded">
                          <File className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{template.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {template.fileType} {template.fileSize && `• ${template.fileSize}`}
                          </p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                          )}
                        </div>
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {template.externalUrl && (
                        <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5" asChild>
                          <a href={template.externalUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Brochures Tab */}
        {hasBrochuresSection && (
          <TabsContent value="brochures">
            {isAddingNew && activeTab === 'brochures' && (
              <Card className="mb-6 border-dashed border-primary">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={newBrochure.title}
                        onChange={(e) => setNewBrochure({ ...newBrochure, title: e.target.value })}
                        placeholder="Event Brochure 2026"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        value={newBrochure.category}
                        onChange={(e) => setNewBrochure({ ...newBrochure, category: e.target.value })}
                        placeholder="event, sponsorship, etc."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Cover Image</Label>
                      <ImageLibraryPicker
                        onSelect={(url) => handleAddBrochure(url)}
                        trigger={
                          <Button variant="outline" className="w-full gap-2" disabled={!newBrochure.title}>
                            <Plus className="h-4 w-4" />
                            Select Cover & Add Brochure
                          </Button>
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {brochures.length === 0 && !isAddingNew ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No brochures yet</h3>
                  <p className="text-muted-foreground mb-4">Add event brochures and flyers</p>
                  {isEditable && (
                    <Button onClick={() => { setActiveTab('brochures'); setIsAddingNew(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Brochure
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {brochures.map((brochure) => (
                  <Card key={brochure.id} className="group hover:border-primary/50 transition-colors overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative">
                        {brochure.previewUrl ? (
                          <img 
                            src={brochure.previewUrl} 
                            alt={brochure.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-8 w-8 text-muted-foreground/60" />
                        )}
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 text-destructive hover:text-destructive bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteBrochure(brochure.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="p-2 space-y-1">
                        <h4 className="font-medium text-xs truncate">{brochure.title}</h4>
                        {brochure.category && (
                          <p className="text-[10px] text-muted-foreground truncate">{brochure.category}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Print Materials Tab */}
        {hasPrintSection && (
          <TabsContent value="print">
            {isAddingNew && activeTab === 'print' && (
              <Card className="mb-6 border-dashed border-primary">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={newPrintMaterial.name || ''} onChange={(e) => setNewPrintMaterial({ ...newPrintMaterial, name: e.target.value })} placeholder="Event Flyer" />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={newPrintMaterial.type} onValueChange={(value) => setNewPrintMaterial({ ...newPrintMaterial, type: value as EventPrintMaterial['type'] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRINT_MATERIAL_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Dimensions (optional)</Label>
                      <Input value={newPrintMaterial.dimensions || ''} onChange={(e) => setNewPrintMaterial({ ...newPrintMaterial, dimensions: e.target.value })} placeholder="8.5 x 11 in" />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity (optional)</Label>
                      <Input value={newPrintMaterial.quantity || ''} onChange={(e) => setNewPrintMaterial({ ...newPrintMaterial, quantity: e.target.value })} placeholder="500" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input value={newPrintMaterial.description || ''} onChange={(e) => setNewPrintMaterial({ ...newPrintMaterial, description: e.target.value })} placeholder="Brief description..." />
                    </div>
                    <div className="space-y-2 md:col-span-2 lg:col-span-3">
                      <Label>File Link (optional)</Label>
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input value={newPrintMaterial.fileUrl || ''} onChange={(e) => setNewPrintMaterial({ ...newPrintMaterial, fileUrl: e.target.value })} placeholder="https://drive.google.com/... or any download link" className="flex-1" />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Paste a link to the live file (Google Drive, Dropbox, etc.) for direct access</p>
                    </div>
                  </div>
                  {/* Print Material Image */}
                  <div className="space-y-2">
                    <Label>Preview Image (optional)</Label>
                    {newPrintMaterial.previewUrl && (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border bg-muted">
                        <img src={newPrintMaterial.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5" onClick={() => setNewPrintMaterial({ ...newPrintMaterial, previewUrl: undefined })}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <Tabs value={printImageMode} onValueChange={(v) => setPrintImageMode(v as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-3 h-8">
                        <TabsTrigger value="upload" className="text-[10px] gap-1"><Upload className="h-3 w-3" />Upload</TabsTrigger>
                        <TabsTrigger value="url" className="text-[10px] gap-1"><Link className="h-3 w-3" />URL</TabsTrigger>
                        <TabsTrigger value="library" className="text-[10px] gap-1"><ImageIcon className="h-3 w-3" />Library</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-1">
                        <input ref={printFileInputRef} type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const result = await uploadFile(file, 'asset', `print-${(newPrintMaterial.name || 'new').toLowerCase().replace(/\s+/g, '-')}`);
                            if (result) setNewPrintMaterial(prev => ({ ...prev, previewUrl: result.url }));
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => printFileInputRef.current?.click()} disabled={isUploading}>
                          {isUploading ? 'Uploading...' : 'Choose File'}
                        </Button>
                      </TabsContent>
                      <TabsContent value="url" className="mt-1">
                        <div className="flex gap-1">
                          <Input placeholder="https://..." className="h-8 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) { setNewPrintMaterial(prev => ({ ...prev, previewUrl: val })); (e.target as HTMLInputElement).value = ''; }
                              }
                            }}
                          />
                          <Button type="button" size="sm" className="h-8 text-xs px-2">Set</Button>
                        </div>
                      </TabsContent>
                      <TabsContent value="library" className="mt-1">
                        <ImageLibraryPicker
                          onSelect={(url) => setNewPrintMaterial(prev => ({ ...prev, previewUrl: url }))}
                          trigger={
                            <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8 gap-1">
                              <ImageIcon className="h-3 w-3" />Pick from Library
                            </Button>
                          }
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingNew(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
                    <Button onClick={handleAddPrintMaterial} disabled={!newPrintMaterial.name}><Check className="h-4 w-4 mr-2" />Add Print Material</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {printMaterials.length === 0 && !isAddingNew ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Printer className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No print materials yet</h3>
                  <p className="text-muted-foreground mb-4">Add flyers, posters, brochures, and other printed collateral</p>
                  {isEditable && onPrintMaterialsChange && (
                    <Button onClick={() => { setActiveTab('print'); setIsAddingNew(true); }}>
                      <Plus className="h-4 w-4 mr-2" />Add First Print Material
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {printMaterials.map((item) => {
                  const TypeIcon = PRINT_MATERIAL_TYPES.find(t => t.value === item.type)?.icon || FileText;
                  return (
                    <Card key={item.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
                      {item.previewUrl ? (
                        <div className="bg-muted/30 relative flex items-center justify-center p-2">
                          <img src={item.previewUrl} alt={item.name} className="w-full h-auto max-h-[180px] object-contain rounded" />
                          <Badge className="absolute top-1.5 left-1.5 text-[10px] bg-amber-100 text-amber-800">
                            {PRINT_MATERIAL_TYPES.find(t => t.value === item.type)?.label}
                          </Badge>
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center relative">
                          <div className="text-center">
                            <TypeIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-1" />
                            {item.dimensions && <p className="text-xs text-muted-foreground font-mono">{item.dimensions}</p>}
                          </div>
                          <Badge className="absolute top-2 left-2 text-xs bg-amber-100 text-amber-800">
                            {PRINT_MATERIAL_TYPES.find(t => t.value === item.type)?.label}
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                            {item.dimensions && <p className="text-xs text-muted-foreground">{item.dimensions}</p>}
                            {item.quantity && <Badge variant="outline" className="mt-1.5 text-xs">Qty: {item.quantity}</Badge>}
                            {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                          </div>
                          {isEditable && onPrintMaterialsChange && (
                            <Button variant="ghost" size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeletePrintMaterial(item.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        {item.fileUrl && (
                          <Button variant="default" size="sm" className="w-full mt-3 text-xs h-8" asChild>
                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3 mr-1.5" />Download
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Banner Preview Dialog */}
      {previewItem && (
        <PreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          title={`${previewItem.name}${previewItem.dimensions ? ` • ${previewItem.dimensions}` : ''}`}
          previewUrl={previewItem.previewUrl}
        />
      )}
    </section>
  );
};
