/**
 * CanvaTemplateKitEditor
 * ---------------------------------------------------------
 * Admin-only inline editor for the per-platform Canva template
 * links that power the "Live Templates" row on each platform tab
 * of SocialAssetsRefreshed.
 *
 * Data shape (stored on the entity as `canvaTemplateKit`):
 *   { LinkedIn: [{ id, name, url, format?, thumbnailUrl? }, ...], ... }
 *
 * No backend changes — the field lives inside guide_data JSONB
 * so it round-trips through existing update handlers.
 */

import { useState } from 'react';
import { Plus, Trash2, ExternalLink, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CanvaTemplateKit, CanvaTemplateKitItem } from '@/types/brand';

const PLATFORM_ORDER = ['LinkedIn', 'Instagram', 'X', 'YouTube', 'Facebook', 'TikTok'] as const;
type Platform = typeof PLATFORM_ORDER[number];

interface Props {
  value: CanvaTemplateKit | undefined;
  onChange: (next: CanvaTemplateKit) => void;
  onClose: () => void;
  initialPlatform?: Platform;
  focusItemId?: string;
}

const isCanvaUrl = (u: string) =>
  /canva\.com|canva\.link/i.test(u.trim());

const genId = () =>
  (globalThis.crypto as any)?.randomUUID?.() ??
  `kit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const CanvaTemplateKitEditor = ({ value, onChange, onClose, initialPlatform, focusItemId }: Props) => {
  const [kit, setKit] = useState<CanvaTemplateKit>(() => ({ ...(value || {}) }));
  const [activePlatform, setActivePlatform] = useState<Platform>(initialPlatform || 'LinkedIn');

  const items = kit[activePlatform] || [];

  const updateItem = (idx: number, patch: Partial<CanvaTemplateKitItem>) => {
    const next = { ...kit };
    const list = [...(next[activePlatform] || [])];
    list[idx] = { ...list[idx], ...patch };
    next[activePlatform] = list;
    setKit(next);
  };

  const addItem = () => {
    const next = { ...kit };
    next[activePlatform] = [
      ...(next[activePlatform] || []),
      { id: genId(), name: '', url: '', format: '' },
    ];
    setKit(next);
  };

  const removeItem = (idx: number) => {
    const next = { ...kit };
    next[activePlatform] = (next[activePlatform] || []).filter((_, i) => i !== idx);
    setKit(next);
  };

  const handleSave = () => {
    // Basic validation
    for (const p of PLATFORM_ORDER) {
      for (const item of kit[p] || []) {
        if (item.url && !isCanvaUrl(item.url)) {
          toast.error(`"${item.name || item.url}" — not a Canva URL`, {
            description: 'Use links from canva.com or canva.link',
          });
          return;
        }
      }
    }
    // Strip fully empty rows
    const cleaned: CanvaTemplateKit = {};
    for (const p of PLATFORM_ORDER) {
      const list = (kit[p] || []).filter((i) => i.url?.trim());
      if (list.length) cleaned[p] = list;
    }
    onChange(cleaned);
    toast.success('Canva Template Kit saved');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[85vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Canva Template Kit</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paste a Canva template URL per platform. Each event can have its own kit — links flow into the Live Templates row.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Platform selector */}
        <div className="flex flex-wrap gap-1 px-5 pt-4">
          {PLATFORM_ORDER.map((p) => {
            const count = kit[p]?.length || 0;
            const isActive = p === activePlatform;
            return (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {p}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1 rounded ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              No Canva templates for {activePlatform} yet.
            </div>
          )}
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`border rounded-lg p-3 space-y-2.5 bg-background/40 ${
                focusItemId === item.id ? 'border-primary ring-2 ring-primary/30' : 'border-border'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    placeholder="e.g. LinkedIn Post — Life Sciences NEXT"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Format</Label>
                  <Input
                    value={item.format || ''}
                    onChange={(e) => updateItem(idx, { format: e.target.value })}
                    placeholder="Feed post"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Canva URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={item.url}
                    onChange={(e) => updateItem(idx, { url: e.target.value })}
                    placeholder="https://canva.link/..."
                    className="h-8 text-sm font-mono"
                  />
                  {item.url && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                      className="h-8 w-8 shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Thumbnail URL (optional)</Label>
                <Input
                  value={item.thumbnailUrl || ''}
                  onChange={(e) => updateItem(idx, { thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                  className="h-8 text-sm font-mono"
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            className="w-full h-9 border-dashed"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add {activePlatform} template
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save kit
          </Button>
        </div>
      </div>
    </div>
  );
};
