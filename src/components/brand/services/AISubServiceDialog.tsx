import { useEffect, useMemo, useState } from 'react';
import { Loader2, Sparkles, Globe, Plus, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BrandService, BrandSubService, BrandWebsiteLink } from '@/types/brand';

interface AISubServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: BrandService | null;
  brandName?: string;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  brandWebsites?: BrandWebsiteLink[];
  onAccept: (subServices: BrandSubService[]) => void;
}

interface Suggestion {
  name: string;
  description: string;
}

const normalizeUrl = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const AISubServiceDialog = ({
  open,
  onOpenChange,
  service,
  brandName,
  entityId,
  entityType,
  brandWebsites,
  onAccept,
}: AISubServiceDialogProps) => {
  const defaultUrls = useMemo(
    () =>
      (brandWebsites || [])
        .map((w) => normalizeUrl(w.url || ''))
        .filter((u): u is string => Boolean(u)),
    [brandWebsites],
  );

  const [selectedUrls, setSelectedUrls] = useState<string[]>(defaultUrls);
  const [customUrl, setCustomUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [acceptedIndexes, setAcceptedIndexes] = useState<Set<number>>(new Set());
  const [editedSuggestions, setEditedSuggestions] = useState<Suggestion[]>([]);

  // Reset state when dialog opens for a new service
  useEffect(() => {
    if (open) {
      setSelectedUrls(defaultUrls);
      setCustomUrl('');
      setSuggestions(null);
      setAcceptedIndexes(new Set());
      setEditedSuggestions([]);
    }
  }, [open, defaultUrls]);

  const toggleUrl = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  const addCustomUrl = () => {
    const normalized = normalizeUrl(customUrl);
    if (!normalized) {
      toast.error('Enter a valid URL');
      return;
    }
    if (selectedUrls.includes(normalized)) {
      toast.info('URL already added');
      return;
    }
    setSelectedUrls((prev) => [...prev, normalized]);
    setCustomUrl('');
  };

  const handleGenerate = async () => {
    if (!service) return;
    if (selectedUrls.length === 0) {
      toast.error('Select or add at least one source URL');
      return;
    }

    setIsLoading(true);
    setSuggestions(null);
    setAcceptedIndexes(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('generate-sub-services', {
        body: {
          parentServiceName: service.name,
          parentServiceDescription: service.description,
          brandName,
          urls: selectedUrls,
          entityId,
          entityType,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const list: Suggestion[] = Array.isArray(data?.suggestions) ? data.suggestions : [];
      if (list.length === 0) {
        toast.warning('AI did not return any sub-service suggestions for these sources.');
      }

      // Filter out items that match existing sub-services (case-insensitive)
      const existingNames = new Set(
        (service.subServices || []).map((s) => s.name.trim().toLowerCase()),
      );
      const filtered = list.filter((s) => !existingNames.has(s.name.trim().toLowerCase()));

      setSuggestions(filtered);
      setEditedSuggestions(filtered);
      // Default: pre-select all suggestions
      setAcceptedIndexes(new Set(filtered.map((_, i) => i)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate sub-services';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccept = (idx: number) => {
    setAcceptedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const updateSuggestion = (idx: number, field: 'name' | 'description', value: string) => {
    setEditedSuggestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleConfirm = () => {
    if (!service) return;
    const accepted = editedSuggestions
      .filter((_, idx) => acceptedIndexes.has(idx))
      .filter((s) => s.name.trim().length > 0)
      .map<BrandSubService>((s) => ({
        id: crypto.randomUUID(),
        name: s.name.trim(),
        description: s.description.trim() || undefined,
        sourceUrl: selectedUrls[0],
        generatedByAi: true,
      }));

    if (accepted.length === 0) {
      toast.info('Select at least one sub-service to add.');
      return;
    }

    onAccept(accepted);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Sub-Services
            {service && (
              <Badge variant="secondary" className="ml-1 text-xs font-medium">
                {service.name}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Pull sub-services for this offering directly from the brand's website. Review and pick the ones to add.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* Source URLs */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              Source URLs
            </div>

            {defaultUrls.length > 0 && (
              <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Saved brand websites:</p>
                {defaultUrls.map((url) => (
                  <label key={url} className="flex items-start gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedUrls.includes(url)}
                      onCheckedChange={() => toggleUrl(url)}
                      className="mt-0.5"
                    />
                    <span className="break-all">{url}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="custom-url" className="text-xs text-muted-foreground">
                {defaultUrls.length === 0 ? 'Enter a URL to scrape' : 'Add another URL'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="custom-url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/services"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomUrl();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addCustomUrl}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectedUrls.filter((u) => !defaultUrls.includes(u)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedUrls
                    .filter((u) => !defaultUrls.includes(u))
                    .map((url) => (
                      <Badge key={url} variant="outline" className="gap-1 text-[11px]">
                        <span className="max-w-[260px] truncate">{url}</span>
                        <button
                          type="button"
                          onClick={() => toggleUrl(url)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${url}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || selectedUrls.length === 0}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning sources…
                </>
              ) : suggestions ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate sub-services
                </>
              )}
            </Button>
          </section>

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <>
              <Separator />
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Suggested sub-services
                    <span className="ml-2 text-foreground font-medium">
                      {acceptedIndexes.size}/{suggestions.length} selected
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() =>
                        setAcceptedIndexes(new Set(suggestions.map((_, i) => i)))
                      }
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setAcceptedIndexes(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <ScrollArea className="max-h-[42vh] pr-3">
                  <div className="space-y-2.5">
                    {editedSuggestions.map((s, idx) => {
                      const checked = acceptedIndexes.has(idx);
                      return (
                        <div
                          key={idx}
                          className={`rounded-md border p-3 transition-colors ${
                            checked
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-border bg-card'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleAccept(idx)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <Input
                                value={s.name}
                                onChange={(e) =>
                                  updateSuggestion(idx, 'name', e.target.value)
                                }
                                className="h-8 text-sm font-medium"
                              />
                              <Textarea
                                value={s.description}
                                onChange={(e) =>
                                  updateSuggestion(idx, 'description', e.target.value)
                                }
                                rows={2}
                                className="text-xs resize-none"
                                placeholder="Short description"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </section>
            </>
          )}

          {suggestions && suggestions.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              No new sub-services found in these sources. Try a different page (e.g. a services or solutions page) and run again.
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!suggestions || acceptedIndexes.size === 0 || isLoading}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Add {acceptedIndexes.size > 0 ? acceptedIndexes.size : ''} sub-service
            {acceptedIndexes.size === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
