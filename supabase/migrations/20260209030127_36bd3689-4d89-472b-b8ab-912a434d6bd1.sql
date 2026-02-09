-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can update jobs" ON public.brand_intelligence_jobs;

-- Service role bypasses RLS by default, no explicit policy needed
-- But add a policy for users to update their own pending/failed jobs (retry)
CREATE POLICY "Users can update their own failed jobs"
ON public.brand_intelligence_jobs
FOR UPDATE
USING (auth.uid() = user_id AND status IN ('pending', 'failed'));