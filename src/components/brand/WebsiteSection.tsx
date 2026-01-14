import { useState } from 'react';
import { Plus, X, Pencil, ExternalLink } from 'lucide-react';
import { BrandWebsiteLink } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';

interface WebsiteSectionProps {
  websites: BrandWebsiteLink[];
  onWebsitesChange: (websites: BrandWebsiteLink[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const WebsiteSection = ({ websites, onWebsitesChange, customSubtitle, onSubtitleChange }: WebsiteSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);

  const addLink = () => {
    const newLink: BrandWebsiteLink = {
      id: crypto.randomUUID(),
      label: 'Main Website',
      url: 'https://example.com',
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

  return (
    <section className="space-y-6">
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
        <Button onClick={addLink} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Link
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {websites.map((link, index) => (
          <div
            key={link.id}
            className="group relative bg-card rounded-xl p-4 shadow-sm border border-border animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {editingId === link.id ? (
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
              </div>
            )}
          </div>
        ))}

        {websites.length === 0 && (
          <button
            onClick={addLink}
            className="h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add website link</span>
          </button>
        )}
      </div>
    </section>
  );
};
