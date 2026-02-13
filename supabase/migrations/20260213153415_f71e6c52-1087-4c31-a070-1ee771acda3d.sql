
-- Remove public SELECT from brand_intelligence (competitive data should not be publicly visible)
DROP POLICY IF EXISTS "Public can view intelligence for public entities" ON public.brand_intelligence;

-- Remove public SELECT from competitive_analysis_reports (strategic data should not be public)
DROP POLICY IF EXISTS "Public can view reports for public entities" ON public.competitive_analysis_reports;
