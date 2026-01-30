-- Add product_suite to the allowed universe_type values
-- We'll use a text column without constraint to allow flexibility
-- Also add a backup_type column to distinguish universe backups from full suite backups

ALTER TABLE public.universe_backups 
ADD COLUMN IF NOT EXISTS backup_type TEXT NOT NULL DEFAULT 'universe' 
CHECK (backup_type IN ('universe', 'product_suite'));

-- Add a reference to the specific product being backed up (optional, for product suite backups)
ALTER TABLE public.universe_backups
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Add index for faster lookups by backup_type
CREATE INDEX IF NOT EXISTS idx_universe_backups_type ON public.universe_backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_universe_backups_product ON public.universe_backups(product_id);

-- Update RLS to ensure admins can manage all backup types
-- (existing policies should already cover this based on organization_id)