import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload, Download, FileText, Image } from 'lucide-react';
import { BrandBrochure } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface BrochuresSectionProps {
  brochures: BrandBrochure[];
  onBrochuresChange: (brochures: BrandBrochure[]) => void;
}

const categoryOptions = ['Whitepaper', 'Capability Statement', 'Product Brochure', 'Company Overview', 'Pitch Deck', 'Annual Report', 'Other'];

export const BrochuresSection = ({ brochures, onBrochuresChange }: BrochuresSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumbnailFor, setUploadingThumbnailFor] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Digital Collateral</h2>
          <p className="text-muted-foreground mt-1">PDF whitepapers, capability statements, and brochures</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Brochure
        </Button>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryBrochures.map((brochure, index) => (
                  <div
                    key={brochure.id}
                    className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Preview */}
                    <div className="aspect-[3/4] bg-muted relative flex items-center justify-center overflow-hidden">
                      {brochure.thumbnailUrl ? (
                        // Show thumbnail if available
                        <img src={brochure.thumbnailUrl} alt={brochure.title} className="w-full h-full object-cover" />
                      ) : brochure.previewUrl.includes('image') || brochure.previewUrl.includes('data:image') ? (
                        // Show image preview for image files
                        <img src={brochure.previewUrl} alt={brochure.title} className="w-full h-full object-cover" />
                      ) : (
                        // Show file icon for PDFs without thumbnail
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-16 w-16 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">PDF Document</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => triggerThumbnailUpload(brochure.id)}
                          className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary"
                          title="Add thumbnail image"
                        >
                          <Image className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => downloadBrochure(brochure)}
                          className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteBrochure(brochure.id)}
                          className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {brochure.thumbnailUrl && (
                        <button
                          onClick={() => removeThumbnail(brochure.id)}
                          className="absolute bottom-2 right-2 px-2 py-1 text-xs rounded bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
          className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <FileText className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium">Upload marketing collateral</p>
            <p className="text-sm">PDFs, brochures, whitepapers</p>
          </div>
        </button>
      )}
    </section>
  );
};
