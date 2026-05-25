import { useState } from 'react';
import { Plus, X, Pencil, ExternalLink, Image, Upload, Loader2 } from 'lucide-react';
import { BrandWebsiteLink } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { TransPerfectWebsitePanel } from './identity/TransPerfectWebsitePanel';

interface WebsiteSectionProps {
  websites: BrandWebsiteLink[];
  onWebsitesChange?: (websites: BrandWebsiteLink[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  brandSlug?: string;
}

export const WebsiteSection = ({ websites, onWebsitesChange, customSubtitle, onSubtitleChange, entityType = 'brand', entityId, brandSlug }: WebsiteSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { uploadFile, isUploading } = useStorageUpload({
    entityType,
    entityId: entityId || 'default',
  });

  // Determine if editing is allowed
  const canEdit = !!onWebsitesChange;

  const addLink = () => {
    if (!onWebsitesChange) return;
    const newLink: BrandWebsiteLink = {
      id: crypto.randomUUID(),
      label: 'Main Website',
      url: 'https://example.com',
    };
    onWebsitesChange([...websites, newLink]);
    setEditingId(newLink.id);
  };

  const updateLink = (id: string, updates: Partial<BrandWebsiteLink>) => {
    if (!onWebsitesChange) return;
    onWebsitesChange(websites.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const deleteLink = (id: string) => {
    if (!onWebsitesChange) return;
    onWebsitesChange(websites.filter((w) => w.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleScreenshotUpload = async (id: string, file: File) => {
    if (!canEdit) return;
    setUploadingId(id);
    try {
      const result = await uploadFile(file, 'screenshot', `website-${id}`);
      if (result?.url) {
        updateLink(id, { screenshotUrl: result.url });
      }
    } catch (err) {
      console.error('Screenshot upload failed:', err);
    } finally {
      setUploadingId(null);
    }
  };

  const handleFileInput = (id: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleScreenshotUpload(id, file);
      }
    };
    input.click();
  };

  const isTransPerfect = brandSlug?.toLowerCase() === 'transperfect';

  return (
    <section className="space-y-6">
      {isTransPerfect && <TransPerfectWebsitePanel />}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Website"
            defaultSubtitle="Official website links for this brand"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        {canEdit && (
          <Button onClick={addLink} size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Link
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {websites.map((link, index) => {
          const isUploadingThis = uploadingId === link.id;
          // Detect and skip base64 data URIs for display — they should be replaced with storage URLs
          const hasValidScreenshot = link.screenshotUrl && !link.screenshotUrl.startsWith('data:');

          return (
            <div
              key={link.id}
              className="group relative bg-card rounded-xl shadow-sm border border-border overflow-hidden animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Screenshot Preview Area */}
              <div 
                className={`relative aspect-video bg-muted/50 overflow-hidden ${canEdit ? 'cursor-pointer' : ''}`}
                onClick={canEdit && !isUploadingThis ? () => handleFileInput(link.id) : undefined}
              >
                {isUploadingThis ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <span className="text-xs font-medium">Uploading...</span>
                  </div>
                ) : hasValidScreenshot ? (
                  <img 
                    src={link.screenshotUrl} 
                    alt={`${link.label} screenshot`}
                    className="w-full h-full object-cover object-top"
                  />
                ) : canEdit ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-accent transition-colors">
                    <Image className="h-8 w-8" />
                    <span className="text-xs font-medium">Add Screenshot</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Image className="h-8 w-8" />
                    <span className="text-xs font-medium">No Screenshot</span>
                  </div>
                )}
                {/* Hover overlay for existing screenshots */}
                {canEdit && hasValidScreenshot && !isUploadingThis && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>

              {/* Link Details */}
              <div className="p-4">
                {canEdit && editingId === link.id ? (
                  <div className="space-y-3">
                    <Input
                      value={link.label}
                      onChange={(e) => updateLink(link.id, { label: e.target.value })}
                      placeholder="Label (e.g. Main Website, Docs)"
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
                    {canEdit && (
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
          );
        })}

        {websites.length === 0 && canEdit && (
          <button
            onClick={addLink}
            className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add website link</span>
          </button>
        )}
        {websites.length === 0 && !canEdit && (
          <div className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ExternalLink className="h-6 w-6" />
            <span className="text-sm font-medium">No website links</span>
          </div>
        )}
      </div>
    </section>
  );
};
