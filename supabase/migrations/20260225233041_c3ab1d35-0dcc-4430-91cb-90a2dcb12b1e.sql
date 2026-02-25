
-- Add enrichment columns to portfolio_relationships
ALTER TABLE public.portfolio_relationships
  ADD COLUMN IF NOT EXISTS anomaly_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS anomaly_score numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rationale text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dimensions jsonb DEFAULT '{}'::jsonb;

-- Add a portfolio coherence summary table for org-level scores
CREATE TABLE IF NOT EXISTS public.portfolio_coherence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  overall_score numeric DEFAULT 0,
  voice_coherence numeric DEFAULT 0,
  visual_coherence numeric DEFAULT 0,
  audience_coherence numeric DEFAULT 0,
  strategic_coherence numeric DEFAULT 0,
  anomaly_count integer DEFAULT 0,
  anomalies jsonb DEFAULT '[]'::jsonb,
  insights jsonb DEFAULT '[]'::jsonb,
  entity_count integer DEFAULT 0,
  relationship_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.portfolio_coherence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view coherence" ON public.portfolio_coherence
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = portfolio_coherence.organization_id AND om.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Org admins can manage coherence" ON public.portfolio_coherence
  FOR ALL USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_super_admin(auth.uid())
  );

CREATE TRIGGER update_portfolio_coherence_updated_at
  BEFORE UPDATE ON public.portfolio_coherence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
