import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload, Download, FileText, Image, Eye, ExternalLink
} from 'lucide-react';
import { BrandBrochure } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SectionHeader } from './SectionHeader';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { LayoutSelector, useLayoutClasses, LayoutPreset } from './LayoutSelector';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DigitalCollateralSectionProps {
  collateral: BrandBrochure[];
  onCollateralChange: (collateral: BrandBrochure[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
}

// Extended category options with all content types
const CATEGORY_OPTIONS = [
  { value: 'Brief', label: 'Brief', icon: '📋' },
  { value: 'Spotlight', label: 'Spotlight', icon: '🔦' },
  { value: 'Whitepaper', label: 'Whitepaper', icon: '📄' },
  { value: 'Case Study', label: 'Case Study', icon: '📊' },
  { value: 'eBrochure', label: 'eBrochure', icon: '📖' },
  { value: 'Infographic', label: 'Infographic', icon: '📈' },
  { value: 'Capability Statement', label: 'Capability Statement', icon: '💼' },
  { value: 'Product Brochure', label: 'Product Brochure', icon: '📦' },
  { value: 'Company Overview', label: 'Company Overview', icon: '🏢' },
  { value: 'Pitch Deck', label: 'Pitch Deck', icon: '🎯' },
  { value: 'Annual Report', label: 'Annual Report', icon: '📅' },
  { value: 'Other', label: 'Other', icon: '📁' },
];

const getCategoryIcon = (category: string) => {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.icon || '📁';
};

export const DigitalCollateralSection = ({
  collateral: collateralProp,
  onCollateralChange,
  customSubtitle,
  onSubtitleChange,
  layout = 'grid-3',
  onLayoutChange
}: DigitalCollateralSectionProps) => {
  const collateral = Array.isArray(collateralProp) ? collateralProp : [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<BrandBrochure | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumbnailFor, setUploadingThumbnailFor] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  
  const { gridClass } = useLayoutClasses(layout);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newItem: BrandBrochure = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: selectedCategory || 'Other',
        previewUrl: url,
      };
      onCollateralChange([...collateral, newItem]);
      setEditingId(newItem.id);
      setSelectedCategory(null);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingThumbnailFor) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const thumbnailUrl = event.target?.result as string;
      updateItem(uploadingThumbnailFor, { thumbnailUrl });
      toast.success('Preview thumbnail added');
    };
    reader.readAsDataURL(file);

    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
    setUploadingThumbnailFor(null);
  };

  const triggerThumbnailUpload = (itemId: string) => {
    setUploadingThumbnailFor(itemId);
    thumbnailInputRef.current?.click();
  };

  const triggerUploadForCategory = (category: string) => {
    setSelectedCategory(category);
    fileInputRef.current?.click();
  };

  const updateItem = (id: string, updates: Partial<BrandBrochure>) => {
    onCollateralChange(collateral.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (id: string) => {
    onCollateralChange(collateral.filter(item => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const downloadItem = (item: BrandBrochure) => {
    const link = document.createElement('a');
    link.href = item.previewUrl;
    link.download = item.title;
    link.click();
  };

  const removeThumbnail = (itemId: string) => {
    updateItem(itemId, { thumbnailUrl: undefined });
    toast.success('Thumbnail removed');
  };

  const isPdf = (url: string) => {
    return url?.includes('application/pdf') || url?.endsWith('.pdf');
  };

  const isImage = (url: string) => {
    return url?.includes('image') || url?.includes('data:image');
  };

  // Group by category
  const groupedCollateral = collateral.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BrandBrochure[]>);

  // Sort categories by the order in CATEGORY_OPTIONS
  const sortedCategories = Object.keys(groupedCollateral).sort((a, b) => {
    const indexA = CATEGORY_OPTIONS.findIndex(c => c.value === a);
    const indexB = CATEGORY_OPTIONS.findIndex(c => c.value === b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <SectionHeader
            title="Digital Collateral"
            defaultSubtitle="Briefs, spotlights, whitepapers, case studies, and marketing materials"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2">
          {onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'grid-4', 'list']}
              size="sm"
            />
          )}
          <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2 shrink-0">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={thumbnailInputRef}
        type="file"
        accept="image/*"
        onChange={handleThumbnailUpload}
        className="hidden"
      />

      {/* Category Quick-Add Chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.slice(0, 6).map(cat => (
          <button
            key={cat.value}
            onClick={() => triggerUploadForCategory(cat.value)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <Plus className="h-3 w-3 opacity-50" />
          </button>
        ))}
      </div>

      {sortedCategories.length > 0 ? (
        <div className="space-y-8">
          {sortedCategories.map(category => {
            const categoryItems = groupedCollateral[category];
            const categoryInfo = CATEGORY_OPTIONS.find(c => c.value === category);
            
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{categoryInfo?.icon || '📁'}</span>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    {category}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {categoryItems.length}
                  </Badge>
                </div>
                
                <div className={gridClass}>
                  {categoryItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border hover:border-primary/50 transition-all animate-scale-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Preview Area */}
                      <div 
                        className="aspect-[3/4] bg-muted relative flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() => setPreviewItem(item)}
                      >
                        {item.thumbnailUrl ? (
                          <OptimizedImage 
                            src={item.thumbnailUrl} 
                            alt={item.title} 
                            className="w-full h-full" 
                            objectFit="cover" 
                          />
                        ) : isImage(item.previewUrl) ? (
                          <OptimizedImage 
                            src={item.previewUrl} 
                            alt={item.title} 
                            className="w-full h-full" 
                            objectFit="cover" 
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-3 p-4">
                            <div className="p-4 rounded-xl bg-primary/10">
                              <FileText className="h-12 w-12 text-primary" />
                            </div>
                            <span className="text-xs text-muted-foreground text-center">
                              Click to preview
                            </span>
                          </div>
                        )}
                        
                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                            title="Preview"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); triggerThumbnailUpload(item.id); }}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                            title="Add thumbnail"
                          >
                            <Image className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadItem(item); }}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                            title="Download"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        {/* Thumbnail indicator */}
                        {item.thumbnailUrl && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeThumbnail(item.id); }}
                            className="absolute bottom-2 right-2 px-2 py-1 text-xs rounded bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Remove thumbnail
                          </button>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="p-4">
                        {editingId === item.id ? (
                          <div className="space-y-3">
                            <Input
                              value={item.title}
                              onChange={(e) => updateItem(item.id, { title: e.target.value })}
                              placeholder="Title"
                              className="h-8"
                            />
                            <Select
                              value={item.category}
                              onValueChange={(category) => updateItem(item.id, { category })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORY_OPTIONS.map(cat => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    <span className="flex items-center gap-2">
                                      <span>{cat.icon}</span>
                                      <span>{cat.label}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                              Done
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-foreground truncate">{item.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                            </div>
                            <button
                              onClick={() => setEditingId(item.id)}
                              className="p-1.5 rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-primary', 'bg-primary/5', 'text-primary');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary', 'bg-primary/5', 'text-primary');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary', 'bg-primary/5', 'text-primary');
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleFileUpload(fakeEvent);
            }
          }}
          className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <FileText className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium">Drop files or click to upload</p>
            <p className="text-sm">PDFs, briefs, case studies, whitepapers & more</p>
          </div>
        </button>
      )}

      {/* Preview Dialog */}
      <PreviewDialog
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
        title={previewItem?.title || ''}
        previewUrl={previewItem?.thumbnailUrl || previewItem?.previewUrl}
        type={isPdf(previewItem?.previewUrl || '') ? 'iframe' : 'image'}
        aspectRatio="portrait"
      />
    </section>
  );
};
