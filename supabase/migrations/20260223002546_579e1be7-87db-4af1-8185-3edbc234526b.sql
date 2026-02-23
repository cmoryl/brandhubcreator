-- Add curb_cut_module column for Curb-Cut Effect analysis (plain language, multi-modal, alt-text, reading level)
ALTER TABLE public.bias_awareness_scans
ADD COLUMN IF NOT EXISTS curb_cut_module jsonb DEFAULT NULL;

COMMENT ON COLUMN public.bias_awareness_scans.curb_cut_module IS 'Curb-Cut Effect analysis: plain language readability, multi-modal content delivery, alt-text quality, and universal design benefits';