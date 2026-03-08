
-- Add variant_label column to booth_3d_mappings
ALTER TABLE public.booth_3d_mappings 
ADD COLUMN IF NOT EXISTS variant_label text NOT NULL DEFAULT 'default';

-- Drop old unique constraint on division_id alone
ALTER TABLE public.booth_3d_mappings 
DROP CONSTRAINT IF EXISTS booth_3d_mappings_division_id_key;

-- Create new unique constraint on (division_id, variant_label)
ALTER TABLE public.booth_3d_mappings 
ADD CONSTRAINT booth_3d_mappings_division_variant_key UNIQUE (division_id, variant_label);
