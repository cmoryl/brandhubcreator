-- Create research_briefings table for storing AI-generated research insights
CREATE TABLE public.research_briefings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Briefing metadata
  briefing_type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'deep-dive', 'alert'
  title TEXT NOT NULL,
  summary TEXT,
  
  -- Research sections (JSONB for flexibility)
  market_intelligence JSONB DEFAULT '{}',
  competitive_insights JSONB DEFAULT '{}',
  trend_analysis JSONB DEFAULT '{}',
  sentiment_signals JSONB DEFAULT '{}',
  strategic_recommendations JSONB DEFAULT '[]',
  growth_opportunities JSONB DEFAULT '[]',
  risk_alerts JSONB DEFAULT '[]',
  
  -- Action items
  priority_actions JSONB DEFAULT '[]',
  suggested_updates JSONB DEFAULT '[]', -- Suggested changes to brand sections
  
  -- Scoring
  confidence_score NUMERIC DEFAULT 0,
  urgency_level TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  -- Status
  status TEXT DEFAULT 'new', -- 'new', 'read', 'actioned', 'archived'
  read_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.research_briefings ENABLE ROW LEVEL SECURITY;

-- Policies for organization members
CREATE POLICY "Organization members can view briefings"
  ON public.research_briefings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Organization members can create briefings"
  ON public.research_briefings
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "Organization members can update briefings"
  ON public.research_briefings
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Organization members can delete briefings"
  ON public.research_briefings
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Indexes for performance
CREATE INDEX idx_research_briefings_entity ON public.research_briefings(entity_id, entity_type);
CREATE INDEX idx_research_briefings_org ON public.research_briefings(organization_id);
CREATE INDEX idx_research_briefings_status ON public.research_briefings(status, created_at DESC);
CREATE INDEX idx_research_briefings_type ON public.research_briefings(briefing_type);

-- Trigger for updated_at
CREATE TRIGGER update_research_briefings_updated_at
  BEFORE UPDATE ON public.research_briefings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();