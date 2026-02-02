-- Add competitive_landscape column to brand_intelligence table
ALTER TABLE public.brand_intelligence
ADD COLUMN IF NOT EXISTS competitive_landscape jsonb DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.brand_intelligence.competitive_landscape IS 'AI-generated competitive landscape analysis including tracked competitors, positioning, gaps, and threat assessments';