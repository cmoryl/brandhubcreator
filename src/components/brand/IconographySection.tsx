import { useState, useRef } from 'react';
import { Plus, X, Pencil, Copy, Check, Upload, Grid2X2, Grid3X3, LayoutGrid, Download, Package, Palette } from 'lucide-react';
import { BrandIconography } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SectionHeader } from './SectionHeader';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import JSZip from 'jszip';

// SVG sanitization config - used at upload time for defense-in-depth
const SVG_SANITIZE_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'foreignObject', 'use', 'animate', 'animateTransform', 'set'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'onkeydown', 'onkeyup', 'onkeypress'],
};

const ICON_COLORS = [
  { name: 'Default', value: 'currentColor', bg: 'bg-foreground' },
  { name: 'Black', value: '#000000', bg: 'bg-black' },
  { name: 'White', value: '#FFFFFF', bg: 'bg-white border' },
  { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
  { name: 'Orange', value: '#F97316', bg: 'bg-orange-500' },
  { name: 'Yellow', value: '#EAB308', bg: 'bg-yellow-500' },
  { name: 'Green', value: '#22C55E', bg: 'bg-green-500' },
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Purple', value: '#A855F7', bg: 'bg-purple-500' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
];

interface IconographySectionProps {
  iconography: BrandIconography[];
  onIconographyChange: (iconography: BrandIconography[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  defaultIconColor?: string;
  onDefaultIconColorChange?: (color: string) => void;
}

type GridSize = 'compact' | 'medium' | 'large';

const gridSizeConfig: Record<GridSize, { grid: string; padding: string; fontSize: string; iconSize: string }> = {
  compact: { grid: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10', padding: 'p-2', fontSize: 'text-[8px]', iconSize: 'w-8 h-8' },
  medium: { grid: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8', padding: 'p-3', fontSize: 'text-[10px]', iconSize: 'w-10 h-10' },
  large: { grid: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6', padding: 'p-4', fontSize: 'text-xs', iconSize: 'w-12 h-12' },
};

const categoryOptions = ['Navigation', 'Actions', 'Social', 'Status', 'Commerce', 'Media', 'Communication', 'Other'];

export const IconographySection = ({ 
  iconography, 
  onIconographyChange, 
  customSubtitle, 
  onSubtitleChange,
  defaultIconColor,
  onDefaultIconColorChange 
}: IconographySectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [gridSize, setGridSize] = useState<GridSize>('medium');
  const [iconColor, setIconColor] = useState<string>(defaultIconColor || 'currentColor');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle color change and persist to brand settings
  const handleColorChange = (color: string) => {
    setIconColor(color);
    onDefaultIconColorChange?.(color);
  };

  const addIcon = () => {
    const newIcon: BrandIconography = {
      id: crypto.randomUUID(),
      name: 'New Icon',
      svgPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      category: 'Other',
      viewBox: '0 0 24 24',
      fillMode: 'stroke',
    };
    onIconographyChange([...iconography, newIcon]);
    setEditingId(newIcon.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newIcons: BrandIconography[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.svg')) {
        toast.error(`${file.name} is not an SVG file`);
        continue;
      }

      try {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        
        if (!svgElement) {
          toast.error(`No SVG element found in ${file.name}`);
          continue;
        }

        let viewBox = svgElement.getAttribute('viewBox') || '';
        
        if (!viewBox) {
          const width = svgElement.getAttribute('width')?.replace(/[^0-9.]/g, '') || '24';
          const height = svgElement.getAttribute('height')?.replace(/[^0-9.]/g, '') || '24';
          viewBox = `0 0 ${width} ${height}`;
        }

        const hasStrokeAttr = text.includes('stroke=') && !text.includes('stroke="none"');
        const hasFillAttr = text.includes('fill=') && !text.includes('fill="none"') && !text.includes('fill="transparent"');
        const fillMode: 'stroke' | 'fill' = hasStrokeAttr && !hasFillAttr ? 'stroke' : 'fill';

        const rawSvgContent = svgElement.innerHTML;
        
        // SECURITY: Sanitize SVG content at upload time (defense-in-depth)
        const sanitizedSvgContent = DOMPurify.sanitize(rawSvgContent, SVG_SANITIZE_CONFIG);

        newIcons.push({
          id: crypto.randomUUID(),
          name: file.name.replace('.svg', ''),
          svgPath: sanitizedSvgContent,
          category: 'Other',
          viewBox,
          fillMode,
        });
      } catch (err) {
        toast.error(`Failed to parse ${file.name}`);
        console.error(err);
      }
    }

    if (newIcons.length > 0) {
      onIconographyChange([...iconography, ...newIcons]);
      toast.success(`Added ${newIcons.length} icon(s)`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateIcon = (id: string, updates: Partial<BrandIconography>) => {
    onIconographyChange(iconography.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteIcon = (id: string) => {
    onIconographyChange(iconography.filter(i => i.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const getSVGString = (icon: BrandIconography) => {
    const viewBox = icon.viewBox || '0 0 24 24';
    const isFullContent = icon.svgPath.includes('<');
    
    // SECURITY: Sanitize content before export (belt-and-suspenders)
    const sanitizedPath = DOMPurify.sanitize(icon.svgPath, SVG_SANITIZE_CONFIG);
    
    const innerContent = isFullContent 
      ? sanitizedPath 
      : `<path d="${sanitizedPath}" ${icon.fillMode === 'fill' ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2"'}/>`;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${innerContent}</svg>`;
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
            <Button onClick={downloadAllIcons} variant="outline" size="sm" className="gap-2">
              <Package className="h-4 w-4" />
              Download All
            </Button>
          )}
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
          <Button onClick={addIcon} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Icon
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedIcons).map(([category, icons]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{category}</h3>
              <span className="text-xs text-muted-foreground">{icons.length} icons</span>
            </div>
            <div className={`grid ${gridSizeConfig[gridSize].grid} gap-3`}>
              {icons.map((icon, index) => (
                <div
                  key={icon.id}
                  className={`group relative bg-card rounded-xl ${gridSizeConfig[gridSize].padding} shadow-sm border border-border animate-scale-in flex flex-col items-center cursor-pointer hover:border-primary/50 transition-colors`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => copySVG(icon)}
                >
                  {renderIcon(icon, gridSizeConfig[gridSize].iconSize)}
                  <p className={`${gridSizeConfig[gridSize].fontSize} text-muted-foreground text-center truncate w-full leading-tight`}>{icon.name}</p>

                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedId === icon.id ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-white" />
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadIcon(icon); }}
                          className="p-1 rounded bg-white/20 hover:bg-white/30"
                          title="Download SVG"
                        >
                          <Download className="h-4 w-4 text-white" />
                        </button>
                      </>
                    )}
                  </div>

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
                </div>
              ))}
            </div>
          </div>
        ))}

        {iconography.length === 0 && (
          <button
            onClick={addIcon}
            className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add your first custom icon</span>
          </button>
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
    </section>
  );
};
