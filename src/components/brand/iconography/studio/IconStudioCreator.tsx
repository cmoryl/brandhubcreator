/**
 * IconStudioCreator - Custom icon design tab
 * Create individual icons from Lucide library or custom SVGs
 */

import { useState, useMemo, createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as LucideIcons from 'lucide-react';
import { Search, Check, Code, Library, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BrandIconography } from '@/types/brand';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface IconStudioCreatorProps {
  brandColors: Array<{ hex: string; name: string }>;
  libraries: IconLibrary[];
  onSaveIcons: (icons: BrandIconography[], libraryId?: string) => void;
}

// Get all Lucide icon names
const LUCIDE_ICON_NAMES = Object.keys(LucideIcons).filter(
  name => name !== 'createLucideIcon' && name !== 'default' && !name.startsWith('Lucide')
);

export const IconStudioCreator = ({
  brandColors,
  libraries,
  onSaveIcons,
}: IconStudioCreatorProps) => {
  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  
  // Custom SVG state
  const [customName, setCustomName] = useState('');
  const [customSvg, setCustomSvg] = useState('');
  const [customCategory, setCustomCategory] = useState('custom');

  // Filter icons based on search
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

  const handleSaveLucideIcons = () => {
    if (selectedIcons.size === 0) {
      toast.error('Please select at least one icon');
      return;
    }

    const icons: BrandIconography[] = Array.from(selectedIcons).map(iconName => {
      // Extract SVG by temporarily rendering the Lucide icon to DOM
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
      
      return {
        id: `icon-${Date.now()}-${iconName}`,
        name: iconName.replace(/([A-Z])/g, ' $1').trim(),
        svgPath: svgString || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`,
        category: 'lucide',
        viewBox: '0 0 24 24',
        fillMode: 'stroke' as const,
      };
    });

    onSaveIcons(icons, selectedLibraryId || undefined);
    setSelectedIcons(new Set());
    toast.success(`Added ${icons.length} icons`);
  };

  const handleSaveCustomIcon = () => {
    if (!customName.trim()) {
      toast.error('Please enter an icon name');
      return;
    }
    if (!customSvg.trim()) {
      toast.error('Please enter SVG code');
      return;
    }

    // Sanitize and validate SVG
    const sanitized = DOMPurify.sanitize(customSvg.trim(), {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'foreignObject'],
    });

    if (!sanitized.includes('<svg') && !sanitized.includes('<path')) {
      toast.error('Invalid SVG code');
      return;
    }

    const icon: BrandIconography = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      svgPath: sanitized,
      category: customCategory,
      viewBox: '0 0 24 24',
      fillMode: 'fill' as const,
    };

    onSaveIcons([icon], selectedLibraryId || undefined);
    setCustomName('');
    setCustomSvg('');
    toast.success('Custom icon added!');
  };

  const renderLucideIcon = (iconName: string, size: number = 24) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={size} />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Icon Creator</h3>
        <p className="text-sm text-muted-foreground">
          Add icons from the Lucide library or upload custom SVGs
        </p>
      </div>

      {/* Target Library */}
      {libraries.length > 0 && (
        <div className="space-y-2">
          <Label>Save to Library</Label>
          <Select value={selectedLibraryId || 'auto'} onValueChange={(v) => setSelectedLibraryId(v === 'auto' ? '' : v)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select target library..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (first Core library)</SelectItem>
              {libraries.filter(l => l.is_active).map((lib) => (
                <SelectItem key={lib.id} value={lib.id}>
                  {lib.name} ({lib.icons.length} icons)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="library" className="gap-2">
            <Library className="h-4 w-4" />
            Lucide Icons
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Code className="h-4 w-4" />
            Custom SVG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
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
              <Badge variant="secondary">
                {selectedIcons.size} selected
              </Badge>
              {selectedIcons.size > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedIcons(new Set())}>
                  Clear
                </Button>
              )}
            </div>
            <Button
              onClick={handleSaveLucideIcons}
              disabled={selectedIcons.size === 0}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Selected
            </Button>
          </div>

          {/* Icon Grid */}
          <ScrollArea className="h-[400px] border rounded-lg p-4">
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
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Icon Name *</Label>
                <Input
                  placeholder="e.g., Custom Arrow, Brand Logo"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={customCategory} onValueChange={setCustomCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="navigation">Navigation</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>SVG Code *</Label>
                <Textarea
                  placeholder='<svg viewBox="0 0 24 24">...</svg>'
                  value={customSvg}
                  onChange={(e) => setCustomSvg(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a complete SVG element or just the path data
                </p>
              </div>

              <Button onClick={handleSaveCustomIcon} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Custom Icon
              </Button>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <Label>Preview</Label>
              <div className="border rounded-lg p-8 flex items-center justify-center bg-muted/30 min-h-[200px]">
                {customSvg ? (
                  <div
                    className="w-24 h-24 flex items-center justify-center"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(customSvg, {
                        USE_PROFILES: { svg: true, svgFilters: true },
                        FORBID_TAGS: ['script', 'foreignObject'],
                      }),
                    }}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Paste SVG code to preview</p>
                  </div>
                )}
              </div>

              {/* Size Previews */}
              {customSvg && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Size Previews</Label>
                  <div className="flex items-end gap-4 p-4 border rounded-lg bg-background">
                    {[16, 24, 32, 48].map((size) => (
                      <div key={size} className="flex flex-col items-center gap-1">
                        <div
                          style={{ width: size, height: size }}
                          className="flex items-center justify-center"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(customSvg, {
                              USE_PROFILES: { svg: true },
                            }),
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground">{size}px</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
