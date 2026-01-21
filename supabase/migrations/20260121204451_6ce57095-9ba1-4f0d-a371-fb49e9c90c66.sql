
-- Create brand_intelligence table for storing evolving knowledge
CREATE TABLE public.brand_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product')),
  entity_id UUID NOT NULL,
  
  -- Core knowledge storage
  knowledge_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{ "type": "insight", "content": "...", "source": "manual|ai", "created_at": "..." }]
  
  -- AI-generated summaries
  brand_summary TEXT,
  market_position TEXT,
  target_audience JSONB,
  competitive_advantages JSONB DEFAULT '[]'::jsonb,
  brand_voice_profile JSONB,
  growth_recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Learning and evolution tracking
  analysis_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  analysis_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Ensure one intelligence record per entity
  UNIQUE (entity_type, entity_id)
);

-- Enable RLS
ALTER TABLE public.brand_intelligence ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_brand_intelligence_entity ON public.brand_intelligence(entity_type, entity_id);
CREATE INDEX idx_brand_intelligence_org ON public.brand_intelligence(organization_id);

-- RLS Policies
CREATE POLICY "Users can view intelligence for their org brands"
  ON public.brand_intelligence FOR SELECT
  USING (
    organization_id IS NULL 
    OR is_org_member(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create intelligence for their org brands"
  ON public.brand_intelligence FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      organization_id IS NULL
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = brand_intelligence.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );

CREATE POLICY "Users can update intelligence for their org brands"
  ON public.brand_intelligence FOR UPDATE
  USING (
    organization_id IS NULL
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = brand_intelligence.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Org admins can delete intelligence"
  ON public.brand_intelligence FOR DELETE
  USING (
    is_org_admin(auth.uid(), organization_id)
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Deny anonymous access to brand_intelligence"
  ON public.brand_intelligence FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Trigger for updated_at
CREATE TRIGGER update_brand_intelligence_updated_at
  BEFORE UPDATE ON public.brand_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
