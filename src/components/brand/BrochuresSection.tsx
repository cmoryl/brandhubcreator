import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload, Download, FileText, Image, Expand } from 'lucide-react';
import { PdfThumbnailCard } from './PdfThumbnailCard';
import { BrandBrochure } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SectionHeader } from './SectionHeader';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PreviewDialog } from '@/components/ui/preview-dialog';

import { LayoutSelector, useLayoutClasses, LayoutPreset } from './LayoutSelector';

interface BrochuresSectionProps {
  brochures: BrandBrochure[];
  onBrochuresChange: (brochures: BrandBrochure[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
}

const categoryOptions = ['Whitepaper', 'Capability Statement', 'Product Brochure', 'Company Overview', 'Pitch Deck', 'Annual Report', 'Other'];

export const BrochuresSection = ({ brochures: brochuresProp, onBrochuresChange, customSubtitle, onSubtitleChange, layout = 'compact', onLayoutChange }: BrochuresSectionProps) => {
  // Defensive: ensure brochures is always an array
  const brochures = Array.isArray(brochuresProp) ? brochuresProp : [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumbnailFor, setUploadingThumbnailFor] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [previewBrochure, setPreviewBrochure] = useState<BrandBrochure | null>(null);
  
  const { gridClass } = useLayoutClasses(layout);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newBrochure: BrandBrochure = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: 'Other',
        previewUrl: url,
      };
      onBrochuresChange([...brochures, newBrochure]);
      setEditingId(newBrochure.id);
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
      updateBrochure(uploadingThumbnailFor, { thumbnailUrl });
      toast.success('Thumbnail added');
    };
    reader.readAsDataURL(file);

    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
    setUploadingThumbnailFor(null);
  };

  const triggerThumbnailUpload = (brochureId: string) => {
    setUploadingThumbnailFor(brochureId);
    thumbnailInputRef.current?.click();
  };

  const updateBrochure = (id: string, updates: Partial<BrandBrochure>) => {
    onBrochuresChange(brochures.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBrochure = (id: string) => {
    onBrochuresChange(brochures.filter(b => b.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const downloadBrochure = (brochure: BrandBrochure) => {
    const link = document.createElement('a');
    link.href = brochure.previewUrl;
    link.download = brochure.title;
    link.click();
  };

  const removeThumbnail = (brochureId: string) => {
    updateBrochure(brochureId, { thumbnailUrl: undefined });
    toast.success('Thumbnail removed');
  };

  // Group by category
  const groupedBrochures = brochures.reduce((acc, brochure) => {
    if (!acc[brochure.category]) acc[brochure.category] = [];
    acc[brochure.category].push(brochure);
    return acc;
  }, {} as Record<string, BrandBrochure[]>);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <SectionHeader
            title="Digital Collateral"
            defaultSubtitle="PDF whitepapers, capability statements, and brochures"
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
              availableLayouts={['compact', 'grid-3', 'grid-4', 'list']}
              size="sm"
            />
          )}
          <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2 shrink-0">
            <Upload className="h-4 w-4" />
            Upload Brochure
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

      {Object.keys(groupedBrochures).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedBrochures).map(([category, categoryBrochures]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className={gridClass}>
                {categoryBrochures.map((brochure, index) => (
                  <div
                    key={brochure.id}
                    className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Preview */}
                    <div
                      className="aspect-[3/4] bg-muted relative flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => setPreviewBrochure(brochure)}
                    >
                      {brochure.thumbnailUrl ? (
                        <OptimizedImage src={brochure.thumbnailUrl} alt={brochure.title} className="w-full h-full" objectFit="cover" />
                      ) : brochure.previewUrl?.includes('image') || brochure.previewUrl?.includes('data:image') ? (
                        <OptimizedImage src={brochure.previewUrl} alt={brochure.title} className="w-full h-full" objectFit="cover" />
                      ) : brochure.previewUrl?.toLowerCase().includes('.pdf') ? (
                        <PdfThumbnailCard url={brochure.previewUrl} name={brochure.title} />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-16 w-16 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">PDF Document</span>
                        </div>
                      )}
                      {/* Expand indicator */}
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/10 transition-colors">
                        <Expand className="h-6 w-6 text-background opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                      </div>
                       <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => downloadBrochure(brochure)}
                          className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {brochure.thumbnailUrl && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeThumbnail(brochure.id); }}
                          className="absolute bottom-2 right-2 px-2 py-1 text-xs rounded bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          Remove thumbnail
                        </button>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      {editingId === brochure.id ? (
                        <div className="space-y-2">
                          <Input
                            value={brochure.title}
                            onChange={(e) => updateBrochure(brochure.id, { title: e.target.value })}
                            placeholder="Brochure title"
                            className="h-8"
                          />
                          <Select
                            value={brochure.category}
                            onValueChange={(category) => updateBrochure(brochure.id, { category })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                            Done
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-foreground truncate">{brochure.title}</h3>
                          <button
                            onClick={() => setEditingId(brochure.id)}
                            className="p-1.5 rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
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
          ))}
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
            <p className="text-sm">PDFs, brochures, whitepapers</p>
          </div>
        </button>
      )}

      <PreviewDialog
        open={!!previewBrochure}
        onOpenChange={(open) => !open && setPreviewBrochure(null)}
        title={previewBrochure?.title || ''}
        previewUrl={previewBrochure?.thumbnailUrl || previewBrochure?.previewUrl}
        type={previewBrochure?.previewUrl?.includes('application/pdf') ? 'iframe' : 'image'}
      />
    </section>
  );
};
