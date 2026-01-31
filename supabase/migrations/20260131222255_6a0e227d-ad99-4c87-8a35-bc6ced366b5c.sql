-- Add columns for enhanced learning capabilities
ALTER TABLE public.brand_intelligence 
ADD COLUMN IF NOT EXISTS insight_actions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS confidence_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS semantic_hashes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS decay_config JSONB DEFAULT '{"halfLifeDays": 30, "minWeight": 0.1}'::jsonb;

-- Add comment explaining the new columns
COMMENT ON COLUMN public.brand_intelligence.insight_actions IS 'Tracks user actions on insights: exports, shares, references';
COMMENT ON COLUMN public.brand_intelligence.confidence_history IS 'Tracks AI confidence scores and their validation over time';
COMMENT ON COLUMN public.brand_intelligence.semantic_hashes IS 'Stores semantic fingerprints for deduplication';
COMMENT ON COLUMN public.brand_intelligence.decay_config IS 'Configuration for temporal decay weighting';