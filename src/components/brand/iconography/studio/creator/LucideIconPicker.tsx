/**
 * LucideIconPicker - Browse and select Lucide icons with brand color preview
 */

import { useState, useMemo, createElement, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as LucideIcons from 'lucide-react';
import { Search, Check, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';

interface LucideIconPickerProps {
  brandColors: Array<{ hex: string; name: string }>;
  selectedLibraryId: string;
  onSaveIcons: (icons: BrandIconography[], libraryId?: string) => void;
}

// Get all Lucide icon names (computed once)
const LUCIDE_ICON_NAMES = Object.keys(LucideIcons).filter(name => {
  if (['createLucideIcon', 'default', 'icons', 'Icon', 'createElement', 'dynamicIconImports'].includes(name)) return false;
  if (name.startsWith('Lucide')) return false;
  if (!/^[A-Z]/.test(name)) return false;
  const val = (LucideIcons as any)[name];
  return val && typeof val === 'object' && val.$$typeof;
});

export const LucideIconPicker = ({
  brandColors,
  selectedLibraryId,
  onSaveIcons,
}: LucideIconPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return LUCIDE_ICON_NAMES.slice(0, 100);
    const query = searchQuery.toLowerCase();
    return LUCIDE_ICON_NAMES.filter(name =>
      name.toLowerCase().includes(query)
    ).slice(0, 100);
  }, [searchQuery]);

  const toggleIconSelection = (iconName: string) => {
    setSelectedIcons(prev => {
      const next = new Set(prev);
      if (next.has(iconName)) next.delete(iconName);
      else next.add(iconName);
      return next;
    });
  };

  const extractSvg = useCallback((iconName: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(tempDiv);
    let svgString = '';
    try {
      const IconComp = (LucideIcons as any)[iconName];
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
    } catch (err) {
      console.warn('Failed to extract SVG for', iconName, err);
    }
    document.body.removeChild(tempDiv);
    return svgString || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
  }, []);

  const handleSaveLucideIcons = () => {
    if (selectedIcons.size === 0) {
      toast.error('Please select at least one icon');
      return;
    }
    const baseTs = Date.now();
    const icons: BrandIconography[] = Array.from(selectedIcons).map((iconName, idx) => ({
      id: `icon-${baseTs}-${idx}-${iconName}`,
      name: iconName.replace(/([A-Z])/g, ' $1').trim(),
      svgPath: extractSvg(iconName),
      category: 'lucide',
      viewBox: '0 0 24 24',
      fillMode: 'stroke' as const,
    }));
    onSaveIcons(icons, selectedLibraryId || undefined);
    setSelectedIcons(new Set());
    toast.success(`Added ${icons.length} icons`);
  };

  const renderLucideIcon = (iconName: string, size: number = 24, color?: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color || 'currentColor'} />;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search 1500+ icons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selection Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{selectedIcons.size} selected</Badge>
          {selectedIcons.size > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIcons(new Set())}>
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-1.5 text-xs"
              >
                {showPreview ? <X className="h-3 w-3" /> : <Search className="h-3 w-3" />}
                {showPreview ? 'Hide Preview' : 'Preview with Colors'}
              </Button>
            </>
          )}
        </div>
        <Button onClick={handleSaveLucideIcons} disabled={selectedIcons.size === 0} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Selected
        </Button>
      </div>

      {/* Brand Color Preview Panel */}
      {showPreview && selectedIcons.size > 0 && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Preview with Brand Colors</Label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewColor(null)}
                className={cn(
                  'w-6 h-6 rounded border-2 flex items-center justify-center',
                  !previewColor ? 'border-primary' : 'border-border'
                )}
                title="Default"
              >
                <span className="text-[8px]">Aa</span>
              </button>
              {brandColors.slice(0, 8).map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setPreviewColor(c.hex)}
                  className={cn(
                    'w-6 h-6 rounded border-2',
                    previewColor === c.hex ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                  )}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {Array.from(selectedIcons).slice(0, 20).map((iconName) => (
              <div key={iconName} className="flex flex-col items-center gap-1">
                <div className="flex items-end gap-2 p-2 border rounded bg-background">
                  {[16, 24, 32, 48].map((size) => (
                    <div key={size} className="flex flex-col items-center gap-0.5">
                      <div style={{ width: size, height: size, color: previewColor || undefined }}>
                        {renderLucideIcon(iconName, size, previewColor || undefined)}
                      </div>
                      <span className="text-[8px] text-muted-foreground">{size}</span>
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {iconName.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            ))}
          </div>
          {selectedIcons.size > 20 && (
            <p className="text-xs text-muted-foreground">
              Showing 20 of {selectedIcons.size} selected icons
            </p>
          )}
        </div>
      )}

      {/* Icon Grid */}
      <ScrollArea className="h-[350px] border rounded-lg p-4">
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {filteredIcons.map((iconName) => {
            const isSelected = selectedIcons.has(iconName);
            return (
              <button
                key={iconName}
                onClick={() => toggleIconSelection(iconName)}
                className={cn(
                  'relative p-3 rounded-lg border flex items-center justify-center transition-all group',
                  isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
                title={iconName}
              >
                {renderLucideIcon(iconName, 20)}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {filteredIcons.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No icons found for "{searchQuery}"</p>
          </div>
        )}
      </ScrollArea>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filteredIcons.length} of {LUCIDE_ICON_NAMES.length} icons
      </p>
    </div>
  );
};
