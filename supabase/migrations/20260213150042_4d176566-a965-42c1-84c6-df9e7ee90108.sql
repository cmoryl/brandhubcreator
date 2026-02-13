
-- Fix overly permissive INSERT policy on lead_submissions
-- Replace WITH CHECK (true) with a more specific check
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.lead_submissions;

CREATE POLICY "Anyone can submit leads"
ON public.lead_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL AND email != '' AND
  name IS NOT NULL AND name != ''
);
