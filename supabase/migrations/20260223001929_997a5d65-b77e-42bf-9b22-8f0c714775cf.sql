
-- Add SACM module column for Sentiment Analysis & Computational Color Modeling
ALTER TABLE public.bias_awareness_scans
ADD COLUMN IF NOT EXISTS sacm_module jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bias_awareness_scans.sacm_module IS 'Sentiment Analysis & Computational Color Modeling (SACM) results: sentiment-color alignment, color-emotion mapping, brand consistency scores';
