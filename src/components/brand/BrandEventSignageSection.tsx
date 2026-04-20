import { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Maximize, FileImage, Download, Eye, Pencil, Check, Upload, Sparkles, Loader2, ImagePlus, Link, FileText, Image, X, Building2, Search, ExternalLink } from 'lucide-react';
import { BrandEventSignage, LayoutPreset, BrandColor, LinkedBoothCard } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LayoutSelector, useLayoutClasses } from '@/components/brand/LayoutSelector';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { RichTextEditor, RichTextDisplay } from '@/components/ui/rich-text-editor';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { EditBrandSignageDialog } from './EditBrandSignageDialog';
import { LinkedBoothPreviewCard, resolveBoothDivision, LinkBoothDialog } from './LinkedBoothCards';
import { type BoothDivision, DivisionDetail } from '@/pages/BoothsCatalog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCustomDivisions } from '@/hooks/useCustomDivisions';
import { useBoothImages } from '@/hooks/useBoothImages';

// Reference image types for AI generation context
interface ReferenceImage {
  data: string; // Base64 or URL
  type: 'design' | 'booth-reference' | 'venue-reference';
  name?: string;
}

interface TemplateReference {
  data: string;
  type: string; // MIME type
  name: string;
  pageCount?: number;
}

interface BrandEventSignageSectionProps {
  eventSignage: BrandEventSignage[];
  onEventSignageChange?: (signage: BrandEventSignage[]) => void;
  linkedBooths?: LinkedBoothCard[];
  onLinkedBoothsChange?: (booths: LinkedBoothCard[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
  brandName?: string;
  brandColors?: BrandColor[];
  isAdmin?: boolean;
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

const AI_STYLES = [
  { value: 'photorealistic', label: 'Photorealistic', description: 'Studio-quality product shot' },
  { value: 'venue', label: 'In Venue', description: 'Trade show setting with atmosphere' },
  { value: 'mockup', label: 'Clean Mockup', description: 'Minimal template-style preview' },
];

const getTypeColor = (type: BrandEventSignage['type']) => {
  const colors: Record<string, string> = {
    'booth-backdrop': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'pull-up-banner': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'table-banner': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'hanging-sign': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'floor-graphic': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    'directional': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    'podium-sign': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'stage-backdrop': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    'outdoor-banner': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'other': 'bg-muted text-muted-foreground',
  };
  return colors[type] || colors.other;
};

// Static booth division data for picker
const STATIC_BOOTH_DIVISIONS = [
  { id: 'corporate', name: 'Corporate', tagline: 'The Language of Global Business', color: 'hsl(200, 85%, 45%)', services: ['Efficient Translation', 'Analytics & Insights', 'Real-Time Updates'] },
  { id: 'life-sciences', name: 'Life Sciences', tagline: 'Simplify Your Path From Lab to Launch', color: 'hsl(195, 80%, 40%)', services: ['Regulatory Affairs', 'Patient Recruitment', 'Medical Writing'] },
  { id: 'legal', name: 'Legal', tagline: 'The Global Leader in Legal Technology & Support', color: 'hsl(210, 70%, 35%)', services: ['eDiscovery', 'Forensic Technology', 'Managed Review'] },
  { id: 'ip', name: 'IP (Intellectual Property)', tagline: 'Protect Your IP in Any Country', color: 'hsl(220, 65%, 40%)', services: ['Patent Filing', 'AI Translation', 'GlobalLink'] },
  { id: 'digital', name: 'Digital', tagline: 'Global Performance for International Brands', color: 'hsl(265, 60%, 50%)', services: ['SEO & Paid Media', 'AI Copywriting', 'Social Intelligence'] },
  { id: 'media', name: 'Media', tagline: 'Where Boutique Expertise Meets Global Excellence', color: 'hsl(340, 65%, 45%)', services: ['Subtitling', 'Dubbing', 'Accessibility'] },
  { id: 'games', name: 'Games', tagline: 'The Language of Global Games', color: 'hsl(150, 60%, 40%)', services: ['Game Localization', 'QA Testing', 'Voiceover'] },
  { id: 'live', name: 'Live', tagline: 'Multilingual Event Solutions', color: 'hsl(180, 55%, 40%)', services: ['Content Creation', 'Interpreters', 'Event Technology'] },
  { id: 'globallink', name: 'GlobalLink', tagline: 'Unlock Global Content Velocity', color: 'hsl(190, 75%, 42%)', services: ['TMS', 'AI Translation', 'CMS Connectors'] },
  { id: 'regulated-industries', name: 'Regulated Industries', tagline: 'Risk-Free Compliance at Scale', color: 'hsl(200, 60%, 35%)', services: ['Compliance', 'Regulatory', 'Quality'] },
  { id: 'ai', name: 'AI Solutions', tagline: 'AI-Powered Language Technology', color: 'hsl(250, 65%, 55%)', services: ['NMT', 'LLM Solutions', 'Data Services'] },
  { id: 'techresearch', name: 'Tech & Research', tagline: 'Powering Discovery Through Language', color: 'hsl(175, 60%, 40%)', services: ['Patent Analytics', 'Research Translation', 'Data Mining'] },
  { id: 'healthcare', name: 'Healthcare', tagline: 'Connecting Patients Through Language', color: 'hsl(0, 65%, 50%)', services: ['Patient Communication', 'Telephonic Interpreting', 'Healthcare Innovation'] },
  { id: 'health', name: 'Health', tagline: 'Serving Seniors Through the Continuum of Care', color: 'hsl(350, 70%, 50%)', services: ['Physical Therapy', 'Rehabilitation', 'Digital Health'] },
  { id: 'dataforce', name: 'DataForce', tagline: 'Human Insights for AI that is Reliable. Refined. Respected.', color: 'hsl(270, 55%, 50%)', services: ['Data Collection', 'Data Annotation', 'Bias Mitigation'] },
  { id: 'trial-interactive', name: 'Trial Interactive', tagline: 'Enabling Trial Collaboration in the Cloud', color: 'hsl(190, 65%, 42%)', services: ['eClinical Platform', 'AI-Powered Intelligence', 'Expert Support'] },
  { id: 'g3', name: 'G3', tagline: 'Shaping Global Content. Empowering Human Connection.', color: 'hsl(25, 70%, 50%)', services: ['Learning & Development', 'Localization', 'Market Insights'] },
];

// Inline booth picker for the Add Signage dialog
const BoothPickerInline = ({ linkedBooths, onLink, search, onSearchChange }: {
  linkedBooths: LinkedBoothCard[];
  onLink: (booth: LinkedBoothCard) => void;
  search: string;
  onSearchChange: (s: string) => void;
}) => {
  const { divisions: customDivisions } = useCustomDivisions();
  const linkedIds = new Set(linkedBooths.map(b => b.divisionId));

  const allDivisions = useMemo(() => {
    // Apply DB overrides to static divisions
    const merged = STATIC_BOOTH_DIVISIONS.map(staticDiv => {
      const dbOverride = customDivisions.find(d => d.division_id === staticDiv.id);
      if (dbOverride) {
        return {
          ...staticDiv,
          name: dbOverride.name || staticDiv.name,
          tagline: dbOverride.tagline || staticDiv.tagline,
          color: dbOverride.color || staticDiv.color,
          services: dbOverride.services?.length ? dbOverride.services : staticDiv.services,
        };
      }
      return staticDiv;
    });

    // Add custom divisions that don't match any static ID
    const staticIds = new Set(STATIC_BOOTH_DIVISIONS.map(d => d.id));
    const uniqueCustoms = customDivisions
      .filter(d => !staticIds.has(d.division_id))
      .map(d => ({
        id: d.division_id,
        name: d.name,
        tagline: d.tagline || '',
        color: d.color || 'hsl(200, 70%, 45%)',
        services: d.services || [],
      }));
    return [...merged, ...uniqueCustoms];
  }, [customDivisions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allDivisions;
    const q = search.toLowerCase();
    return allDivisions.filter(d =>
      d.name.toLowerCase().includes(q) || d.tagline.toLowerCase().includes(q)
    );
  }, [search, allDivisions]);

  const handleSelect = (div: typeof STATIC_BOOTH_DIVISIONS[0]) => {
    onLink({
      id: crypto.randomUUID(),
      divisionId: div.id,
      divisionName: div.name,
      tagline: div.tagline,
      color: div.color,
      iconName: 'Building2',
      services: div.services,
      linkedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search booth divisions..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-2 pb-2">
          {filtered.map((div) => {
            const alreadyLinked = linkedIds.has(div.id);
            return (
              <button
                key={div.id}
                onClick={() => !alreadyLinked && handleSelect(div)}
                disabled={alreadyLinked}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/40 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: div.color }}>
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{div.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{div.tagline}</p>
                  {div.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {div.services.slice(0, 3).map(s => (
                        <Badge key={s} variant="outline" className="text-[10px] font-normal py-0">{s}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                {alreadyLinked ? (
                  <Badge variant="secondary" className="text-[10px] shrink-0">Linked</Badge>
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No matching divisions found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const BrandEventSignageSection = ({
  eventSignage,
  onEventSignageChange,
  linkedBooths = [],
  onLinkedBoothsChange,
  customSubtitle,
  onSubtitleChange,
  layout = 'grid-3',
  onLayoutChange,
  brandName,
  brandColors,
  isAdmin = false,
}: BrandEventSignageSectionProps) => {
  const { gridClass } = useLayoutClasses(layout);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'signage' | 'booth'>('signage');
  const [boothSearch, setBoothSearch] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<BrandEventSignage | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BrandEventSignage | null>(null);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<BrandEventSignage>>({
    name: '',
    type: 'booth-backdrop',
    dimensions: '',
    notes: '',
  });
  const [newItemAiStyle, setNewItemAiStyle] = useState<'photorealistic' | 'venue' | 'mockup'>('photorealistic');
  const [isCreatingWithAi, setIsCreatingWithAi] = useState(false);
  const [previewTab, setPreviewTab] = useState<'ai' | 'enhance' | 'upload' | 'url'>('ai');
  
  // Reference images for AI context
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [templateReference, setTemplateReference] = useState<TemplateReference | null>(null);
  const [boothReferences, setBoothReferences] = useState<string[]>([]);
  const [venueReferences, setVenueReferences] = useState<string[]>([]);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  
  // File input refs
  const designInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const boothInputRef = useRef<HTMLInputElement>(null);
  const venueInputRef = useRef<HTMLInputElement>(null);

  const isEditable = !!onEventSignageChange;
  const canEditSubtitle = !!onSubtitleChange;
  const defaultSubtitle = "Physical signage specifications for booth, banners, and venue graphics";
  const displaySubtitle = customSubtitle || defaultSubtitle;

  // Booth navigation
  const { divisions: customDivisions } = useCustomDivisions();
  const navigate = useNavigate();
  const [detailDivision, setDetailDivision] = useState<BoothDivision | null>(null);

  const openPreview = (item: BrandEventSignage) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  const openEditDialog = (item: BrandEventSignage) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleEditSignage = (updatedItem: BrandEventSignage) => {
    if (!onEventSignageChange) return;
    onEventSignageChange(eventSignage.map(s => s.id === updatedItem.id ? updatedItem : s));
  };

  // File to base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle design image upload
  const handleDesignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    try {
      const base64 = await fileToBase64(file);
      setDesignImage(base64);
      setPreviewTab('enhance'); // Switch to enhance mode when design is uploaded
      toast.success('Design uploaded');
    } catch (error) {
      toast.error('Failed to upload design');
    }
  };

  // Handle template reference upload (PDF or image)
  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    
    if (!isPdf && !isImage) {
      toast.error('Please upload a PDF or image file');
      return;
    }
    
    setIsUploadingTemplate(true);
    try {
      const base64 = await fileToBase64(file);
      
      if (isPdf) {
        // For PDF, we'll pass it to the edge function for context
        setTemplateReference({
          data: base64,
          type: file.type,
          name: file.name,
        });
        toast.success(`PDF template "${file.name}" uploaded`);
      } else {
        // For images, use directly
        setTemplateReference({
          data: base64,
          type: file.type,
          name: file.name,
        });
        toast.success('Template image uploaded');
      }
    } catch (error) {
      toast.error('Failed to upload template');
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  // Handle booth/venue reference uploads
  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'booth' | 'venue') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    try {
      const base64 = await fileToBase64(file);
      if (type === 'booth') {
        setBoothReferences(prev => [...prev, base64]);
      } else {
        setVenueReferences(prev => [...prev, base64]);
      }
      toast.success(`${type === 'booth' ? 'Booth' : 'Venue'} reference added`);
    } catch (error) {
      toast.error('Failed to upload reference');
    }
  };

  // Clear all reference images when dialog closes
  const resetDialog = () => {
    setNewItem({ name: '', type: 'booth-backdrop', dimensions: '', notes: '' });
    setDesignImage(null);
    setTemplateReference(null);
    setBoothReferences([]);
    setVenueReferences([]);
    setPreviewTab('ai');
    setNewItemAiStyle('photorealistic');
    setDialogMode('signage');
    setBoothSearch('');
  };

  const handleAdd = async (generateAi: boolean = false) => {
    if (!newItem.name || !newItem.dimensions || !onEventSignageChange) return;
    
    const itemId = crypto.randomUUID();
    let previewUrl = newItem.previewUrl;
    
    if (generateAi) {
      setIsCreatingWithAi(true);
      try {
        // Build reference images array for multi-image context
        const referenceImages: ReferenceImage[] = [];
        
        if (designImage) {
          referenceImages.push({ data: designImage, type: 'design', name: 'Design' });
        }
        
        boothReferences.forEach((ref, i) => {
          referenceImages.push({ data: ref, type: 'booth-reference', name: `Booth Reference ${i + 1}` });
        });
        
        venueReferences.forEach((ref, i) => {
          referenceImages.push({ data: ref, type: 'venue-reference', name: `Venue Reference ${i + 1}` });
        });
        
        const { data, error } = await supabase.functions.invoke('generate-signage-preview', {
          body: {
            signageType: newItem.type,
            signageName: newItem.name,
            dimensions: newItem.dimensions,
            brandName,
            brandColors: brandColors?.map(c => c.hex),
            style: newItemAiStyle,
            referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
            templateReference: templateReference || undefined,
          },
        });
        
        if (error) throw error;
        if (data?.imageUrl) {
          previewUrl = data.imageUrl;
          toast.success('AI preview generated!');
        }
      } catch (error: any) {
        console.error('Error generating AI preview:', error);
        toast.error(error.message || 'Failed to generate AI preview');
      } finally {
        setIsCreatingWithAi(false);
      }
    }
    
    const item: BrandEventSignage = {
      id: itemId,
      name: newItem.name,
      type: newItem.type as BrandEventSignage['type'],
      dimensions: newItem.dimensions,
      previewUrl,
      templateUrl: newItem.templateUrl,
      notes: newItem.notes,
      specifications: newItem.specifications,
    };
    
    onEventSignageChange([...eventSignage, item]);
    resetDialog();
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!onEventSignageChange) return;
    onEventSignageChange(eventSignage.filter(s => s.id !== id));
  };

  const handleUpdateItem = useCallback((id: string, updates: Partial<BrandEventSignage>) => {
    if (!onEventSignageChange) return;
    onEventSignageChange(eventSignage.map(s => s.id === id ? { ...s, ...updates } : s));
  }, [onEventSignageChange, eventSignage]);

  const handleGenerateAiPreview = useCallback(async (item: BrandEventSignage) => {
    if (!onEventSignageChange) return;
    
    setGeneratingId(item.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-signage-preview', {
        body: {
          signageType: item.type,
          signageName: item.name,
          dimensions: item.dimensions,
          brandName,
          brandColors: brandColors?.map(c => c.hex),
          style: 'venue',
        },
      });
      
      if (error) throw error;
      if (data?.imageUrl) {
        handleUpdateItem(item.id, { previewUrl: data.imageUrl });
        toast.success('AI preview generated!');
      }
    } catch (error: any) {
      console.error('Error generating AI preview:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error('Rate limit reached. Please try again in a moment.');
      } else if (error.message?.includes('credits')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error(error.message || 'Failed to generate AI preview');
      }
    } finally {
      setGeneratingId(null);
    }
  }, [onEventSignageChange, brandName, brandColors, handleUpdateItem]);

  // Group by type
  const groupedSignage = eventSignage.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, BrandEventSignage[]>);

  // Render the image picker for an item
  const renderImagePicker = (item: BrandEventSignage, variant: 'button' | 'icon' = 'button') => {
    return (
      <ImageLibraryPicker
        onSelect={(url) => {
          handleUpdateItem(item.id, { previewUrl: url });
          toast.success('Preview image updated');
        }}
        trigger={
          variant === 'button' ? (
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              {item.previewUrl ? 'Replace' : 'Upload'}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Upload className="h-3 w-3" />
              Upload
            </Button>
          )
        }
      />
    );
  };

  return (
    <section id="eventsignage" className="scroll-mt-24">
      {/* Section Header */}
      <div className="relative pb-4 mb-4 border-b border-border">
        <div className="flex items-center justify-between gap-3 sm:gap-4 mb-1">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Event Signage
          </h2>
        </div>
        
        <div className="w-full">
          {editingSubtitle && canEditSubtitle ? (
            <div className="space-y-2">
              <RichTextEditor
                value={customSubtitle ?? ''}
                onChange={onSubtitleChange}
                placeholder={defaultSubtitle}
                minHeight="50px"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingSubtitle(false)}
                className="gap-1.5"
              >
                <Check className="h-3 w-3" />
                Done Editing
              </Button>
            </div>
          ) : (
            <p 
              className={cn(
                "text-sm text-muted-foreground leading-relaxed",
                canEditSubtitle && "cursor-pointer hover:text-foreground/80 transition-colors group"
              )}
              onClick={() => canEditSubtitle && setEditingSubtitle(true)}
              title={canEditSubtitle ? "Click to edit subtitle" : undefined}
            >
              {customSubtitle ? (
                <RichTextDisplay html={customSubtitle} />
              ) : (
                displaySubtitle
              )}
              {canEditSubtitle && (
                <Pencil className="inline-block h-3 w-3 ml-2 opacity-0 group-hover:opacity-50 transition-opacity" />
              )}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mb-6">
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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add Event Signage</DialogTitle>
                <DialogDescription>
                  Add custom signage or link a booth card from the catalog
                </DialogDescription>
              </DialogHeader>

              {/* Mode Switcher */}
              <div className="grid grid-cols-2 rounded-lg border bg-muted/50 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setDialogMode('signage')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                    dialogMode === 'signage' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  New Signage
                </button>
                <button
                  type="button"
                  onClick={() => setDialogMode('booth')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                    dialogMode === 'booth' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  Link Booth Card
                </button>
              </div>

              {dialogMode === 'booth' ? (
                <BoothPickerInline
                  linkedBooths={linkedBooths}
                  onLink={(booth) => {
                    onLinkedBoothsChange?.([...linkedBooths, booth]);
                    toast.success(`"${booth.divisionName}" booth linked`);
                    resetDialog();
                    setIsDialogOpen(false);
                  }}
                  search={boothSearch}
                  onSearchChange={setBoothSearch}
                />
              ) : (
                <>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 pt-4 pb-2">
                  {/* Name & Type */}
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
                        onValueChange={(value) => setNewItem({ ...newItem, type: value as BrandEventSignage['type'] })}
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

                  {/* Dimensions */}
                  <div className="space-y-2">
                    <Label>Dimensions</Label>
                    <Input
                      value={newItem.dimensions || ''}
                      onChange={(e) => setNewItem({ ...newItem, dimensions: e.target.value })}
                      placeholder="10ft x 8ft"
                    />
                  </div>
                  
                  {/* Preview Image Options - Enhanced with 4 tabs */}
                  <div className="space-y-2">
                    <Label>Preview Image</Label>
                    <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="ai" className="gap-1 text-xs px-2">
                          <Sparkles className="h-3 w-3" />
                          AI Generate
                        </TabsTrigger>
                        <TabsTrigger value="enhance" className="gap-1 text-xs px-2">
                          <Sparkles className="h-3 w-3" />
                          Enhance
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="gap-1 text-xs px-2">
                          <Upload className="h-3 w-3" />
                          Upload
                        </TabsTrigger>
                        <TabsTrigger value="url" className="gap-1 text-xs px-2">
                          <Link className="h-3 w-3" />
                          URL
                        </TabsTrigger>
                      </TabsList>

                      {/* AI Generate Tab */}
                      <TabsContent value="ai" className="space-y-3 pt-2">
                        <p className="text-xs text-muted-foreground">
                          Generate a hyper-realistic preview image using AI
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {AI_STYLES.map((style) => (
                            <button
                              key={style.value}
                              type="button"
                              onClick={() => setNewItemAiStyle(style.value as any)}
                              className={cn(
                                "p-2 rounded-lg border text-center transition-all",
                                newItemAiStyle === style.value 
                                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <p className="text-xs font-medium">{style.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{style.description}</p>
                            </button>
                          ))}
                        </div>
                      </TabsContent>

                      {/* Enhance Tab (upload design for image-to-image) */}
                      <TabsContent value="enhance" className="space-y-3 pt-2">
                        <p className="text-xs text-muted-foreground">
                          Upload your booth design and AI will render it in a realistic setting
                        </p>
                        {designImage ? (
                          <div className="relative">
                            <img src={designImage} alt="Design" className="w-full h-32 object-contain rounded-lg border bg-muted" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => setDesignImage(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => designInputRef.current?.click()}
                            className="w-full p-4 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors text-center"
                          >
                            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Upload your booth design</p>
                            <p className="text-xs text-muted-foreground">Your artwork, mockup, or design file</p>
                          </button>
                        )}
                        <input
                          ref={designInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleDesignUpload}
                        />
                        
                        {/* Style selection for enhance mode too */}
                        <div className="grid grid-cols-3 gap-2">
                          {AI_STYLES.map((style) => (
                            <button
                              key={style.value}
                              type="button"
                              onClick={() => setNewItemAiStyle(style.value as any)}
                              className={cn(
                                "p-2 rounded-lg border text-center transition-all",
                                newItemAiStyle === style.value 
                                  ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <p className="text-xs font-medium">{style.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{style.description}</p>
                            </button>
                          ))}
                        </div>
                      </TabsContent>

                      {/* Upload Tab */}
                      <TabsContent value="upload" className="space-y-2 pt-2">
                        <ImageLibraryPicker
                          onSelect={(url) => setNewItem({ ...newItem, previewUrl: url })}
                          trigger={
                            <button
                              type="button"
                              className="w-full p-4 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors text-center"
                            >
                              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm font-medium">Upload preview image</p>
                              <p className="text-xs text-muted-foreground">Select from library or upload new</p>
                            </button>
                          }
                        />
                        {newItem.previewUrl && (
                          <div className="relative">
                            <img src={newItem.previewUrl} alt="Preview" className="w-full h-32 object-contain rounded-lg border bg-muted" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => setNewItem({ ...newItem, previewUrl: '' })}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      {/* URL Tab */}
                      <TabsContent value="url" className="space-y-2 pt-2">
                        <Input
                          value={newItem.previewUrl || ''}
                          onChange={(e) => setNewItem({ ...newItem, previewUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Booth Template Reference (PDF or Image) */}
                  <div className="space-y-2">
                    <Label>Booth Template Reference (optional)</Label>
                    {templateReference ? (
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                        <div className="p-2 bg-background rounded">
                          {templateReference.type === 'application/pdf' ? (
                            <FileText className="h-5 w-5 text-destructive" />
                          ) : (
                            <Image className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{templateReference.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {templateReference.type === 'application/pdf' ? 'PDF Template' : 'Image Template'}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setTemplateReference(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => templateInputRef.current?.click()}
                        className="w-full p-3 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors text-left flex items-center gap-3"
                        disabled={isUploadingTemplate}
                      >
                        {isUploadingTemplate ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Upload template reference</p>
                          <p className="text-xs text-muted-foreground">PDF or image of booth layout/design template</p>
                        </div>
                      </button>
                    )}
                    <input
                      ref={templateInputRef}
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleTemplateUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      AI will use this as reference for accurate booth proportions and layout
                    </p>
                  </div>

                  {/* Booth & Venue References */}
                  <div className="space-y-2">
                    <Label>Booth & Venue References (optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Add photos of similar booths or venue spaces to help AI create a more realistic render
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => boothInputRef.current?.click()}
                        className="p-2 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors flex items-center gap-2"
                      >
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">Booth Photo</span>
                        {boothReferences.length > 0 && (
                          <Badge variant="secondary" className="ml-auto">{boothReferences.length}</Badge>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => venueInputRef.current?.click()}
                        className="p-2 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors flex items-center gap-2"
                      >
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">Venue Photo</span>
                        {venueReferences.length > 0 && (
                          <Badge variant="secondary" className="ml-auto">{venueReferences.length}</Badge>
                        )}
                      </button>
                    </div>
                    <input
                      ref={boothInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleReferenceUpload(e, 'booth')}
                    />
                    <input
                      ref={venueInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleReferenceUpload(e, 'venue')}
                    />
                    
                    {/* Show uploaded references */}
                    {(boothReferences.length > 0 || venueReferences.length > 0) && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {boothReferences.map((ref, i) => (
                          <div key={`booth-${i}`} className="relative w-12 h-12">
                            <img src={ref} alt={`Booth ${i + 1}`} className="w-full h-full object-cover rounded" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute -top-1 -right-1 h-4 w-4 p-0"
                              onClick={() => setBoothReferences(prev => prev.filter((_, idx) => idx !== i))}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </div>
                        ))}
                        {venueReferences.map((ref, i) => (
                          <div key={`venue-${i}`} className="relative w-12 h-12">
                            <img src={ref} alt={`Venue ${i + 1}`} className="w-full h-full object-cover rounded" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute -top-1 -right-1 h-4 w-4 p-0"
                              onClick={() => setVenueReferences(prev => prev.filter((_, idx) => idx !== i))}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Template URL & Live Files */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Template URL</Label>
                      <Input
                        value={newItem.templateUrl || ''}
                        onChange={(e) => setNewItem({ ...newItem, templateUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Live Files Location</Label>
                      <Input
                        value={newItem.specifications || ''}
                        onChange={(e) => setNewItem({ ...newItem, specifications: e.target.value })}
                        placeholder="Figma, Drive, etc."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes / Specifications (optional)</Label>
                    <Textarea
                      value={newItem.notes || ''}
                      onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                      placeholder="Material, installation notes, vendor details..."
                      rows={2}
                    />
                  </div>
                </div>
              </ScrollArea>
              
              {/* Footer Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => handleAdd(false)} 
                  variant="outline"
                  className="flex-1" 
                  disabled={!newItem.name || !newItem.dimensions || isCreatingWithAi}
                >
                  Add Without Preview
                </Button>
                <Button 
                  onClick={() => handleAdd(true)} 
                  className="flex-1 gap-1.5" 
                  disabled={!newItem.name || !newItem.dimensions || isCreatingWithAi}
                >
                  {isCreatingWithAi ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {previewTab === 'enhance' && designImage ? 'Generate Preview' : 'Add with AI Preview'}
                    </>
                  )}
                </Button>
              </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {eventSignage.length === 0 && linkedBooths.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Maximize className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No signage specifications yet</h3>
            <p className="text-muted-foreground mb-4">Add booth backdrops, banners, link booth cards, and other physical event signage</p>
            {isEditable && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Signage or Booth
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
                      <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <Badge className={cn("absolute top-2 left-2", getTypeColor(item.type))}>
                          {item.dimensions}
                        </Badge>
                        {/* Hover overlay with actions */}
                        {isEditable && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {renderImagePicker(item, 'button')}
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handleGenerateAiPreview(item)}
                              disabled={generatingId === item.id}
                              className="gap-1.5"
                            >
                              {generatingId === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                              )}
                              Regenerate
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                        <div className="text-center">
                          <FileImage className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm font-mono text-muted-foreground">{item.dimensions}</p>
                          {isEditable && (
                            <div className="flex gap-2 mt-3 justify-center">
                              {renderImagePicker(item, 'icon')}
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleGenerateAiPreview(item)}
                                disabled={generatingId === item.id}
                                className="gap-1.5 text-xs"
                              >
                                {generatingId === item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3 w-3" />
                                )}
                                AI Generate
                              </Button>
                            </div>
                          )}
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
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.notes}</p>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {item.previewUrl && (
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => openPreview(item)}>
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Preview
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
                        {isEditable && !item.previewUrl && !item.templateUrl && (
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(item)}>
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                        )}
                        {!item.previewUrl && !item.templateUrl && !isEditable && (
                          <span className="text-xs text-muted-foreground italic">No files attached</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Booth Cards - rendered in same grid area */}
          {linkedBooths.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Booth Cards
                <Badge variant="secondary" className="font-normal">
                  {linkedBooths.length}
                </Badge>
              </h3>
              <div className={gridClass}>
                {linkedBooths.map((booth) => (
                  <LinkedBoothPreviewCard
                    key={booth.id}
                    booth={booth}
                    isEditable={!!onLinkedBoothsChange}
                    onRemove={() => onLinkedBoothsChange?.(linkedBooths.filter(b => b.id !== booth.id))}
                    onOpenDetail={() => {
                      const url = `https://boothhub.lovable.app/?booth=${encodeURIComponent(booth.divisionId)}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {(eventSignage.length > 0 || linkedBooths.length > 0) && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Signage Items:</span>
              <span className="ml-2 font-medium">{eventSignage.length}</span>
            </div>
            {linkedBooths.length > 0 && (
              <div>
                <span className="text-muted-foreground">Booth Cards:</span>
                <span className="ml-2 font-medium">{linkedBooths.length}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Types:</span>
              <span className="ml-2 font-medium">{Object.keys(groupedSignage).length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">With Previews:</span>
              <span className="ml-2 font-medium">{eventSignage.filter(s => s.previewUrl).length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewItem?.name || 'Signage Preview'}
        previewUrl={previewItem?.previewUrl}
        externalUrl={previewItem?.previewUrl}
        type="image"
      />

      {/* Edit Dialog */}
      {editingItem && (
        <EditBrandSignageDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          signage={editingItem}
          onSave={handleEditSignage}
          onDelete={handleDelete}
          brandName={brandName}
          brandColors={brandColors?.map(c => c.hex)}
        />
      )}

    </section>
  );
};
