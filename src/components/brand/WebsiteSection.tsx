import { useState, useRef } from 'react';
import { Plus, X, Pencil, ExternalLink, Image, Upload } from 'lucide-react';
import { BrandWebsiteLink } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';
import { WebsiteAnalysisCard } from './WebsiteAnalysisCard';

interface WebsiteSectionProps {
  websites: BrandWebsiteLink[];
  onWebsitesChange?: (websites: BrandWebsiteLink[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityName?: string;
  industry?: string;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  organizationId?: string | null;
  brandContext?: {
    colors?: string[];
    archetype?: string;
    mission?: string;
    tagline?: string;
    competitors?: string[];
  };
}

export const WebsiteSection = ({ websites, onWebsitesChange, customSubtitle, onSubtitleChange, entityName, industry, entityId, entityType, organizationId, brandContext }: WebsiteSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadId, setPendingUploadId] = useState<string | null>(null);

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

  const triggerScreenshotUpload = (id: string) => {
    if (!canEdit) return;
    setPendingUploadId(id);
    fileInputRef.current?.click();
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateLink(pendingUploadId, { screenshotUrl: dataUrl });
      setPendingUploadId(null);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="space-y-6">
      {/* Hidden file input for screenshot uploads */}
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
        {websites.map((link, index) => (
          <>
            <div
              key={link.id}
              className="group relative bg-card rounded-xl shadow-sm border border-border overflow-hidden animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Screenshot Preview Area */}
              <div 
                className={`relative aspect-video bg-muted/50 overflow-hidden ${canEdit ? 'cursor-pointer' : ''}`}
                onClick={canEdit ? () => triggerScreenshotUpload(link.id) : undefined}
              >
                {link.screenshotUrl ? (
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
                {canEdit && link.screenshotUrl && (
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

            {/* Website Analysis Card - next to each website */}
            {canEdit && link.url && (
              <WebsiteAnalysisCard
                key={`analysis-${link.id}`}
                websiteUrl={link.url}
                websiteLabel={link.label}
                entityName={entityName}
                industry={industry}
                entityId={entityId}
                entityType={entityType}
                organizationId={organizationId}
                brandContext={brandContext}
              />
            )}
          </>
        ))}

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
