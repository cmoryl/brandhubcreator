
-- ============================================================
-- Bias Awareness & Inclusion System
-- Stores audit results, inclusive language checks, and scores
-- ============================================================

-- Create the bias awareness scans table
CREATE TABLE public.bias_awareness_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand' CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_name TEXT NOT NULL,
  
  -- Overall composite score (0-100)
  inclusion_score NUMERIC(5,2) DEFAULT 0,
  
  -- Dimension scores (0-100 each)
  language_score NUMERIC(5,2) DEFAULT 0,
  visual_score NUMERIC(5,2) DEFAULT 0,
  accessibility_score NUMERIC(5,2) DEFAULT 0,
  ai_governance_score NUMERIC(5,2) DEFAULT 0,
  
  -- Detailed findings
  findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Dimension breakdowns
  language_analysis JSONB DEFAULT '{}'::jsonb,
  visual_analysis JSONB DEFAULT '{}'::jsonb,
  accessibility_analysis JSONB DEFAULT '{}'::jsonb,
  ai_governance_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- Persona spectrum coverage
  persona_coverage JSONB DEFAULT '{}'::jsonb,
  
  -- WCAG compliance details
  wcag_compliance JSONB DEFAULT '{}'::jsonb,
  
  -- Inclusive language audit results
  language_audit JSONB DEFAULT '{}'::jsonb,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bias_awareness_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view bias scans for their org"
  ON public.bias_awareness_scans
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bias scans for their org"
  ON public.bias_awareness_scans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update bias scans for their org"
  ON public.bias_awareness_scans
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
    )
  );

-- Service role can manage all (for edge functions)
CREATE POLICY "Service role full access to bias scans"
  ON public.bias_awareness_scans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_bias_scans_entity ON public.bias_awareness_scans(entity_id, entity_type);
CREATE INDEX idx_bias_scans_org ON public.bias_awareness_scans(organization_id);

-- Add bias_awareness field to oracle_intelligence for cross-system integration
ALTER TABLE public.oracle_intelligence 
  ADD COLUMN IF NOT EXISTS bias_awareness_insights JSONB DEFAULT '{}'::jsonb;

-- Add bias_awareness field to brand_intelligence for entity-level integration
ALTER TABLE public.brand_intelligence
  ADD COLUMN IF NOT EXISTS bias_awareness_profile JSONB DEFAULT '{}'::jsonb;
