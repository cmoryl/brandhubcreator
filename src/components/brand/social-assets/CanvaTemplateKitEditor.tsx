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
import { Plus, Trash2, ExternalLink, X, Save, Wand2, LayoutGrid, Loader2, Search, Plug, RefreshCw } from 'lucide-react';
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
  const [pickerConnected, setPickerConnected] = useState<boolean | null>(null);
  const [pickerTemplates, setPickerTemplates] = useState<CanvaSyncedTemplate[]>([]);
  const [pickerQuery, setPickerQuery] = useState('');
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectClientId, setConnectClientId] = useState('');
  const [connectClientSecret, setConnectClientSecret] = useState('');
  const [syncing, setSyncing] = useState(false);

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

  const loadPickerTemplates = async () => {
    setPickerLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('canva-list');
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Failed');
      setPickerConnected(!!data.connected);
      setPickerTemplates(data.templates || []);
    } catch (e: any) {
      toast.error('Could not load Canva templates', { description: e?.message?.slice(0, 200) });
      setPickerConnected(false);
    } finally {
      setPickerLoading(false);
    }
  };

  const openPicker = async () => {
    setPickerOpen(true);
    if (pickerTemplates.length || pickerConnected !== null) return;
    await loadPickerTemplates();
  };

  const startCanvaConnect = () => {
    if (!connectClientId.trim() || !connectClientSecret.trim()) {
      toast.error('Enter both Client ID and Client Secret');
      return;
    }
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
    if (!supabaseUrl) {
      toast.error('Backend URL not configured');
      return;
    }
    const returnTo = window.location.pathname + window.location.search;
    const url = `${supabaseUrl}/functions/v1/canva-oauth-start?return_to=${encodeURIComponent(
      returnTo,
    )}&client_id=${encodeURIComponent(connectClientId.trim())}&client_secret=${encodeURIComponent(
      connectClientSecret.trim(),
    )}`;
    window.location.href = url;
  };

  const runCanvaSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('canva-sync');
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Sync failed');
      toast.success(`Synced ${data.synced} templates from Canva`);
      await loadPickerTemplates();
    } catch (e: any) {
      toast.error('Sync failed', { description: e?.message?.slice(0, 200) });
    } finally {
      setSyncing(false);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              className="h-9 border-dashed"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add {activePlatform} template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openPicker}
              className="h-9 border-dashed"
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Pick from Canva Templates
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save kit
          </Button>
        </div>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-[60] bg-background/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h4 className="text-base font-semibold text-foreground">Your Canva Brand Templates</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adds to <span className="font-medium text-foreground">{activePlatform}</span> · {filteredPickerTemplates.length} shown
                  {pickerConnected === false && (
                    <span className="ml-2 inline-block text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">Not connected</span>
                  )}
                  {pickerConnected === true && (
                    <span className="ml-2 inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Connected</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {pickerConnected === true && (
                  <Button variant="outline" size="sm" onClick={runCanvaSync} disabled={syncing} className="h-8 text-xs">
                    {syncing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Sync
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setConnectOpen((v) => !v)} className="h-8 text-xs">
                  <Plug className="h-3.5 w-3.5 mr-1.5" />
                  {pickerConnected ? 'Reconnect' : 'Connect Canva'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setPickerOpen(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {connectOpen && (
              <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-2">
                <div className="text-xs text-muted-foreground">
                  Create an Integration at{' '}
                  <a
                    href="https://www.canva.com/developers/integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    canva.com/developers/integrations
                  </a>
                  , set redirect URL to{' '}
                  <code className="text-[10px] bg-background px-1 py-0.5 rounded">
                    {(import.meta as any).env?.VITE_SUPABASE_URL}/functions/v1/canva-oauth-callback
                  </code>
                  , enable scopes <code className="text-[10px]">brandtemplate:meta:read</code>,{' '}
                  <code className="text-[10px]">brandtemplate:content:read</code>,{' '}
                  <code className="text-[10px]">design:meta:read</code>, then paste ID + Secret below.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Client ID</Label>
                    <Input
                      value={connectClientId}
                      onChange={(e) => setConnectClientId(e.target.value)}
                      placeholder="OA..."
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Client Secret</Label>
                    <Input
                      type="password"
                      value={connectClientSecret}
                      onChange={(e) => setConnectClientSecret(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={startCanvaConnect} className="h-8 text-xs">
                    <Plug className="h-3.5 w-3.5 mr-1.5" />
                    Authorize with Canva
                  </Button>
                </div>
              </div>
            )}

            <div className="px-4 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Search templates by title..."
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {pickerLoading ? (
                <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading templates…
                </div>
              ) : pickerConnected === false ? (
                <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  Canva isn't connected yet. Click <span className="font-medium text-foreground">Connect Canva</span> above to link your account.
                </div>
              ) : filteredPickerTemplates.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  No templates found. Click <span className="font-medium text-foreground">Sync</span> to pull the latest from Canva.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredPickerTemplates.map((t) => (
                    <button
                      key={t.canva_id}
                      onClick={() => addFromCanva(t)}
                      className="group text-left rounded-lg border border-border bg-background/40 overflow-hidden hover:border-primary hover:shadow-md transition-all"
                    >
                      <div className="aspect-[4/3] bg-muted overflow-hidden">
                        {t.thumbnail_url ? (
                          <img src={t.thumbnail_url} alt={t.title || ''} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No preview
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-medium text-foreground truncate">{t.title || 'Untitled'}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {t.design_type || (t.width && t.height ? `${t.width}×${t.height}` : '—')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
