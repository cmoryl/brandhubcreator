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
import { Plus, Trash2, ExternalLink, X, Save, Wand2, LayoutGrid, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { CanvaTemplateKit, CanvaTemplateKitItem } from '@/types/brand';

interface CanvaSyncedTemplate {
  canva_id: string;
  title: string | null;
  design_type: string | null;
  thumbnail_url: string | null;
  view_url: string | null;
  edit_url: string | null;
  width: number | null;
  height: number | null;
  tags: string[] | null;
}

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
  const [hydratingIdx, setHydratingIdx] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerTemplates, setPickerTemplates] = useState<CanvaSyncedTemplate[]>([]);
  const [pickerQuery, setPickerQuery] = useState('');

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

  const hydrateItemFromCanva = async (idx: number) => {
    const item = (kit[activePlatform] || [])[idx];
    if (!item?.url) {
      toast.error('Paste a Canva URL first');
      return;
    }
    if (!isCanvaUrl(item.url)) {
      toast.error('Not a Canva URL');
      return;
    }
    setHydratingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke('canva-resolve-design', {
        body: { url: item.url.trim() },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Failed');
      updateItem(idx, {
        name: item.name?.trim() || data.title || item.name,
        thumbnailUrl: data.thumbnailUrl || item.thumbnailUrl,
        format: item.format?.trim() || data.format || item.format,
        url: data.viewUrl || item.url,
      });
      toast.success('Pulled from Canva', { description: data.title || data.id });
    } catch (e: any) {
      toast.error('Could not fetch from Canva', {
        description: e?.message?.slice(0, 200) || 'Check that Canva is connected in Admin.',
      });
    } finally {
      setHydratingIdx(null);
    }
  };

  const openPicker = async () => {
    setPickerOpen(true);
    if (pickerTemplates.length) return;
    setPickerLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('canva-list');
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Failed');
      if (!data.connected) {
        toast.error('Canva not connected', { description: 'Connect Canva in Admin → Integrations.' });
      }
      setPickerTemplates(data.templates || []);
    } catch (e: any) {
      toast.error('Could not load Canva templates', { description: e?.message?.slice(0, 200) });
    } finally {
      setPickerLoading(false);
    }
  };

  const addFromCanva = (tpl: CanvaSyncedTemplate) => {
    const next = { ...kit };
    next[activePlatform] = [
      ...(next[activePlatform] || []),
      {
        id: genId(),
        name: tpl.title || 'Untitled template',
        url: tpl.view_url || tpl.edit_url || '',
        format: tpl.design_type || (tpl.width && tpl.height ? `${tpl.width}×${tpl.height}` : ''),
        thumbnailUrl: tpl.thumbnail_url || undefined,
      },
    ];
    setKit(next);
    toast.success(`Added "${tpl.title || 'template'}" to ${activePlatform}`);
  };

  const filteredPickerTemplates = pickerQuery.trim()
    ? pickerTemplates.filter((t) =>
        (t.title || '').toLowerCase().includes(pickerQuery.trim().toLowerCase()),
      )
    : pickerTemplates;

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
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => hydrateItemFromCanva(idx)}
                        disabled={hydratingIdx === idx}
                        title="Auto-fill name + thumbnail from Canva"
                        className="h-8 w-8 shrink-0"
                      >
                        {hydratingIdx === idx ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                        className="h-8 w-8 shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </>
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
