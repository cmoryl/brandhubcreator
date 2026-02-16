-- Drop the unique constraint on division_id alone so each variant can have its own palette
ALTER TABLE public.booth_color_palettes DROP CONSTRAINT IF EXISTS booth_color_palettes_division_id_key;

-- Add a unique constraint on (division_id, variant_label) instead
CREATE UNIQUE INDEX idx_booth_color_palettes_div_variant ON public.booth_color_palettes (division_id, COALESCE(variant_label, '__null__'));