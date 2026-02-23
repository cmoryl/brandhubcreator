import { useState } from 'react';
import { Plus, X, Pencil, Copy, Check, Download } from 'lucide-react';
import { BrandSocialIcon } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import { safeUUID } from '@/lib/safeUUID';

interface SocialIconsSectionProps {
  socialIcons: BrandSocialIcon[];
  onSocialIconsChange: (socialIcons: BrandSocialIcon[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

const defaultIcons: Record<string, string> = {
  'LinkedIn': 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  'X': 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  'Instagram': 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  'Facebook': 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  'YouTube': 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  'GitHub': 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
};

export const SocialIconsSection = ({ socialIcons, onSocialIconsChange, customSubtitle, onSubtitleChange }: SocialIconsSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);

  // Determine if editing is allowed
  const canEdit = Boolean(onSocialIconsChange);

  const addIcon = (platform?: string) => {
    if (!onSocialIconsChange) return;
    const newIcon: BrandSocialIcon = {
      id: safeUUID(),
      platform: platform || 'Custom',
      svgPath: platform ? defaultIcons[platform] || 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' : 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    };
    onSocialIconsChange([...socialIcons, newIcon]);
    if (!platform) setEditingId(newIcon.id);
  };

  const updateIcon = (id: string, updates: Partial<BrandSocialIcon>) => {
    if (!onSocialIconsChange) return;
    onSocialIconsChange(socialIcons.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteIcon = (id: string) => {
    if (!onSocialIconsChange) return;
    onSocialIconsChange(socialIcons.filter(i => i.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const copySVG = async (icon: BrandSocialIcon) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="${icon.svgPath}"/></svg>`;
    await navigator.clipboard.writeText(svg);
    setCopiedId(icon.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadSVG = (icon: BrandSocialIcon, color: string = 'currentColor') => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="512" height="512"><path d="${icon.svgPath}"/></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const suffix = color === '#000000' ? '-black' : color === '#ffffff' ? '-white' : '';
    a.href = url;
    a.download = `${icon.platform.toLowerCase().replace(/\s+/g, '-')}-icon${suffix}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPNG = (icon: BrandSocialIcon, size: number = 512, color: string = '#000000') => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size}" height="${size}"><path d="${icon.svgPath}"/></svg>`;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      const suffix = color === '#000000' ? '-black' : color === '#ffffff' ? '-white' : '';
      a.download = `${icon.platform.toLowerCase().replace(/\s+/g, '-')}-icon${suffix}-${size}px.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = url;
  };

  const [downloadMenuId, setDownloadMenuId] = useState<string | null>(null);

  const unusedPlatforms = Object.keys(defaultIcons).filter(
    p => !socialIcons.some(i => i.platform === p)
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Platform Markers"
            defaultSubtitle="Approved social media icons for brand alignment"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        {canEdit && (
          <Button onClick={() => addIcon()} size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Custom Icon
          </Button>
        )}
      </div>

      {/* Quick add platforms - admin only */}
      {canEdit && unusedPlatforms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground py-1">Quick add:</span>
          {unusedPlatforms.map(platform => (
            <Button
              key={platform}
              variant="outline"
              size="sm"
              onClick={() => addIcon(platform)}
              className="gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d={defaultIcons[platform]} />
              </svg>
              {platform}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {socialIcons.map((icon, index) => (
          <div
            key={icon.id}
            className="group relative bg-card rounded-xl p-4 shadow-sm border border-border animate-scale-in flex flex-col items-center cursor-pointer"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <svg
              className="w-10 h-10 text-foreground mb-3"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d={icon.svgPath} />
            </svg>
            <p className="text-sm font-medium text-foreground text-center">{icon.platform}</p>

            <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); copySVG(icon); }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title="Copy SVG"
              >
                {copiedId === icon.id ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <Copy className="h-4 w-4 text-white" />
                )}
              </button>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setDownloadMenuId(downloadMenuId === icon.id ? null : icon.id); }}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4 text-white" />
                </button>
                {downloadMenuId === icon.id && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border border-border rounded-lg shadow-lg p-1.5 min-w-[120px] z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1">Original</p>
                    <button onClick={() => { downloadSVG(icon); setDownloadMenuId(null); }} className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-foreground">SVG</button>
                    <button onClick={() => { downloadPNG(icon, 512); setDownloadMenuId(null); }} className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-foreground">PNG 512px</button>
                    <button onClick={() => { downloadPNG(icon, 1024); setDownloadMenuId(null); }} className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-foreground">PNG 1024px</button>
                    <div className="border-t border-border my-1" />
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-0.5">Black</p>
                    <button onClick={() => { downloadSVG(icon, '#000000'); setDownloadMenuId(null); }} className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-foreground">SVG</button>
                    <button onClick={() => { downloadPNG(icon, 512, '#000000'); setDownloadMenuId(null); }} className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-foreground">PNG 512px</button>
                    <button onClick={() => { downloadPNG(icon, 1024, '#000000'); setDownloadMenuId(null); }} className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-foreground">PNG 1024px</button>
                    <div className="border-t border-border my-1" />
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-0.5">White</p>
                    <button onClick={() => { downloadSVG(icon, '#ffffff'); setDownloadMenuId(null); }} className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-foreground">SVG</button>
                    <button onClick={() => { downloadPNG(icon, 512, '#ffffff'); setDownloadMenuId(null); }} className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-foreground">PNG 512px</button>
                    <button onClick={() => { downloadPNG(icon, 1024, '#ffffff'); setDownloadMenuId(null); }} className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-foreground">PNG 1024px</button>
                  </div>
                )}
              </div>
            </div>

            {canEdit && (
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingId(icon.id); }}
                  className="p-1 rounded bg-background/80"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteIcon(icon.id); }}
                  className="p-1 rounded bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {socialIcons.length === 0 && canEdit && (
          <button
            onClick={() => addIcon('LinkedIn')}
            className="col-span-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add social icons</span>
          </button>
        )}
        {socialIcons.length === 0 && !canEdit && (
          <div className="col-span-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <span className="text-sm font-medium">No social icons configured</span>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingId(null)}>
          <div className="bg-card rounded-xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Edit Social Icon</h3>
            {(() => {
              const icon = socialIcons.find(i => i.id === editingId);
              if (!icon) return null;
              return (
                <>
                  <Input
                    value={icon.platform}
                    onChange={(e) => updateIcon(icon.id, { platform: e.target.value })}
                    placeholder="Platform name"
                  />
                  <Textarea
                    value={icon.svgPath}
                    onChange={(e) => updateIcon(icon.id, { svgPath: e.target.value })}
                    placeholder="SVG path data"
                    className="font-mono text-xs min-h-[100px]"
                  />
                  <div className="flex items-center gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d={icon.svgPath} />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">Preview</p>
                  </div>
                  <Button onClick={() => setEditingId(null)} className="w-full">Done</Button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
};
