import { useState } from 'react';
import { Plus, Copy, Check, X, Pencil, ThumbsUp, ThumbsDown, FlaskConical, Download, FileSpreadsheet, FileJson, Palette } from 'lucide-react';
import { BrandColor, ColorCombination } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getAllColorFormats, getContrastColor, downloadColorPalette, ColorExportData } from '@/lib/colorUtils';
import { toast } from 'sonner';
import { SectionHeader } from './SectionHeader';
import { ColorAccessibilityBadge } from './ColorAccessibilityBadge';
import { ColorAccessibilityPanel } from './ColorAccessibilityPanel';
import { ColorStrategyPanel } from './ColorStrategyPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

import { TransPerfectColorTypographyPanel } from './identity/TransPerfectColorTypographyPanel';

interface ColorPaletteSectionProps {
  colors: BrandColor[];
  onColorsChange?: (colors: BrandColor[]) => void;
  colorCombinations?: ColorCombination[];
  onColorCombinationsChange?: (combinations: ColorCombination[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  brandName?: string;
  brandSlug?: string;
}

export const ColorPaletteSection = ({ 
  colors, 
  onColorsChange,
  colorCombinations = [],
  onColorCombinationsChange,
  customSubtitle,
  onSubtitleChange,
  brandName = 'Brand',
  brandSlug,
}: ColorPaletteSectionProps) => {
  const canEdit = Boolean(onColorsChange);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [editingCombinationId, setEditingCombinationId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);

  const addColor = () => {
    if (!onColorsChange) return;
    const newColor: BrandColor = {
      id: crypto.randomUUID(),
      name: 'New Color',
      hex: '#6B7280',
      usage: 'Define usage',
    };
    onColorsChange([...colors, newColor]);
    setEditingId(newColor.id);
  };

  const updateColor = (id: string, updates: Partial<BrandColor>) => {
    if (!onColorsChange) return;
    onColorsChange(colors.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteColor = (id: string) => {
    if (!onColorsChange) return;
    onColorsChange(colors.filter(c => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const copyValue = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  // Export color palette
  const handleExport = (format: 'csv' | 'json' | 'ase') => {
    if (colors.length === 0) {
      toast.error('No colors to export');
      return;
    }

    const exportData: ColorExportData[] = colors.map(color => {
      const formats = getAllColorFormats(color.hex);
      return {
        name: color.name,
        hex: formats.hex,
        rgb: formats.rgb,
        cmyk: formats.cmyk,
        hsv: formats.hsv,
        pantone: color.pantone || formats.pantone,
        usage: color.usage,
      };
    });

    downloadColorPalette(exportData, format, brandName);
    toast.success(`Color palette exported as ${format.toUpperCase()}`);
  };

  // Color Combinations A/B Testing
  const addCombination = () => {
    if (!onColorCombinationsChange) return;
    const newCombination: ColorCombination = {
      id: crypto.randomUUID(),
      name: 'New Combination',
      colors: colors.slice(0, 3).map(c => c.hex),
      status: 'testing',
      notes: '',
    };
    onColorCombinationsChange([...colorCombinations, newCombination]);
    setEditingCombinationId(newCombination.id);
  };

  const updateCombination = (id: string, updates: Partial<ColorCombination>) => {
    if (!onColorCombinationsChange) return;
    onColorCombinationsChange(colorCombinations.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCombination = (id: string) => {
    if (!onColorCombinationsChange) return;
    onColorCombinationsChange(colorCombinations.filter(c => c.id !== id));
    if (editingCombinationId === id) setEditingCombinationId(null);
  };

  const setStatus = (id: string, status: ColorCombination['status']) => {
    updateCombination(id, { status });
  };

  const approvedCombinations = colorCombinations.filter(c => c.status === 'approved');
  const rejectedCombinations = colorCombinations.filter(c => c.status === 'rejected');
  const testingCombinations = colorCombinations.filter(c => c.status === 'testing');

  return (
    <section className="space-y-6 sm:space-y-8">
      {/* Color Palette */}
      <div className="space-y-4 sm:space-y-6">
        {/* Section header - always full width on its own row */}
        <SectionHeader
          title="Color Palette"
          defaultSubtitle="Define your brand's color system with all color formats"
          customSubtitle={customSubtitle}
          onSubtitleChange={canEdit ? onSubtitleChange : undefined}
          isEditing={isHeaderEditing}
          onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
        />
        
        {/* Controls row - separate from header */}
        <div className="flex items-center gap-2 flex-wrap">
            {colors.length > 0 && canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Export Color Palette
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2">
                    <FileJson className="h-4 w-4" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('ase')} className="gap-2">
                    <Palette className="h-4 w-4" />
                    Export for Adobe (ASE)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canEdit && (
              <Button onClick={addColor} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Color
              </Button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {colors.map((color, index) => {
            const formats = getAllColorFormats(color.hex);
            
            return (
              <div
                key={color.id}
                className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Color swatch */}
                  <div
                    className="w-full sm:w-28 lg:w-32 h-24 sm:h-auto sm:min-h-[180px] relative cursor-pointer transition-transform hover:scale-[1.02] shrink-0"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => copyValue(color.hex, 'HEX')}
                  >
                    <div 
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: getContrastColor(color.hex) }}
                    >
                      {copiedValue === color.hex ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Copy className="h-6 w-6" />
                      )}
                    </div>

                    {/* Delete button */}
                    {canEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteColor(color.id); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Color info */}
                  <div className="flex-1 p-4 space-y-3">
                  {canEdit && editingId === color.id ? (
                      <div className="space-y-3">
                        <Input
                          value={color.name}
                          onChange={(e) => updateColor(color.id, { name: e.target.value })}
                          className="h-9 font-medium"
                          placeholder="Color name"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={color.hex}
                            onChange={(e) => updateColor(color.id, { hex: e.target.value })}
                            className="h-9 w-14 p-1 cursor-pointer"
                          />
                          <Input
                            value={color.hex}
                            onChange={(e) => updateColor(color.id, { hex: e.target.value })}
                            className="h-9 font-mono uppercase"
                            placeholder="#000000"
                          />
                        </div>
                        <Input
                          value={color.pantone || ''}
                          onChange={(e) => updateColor(color.id, { pantone: e.target.value })}
                          className="h-9"
                          placeholder="Pantone (e.g., PMS 286 C)"
                        />
                        <Input
                          value={color.usage || ''}
                          onChange={(e) => updateColor(color.id, { usage: e.target.value })}
                          className="h-9"
                          placeholder="Usage description"
                        />
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                          Done
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg text-foreground">{color.name}</h3>
                          {canEdit && (
                            <button
                              onClick={() => setEditingId(color.id)}
                              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>

                        {/* Color codes grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <ColorCodeItem 
                            label="HEX" 
                            value={formats.hex} 
                            onCopy={() => copyValue(formats.hex, 'HEX')}
                            isCopied={copiedValue === formats.hex}
                          />
                          <ColorCodeItem 
                            label="RGB" 
                            value={formats.rgb} 
                            onCopy={() => copyValue(formats.rgb, 'RGB')}
                            isCopied={copiedValue === formats.rgb}
                          />
                          <ColorCodeItem 
                            label="CMYK" 
                            value={formats.cmyk} 
                            onCopy={() => copyValue(formats.cmyk, 'CMYK')}
                            isCopied={copiedValue === formats.cmyk}
                          />
                          <ColorCodeItem 
                            label="HSV" 
                            value={formats.hsv} 
                            onCopy={() => copyValue(formats.hsv, 'HSV')}
                            isCopied={copiedValue === formats.hsv}
                          />
                          <ColorCodeItem 
                            label="Pantone" 
                            value={color.pantone || formats.pantone} 
                            onCopy={() => copyValue(color.pantone || formats.pantone, 'Pantone')}
                            isCopied={copiedValue === (color.pantone || formats.pantone)}
                            className="col-span-2"
                          />
                        </div>

                        {/* OKLCH Accessibility Badge */}
                        <div className="pt-2 border-t border-border">
                          <ColorAccessibilityBadge hex={color.hex} name={color.name} />
                        </div>

                        {color.usage && (
                          <p className="text-sm text-muted-foreground pt-2 border-t border-border">{color.usage}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {colors.length === 0 && canEdit && (
            <button
              onClick={addColor}
              className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors col-span-full"
            >
              <Plus className="h-8 w-8" />
              <span className="text-sm font-medium">Add your first color</span>
            </button>
          )}
        </div>

        {/* OKLCH Accessibility Report Panel */}
        {colors.length >= 2 && (
          <div className="space-y-3">
            <ColorStrategyPanel colors={colors} />
            <ColorAccessibilityPanel colors={colors} />
          </div>
        )}
      </div>

      {/* Color Combinations A/B Testing */}
      {onColorCombinationsChange && (
        <div className="space-y-6 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-accent" />
                <h2 className="text-2xl font-serif font-semibold text-foreground">Color Combinations</h2>
              </div>
              <p className="text-muted-foreground mt-1">A/B test and approve color combinations for your brand</p>
            </div>
            <Button onClick={addCombination} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Combination
            </Button>
          </div>

          {/* Testing Combinations */}
          {testingCombinations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Testing ({testingCombinations.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {testingCombinations.map((combo) => (
                  <CombinationCard
                    key={combo.id}
                    combination={combo}
                    isEditing={editingCombinationId === combo.id}
                    onEdit={() => setEditingCombinationId(combo.id)}
                    onDoneEditing={() => setEditingCombinationId(null)}
                    onUpdate={(updates) => updateCombination(combo.id, updates)}
                    onDelete={() => deleteCombination(combo.id)}
                    onApprove={() => setStatus(combo.id, 'approved')}
                    onReject={() => setStatus(combo.id, 'rejected')}
                    availableColors={colors}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Approved Combinations */}
          {approvedCombinations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Approved ({approvedCombinations.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedCombinations.map((combo) => (
                  <CombinationCard
                    key={combo.id}
                    combination={combo}
                    isEditing={editingCombinationId === combo.id}
                    onEdit={() => setEditingCombinationId(combo.id)}
                    onDoneEditing={() => setEditingCombinationId(null)}
                    onUpdate={(updates) => updateCombination(combo.id, updates)}
                    onDelete={() => deleteCombination(combo.id)}
                    onApprove={() => setStatus(combo.id, 'approved')}
                    onReject={() => setStatus(combo.id, 'rejected')}
                    availableColors={colors}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Combinations */}
          {rejectedCombinations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                <ThumbsDown className="h-4 w-4" />
                Rejected ({rejectedCombinations.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rejectedCombinations.map((combo) => (
                  <CombinationCard
                    key={combo.id}
                    combination={combo}
                    isEditing={editingCombinationId === combo.id}
                    onEdit={() => setEditingCombinationId(combo.id)}
                    onDoneEditing={() => setEditingCombinationId(null)}
                    onUpdate={(updates) => updateCombination(combo.id, updates)}
                    onDelete={() => deleteCombination(combo.id)}
                    onApprove={() => setStatus(combo.id, 'approved')}
                    onReject={() => setStatus(combo.id, 'rejected')}
                    availableColors={colors}
                  />
                ))}
              </div>
            </div>
          )}

          {colorCombinations.length === 0 && (
            <button
              onClick={addCombination}
              className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <FlaskConical className="h-8 w-8" />
              <span className="text-sm font-medium">Create your first color combination to test</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};

interface ColorCodeItemProps {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
  className?: string;
}

const ColorCodeItem = ({ label, value, onCopy, isCopied, className }: ColorCodeItemProps) => (
  <button
    onClick={onCopy}
    className={cn(
      "flex items-center justify-between p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors text-left group/item",
      className
    )}
  >
    <div className="min-w-0 flex-1">
      <span className="font-semibold text-foreground block">{label}</span>
      <span className="font-mono text-muted-foreground truncate block text-[10px]">{value}</span>
    </div>
    <div className="shrink-0 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
      {isCopied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </div>
  </button>
);

interface CombinationCardProps {
  combination: ColorCombination;
  isEditing: boolean;
  onEdit: () => void;
  onDoneEditing: () => void;
  onUpdate: (updates: Partial<ColorCombination>) => void;
  onDelete: () => void;
  onApprove: () => void;
  onReject: () => void;
  availableColors: BrandColor[];
}

const CombinationCard = ({
  combination,
  isEditing,
  onEdit,
  onDoneEditing,
  onUpdate,
  onDelete,
  onApprove,
  onReject,
  availableColors
}: CombinationCardProps) => {
  const statusStyles = {
    approved: 'ring-2 ring-green-500/50 bg-green-50/50 dark:bg-green-900/20',
    rejected: 'ring-2 ring-red-500/50 bg-red-50/50 dark:bg-red-900/20 opacity-60',
    testing: 'ring-1 ring-border',
  };

  const addColorToCombination = () => {
    if (combination.colors.length >= 6) return;
    const unusedColor = availableColors.find(c => !combination.colors.includes(c.hex));
    if (unusedColor) {
      onUpdate({ colors: [...combination.colors, unusedColor.hex] });
    } else {
      onUpdate({ colors: [...combination.colors, '#6B7280'] });
    }
  };

  const removeColorFromCombination = (index: number) => {
    if (combination.colors.length <= 2) return;
    onUpdate({ colors: combination.colors.filter((_, i) => i !== index) });
  };

  const updateColorInCombination = (index: number, hex: string) => {
    const newColors = [...combination.colors];
    newColors[index] = hex;
    onUpdate({ colors: newColors });
  };

  return (
    <div className={cn(
      "group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border",
      statusStyles[combination.status]
    )}>
      {/* Color preview bar */}
      <div className="h-16 flex">
        {combination.colors.map((hex, index) => (
          <div
            key={index}
            className="flex-1 relative group/color"
            style={{ backgroundColor: hex }}
          >
            {isEditing && (
              <button
                onClick={() => removeColorFromCombination(index)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 opacity-0 group-hover/color:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 space-y-2">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={combination.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-8 text-sm"
              placeholder="Combination name"
            />
            <div className="flex flex-wrap gap-1">
              {combination.colors.map((hex, index) => (
                <Input
                  key={index}
                  type="color"
                  value={hex}
                  onChange={(e) => updateColorInCombination(index, e.target.value)}
                  className="h-8 w-10 p-0.5 cursor-pointer"
                />
              ))}
              {combination.colors.length < 6 && (
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={addColorToCombination}>
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Input
              value={combination.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              className="h-8 text-sm"
              placeholder="Notes..."
            />
            <Button size="sm" variant="secondary" onClick={onDoneEditing} className="w-full h-7">
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-foreground truncate">{combination.name}</h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={onEdit}
                  className="p-1 rounded-md hover:bg-secondary transition-colors"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
            {combination.notes && (
              <p className="text-xs text-muted-foreground truncate">{combination.notes}</p>
            )}
            <div className="flex gap-1 pt-1">
              <Button
                size="sm"
                variant={combination.status === 'approved' ? 'default' : 'outline'}
                className={cn("flex-1 h-7 text-xs gap-1", 
                  combination.status === 'approved' && "bg-green-600 hover:bg-green-700"
                )}
                onClick={onApprove}
              >
                <ThumbsUp className="h-3 w-3" />
                Approve
              </Button>
              <Button
                size="sm"
                variant={combination.status === 'rejected' ? 'destructive' : 'outline'}
                className="flex-1 h-7 text-xs gap-1"
                onClick={onReject}
              >
                <ThumbsDown className="h-3 w-3" />
                Reject
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};