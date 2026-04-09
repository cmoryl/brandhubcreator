import { useState, useRef, useMemo, useCallback } from 'react';
import { Plus, X, Pencil, Copy, Check, Upload, Grid2X2, Grid3X3, LayoutGrid, Download, Package, Palette, ChevronDown, ChevronUp, Sparkles, Building2, Layers, Eye, FolderPlus, Library } from 'lucide-react';
import { BrandIconography, BrandIcon } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SectionHeader } from './SectionHeader';
import { IconStudio, IconUsageGuidelines, HierarchicalIconDisplay } from './iconography';
import { IconLibraryPicker } from './iconography/IconLibraryPicker';
import { IconPreviewDialog } from './iconography/IconPreviewDialog';
import type { IconStudioTab } from './iconography';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { useIconLibraries } from '@/hooks/useIconLibraries';
import JSZip from 'jszip';
import { buildSvgString } from '@/lib/svgUtils';
...
  const getSVGString = (icon: BrandIconography) => {
    const normalizedSvg = buildSvgString(icon);
    return DOMPurify.sanitize(normalizedSvg, SVG_SANITIZE_CONFIG);
  };

  const copySVG = async (icon: BrandIconography) => {
    const svg = getSVGString(icon);
    await navigator.clipboard.writeText(svg);
    setCopiedId(icon.id);
    toast.success('SVG copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadIcon = (icon: BrandIconography) => {
    const svg = getSVGString(icon);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${icon.name}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${icon.name}.svg`);
  };

  const svgToPng = async (svgString: string, size: number = 512): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create PNG blob'));
          }
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load SVG'));
      };

      img.src = url;
    });
  };

  const getFullSvgForExport = (icon: BrandIconography): string => {
    const viewBox = icon.viewBox || '0 0 24 24';
    const isFullContent = icon.svgPath.includes('<');
    const sanitizedPath = DOMPurify.sanitize(icon.svgPath, SVG_SANITIZE_CONFIG);
    
    // Build a complete, standalone SVG with proper styling for export
    let innerContent: string;
    if (isFullContent) {
      // Replace currentColor with black for standalone export
      innerContent = sanitizedPath.replace(/currentColor/gi, '#000000');
    } else {
      innerContent = icon.fillMode === 'fill' 
        ? `<path d="${sanitizedPath}" fill="#000000"/>`
        : `<path d="${sanitizedPath}" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="512" height="512">
${innerContent}
</svg>`;
  };

  const downloadAllIcons = async () => {
    if (iconography.length === 0) {
      toast.error('No icons to download');
      return;
    }

    const loadingToast = toast.loading('Creating icon package...');
    
    try {
      const zip = new JSZip();
      const svgFolder = zip.folder('svg');
      const pngFolder = zip.folder('png');
      
      if (!svgFolder || !pngFolder) {
        throw new Error('Could not create zip folders');
      }

      for (const icon of iconography) {
        const safeName = `${icon.category}-${icon.name}`.replace(/[^a-z0-9-_]/gi, '_');
        const svgString = getFullSvgForExport(icon);
        
        // Add SVG to zip
        svgFolder.file(`${safeName}.svg`, svgString);
        
        // Convert to PNG and add to zip
        try {
          const pngBlob = await svgToPng(svgString, 512);
          pngFolder.file(`${safeName}.png`, pngBlob);
        } catch (pngError) {
          console.warn(`Could not convert ${icon.name} to PNG:`, pngError);
        }
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'brand-icons.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success(`Downloaded ${iconography.length} icons (SVG + PNG)`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to create icon package');
      console.error('Download error:', error);
    }
  };

  const renderIcon = (icon: BrandIconography, sizeClass: string) => {
    const viewBox = icon.viewBox || '0 0 100 100';
    const isFullContent = icon.svgPath.includes('<');
    const fillMode = icon.fillMode || 'fill';
    const colorStyle = iconColor === 'currentColor' ? undefined : iconColor;
    
    if (isFullContent) {
      let cleanedContent = icon.svgPath;
      
      cleanedContent = cleanedContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/style="[^"]*"/gi, '')
        .replace(/fill="#[0-9a-fA-F]{3,6}"/gi, 'fill="currentColor"')
        .replace(/fill:'#[0-9a-fA-F]{3,6}'/gi, "fill='currentColor'")
        .replace(/stroke="#[0-9a-fA-F]{3,6}"/gi, 'stroke="currentColor"')
        .replace(/stroke:'#[0-9a-fA-F]{3,6}'/gi, "stroke='currentColor'")
        .replace(/class="[^"]*"/gi, '');
      
      const sanitizedContent = DOMPurify.sanitize(cleanedContent, { 
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['script', 'foreignObject', 'use', 'animate', 'animateTransform', 'set'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onmousemove', 'onfocus', 'onblur', 'onanimationend', 'onanimationiteration', 'onanimationstart', 'ontransitionend']
      });
      
      return (
        <div className={`${sizeClass} flex items-center justify-center mb-2 flex-shrink-0`}>
          <svg
            className="w-full h-full"
            style={{ color: colorStyle }}
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            fill="currentColor"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      );
    } else {
      const isFillMode = fillMode === 'fill';
      return (
        <div className={`${sizeClass} flex items-center justify-center mb-2 flex-shrink-0`}>
          <svg
            className="w-full h-full"
            style={{ color: colorStyle }}
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            fill={isFillMode ? 'currentColor' : 'none'}
            stroke={isFillMode ? 'none' : 'currentColor'}
            strokeWidth={isFillMode ? undefined : '2'}
            strokeLinecap={isFillMode ? undefined : 'round'}
            strokeLinejoin={isFillMode ? undefined : 'round'}
          >
            <path d={icon.svgPath} />
          </svg>
        </div>
      );
    }
  };

  const groupedIcons = iconography.reduce((acc, icon) => {
    if (!acc[icon.category]) acc[icon.category] = [];
    acc[icon.category].push(icon);
    return acc;
  }, {} as Record<string, BrandIconography[]>);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Iconography"
            defaultSubtitle="Custom UI glyph system with SVG path data"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <div 
                  className="w-4 h-4 rounded-full border" 
                  style={{ backgroundColor: iconColor === 'currentColor' ? 'hsl(var(--foreground))' : iconColor }}
                />
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Icon Preview Color</p>
                <div className="flex flex-wrap gap-2 max-w-[200px]">
                  {ICON_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorChange(color.value)}
                      className={`w-7 h-7 rounded-full ${color.bg} transition-transform hover:scale-110 ${
                        iconColor === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <label className="text-xs text-muted-foreground block mb-1">Custom color</label>
                  <input
                    type="color"
                    value={iconColor === 'currentColor' ? '#000000' : iconColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <ToggleGroup
            type="single"
            value={gridSize}
            onValueChange={(value) => value && setGridSize(value as GridSize)}
            className="border rounded-md"
          >
            <ToggleGroupItem value="compact" aria-label="Compact grid" className="px-2">
              <Grid3X3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="medium" aria-label="Medium grid" className="px-2">
              <Grid2X2 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="large" aria-label="Large grid" className="px-2">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {iconography.length > 0 && (
            <>
              <Button onClick={downloadAllIcons} variant="outline" size="sm" className="gap-2">
                <Package className="h-4 w-4" />
                Download All
              </Button>
              {canEdit && organizationId && (
                <Button 
                  onClick={() => setShowAddToLibrary(true)} 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  Add to Library
                </Button>
              )}
            </>
          )}
          {canEdit && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload SVG
              </Button>
              {organizationId && (
                <Button 
                  onClick={() => setShowLibraryPicker(true)} 
                  size="sm" 
                  className="gap-2" 
                  variant="outline"
                >
                  <Library className="h-4 w-4" />
                  From Library
                </Button>
              )}
              <Button onClick={addIcon} size="sm" className="gap-2" variant="outline">
                <Plus className="h-4 w-4" />
                Add Icon
              </Button>
              <Button 
                onClick={() => {
                  setIconStudioInitialTab('library');
                  setShowIconStudio(true);
                }} 
                size="sm" 
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Icon Studio
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Inherited Icons Summary Banner */}
      {organizationId && inheritedSummary.totalInherited > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 border border-border/50">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            {inheritedSummary.coreCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-500/10">
                  <Building2 className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-sm">
                  <span className="font-medium">{inheritedSummary.coreCount}</span>
                  <span className="text-muted-foreground ml-1">Core Icons</span>
                  {inheritedSummary.coreLibraryNames.length > 0 && (
                    <span className="text-xs text-muted-foreground/70 ml-1">
                      ({inheritedSummary.coreLibraryNames.join(', ')})
                    </span>
                  )}
                </div>
              </div>
            )}
            {inheritedSummary.productLineCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-500/10">
                  <Package className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-sm">
                  <span className="font-medium">{inheritedSummary.productLineCount}</span>
                  <span className="text-muted-foreground ml-1">Product Line Icons</span>
                  {inheritedSummary.productLineLibraryNames.length > 0 && (
                    <span className="text-xs text-muted-foreground/70 ml-1">
                      ({inheritedSummary.productLineLibraryNames.join(', ')})
                    </span>
                  )}
                </div>
              </div>
            )}
            {iconography.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-500/10">
                  <Layers className="h-4 w-4 text-orange-500" />
                </div>
                <div className="text-sm">
                  <span className="font-medium">{iconography.length}</span>
                  <span className="text-muted-foreground ml-1">Brand Icons</span>
                </div>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{inheritedSummary.totalInherited + iconography.length}</span> total available
          </div>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedIcons).map(([category, icons]) => {
          const isExpanded = expandedCategories.has(category);
          const hasMore = icons.length > ICONS_PREVIEW_LIMIT;
          const displayedIcons = isExpanded ? icons : icons.slice(0, ICONS_PREVIEW_LIMIT);
          const hiddenCount = icons.length - ICONS_PREVIEW_LIMIT;
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{category}</h3>
                <span className="text-xs text-muted-foreground">{icons.length} icons</span>
              </div>
              <div className={`grid ${gridSizeConfig[gridSize].grid} gap-3`}>
                {displayedIcons.map((icon, index) => (
                  <div
                    key={icon.id}
                    className={`group relative bg-card rounded-xl ${gridSizeConfig[gridSize].padding} shadow-sm border border-border animate-scale-in flex flex-col items-center cursor-pointer hover:border-primary/50 transition-colors`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setPreviewIcon(icon)}
                  >
                    {renderIcon(icon, gridSizeConfig[gridSize].iconSize)}
                    <p className={`${gridSizeConfig[gridSize].fontSize} text-muted-foreground text-center truncate w-full leading-tight`}>{icon.name}</p>

                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {copiedId === icon.id ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewIcon(icon); }}
                            className="p-1.5 rounded bg-white/20 hover:bg-white/30"
                            title="View larger"
                          >
                            <Eye className="h-4 w-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); copySVG(icon); }}
                            className="p-1.5 rounded bg-white/20 hover:bg-white/30"
                            title="Copy SVG"
                          >
                            <Copy className="h-4 w-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadIcon(icon); }}
                            className="p-1.5 rounded bg-white/20 hover:bg-white/30"
                            title="Download SVG"
                          >
                            <Download className="h-4 w-4 text-white" />
                          </button>
                        </>
                      )}
                    </div>

                    {canEdit && (
                      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
              </div>
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategoryExpanded(category)}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      View All ({hiddenCount} more)
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}

        {iconography.length === 0 && canEdit && (
          <button
            onClick={addIcon}
            className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add your first custom icon</span>
          </button>
        )}
        {iconography.length === 0 && !canEdit && (
          <div className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Grid2X2 className="h-6 w-6" />
            <span className="text-sm font-medium">No custom icons</span>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingId(null)}>
          <div className="bg-card rounded-xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Edit Icon</h3>
            {(() => {
              const icon = iconography.find(i => i.id === editingId);
              if (!icon) return null;
              return (
                <>
                  <Input
                    value={icon.name}
                    onChange={(e) => updateIcon(icon.id, { name: e.target.value })}
                    placeholder="Icon name"
                  />
                  <Select
                    value={icon.category}
                    onValueChange={(category) => updateIcon(icon.id, { category })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={icon.svgPath}
                    onChange={(e) => updateIcon(icon.id, { svgPath: e.target.value })}
                    placeholder="SVG path data or full SVG content"
                    className="font-mono text-xs min-h-[100px]"
                  />
                  <Button onClick={() => setEditingId(null)} className="w-full">Done</Button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Hierarchical Icon Display - shows inherited org icons */}
      {organizationId && (
        <HierarchicalIconDisplay
          organizationId={organizationId}
          brandId={brandId}
          brandIcons={iconography}
          productLineId={productLineId}
          iconColor={iconColor}
        />
      )}

      {/* Icon Usage Guidelines */}
      <IconUsageGuidelines 
        brandColors={brandColors}
        primaryColor={brandColors[0]?.hex}
      />

      {/* Unified Icon Studio - All icon creation, editing, and management in one place */}
      <IconStudio
        open={showIconStudio}
        onOpenChange={setShowIconStudio}
        organizationId={organizationId || ''}
        organizationName={entityName}
        brandColors={brandColors}
        initialTab={iconStudioInitialTab}
        entityId={brandId}
        entityType={entityType}
        entityName={entityName}
        onIconsCreated={(newIcons, libraryId) => {
          // If saved to a specific library, don't also add to brand iconography
          // The icons live in org libraries and are inherited automatically
          if (!libraryId) {
            onIconographyChange?.([...iconography, ...newIcons]);
          } else {
            toast.success(`${newIcons.length} icon(s) saved to library`);
          }
        }}
      />

      {/* Icon Preview Dialog */}
      <IconPreviewDialog
        icon={previewIcon}
        open={!!previewIcon}
        onOpenChange={(open) => !open && setPreviewIcon(null)}
      />

      {/* Add to Org Library Dialog */}
      <Dialog open={showAddToLibrary} onOpenChange={setShowAddToLibrary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Add Icons to Organization Library
            </DialogTitle>
            <DialogDescription>
              Push {iconography.length} brand icon(s) to an organization-wide library for reuse across all brands.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Library</Label>
              <Select value={addToLibraryTargetId} onValueChange={setAddToLibraryTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a library..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new__">
                    <div className="flex items-center gap-2">
                      <Plus className="h-3 w-3" />
                      Create New Core Library
                    </div>
                  </SelectItem>
                  {libraries.map(lib => (
                    <SelectItem key={lib.id} value={lib.id}>
                      <div className="flex items-center gap-2">
                        {lib.level === 'core' && <Building2 className="h-3 w-3 text-primary" />}
                        {lib.level === 'product_line' && <Package className="h-3 w-3 text-primary" />}
                        {lib.level === 'brand' && <Layers className="h-3 w-3 text-primary" />}
                        {lib.name} ({lib.icons.length} icons)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddToLibrary(false)}>Cancel</Button>
            <Button onClick={handleAddToOrgLibrary} disabled={!addToLibraryTargetId}>
              Add {iconography.length} Icon(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Icon Library Picker - Quick add from org libraries */}
      <IconLibraryPicker
        organizationId={organizationId}
        open={showLibraryPicker}
        onOpenChange={setShowLibraryPicker}
        existingIconIds={iconography.map(i => i.id)}
        onIconsSelected={(brandIcons: BrandIcon[]) => {
          if (!onIconographyChange) return;
          // Convert BrandIcon (url-based) to BrandIconography (svgPath-based)
          const newIcons: BrandIconography[] = brandIcons.map(bi => {
            // Extract SVG path data from the data URI
            let svgPath = '';
            let viewBox = '0 0 24 24';
            let fillMode: 'stroke' | 'fill' = 'stroke';
            try {
              const decoded = decodeURIComponent(bi.url.replace('data:image/svg+xml,', ''));
              const parser = new DOMParser();
              const doc = parser.parseFromString(decoded, 'image/svg+xml');
              const svg = doc.querySelector('svg');
              if (svg) {
                viewBox = svg.getAttribute('viewBox') || '0 0 24 24';
                fillMode = svg.getAttribute('fill') === 'currentColor' ? 'fill' : 'stroke';
                // Get inner content
                const path = svg.querySelector('path');
                if (path) {
                  svgPath = path.getAttribute('d') || '';
                } else {
                  svgPath = svg.innerHTML;
                }
              }
            } catch {
              svgPath = 'M12 2L2 7l10 5 10-5-10-5z';
            }
            return {
              id: bi.id,
              name: bi.name,
              svgPath,
              category: 'Other',
              viewBox,
              fillMode,
            };
          });
          onIconographyChange([...iconography, ...newIcons]);
          toast.success(`Added ${newIcons.length} icon(s) from library`);
        }}
      />
    </section>
  );
};
