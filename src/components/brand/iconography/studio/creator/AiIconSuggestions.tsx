/**
 * AiIconSuggestions - AI-powered icon recommendations based on brand context
 * Uses lazy-loaded Lucide icons to avoid pulling 780KB into the main bundle
 */

import { useState, useMemo, createElement, useCallback, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, Search, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AiIconSuggestionsProps {
  organizationId: string;
  brandColors: Array<{ hex: string; name: string }>;
  selectedLibraryId: string;
  onSaveIcons: (icons: BrandIconography[], libraryId?: string) => void;
}

// Lazy-load the full Lucide icons module only when this component mounts
let lucideIconsCache: Record<string, any> | null = null;
let lucideNamesCache: string[] | null = null;

const loadLucideIcons = async () => {
  if (lucideIconsCache) return { icons: lucideIconsCache, names: lucideNamesCache! };
  const mod = await import('lucide-react');
  lucideIconsCache = mod as any;
  lucideNamesCache = Object.keys(mod).filter(name => {
    if (['createLucideIcon', 'default', 'icons', 'Icon', 'createElement', 'dynamicIconImports'].includes(name)) return false;
    if (name.startsWith('Lucide')) return false;
    if (!/^[A-Z]/.test(name)) return false;
    const val = (mod as any)[name];
    return val && typeof val === 'object' && val.$$typeof;
  });
  return { icons: lucideIconsCache, names: lucideNamesCache };
};

interface SuggestedIcon {
  lucideName: string;
  reason: string;
  category: string;
}

export const AiIconSuggestions = ({
  organizationId,
  brandColors,
  selectedLibraryId,
  onSaveIcons,
}: AiIconSuggestionsProps) => {
  const [industry, setIndustry] = useState('');
  const [context, setContext] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestedIcon[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [iconsReady, setIconsReady] = useState(!!lucideIconsCache);

  // Preload icons module on mount
  useEffect(() => {
    if (!lucideIconsCache) {
      loadLucideIcons().then(() => setIconsReady(true));
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!industry.trim() && !context.trim()) {
      toast.error('Please provide an industry or context');
      return;
    }
    setIsLoading(true);
    setSuggestions([]);
    setSelectedSuggestions(new Set());

    try {
      const { names } = await loadLucideIcons();
      const { data, error } = await supabase.functions.invoke('suggest-icons', {
        body: {
          industry: industry.trim(),
          context: context.trim(),
          brandColors: brandColors.map(c => c.hex),
          availableIcons: names.slice(0, 500),
        },
      });

      if (error) throw error;

      const parsed = Array.isArray(data?.suggestions) ? data.suggestions : [];
      const valid = parsed.filter((s: SuggestedIcon) =>
        names.includes(s.lucideName)
      ).slice(0, 30);

      if (valid.length === 0) {
        toast.info('No matching icons found. Try a different description.');
      } else {
        setSuggestions(valid);
        toast.success(`Found ${valid.length} recommended icons`);
      }
    } catch (err) {
      console.error('AI suggestion error:', err);
      toast.error('Failed to get suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [industry, context, brandColors]);

  const toggleSelection = (name: string) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const extractSvg = useCallback((iconName: string): string => {
    if (!lucideIconsCache) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(tempDiv);
    let svgString = '';
    try {
      const IconComp = lucideIconsCache[iconName];
      if (IconComp) {
        const root = createRoot(tempDiv);
        flushSync(() => {
          root.render(createElement(IconComp, { size: 24 }));
        });
        const svgEl = tempDiv.querySelector('svg');
        if (svgEl) {
          svgEl.removeAttribute('class');
          svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          svgString = svgEl.outerHTML;
        }
        root.unmount();
      }
    } catch {}
    document.body.removeChild(tempDiv);
    return svgString || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
  }, []);

  const handleAddSelected = () => {
    if (selectedSuggestions.size === 0) { toast.error('Select at least one icon'); return; }
    const baseTs = Date.now();
    const icons: BrandIconography[] = Array.from(selectedSuggestions).map((iconName, idx) => {
      const suggestion = suggestions.find(s => s.lucideName === iconName);
      return {
        id: `suggest-${baseTs}-${idx}-${iconName}`,
        name: iconName.replace(/([A-Z])/g, ' $1').trim(),
        svgPath: extractSvg(iconName),
        category: suggestion?.category || 'suggested',
        viewBox: '0 0 24 24',
        fillMode: 'stroke' as const,
      };
    });
    onSaveIcons(icons, selectedLibraryId || undefined);
    setSelectedSuggestions(new Set());
    toast.success(`Added ${icons.length} icons`);
  };

  const renderIcon = (iconName: string, size = 24) => {
    if (!lucideIconsCache) return null;
    const IconComponent = lucideIconsCache[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={size} />;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Industry / Sector</Label>
          <Input
            placeholder="e.g., Healthcare, Fintech, E-commerce, Education"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Additional Context (optional)</Label>
          <Input
            placeholder="e.g., B2B SaaS, mobile app, sustainability focus"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={fetchSuggestions} disabled={isLoading} className="gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isLoading ? 'Analyzing...' : 'Get AI Suggestions'}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{selectedSuggestions.size} selected</Badge>
            <Button
              onClick={handleAddSelected}
              disabled={selectedSuggestions.size === 0}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Selected
            </Button>
          </div>

          <ScrollArea className="h-[350px] border rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map((s) => {
                const isSelected = selectedSuggestions.has(s.lucideName);
                return (
                  <button
                    key={s.lucideName}
                    onClick={() => toggleSelection(s.lucideName)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      {renderIcon(s.lucideName, 22)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {s.lucideName.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{s.reason}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{s.category}</Badge>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
