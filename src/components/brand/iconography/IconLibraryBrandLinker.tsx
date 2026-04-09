/**
 * IconLibraryBrandLinker - UI for linking icon collections to specific brands
 * Renders inside the IconLibraryManager in org settings
 */

import { useState, useMemo } from 'react';
import { Link2, Unlink, ChevronDown, ChevronRight, Paintbrush, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { useIconLibraryBrandLinks } from '@/hooks/useIconLibraryBrandLinks';
import { useBrands } from '@/contexts/BrandContext';
import { cn } from '@/lib/utils';
import { sanitizeSvg } from '@/lib/svgUtils';

interface IconLibraryBrandLinkerProps {
  organizationId: string;
  libraries: IconLibrary[];
}

export const IconLibraryBrandLinker = ({ organizationId, libraries }: IconLibraryBrandLinkerProps) => {
  const { brands } = useBrands();
  const { links, linkLibraryToBrand, unlinkLibraryFromBrand, toggleOverrides, getLinkedBrandIds } = useIconLibraryBrandLinks(organizationId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<IconLibrary | null>(null);
  const [pendingBrandIds, setPendingBrandIds] = useState<Set<string>>(new Set());

  // Only show collections that have icons
  const collectionsWithIcons = useMemo(() => 
    libraries.filter(lib => lib.icons.length > 0 && lib.is_active),
    [libraries]
  );

  const openLinkDialog = (library: IconLibrary) => {
    setSelectedLibrary(library);
    const currentLinked = getLinkedBrandIds(library.id);
    setPendingBrandIds(new Set(currentLinked));
    setLinkDialogOpen(true);
  };

  const handleSaveLinks = async () => {
    if (!selectedLibrary) return;
    const currentLinked = new Set(getLinkedBrandIds(selectedLibrary.id));
    
    // Add new links
    for (const brandId of pendingBrandIds) {
      if (!currentLinked.has(brandId)) {
        await linkLibraryToBrand.mutateAsync({ libraryId: selectedLibrary.id, brandId });
      }
    }
    // Remove old links
    for (const brandId of currentLinked) {
      if (!pendingBrandIds.has(brandId)) {
        await unlinkLibraryFromBrand.mutateAsync({ libraryId: selectedLibrary.id, brandId });
      }
    }
    setLinkDialogOpen(false);
  };

  const toggleBrand = (brandId: string) => {
    setPendingBrandIds(prev => {
      const next = new Set(prev);
      if (next.has(brandId)) next.delete(brandId);
      else next.add(brandId);
      return next;
    });
  };

  const renderIconPreview = (library: IconLibrary) => {
    const previewIcons = library.icons.slice(0, 4);
    return (
      <div className="flex items-center gap-1">
        {previewIcons.map((icon, i) => {
          const isFullSvg = icon.svgPath.includes('<');
          const isComplete = isFullSvg && icon.svgPath.trim().startsWith('<svg');
          return (
            <div key={i} className="w-5 h-5 text-foreground/70">
              {isComplete ? (
                <div
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(icon.svgPath, { USE_PROFILES: { svg: true, svgFilters: true }, FORBID_TAGS: ['script', 'foreignObject'] }) }}
                />
              ) : isFullSvg ? (
                <svg viewBox={icon.viewBox || '0 0 24 24'} className="w-full h-full" fill="currentColor">
                  <g dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(icon.svgPath) }} />
                </svg>
              ) : (
                <svg viewBox={icon.viewBox || '0 0 24 24'} fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                  <path d={icon.svgPath} />
                </svg>
              )}
            </div>
          );
        })}
        {library.icons.length > 4 && (
          <span className="text-xs text-muted-foreground ml-1">+{library.icons.length - 4}</span>
        )}
      </div>
    );
  };

  if (collectionsWithIcons.length === 0 || brands.length === 0) return null;

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-4 py-3 h-auto">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Brand Icon Assignments</span>
              <Badge variant="secondary" className="text-xs">
                {links.length} link{links.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Assign icon collections to specific brands. Linked collections appear in each brand's Iconography section with optional style overrides.
          </p>

          <div className="space-y-2">
            {collectionsWithIcons.map(library => {
              const linkedBrands = getLinkedBrandIds(library.id);
              const linkedBrandNames = brands
                .filter(b => linkedBrands.includes(b.id))
                .map(b => b.hero?.name || 'Untitled');

              return (
                <div key={library.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 min-w-0">
                    {renderIconPreview(library)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{library.name}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {library.level === 'core' ? 'Core' : library.level === 'product_line' ? 'Product' : 'Brand'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {library.icons.length} icon{library.icons.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {linkedBrandNames.length > 0 && (
                      <div className="flex items-center gap-1 max-w-[200px] overflow-hidden">
                        {linkedBrandNames.slice(0, 2).map(name => (
                          <Badge key={name} variant="secondary" className="text-[10px] truncate max-w-[80px]">
                            {name}
                          </Badge>
                        ))}
                        {linkedBrandNames.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{linkedBrandNames.length - 2}</span>
                        )}
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openLinkDialog(library)}>
                      <Link2 className="h-3.5 w-3.5" />
                      {linkedBrands.length > 0 ? 'Edit' : 'Assign'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Assign "{selectedLibrary?.name}" to Brands
            </DialogTitle>
            <DialogDescription>
              Select which brands should inherit this icon collection. Brands with overrides enabled can customize colors locally.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-1">
              {brands.map(brand => {
                const isLinked = pendingBrandIds.has(brand.id);
                const existingLink = links.find(l => l.library_id === selectedLibrary?.id && l.brand_id === brand.id);

                return (
                  <div key={brand.id} className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    isLinked ? "border-primary/30 bg-primary/5" : "border-transparent hover:bg-muted/50"
                  )}>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isLinked}
                        onCheckedChange={() => toggleBrand(brand.id)}
                      />
                      <div>
                        <p className="text-sm font-medium">{brand.hero?.name || 'Untitled Brand'}</p>
                        {brand.hero?.tagline && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{brand.hero.tagline}</p>
                        )}
                      </div>
                    </div>

                    {isLinked && existingLink && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Paintbrush className="h-3 w-3" />
                          <span>Overrides</span>
                          <Switch
                            className="scale-75"
                            checked={existingLink.allow_overrides}
                            onCheckedChange={(checked) => toggleOverrides.mutate({ linkId: existingLink.id, allowOverrides: checked })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <Separator />

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveLinks}
              disabled={linkLibraryToBrand.isPending || unlinkLibraryFromBrand.isPending}
              className="gap-2"
            >
              <Link2 className="h-4 w-4" />
              Save Assignments ({pendingBrandIds.size} brand{pendingBrandIds.size !== 1 ? 's' : ''})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
