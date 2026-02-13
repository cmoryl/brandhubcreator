
-- Add category column to oracle_knowledge_base for organized knowledge library
ALTER TABLE public.oracle_knowledge_base 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Add index on category for filtering
CREATE INDEX IF NOT EXISTS idx_oracle_knowledge_category 
ON public.oracle_knowledge_base(organization_id, category);

-- Add index on source_type for filtering auto-fed vs manual entries
CREATE INDEX IF NOT EXISTS idx_oracle_knowledge_source 
ON public.oracle_knowledge_base(organization_id, source_type);
