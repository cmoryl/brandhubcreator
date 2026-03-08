/**
 * BoothSystemPicker — Toolbar dropdown in the 3D Mapper to load/save from booth system library.
 * Allows loading a system variant snapshot into the current mapper and saving back.
 */
import { useState, useCallback } from 'react';
import {
  BookTemplate, ChevronDown, Download, Upload, Loader2, Check, Box, Layers, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { BoothSystem, BoothSystemVariant } from '@/hooks/useBoothSystems';

interface BoothSystemPickerProps {
  systems: BoothSystem[];
  isLoading: boolean;
  isAdmin: boolean;
  activeVariantId: string | null;
  onLoadVariant: (variant: BoothSystemVariant) => void;
  onSaveToVariant: (variantId: string) => void;
}

function VariantTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'island': return <Box className="h-3 w-3" />;
    case 'l-shape': return <Layers className="h-3 w-3" />;
    default: return <Building2 className="h-3 w-3" />;
  }
}

export function BoothSystemPicker({
  systems, isLoading, isAdmin, activeVariantId,
  onLoadVariant, onSaveToVariant,
}: BoothSystemPickerProps) {
  const [open, setOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const activeVariant = systems
    .flatMap(s => s.variants)
    .find(v => v.id === activeVariantId);

  const handleSave = useCallback(async (variantId: string) => {
    setSavingId(variantId);
    await onSaveToVariant(variantId);
    setSavingId(null);
  }, [onSaveToVariant]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={activeVariantId ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-7 text-[11px] gap-1.5 px-2.5',
            activeVariantId && 'bg-accent text-accent-foreground hover:bg-accent/80'
          )}
        >
          <BookTemplate className="h-3 w-3" />
          {activeVariant ? (
            <span className="max-w-[90px] truncate">{activeVariant.variantName}</span>
          ) : (
            <span>Systems</span>
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="px-3 py-2 border-b">
          <p className="text-xs font-semibold">Booth System Library</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Load a master template or save current design back
          </p>
        </div>

        <ScrollArea className="max-h-[380px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : systems.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground">
                No booth systems created yet. Visit the Booth System Library to create one.
              </p>
            </div>
          ) : (
            <div className="p-1.5 space-y-2">
              {systems.map((system) => (
                <div key={system.id}>
                  <p className="px-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider py-1">
                    {system.name}
                  </p>
                  <div className="space-y-0.5">
                    {system.variants.map((variant) => {
                      const isActive = activeVariantId === variant.id;
                      const hasSnapshot = Object.keys(variant.snapshotData).length > 0;

                      return (
                        <div
                          key={variant.id}
                          className={cn(
                            'flex items-center gap-2 px-2 py-2 rounded-md transition-colors group',
                            isActive ? 'bg-primary/10' : 'hover:bg-muted/50'
                          )}
                        >
                          {/* Load button */}
                          <button
                            onClick={() => { onLoadVariant(variant); setOpen(false); }}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left"
                            disabled={!hasSnapshot}
                          >
                            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <VariantTypeIcon type={variant.variantType} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-[11px] font-medium truncate',
                                isActive && 'text-primary',
                                !hasSnapshot && 'text-muted-foreground'
                              )}>
                                {variant.variantName}
                              </p>
                              <div className="flex items-center gap-1">
                                {variant.dimensions && (
                                  <span className="text-[9px] text-muted-foreground">{variant.dimensions}</span>
                                )}
                                {!hasSnapshot && (
                                  <span className="text-[9px] text-muted-foreground italic">No snapshot</span>
                                )}
                              </div>
                            </div>
                            {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </button>

                          {/* Save to this variant */}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-[9px] gap-0.5 opacity-0 group-hover:opacity-100 shrink-0"
                              onClick={(e) => { e.stopPropagation(); handleSave(variant.id); }}
                              disabled={savingId === variant.id}
                            >
                              {savingId === variant.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <><Upload className="h-3 w-3" /> Save</>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="my-1" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
