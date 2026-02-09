-- Fix the overly permissive INSERT policy
DROP POLICY IF EXISTS "Organization members can create briefings" ON public.research_briefings;

CREATE POLICY "Organization members can create briefings"
  ON public.research_briefings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
      OR (organization_id IS NULL AND created_by = auth.uid())
    )
  );