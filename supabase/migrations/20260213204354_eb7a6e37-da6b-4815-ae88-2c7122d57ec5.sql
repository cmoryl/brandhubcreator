
-- =====================================================
-- MASTER ORACLE BRAIN - Organization-Level Intelligence
-- =====================================================

-- 1. Oracle Knowledge Base: Org-wide knowledge entries
CREATE TABLE public.oracle_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text', -- text, pdf_extract, report, market_data, strategic_note
  source_type TEXT NOT NULL DEFAULT 'manual', -- manual, ai_synthesized, imported, entity_rollup
  source_entity_id UUID, -- optional link to brand/product/event that generated this
  source_entity_type TEXT, -- brand, product, event
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  embedding_hash TEXT, -- for deduplication
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Oracle Intelligence: Synthesized org-level intelligence (one per org)
CREATE TABLE public.oracle_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Strategic synthesis
  org_summary TEXT,
  portfolio_analysis JSONB DEFAULT '{}', -- brand portfolio gaps, overlaps, synergies
  market_landscape JSONB DEFAULT '{}', -- aggregated market position across all entities
  strategic_recommendations JSONB DEFAULT '[]', -- org-wide strategic recs
  cross_entity_patterns JSONB DEFAULT '{}', -- patterns found across brands/products/events
  
  -- Aggregated intelligence
  unified_voice_profile JSONB DEFAULT '{}', -- synthesized org voice
  unified_audience_map JSONB DEFAULT '{}', -- combined audience segments
  competitive_overview JSONB DEFAULT '{}', -- org-level competitive landscape
  cultural_readiness JSONB DEFAULT '{}', -- org-wide cultural readiness
  
  -- Knowledge stats
  knowledge_entry_count INTEGER NOT NULL DEFAULT 0,
  entity_brain_count INTEGER NOT NULL DEFAULT 0,
  last_synthesis_at TIMESTAMPTZ,
  synthesis_count INTEGER NOT NULL DEFAULT 0,
  
  -- Learning
  confidence_scores JSONB DEFAULT '{}',
  synthesis_history JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Oracle Jobs: Track synthesis jobs
CREATE TABLE public.oracle_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'synthesis', -- synthesis, knowledge_import, entity_rollup
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  progress INTEGER DEFAULT 0,
  result JSONB,
  error_message TEXT,
  triggered_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.oracle_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: oracle_knowledge_base
CREATE POLICY "Users can view oracle knowledge for their org"
  ON public.oracle_knowledge_base FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage oracle knowledge"
  ON public.oracle_knowledge_base FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- RLS Policies: oracle_intelligence
CREATE POLICY "Users can view oracle intelligence for their org"
  ON public.oracle_intelligence FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage oracle intelligence"
  ON public.oracle_intelligence FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- RLS Policies: oracle_jobs
CREATE POLICY "Users can view oracle jobs for their org"
  ON public.oracle_jobs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage oracle jobs"
  ON public.oracle_jobs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Indexes
CREATE INDEX idx_oracle_kb_org ON public.oracle_knowledge_base(organization_id);
CREATE INDEX idx_oracle_kb_source ON public.oracle_knowledge_base(source_entity_id, source_entity_type);
CREATE INDEX idx_oracle_kb_tags ON public.oracle_knowledge_base USING GIN(tags);
CREATE INDEX idx_oracle_intel_org ON public.oracle_intelligence(organization_id);
CREATE INDEX idx_oracle_jobs_org_status ON public.oracle_jobs(organization_id, status);

-- Updated_at triggers
CREATE TRIGGER update_oracle_knowledge_base_updated_at
  BEFORE UPDATE ON public.oracle_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oracle_intelligence_updated_at
  BEFORE UPDATE ON public.oracle_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oracle_jobs_updated_at
  BEFORE UPDATE ON public.oracle_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
