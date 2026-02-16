
-- Add variant_label to all booth tables that don't have it yet
ALTER TABLE public.booth_services ADD COLUMN variant_label TEXT DEFAULT NULL;
ALTER TABLE public.booth_production_specs ADD COLUMN variant_label TEXT DEFAULT NULL;
ALTER TABLE public.booth_color_palettes ADD COLUMN variant_label TEXT DEFAULT NULL;
ALTER TABLE public.booth_qr_codes ADD COLUMN variant_label TEXT DEFAULT NULL;
ALTER TABLE public.booth_key_stats ADD COLUMN variant_label TEXT DEFAULT NULL;
ALTER TABLE public.booth_download_links ADD COLUMN variant_label TEXT DEFAULT NULL;
ALTER TABLE public.booth_gallery_photos ADD COLUMN variant_label TEXT DEFAULT NULL;

-- Add indexes for efficient variant filtering
CREATE INDEX idx_booth_services_variant ON public.booth_services (division_id, variant_label);
CREATE INDEX idx_booth_production_specs_variant ON public.booth_production_specs (division_id, variant_label);
CREATE INDEX idx_booth_color_palettes_variant ON public.booth_color_palettes (division_id, variant_label);
CREATE INDEX idx_booth_qr_codes_variant ON public.booth_qr_codes (division_id, variant_label);
CREATE INDEX idx_booth_key_stats_variant ON public.booth_key_stats (division_id, variant_label);
CREATE INDEX idx_booth_download_links_variant ON public.booth_download_links (division_id, variant_label);
CREATE INDEX idx_booth_gallery_photos_variant ON public.booth_gallery_photos (division_id, variant_label);
