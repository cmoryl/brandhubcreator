-- Add feedback tracking to brand_intelligence
ALTER TABLE public.brand_intelligence 
ADD COLUMN IF NOT EXISTS insight_feedback JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS learning_context JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS parent_entity_id UUID,
ADD COLUMN IF NOT EXISTS feedback_score NUMERIC DEFAULT 0;

-- Add index for cross-entity lookups
CREATE INDEX IF NOT EXISTS idx_brand_intelligence_parent_entity 
ON public.brand_intelligence(parent_entity_id) 
WHERE parent_entity_id IS NOT NULL;

-- Add index for entity type lookups
CREATE INDEX IF NOT EXISTS idx_brand_intelligence_entity_type 
ON public.brand_intelligence(entity_type);

-- Create function to calculate feedback score from insight_feedback array
CREATE OR REPLACE FUNCTION public.calculate_feedback_score()
RETURNS TRIGGER AS $$
DECLARE
  positive_count INTEGER;
  negative_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE (elem->>'status')::text = 'approved'),
    COUNT(*) FILTER (WHERE (elem->>'status')::text = 'rejected'),
    COUNT(*)
  INTO positive_count, negative_count, total_count
  FROM jsonb_array_elements(COALESCE(NEW.insight_feedback, '[]'::jsonb)) AS elem;
  
  IF total_count > 0 THEN
    NEW.feedback_score := (positive_count::numeric - negative_count::numeric) / total_count::numeric * 100;
  ELSE
    NEW.feedback_score := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-calculate feedback score
DROP TRIGGER IF EXISTS update_feedback_score ON public.brand_intelligence;
CREATE TRIGGER update_feedback_score
BEFORE INSERT OR UPDATE OF insight_feedback ON public.brand_intelligence
FOR EACH ROW
EXECUTE FUNCTION public.calculate_feedback_score();

-- Add comment for documentation
COMMENT ON COLUMN public.brand_intelligence.insight_feedback IS 'Array of {id, status: approved|rejected|corrected, correction_text, user_id, timestamp}';
COMMENT ON COLUMN public.brand_intelligence.learning_context IS 'Accumulated learning data from feedback for AI context';
COMMENT ON COLUMN public.brand_intelligence.parent_entity_id IS 'Link to parent brand for cross-entity learning';