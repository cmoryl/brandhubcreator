-- Add cultural intelligence fields to brand_intelligence table
ALTER TABLE public.brand_intelligence
ADD COLUMN IF NOT EXISTS cultural_insights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS globallink_recommendations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS regional_adaptations JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS localization_readiness_score INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.brand_intelligence.cultural_insights IS 'AI-generated cultural awareness data including regional considerations, design adaptations, and messaging localization hints';
COMMENT ON COLUMN public.brand_intelligence.globallink_recommendations IS 'Recommended GlobalLink suite features based on brand analysis';
COMMENT ON COLUMN public.brand_intelligence.regional_adaptations IS 'Suggested regional/country-specific brand adaptations';
COMMENT ON COLUMN public.brand_intelligence.localization_readiness_score IS 'Score from 0-100 indicating brand readiness for global localization';