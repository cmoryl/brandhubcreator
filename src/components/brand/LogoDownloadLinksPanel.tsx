import { useState } from 'react';
import { Download, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { LogoDownloadLink } from '@/types/brand';
import { useDownloadTracking } from '@/hooks/useDownloadTracking';

interface LogoDownloadLinksPanelProps {
  logoId: string;
  logoName: string;
  allLinks: LogoDownloadLink[];
  canEdit: boolean;
  onLinksChange?: (links: LogoDownloadLink[]) => void;
  entityId?: string;
  entityType?: string;
  entityName?: string;
  organizationId?: string;
}

export function LogoDownloadLinksPanel({ logoId, logoName, allLinks, canEdit, onLinksChange, entityId, entityType, entityName, organizationId }: LogoDownloadLinksPanelProps) {
  const { trackDownload } = useDownloadTracking();

  const handleLinkDownload = (link: LogoDownloadLink) => {
    trackDownload({
      entityId: entityId,
      entityType: entityType || 'brand',
      entityName: entityName || logoName,
      organizationId,
      details: {
        download_type: 'logo',
        format: link.format || 'package',
        file_name: link.label,
        source_section: 'logo_download_links',
        logo_id: logoId,
        logo_name: logoName,
        link_id: link.id,
        link_url: link.url,
      },
    });
  };
  const [showAdd, setShowAdd] = useState(false);
  const [newLink, setNewLink] = useState({ label: '', url: '', format: '' });

  const linksForLogo = allLinks.filter(l => l.logoId === logoId);

  const handleAdd = () => {
    if (!onLinksChange || !newLink.label.trim() || !newLink.url.trim()) return;
    const link: LogoDownloadLink = {
      id: `dl-${Date.now()}`,
      label: newLink.label.trim(),
      url: newLink.url.trim()
        .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
        .replace('?dl=0', '?dl=1'),
      format: newLink.format || 'package',
      logoId,
    };
    onLinksChange([...allLinks, link]);
    setNewLink({ label: '', url: '', format: '' });
    setShowAdd(false);
    toast.success('Download link added');
  };

  const handleRemove = (linkId: string) => {
    if (!onLinksChange) return;
    onLinksChange(allLinks.filter(l => l.id !== linkId));
    toast.success('Download link removed');
  };

  if (linksForLogo.length === 0 && !canEdit) return null;

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Download Links</h4>
          {linksForLogo.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{linksForLogo.length}</Badge>
          )}
        </div>
        {canEdit && onLinksChange && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-3.5 w-3.5" />
            Add Link
          </Button>
        )}
      </div>

      {showAdd && canEdit && onLinksChange && (
        <div className="border border-dashed border-border rounded-lg p-3 space-y-2 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              value={newLink.label}
              onChange={e => setNewLink(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Label (e.g. SVG Pack)"
              className="h-8 text-sm"
            />
            <Input
              value={newLink.url}
              onChange={e => setNewLink(prev => ({ ...prev, url: e.target.value }))}
              placeholder="Dropbox link (https://...)"
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Select value={newLink.format || 'package'} onValueChange={v => setNewLink(prev => ({ ...prev, format: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="package">Package (ZIP)</SelectItem>
                  <SelectItem value="SVG">SVG</SelectItem>
                  <SelectItem value="PNG">PNG</SelectItem>
                  <SelectItem value="EPS">EPS</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8" disabled={!newLink.label.trim() || !newLink.url.trim()} onClick={handleAdd}>
                Add
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Paste a Dropbox share link — it will be auto-converted to a direct download URL.
          </p>
        </div>
      )}

      {linksForLogo.length > 0 && (
        <div className="space-y-1.5">
          {linksForLogo.map(link => (
            <div key={link.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{link.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">{link.url}</p>
                </div>
                {link.format && <Badge variant="outline" className="text-[10px] shrink-0">{link.format}</Badge>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={link.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-medium"
                  title={`Download ${link.label}`}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground" title="Open in new tab">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                {canEdit && onLinksChange && (
                  <button onClick={() => handleRemove(link.id)} className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100" title="Remove">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {linksForLogo.length === 0 && canEdit && (
        <p className="text-xs text-muted-foreground text-center py-2">No download links yet. Add Dropbox or cloud storage links for this logo.</p>
      )}
    </div>
  );
}
