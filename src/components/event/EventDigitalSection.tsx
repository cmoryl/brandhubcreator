import { useState, useRef } from 'react';
import { Plus, Trash2, Check, X, FileText, Monitor, Smartphone, Presentation, IdCard, Map, Calendar, Download, ExternalLink, FolderOpen, BookOpen, File, Image as ImageIcon, Upload, Link, Mail, Globe, Share2, Eye, Maximize2, Handshake, DollarSign, Award, Heart, Star, BarChart3, Pencil, AppWindow, LayoutGrid, Grid3X3 } from 'lucide-react';
import { EventDigitalMaterial, EventBanner, EventPrintMaterial, EventInfographic, EventApplication, EventDigitalAsset } from '@/types/event';
import { BrandTemplate, BrandBrochure, BrandEmailBanner } from '@/types/brand';
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
import { DigitalCollateralPreviewDialog, CollateralPreviewItem } from './DigitalCollateralPreviewDialog';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { toast } from 'sonner';
import { LiveFilesLink } from './LiveFilesLink';


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
  sponsorshipMaterials?: EventPrintMaterial[];
  onSponsorshipMaterialsChange?: (materials: EventPrintMaterial[]) => void;
  emailBanners?: BrandEmailBanner[];
  onEmailBannersChange?: (banners: BrandEmailBanner[]) => void;
  infographics?: EventInfographic[];
  onInfographicsChange?: (infographics: EventInfographic[]) => void;
  applications?: EventApplication[];
  onApplicationsChange?: (apps: EventApplication[]) => void;
  digitalAssets?: EventDigitalAsset[];
  onDigitalAssetsChange?: (assets: EventDigitalAsset[]) => void;
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

const SPONSORSHIP_TYPES = [
  { value: 'prospectus', label: 'Sponsorship Prospectus', icon: FileText },
  { value: 'deck', label: 'Sponsorship Deck', icon: Presentation },
  { value: 'tier-sheet', label: 'Tier / Pricing Sheet', icon: DollarSign },
  { value: 'agreement', label: 'Sponsorship Agreement', icon: FileText },
  { value: 'logo-sheet', label: 'Logo Placement Guide', icon: ImageIcon },
  { value: 'benefits', label: 'Benefits Overview', icon: Award },
  { value: 'activation', label: 'Activation Plan', icon: Star },
  { value: 'thank-you', label: 'Thank You Package', icon: Heart },
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
  sponsorshipMaterials = [],
  onSponsorshipMaterialsChange,
  emailBanners = [],
  onEmailBannersChange,
  infographics = [],
  onInfographicsChange,
  applications = [],
  onApplicationsChange,
  digitalAssets = [],
  onDigitalAssetsChange,
  isEditable = true,
  subtitle,
  eventId,
}: EventDigitalSectionProps) => {
  const [cardSize, setCardSize] = useState<'normal' | 'compact'>('normal');
  const [activeTab, setActiveTab] = useState<'banners' | 'materials' | 'templates' | 'brochures' | 'sponsorship' | 'emailbanners' | 'infographics' | 'applications' | 'assets'>('banners');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<EventBanner | null>(null);
  const [collateralPreviewOpen, setCollateralPreviewOpen] = useState(false);
  const [collateralPreviewItem, setCollateralPreviewItem] = useState<CollateralPreviewItem | null>(null);

  const openCollateralPreview = (item: CollateralPreviewItem) => {
    setCollateralPreviewItem(item);
    setCollateralPreviewOpen(true);
  };
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const printFileInputRef = useRef<HTMLInputElement>(null);
  const emailBannerFileInputRef = useRef<HTMLInputElement>(null);
  const infographicFileInputRef = useRef<HTMLInputElement>(null);
  const applicationFileInputRef = useRef<HTMLInputElement>(null);
  const digitalAssetFileInputRef = useRef<HTMLInputElement>(null);
  const templateThumbnailInputRef = useRef<HTMLInputElement>(null);
  const [bannerImageMode, setBannerImageMode] = useState<'upload' | 'url' | 'library'>('upload');
  const [printImageMode, setPrintImageMode] = useState<'upload' | 'url' | 'library'>('upload');
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [editBannerData, setEditBannerData] = useState<Partial<BrandEmailBanner>>({});
  const editBannerFileInputRef = useRef<HTMLInputElement>(null);
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

  // Sponsorship material form state
  const [newPrintMaterial, setNewPrintMaterial] = useState<Partial<EventPrintMaterial>>({
    name: '',
    type: 'prospectus',
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

  const updateBanner = (id: string, updates: Partial<EventBanner>) => {
    if (!onBannersChange) return;
    onBannersChange(banners.map(b => b.id === id ? { ...b, ...updates } : b));
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

  const updateMaterial = (id: string, updates: Partial<EventDigitalMaterial>) => {
    onUpdate(materials.map(m => m.id === id ? { ...m, ...updates } : m));
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

  // Sponsorship material handlers
  const handleAddPrintMaterial = () => {
    if (!newPrintMaterial.name || !onSponsorshipMaterialsChange) return;
    const item: EventPrintMaterial = {
      id: crypto.randomUUID(),
      name: newPrintMaterial.name,
      type: (newPrintMaterial.type || 'prospectus') as EventPrintMaterial['type'],
      dimensions: newPrintMaterial.dimensions,
      previewUrl: newPrintMaterial.previewUrl,
      fileUrl: newPrintMaterial.fileUrl,
      description: newPrintMaterial.description,
      quantity: newPrintMaterial.quantity,
    };
    onSponsorshipMaterialsChange([...sponsorshipMaterials, item]);
    setNewPrintMaterial({ name: '', type: 'prospectus', dimensions: '', description: '' });
    setIsAddingNew(false);
    toast.success('Sponsorship material added');
  };

  const handleDeletePrintMaterial = (id: string) => {
    if (!onSponsorshipMaterialsChange) return;
    onSponsorshipMaterialsChange(sponsorshipMaterials.filter(p => p.id !== id));
    toast.success('Sponsorship material removed');
  };

  // Email banner handlers
  const handleAddEmailBanner = async (file: File) => {
    if (!onEmailBannersChange) return;
    const result = await uploadFile(file, 'asset', `email-banner-${Date.now()}`);
    if (result) {
      const img = new Image();
      img.onload = () => {
        const banner: BrandEmailBanner = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          imageUrl: result.url,
          width: img.naturalWidth || 600,
          height: img.naturalHeight || 200,
        };
        onEmailBannersChange([...emailBanners, banner]);
        toast.success('Email banner added');
      };
      img.src = result.url;
    }
  };

  const handleDeleteEmailBanner = (id: string) => {
    if (!onEmailBannersChange) return;
    onEmailBannersChange(emailBanners.filter(b => b.id !== id));
    toast.success('Email banner removed');
  };

  const startEditBanner = (banner: BrandEmailBanner) => {
    setEditingBannerId(banner.id);
    setEditBannerData({ name: banner.name, description: banner.description || '', linkUrl: banner.linkUrl || '', imageUrl: banner.imageUrl, width: banner.width, height: banner.height });
  };

  const handleSaveEditBanner = () => {
    if (!onEmailBannersChange || !editingBannerId) return;
    onEmailBannersChange(emailBanners.map(b => b.id === editingBannerId ? { ...b, name: editBannerData.name || b.name, description: editBannerData.description || undefined, linkUrl: editBannerData.linkUrl || undefined, imageUrl: editBannerData.imageUrl || b.imageUrl, width: editBannerData.width || b.width, height: editBannerData.height || b.height } : b));
    setEditingBannerId(null);
    setEditBannerData({});
    toast.success('Banner updated');
  };

  const handleEditBannerImageUpload = async (file: File) => {
    const result = await uploadFile(file, 'asset', `social-banner-${Date.now()}`);
    if (result) {
      const img = new Image();
      img.onload = () => {
        setEditBannerData(prev => ({ ...prev, imageUrl: result.url, width: img.naturalWidth, height: img.naturalHeight }));
      };
      img.src = result.url;
    }
  };

  // Infographic handlers
  const handleAddInfographic = async (file: File) => {
    if (!onInfographicsChange) return;
    const result = await uploadFile(file, 'asset', `infographic-${Date.now()}`);
    if (result) {
      const item: EventInfographic = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: result.url,
      };
      onInfographicsChange([...infographics, item]);
      toast.success('Infographic added');
    }
  };

  const handleDeleteInfographic = (id: string) => {
    if (!onInfographicsChange) return;
    onInfographicsChange(infographics.filter(i => i.id !== id));
    toast.success('Infographic removed');
  };

  const updateInfographic = (id: string, updates: Partial<EventInfographic>) => {
    if (!onInfographicsChange) return;
    onInfographicsChange(infographics.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  // Application handlers
  const handleAddApplication = async (file: File) => {
    if (!onApplicationsChange) return;
    const result = await uploadFile(file, 'asset', `app-asset-${Date.now()}`);
    if (result) {
      const app: EventApplication = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: result.url,
        platform: 'other',
      };
      onApplicationsChange([...applications, app]);
      toast.success('Application asset added');
    }
  };

  const handleDeleteApplication = (id: string) => {
    if (!onApplicationsChange) return;
    onApplicationsChange(applications.filter(a => a.id !== id));
    toast.success('Application asset removed');
  };

  const updateApplication = (id: string, updates: Partial<EventApplication>) => {
    if (!onApplicationsChange) return;
    onApplicationsChange(applications.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDigitalAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onDigitalAssetsChange || !e.target.files?.length) return;
    const file = e.target.files[0];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'ico', 'bmp', 'tiff'];
    if (!allowedExts.includes(ext)) {
      toast.error(`Unsupported format: .${ext}. Use SVG, PNG, JPG, WebP, or GIF.`);
      return;
    }
    try {
      const result = await uploadFile(file, 'asset', `digital-asset-${crypto.randomUUID()}`);
      if (!result) return;
      const asset: EventDigitalAsset = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: result.url,
        fileType: ext,
      };
      onDigitalAssetsChange([...digitalAssets, asset]);
      toast.success('Asset uploaded');
    } catch {
      toast.error('Failed to upload asset');
    }
    e.target.value = '';
  };

  const handleDeleteDigitalAsset = (id: string) => {
    if (!onDigitalAssetsChange) return;
    onDigitalAssetsChange(digitalAssets.filter(a => a.id !== id));
    toast.success('Asset removed');
  };

  const updateDigitalAsset = (id: string, updates: Partial<EventDigitalAsset>) => {
    if (!onDigitalAssetsChange) return;
    onDigitalAssetsChange(digitalAssets.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const hasTemplatesSection = !!onTemplatesChange || templates.length > 0;
  const hasBrochuresSection = !!onBrochuresChange || brochures.length > 0;
  const hasPrintSection = !!onSponsorshipMaterialsChange || sponsorshipMaterials.length > 0;
  const hasEmailBannersSection = !!onEmailBannersChange || emailBanners.length > 0;
  const hasInfographicsSection = !!onInfographicsChange || infographics.length > 0;
  const hasApplicationsSection = !!onApplicationsChange || applications.length > 0;
  const hasAssetsSection = !!onDigitalAssetsChange || digitalAssets.length > 0;

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
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setCardSize('normal')}
              className={cn("p-1.5 transition-colors", cardSize === 'normal' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
              title="Normal size"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCardSize('compact')}
              className={cn("p-1.5 transition-colors", cardSize === 'compact' ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")}
              title="Compact size"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
          {isEditable && (
            <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for different asset types */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          {(onBannersChange !== undefined || banners.length > 0) && (
            <TabsTrigger value="banners" className="gap-1.5">
              <ImageIcon className="h-4 w-4" />
              Banners
              {banners.length > 0 && <span className="text-xs text-muted-foreground">({banners.length})</span>}
            </TabsTrigger>
          )}
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
            <TabsTrigger value="sponsorship" className="gap-1.5">
              <Handshake className="h-4 w-4" />
              Sponsorship
              {sponsorshipMaterials.length > 0 && <span className="text-xs text-muted-foreground">({sponsorshipMaterials.length})</span>}
            </TabsTrigger>
          )}
          {hasEmailBannersSection && (
            <TabsTrigger value="emailbanners" className="gap-1.5">
              <ImageIcon className="h-4 w-4" />
              Social Banners
              {emailBanners.length > 0 && <span className="text-xs text-muted-foreground">({emailBanners.length})</span>}
            </TabsTrigger>
          )}
          {hasInfographicsSection && (
            <TabsTrigger value="infographics" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Infographics
              {infographics.length > 0 && <span className="text-xs text-muted-foreground">({infographics.length})</span>}
            </TabsTrigger>
          )}
          {hasApplicationsSection && (
            <TabsTrigger value="applications" className="gap-1.5">
              <AppWindow className="h-4 w-4" />
              Applications
              {applications.length > 0 && <span className="text-xs text-muted-foreground">({applications.length})</span>}
            </TabsTrigger>
          )}
          {hasAssetsSection && (
            <TabsTrigger value="assets" className="gap-1.5">
              <FolderOpen className="h-4 w-4" />
              Assets
              {digitalAssets.length > 0 && <span className="text-xs text-muted-foreground">({digitalAssets.length})</span>}
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
            <div className={cn("grid gap-3", cardSize === 'compact' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
              {banners.map((banner) => (
                <Card key={banner.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
                  {banner.previewUrl ? (
                    <div className={cn("bg-muted/30 relative flex items-center justify-center p-2", cardSize === 'compact' ? "max-h-[120px]" : "")}>
                      <img src={banner.previewUrl} alt={banner.name} className={cn("w-full h-auto object-contain rounded", cardSize === 'compact' ? "max-h-[110px]" : "max-h-[180px]")} />
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
                    <div className="flex flex-wrap gap-2 mt-3">
                      {banner.previewUrl && (
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => openCollateralPreview({
                          name: banner.name, imageUrl: banner.previewUrl, typeLabel: BANNER_TYPES.find(t => t.value === banner.type)?.label, dimensions: banner.dimensions, platform: banner.platform, templateUrl: banner.templateUrl,
                        })}>
                        </Button>
                      )}
                      {banner.templateUrl && (
                        <Button variant="default" size="sm" className="flex-1 text-xs h-8" asChild>
                          <a href={banner.templateUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1.5" />Download
                          </a>
                        </Button>
                      )}
                      <LiveFilesLink
                        url={banner.liveFilesUrl}
                        onUrlChange={(url) => updateBanner(banner.id, { liveFilesUrl: url })}
                        isEditable={isEditable && !!onBannersChange}
                        compact={cardSize === 'compact'}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                    <div className="space-y-2">
                      <Label>Thumbnail (optional)</Label>
                      {newTemplate.thumbnailUrl && (
                        <div className="relative w-full h-20 rounded-lg overflow-hidden border bg-muted">
                          <img src={newTemplate.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5"
                            onClick={() => setNewTemplate({ ...newTemplate, thumbnailUrl: undefined })}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input ref={templateThumbnailInputRef} type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const result = await uploadFile(file, 'asset', `template-thumb-${Date.now()}`);
                            if (result) setNewTemplate(prev => ({ ...prev, thumbnailUrl: result.url }));
                            if (templateThumbnailInputRef.current) templateThumbnailInputRef.current.value = '';
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" className="flex-1 text-xs h-8"
                          onClick={() => templateThumbnailInputRef.current?.click()} disabled={isUploading}>
                          <Upload className="h-3 w-3 mr-1.5" />{isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                        <ImageLibraryPicker
                          onSelect={(url) => setNewTemplate(prev => ({ ...prev, thumbnailUrl: url }))}
                          trigger={
                            <Button type="button" variant="outline" size="sm" className="flex-1 text-xs h-8 gap-1">
                              <ImageIcon className="h-3 w-3" />Library
                            </Button>
                          }
                        />
                      </div>
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
              <div className={cn("grid gap-4", cardSize === 'compact' ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
                {templates.map((template) => (
                  <Card key={template.id} className="group hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {template.thumbnailUrl ? (
                          <div className="w-16 h-16 rounded overflow-hidden bg-muted shrink-0">
                            <img src={template.thumbnailUrl} alt={template.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="p-2 bg-muted rounded shrink-0">
                            <File className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
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
              <div className={cn("grid gap-4", cardSize === 'compact' ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5")}>
                {brochures.map((brochure) => (
                  <Card key={brochure.id} className="group hover:border-primary/50 transition-colors overflow-hidden">
                    <CardContent className="p-0">
                      <div
                        className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative cursor-pointer"
                        onClick={() => brochure.previewUrl && openCollateralPreview({ name: brochure.title, imageUrl: brochure.previewUrl, category: brochure.category })}
                      >
                        {brochure.previewUrl ? (
                          <img 
                            src={brochure.previewUrl} 
                            alt={brochure.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-8 w-8 text-muted-foreground/60" />
                        )}
                        {brochure.previewUrl && (
                          <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors">
                            <Maximize2 className="h-5 w-5 text-background opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                          </div>
                        )}
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 text-destructive hover:text-destructive bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={(e) => { e.stopPropagation(); handleDeleteBrochure(brochure.id); }}
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

        {/* Sponsorship Tab */}
        {hasPrintSection && (
          <TabsContent value="sponsorship">
            {isAddingNew && activeTab === 'sponsorship' && (
              <Card className="mb-6 border-dashed border-primary">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={newPrintMaterial.name || ''} onChange={(e) => setNewPrintMaterial({ ...newPrintMaterial, name: e.target.value })} placeholder="Sponsorship Prospectus 2026" />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={newPrintMaterial.type} onValueChange={(value) => setNewPrintMaterial({ ...newPrintMaterial, type: value as EventPrintMaterial['type'] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SPONSORSHIP_TYPES.map((type) => (
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
                    <Button onClick={handleAddPrintMaterial} disabled={!newPrintMaterial.name}><Check className="h-4 w-4 mr-2" />Add Sponsorship Material</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {sponsorshipMaterials.length === 0 && !isAddingNew ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Handshake className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No sponsorship materials yet</h3>
                  <p className="text-muted-foreground mb-4">Add sponsorship decks, prospectuses, and partnership collateral</p>
                  {isEditable && onSponsorshipMaterialsChange && (
                    <Button onClick={() => { setActiveTab('sponsorship'); setIsAddingNew(true); }}>
                      <Plus className="h-4 w-4 mr-2" />Add First Sponsorship Material
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className={cn("grid gap-4", cardSize === 'compact' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
                {sponsorshipMaterials.map((item) => {
                  const TypeIcon = SPONSORSHIP_TYPES.find(t => t.value === item.type)?.icon || FileText;
                  return (
                    <Card key={item.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
                      {item.previewUrl ? (
                        <div
                          className="bg-muted/30 relative flex items-center justify-center p-2 cursor-pointer group/img"
                          onClick={() => openCollateralPreview({ name: item.name, imageUrl: item.previewUrl, typeLabel: SPONSORSHIP_TYPES.find(t => t.value === item.type)?.label, dimensions: item.dimensions, description: item.description, fileUrl: item.fileUrl, quantity: item.quantity })}
                        >
                          <img src={item.previewUrl} alt={item.name} className="w-full h-auto max-h-[180px] object-contain rounded" />
                          <Badge className="absolute top-1.5 left-1.5 text-[10px] bg-primary/10 text-primary">
                            {SPONSORSHIP_TYPES.find(t => t.value === item.type)?.label}
                          </Badge>
                          <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover/img:bg-foreground/20 transition-colors rounded">
                            <Maximize2 className="h-5 w-5 text-background opacity-0 group-hover/img:opacity-80 transition-opacity drop-shadow-lg" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                          <div className="text-center">
                            <TypeIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-1" />
                            {item.dimensions && <p className="text-xs text-muted-foreground font-mono">{item.dimensions}</p>}
                          </div>
                          <Badge className="absolute top-2 left-2 text-xs bg-primary/10 text-primary">
                            {SPONSORSHIP_TYPES.find(t => t.value === item.type)?.label}
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
                          {isEditable && onSponsorshipMaterialsChange && (
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

        {/* Email Banners Tab */}
        {hasEmailBannersSection && (
          <TabsContent value="emailbanners">
            {emailBanners.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No social banners yet</h3>
                  <p className="text-muted-foreground mb-4">Add social media banner images for platforms like Facebook, LinkedIn, Instagram, and X</p>
                  {isEditable && (
                    <>
                      <input ref={emailBannerFileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddEmailBanner(f); if (emailBannerFileInputRef.current) emailBannerFileInputRef.current.value = ''; }}
                      />
                      <Button onClick={() => emailBannerFileInputRef.current?.click()} disabled={isUploading}>
                        <Upload className="h-4 w-4 mr-2" />{isUploading ? 'Uploading...' : 'Upload First Social Banner'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {isEditable && (
                  <div className="flex justify-end">
                    <input ref={emailBannerFileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddEmailBanner(f); if (emailBannerFileInputRef.current) emailBannerFileInputRef.current.value = ''; }}
                    />
                    <Button size="sm" onClick={() => emailBannerFileInputRef.current?.click()} disabled={isUploading}>
                      <Upload className="h-4 w-4 mr-2" />{isUploading ? 'Uploading...' : 'Add Banner'}
                    </Button>
                  </div>
                )}
                <div className={cn("grid gap-3", cardSize === 'compact' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
                  {emailBanners.map((banner) => {
                    const isEditing = editingBannerId === banner.id;
                    const displayUrl = isEditing ? (editBannerData.imageUrl || banner.imageUrl) : banner.imageUrl;
                    const displayWidth = isEditing ? (editBannerData.width || banner.width) : banner.width;
                    const displayHeight = isEditing ? (editBannerData.height || banner.height) : banner.height;
                    const rawRatio = displayWidth / displayHeight;
                    const aspectRatio = Math.min(Math.max(rawRatio, 0.75), 3);
                    return (
                      <Card key={banner.id} className={cn("group overflow-hidden transition-colors", isEditing ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/50")}>
                        <div className="bg-muted/30 p-2">
                          <div
                            className="relative w-full overflow-hidden rounded border border-border"
                            style={{ aspectRatio: `${aspectRatio}`, maxHeight: cardSize === 'compact' ? '120px' : '180px' }}
                          >
                          {displayUrl ? (
                              <img src={displayUrl} alt={banner.name} className="w-full h-full object-contain cursor-pointer" onClick={() => !isEditing && openCollateralPreview({ name: banner.name, imageUrl: banner.imageUrl, width: banner.width, height: banner.height, description: banner.description, fileUrl: banner.linkUrl, externalUrl: banner.linkUrl })} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                            )}
                            {!isEditing && banner.imageUrl && (
                              <div
                                className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors cursor-pointer"
                                onClick={() => openCollateralPreview({ name: banner.name, imageUrl: banner.imageUrl, width: banner.width, height: banner.height, description: banner.description, fileUrl: banner.linkUrl, externalUrl: banner.linkUrl })}
                              >
                                <Maximize2 className="h-5 w-5 text-background opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                              </div>
                            )}
                            {isEditable && !isEditing && (
                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-6 w-6 bg-background/80 backdrop-blur-sm text-foreground hover:text-primary"
                                  onClick={(e) => { e.stopPropagation(); startEditBanner(banner); }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-6 w-6 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteEmailBanner(banner.id); }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            {isEditing && (
                              <div className="absolute bottom-1 left-1 right-1 flex gap-1 z-10">
                                <input ref={editBannerFileInputRef} type="file" accept="image/*" className="hidden"
                                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEditBannerImageUpload(f); if (editBannerFileInputRef.current) editBannerFileInputRef.current.value = ''; }}
                                />
                                <Button variant="secondary" size="sm" className="text-[10px] h-6 gap-1 bg-background/90 backdrop-blur-sm"
                                  onClick={() => editBannerFileInputRef.current?.click()} disabled={isUploading}>
                                  <Upload className="h-3 w-3" />{isUploading ? 'Uploading...' : 'Replace Image'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <CardContent className="p-2.5">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Name</Label>
                                <Input className="h-8 text-xs" value={editBannerData.name || ''} onChange={(e) => setEditBannerData(prev => ({ ...prev, name: e.target.value }))} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Description (optional)</Label>
                                <Input className="h-8 text-xs" value={editBannerData.description || ''} onChange={(e) => setEditBannerData(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief description..." />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Link URL (optional)</Label>
                                <Input className="h-8 text-xs" value={editBannerData.linkUrl || ''} onChange={(e) => setEditBannerData(prev => ({ ...prev, linkUrl: e.target.value }))} placeholder="https://..." />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => { setEditingBannerId(null); setEditBannerData({}); }}>
                                  <X className="h-3 w-3 mr-1" />Cancel
                                </Button>
                                <Button size="sm" className="flex-1 text-xs h-7" onClick={handleSaveEditBanner}>
                                  <Check className="h-3 w-3 mr-1" />Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-medium text-sm truncate">{banner.name}</h4>
                              <p className="text-xs text-muted-foreground">{banner.width} × {banner.height}px</p>
                              {banner.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{banner.description}</p>}
                              {banner.linkUrl && (
                                <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-7" asChild>
                                  <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1.5" />View Link
                                  </a>
                                </Button>
                              )}
                              <LiveFilesLink
                                url={banner.liveFilesUrl}
                                onUrlChange={(url) => {
                                  if (!onEmailBannersChange) return;
                                  onEmailBannersChange(emailBanners.map(b => b.id === banner.id ? { ...b, liveFilesUrl: url } : b));
                                }}
                                isEditable={isEditable && !!onEmailBannersChange}
                                compact={cardSize === 'compact'}
                                className="mt-2"
                              />
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        )}

        {/* Infographics Tab */}
        {hasInfographicsSection && (
          <TabsContent value="infographics">
            {infographics.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No infographics yet</h3>
                  <p className="text-muted-foreground mb-4">Upload event infographics, data visualizations, and stat sheets</p>
                  {isEditable && (
                    <>
                      <input ref={infographicFileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddInfographic(f); if (infographicFileInputRef.current) infographicFileInputRef.current.value = ''; }}
                      />
                      <Button onClick={() => infographicFileInputRef.current?.click()} disabled={isUploading}>
                        <Upload className="h-4 w-4 mr-2" />{isUploading ? 'Uploading...' : 'Upload First Infographic'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {isEditable && (
                  <div className="flex justify-end">
                    <input ref={infographicFileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddInfographic(f); if (infographicFileInputRef.current) infographicFileInputRef.current.value = ''; }}
                    />
                    <Button size="sm" onClick={() => infographicFileInputRef.current?.click()} disabled={isUploading}>
                      <Upload className="h-4 w-4 mr-2" />{isUploading ? 'Uploading...' : 'Add Infographic'}
                    </Button>
                  </div>
                )}
                <div className={cn("grid gap-4", cardSize === 'compact' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
                  {infographics.map((item) => (
                    <Card key={item.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
                      <div
                        className="bg-muted/30 relative cursor-pointer"
                        onClick={() => openCollateralPreview({ name: item.name, imageUrl: item.imageUrl, description: item.description, category: item.category })}
                      >
                        <img src={item.imageUrl} alt={item.name} className={cn("w-full h-auto object-contain", cardSize === 'compact' ? "max-h-[160px]" : "max-h-[300px]")} />
                        <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors">
                          <Maximize2 className="h-6 w-6 text-background opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                        </div>
                        {isEditable && (
                          <Button
                            variant="ghost" size="icon"
                            className="absolute top-1 right-1 h-6 w-6 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={(e) => { e.stopPropagation(); handleDeleteInfographic(item.id); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                        {item.category && <Badge variant="outline" className="mt-1.5 text-xs">{item.category}</Badge>}
                        <LiveFilesLink
                          url={item.liveFilesUrl}
                          onUrlChange={(url) => updateInfographic(item.id, { liveFilesUrl: url })}
                          isEditable={isEditable && !!onInfographicsChange}
                          compact={cardSize === 'compact'}
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        )}

        {/* Applications Tab */}
        {hasApplicationsSection && (
          <TabsContent value="applications">
            {applications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AppWindow className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No application assets yet</h3>
                  <p className="text-muted-foreground mb-4">Upload event app screenshots, splash screens, and mobile assets</p>
                  {isEditable && (
                    <>
                      <input ref={applicationFileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddApplication(f); if (applicationFileInputRef.current) applicationFileInputRef.current.value = ''; }}
                      />
                      <Button onClick={() => applicationFileInputRef.current?.click()} disabled={isUploading}>
                        <Upload className="h-4 w-4 mr-2" />{isUploading ? 'Uploading...' : 'Upload First App Asset'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {isEditable && (
                  <div className="flex justify-end">
                    <input ref={applicationFileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddApplication(f); if (applicationFileInputRef.current) applicationFileInputRef.current.value = ''; }}
                    />
                    <Button size="sm" onClick={() => applicationFileInputRef.current?.click()} disabled={isUploading}>
                      <Upload className="h-4 w-4 mr-2" />{isUploading ? 'Uploading...' : 'Add App Asset'}
                    </Button>
                  </div>
                )}
                <div className={cn("grid gap-4", cardSize === 'compact' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
                  {applications.map((app) => (
                    <Card key={app.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
                      <div
                        className="bg-muted/30 relative cursor-pointer"
                        onClick={() => openCollateralPreview({ name: app.name, imageUrl: app.imageUrl, description: app.description, platform: app.platform, externalUrl: app.appUrl })}
                      >
                        <img src={app.imageUrl} alt={app.name} className={cn("w-full h-auto object-contain", cardSize === 'compact' ? "max-h-[160px]" : "max-h-[300px]")} />
                        <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors">
                          <Maximize2 className="h-6 w-6 text-background opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                        </div>
                        {isEditable && (
                          <Button
                            variant="ghost" size="icon"
                            className="absolute top-1 right-1 h-6 w-6 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={(e) => { e.stopPropagation(); handleDeleteApplication(app.id); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm truncate">{app.name}</h4>
                        {app.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{app.description}</p>}
                        {app.platform && app.platform !== 'other' && (
                          <Badge variant="outline" className="mt-1.5 text-xs capitalize">{app.platform}</Badge>
                        )}
                        {app.appUrl && (
                          <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-7" asChild>
                            <a href={app.appUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1.5" />View App
                            </a>
                          </Button>
                        )}
                        <LiveFilesLink
                          url={app.liveFilesUrl}
                          onUrlChange={(url) => updateApplication(app.id, { liveFilesUrl: url })}
                          isEditable={isEditable && !!onApplicationsChange}
                          compact={cardSize === 'compact'}
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        )}

        {/* Assets Tab */}
        {hasAssetsSection && (
          <TabsContent value="assets">
            <div className="space-y-4">
              {isEditable && (
                <div className="flex items-center gap-3">
                  <input
                    ref={digitalAssetFileInputRef}
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.webp,.gif,.ico,.bmp,.tiff"
                    className="hidden"
                    onChange={handleDigitalAssetUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => digitalAssetFileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Asset'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    SVG, PNG, JPG, WebP, GIF supported
                  </p>
                </div>
              )}

              {digitalAssets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No assets yet</p>
                  <p className="text-sm mt-1">Upload SVGs, PNGs, and other image assets</p>
                </div>
              ) : (
                <div className={cn("grid gap-4", cardSize === 'compact' ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
                  {digitalAssets.map((asset) => (
                    <Card key={asset.id} className="group overflow-hidden">
                      <div
                        className={cn(
                          `relative cursor-pointer flex items-center justify-center p-4`,
                          cardSize === 'compact' ? 'min-h-[80px]' : 'min-h-[140px]',
                          asset.fileType === 'svg' ? 'bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,hsl(var(--background))_0%_50%)] bg-[length:16px_16px]' : 'bg-muted/30'
                        )}
                        onClick={() => openCollateralPreview({ name: asset.name, imageUrl: asset.imageUrl, fileType: asset.fileType, description: asset.description })}
                      >
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className={cn("max-w-full object-contain", cardSize === 'compact' ? "max-h-[120px]" : "max-h-[200px]")}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/20 transition-colors">
                          <Maximize2 className="h-6 w-6 text-background opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                        </div>
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={(e) => { e.stopPropagation(); handleDeleteDigitalAsset(asset.id); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          {asset.fileType && (
                            <Badge variant="outline" className="text-[10px] uppercase">{asset.fileType}</Badge>
                          )}
                          {asset.description && (
                            <p className="text-xs text-muted-foreground truncate">{asset.description}</p>
                          )}
                        </div>
                        <LiveFilesLink
                          url={asset.liveFilesUrl}
                          onUrlChange={(url) => updateDigitalAsset(asset.id, { liveFilesUrl: url })}
                          isEditable={isEditable && !!onDigitalAssetsChange}
                          compact={cardSize === 'compact'}
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
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

      {/* Enhanced Collateral Preview Dialog */}
      <DigitalCollateralPreviewDialog
        open={collateralPreviewOpen}
        onOpenChange={setCollateralPreviewOpen}
        item={collateralPreviewItem}
      />
    </section>
  );
};

