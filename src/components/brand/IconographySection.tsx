import { useState, useRef } from 'react';
import { Plus, X, Pencil, Copy, Check, Upload, Grid2X2, Grid3X3, LayoutGrid } from 'lucide-react';
import { BrandIconography } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SectionHeader } from './SectionHeader';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

interface IconographySectionProps {
  iconography: BrandIconography[];
  onIconographyChange: (iconography: BrandIconography[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

type GridSize = 'compact' | 'medium' | 'large';

const gridSizeConfig: Record<GridSize, { grid: string; padding: string; fontSize: string; iconSize: string }> = {
  compact: { grid: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10', padding: 'p-2', fontSize: 'text-[8px]', iconSize: 'w-8 h-8' },
  medium: { grid: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8', padding: 'p-3', fontSize: 'text-[10px]', iconSize: 'w-10 h-10' },
  large: { grid: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6', padding: 'p-4', fontSize: 'text-xs', iconSize: 'w-12 h-12' },
};

const categoryOptions = ['Navigation', 'Actions', 'Social', 'Status', 'Commerce', 'Media', 'Communication', 'Other'];

export const IconographySection = ({ iconography, onIconographyChange, customSubtitle, onSubtitleChange }: IconographySectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [gridSize, setGridSize] = useState<GridSize>('medium');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Parse SVG to extract essential info
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        
        if (!svgElement) {
          toast.error(`No SVG element found in ${file.name}`);
          continue;
        }

        // Get viewBox from SVG element
        let viewBox = svgElement.getAttribute('viewBox') || '';
        
        // If no viewBox, try to construct from width/height
        if (!viewBox) {
          const width = svgElement.getAttribute('width')?.replace(/[^0-9.]/g, '') || '24';
          const height = svgElement.getAttribute('height')?.replace(/[^0-9.]/g, '') || '24';
          viewBox = `0 0 ${width} ${height}`;
        }

        // Detect fill mode by checking the SVG content
        const hasStrokeAttr = text.includes('stroke=') && !text.includes('stroke="none"');
        const hasFillAttr = text.includes('fill=') && !text.includes('fill="none"') && !text.includes('fill="transparent"');
        const fillMode: 'stroke' | 'fill' = hasStrokeAttr && !hasFillAttr ? 'stroke' : 'fill';

        // Get the inner content of the SVG (all children)
        const svgContent = svgElement.innerHTML;

        newIcons.push({
          id: crypto.randomUUID(),
          name: file.name.replace('.svg', ''),
          svgPath: svgContent, // Store full SVG inner content
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

    // Reset input
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

  const copySVG = async (icon: BrandIconography) => {
    const viewBox = icon.viewBox || '0 0 24 24';
    // Check if svgPath contains full SVG inner content or just path data
    const isFullContent = icon.svgPath.includes('<');
    const innerContent = isFullContent 
      ? icon.svgPath 
      : `<path d="${icon.svgPath}" ${icon.fillMode === 'fill' ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2"'}/>`;
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${innerContent}</svg>`;
    await navigator.clipboard.writeText(svg);
    setCopiedId(icon.id);
    toast.success('SVG copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderIcon = (icon: BrandIconography, sizeClass: string) => {
    const viewBox = icon.viewBox || '0 0 24 24';
    const isFullContent = icon.svgPath.includes('<');
    
    if (isFullContent) {
      // Render full SVG content with sanitization
      const sanitizedContent = DOMPurify.sanitize(icon.svgPath, { USE_PROFILES: { svg: true } });
      return (
        <div className={`${sizeClass} flex items-center justify-center mb-2 flex-shrink-0 overflow-visible`}>
          <svg
            className="w-full h-full text-foreground"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: 'visible' }}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      );
    } else {
      // Render path-only SVG
      return (
        <div className={`${sizeClass} flex items-center justify-center mb-2 flex-shrink-0 overflow-visible`}>
          <svg
            className="w-full h-full text-foreground"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: 'visible' }}
            fill={icon.fillMode === 'fill' ? 'currentColor' : 'none'}
            stroke={icon.fillMode === 'fill' ? 'none' : 'currentColor'}
            strokeWidth={icon.fillMode === 'fill' ? undefined : '2'}
            strokeLinecap={icon.fillMode === 'fill' ? undefined : 'round'}
            strokeLinejoin={icon.fillMode === 'fill' ? undefined : 'round'}
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Iconography"
            defaultSubtitle="Custom UI glyph system with SVG path data"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{category}</h3>
            <div className={`grid ${gridSizeConfig[gridSize].grid} gap-3`}>
              {icons.map((icon, index) => (
                <div
                  key={icon.id}
                  className={`group relative bg-card rounded-xl ${gridSizeConfig[gridSize].padding} shadow-sm border border-border animate-scale-in flex flex-col items-center cursor-pointer`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => copySVG(icon)}
                >
                  {renderIcon(icon, gridSizeConfig[gridSize].iconSize)}
                  <p className={`${gridSizeConfig[gridSize].fontSize} text-muted-foreground text-center truncate w-full leading-tight`}>{icon.name}</p>

                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedId === icon.id ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <Copy className="h-5 w-5 text-white" />
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
