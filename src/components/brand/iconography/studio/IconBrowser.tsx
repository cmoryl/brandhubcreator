/**
 * IconBrowser - IconStack-style multi-library icon browser
 * 
 * Features:
 * - Sidebar with 21 featured icon libraries + counts
 * - Global search across 200K+ icons via Iconify API
 * - Right-side customization panel: color picker, presets, stroke width
 * - Export: Copy SVG/XML, Download SVG/PNG
 * - Click to add icons to brand library
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Copy,
  Download,
  Code,
  Check,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BrandIconography } from '@/types/brand';
import {
  fetchCollections,
  searchIcons,
  fetchCollectionIcons,
  fetchIconSvg,
  FEATURED_LIBRARIES,
  INDUSTRY_CATEGORIES,
  type IconifyCollection,
} from '@/lib/api/iconify';

interface IconBrowserProps {
  brandColors?: Array<{ hex: string; name: string }>;
  onAddIcon?: (icon: BrandIconography) => void;
}

const COLOR_PRESETS = [
  '#1a1a2e', '#f8f8f8', '#6b7280', '#94a3b8',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
];

const ICONS_PER_PAGE = 120;

export const IconBrowser = ({ brandColors = [], onAddIcon }: IconBrowserProps) => {
  // State — default to Lucide so users land on a populated view, not an empty one.
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeLibrary, setActiveLibrary] = useState<string | null>('lucide');
  const [selectedIcon, setSelectedIcon] = useState<{ prefix: string; name: string } | null>(null);
  const [selectedSvg, setSelectedSvg] = useState<string>('');
  const [iconColor, setIconColor] = useState(brandColors[0]?.hex || '#0F1E3D');
  const [strokeWidth, setStrokeWidth] = useState([2]);
  const [copied, setCopied] = useState<'svg' | 'xml' | null>(null);
  const [page, setPage] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);


  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset page on search/library change
  useEffect(() => { setPage(0); }, [debouncedSearch, activeLibrary]);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Fetch collections for counts
  const { data: collections } = useQuery({
    queryKey: ['iconify-collections'],
    queryFn: fetchCollections,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  // Compute library list with counts
  const libraryList = useMemo(() => {
    if (!collections) return FEATURED_LIBRARIES.map(l => ({ ...l, total: 0 }));
    return FEATURED_LIBRARIES.map(l => ({
      ...l,
      total: collections[l.prefix]?.total || 0,
    }));
  }, [collections]);

  // Compute industry category counts
  const industryCategoriesWithCounts = useMemo(() => {
    return INDUSTRY_CATEGORIES.map(cat => ({
      ...cat,
      libraries: cat.libraries.map(lib => ({
        ...lib,
        total: collections?.[lib.prefix]?.total || 0,
      })),
      totalIcons: cat.libraries.reduce((sum, lib) => sum + (collections?.[lib.prefix]?.total || 0), 0),
    }));
  }, [collections]);

  const totalIcons = useMemo(() => {
    return libraryList.reduce((sum, l) => sum + l.total, 0);
  }, [libraryList]);

  const toggleCategory = useCallback((catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  // Search results
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['iconify-search', debouncedSearch, activeLibrary],
    queryFn: () => searchIcons(debouncedSearch, {
      prefix: activeLibrary || undefined,
      limit: 999,
    }),
    enabled: !!debouncedSearch.trim(),
    staleTime: 1000 * 60 * 5,
  });

  // Browse collection icons (when no search query)
  const { data: collectionIcons, isLoading: collectionLoading } = useQuery({
    queryKey: ['iconify-collection', activeLibrary],
    queryFn: () => fetchCollectionIcons(activeLibrary!),
    enabled: !!activeLibrary && !debouncedSearch.trim(),
    staleTime: 1000 * 60 * 10,
  });

  // Build icon list
  const iconList = useMemo(() => {
    if (debouncedSearch.trim() && searchResults) {
      return searchResults.icons.map(fullName => {
        const [prefix, ...rest] = fullName.split(':');
        return { prefix, name: rest.join(':') };
      });
    }
    if (activeLibrary && collectionIcons) {
      // Iconify API returns icons in different fields depending on the collection
      const names: string[] = [];
      // Some collections use an 'icons' object
      if (collectionIcons.icons) {
        names.push(...Object.keys(collectionIcons.icons));
      }
      // Most collections use 'categories' with arrays of icon names
      if (collectionIcons.categories) {
        Object.values(collectionIcons.categories).forEach(arr => names.push(...arr));
      }
      // And/or 'uncategorized' array
      if (collectionIcons.uncategorized) {
        names.push(...collectionIcons.uncategorized);
      }
      // Deduplicate
      const unique = [...new Set(names)];
      return unique.map(name => ({ prefix: activeLibrary, name }));
    }
    return [];
  }, [debouncedSearch, searchResults, activeLibrary, collectionIcons]);

  // Pagination
  const totalPages = Math.ceil(iconList.length / ICONS_PER_PAGE);
  const paginatedIcons = iconList.slice(page * ICONS_PER_PAGE, (page + 1) * ICONS_PER_PAGE);

  // Fetch selected icon SVG
  useEffect(() => {
    if (!selectedIcon) { setSelectedSvg(''); return; }
    fetchIconSvg(selectedIcon.prefix, selectedIcon.name)
      .then(svg => setSelectedSvg(svg))
      .catch(() => setSelectedSvg(''));
  }, [selectedIcon]);

  const handleCopySvg = useCallback(async () => {
    if (!selectedSvg) return;
    await navigator.clipboard.writeText(selectedSvg);
    setCopied('svg');
    toast.success('SVG copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  }, [selectedSvg]);

  const handleCopyXml = useCallback(async () => {
    if (!selectedSvg) return;
    // XML is just the SVG with XML declaration
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${selectedSvg}`;
    await navigator.clipboard.writeText(xml);
    setCopied('xml');
    toast.success('XML copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  }, [selectedSvg]);

  const handleDownloadSvg = useCallback(() => {
    if (!selectedIcon || !selectedSvg) return;
    const blob = new Blob([selectedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedIcon.name}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG downloaded');
  }, [selectedIcon, selectedSvg]);

  const handleDownloadPng = useCallback(async () => {
    if (!selectedIcon || !selectedSvg) return;
    try {
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([selectedSvg], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
          resolve();
        };
        img.onerror = reject;
        img.src = svgUrl;
      });

      URL.revokeObjectURL(svgUrl);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedIcon.name}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('PNG downloaded (512×512)');
      }, 'image/png');
    } catch {
      toast.error('Failed to generate PNG');
    }
  }, [selectedIcon, selectedSvg]);

  const handleAddToLibrary = useCallback(async () => {
    if (!selectedIcon || !selectedSvg || !onAddIcon) return;
    const icon: BrandIconography = {
      id: `${selectedIcon.prefix}-${selectedIcon.name}-${Date.now()}`,
      name: selectedIcon.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      svgPath: selectedSvg,
      category: selectedIcon.prefix,
      fillMode: 'stroke',
      viewBox: '0 0 24 24',
    };
    onAddIcon(icon);
    toast.success(`Added "${icon.name}" to library`);
  }, [selectedIcon, selectedSvg, onAddIcon]);

  const isLoading = searchLoading || collectionLoading;

  // Apply color/stroke to preview SVG
  const styledSvg = useMemo(() => {
    if (!selectedSvg) return '';
    let svg = selectedSvg;
    // Apply color
    svg = svg.replace(/stroke="[^"]*"/g, `stroke="${iconColor}"`);
    svg = svg.replace(/fill="[^"]*"/g, (match) => {
      if (match.includes('none')) return match;
      return `fill="${iconColor}"`;
    });
    // Apply stroke width
    svg = svg.replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeWidth[0]}"`);
    return svg;
  }, [selectedSvg, iconColor, strokeWidth]);

  return (
    <div className="flex h-[600px] border rounded-xl overflow-hidden bg-background">
      {/* ── Left Sidebar ── */}
      <div className="w-52 border-r flex flex-col bg-muted/30 shrink-0">
        <div className="p-3 border-b">
          <h3 className="text-sm font-semibold">Browse</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {/* All Icons */}
            <button
              onClick={() => { setActiveLibrary(null); setSearchQuery(''); }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                !activeLibrary ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
              )}
            >
              <span>All Icons</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {totalIcons.toLocaleString()}
              </Badge>
            </button>

            <Separator className="my-2" />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Libraries
            </p>

            {libraryList.map(lib => (
              <button
                key={lib.prefix}
                onClick={() => setActiveLibrary(lib.prefix)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors',
                  activeLibrary === lib.prefix
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <span className="truncate">{lib.name}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {lib.total.toLocaleString()}
                </span>
              </button>
            ))}

            <Separator className="my-2" />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Industry Presets
            </p>

            {industryCategoriesWithCounts.map(cat => (
              <div key={cat.id}>
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm hover:bg-muted text-foreground transition-colors"
                >
                  <span className="font-medium truncate">{cat.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {cat.totalIcons.toLocaleString()}
                    </span>
                    <ChevronDown className={cn(
                      'h-3 w-3 text-muted-foreground transition-transform',
                      expandedCategories.has(cat.id) && 'rotate-180'
                    )} />
                  </div>
                </button>
                {expandedCategories.has(cat.id) && (
                  <div className="ml-2 border-l border-border/50 pl-1 space-y-0.5">
                    {cat.libraries.map(lib => (
                      <button
                        key={lib.prefix}
                        onClick={() => setActiveLibrary(lib.prefix)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-1 rounded-md text-xs transition-colors',
                          activeLibrary === lib.prefix
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        <span className="truncate">{lib.name}</span>
                        <span className="text-[10px] tabular-nums">
                          {lib.total.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search bar */}
        <div className="p-4 border-b">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search icons..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-16"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-muted-foreground border rounded px-1.5 py-0.5 bg-muted">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Header */}
        <div className="px-4 py-2 flex items-center justify-between border-b bg-muted/20">
          <div>
            <h4 className="text-sm font-medium">
              {activeLibrary
                ? libraryList.find(l => l.prefix === activeLibrary)?.name || activeLibrary
                : debouncedSearch ? 'Search Results' : 'Select a library or search'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {iconList.length.toLocaleString()} icons
              {totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}
            </p>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Icon Grid */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : iconList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {debouncedSearch ? 'No icons found' : 'Select a library or search to browse icons'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-1">
                {paginatedIcons.map(icon => {
                  const isSelected = selectedIcon?.prefix === icon.prefix && selectedIcon?.name === icon.name;
                  return (
                    <Tooltip key={`${icon.prefix}:${icon.name}`}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSelectedIcon(icon)}
                          className={cn(
                            'aspect-square flex items-center justify-center rounded-lg border transition-all p-2',
                            isSelected
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                              : 'border-transparent hover:border-border hover:bg-muted/50'
                          )}
                        >
                          <img
                            src={`https://api.iconify.design/${icon.prefix}/${icon.name}.svg?color=${encodeURIComponent(iconColor)}`}
                            alt={icon.name}
                            className="w-6 h-6"
                            loading="lazy"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {icon.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Right Panel: Customize ── */}
      <div className="w-60 border-l flex flex-col bg-muted/20 shrink-0">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Selected Icon Preview */}
            {selectedIcon && styledSvg ? (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-20 h-20 rounded-xl border bg-card flex items-center justify-center p-3"
                  dangerouslySetInnerHTML={{ __html: styledSvg }}
                />
                <p className="text-xs font-medium text-center">{selectedIcon.name}</p>
                <Badge variant="outline" className="text-[10px]">{selectedIcon.prefix}</Badge>

                {onAddIcon && (
                  <Button size="sm" className="w-full mt-1 gap-1.5" onClick={handleAddToLibrary}>
                    <Plus className="h-3.5 w-3.5" />
                    Add to Library
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mb-3">
                  <Search className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground">Select an icon to customize</p>
              </div>
            )}

            <Separator />

            {/* Color */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold">Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-md border cursor-pointer shrink-0"
                  style={{ backgroundColor: iconColor }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'color';
                    input.value = iconColor;
                    input.onchange = (e) => setIconColor((e.target as HTMLInputElement).value);
                    input.click();
                  }}
                />
                <Input
                  value={iconColor}
                  onChange={e => setIconColor(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* Brand color presets */}
              {brandColors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-medium">Brand Colors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brandColors.slice(0, 8).map(c => (
                      <button
                        key={c.hex}
                        onClick={() => setIconColor(c.hex)}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                          iconColor === c.hex ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                        )}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Preset colors */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-medium">Presets</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      onClick={() => setIconColor(color)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                        iconColor === color ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Stroke Width */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Stroke Width</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] gap-1 text-muted-foreground"
                  onClick={() => setStrokeWidth([2])}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </div>
              <div className="space-y-2">
                <Slider
                  value={strokeWidth}
                  onValueChange={setStrokeWidth}
                  min={0.5}
                  max={3}
                  step={0.25}
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>0.5</span>
                  <span className="font-medium text-foreground">{strokeWidth[0]}px</span>
                  <span>3.0</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Export */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold">Export</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={!selectedSvg}
                  onClick={handleCopySvg}
                >
                  {copied === 'svg' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy SVG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  disabled={!selectedSvg}
                  onClick={handleCopyXml}
                >
                  {copied === 'xml' ? <Check className="h-3.5 w-3.5" /> : <Code className="h-3.5 w-3.5" />}
                  Copy XML
                </Button>
              </div>

              <Button
                variant="default"
                size="sm"
                className="w-full gap-1.5 text-xs"
                disabled={!selectedSvg}
                onClick={handleDownloadSvg}
              >
                <Download className="h-3.5 w-3.5" />
                Download SVG
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                disabled={!selectedSvg}
                onClick={handleDownloadPng}
              >
                <Download className="h-3.5 w-3.5" />
                Download PNG
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
