/**
 * DivisionBrandSwitcher — Toolbar dropdown for instant brand swapping in the 3D Booth Mapper.
 * Shows org brands + custom presets with color swatches for quick identification.
 */
import { useState } from 'react';
import {
  Building2, ChevronDown, Plus, Trash2, Save, X, Check,
  Palette, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DivisionBrandingState } from './useDivisionBranding';

interface DivisionBrandSwitcherProps {
  branding: DivisionBrandingState;
  isAdmin: boolean;
}

function ColorDots({ colors }: { colors: (string | null)[] }) {
  const validColors = colors.filter(Boolean) as string[];
  if (validColors.length === 0) return null;
  return (
    <div className="flex gap-0.5">
      {validColors.slice(0, 3).map((c, i) => (
        <div
          key={i}
          className="h-3 w-3 rounded-full border border-border/50"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

export function DivisionBrandSwitcher({ branding, isAdmin }: DivisionBrandSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const {
    presets, orgBrands, activePresetId, isLoading,
    applyPreset, clearBranding, createPresetFromBrand,
    saveCurrentAsPreset, deletePreset, activeBrand,
  } = branding;

  // Org brands not yet added as presets
  const availableBrands = orgBrands.filter(
    b => !presets.some(p => p.brandId === b.id)
  );

  const handleSaveCurrent = async () => {
    if (!saveName.trim()) return;
    await saveCurrentAsPreset(saveName.trim());
    setSaveName('');
    setShowSaveInput(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={activePresetId ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-7 text-[11px] gap-1.5 px-2.5',
            activePresetId && 'bg-primary/90 hover:bg-primary'
          )}
        >
          <Building2 className="h-3 w-3" />
          {activeBrand ? (
            <span className="max-w-[100px] truncate">{activeBrand.presetName}</span>
          ) : (
            <span>Brand Mode</span>
          )}
          {activeBrand && (
            <ColorDots colors={[activeBrand.primaryColor, activeBrand.secondaryColor, activeBrand.accentColor]} />
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="px-3 py-2 border-b">
          <p className="text-xs font-semibold">Division Brand Mode</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Switch all booth graphics, colors & messaging instantly
          </p>
        </div>

        <ScrollArea className="max-h-[340px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {/* Default (no brand) */}
              <button
                onClick={() => { clearBranding(); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors',
                  !activePresetId
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/50 text-foreground'
                )}
              >
                <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium">Default</p>
                  <p className="text-[9px] text-muted-foreground">Original booth configuration</p>
                </div>
                {!activePresetId && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>

              {presets.length > 0 && (
                <>
                  <Separator className="my-1" />
                  <p className="px-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-1">
                    Saved Presets
                  </p>
                </>
              )}

              {/* Custom presets */}
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={cn(
                    'flex items-center gap-2 px-2 py-2 rounded-md transition-colors group',
                    activePresetId === preset.id
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <button
                    onClick={() => { applyPreset(preset.id); setOpen(false); }}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    {/* Color swatch */}
                    <div className="h-7 w-7 rounded-md border border-border/50 overflow-hidden shrink-0 flex flex-col">
                      {preset.primaryColor ? (
                        <>
                          <div className="flex-1" style={{ backgroundColor: preset.primaryColor }} />
                          {preset.secondaryColor && (
                            <div className="h-1.5" style={{ backgroundColor: preset.secondaryColor }} />
                          )}
                        </>
                      ) : (
                        <div className="flex-1 bg-muted flex items-center justify-center">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[11px] font-medium truncate',
                        activePresetId === preset.id && 'text-primary'
                      )}>
                        {preset.presetName}
                      </p>
                      {preset.tagline && (
                        <p className="text-[9px] text-muted-foreground truncate">{preset.tagline}</p>
                      )}
                    </div>
                    {activePresetId === preset.id && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Add from org brands */}
              {isAdmin && availableBrands.length > 0 && (
                <>
                  <Separator className="my-1" />
                  {showAddBrand ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between px-2 py-1">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Add from Organization
                        </p>
                        <Button
                          variant="ghost" size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => setShowAddBrand(false)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {availableBrands.map((brand) => (
                        <button
                          key={brand.id}
                          onClick={async () => {
                            await createPresetFromBrand(brand.id);
                            setShowAddBrand(false);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 text-left"
                        >
                          <ColorDots colors={[brand.primaryColor, brand.secondaryColor, brand.accentColor]} />
                          <span className="text-[11px] font-medium truncate">{brand.name}</span>
                          <Plus className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-[10px] gap-1 justify-start text-muted-foreground"
                      onClick={() => setShowAddBrand(true)}
                    >
                      <Plus className="h-3 w-3" /> Add brand from organization
                    </Button>
                  )}
                </>
              )}

              {/* Save current as preset */}
              {isAdmin && (
                <>
                  <Separator className="my-1" />
                  {showSaveInput ? (
                    <div className="flex items-center gap-1 px-1">
                      <Input
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder="Preset name…"
                        className="h-7 text-[11px] flex-1"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCurrent(); }}
                      />
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleSaveCurrent}
                        disabled={!saveName.trim()}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => { setShowSaveInput(false); setSaveName(''); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-[10px] gap-1 justify-start text-muted-foreground"
                      onClick={() => setShowSaveInput(true)}
                    >
                      <Save className="h-3 w-3" /> Save current as preset
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
