import { useState } from 'react';
import { Box, ImageOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Booth3DEmbed } from '@/components/brand/Booth3DEmbed';
import { useBoothImages } from '@/hooks/useBoothImages';
import type { BoothDivision } from '@/pages/BoothsCatalog';

interface BoothVariantPickerDialogProps {
  division: BoothDivision | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Two-step booth viewer:
 * 1. Show variant grid (sub-booth cards) for the chosen division
 * 2. On variant select, open the 3D booth presentation for that variant
 */
export const BoothVariantPickerDialog = ({ division, open, onOpenChange }: BoothVariantPickerDialogProps) => {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [threeDOpen, setThreeDOpen] = useState(false);

  const { getMergedVariants } = useBoothImages(division?.id || '');
  const mergedVariants = division ? getMergedVariants(division.variants) : [];

  const handleSelectVariant = (label: string) => {
    setSelectedVariant(label);
    // Close the picker entirely before opening the 3D modal so it doesn't linger underneath
    onOpenChange(false);
    // Defer slightly to allow the picker's exit animation to complete cleanly
    setTimeout(() => setThreeDOpen(true), 150);
  };

  const handleClosePicker = (next: boolean) => {
    if (!next) {
      setSelectedVariant(null);
    }
    onOpenChange(next);
  };

  if (!division) return null;

  const Icon = division.icon;

  return (
    <>
      {/* Step 1 — Variant picker */}
      <Dialog open={open && !threeDOpen} onOpenChange={handleClosePicker}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[88vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                style={{ backgroundColor: division.color }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <DialogTitle className="text-xl font-semibold text-foreground truncate">
                  {division.name} — Booth Variants
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Select a variant to launch its 3D booth presentation
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6">
            {mergedVariants.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                <ImageOff className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No booth variants available for this division yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {mergedVariants.map((variant, idx) => (
                  <motion.button
                    key={`${variant.label}-${idx}`}
                    onClick={() => handleSelectVariant(variant.label)}
                    className="group relative overflow-hidden rounded-xl border border-border/60 bg-card text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all hover:border-primary/40 hover:shadow-xl"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                      {variant.image ? (
                        <img
                          src={variant.image}
                          alt={variant.label}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageOff className="h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-background/95 backdrop-blur-sm border border-border shadow-lg">
                          <Box className="h-4 w-4" style={{ color: division.color }} />
                          <span className="text-xs font-medium text-foreground">View 3D Booth</span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-xs border-none"
                      >
                        Variant {idx + 1}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-foreground truncate">{variant.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to open the immersive 3D presentation
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Step 2 — 3D Booth presentation (fullscreen) */}
      <Booth3DEmbed
        divisionId={division.id}
        divisionName={`${division.name}${selectedVariant ? ` — ${selectedVariant}` : ''}`}
        color={division.color}
        variantLabel={selectedVariant ?? undefined}
        inline={false}
        hideTriggers
        open={threeDOpen}
        onOpenChange={(next) => {
          setThreeDOpen(next);
          if (!next) {
            // Return to picker after closing 3D
            setSelectedVariant(null);
          }
        }}
      />
    </>
  );
};
