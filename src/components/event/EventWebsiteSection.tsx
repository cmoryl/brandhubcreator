import { useState, useRef } from 'react';
import { Plus, X, Pencil, ExternalLink, Image, Upload, Globe, Eye, Loader2 } from 'lucide-react';
import { BrandWebsiteLink } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/brand/SectionHeader';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { toast } from 'sonner';

interface EventWebsiteSectionProps {
  websites: BrandWebsiteLink[];
  onWebsitesChange: (websites: BrandWebsiteLink[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  isEditable?: boolean;
  entityId?: string;
}

export const EventWebsiteSection = ({ 
  websites, 
  onWebsitesChange, 
  customSubtitle, 
  onSubtitleChange,
  isEditable = true,
  entityId,
}: EventWebsiteSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<BrandWebsiteLink | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadId, setPendingUploadId] = useState<string | null>(null);
  const { uploadFile } = useStorageUpload({ entityType: 'event', entityId });

  const addLink = () => {
    const newLink: BrandWebsiteLink = {
      id: crypto.randomUUID(),
      label: 'Event Website',
      url: 'https://event.example.com',
    };
    onWebsitesChange([...websites, newLink]);
    setEditingId(newLink.id);
  };

  const updateLink = (id: string, updates: Partial<BrandWebsiteLink>) => {
    onWebsitesChange(websites.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const deleteLink = (id: string) => {
    onWebsitesChange(websites.filter((w) => w.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const triggerScreenshotUpload = (id: string) => {
    setPendingUploadId(id);
    fileInputRef.current?.click();
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadId) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!entityId) {
      toast.error('Save the event first to enable screenshot uploads.');
      setPendingUploadId(null);
      return;
    }

    setIsUploadingScreenshot(true);
    try {
      const result = await uploadFile(file, 'asset', `website-screenshot-${pendingUploadId}`);
      if (result?.url) {
        updateLink(pendingUploadId, { screenshotUrl: result.url });
      }
    } finally {
      setIsUploadingScreenshot(false);
      setPendingUploadId(null);
    }
  };

  const openPreview = (link: BrandWebsiteLink) => {
    setPreviewItem(link);
    setPreviewOpen(true);
  };

  return (
    <section id="eventwebsites" className="scroll-mt-24 space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleScreenshotUpload}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Event Website"
            defaultSubtitle="Official event website links and landing pages"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        {isEditable && (
          <Button onClick={addLink} size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Website
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {websites.map((link, index) => (
          <div
            key={link.id}
            className="group relative bg-card rounded-xl shadow-sm border border-border overflow-hidden animate-scale-in hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Screenshot Preview Area */}
            <div 
              className="relative aspect-video bg-gradient-to-br from-muted/50 to-muted cursor-pointer overflow-hidden"
              onClick={() => isEditable ? triggerScreenshotUpload(link.id) : openPreview(link)}
            >
              {link.screenshotUrl ? (
                <>
                  <img 
                    src={link.screenshotUrl} 
                    alt={`${link.label} screenshot`}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Preview button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(link);
                    }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    aria-label="Preview screenshot"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-accent transition-colors">
                  <Globe className="h-10 w-10 opacity-50" />
                  {isEditable && <span className="text-xs font-medium">Add Screenshot</span>}
                </div>
              )}
              {/* Hover overlay for editing */}
              {isEditable && link.screenshotUrl && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <Upload className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            {/* Link Details */}
            <div className="p-4">
              {editingId === link.id && isEditable ? (
                <div className="space-y-3">
                  <Input
                    value={link.label}
                    onChange={(e) => updateLink(link.id, { label: e.target.value })}
                    placeholder="Label (e.g. Event Site, Registration)"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(link.id, { url: e.target.value })}
                    placeholder="https://…"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="flex-1">
                      Done
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteLink(link.id)} className="gap-2">
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{link.label}</h3>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-1 truncate max-w-full"
                      title={link.url}
                    >
                      {link.url} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                  {isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(link.id)}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                        aria-label="Edit website link"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        aria-label="Delete website link"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {websites.length === 0 && isEditable && (
          <button
            onClick={addLink}
            className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Globe className="h-8 w-8" />
            <span className="text-sm font-medium">Add event website</span>
          </button>
        )}
      </div>

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewItem?.label || 'Website Preview'}
        previewUrl={previewItem?.screenshotUrl}
        externalUrl={previewItem?.url}
        type="image"
      />
    </section>
  );
};
